from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.students.models import Student
from apps.workouts.models import Exercise, WorkoutPlan


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
