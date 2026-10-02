from datetime import timedelta
from uuid import uuid4
from unittest.mock import patch

from django.utils import timezone
from rest_framework.test import APITestCase

from apps.academy.models import Academy
from apps.students.models import Student
from apps.users.models import User, AdministrativeAudit
from apps.workouts.models import Exercise, WorkoutExercise, WorkoutPlan, WorkoutSession


class StudentWorkoutTests(APITestCase):
    def setUp(self):
        self.academy = Academy.objects.create(name="Academia")
        self.trainer = User.objects.create_user(email="trainer@workout.test", password="test")
        self.user = User.objects.create_user(email="student@workout.test", password="test", is_student_portal=True)
        self.student = Student.objects.create(name="Aluno", academy=self.academy, portal_user=self.user)
        self.workout = WorkoutPlan.objects.create(student=self.student, instructor=self.trainer, name="Treino A", objective="Força", start_date=timezone.localdate())
        self.row = WorkoutExercise.objects.create(workout=self.workout, exercise=Exercise.objects.create(name="Agachamento"), sets=3, load=20)
        self.url = f"/api/users/portal/workouts/{self.workout.id}/"
        self.payload = {"submission_id": str(uuid4()), "started_at": (timezone.now() - timedelta(minutes=15)).isoformat(), "ended_at": timezone.now().isoformat(), "exercises": [{"id": str(self.row.id), "revision": self.row.updated_at.isoformat(), "completed_sets": 3, "load": "25.00"}]}
        self.client.force_authenticate(self.user)

    def test_own_workout_and_history(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(str(response.data["exercises"][0]["id"]), str(self.row.id))
        self.assertEqual(response.data["sessions"], [])

    def test_authentication_and_student_only(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(self.url).status_code, 401)
        self.client.force_authenticate(self.trainer)
        self.assertEqual(self.client.post(self.url, self.payload, format="json").status_code, 403)

    def test_cannot_read_or_record_another_student_workout(self):
        other = User.objects.create_user(email="other@workout.test", password="test", is_student_portal=True)
        Student.objects.create(name="Outro", academy=Academy.objects.create(name="Outra academia"), portal_user=other)
        self.client.force_authenticate(other)
        self.assertEqual(self.client.get(self.url).status_code, 404)
        self.assertEqual(self.client.post(self.url, self.payload, format="json").status_code, 404)
        self.assertFalse(WorkoutSession.objects.exists())

    def test_completion_is_audited_idempotent_and_does_not_change_prescription(self):
        self.assertEqual(self.client.post(self.url, self.payload, format="json").status_code, 201)
        self.assertEqual(self.client.post(self.url, self.payload, format="json").status_code, 200)
        self.assertEqual(WorkoutSession.objects.count(), 1)
        self.row.refresh_from_db()
        self.assertEqual(self.row.load, 20)
        self.row.exercise.name = "Novo nome"
        self.row.exercise.save()
        session = self.client.get(self.url).data["sessions"][0]
        self.assertEqual(session["exercises"][0]["name"], "Agachamento")
        self.assertEqual(session["exercises"][0]["load"], "25.00")
        self.assertEqual(AdministrativeAudit.objects.filter(action="workout.student_session_completed").count(), 1)

    def test_second_submission_same_day_preserves_existing_history(self):
        self.client.post(self.url, self.payload, format="json")
        self.payload["submission_id"] = str(uuid4())
        self.payload["exercises"][0]["load"] = "40"
        self.assertEqual(self.client.post(self.url, self.payload, format="json").status_code, 409)
        self.assertEqual(WorkoutSession.objects.get().exercise_results[0]["load"], "25.00")

    def test_planned_session_is_completed_without_losing_notes(self):
        session = WorkoutSession.objects.create(workout=self.workout, scheduled_for=timezone.localdate(), recorded_by=self.trainer, notes="Orientação do professor")
        self.assertEqual(self.client.post(self.url, self.payload, format="json").status_code, 201)
        session.refresh_from_db()
        self.assertEqual(session.status, "completed")
        self.assertEqual(session.notes, "Orientação do professor")
        self.assertEqual(WorkoutSession.objects.count(), 1)

    def test_invalid_or_incomplete_payload_never_saves(self):
        variants = [
            {"exercises": []},
            {"exercises": [self.payload["exercises"][0], self.payload["exercises"][0]]},
            {"exercises": [{"id": str(uuid4()), "revision": self.row.updated_at.isoformat(), "completed_sets": 3, "load": "20"}]},
            {"exercises": [{"id": str(self.row.id), "revision": self.row.updated_at.isoformat(), "completed_sets": 2, "load": "20"}]},
            {"exercises": [{"id": str(self.row.id), "revision": self.row.updated_at.isoformat(), "completed_sets": 3, "load": "-1"}]},
            {"ended_at": (timezone.now() + timedelta(minutes=10)).isoformat()},
            {"started_at": (timezone.now() + timedelta(minutes=10)).isoformat()},
            {"started_at": (timezone.now() - timedelta(days=2)).isoformat()},
        ]
        for variant in variants:
            with self.subTest(variant=variant):
                self.assertEqual(self.client.post(self.url, {**self.payload, **variant}, format="json").status_code, 400)
        self.assertFalse(WorkoutSession.objects.exists())

    def test_first_access_and_inactive_student_are_blocked(self):
        self.user.must_change_password = True
        self.user.save()
        self.assertEqual(self.client.post(self.url, self.payload, format="json").status_code, 403)
        self.user.must_change_password = False
        self.user.save()
        self.student.active = False
        self.student.save()
        self.assertEqual(self.client.get(self.url).status_code, 403)

    def test_inactive_plan_cannot_be_completed(self):
        self.workout.status = "completed"
        self.workout.save()
        self.assertEqual(self.client.post(self.url, self.payload, format="json").status_code, 400)

    def test_audit_failure_rolls_back_completion(self):
        with patch("apps.workouts.api.student.AdministrativeAudit.objects.create", side_effect=RuntimeError("audit unavailable")):
            with self.assertRaises(RuntimeError):
                self.client.post(self.url, self.payload, format="json")
        self.assertFalse(WorkoutSession.objects.exists())

    def test_changed_prescription_rejects_stale_completion(self):
        self.row.repetitions = "15"
        self.row.save()
        self.assertEqual(self.client.post(self.url, self.payload, format="json").status_code, 400)
        self.assertFalse(WorkoutSession.objects.exists())

    def test_retry_keeps_original_end_time_and_duration(self):
        response = self.client.post(self.url, self.payload, format="json")
        recorded = WorkoutSession.objects.get()
        self.payload["ended_at"] = timezone.now().isoformat()
        retried = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(retried.data["id"], response.data["id"])
        recorded.refresh_from_db()
        self.assertEqual(recorded.duration_minutes, response.data["duration_minutes"])
