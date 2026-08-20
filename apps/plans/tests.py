from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase

from apps.enrollments.models import Enrollment
from apps.financial.models import Charge
from apps.financial.services.billing import (
    create_enrollment_charges,
    generate_recurring_charges,
)
from apps.plans.models import Plan
from apps.students.models import Student


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

    def test_list_returns_active_students_count_for_each_plan(self):
        active_student = Student.objects.create(
            name="Aluno Ativo",
            cpf="555.555.555-55",
        )
        frozen_student = Student.objects.create(
            name="Aluno Congelado",
            cpf="666.666.666-66",
        )

        Enrollment.objects.create(
            student=active_student,
            plan=self.active_plan,
            contracted_price="119.90",
            start_date=date(2026, 8, 1),
            due_date=date(2026, 9, 1),
        )
        Enrollment.objects.create(
            student=frozen_student,
            plan=self.active_plan,
            contracted_price="119.90",
            start_date=date(2026, 8, 1),
            due_date=date(2026, 9, 1),
            status=Enrollment.Status.FROZEN,
        )

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["results"][0]["active_students_count"],
            1,
        )

    def test_plan_exposes_and_validates_commercial_configuration(self):
        response = self.client.post(
            self.list_url,
            {
                "name": "Plano Trimestral",
                "price": "1200.00",
                "duration_months": 12,
                "billing_period": "quarterly",
                "recurring": True,
                "enrollment_fee": "50.00",
                "minimum_commitment_months": 6,
                "auto_renew": True,
                "available_for_enrollment": True,
                "contract_text": "Contrato do plano trimestral.",
                "cancellation_rules": "Aviso prévio de 30 dias.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["monthly_equivalent"], "100.00")
        self.assertEqual(response.data["billing_period_label"], "Trimestral")

        invalid_response = self.client.post(
            self.list_url,
            {
                "name": "Plano Inválido",
                "price": "100.00",
                "duration_months": 1,
                "billing_period": "one_time",
                "recurring": True,
                "auto_renew": True,
                "contract_text": "Contrato inválido.",
            },
            format="json",
        )

        self.assertEqual(
            invalid_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("recurring", invalid_response.data)

    def test_enrollment_requires_acceptance_and_preserves_contract_version(self):
        student = Student.objects.create(
            name="Aluno Contrato",
            cpf="987.654.321-00",
        )
        plan = Plan.objects.create(
            name="Plano com Contrato",
            price=Decimal("200.00"),
            duration_months=2,
            contract_text="Termos originais do contrato.",
            cancellation_rules="Cancelamento com aviso prévio.",
        )
        payload = {
            "student": str(student.id),
            "plan": str(plan.id),
            "contracted_price": "200.00",
            "discount_amount": "20.00",
            "discount_reason": "Campanha de lançamento",
            "start_date": "2026-09-01",
            "due_date": "2026-11-01",
            "status": "active",
            "billing_method": "monthly",
            "notes": "",
        }

        missing_acceptance = self.client.post(
            reverse("enrollment-list"),
            payload,
            format="json",
        )

        self.assertEqual(
            missing_acceptance.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("contract_accepted", missing_acceptance.data)

        response = self.client.post(
            reverse("enrollment-list"),
            {**payload, "contract_accepted": True},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        enrollment = Enrollment.objects.get(id=response.data["id"])
        self.assertEqual(enrollment.original_price, Decimal("200.00"))
        self.assertEqual(enrollment.discount_amount, Decimal("20.00"))
        self.assertEqual(enrollment.contracted_price, Decimal("180.00"))
        self.assertEqual(enrollment.created_by, self.user)
        self.assertEqual(enrollment.contract_version, 1)
        self.assertEqual(
            enrollment.contract_snapshot["contract_text"],
            "Termos originais do contrato.",
        )
        self.assertEqual(enrollment.contract_accepted_by, self.user)
        self.assertIsNotNone(enrollment.contract_accepted_at)

        original_snapshot = enrollment.contract_snapshot.copy()
        plan_update_response = self.client.patch(
            reverse("plans-detail", args=[plan.id]),
            {"contract_text": "Contrato alterado posteriormente."},
            format="json",
        )

        self.assertEqual(plan_update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(plan_update_response.data["contract_version"], 2)
        enrollment.refresh_from_db()
        self.assertEqual(enrollment.contract_snapshot, original_snapshot)

    def test_charge_preview_matches_generated_discounted_charges(self):
        plan = Plan.objects.create(
            name="Plano Prévia",
            price=Decimal("600.00"),
            duration_months=6,
            billing_period=Plan.BillingPeriod.QUARTERLY,
            enrollment_fee=Decimal("30.00"),
            contract_text="Contrato para prévia.",
        )

        response = self.client.post(
            reverse("enrollment-preview-charges"),
            {
                "plan": str(plan.id),
                "discount_amount": "60.00",
                "discount_reason": "Convênio empresarial",
                "due_date": "2026-10-10",
                "billing_method": "monthly",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["final_price"], Decimal("540.00"))
        self.assertEqual(response.data["total_expected"], Decimal("570.00"))
        self.assertEqual(len(response.data["charges"]), 3)
        self.assertEqual(
            [item["amount"] for item in response.data["charges"]],
            [Decimal("30.00"), Decimal("270.00"), Decimal("270.00")],
        )

    def test_quarterly_plan_generates_fee_installments_and_renewal(self):
        student = Student.objects.create(
            name="Aluno Trimestral",
            cpf="123.123.123-12",
        )
        plan = Plan.objects.create(
            name="Plano Trimestral Operacional",
            price=Decimal("1200.00"),
            duration_months=12,
            billing_period=Plan.BillingPeriod.QUARTERLY,
            recurring=True,
            enrollment_fee=Decimal("50.00"),
            auto_renew=True,
        )
        enrollment = Enrollment.objects.create(
            student=student,
            plan=plan,
            contracted_price=Decimal("1200.00"),
            start_date=date(2026, 1, 1),
            due_date=date(2026, 1, 10),
            billing_method=Enrollment.BillingMethod.MONTHLY,
        )

        charges = create_enrollment_charges(enrollment)

        self.assertEqual(len(charges), 5)
        installments = Charge.objects.filter(
            enrollment=enrollment,
        ).exclude(description__startswith="Taxa de matrícula")
        self.assertEqual(
            list(installments.values_list("amount", flat=True)),
            [
                Decimal("300.00"),
                Decimal("300.00"),
                Decimal("300.00"),
                Decimal("300.00"),
            ],
        )
        last_due_date = date(2026, 10, 10)
        self.assertEqual(charges[-1].due_date, last_due_date)

        recurring_charges = generate_recurring_charges(
            reference_date=date(2027, 1, 10) - timedelta(days=10),
        )

        self.assertEqual(len(recurring_charges), 1)
        self.assertEqual(recurring_charges[0].amount, Decimal("300.00"))
        self.assertEqual(recurring_charges[0].due_date, date(2027, 1, 10))
