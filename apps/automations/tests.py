from rest_framework.test import APITestCase

from apps.academy.models import Academy, Unit
from apps.automations.models import AutomationExecution, AutomationRule
from apps.users.models import AcademyUser, AdministrativeAudit, User


class AutomationAndUnitTests(APITestCase):
    def setUp(self):
        self.academy = Academy.objects.create(name="Cfit Centro")
        self.user = User.objects.create_user(email="admin@cfit.test", password="test")
        self.membership = AcademyUser.objects.create(
            academy=self.academy, user=self.user, role=AcademyUser.Role.ADMIN
        )
        self.client.force_authenticate(self.user)

    def test_creates_and_triggers_audited_automation(self):
        response = self.client.post("/api/automations/rules/", {
            "name": "Recuperar cobrança", "event_type": "overdue_charge",
            "action_description": "Criar contato para o financeiro",
        }, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertTrue(AdministrativeAudit.objects.filter(action="automation.created").exists())
        trigger = self.client.post(
            f"/api/automations/rules/{response.data['id']}/trigger/",
            {"entity_type": "charge", "entity_id": "charge-1"}, format="json",
        )
        self.assertEqual(trigger.status_code, 201)
        self.assertEqual(AutomationExecution.objects.get().entity_id, "charge-1")

    def test_unit_is_scoped_and_can_be_selected(self):
        response = self.client.post("/api/academies/units/", {"name": "Unidade Norte", "code": "norte"}, format="json")
        self.assertEqual(response.status_code, 201)
        unit = Unit.objects.get()
        selection = self.client.post("/api/users/me/active-unit/", {"unit": unit.pk}, format="json")
        self.assertEqual(selection.status_code, 200)
        self.membership.refresh_from_db()
        self.assertEqual(self.membership.active_unit, unit)
