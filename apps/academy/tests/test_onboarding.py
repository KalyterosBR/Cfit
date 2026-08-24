from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.academy.models import Academy, AcademyOperationalSettings, Unit
from apps.users.models import AcademyUser, AdministrativeAudit


class AcademyOnboardingTests(APITestCase):
    def setUp(self):
        self.academy = Academy.objects.create(name="Academia inicial")
        self.unit = Unit.objects.create(academy=self.academy, name="Matriz", code="matriz")
        self.owner = get_user_model().objects.create_user(email="owner@cfit.test", password="test-password")
        AcademyUser.objects.create(academy=self.academy, user=self.owner, role=AcademyUser.Role.OWNER, active_unit=self.unit)
        self.client.force_authenticate(self.owner)

    def test_owner_completes_initial_configuration(self):
        response = self.client.post("/api/academies/onboarding/", {
            "name": "Cfit Performance Ltda",
            "trade_name": "Cfit Performance",
            "establishment_type": "gym",
            "size_range": "301_700",
            "primary_goal": "retain",
            "phone": "11999999999",
            "email": "contato@cfit.test",
            "unit_name": "Unidade Centro",
            "unit_address": "Rua Principal, 100",
            "unit_phone": "1133334444",
            "payment_grace_days": 10,
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.academy.refresh_from_db()
        self.unit.refresh_from_db()
        self.assertIsNotNone(self.academy.onboarding_completed_at)
        self.assertEqual(self.academy.establishment_type, Academy.EstablishmentType.GYM)
        self.assertEqual(self.academy.primary_goal, Academy.PrimaryGoal.RETAIN)
        self.assertEqual(self.unit.name, "Unidade Centro")
        self.assertEqual(AcademyOperationalSettings.objects.get(academy=self.academy).payment_grace_days, 10)
        self.assertTrue(AdministrativeAudit.objects.filter(action="academy.onboarding_completed").exists())

    def test_reception_cannot_configure_academy(self):
        reception = get_user_model().objects.create_user(email="reception@cfit.test", password="test-password")
        AcademyUser.objects.create(academy=self.academy, user=reception, role=AcademyUser.Role.RECEPTION, active_unit=self.unit)
        self.client.force_authenticate(reception)
        response = self.client.get("/api/academies/onboarding/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_onboarding_rejects_required_fields_in_backend(self):
        response = self.client.post("/api/academies/onboarding/", {
            "name": "", "trade_name": "", "establishment_type": "",
            "size_range": "", "primary_goal": "", "phone": "",
            "email": "", "unit_name": "", "unit_address": "",
            "unit_phone": "", "payment_grace_days": 7,
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        for field in ["name", "trade_name", "establishment_type", "size_range", "primary_goal", "phone", "email", "unit_name", "unit_address", "unit_phone"]:
            self.assertIn(field, response.data)
        self.academy.refresh_from_db()
        self.assertIsNone(self.academy.onboarding_completed_at)

    def test_session_reports_onboarding_state(self):
        pending = self.client.get("/api/users/me/")
        self.assertFalse(pending.data["onboarding_completed"])
        self.academy.onboarding_completed_at = "2026-08-24T12:00:00-03:00"
        self.academy.save(update_fields=["onboarding_completed_at"])
        completed = self.client.get("/api/users/me/")
        self.assertTrue(completed.data["onboarding_completed"])
