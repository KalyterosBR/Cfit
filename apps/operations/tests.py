from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.academy.models import Academy, Unit
from apps.checkins.models import CheckIn
from apps.operations.models import ClassBooking, CommunicationCampaign, DeviceCommand, DeviceEvent, GroupClass, Lead, MessageDelivery, OnboardingProgress, OperationalIssue, PhysicalAssessment
from apps.schedule.models import ScheduleEvent
from apps.students.models import Student
from apps.users.models import AcademyUser, AdministrativeAudit
from apps.workouts.models import WorkoutPlan


class OperationsApiTests(APITestCase):
    def setUp(self):
        self.academy = Academy.objects.create(name="Cfit Operações")
        self.unit = Unit.objects.create(academy=self.academy, name="Centro", code="centro")
        self.user = get_user_model().objects.create_user(email="operations@cfit.test", password="test-password")
        AcademyUser.objects.create(academy=self.academy, user=self.user, role=AcademyUser.Role.ADMIN, active_unit=self.unit)
        self.student = Student.objects.create(name="Aluno Monitor", cpf="987.654.321-00", academy=self.academy, unit=self.unit)
        self.client.force_authenticate(self.user)

    def test_device_simulator_creates_monitor_event(self):
        created = self.client.post(reverse("access-device-list"), {"unit": self.unit.id, "name": "Simulador recepção", "identifier": "SIM-01", "kind": "simulator"}, format="json")
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        simulated = self.client.post(reverse("access-device-simulate", args=[created.data["id"]]), {"student": self.student.id, "access_result": "allowed"}, format="json")
        self.assertEqual(simulated.status_code, status.HTTP_201_CREATED)
        self.assertTrue(CheckIn.objects.filter(student=self.student, equipment="Simulador recepção").exists())
        monitor = self.client.get(reverse("access-device-monitor"))
        self.assertEqual(monitor.data["events"][0]["student_name"], self.student.name)

    def test_operational_central_syncs_and_resolves_issue_with_history(self):
        response = self.client.get(reverse("operational-issue-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        issue = OperationalIssue.objects.filter(source="retention", source_key=f"student:{self.student.id}").first()
        self.assertIsNotNone(issue)
        updated = self.client.patch(reverse("operational-issue-detail", args=[issue.id]), {
            "status": "resolved", "resolution": "Contato realizado e retorno agendado.",
        }, format="json")
        self.assertEqual(updated.status_code, status.HTTP_200_OK)
        self.assertEqual(updated.data["status"], "resolved")
        self.assertGreaterEqual(len(updated.data["history"]), 2)

    def test_campaign_prepares_audience_without_delivery(self):
        self.student.whatsapp_opt_in = True
        self.student.phone = "11999999999"
        self.student.save(update_fields=["whatsapp_opt_in", "phone"])
        response = self.client.post(reverse("campaign-list"), {"name": "Ativos", "channel": "whatsapp", "segment": "all_active", "message": "Olá"}, format="json")
        prepared = self.client.post(reverse("campaign-prepare", args=[response.data["id"]]))
        self.assertEqual(prepared.data["audience_count"], 1)
        self.assertIn("Nenhuma mensagem foi enviada", prepared.data["delivery"])
        self.assertEqual(CommunicationCampaign.objects.get().status, "ready")
        self.assertEqual(MessageDelivery.objects.get().status, "queued")
        dispatched = self.client.post(reverse("campaign-dispatch", args=[response.data["id"]]))
        self.assertEqual(dispatched.data["deliveries"][0]["status"], "sent")

    def test_assessment_is_scoped_and_onboarding_is_role_based(self):
        assessment = self.client.post(reverse("assessment-list"), {"student": self.student.id, "assessed_at": "2026-08-24", "weight_kg": "70.50", "goal": "Condicionamento"}, format="json")
        self.assertEqual(assessment.status_code, status.HTTP_201_CREATED)
        onboarding = self.client.get(reverse("onboarding-list"))
        self.assertEqual(onboarding.data["role"], AcademyUser.Role.ADMIN)
        step = onboarding.data["steps"][0]["step"]
        completed = self.client.post(reverse("onboarding-complete"), {"step": step, "completed": True}, format="json")
        self.assertEqual(completed.status_code, status.HTTP_200_OK)
        self.assertTrue(OnboardingProgress.objects.get(step=step).completed)

    def test_device_diagnosis_and_assessment_comparison(self):
        device = self.client.post(reverse("access-device-list"), {"unit": self.unit.id, "name": "Diagnóstico", "identifier": "DIAG-01", "kind": "simulator"}, format="json")
        diagnosis = self.client.post(reverse("access-device-diagnose", args=[device.data["id"]]))
        self.assertTrue(diagnosis.data["success"])
        self.assertTrue(DeviceEvent.objects.filter(device_id=device.data["id"], success=True).exists())
        PhysicalAssessment.objects.create(student=self.student, unit=self.unit, evaluator=self.user, assessed_at="2026-01-01", weight_kg="80.00", body_fat_percentage="20.00")
        PhysicalAssessment.objects.create(student=self.student, unit=self.unit, evaluator=self.user, assessed_at="2026-06-01", weight_kg="75.00", body_fat_percentage="17.00")
        comparison = self.client.get(reverse("assessment-comparison"), {"student": self.student.id})
        self.assertEqual(comparison.data["change"]["weight_kg"], -5.0)

    def test_device_update_is_audited_and_cannot_leave_active_scope(self):
        other_academy = Academy.objects.create(name="Outra academia")
        other_unit = Unit.objects.create(academy=other_academy, name="Externa", code="externa")
        created = self.client.post(reverse("access-device-list"), {"unit": self.unit.id, "name": "Leitor", "identifier": "READ-01", "kind": "reader"}, format="json")
        rejected = self.client.patch(reverse("access-device-detail", args=[created.data["id"]]), {"unit": other_unit.id}, format="json")
        self.assertEqual(rejected.status_code, status.HTTP_400_BAD_REQUEST)
        updated = self.client.patch(reverse("access-device-detail", args=[created.data["id"]]), {"active": False}, format="json")
        self.assertEqual(updated.status_code, status.HTTP_200_OK)
        self.assertTrue(AdministrativeAudit.objects.filter(action="access_device.updated", entity_id=str(created.data["id"])).exists())

    def test_assessment_links_workout_review_and_is_audited(self):
        workout = WorkoutPlan.objects.create(student=self.student, unit=self.unit, name="Treino A", objective="Força", instructor=self.user, start_date="2026-08-01")
        response = self.client.post(reverse("assessment-list"), {"student": self.student.id, "workout_plan": workout.id, "assessed_at": "2026-08-24", "next_assessment_at": "2026-09-24", "weight_kg": "70.50"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        workout.refresh_from_db()
        self.assertEqual(str(workout.review_date), "2026-09-24")
        self.assertEqual(response.data["workout_plan_name"], "Treino A")
        self.assertTrue(AdministrativeAudit.objects.filter(action="physical_assessment.created", entity_id=str(response.data["id"])).exists())

    def test_lead_conversion_preserves_origin(self):
        created = self.client.post(reverse("lead-list"), {"name": "Novo aluno", "phone": "11999990000", "source": "Instagram"}, format="json")
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        converted = self.client.post(reverse("lead-convert", args=[created.data["id"]]), {"cpf": "111.222.333-44"}, format="json")
        self.assertEqual(converted.status_code, status.HTTP_200_OK)
        lead = Lead.objects.get(pk=created.data["id"])
        self.assertEqual(lead.stage, "won")
        self.assertEqual(lead.converted_student.academy, self.academy)

    def test_group_class_uses_waitlist_after_capacity(self):
        other = Student.objects.create(name="Aluno Espera", cpf="222.333.444-55", academy=self.academy, unit=self.unit)
        created = self.client.post(reverse("group-class-list"), {"title": "Funcional", "modality": "Funcional", "starts_at": "2026-09-01T10:00:00-03:00", "ends_at": "2026-09-01T11:00:00-03:00", "capacity": 1}, format="json")
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        first = self.client.post(reverse("group-class-book", args=[created.data["id"]]), {"student": self.student.id}, format="json")
        second = self.client.post(reverse("group-class-book", args=[created.data["id"]]), {"student": other.id}, format="json")
        self.assertEqual(first.data["status"], "confirmed")
        self.assertEqual(second.data["status"], "waitlist")
        self.assertEqual(ClassBooking.objects.count(), 2)

        canceled = self.client.patch(reverse("group-class-booking", args=[created.data["id"], first.data["id"]]), {"status": "canceled"}, format="json")
        self.assertEqual(canceled.status_code, status.HTTP_200_OK)
        self.assertEqual(ClassBooking.objects.get(pk=second.data["id"]).status, "confirmed")

    def test_group_class_creates_linked_schedule_series_atomically(self):
        created = self.client.post(reverse("group-class-list"), {
            "title": "Funcional recorrente",
            "modality": "Funcional",
            "starts_at": "2026-09-07T10:00:00-03:00",
            "ends_at": "2026-09-07T11:00:00-03:00",
            "capacity": 12,
            "location": "Sala 1",
            "recurrence": "weekly",
            "recurrence_count": 3,
        }, format="json")

        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.assertEqual(GroupClass.objects.filter(series_id=created.data["series_id"]).count(), 3)
        self.assertEqual(ScheduleEvent.objects.filter(series_id=created.data["series_id"]).count(), 3)
        self.assertEqual(str(created.data["schedule_event"]), str(GroupClass.objects.get(pk=created.data["id"]).schedule_event_id))

        conflict = self.client.post(reverse("group-class-list"), {
            "title": "Conflito futuro",
            "modality": "Bike",
            "starts_at": "2026-09-21T10:30:00-03:00",
            "ends_at": "2026-09-21T11:30:00-03:00",
            "capacity": 8,
            "location": "Sala 2",
        }, format="json")
        self.assertEqual(conflict.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(GroupClass.objects.count(), 3)

    def test_group_class_cancellation_requires_reason_and_syncs_schedule(self):
        created = self.client.post(reverse("group-class-list"), {
            "title": "Bike",
            "modality": "Bike",
            "starts_at": "2026-10-01T10:00:00-03:00",
            "ends_at": "2026-10-01T11:00:00-03:00",
            "capacity": 10,
        }, format="json")
        missing_reason = self.client.post(reverse("group-class-cancel", args=[created.data["id"]]), {}, format="json")
        canceled = self.client.post(reverse("group-class-cancel", args=[created.data["id"]]), {"reason": "Professor indisponível"}, format="json")

        self.assertEqual(missing_reason.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(canceled.status_code, status.HTTP_200_OK)
        group_class = GroupClass.objects.get(pk=created.data["id"])
        self.assertEqual(group_class.status, GroupClass.Status.CANCELED)
        self.assertEqual(group_class.schedule_event.status, ScheduleEvent.Status.CANCELED)

    def test_device_webhook_is_authenticated_and_idempotent(self):
        created = self.client.post(reverse("access-device-list"), {"unit": self.unit.id, "name": "Catraca", "identifier": "CAT-01", "kind": "turnstile"}, format="json")
        rotated = self.client.post(reverse("access-device-rotate-webhook-key", args=[created.data["id"]]))
        self.client.force_authenticate(user=None)
        payload = {"device_identifier": "CAT-01", "idempotency_key": "evt-001", "student": str(self.student.id), "event_type": "access"}
        accepted = self.client.post("/api/operations/device-events/", payload, format="json", HTTP_X_CFIT_DEVICE_KEY=rotated.data["webhook_key"])
        repeated = self.client.post("/api/operations/device-events/", payload, format="json", HTTP_X_CFIT_DEVICE_KEY=rotated.data["webhook_key"])
        self.assertEqual(accepted.status_code, status.HTTP_201_CREATED)
        self.assertEqual(repeated.status_code, status.HTTP_200_OK)
        self.assertEqual(CheckIn.objects.filter(student=self.student, equipment="Catraca").count(), 1)

    def test_connector_pulls_and_confirms_device_commands(self):
        created = self.client.post(reverse("access-device-list"), {
            "unit": self.unit.id,
            "name": "Control iD recepção",
            "identifier": "CID-01",
            "kind": "turnstile",
            "provider": "control_id",
        }, format="json")
        key = self.client.post(reverse("access-device-rotate-webhook-key", args=[created.data["id"]])).data["webhook_key"]
        queued = self.client.post(reverse("access-device-commands", args=[created.data["id"]]), {
            "command_type": "sync_student",
            "payload": {"student_id": str(self.student.id), "name": self.student.name},
        }, format="json")
        self.assertEqual(queued.status_code, status.HTTP_201_CREATED)

        self.client.force_authenticate(user=None)
        pulled = self.client.get("/api/operations/device-commands/?device_identifier=CID-01", HTTP_X_CFIT_DEVICE_KEY=key)
        self.assertEqual(pulled.status_code, status.HTTP_200_OK)
        self.assertEqual(pulled.data["commands"][0]["command_type"], "sync_student")
        confirmed = self.client.post("/api/operations/device-commands/", {
            "device_identifier": "CID-01",
            "command_id": queued.data["id"],
            "success": True,
            "result": {"provider_user_id": 123},
        }, format="json", HTTP_X_CFIT_DEVICE_KEY=key)
        self.assertEqual(confirmed.status_code, status.HTTP_200_OK)
        command = DeviceCommand.objects.get(pk=queued.data["id"])
        self.assertEqual(command.status, DeviceCommand.Status.SUCCEEDED)
        self.assertEqual(command.attempts, 1)
        self.assertEqual(command.result["provider_user_id"], 123)

    def test_connector_rejects_invalid_device_key(self):
        self.client.post(reverse("access-device-list"), {
            "unit": self.unit.id, "name": "Topdata", "identifier": "TOP-01",
            "kind": "turnstile", "provider": "topdata_inner",
        }, format="json")
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/operations/device-commands/?device_identifier=TOP-01", HTTP_X_CFIT_DEVICE_KEY="invalid")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_student_portal_cannot_inherit_administrative_access(self):
        created = self.client.post(f"/api/users/portal/students/{self.student.id}/access/", {"email": "aluno@cfit.test", "password": "initial-pass"}, format="json")
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        portal_user = get_user_model().objects.get(email="aluno@cfit.test")
        self.client.force_authenticate(portal_user)
        profile = self.client.get("/api/users/me/")
        portal = self.client.get("/api/users/portal/me/")
        devices = self.client.get(reverse("access-device-list"))
        self.assertEqual(profile.data["capabilities"], ["portal.view"])
        self.assertEqual(portal.status_code, status.HTTP_200_OK)
        self.assertEqual(devices.status_code, status.HTTP_403_FORBIDDEN)

    def test_portal_can_book_class_and_accept_own_document(self):
        portal_user = get_user_model().objects.create_user(email="portal-actions@cfit.test", password="test", is_student_portal=True)
        self.student.portal_user = portal_user; self.student.save(update_fields=["portal_user"])
        group_class = self.client.post(reverse("group-class-list"), {"title": "Bike", "modality": "Bike", "starts_at": "2026-09-02T10:00:00-03:00", "ends_at": "2026-09-02T11:00:00-03:00", "capacity": 2}, format="json")
        document = self.client.post(reverse("student-document-list"), {"student": self.student.id, "document_type": "authorization", "title": "Uso de imagem"}, format="json")
        self.client.force_authenticate(portal_user)
        booking = self.client.post("/api/users/portal/me/", {"operation": "book_class", "class_id": group_class.data["id"]}, format="json")
        accepted = self.client.post("/api/users/portal/me/", {"operation": "accept_document", "document_id": document.data["id"]}, format="json")
        self.assertEqual(booking.status_code, status.HTTP_201_CREATED)
        self.assertEqual(accepted.status_code, status.HTTP_200_OK)
