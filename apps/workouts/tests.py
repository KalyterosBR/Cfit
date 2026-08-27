from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.students.models import Student
from apps.users.models import AdministrativeAudit
from apps.workouts.models import Exercise, WorkoutExercise, WorkoutLoadRecord, WorkoutPlan, WorkoutSession, WorkoutTemplate


class WorkoutApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email="trainer@cfit.test",
            password="test-password",
        )
        self.student = Student.objects.create(
            name="Aluno Treino",
            cpf="444.444.444-44",
        )

    def test_requires_authentication(self):
        response = self.client.get(reverse("workout-plan-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_creates_and_filters_student_workout(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            reverse("workout-plan-list"),
            {
                "student": str(self.student.id),
                "name": "Treino A",
                "objective": "Condicionamento",
                "start_date": timezone.localdate(),
                "review_date": timezone.localdate() + timedelta(days=30),
                "notes": "Evolução gradual",
            },
            format="json",
        )
        listing = self.client.get(
            reverse("workout-plan-list"),
            {"student": self.student.id},
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["instructor"], self.user.id)
        self.assertEqual(listing.data["count"], 1)
        self.assertEqual(listing.data["results"][0]["student_name"], self.student.name)

    def test_preserves_only_one_active_workout_per_student(self):
        self.client.force_authenticate(self.user)
        payload = {
            "student": str(self.student.id),
            "name": "Treino",
            "objective": "Força",
            "start_date": timezone.localdate(),
        }
        first = self.client.post(reverse("workout-plan-list"), payload, format="json")
        second = self.client.post(reverse("workout-plan-list"), payload, format="json")

        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(WorkoutPlan.objects.count(), 1)

    def test_creates_library_exercise(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            reverse("exercise-list"),
            {
                "name": "Agachamento",
                "muscle_group": "Pernas",
                "instructions": "Manter a coluna neutra.",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Exercise.objects.filter(name="Agachamento").exists())

    def test_applies_reusable_template_to_workout(self):
        self.client.force_authenticate(self.user)
        exercise = Exercise.objects.create(name="Remada")
        template = WorkoutTemplate.objects.create(name="Modelo A", objective="Força")
        item = self.client.post(
            reverse("workout-template-exercise-list"),
            {"template": template.pk, "exercise": exercise.pk, "sets": 4, "repetitions": "8", "order": 1},
            format="json",
        )
        workout = WorkoutPlan.objects.create(
            student=self.student, name="Treino A", objective="Força",
            instructor=self.user, start_date=timezone.localdate(),
        )
        response = self.client.post(
            reverse("workout-plan-apply-template", args=[workout.pk]),
            {"template": template.pk}, format="json",
        )
        self.assertEqual(item.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["created"], 1)
        self.assertEqual(response.data["workout"]["exercises"][0]["sets"], 4)

    def test_sessions_calculate_adherence(self):
        self.client.force_authenticate(self.user)
        workout = WorkoutPlan.objects.create(
            student=self.student, name="Treino A", objective="Força",
            instructor=self.user, start_date=timezone.localdate(),
        )
        for offset, session_status in enumerate(["completed", "skipped"]):
            response = self.client.post(
                reverse("workout-session-list"),
                {
                    "workout": workout.pk,
                    "scheduled_for": timezone.localdate() + timedelta(days=offset),
                    "status": session_status,
                    "duration_minutes": 50 if session_status == "completed" else None,
                },
                format="json",
            )
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        detail = self.client.get(reverse("workout-plan-detail", args=[workout.pk]))
        self.assertEqual(detail.data["adherence_percentage"], 50)
        self.assertEqual(WorkoutSession.objects.count(), 2)

    def test_tracks_load_history_and_administrative_audit(self):
        self.client.force_authenticate(self.user)
        exercise = Exercise.objects.create(name="Supino")
        workout = WorkoutPlan.objects.create(
            student=self.student, name="Treino A", objective="Força",
            instructor=self.user, start_date=timezone.localdate(),
        )
        created = self.client.post(
            reverse("workout-exercise-list"),
            {"workout": workout.pk, "exercise": exercise.pk, "sets": 3, "repetitions": "10", "load": "20.00", "order": 1},
            format="json",
        )
        updated = self.client.patch(
            reverse("workout-exercise-detail", args=[created.data["id"]]),
            {"load": "25.00"},
            format="json",
        )

        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.assertEqual(updated.status_code, status.HTTP_200_OK)
        item = WorkoutExercise.objects.get(pk=created.data["id"])
        self.assertEqual(item.load_history.count(), 2)
        self.assertEqual(WorkoutLoadRecord.objects.first().notes, "Atualização da prescrição")
        self.assertTrue(AdministrativeAudit.objects.filter(action="workout.exercise_updated", entity_id=str(item.pk)).exists())

    def test_filters_workouts_by_review_window(self):
        self.client.force_authenticate(self.user)
        WorkoutPlan.objects.create(
            student=self.student, name="Treino vencido", objective="Força",
            instructor=self.user, start_date=timezone.localdate() - timedelta(days=40),
            review_date=timezone.localdate() - timedelta(days=1),
        )

        response = self.client.get(reverse("workout-plan-list"), {"review": "overdue"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["name"], "Treino vencido")
