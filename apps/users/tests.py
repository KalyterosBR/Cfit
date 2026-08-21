from rest_framework.test import APITestCase

from apps.academy.models import Academy
from apps.users.models import AcademyUser, AdministrativeAudit, User


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

    def test_trainer_cannot_access_financial_api(self):
        self.client.force_authenticate(self.trainer)
        response = self.client.get("/api/financial/charges/")
        self.assertEqual(response.status_code, 403)

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
