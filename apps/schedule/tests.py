from datetime import timedelta
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from apps.academy.models import Academy, Unit
from apps.users.models import AcademyUser


class ScheduleApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(email="agenda@cfit.test", password="test")

    def test_detects_professional_conflict_and_confirms_event(self):
        academy = Academy.objects.create(name="Agenda Unidade")
        unit = Unit.objects.create(academy=academy, name="Centro", code="centro")
        AcademyUser.objects.create(academy=academy, user=self.user, role=AcademyUser.Role.ADMIN, active_unit=unit)
        self.client.force_authenticate(self.user)
        start = timezone.now() + timedelta(days=2)
        first = self.client.post(reverse("schedule-event-list"), {"title": "Aula 1", "event_type": "class", "starts_at": start, "ends_at": start + timedelta(hours=1)}, format="json")
        conflict = self.client.post(reverse("schedule-event-list"), {"title": "Aula 2", "event_type": "class", "starts_at": start + timedelta(minutes=30), "ends_at": start + timedelta(hours=2)}, format="json")
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(conflict.status_code, status.HTTP_400_BAD_REQUEST)
        confirmed = self.client.post(reverse("schedule-event-confirm", args=[first.data["id"]]))
        self.assertEqual(confirmed.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(confirmed.data["confirmed_at"])

    def test_private_and_validated_event_creation(self):
        url = reverse("schedule-event-list")
        self.assertEqual(self.client.get(url).status_code, status.HTTP_401_UNAUTHORIZED)
        self.client.force_authenticate(self.user)
        start = timezone.now() + timedelta(days=1)
        invalid = self.client.post(url, {"title": "Avaliação", "event_type": "assessment", "starts_at": start, "ends_at": start}, format="json")
        valid = self.client.post(url, {"title": "Avaliação", "event_type": "assessment", "starts_at": start, "ends_at": start + timedelta(hours=1)}, format="json")
        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(valid.status_code, status.HTTP_201_CREATED)
        self.assertEqual(valid.data["professional"], self.user.id)

    def test_recurrence_rejects_conflict_in_a_future_occurrence(self):
        academy = Academy.objects.create(name="Agenda Recorrente")
        unit = Unit.objects.create(academy=academy, name="Centro", code="centro")
        AcademyUser.objects.create(
            academy=academy,
            user=self.user,
            role=AcademyUser.Role.ADMIN,
            active_unit=unit,
        )
        self.client.force_authenticate(self.user)
        start = timezone.now() + timedelta(days=3)
        future_conflict_start = start + timedelta(days=7, minutes=15)
        self.client.post(
            reverse("schedule-event-list"),
            {
                "title": "Compromisso futuro",
                "event_type": "task",
                "starts_at": future_conflict_start,
                "ends_at": future_conflict_start + timedelta(minutes=30),
            },
            format="json",
        )

        recurring = self.client.post(
            reverse("schedule-event-list"),
            {
                "title": "Aula semanal",
                "event_type": "class",
                "starts_at": start,
                "ends_at": start + timedelta(hours=1),
                "recurrence": "weekly",
                "recurrence_count": 3,
            },
            format="json",
        )

        self.assertEqual(recurring.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("recurrence_count", recurring.data)
