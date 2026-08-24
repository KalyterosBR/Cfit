from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.academy.models import Academy, Unit
from apps.enrollments.models import Enrollment, EnrollmentHistory
from apps.plans.models import Plan
from apps.students.models import Student
from apps.users.models import AcademyUser


class EnrollmentLifecycleTests(APITestCase):
    def setUp(self):
        self.academy = Academy.objects.create(name="Cfit Matrículas")
        self.unit = Unit.objects.create(academy=self.academy, name="Centro", code="centro")
        self.user = get_user_model().objects.create_user(email="enrollment@cfit.test", password="test")
        AcademyUser.objects.create(academy=self.academy, user=self.user, role=AcademyUser.Role.ADMIN, active_unit=self.unit)
        self.student = Student.objects.create(name="Aluno Ciclo", cpf="123.123.123-12", academy=self.academy, unit=self.unit)
        self.plan = Plan.objects.create(academy=self.academy, name="Mensal", price="100.00", duration_months=1, contract_text="Contrato vigente")
        self.enrollment = Enrollment.objects.create(student=self.student, plan=self.plan, unit=self.unit, contracted_price="100.00", original_price="100.00", start_date=timezone.localdate(), due_date=timezone.localdate() + timedelta(days=30), created_by=self.user)
        self.client.force_authenticate(self.user)

    def test_cancel_requires_and_persists_reason(self):
        url = reverse("enrollment-cancel", args=[self.enrollment.id])
        self.assertEqual(self.client.post(url, {}, format="json").status_code, status.HTTP_400_BAD_REQUEST)
        response = self.client.post(url, {"reason": "Mudança de cidade"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.enrollment.refresh_from_db()
        self.assertEqual(self.enrollment.cancellation_reason, "Mudança de cidade")

    def test_renew_preserves_link_and_history(self):
        response = self.client.post(reverse("enrollment-renew", args=[self.enrollment.id]), {"due_date": timezone.localdate() + timedelta(days=60), "reason": "Renovação aprovada"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        renewed = Enrollment.objects.get(pk=response.data["id"])
        self.assertEqual(renewed.renewed_from, self.enrollment)
        self.assertTrue(EnrollmentHistory.objects.filter(enrollment=self.enrollment, event_type=EnrollmentHistory.EventType.RENEWED).exists())
