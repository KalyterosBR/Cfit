from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone

from rest_framework import status
from rest_framework.test import APITestCase

from apps.checkins.models import CheckIn
from apps.students.models import Student


class CheckInApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email="admin@cfit.test",
            password="test-password",
        )

        self.student = Student.objects.create(
            name="Aluno Teste",
            cpf="111.111.111-11",
        )

        self.other_student = Student.objects.create(
            name="Outro Aluno",
            cpf="222.222.222-22",
        )

        self.list_url = reverse(
            "checkin-list",
        )

    def test_checkin_history_requires_authentication(self):
        response = self.client.get(
            self.list_url,
            {
                "student": self.student.id,
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_filters_student_history_from_most_recent(self):
        older = CheckIn.objects.create(
            student=self.student,
            checked_in_at=timezone.now() - timedelta(days=1),
        )

        newer = CheckIn.objects.create(
            student=self.student,
            checked_in_at=timezone.now(),
            source=CheckIn.Source.ACCESS_CONTROL,
        )

        CheckIn.objects.create(
            student=self.other_student,
        )

        self.client.force_authenticate(
            user=self.user,
        )

        response = self.client.get(
            self.list_url,
            {
                "student": self.student.id,
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            2,
        )

        self.assertEqual(
            [item["id"] for item in response.data["results"]],
            [str(newer.id), str(older.id)],
        )

        self.assertEqual(
            response.data["results"][0]["source_label"],
            "Controle de acesso",
        )

    def test_creates_persistent_checkin(self):
        self.client.force_authenticate(
            user=self.user,
        )

        response = self.client.post(
            self.list_url,
            {
                "student": str(self.student.id),
                "source": CheckIn.Source.MANUAL,
                "notes": "Entrada pela recepção",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertTrue(
            CheckIn.objects.filter(
                id=response.data["id"],
                student=self.student,
                notes="Entrada pela recepção",
            ).exists(),
        )

    def test_dashboard_summary_returns_today_count_and_recent_checkins(self):
        yesterday = CheckIn.objects.create(
            student=self.student,
            checked_in_at=timezone.now() - timedelta(days=1),
        )
        current = CheckIn.objects.create(
            student=self.other_student,
            checked_in_at=timezone.now(),
            source=CheckIn.Source.ACCESS_CONTROL,
        )

        self.client.force_authenticate(user=self.user)

        response = self.client.get(
            reverse("checkin-dashboard-summary"),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["today_count"], 1)
        self.assertEqual(
            response.data["recent_checkins"][0]["id"],
            str(current.id),
        )
        self.assertIn(
            str(yesterday.id),
            [item["id"] for item in response.data["recent_checkins"]],
        )
