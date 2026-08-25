from django.contrib.auth import get_user_model
from datetime import datetime, timedelta
from decimal import Decimal

from django.urls import reverse
from django.utils import timezone

from rest_framework import status
from rest_framework.test import APITestCase

from apps.students.models import (
    MonthlyActiveStudentGoal,
    Student,
    StudentStatusHistory,
)
from apps.checkins.models import CheckIn
from apps.enrollments.models import Enrollment
from apps.financial.models import Charge
from apps.plans.models import Plan


class StudentApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email="students@cfit.test",
            password="test-password",
        )
        Student.objects.create(
            name="Aluno Ativo",
            cpf="777.777.777-77",
        )
        Student.objects.create(
            name="Aluno Inativo",
            cpf="888.888.888-88",
            active=False,
        )

        self.client.force_authenticate(user=self.user)

    def test_dashboard_summary_reconstructs_monthly_active_students(self):
        Student.objects.all().delete()
        student = Student.objects.create(
            name="Aluno Histórico",
            cpf="555.555.555-55",
            active=True,
        )
        Student.objects.filter(pk=student.pk).update(
            created_at=timezone.make_aware(datetime(2026, 6, 10, 12)),
        )
        deactivation = StudentStatusHistory.objects.create(
            student=student,
            event_type=StudentStatusHistory.EventType.DEACTIVATED,
            reason="Pausa",
            actor=self.user,
        )
        StudentStatusHistory.objects.filter(pk=deactivation.pk).update(
            created_at=timezone.make_aware(datetime(2026, 7, 1, 0)),
        )
        reactivation = StudentStatusHistory.objects.create(
            student=student,
            event_type=StudentStatusHistory.EventType.REACTIVATED,
            actor=self.user,
        )
        StudentStatusHistory.objects.filter(pk=reactivation.pk).update(
            created_at=timezone.make_aware(datetime(2026, 8, 10, 12)),
        )

        response = self.client.get(
            reverse("students-dashboard-summary"),
            {"period": "2026-07"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["active_count"], 0)
        self.assertEqual(response.data["previous_active_count"], 1)
        self.assertEqual(response.data["change"], -1)
        self.assertEqual(response.data["change_percentage"], -100.0)
        self.assertEqual(response.data["created_count"], 0)
        self.assertEqual(response.data["deactivated_count"], 1)
        self.assertEqual(response.data["reactivated_count"], 0)
        self.assertEqual(response.data["event_net_change"], -1)
        self.assertEqual(response.data["data_quality"], "complete")

    def test_monthly_active_student_goal_is_created_and_updated(self):
        url = reverse("students-monthly-goal")
        created = self.client.post(
            url,
            {"period": "2026-08", "target_count": 150},
        )
        read = self.client.get(url, {"period": "2026-08"})
        updated = self.client.post(
            url,
            {"period": "2026-08", "target_count": 175},
        )

        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.assertEqual(read.data["target_count"], 150)
        self.assertEqual(updated.status_code, status.HTTP_200_OK)
        self.assertEqual(updated.data["target_count"], 175)
        self.assertEqual(MonthlyActiveStudentGoal.objects.count(), 1)

    def test_list_filters_students_by_active_status(self):
        response = self.client.get(
            reverse("students-list"),
            {"active": "true"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            response.data["results"][0]["name"],
            "Aluno Ativo",
        )

        summary_response = self.client.get(
            reverse("students-summary"),
            {"active": "true"},
        )

        self.assertEqual(summary_response.status_code, status.HTTP_200_OK)
        self.assertEqual(summary_response.data["count"], 1)

    def test_list_accepts_extended_operational_segments(self):
        birthday_student = Student.objects.create(
            name="Aniversariante",
            cpf="999.111.222-33",
            birth_date=timezone.localdate().replace(year=1995),
        )

        response = self.client.get(
            reverse("students-list"),
            {"segment": "birthdays"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [item["id"] for item in response.data["results"]],
            [str(birthday_student.pk)],
        )

    def test_deactivation_requires_reason_and_records_audit_event(self):
        student = Student.objects.get(name="Aluno Ativo")
        url = reverse("students-deactivate", args=[student.id])

        missing_reason_response = self.client.post(url, {})

        self.assertEqual(
            missing_reason_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        student.refresh_from_db()
        self.assertTrue(student.active)

        response = self.client.post(
            url,
            {"reason": "Solicitação do aluno"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        student.refresh_from_db()
        self.assertFalse(student.active)

        event = StudentStatusHistory.objects.get(student=student)
        self.assertEqual(
            event.event_type,
            StudentStatusHistory.EventType.DEACTIVATED,
        )
        self.assertEqual(event.reason, "Solicitação do aluno")
        self.assertEqual(event.actor, self.user)

        timeline_response = self.client.get(
            reverse("students-timeline", args=[student.id])
        )
        timeline_event = next(
            item
            for item in timeline_response.data["events"]
            if item["type"] == "student_deactivated"
        )
        self.assertEqual(timeline_event["actor_name"], self.user.email)
        self.assertEqual(
            timeline_event["description"],
            "Solicitação do aluno",
        )

    def test_reactivation_records_audit_event(self):
        student = Student.objects.get(name="Aluno Inativo")

        response = self.client.post(
            reverse("students-activate", args=[student.id]),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        student.refresh_from_db()
        self.assertTrue(student.active)
        self.assertTrue(
            StudentStatusHistory.objects.filter(
                student=student,
                event_type=StudentStatusHistory.EventType.REACTIVATED,
                actor=self.user,
            ).exists()
        )

    def test_list_search_is_case_and_accent_insensitive_and_normalizes_cpf(self):
        student = Student.objects.create(
            name="Álvaro de Sá",
            cpf="123.456.789-01",
        )

        for search in ["alvaro", "ÁLVARO", "sá", "SA"]:
            response = self.client.get(
                reverse("students-list"),
                {"search": search},
            )

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn(
                str(student.id),
                [str(item["id"]) for item in response.data["results"]],
            )

        cpf_response = self.client.get(
            reverse("students-list"),
            {"search": "12345678901"},
        )

        self.assertEqual(cpf_response.status_code, status.HTTP_200_OK)
        self.assertEqual(cpf_response.data["count"], 1)
        self.assertEqual(
            str(cpf_response.data["results"][0]["id"]),
            str(student.id),
        )

    def test_create_rejects_invalid_contact_and_address_fields(self):
        response = self.client.post(
            reverse("students-list"),
            {
                "name": "Aluno Inválido",
                "cpf": "123",
                "phone": "9999",
                "birth_date": timezone.localdate() + timedelta(days=1),
                "cep": "123",
                "state": "R",
                "emergency_phone": "8888",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cpf", response.data)
        self.assertIn("phone", response.data)
        self.assertIn("birth_date", response.data)
        self.assertIn("cep", response.data)
        self.assertIn("state", response.data)
        self.assertIn("emergency_phone", response.data)

    def test_create_requires_essential_student_fields(self):
        response = self.client.post(
            reverse("students-list"),
            {
                "name": "Aluno sem dados essenciais",
                "cpf": "321.654.987-00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone", response.data)
        self.assertIn("birth_date", response.data)

    def test_operational_summary_uses_complete_student_data(self):
        student = Student.objects.get(name="Aluno Ativo")
        plan = Plan.objects.create(
            name="Plano Performance",
            price=Decimal("149.90"),
            duration_months=12,
        )
        enrollment = Enrollment.objects.create(
            student=student,
            plan=plan,
            contracted_price=Decimal("149.90"),
            start_date=timezone.localdate(),
            due_date=timezone.localdate() + timedelta(days=30),
            status=Enrollment.Status.ACTIVE,
        )
        charge = Charge.objects.create(
            enrollment=enrollment,
            description="Mensalidade",
            amount=Decimal("149.90"),
            due_date=timezone.localdate() + timedelta(days=5),
            competence_date=timezone.localdate(),
            status=Charge.Status.PENDING,
        )
        latest_checkin = CheckIn.objects.create(student=student)
        CheckIn.objects.create(
            student=student,
            checked_in_at=timezone.now() - timedelta(days=31),
        )

        response = self.client.get(
            reverse(
                "students-operational-summary",
                args=[student.id],
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["active_plans"]), 1)
        self.assertEqual(
            str(response.data["active_plans"][0]["id"]),
            str(plan.id),
        )
        self.assertEqual(
            response.data["active_plans"][0]["name"],
            plan.name,
        )
        self.assertEqual(
            str(response.data["next_charge"]["id"]),
            str(charge.id),
        )
        self.assertEqual(response.data["checkins_last_30_days"], 1)
        self.assertEqual(
            response.data["latest_checkin_at"],
            latest_checkin.checked_in_at,
        )

    def test_timeline_combines_operational_events_in_date_order(self):
        student = Student.objects.get(name="Aluno Ativo")
        plan = Plan.objects.create(
            name="Plano Linha do Tempo",
            price=Decimal("99.90"),
            duration_months=1,
        )
        enrollment = Enrollment.objects.create(
            student=student,
            plan=plan,
            contracted_price=Decimal("99.90"),
            start_date=timezone.localdate(),
            due_date=timezone.localdate() + timedelta(days=30),
        )
        charge = Charge.objects.create(
            enrollment=enrollment,
            description="Mensalidade",
            amount=Decimal("99.90"),
            due_date=timezone.localdate() + timedelta(days=5),
            competence_date=timezone.localdate(),
            status=Charge.Status.PAID,
            paid_at=timezone.now() - timedelta(hours=1),
            payment_method=Charge.PaymentMethod.PIX,
        )
        checkin = CheckIn.objects.create(student=student)

        response = self.client.get(
            reverse("students-timeline", args=[student.id])
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        event_types = [event["type"] for event in response.data["events"]]
        self.assertIn("charge_created", event_types)
        self.assertIn("payment_registered", event_types)
        self.assertIn("checkin_registered", event_types)
        self.assertEqual(
            response.data["events"][0]["id"],
            f"checkin-{checkin.id}",
        )
        payment_event = next(
            event
            for event in response.data["events"]
            if event["type"] == "payment_registered"
        )
        self.assertIn("Pix", payment_event["description"])
        self.assertIn(str(charge.amount).replace(".", ","), payment_event["description"])

    def test_list_filters_operational_segments(self):
        student = Student.objects.create(
            name="Aluno Segmentado",
            cpf="999.999.999-99",
        )
        plan = Plan.objects.create(
            name="Plano Segmentado",
            price=Decimal("129.90"),
            duration_months=1,
        )
        enrollment = Enrollment.objects.create(
            student=student,
            plan=plan,
            contracted_price=Decimal("129.90"),
            start_date=timezone.localdate() - timedelta(days=60),
            due_date=timezone.localdate() + timedelta(days=30),
        )
        Charge.objects.create(
            enrollment=enrollment,
            description="Mensalidade atrasada",
            amount=Decimal("129.90"),
            due_date=timezone.localdate() - timedelta(days=20),
            competence_date=timezone.localdate() - timedelta(days=20),
            status=Charge.Status.OVERDUE,
        )
        CheckIn.objects.create(
            student=student,
            checked_in_at=timezone.now() - timedelta(days=31),
        )
        recent_student = Student.objects.create(
            name="Aluno Frequente",
            cpf="666.666.666-66",
        )
        CheckIn.objects.create(student=recent_student)

        defaulting_response = self.client.get(
            reverse("students-list"),
            {"segment": "defaulting"},
        )
        without_plan_response = self.client.get(
            reverse("students-list"),
            {"segment": "without_plan"},
        )
        without_checkin_response = self.client.get(
            reverse("students-list"),
            {"segment": "without_recent_checkin"},
        )

        self.assertEqual(defaulting_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [item["name"] for item in defaulting_response.data["results"]],
            [student.name],
        )
        segmented_data = defaulting_response.data["results"][0]
        self.assertEqual(segmented_data["current_plan_name"], plan.name)
        self.assertEqual(
            segmented_data["next_due_date"],
            timezone.localdate() - timedelta(days=20),
        )
        self.assertEqual(segmented_data["financial_status"], "defaulting")
        self.assertEqual(segmented_data["checkins_last_30_days"], 0)
        self.assertIsNotNone(segmented_data["last_checkin_at"])
        self.assertNotIn(
            student.name,
            [item["name"] for item in without_plan_response.data["results"]],
        )
        self.assertIn(
            student.name,
            [
                item["name"]
                for item in without_checkin_response.data["results"]
            ],
        )
        self.assertNotIn(
            recent_student.name,
            [
                item["name"]
                for item in without_checkin_response.data["results"]
            ],
        )

    def test_health_score_is_explainable_and_filters_students_at_risk(self):
        student = Student.objects.create(
            name="Aluno em Risco",
            cpf="555.555.555-55",
        )
        plan = Plan.objects.create(
            name="Plano de Risco",
            price=Decimal("99.90"),
            duration_months=1,
        )
        enrollment = Enrollment.objects.create(
            student=student,
            plan=plan,
            contracted_price=Decimal("99.90"),
            start_date=timezone.localdate() - timedelta(days=90),
            due_date=timezone.localdate() - timedelta(days=60),
            status=Enrollment.Status.CANCELED,
        )
        Charge.objects.create(
            enrollment=enrollment,
            description="Mensalidade vencida",
            amount=Decimal("99.90"),
            due_date=timezone.localdate() - timedelta(days=30),
            competence_date=timezone.localdate() - timedelta(days=30),
            status=Charge.Status.OVERDUE,
        )

        detail = self.client.get(
            reverse("students-health-score", args=[student.id])
        )
        summary = self.client.get(reverse("students-health-summary"))
        segment = self.client.get(
            reverse("students-list"),
            {"active": "true", "segment": "at_risk"},
        )

        self.assertEqual(detail.status_code, status.HTTP_200_OK)
        self.assertEqual(detail.data["status"], "risk")
        self.assertEqual(detail.data["score"], 0)
        self.assertEqual(
            {factor["code"] for factor in detail.data["factors"]},
            {"without_plan", "defaulting", "never_checked_in", "without_workout"},
        )
        self.assertGreaterEqual(summary.data["risk_count"], 1)
        self.assertIn(
            student.name,
            [item["name"] for item in segment.data["results"]],
        )

    def test_retention_queue_accepts_explainable_interaction(self):
        student = Student.objects.create(name="Aluno Retenção", cpf="666.666.666-66", phone="11999999999")
        queue = self.client.get(reverse("students-retention-queue"))
        self.assertEqual(queue.status_code, status.HTTP_200_OK)
        self.assertIn(str(student.pk), [item["student"] for item in queue.data])

        interaction = self.client.post(
            reverse("students-interactions", args=[student.pk]),
            {"interaction_type": "whatsapp", "status": "completed", "notes": "Aluno respondeu", "next_action": "Retornar amanhã", "responsible": self.user.pk},
            format="json",
        )
        self.assertEqual(interaction.status_code, status.HTTP_201_CREATED)
        self.assertEqual(interaction.data["next_action"], "Retornar amanhã")
