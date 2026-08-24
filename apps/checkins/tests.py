from datetime import datetime, timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone

from rest_framework import status
from rest_framework.test import APITestCase

from apps.checkins.models import AccessPolicy, CheckIn, MonthlyCheckInGoal
from apps.students.models import Student
from apps.academy.models import Academy, Unit
from apps.users.models import AcademyUser


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

    def test_access_policy_is_scoped_to_active_unit(self):
        academy = Academy.objects.create(name="Cfit Política")
        unit = Unit.objects.create(academy=academy, name="Centro", code="centro")
        AcademyUser.objects.create(academy=academy, user=self.user, role=AcademyUser.Role.ADMIN, active_unit=unit)
        self.client.force_authenticate(self.user)
        response = self.client.patch(
            reverse("checkin-access-policy"),
            {"block_defaulting_students": False, "instructions": "Validar documento"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["block_defaulting_students"])

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

    def test_manual_contingency_can_override_access_policy_with_reason(self):
        academy = Academy.objects.create(name="Cfit Contingência")
        unit = Unit.objects.create(academy=academy, name="Centro", code="centro")
        AcademyUser.objects.create(
            academy=academy,
            user=self.user,
            role=AcademyUser.Role.RECEPTION,
            active_unit=unit,
        )
        self.student.academy = academy
        self.student.unit = unit
        self.student.save(update_fields=["academy", "unit"])
        AccessPolicy.objects.create(
            unit=unit,
            require_active_enrollment=True,
            allow_manual_contingency=True,
        )
        self.client.force_authenticate(user=self.user)

        blocked_response = self.client.post(
            self.list_url,
            {"student": str(self.student.id), "source": CheckIn.Source.MANUAL},
            format="json",
        )
        self.assertEqual(blocked_response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.client.post(
            self.list_url,
            {
                "student": str(self.student.id),
                "source": CheckIn.Source.MANUAL,
                "contingency_reason": "Liberação autorizada pelo gerente",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        checkin = CheckIn.objects.get(pk=response.data["id"])
        self.assertEqual(checkin.authorized_by, self.user)
        self.assertEqual(
            checkin.contingency_reason,
            "Liberação autorizada pelo gerente",
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
        self.assertGreaterEqual(response.data["period_count"], 1)
        self.assertEqual(
            response.data["period"],
            timezone.localdate().strftime("%Y-%m"),
        )
        self.assertEqual(
            response.data["recent_checkins"][0]["id"],
            str(current.id),
        )
        self.assertIn(
            str(yesterday.id),
            [item["id"] for item in response.data["recent_checkins"]],
        )

    def test_dashboard_summary_accepts_a_monthly_period(self):
        selected_period = "2026-06"
        CheckIn.objects.create(
            student=self.student,
            checked_in_at=timezone.make_aware(
                datetime(2026, 6, 15, 12, 0),
            ),
        )
        CheckIn.objects.create(
            student=self.student,
            checked_in_at=timezone.make_aware(
                datetime(2026, 7, 1, 12, 0),
            ),
        )
        self.client.force_authenticate(user=self.user)

        response = self.client.get(
            reverse("checkin-dashboard-summary"),
            {"period": selected_period},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["period"], selected_period)
        self.assertEqual(response.data["period_count"], 1)

    def test_monthly_checkin_goal_can_be_created_read_and_updated(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("checkin-monthly-goal")

        create_response = self.client.post(
            url,
            {"period": "2026-08", "target_count": 500},
        )
        read_response = self.client.get(url, {"period": "2026-08"})
        update_response = self.client.post(
            url,
            {"period": "2026-08", "target_count": 650},
        )

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(read_response.data["target_count"], 500)
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["target_count"], 650)
        self.assertEqual(MonthlyCheckInGoal.objects.count(), 1)
        goal = MonthlyCheckInGoal.objects.get()
        self.assertEqual(goal.created_by, self.user)
        self.assertEqual(goal.updated_by, self.user)

    def test_monthly_checkin_goal_rejects_invalid_values(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("checkin-monthly-goal")

        invalid_period = self.client.get(url, {"period": "08-2026"})
        invalid_target = self.client.post(
            url,
            {"period": "2026-08", "target_count": 0},
        )

        self.assertEqual(invalid_period.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(invalid_target.status_code, status.HTTP_400_BAD_REQUEST)

    def test_global_checkins_filter_by_period_and_source(self):
        today = timezone.localdate()
        matching = CheckIn.objects.create(
            student=self.student,
            source=CheckIn.Source.ACCESS_CONTROL,
        )
        CheckIn.objects.create(
            student=self.other_student,
            checked_in_at=timezone.now() - timedelta(days=5),
        )
        self.client.force_authenticate(user=self.user)

        response = self.client.get(
            self.list_url,
            {
                "checked_in_from": today.isoformat(),
                "checked_in_to": today.isoformat(),
                "source": CheckIn.Source.ACCESS_CONTROL,
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["id"], str(matching.id))

    def test_blocked_access_requires_reason_and_is_summarized(self):
        self.client.force_authenticate(user=self.user)
        invalid = self.client.post(
            self.list_url,
            {
                "student": str(self.student.id),
                "source": CheckIn.Source.ACCESS_CONTROL,
                "access_result": CheckIn.AccessResult.BLOCKED,
            },
            format="json",
        )
        valid = self.client.post(
            self.list_url,
            {
                "student": str(self.student.id),
                "source": CheckIn.Source.ACCESS_CONTROL,
                "access_result": CheckIn.AccessResult.BLOCKED,
                "block_reason": "Matrícula inativa",
                "equipment": "Catraca principal",
            },
            format="json",
        )
        summary = self.client.get(
            reverse("checkin-access-summary"),
            {"access_result": CheckIn.AccessResult.BLOCKED},
        )

        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(valid.status_code, status.HTTP_201_CREATED)
        self.assertEqual(valid.data["access_result_label"], "Bloqueado")
        self.assertEqual(summary.status_code, status.HTTP_200_OK)
        self.assertEqual(summary.data["blocked_count"], 1)
        self.assertEqual(summary.data["total_count"], 1)
