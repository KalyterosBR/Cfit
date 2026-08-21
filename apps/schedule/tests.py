from datetime import timedelta
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase


class ScheduleApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(email="agenda@cfit.test", password="test")

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
