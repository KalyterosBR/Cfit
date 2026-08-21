from datetime import date, datetime, time, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone

from rest_framework import status
from rest_framework.test import APITestCase

from apps.enrollments.models import Enrollment
from apps.financial.models import (
    CashTransaction,
    Charge,
    ChargeAudit,
    ChargeReconciliation,
    MonthlyRevenueGoal,
    RecurringPaymentAttempt,
)
from apps.financial.services.billing import add_months
from apps.plans.models import Plan
from apps.students.models import Student


class ChargeApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email="financial@cfit.test",
            password="test-password",
        )
        self.student = Student.objects.create(
            name="Aluno Financeiro",
            cpf="333.333.333-33",
        )
        self.other_student = Student.objects.create(
            name="Outro Aluno",
            cpf="444.444.444-44",
        )
        self.plan = Plan.objects.create(
            name="Plano Mensal",
            price="100.00",
            duration_months=1,
        )
        self.enrollment = Enrollment.objects.create(
            student=self.student,
            plan=self.plan,
            contracted_price="100.00",
            start_date=date(2026, 8, 1),
            due_date=date(2026, 9, 1),
        )
        other_enrollment = Enrollment.objects.create(
            student=self.other_student,
            plan=self.plan,
            contracted_price="100.00",
            start_date=date(2026, 8, 1),
            due_date=date(2026, 9, 1),
        )
        self.pending_charge = Charge.objects.create(
            enrollment=self.enrollment,
            description="Mensalidade setembro",
            amount="100.00",
            due_date=date(2026, 9, 1),
            competence_date=date(2026, 9, 1),
        )
        self.overdue_charge = Charge.objects.create(
            enrollment=self.enrollment,
            description="Mensalidade agosto",
            amount="80.00",
            due_date=date(2026, 8, 1),
            competence_date=date(2026, 8, 1),
            status=Charge.Status.OVERDUE,
        )
        Charge.objects.create(
            enrollment=other_enrollment,
            description="Mensalidade externa",
            amount="120.00",
            due_date=date(2026, 9, 1),
            competence_date=date(2026, 9, 1),
        )
        self.list_url = reverse("charge-list")
        self.client.force_authenticate(user=self.user)

    def test_filters_charges_by_status_and_search(self):
        response = self.client.get(
            self.list_url,
            {"status": Charge.Status.OVERDUE, "search": "Financeiro"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            response.data["results"][0]["id"],
            self.overdue_charge.id,
        )

    def test_summary_returns_financial_totals(self):
        response = self.client.get(
            reverse("charge-summary"),
            {"search": "Financeiro"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_count"], 2)
        self.assertEqual(response.data["open_total"], 180)
        self.assertEqual(response.data["overdue_count"], 1)
        self.assertEqual(response.data["overdue_total"], 80)

    def test_filters_operational_categories_and_exposes_competence(self):
        today = timezone.localdate()
        future_charge = Charge.objects.create(
            enrollment=self.enrollment,
            description="Cobrança futura",
            amount="60.00",
            due_date=today + timedelta(days=45),
            competence_date=today + timedelta(days=31),
        )
        inconsistent_charge = Charge.objects.create(
            enrollment=self.enrollment,
            description="Pagamento inconsistente",
            amount="40.00",
            due_date=today,
            competence_date=today,
            status=Charge.Status.PAID,
        )

        future_response = self.client.get(
            self.list_url,
            {"category": "future"},
        )
        inconsistent_response = self.client.get(
            self.list_url,
            {"category": "inconsistent"},
        )

        self.assertEqual(future_response.status_code, status.HTTP_200_OK)
        self.assertEqual(future_response.data["count"], 1)
        self.assertEqual(
            future_response.data["results"][0]["id"],
            future_charge.id,
        )
        self.assertEqual(
            future_response.data["results"][0]["competence_date"],
            future_charge.competence_date.isoformat(),
        )
        self.assertEqual(
            future_response.data["results"][0]["operational_category"],
            "future",
        )
        self.assertEqual(inconsistent_response.data["count"], 1)
        self.assertEqual(
            inconsistent_response.data["results"][0]["id"],
            inconsistent_charge.id,
        )

    def test_filters_by_dates_plan_and_payment_method(self):
        today = timezone.localdate()
        paid_charge = Charge.objects.create(
            enrollment=self.enrollment,
            description="Recebimento filtrado",
            amount="75.00",
            due_date=today,
            competence_date=today.replace(day=1),
            status=Charge.Status.PAID,
            paid_at=timezone.now(),
            payment_method=Charge.PaymentMethod.CREDIT_CARD,
        )

        response = self.client.get(
            self.list_url,
            {
                "plan": self.plan.id,
                "payment_method": Charge.PaymentMethod.CREDIT_CARD,
                "due_date_from": today.isoformat(),
                "due_date_to": today.isoformat(),
                "competence_date_from": today.replace(day=1).isoformat(),
                "competence_date_to": today.replace(day=1).isoformat(),
                "paid_date_from": today.isoformat(),
                "paid_date_to": today.isoformat(),
                "charge": paid_charge.id,
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["id"], paid_charge.id)

    def test_rejects_inverted_financial_period(self):
        today = timezone.localdate()

        response = self.client.get(
            self.list_url,
            {
                "due_date_from": (today + timedelta(days=1)).isoformat(),
                "due_date_to": today.isoformat(),
            },
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        payment_response = self.client.get(
            self.list_url,
            {
                "paid_date_from": (today + timedelta(days=1)).isoformat(),
                "paid_date_to": today.isoformat(),
            },
        )

        self.assertEqual(
            payment_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_filter_options_include_plans_and_payment_methods(self):
        response = self.client.get(reverse("charge-filter-options"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(
            str(self.plan.id),
            [str(item["id"]) for item in response.data["plans"]],
        )
        self.assertIn(
            Charge.PaymentMethod.PIX,
            [item["value"] for item in response.data["payment_methods"]],
        )

    def test_filters_open_charges_by_overdue_range(self):
        today = timezone.localdate()
        ranges = {
            "1_7": 4,
            "8_15": 10,
            "16_30": 20,
            "31_60": 45,
            "over_60": 75,
        }
        charges = {}

        for range_name, overdue_days in ranges.items():
            due_date = today - timedelta(days=overdue_days)
            charges[range_name] = Charge.objects.create(
                enrollment=self.enrollment,
                description=f"Faixa {range_name}",
                amount="50.00",
                due_date=due_date,
                competence_date=due_date,
            )

        for range_name, overdue_days in ranges.items():
            with self.subTest(overdue_range=range_name):
                response = self.client.get(
                    self.list_url,
                    {"overdue_range": range_name, "search": "Faixa"},
                )

                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(response.data["count"], 1)
                self.assertEqual(
                    response.data["results"][0]["id"],
                    charges[range_name].id,
                )
                self.assertEqual(
                    response.data["results"][0]["overdue_days"],
                    overdue_days,
                )

    def test_overdue_range_rejects_unknown_value(self):
        response = self.client.get(
            self.list_url,
            {"overdue_range": "invalid"},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_groups_filtered_charges_by_student(self):
        response = self.client.get(
            reverse("charge-grouped"),
            {"group_by": "student", "search": "Financeiro"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        group = response.data["results"][0]
        self.assertEqual(str(group["student"]), str(self.student.id))
        self.assertEqual(group["student_name"], self.student.name)
        self.assertEqual(group["charge_count"], 2)
        self.assertEqual(len(group["charges"]), 2)
        self.assertEqual(group["overdue_count"], 1)
        self.assertEqual(group["open_total"], 180)

    def test_groups_charges_by_enrollment_and_preserves_filters(self):
        response = self.client.get(
            reverse("charge-grouped"),
            {
                "group_by": "enrollment",
                "category": "overdue",
                "search": "Financeiro",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        group = response.data["results"][0]
        self.assertEqual(str(group["enrollment"]), str(self.enrollment.id))
        self.assertEqual(group["plan_name"], self.plan.name)
        self.assertEqual(group["charge_count"], 1)
        self.assertEqual(
            group["charges"][0]["id"],
            self.overdue_charge.id,
        )

    def test_grouped_view_rejects_unknown_group(self):
        response = self.client.get(
            reverse("charge-grouped"),
            {"group_by": "plan"},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_exports_all_filtered_charges_as_excel_compatible_csv(self):
        today = timezone.localdate()

        for index in range(12):
            Charge.objects.create(
                enrollment=self.enrollment,
                description=(
                    "=Exportação protegida"
                    if index == 0
                    else f"Exportação {index}"
                ),
                amount="25.50",
                due_date=today,
                competence_date=today.replace(day=1),
                status=Charge.Status.PAID,
                paid_at=timezone.now(),
                payment_method=Charge.PaymentMethod.PIX,
            )

        response = self.client.get(
            reverse("charge-export"),
            {
                "search": "Exportação",
                "payment_method": Charge.PaymentMethod.PIX,
            },
        )
        content = b"".join(response.streaming_content).decode("utf-8")
        lines = content.splitlines()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "text/csv; charset=utf-8")
        self.assertIn("cfit-financeiro-", response["Content-Disposition"])
        self.assertTrue(content.startswith("\ufeffAluno;Plano;Cobrança"))
        self.assertEqual(len(lines), 13)
        self.assertIn("25,50", content)
        self.assertIn("'=Exportação protegida", content)
        self.assertIn("Exportado em", lines[0])

    def test_bulk_payment_audits_successes_and_reports_failures(self):
        today = timezone.localdate()
        paid_charge = Charge.objects.create(
            enrollment=self.enrollment,
            description="Já recebida",
            amount="30.00",
            due_date=today,
            competence_date=today,
            status=Charge.Status.PAID,
            paid_at=timezone.now(),
            payment_method=Charge.PaymentMethod.CASH,
        )

        response = self.client.post(
            reverse("charge-bulk-pay"),
            {
                "charge_ids": [
                    self.pending_charge.id,
                    self.pending_charge.id,
                    self.overdue_charge.id,
                    paid_charge.id,
                    999999,
                ],
                "payment_method": Charge.PaymentMethod.DEBIT_CARD,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["succeeded_count"], 2)
        self.assertEqual(response.data["failed_count"], 2)
        self.pending_charge.refresh_from_db()
        self.overdue_charge.refresh_from_db()
        self.assertEqual(self.pending_charge.status, Charge.Status.PAID)
        self.assertEqual(self.overdue_charge.status, Charge.Status.PAID)
        self.assertEqual(
            self.pending_charge.payment_method,
            Charge.PaymentMethod.DEBIT_CARD,
        )
        audits = ChargeAudit.objects.filter(
            action=ChargeAudit.Action.PAYMENT_REGISTERED,
            actor=self.user,
            charge__in=[self.pending_charge, self.overdue_charge],
        )
        self.assertEqual(audits.count(), 2)
        paid_charge.refresh_from_db()
        self.assertEqual(paid_charge.payment_method, Charge.PaymentMethod.CASH)

    def test_bulk_payment_requires_at_least_one_charge(self):
        response = self.client.post(
            reverse("charge-bulk-pay"),
            {
                "charge_ids": [],
                "payment_method": Charge.PaymentMethod.PIX,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reconciles_paid_charge_and_records_audit(self):
        pay_response = self.client.post(
            reverse("charge-pay", args=[self.pending_charge.id]),
            {"payment_method": Charge.PaymentMethod.PIX},
        )
        self.assertEqual(pay_response.status_code, status.HTTP_200_OK)

        response = self.client.post(
            reverse("charge-reconcile", args=[self.pending_charge.id]),
            {
                "received_amount": "100.00",
                "notes": "Conferido no extrato.",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        reconciliation = ChargeReconciliation.objects.get(
            charge=self.pending_charge,
        )
        self.assertEqual(
            reconciliation.status,
            ChargeReconciliation.Status.RECONCILED,
        )
        self.assertEqual(reconciliation.reconciled_by, self.user)
        self.assertEqual(response.data["reconciliation"]["status"], "reconciled")
        audit = ChargeAudit.objects.get(
            charge=self.pending_charge,
            action=ChargeAudit.Action.RECONCILED,
        )
        self.assertEqual(audit.actor, self.user)
        self.assertEqual(
            audit.new_state["reconciliation"]["received_amount"],
            "100.00",
        )

    def test_marks_reconciliation_as_divergent_and_filters_it(self):
        today = timezone.localdate()
        charge = Charge.objects.create(
            enrollment=self.enrollment,
            description="Conciliação divergente",
            amount="90.00",
            due_date=today,
            competence_date=today,
            status=Charge.Status.PAID,
            paid_at=timezone.now(),
            payment_method=Charge.PaymentMethod.CREDIT_CARD,
        )

        reconcile_response = self.client.post(
            reverse("charge-reconcile", args=[charge.id]),
            {"received_amount": "85.00", "notes": "Taxa identificada."},
        )
        filter_response = self.client.get(
            self.list_url,
            {
                "reconciliation_status": "divergent",
                "search": "Conciliação divergente",
            },
        )

        self.assertEqual(reconcile_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            reconcile_response.data["reconciliation"]["status"],
            "divergent",
        )
        self.assertEqual(filter_response.data["count"], 1)
        self.assertEqual(filter_response.data["results"][0]["id"], charge.id)

    def test_reconciliation_rejects_unpaid_or_already_reconciled_charge(self):
        unpaid_response = self.client.post(
            reverse("charge-reconcile", args=[self.pending_charge.id]),
            {"received_amount": "100.00"},
        )
        self.assertEqual(unpaid_response.status_code, status.HTTP_400_BAD_REQUEST)

        self.client.post(
            reverse("charge-pay", args=[self.pending_charge.id]),
            {"payment_method": Charge.PaymentMethod.PIX},
        )
        first_response = self.client.post(
            reverse("charge-reconcile", args=[self.pending_charge.id]),
            {"received_amount": "100.00"},
        )
        duplicate_response = self.client.post(
            reverse("charge-reconcile", args=[self.pending_charge.id]),
            {"received_amount": "100.00"},
        )

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(duplicate_response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reconciliation_appears_in_student_timeline(self):
        self.client.post(
            reverse("charge-pay", args=[self.pending_charge.id]),
            {"payment_method": Charge.PaymentMethod.PIX},
        )
        self.client.post(
            reverse("charge-reconcile", args=[self.pending_charge.id]),
            {"received_amount": "100.00", "notes": "Extrato conferido."},
        )

        response = self.client.get(
            reverse("students-timeline", args=[self.student.id]),
        )
        event = next(
            item
            for item in response.data["events"]
            if item["type"] == "charge_reconciled"
        )

        self.assertEqual(event["actor_name"], self.user.email)
        self.assertIn("Extrato conferido", event["description"])

    def test_forecast_separates_expected_received_pending_and_overdue(self):
        today = timezone.localdate()
        current_month = today.replace(day=1)
        next_month = add_months(current_month, 1)
        charge_data = [
            ("Recebida", "100.00", today, Charge.Status.PAID),
            ("Pendente", "200.00", today, Charge.Status.PENDING),
            (
                "Vencida",
                "50.00",
                today - timedelta(days=1),
                Charge.Status.OVERDUE,
            ),
            ("Cancelada", "30.00", today, Charge.Status.CANCELED),
        ]

        for label, amount, due_date, charge_status in charge_data:
            Charge.objects.create(
                enrollment=self.enrollment,
                description=f"Projeção {label}",
                amount=amount,
                due_date=due_date,
                competence_date=current_month,
                status=charge_status,
                paid_at=timezone.now() if charge_status == Charge.Status.PAID else None,
                payment_method=(
                    Charge.PaymentMethod.PIX
                    if charge_status == Charge.Status.PAID
                    else None
                ),
            )

        Charge.objects.create(
            enrollment=self.enrollment,
            description="Projeção próximo mês",
            amount="300.00",
            due_date=next_month,
            competence_date=next_month,
        )

        response = self.client.get(
            reverse("charge-forecast"),
            {"months": 3, "search": "Projeção"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["totals"]["expected"], 650)
        self.assertEqual(response.data["totals"]["received"], 100)
        self.assertEqual(response.data["totals"]["pending"], 500)
        self.assertEqual(response.data["totals"]["overdue"], 50)
        self.assertEqual(response.data["historical_overdue"], 50)
        self.assertEqual(response.data["monthly"][0]["expected"], 350)
        self.assertEqual(response.data["monthly"][1]["expected"], 300)
        self.assertEqual(len(response.data["monthly"]), 3)

    def test_forecast_rejects_unsupported_period(self):
        response = self.client.get(
            reverse("charge-forecast"),
            {"months": 5},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_creates_immutable_cash_transaction_with_actor(self):
        today = timezone.localdate()
        response = self.client.post(
            reverse("cash-transaction-list"),
            {
                "transaction_type": CashTransaction.Type.EXPENSE,
                "status": CashTransaction.Status.REALIZED,
                "category": CashTransaction.Category.MAINTENANCE,
                "description": "Manutenção do equipamento",
                "amount": "250.00",
                "competence_date": today,
                "transaction_date": today,
                "notes": "Ordem de serviço conferida.",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        transaction = CashTransaction.objects.get(id=response.data["id"])
        self.assertEqual(transaction.created_by, self.user)
        self.assertEqual(response.data["created_by"], self.user.email)
        self.assertEqual(
            response.data["category_label"],
            "Manutenção",
        )

        update_response = self.client.patch(
            reverse("cash-transaction-detail", args=[transaction.id]),
            {"amount": "10.00"},
        )
        delete_response = self.client.delete(
            reverse("cash-transaction-detail", args=[transaction.id]),
        )
        self.assertEqual(update_response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(delete_response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_cash_transaction_validates_effective_date_and_positive_amount(self):
        today = timezone.localdate()
        base_payload = {
            "transaction_type": CashTransaction.Type.EXPENSE,
            "status": CashTransaction.Status.REALIZED,
            "category": CashTransaction.Category.OTHER,
            "description": "Despesa inválida",
            "amount": "0.00",
            "competence_date": today,
        }

        response = self.client.post(
            reverse("cash-transaction-list"),
            base_payload,
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("amount", response.data)

        missing_date_response = self.client.post(
            reverse("cash-transaction-list"),
            {**base_payload, "amount": "10.00"},
        )
        self.assertEqual(
            missing_date_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("transaction_date", missing_date_response.data)

    def test_cash_flow_summary_separates_projected_and_realized_expenses(self):
        today = timezone.localdate()
        competence = today.replace(day=1)
        CashTransaction.objects.create(
            transaction_type=CashTransaction.Type.EXPENSE,
            status=CashTransaction.Status.PLANNED,
            category=CashTransaction.Category.RENT,
            description="Aluguel previsto",
            amount="200.00",
            competence_date=competence,
            created_by=self.user,
        )
        CashTransaction.objects.create(
            transaction_type=CashTransaction.Type.EXPENSE,
            status=CashTransaction.Status.REALIZED,
            category=CashTransaction.Category.RENT,
            description="Taxa realizada",
            amount="50.00",
            competence_date=competence,
            transaction_date=today,
            created_by=self.user,
        )

        response = self.client.get(
            reverse("cash-transaction-summary"),
            {
                "granularity": "monthly",
                "months": 3,
                "transaction_type": "expense",
                "category": "rent",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["opening_balance_included"])
        self.assertEqual(response.data["totals"]["projected_expense"], 250)
        self.assertEqual(response.data["totals"]["realized_expense"], 50)
        self.assertEqual(response.data["totals"]["projected_balance"], -250)
        self.assertEqual(response.data["totals"]["realized_balance"], -50)

    def test_cash_flow_daily_view_returns_next_thirty_days(self):
        response = self.client.get(
            reverse("cash-transaction-summary"),
            {"granularity": "daily"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["periods"]), 30)

    def test_records_numbered_recurring_attempts_and_resolves_failure(self):
        self.plan.recurring = True
        self.plan.save(update_fields=["recurring", "updated_at"])
        rejected_response = self.client.post(
            reverse("recurring-attempt-list"),
            {
                "charge": self.pending_charge.id,
                "status": RecurringPaymentAttempt.Status.REJECTED,
                "source": RecurringPaymentAttempt.Source.MANUAL,
                "failure_code": "card_declined",
                "failure_reason": "Transação não autorizada.",
                "next_retry_at": timezone.now() - timedelta(hours=1),
            },
        )

        self.assertEqual(rejected_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(rejected_response.data["attempt_number"], 1)
        self.assertEqual(rejected_response.data["recorded_by"], self.user.email)

        failed_summary = self.client.get(reverse("recurring-attempt-summary"))
        self.assertEqual(failed_summary.data["rejected_count"], 1)
        self.assertEqual(failed_summary.data["retry_due_count"], 1)
        self.assertEqual(failed_summary.data["unresolved_charge_count"], 1)

        approved_response = self.client.post(
            reverse("recurring-attempt-list"),
            {
                "charge": self.pending_charge.id,
                "status": RecurringPaymentAttempt.Status.APPROVED,
                "source": RecurringPaymentAttempt.Source.MANUAL,
            },
        )
        resolved_summary = self.client.get(reverse("recurring-attempt-summary"))

        self.assertEqual(approved_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(approved_response.data["attempt_number"], 2)
        self.assertEqual(resolved_summary.data["unresolved_charge_count"], 0)

        update_response = self.client.patch(
            reverse(
                "recurring-attempt-detail",
                args=[rejected_response.data["id"]],
            ),
            {"failure_reason": "Alterado"},
        )
        self.assertEqual(update_response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_recurring_attempt_rejects_non_recurring_charge_and_invalid_failure(self):
        non_recurring_response = self.client.post(
            reverse("recurring-attempt-list"),
            {
                "charge": self.pending_charge.id,
                "status": RecurringPaymentAttempt.Status.PENDING,
                "source": RecurringPaymentAttempt.Source.MANUAL,
            },
        )
        self.assertEqual(
            non_recurring_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.plan.recurring = True
        self.plan.save(update_fields=["recurring", "updated_at"])
        missing_reason_response = self.client.post(
            reverse("recurring-attempt-list"),
            {
                "charge": self.pending_charge.id,
                "status": RecurringPaymentAttempt.Status.REJECTED,
                "source": RecurringPaymentAttempt.Source.INTEGRATION,
                "provider": "Adquirente teste",
            },
        )
        self.assertEqual(
            missing_reason_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("failure_reason", missing_reason_response.data)

    def test_recurring_attempt_appears_in_student_timeline(self):
        self.plan.recurring = True
        self.plan.save(update_fields=["recurring", "updated_at"])
        self.client.post(
            reverse("recurring-attempt-list"),
            {
                "charge": self.pending_charge.id,
                "status": RecurringPaymentAttempt.Status.REJECTED,
                "source": RecurringPaymentAttempt.Source.MANUAL,
                "failure_reason": "Saldo insuficiente.",
            },
        )

        response = self.client.get(
            reverse("students-timeline", args=[self.student.id]),
        )
        event = next(
            item
            for item in response.data["events"]
            if item["type"] == "recurring_attempt"
        )

        self.assertEqual(event["actor_name"], self.user.email)
        self.assertIn("Saldo insuficiente", event["description"])

    def test_inconsistencies_identifies_critical_charge_states(self):
        paid_without_details = Charge.objects.create(
            enrollment=self.enrollment,
            description="Pagamento sem detalhes",
            amount="45.00",
            due_date=timezone.localdate(),
            competence_date=timezone.localdate(),
            status=Charge.Status.PAID,
        )
        open_with_payment = Charge.objects.create(
            enrollment=self.enrollment,
            description="Cobrança aberta já recebida",
            amount="55.00",
            due_date=timezone.localdate(),
            competence_date=timezone.localdate(),
            status=Charge.Status.PENDING,
            paid_at=timezone.now(),
            payment_method=Charge.PaymentMethod.PIX,
        )

        response = self.client.get(
            reverse("charge-inconsistencies"),
            {"priority": "critical"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["summary"]["critical_count"], 2)
        issue_ids = {issue["entity_id"] for issue in response.data["results"]}
        issue_kinds = {issue["kind"] for issue in response.data["results"]}
        self.assertEqual(
            issue_ids,
            {str(paid_without_details.id), str(open_with_payment.id)},
        )
        self.assertEqual(
            issue_kinds,
            {"paid_incomplete", "open_with_payment"},
        )

    def test_inconsistencies_combines_high_priority_operational_sources(self):
        paid_charge = Charge.objects.create(
            enrollment=self.enrollment,
            description="Recebimento divergente",
            amount="90.00",
            due_date=timezone.localdate(),
            competence_date=timezone.localdate(),
            status=Charge.Status.PAID,
            paid_at=timezone.now(),
            payment_method=Charge.PaymentMethod.CREDIT_CARD,
        )
        ChargeReconciliation.objects.create(
            charge=paid_charge,
            expected_amount="90.00",
            received_amount="85.00",
            status=ChargeReconciliation.Status.DIVERGENT,
            reconciled_by=self.user,
        )
        Charge.objects.create(
            enrollment=self.enrollment,
            description=self.pending_charge.description,
            amount=self.pending_charge.amount,
            due_date=self.pending_charge.due_date,
            competence_date=self.pending_charge.competence_date,
        )
        self.plan.recurring = True
        self.plan.save(update_fields=["recurring", "updated_at"])
        recurring_response = self.client.post(
            reverse("recurring-attempt-list"),
            {
                "charge": self.pending_charge.id,
                "status": RecurringPaymentAttempt.Status.REJECTED,
                "source": RecurringPaymentAttempt.Source.MANUAL,
                "failure_reason": "Cartão recusado.",
            },
        )

        response = self.client.get(
            reverse("charge-inconsistencies"),
            {"priority": "high", "search": "Aluno Financeiro"},
        )

        self.assertEqual(recurring_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["summary"]["high_count"], 3)
        self.assertEqual(
            {issue["kind"] for issue in response.data["results"]},
            {
                "reconciliation_divergent",
                "recurrence_unresolved",
                "duplicate_charge",
            },
        )
        self.assertTrue(
            all(
                issue["cause"] and issue["next_action"]
                for issue in response.data["results"]
            )
        )

    def test_pay_and_cancel_charge(self):
        pay_response = self.client.post(
            reverse("charge-pay", args=[self.pending_charge.id]),
            {"payment_method": Charge.PaymentMethod.PIX},
        )

        self.assertEqual(pay_response.status_code, status.HTTP_200_OK)
        self.pending_charge.refresh_from_db()
        self.assertEqual(self.pending_charge.status, Charge.Status.PAID)
        self.assertIsNotNone(self.pending_charge.paid_at)
        self.assertEqual(
            self.pending_charge.payment_method,
            Charge.PaymentMethod.PIX,
        )
        self.assertEqual(
            pay_response.data["payment_method"],
            Charge.PaymentMethod.PIX,
        )

        cancel_response = self.client.post(
            reverse("charge-cancel", args=[self.overdue_charge.id]),
            {"reason": "Cobrança gerada em duplicidade."},
        )

        self.assertEqual(cancel_response.status_code, status.HTTP_200_OK)
        self.overdue_charge.refresh_from_db()
        self.assertEqual(self.overdue_charge.status, Charge.Status.CANCELED)
        payment_audit = ChargeAudit.objects.get(
            charge=self.pending_charge,
            action=ChargeAudit.Action.PAYMENT_REGISTERED,
        )
        cancel_audit = ChargeAudit.objects.get(
            charge=self.overdue_charge,
            action=ChargeAudit.Action.CANCELED,
        )
        self.assertEqual(payment_audit.actor, self.user)
        self.assertEqual(payment_audit.previous_state["status"], "pending")
        self.assertEqual(payment_audit.new_state["status"], "paid")
        self.assertEqual(cancel_audit.actor, self.user)
        self.assertEqual(
            cancel_audit.reason,
            "Cobrança gerada em duplicidade.",
        )
        self.assertEqual(cancel_audit.previous_state["status"], "overdue")
        self.assertEqual(cancel_audit.new_state["status"], "canceled")

    def test_cancel_requires_reason_and_does_not_change_charge(self):
        response = self.client.post(
            reverse("charge-cancel", args=[self.pending_charge.id]),
            {},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("reason", response.data)
        self.pending_charge.refresh_from_db()
        self.assertEqual(self.pending_charge.status, Charge.Status.PENDING)
        self.assertFalse(
            ChargeAudit.objects.filter(charge=self.pending_charge).exists()
        )

    def test_financial_audit_is_exposed_in_student_timeline(self):
        reason = "Aluno solicitou encerramento da cobrança."
        cancel_response = self.client.post(
            reverse("charge-cancel", args=[self.pending_charge.id]),
            {"reason": reason},
        )

        self.assertEqual(cancel_response.status_code, status.HTTP_200_OK)

        timeline_response = self.client.get(
            reverse("students-timeline", args=[self.student.id]),
        )

        self.assertEqual(timeline_response.status_code, status.HTTP_200_OK)
        canceled_event = next(
            event
            for event in timeline_response.data["events"]
            if event["type"] == "charge_canceled"
        )
        self.assertIn(reason, canceled_event["description"])
        self.assertEqual(canceled_event["actor_name"], self.user.email)

    def test_payment_method_is_required_and_must_be_valid(self):
        pay_url = reverse("charge-pay", args=[self.pending_charge.id])

        missing_response = self.client.post(pay_url, {})
        invalid_response = self.client.post(
            pay_url,
            {"payment_method": "cryptocurrency"},
        )

        self.assertEqual(
            missing_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(
            invalid_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.pending_charge.refresh_from_db()
        self.assertEqual(self.pending_charge.status, Charge.Status.PENDING)
        self.assertIsNone(self.pending_charge.payment_method)

    def test_dashboard_summary_returns_only_current_month_revenue(self):
        today = timezone.localdate()
        previous_month_last_day = today.replace(day=1) - timedelta(days=1)
        previous_payment_date = previous_month_last_day.replace(
            day=min(today.day, previous_month_last_day.day),
        )

        current_payment = Charge.objects.create(
            enrollment=self.enrollment,
            description="Pagamento no mês atual",
            amount="35.00",
            due_date=timezone.localdate(),
            competence_date=timezone.localdate(),
            status=Charge.Status.PAID,
            paid_at=timezone.now(),
        )
        previous_payment = Charge.objects.create(
            enrollment=self.enrollment,
            description="Pagamento anterior",
            amount="200.00",
            due_date=previous_payment_date,
            competence_date=previous_payment_date,
            status=Charge.Status.PAID,
            paid_at=timezone.make_aware(
                datetime.combine(previous_payment_date, time(12)),
            ),
        )

        response = self.client.get(
            reverse("charge-dashboard-summary"),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["monthly_revenue"], 35)
        self.assertEqual(
            response.data["period_start"],
            timezone.localdate().replace(day=1).isoformat(),
        )
        recent_payment_ids = [
            payment["id"]
            for payment in response.data["recent_payments"]
        ]
        self.assertEqual(recent_payment_ids[0], current_payment.id)
        self.assertNotIn(previous_payment.id, recent_payment_ids)
        self.assertNotIn(self.pending_charge.id, recent_payment_ids)
        self.assertEqual(response.data["previous_revenue"], 200)
        self.assertEqual(
            response.data["growth_percentage"],
            Decimal("-82.5"),
        )
        self.assertEqual(response.data["revenue_difference"], Decimal("-165"))
        self.assertEqual(response.data["current_payment_count"], 1)
        self.assertEqual(response.data["previous_payment_count"], 1)
        self.assertEqual(response.data["current_average_ticket"], Decimal("35"))
        self.assertEqual(response.data["previous_average_ticket"], Decimal("200"))
        self.assertEqual(response.data["volume_effect"], Decimal("0.00"))
        self.assertEqual(response.data["ticket_effect"], Decimal("-165.00"))
        self.assertEqual(response.data["growth_driver"], "average_ticket")
        self.assertEqual(len(response.data["revenue_history"]), 6)
        self.assertEqual(
            response.data["revenue_history"][-1]["period"],
            today.strftime("%Y-%m"),
        )
        self.assertEqual(
            response.data["revenue_history"][-1]["revenue"],
            35,
        )

    def test_dashboard_summary_accepts_a_past_month(self):
        today = timezone.localdate()
        selected_month = add_months(today.replace(day=1), -2)
        previous_month = add_months(selected_month, -1)
        selected_payment_date = selected_month.replace(day=15)
        previous_payment_date = previous_month.replace(day=15)

        selected_payment = Charge.objects.create(
            enrollment=self.enrollment,
            description="Pagamento do período selecionado",
            amount="150.00",
            due_date=selected_payment_date,
            competence_date=selected_payment_date,
            status=Charge.Status.PAID,
            paid_at=timezone.make_aware(
                datetime.combine(selected_payment_date, time(12)),
            ),
        )
        Charge.objects.create(
            enrollment=self.enrollment,
            description="Pagamento do período comparado",
            amount="100.00",
            due_date=previous_payment_date,
            competence_date=previous_payment_date,
            status=Charge.Status.PAID,
            paid_at=timezone.make_aware(
                datetime.combine(previous_payment_date, time(12)),
            ),
        )

        response = self.client.get(
            reverse("charge-dashboard-summary"),
            {"period": selected_month.strftime("%Y-%m")},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["monthly_revenue"], 150)
        self.assertEqual(response.data["previous_revenue"], 100)
        self.assertEqual(response.data["growth_percentage"], Decimal("50.0"))
        self.assertEqual(
            response.data["period_start"],
            selected_month.isoformat(),
        )
        self.assertEqual(
            response.data["revenue_history"][-1]["period"],
            selected_month.strftime("%Y-%m"),
        )
        self.assertEqual(
            response.data["recent_payments"][0]["id"],
            selected_payment.id,
        )

    def test_dashboard_summary_rejects_invalid_or_future_period(self):
        future_month = add_months(
            timezone.localdate().replace(day=1),
            1,
        )

        invalid_response = self.client.get(
            reverse("charge-dashboard-summary"),
            {"period": "08-2026"},
        )
        future_response = self.client.get(
            reverse("charge-dashboard-summary"),
            {"period": future_month.strftime("%Y-%m")},
        )

        self.assertEqual(
            invalid_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("period", invalid_response.data)
        self.assertEqual(
            future_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertIn("period", future_response.data)

    def test_monthly_revenue_goal_can_be_created_read_and_updated(self):
        period = timezone.localdate().strftime("%Y-%m")
        url = reverse("revenue-goal-list")

        create_response = self.client.post(
            url,
            {"period": period, "target_amount": "10000.00"},
        )
        read_response = self.client.get(url, {"period": period})
        update_response = self.client.post(
            url,
            {"period": period, "target_amount": "12500.00"},
        )

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(read_response.status_code, status.HTTP_200_OK)
        self.assertEqual(read_response.data["target_amount"], "10000.00")
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["target_amount"], "12500.00")
        self.assertEqual(MonthlyRevenueGoal.objects.count(), 1)
        goal = MonthlyRevenueGoal.objects.get()
        self.assertEqual(goal.created_by, self.user)
        self.assertEqual(goal.updated_by, self.user)

    def test_monthly_revenue_goal_validates_period_and_positive_amount(self):
        url = reverse("revenue-goal-list")

        invalid_period_response = self.client.get(
            url,
            {"period": "08-2026"},
        )
        invalid_amount_response = self.client.post(
            url,
            {"period": "2026-08", "target_amount": "0.00"},
        )

        self.assertEqual(
            invalid_period_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(
            invalid_amount_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
