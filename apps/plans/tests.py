from django.contrib.auth import get_user_model
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase

from apps.plans.models import Plan


class PlanApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email="plans@cfit.test",
            password="test-password",
        )

        self.active_plan = Plan.objects.create(
            name="Plano Mensal",
            price="119.90",
            duration_months=1,
        )

        self.inactive_plan = Plan.objects.create(
            name="Plano Antigo",
            price="99.90",
            duration_months=1,
            active=False,
        )

        self.list_url = reverse(
            "plans-list",
        )

        self.client.force_authenticate(
            user=self.user,
        )

    def test_default_list_returns_only_active_plans(self):
        response = self.client.get(
            self.list_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            1,
        )

        self.assertEqual(
            response.data["results"][0]["id"],
            str(self.active_plan.id),
        )

    def test_management_list_can_include_inactive_plans(self):
        response = self.client.get(
            self.list_url,
            {
                "include_inactive": "true",
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

    def test_inactive_plan_can_be_reactivated(self):
        response = self.client.patch(
            reverse(
                "plans-detail",
                args=[self.inactive_plan.id],
            ),
            {
                "active": True,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.inactive_plan.refresh_from_db()

        self.assertTrue(
            self.inactive_plan.active,
        )
