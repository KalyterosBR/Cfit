from rest_framework.test import APITestCase

from apps.academy.models import Academy, Unit
from apps.students.models import Student
from apps.users.models import AcademyUser, AdministrativeAudit, DashboardPreference, OperationalNotificationState, SavedReportView, User
from apps.users.permissions import ROLE_CAPABILITIES
from unittest.mock import patch
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.core.cache import cache


class RolePermissionTests(APITestCase):
    def setUp(self):
        self.academy = Academy.objects.create(name="Cfit Centro")
        self.admin = User.objects.create_user(email="admin@cfit.test", password="test")
        self.admin_membership = AcademyUser.objects.create(
            academy=self.academy, user=self.admin, role=AcademyUser.Role.ADMIN
        )
        self.trainer = User.objects.create_user(email="trainer@cfit.test", password="test")
        AcademyUser.objects.create(
            academy=self.academy, user=self.trainer, role=AcademyUser.Role.TRAINER
        )

    def test_current_user_exposes_role_and_capabilities(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get("/api/users/me/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["role"], AcademyUser.Role.ADMIN)
        self.assertEqual(response.data["capabilities"], ["*"])

    def test_role_capability_matrix_preserves_operational_boundaries(self):
        self.assertIn("*", ROLE_CAPABILITIES[AcademyUser.Role.OWNER])
        self.assertIn("*", ROLE_CAPABILITIES[AcademyUser.Role.ADMIN])
        self.assertIn("settings.view", ROLE_CAPABILITIES[AcademyUser.Role.MANAGER])
        self.assertNotIn("finance.manage", ROLE_CAPABILITIES[AcademyUser.Role.MANAGER])
        self.assertIn("checkins.manage", ROLE_CAPABILITIES[AcademyUser.Role.RECEPTION])
        self.assertNotIn("automations.manage", ROLE_CAPABILITIES[AcademyUser.Role.RECEPTION])
        self.assertIn("workouts.manage", ROLE_CAPABILITIES[AcademyUser.Role.TRAINER])
        self.assertNotIn("finance.view", ROLE_CAPABILITIES[AcademyUser.Role.TRAINER])
        self.assertIn("finance.manage", ROLE_CAPABILITIES[AcademyUser.Role.FINANCIAL])
        self.assertNotIn("students.manage", ROLE_CAPABILITIES[AcademyUser.Role.FINANCIAL])

    def test_trainer_cannot_access_financial_api(self):
        self.client.force_authenticate(self.trainer)
        response = self.client.get("/api/financial/charges/")
        self.assertEqual(response.status_code, 403)

    @patch("apps.checkins.models.CheckIn.objects.filter")
    @patch("apps.financial.models.RecurringPaymentAttempt.objects.filter")
    @patch("apps.financial.models.Charge.objects.filter")
    def test_trainer_notifications_do_not_query_forbidden_domains(self, charge_filter, recurring_filter, checkin_filter):
        self.client.force_authenticate(self.trainer)
        response = self.client.get("/api/users/notifications/")
        self.assertEqual(response.status_code, 200)
        charge_filter.assert_not_called()
        recurring_filter.assert_not_called()
        checkin_filter.assert_not_called()

    def test_admin_role_change_creates_explainable_audit(self):
        target = User.objects.create_user(email="reception@cfit.test", password="test")
        membership = AcademyUser.objects.create(
            academy=self.academy, user=target, role=AcademyUser.Role.RECEPTION
        )
        self.client.force_authenticate(self.admin)
        response = self.client.patch(
            f"/api/users/members/{membership.pk}/",
            {"role": AcademyUser.Role.FINANCIAL, "reason": "Mudança de função"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        audit = AdministrativeAudit.objects.get(entity_id=str(membership.pk))
        self.assertEqual(audit.actor, self.admin)
        self.assertEqual(audit.previous_state["role"], AcademyUser.Role.RECEPTION)
        self.assertEqual(audit.new_state["role"], AcademyUser.Role.FINANCIAL)
        self.assertEqual(audit.reason, "Mudança de função")

    def test_audit_translates_operational_goals_and_entities(self):
        audit = AdministrativeAudit.objects.create(
            academy=self.academy,
            actor=self.admin,
            action="goal.revenue_updated",
            entity_type="monthly_revenue_goal",
            entity_id="goal-1",
            previous_state={"target_amount": "1000.00"},
            new_state={"target_amount": "1500.00"},
        )
        self.client.force_authenticate(self.admin)

        response = self.client.get("/api/users/audits/")

        self.assertEqual(response.status_code, 200)
        item = next(entry for entry in response.data["results"] if entry["id"] == str(audit.id))
        self.assertEqual(item["action_label"], "Meta de receita atualizada")
        self.assertEqual(item["entity_label"], "Meta de receita")
        self.assertEqual(item["changes"][0]["field"], "Valor da meta")
        self.assertEqual(item["changes"][0]["field_key"], "target_amount")

    def test_students_are_isolated_by_academy_and_active_unit(self):
        unit = Unit.objects.create(academy=self.academy, name="Centro", code="centro")
        self.admin_membership.active_unit = unit
        self.admin_membership.save(update_fields=["active_unit"])
        visible = Student.objects.create(
            academy=self.academy, unit=unit, name="Aluno Centro", cpf="111.111.111-11",
        )
        other_academy = Academy.objects.create(name="Outra academia")
        other_unit = Unit.objects.create(academy=other_academy, name="Sul", code="sul")
        Student.objects.create(
            academy=other_academy, unit=other_unit, name="Aluno Externo", cpf="222.222.222-22",
        )

        self.client.force_authenticate(self.admin)
        response = self.client.get("/api/students/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.data["results"]], [str(visible.pk)])

    def test_admin_can_create_member_with_role_and_unit(self):
        unit = Unit.objects.create(academy=self.academy, name="Centro", code="centro")
        self.client.force_authenticate(self.admin)
        response = self.client.post("/api/users/members/", {
            "name": "Nova Recepção", "email": "nova@cfit.test",
            "password": "senha-segura", "role": AcademyUser.Role.RECEPTION,
            "active_unit": unit.pk,
        }, format="json")
        self.assertEqual(response.status_code, 201)
        membership = AcademyUser.objects.get(user__email="nova@cfit.test")
        self.assertEqual(membership.active_unit, unit)
        self.assertTrue(AdministrativeAudit.objects.filter(action="membership.invited").exists())

    def test_dashboard_preferences_are_personal_and_resettable(self):
        self.client.force_authenticate(self.admin)
        baseline = self.client.put("/api/users/preferences/dashboard/", {"target_role": AcademyUser.Role.ADMIN, "hidden_sections": ["attention"], "section_order": ["goals", "indicators", "attention"]}, format="json")
        self.assertEqual(baseline.status_code, 200)
        saved = self.client.put("/api/users/preferences/dashboard/", {"hidden_sections": ["goals"], "section_order": ["attention", "goals", "indicators"]}, format="json")
        self.assertEqual(saved.status_code, 200)
        self.assertEqual(self.client.get("/api/users/preferences/dashboard/").data["source"], "personal")
        self.assertEqual(DashboardPreference.objects.get(user=self.admin).section_order[0], "attention")
        self.assertEqual(self.client.delete("/api/users/preferences/dashboard/").status_code, 204)
        self.assertEqual(self.client.get("/api/users/preferences/dashboard/").data["source"], "role")

    def test_report_views_respect_personal_unit_and_academy_scopes(self):
        unit = Unit.objects.create(academy=self.academy, name="Centro", code="centro")
        self.admin_membership.active_unit = unit
        self.admin_membership.save(update_fields=["active_unit"])
        self.client.force_authenticate(self.admin)
        created = self.client.post("/api/users/report-views/", {"name": "Fechamento", "period": "2026-08", "favorite_questions": ["Receita"], "scope": "unit"}, format="json")
        self.assertEqual(created.status_code, 201)
        view = SavedReportView.objects.get()
        self.assertEqual(view.unit, unit)
        self.assertTrue(AdministrativeAudit.objects.filter(action="report_view.created").exists())

    def test_notifications_can_be_read_and_archived(self):
        self.client.force_authenticate(self.admin)
        marked = self.client.patch("/api/users/notifications/", {"id": "overdue", "action": "read"}, format="json")
        self.assertEqual(marked.status_code, 200)
        archived = self.client.patch("/api/users/notifications/", {"id": "overdue", "action": "archive"}, format="json")
        self.assertEqual(archived.status_code, 200)
        self.assertIsNotNone(OperationalNotificationState.objects.get(user=self.admin, notification_key="overdue").archived_at)

    @patch("apps.users.api.viewsets.validate_turnstile", return_value=True)
    def test_inactive_membership_cannot_start_or_restore_session(self, _validate):
        self.admin_membership.active = False
        self.admin_membership.save(update_fields=["active"])
        login = self.client.post("/api/auth/login/", {"email": self.admin.email, "password": "test", "turnstile_token": "valid"}, format="json")
        self.assertEqual(login.status_code, 403)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.get("/api/users/me/").status_code, 403)

    def test_created_member_must_change_initial_password(self):
        unit = Unit.objects.create(academy=self.academy, name="Norte", code="norte")
        self.client.force_authenticate(self.admin)
        response = self.client.post("/api/users/members/", {"name": "Recepção Nova", "email": "initial@cfit.test", "password": "senha-inicial", "role": AcademyUser.Role.RECEPTION, "active_unit": unit.pk}, format="json")
        self.assertEqual(response.status_code, 201)
        created = User.objects.get(email="initial@cfit.test")
        self.assertTrue(created.must_change_password)
        self.client.force_authenticate(created)
        changed = self.client.post("/api/users/password/change/", {"current_password": "senha-inicial", "new_password": "senha-pessoal-segura"}, format="json")
        self.assertEqual(changed.status_code, 200)
        created.refresh_from_db()
        self.assertFalse(created.must_change_password)
        self.assertTrue(created.check_password("senha-pessoal-segura"))

    def test_password_reset_token_is_single_use(self):
        uid = urlsafe_base64_encode(force_bytes(self.admin.pk))
        token = default_token_generator.make_token(self.admin)
        payload = {"uid": uid, "token": token, "new_password": "nova-senha-segura"}
        first = self.client.post("/api/users/password/reset/confirm/", payload, format="json")
        second = self.client.post("/api/users/password/reset/confirm/", payload, format="json")
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 400)

    def test_admin_cannot_create_owner(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post("/api/users/members/", {"name": "Outro dono", "email": "owner2@cfit.test", "password": "senha-segura", "role": AcademyUser.Role.OWNER}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_operational_settings_notifications_and_reports_are_private_and_scoped(self):
        self.client.force_authenticate(self.admin)
        settings_response = self.client.patch(
            "/api/academies/settings/",
            {"payment_grace_days": 10, "automations_enabled": False},
            format="json",
        )
        notifications = self.client.get("/api/users/notifications/")
        reports = self.client.get("/api/reports/management/", {"period": "2026-08"})
        self.assertEqual(settings_response.status_code, 200)
        self.assertEqual(settings_response.data["payment_grace_days"], 10)
        self.assertEqual(notifications.status_code, 200)
        self.assertEqual(reports.status_code, 200)
        self.assertIn("revenue_by_plan", reports.data)
        self.assertEqual(reports.data["cache"], "miss")
        cached_reports = self.client.get("/api/reports/management/", {"period": "2026-08"})
        self.assertEqual(cached_reports.data["cache"], "hit")

    @patch("apps.users.api.viewsets.validate_turnstile", return_value=True)
    def test_email_two_factor_challenges_before_issuing_jwt(self, _validate):
        self.admin.two_factor_enabled = True
        self.admin.save(update_fields=["two_factor_enabled"])
        payload = {"email": self.admin.email, "password": "test", "turnstile_token": "valid"}
        challenged = self.client.post("/api/auth/login/", payload, format="json")
        self.assertEqual(challenged.status_code, 428)
        code = cache.get(f"cfit:login-otp:{self.admin.pk}")
        authenticated = self.client.post("/api/auth/login/", {**payload, "two_factor_code": code}, format="json")
        self.assertEqual(authenticated.status_code, 200)
        self.assertIn("access", authenticated.data)

    def test_owner_can_transfer_ownership_with_password(self):
        self.admin_membership.role = AcademyUser.Role.OWNER
        self.admin_membership.save(update_fields=["role"])
        target = User.objects.create_user(email="future-owner@cfit.test", password="test")
        target_membership = AcademyUser.objects.create(academy=self.academy, user=target, role=AcademyUser.Role.ADMIN)
        self.client.force_authenticate(self.admin)
        response = self.client.post("/api/users/ownership/transfer/", {"membership": target_membership.id, "password": "test"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.admin_membership.refresh_from_db(); target_membership.refresh_from_db()
        self.assertEqual(self.admin_membership.role, AcademyUser.Role.ADMIN)
        self.assertEqual(target_membership.role, AcademyUser.Role.OWNER)

    @patch("apps.users.api.viewsets.validate_turnstile", return_value=True)
    def test_revoked_session_cannot_use_refresh_token(self, _validate):
        login = self.client.post("/api/auth/login/", {"email": self.admin.email, "password": "test", "turnstile_token": "valid"}, format="json")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        sessions = self.client.get("/api/users/me/sessions/")
        revoked = self.client.delete("/api/users/me/sessions/", {"session": sessions.data[0]["id"]}, format="json")
        self.assertTrue(revoked.data["revoked"])
        self.client.credentials()
        refresh = self.client.post("/api/auth/refresh/", {"refresh": login.data["refresh"]}, format="json")
        self.assertEqual(refresh.status_code, 401)
