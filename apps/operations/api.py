from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
import os
import secrets
import uuid
from datetime import timedelta

from django.contrib.auth.hashers import check_password, make_password
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.checkins.api.serializers import CheckInSerializer
from apps.checkins.models import CheckIn
from apps.operations.models import AccessDevice, ClassBooking, CommunicationCampaign, DeviceCommand, DeviceEvent, GroupClass, Lead, MessageDelivery, OnboardingProgress, OperationalIssue, OperationalIssueHistory, PhysicalAssessment, StudentDocument
from apps.operations.serializers import AccessDeviceSerializer, ClassBookingSerializer, CommunicationCampaignSerializer, DeviceCommandSerializer, DeviceEventSerializer, GroupClassSerializer, LeadSerializer, MessageDeliverySerializer, OnboardingProgressSerializer, OperationalIssueSerializer, PhysicalAssessmentSerializer, StudentDocumentSerializer
from apps.operations.services.issues import sync_operational_issues
from apps.operations.providers import CommunicationAdapter, DeviceAdapter
from apps.schedule.models import ScheduleEvent
from apps.students.models import Student
from apps.students.selectors import get_student_health_score
from apps.users.models import AdministrativeAudit
from apps.users.permissions import ScopedCapability, get_active_membership, get_request_scope


class AccessDeviceViewSet(viewsets.ModelViewSet):
    serializer_class = AccessDeviceSerializer
    permission_classes = [ScopedCapability]
    read_capability = "checkins.view"
    write_capability = "checkins.manage"

    def get_queryset(self):
        academy, unit = get_request_scope(self.request.user)
        queryset = AccessDevice.objects.select_related("unit").filter(academy=academy)
        return queryset.filter(unit=unit) if unit else queryset

    def perform_create(self, serializer):
        academy, active_unit = get_request_scope(self.request.user)
        unit = serializer.validated_data["unit"]
        if unit.academy_id != academy.id:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"unit": "A unidade não pertence à academia."})
        device = serializer.save(academy=academy)
        AdministrativeAudit.objects.create(academy=academy, actor=self.request.user, action="access_device.created", entity_type="access_device", entity_id=str(device.pk), new_state={"name": device.name})

    def perform_update(self, serializer):
        device = self.get_object()
        previous = {"name": device.name, "unit": str(device.unit_id), "active": device.active, "provider": device.provider}
        updated = serializer.save()
        AdministrativeAudit.objects.create(academy=updated.academy, actor=self.request.user, action="access_device.updated", entity_type="access_device", entity_id=str(updated.pk), previous_state=previous, new_state={"name": updated.name, "unit": str(updated.unit_id), "active": updated.active, "provider": updated.provider})

    @action(detail=True, methods=["post"])
    def simulate(self, request, pk=None):
        device = self.get_object()
        if device.kind != AccessDevice.Kind.SIMULATOR:
            return Response({"detail": "Somente dispositivos simuladores aceitam eventos manuais."}, status=400)
        student = Student.objects.filter(pk=request.data.get("student"), academy=device.academy, unit=device.unit).first()
        if not student:
            return Response({"student": ["Aluno não encontrado nesta unidade."]}, status=400)
        device.last_seen_at = timezone.now()
        device.status = "online"
        device.last_error = ""
        device.save(update_fields=["last_seen_at", "status", "last_error", "updated_at"])
        checkin = CheckIn.objects.create(student=student, unit=device.unit, source=CheckIn.Source.ACCESS_CONTROL, access_result=request.data.get("access_result", CheckIn.AccessResult.ALLOWED), block_reason=request.data.get("block_reason", ""), equipment=device.name, location=device.unit.name, device_response="Evento recebido pelo simulador Cfit")
        DeviceEvent.objects.create(device=device, event_type="access", success=True, message="Evento simulado processado", payload={"student": str(student.pk), "checkin": str(checkin.pk)})
        return Response(CheckInSerializer(checkin).data, status=201)

    @action(detail=True, methods=["post"])
    def heartbeat(self, request, pk=None):
        device = self.get_object()
        device.last_seen_at = timezone.now()
        device.status = "online"
        device.last_error = ""
        device.save(update_fields=["last_seen_at", "status", "last_error", "updated_at"])
        DeviceEvent.objects.create(device=device, event_type="heartbeat", success=True, message="Heartbeat recebido")
        return Response(self.get_serializer(device).data)

    @action(detail=True, methods=["post"])
    def diagnose(self, request, pk=None):
        device = self.get_object()
        success, message = DeviceAdapter().diagnose(device)
        device.status = "online" if success and device.kind == "simulator" else "offline" if success else "error"
        device.last_error = "" if success else message
        device.save(update_fields=["status", "last_error", "updated_at"])
        DeviceEvent.objects.create(device=device, event_type="heartbeat" if success else "error", success=success, message=message)
        sync_operational_issues(device.academy, device.unit)
        return Response({"success": success, "message": message, "device": self.get_serializer(device).data})

    @action(detail=True, methods=["get"])
    def events(self, request, pk=None):
        return Response(DeviceEventSerializer(self.get_object().events.all()[:50], many=True).data)

    @action(detail=True, methods=["get", "post"])
    def commands(self, request, pk=None):
        device = self.get_object()
        if request.method == "GET":
            return Response(DeviceCommandSerializer(device.commands.all()[:100], many=True).data)
        serializer = DeviceCommandSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        command = serializer.save(device=device)
        return Response(DeviceCommandSerializer(command).data, status=201)

    @action(detail=False, methods=["get"])
    def monitor(self, request):
        academy, unit = get_request_scope(request.user)
        events = CheckIn.objects.select_related("student", "unit").filter(student__academy=academy)
        if unit:
            events = events.filter(unit=unit)
        return Response({"updated_at": timezone.now(), "events": CheckInSerializer(events[:30], many=True).data})

    @action(detail=True, methods=["post"], url_path="rotate-webhook-key")
    def rotate_webhook_key(self, request, pk=None):
        device = self.get_object()
        key = secrets.token_urlsafe(32)
        device.webhook_key_hash = make_password(key)
        device.save(update_fields=["webhook_key_hash", "updated_at"])
        return Response({"webhook_key": key, "detail": "Guarde esta chave: ela não será exibida novamente."})


class DeviceWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = str(request.data.get("device_identifier", ""))
        device = authenticate_device(request, identifier)
        if not device:
            return Response({"detail": "Dispositivo não autorizado."}, status=401)
        idempotency_key = str(request.data.get("idempotency_key", "")).strip()
        if not idempotency_key:
            return Response({"idempotency_key": ["Informe uma chave idempotente."]}, status=400)
        previous = DeviceEvent.objects.filter(idempotency_key=idempotency_key).first()
        if previous:
            return Response({"detail": "Evento já processado.", "event": str(previous.id)}, status=200)
        event_type = request.data.get("event_type", "access")
        device.last_seen_at = timezone.now(); device.status = "online"; device.last_error = ""
        if request.data.get("latency_ms") is not None:
            try:
                device.last_latency_ms = max(0, int(request.data["latency_ms"]))
            except (TypeError, ValueError):
                pass
        device.firmware_version = str(request.data.get("firmware_version", device.firmware_version))[:80]
        device.save(update_fields=["last_seen_at", "status", "last_error", "last_latency_ms", "firmware_version", "updated_at"])
        event = DeviceEvent.objects.create(device=device, event_type=event_type, idempotency_key=idempotency_key, processed_at=timezone.now(), payload=request.data)
        if event_type == "heartbeat":
            return Response({"event": str(event.id), "detail": "Heartbeat recebido."}, status=201)
        students = Student.objects.filter(academy=device.academy, unit=device.unit)
        student_id = request.data.get("student")
        identifier = request.data.get("student_identifier")
        try:
            student = students.filter(pk=uuid.UUID(str(student_id))).first() if student_id else None
        except (ValueError, TypeError, AttributeError):
            student = None
        if not student and identifier:
            student = students.filter(identifier=identifier).first()
        if not student:
            event.success = False; event.message = "Aluno não encontrado"; event.save(update_fields=["success", "message", "updated_at"])
            return Response({"student": ["Aluno não encontrado nesta unidade."]}, status=400)
        checkin = CheckIn.objects.create(student=student, unit=device.unit, source=CheckIn.Source.ACCESS_CONTROL, equipment=device.name, location=device.unit.name, access_result=request.data.get("access_result", CheckIn.AccessResult.ALLOWED), block_reason=str(request.data.get("block_reason", ""))[:255], device_response=str(request.data.get("device_response", "Evento autenticado e processado pelo webhook Cfit"))[:255])
        event.message = "Acesso processado"; event.payload = {**request.data, "checkin": str(checkin.id)}; event.save(update_fields=["message", "payload", "updated_at"])
        return Response({"event": str(event.id), "checkin": str(checkin.id)}, status=201)


def authenticate_device(request, identifier):
    key = request.headers.get("X-Cfit-Device-Key", "")
    for device in AccessDevice.objects.filter(identifier=identifier, active=True).select_related("academy", "unit"):
        if device.webhook_key_hash and check_password(key, device.webhook_key_hash):
            return device
    return None


class DeviceCommandView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        identifier = str(request.query_params.get("device_identifier", ""))
        device = authenticate_device(request, identifier)
        if not device:
            return Response({"detail": "Dispositivo não autorizado."}, status=401)
        now = timezone.now()
        commands = list(device.commands.filter(status=DeviceCommand.Status.QUEUED)[:20])
        for command in commands:
            command.status = DeviceCommand.Status.DISPATCHED
            command.attempts += 1
            command.dispatched_at = now
            command.updated_at = now
        if commands:
            DeviceCommand.objects.bulk_update(commands, ["status", "attempts", "dispatched_at", "updated_at"])
        device.last_seen_at = now
        device.status = "online"
        device.last_error = ""
        device.save(update_fields=["last_seen_at", "status", "last_error", "updated_at"])
        return Response({"commands": DeviceCommandSerializer(commands, many=True).data})

    def post(self, request):
        identifier = str(request.data.get("device_identifier", ""))
        device = authenticate_device(request, identifier)
        if not device:
            return Response({"detail": "Dispositivo não autorizado."}, status=401)
        command = device.commands.filter(pk=request.data.get("command_id")).first()
        if not command:
            return Response({"command_id": ["Comando não encontrado para este dispositivo."]}, status=404)
        succeeded = request.data.get("success") is True
        command.status = DeviceCommand.Status.SUCCEEDED if succeeded else DeviceCommand.Status.FAILED
        command.completed_at = timezone.now()
        command.result = request.data.get("result") if isinstance(request.data.get("result"), dict) else {}
        command.last_error = "" if succeeded else str(request.data.get("error", "Falha não detalhada."))[:255]
        command.save(update_fields=["status", "completed_at", "result", "last_error", "updated_at"])
        return Response(DeviceCommandSerializer(command).data)


class CommunicationWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        configured = os.getenv("COMMUNICATION_WEBHOOK_SECRET", "")
        supplied = request.headers.get("X-Cfit-Webhook-Secret", "")
        if not configured or not secrets.compare_digest(configured, supplied):
            return Response({"detail": "Webhook não autorizado."}, status=401)
        delivery = MessageDelivery.objects.filter(external_id=request.data.get("external_id")).first()
        if not delivery:
            return Response({"detail": "Entrega não encontrada."}, status=404)
        provider_status = request.data.get("status")
        if provider_status not in {"sent", "delivered", "failed"}:
            return Response({"status": ["Status inválido."]}, status=400)
        delivery.status = provider_status
        delivery.delivered_at = timezone.now() if provider_status == "delivered" else delivery.delivered_at
        delivery.last_error = str(request.data.get("error", ""))[:255] if provider_status == "failed" else ""
        delivery.save(update_fields=["status", "delivered_at", "last_error", "updated_at"])
        return Response({"detail": "Status atualizado."})


class CommunicationCampaignViewSet(viewsets.ModelViewSet):
    serializer_class = CommunicationCampaignSerializer
    permission_classes = [ScopedCapability]
    read_capability = "students.view"
    write_capability = "students.manage"

    def get_queryset(self):
        academy, unit = get_request_scope(self.request.user)
        return CommunicationCampaign.objects.filter(academy=academy).filter(Q(unit=unit) | Q(unit__isnull=True))

    def audience(self, segment):
        academy, unit = get_request_scope(self.request.user)
        students = Student.objects.filter(academy=academy)
        if unit: students = students.filter(unit=unit)
        if segment == "inactive": return students.filter(active=False)
        if segment == "defaulting": return students.filter(enrollments__charges__status="overdue").distinct()
        if segment == "at_risk": return [student for student in students.filter(active=True) if get_student_health_score(student)["status"] == "risk"]
        return students.filter(active=True)

    def perform_create(self, serializer):
        academy, unit = get_request_scope(self.request.user)
        serializer.save(academy=academy, unit=unit, created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def prepare(self, request, pk=None):
        campaign = self.get_object()
        campaign.status = CommunicationCampaign.Status.READY
        campaign.save(update_fields=["status", "updated_at"])
        audience = self.audience(campaign.segment)
        audience = list(audience)
        for student in audience:
            recipient = student.email if campaign.channel == "email" else student.phone
            consent = student.email_opt_in if campaign.channel == "email" else student.whatsapp_opt_in
            MessageDelivery.objects.update_or_create(campaign=campaign, student=student, defaults={"recipient": recipient or "", "provider": request.data.get("provider", "sandbox"), "status": "queued" if recipient and consent else "skipped", "last_error": "" if recipient and consent else "Sem contato ou consentimento para este canal"})
        return Response({"status": campaign.status, "audience_count": len(audience), "queued_count": campaign.deliveries.filter(status="queued").count(), "delivery": "Fila preparada. Nenhuma mensagem foi enviada ainda."})

    @action(detail=True, methods=["post"], url_path="dispatch", url_name="dispatch")
    def dispatch_campaign(self, request, pk=None):
        campaign = self.get_object()
        campaign.status = CommunicationCampaign.Status.PROCESSING
        campaign.save(update_fields=["status", "updated_at"])
        for delivery in campaign.deliveries.filter(status__in=["queued", "failed"]):
            delivery.attempts += 1
            try:
                success, message, external_id = CommunicationAdapter().send(delivery)
            except Exception as error:
                success, message, external_id = False, str(error)[:255], ""
            delivery.status = "sent" if success else "failed"
            delivery.last_error = "" if success else message
            delivery.sent_at = timezone.now() if success else None
            delivery.external_id = external_id
            delivery.save(update_fields=["attempts", "status", "last_error", "sent_at", "external_id", "updated_at"])
        campaign.status = CommunicationCampaign.Status.COMPLETED
        campaign.save(update_fields=["status", "updated_at"])
        return Response({"campaign": CommunicationCampaignSerializer(campaign).data, "deliveries": MessageDeliverySerializer(campaign.deliveries.select_related("student"), many=True).data})

    @action(detail=True, methods=["get"])
    def deliveries(self, request, pk=None):
        return Response(MessageDeliverySerializer(self.get_object().deliveries.select_related("student"), many=True).data)


class PhysicalAssessmentViewSet(viewsets.ModelViewSet):
    serializer_class = PhysicalAssessmentSerializer
    permission_classes = [ScopedCapability]
    read_capability = "students.view"
    write_capability = "workouts.manage"

    def get_queryset(self):
        academy, unit = get_request_scope(self.request.user)
        queryset = PhysicalAssessment.objects.select_related("student", "evaluator", "workout_plan").filter(student__academy=academy)
        if unit: queryset = queryset.filter(unit=unit)
        if self.request.query_params.get("student"): queryset = queryset.filter(student_id=self.request.query_params["student"])
        return queryset

    def perform_create(self, serializer):
        academy, unit = get_request_scope(self.request.user)
        student = serializer.validated_data["student"]
        if student.academy_id != academy.id or (unit and student.unit_id != unit.id):
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"student": "Aluno fora do contexto ativo."})
        assessment = serializer.save(unit=unit, evaluator=self.request.user)
        if assessment.workout_plan and assessment.next_assessment_at:
            assessment.workout_plan.review_date = assessment.next_assessment_at
            assessment.workout_plan.save(update_fields=["review_date", "updated_at"])
        AdministrativeAudit.objects.create(academy=academy, actor=self.request.user, action="physical_assessment.created", entity_type="physical_assessment", entity_id=str(assessment.pk), new_state={"student": str(student.pk), "assessed_at": str(assessment.assessed_at), "workout_plan": str(assessment.workout_plan_id or "")})

    def perform_update(self, serializer):
        assessment = self.get_object()
        previous = {"assessed_at": str(assessment.assessed_at), "next_assessment_at": str(assessment.next_assessment_at or ""), "workout_plan": str(assessment.workout_plan_id or "")}
        updated = serializer.save()
        if updated.workout_plan and updated.next_assessment_at:
            updated.workout_plan.review_date = updated.next_assessment_at
            updated.workout_plan.save(update_fields=["review_date", "updated_at"])
        AdministrativeAudit.objects.create(academy=updated.student.academy, actor=self.request.user, action="physical_assessment.updated", entity_type="physical_assessment", entity_id=str(updated.pk), previous_state=previous, new_state={"assessed_at": str(updated.assessed_at), "next_assessment_at": str(updated.next_assessment_at or ""), "workout_plan": str(updated.workout_plan_id or "")})

    @action(detail=False, methods=["get"])
    def comparison(self, request):
        student_id = request.query_params.get("student")
        assessments = list(self.get_queryset().filter(student_id=student_id).order_by("assessed_at"))
        return Response({"student": student_id, "history": PhysicalAssessmentSerializer(assessments, many=True).data, "change": ({"weight_kg": float(assessments[-1].weight_kg or 0) - float(assessments[0].weight_kg or 0), "body_fat_percentage": float(assessments[-1].body_fat_percentage or 0) - float(assessments[0].body_fat_percentage or 0)} if len(assessments) >= 2 else None)})


class OnboardingViewSet(viewsets.ViewSet):
    permission_classes = [ScopedCapability]
    read_capability = "units.view"
    write_capability = "units.view"

    def list(self, request):
        membership = get_active_membership(request.user)
        role_steps = {
            "OWNER": ["complete_academy", "create_unit", "invite_team", "create_plan", "review_dashboard"],
            "ADMIN": ["review_permissions", "configure_access", "configure_finance", "review_automations"],
            "MANAGER": ["review_dashboard", "review_retention", "review_schedule"],
            "RECEPTION": ["create_student", "create_enrollment", "register_checkin"],
            "TRAINER": ["review_students", "create_workout", "create_assessment"],
            "FINANCIAL": ["review_overdue", "register_payment", "review_cashflow"],
        }
        steps = role_steps.get(membership.role, []) if membership else []
        progress = {item.step: item.completed for item in OnboardingProgress.objects.filter(academy=membership.academy, user=request.user)} if membership else {}
        if not membership:
            return Response({"role": "admin", "steps": []})

        academy = membership.academy
        automatic = {
            "complete_academy": bool(academy.onboarding_completed_at),
            "create_unit": academy.units.filter(active=True).exists(),
            "invite_team": academy.academy_users.filter(active=True).exclude(user=request.user).exists(),
            "create_plan": academy.plans.filter(available_for_enrollment=True).exists(),
        }
        destinations = {
            "complete_academy": "/settings#academy",
            "create_unit": "/units",
            "invite_team": "/settings#users",
            "create_plan": "/plans",
            "review_dashboard": "/dashboard",
            "review_permissions": "/settings#users",
            "configure_access": "/operations",
            "configure_finance": "/settings#finance",
            "review_automations": "/automations",
            "review_retention": "/reports",
            "review_schedule": "/schedule",
        }
        items = [{
            "step": step,
            "completed": automatic.get(step, progress.get(step, False)),
            "automatic": step in automatic,
            "href": destinations.get(step),
        } for step in steps]
        return Response({"role": membership.role, "steps": items})

    @action(detail=False, methods=["post"])
    def complete(self, request):
        membership = get_active_membership(request.user)
        step = str(request.data.get("step", "")).strip()
        automatic_steps = {"complete_academy", "create_unit", "invite_team", "create_plan"}
        if not membership or not step:
            return Response({"step": ["Informe uma etapa válida."]}, status=400)
        if step in automatic_steps:
            return Response({"step": ["Esta etapa é concluída automaticamente pelos dados reais."]}, status=400)
        item, _ = OnboardingProgress.objects.update_or_create(academy=membership.academy, user=request.user, step=step, defaults={"completed": bool(request.data.get("completed", True))})
        return Response(OnboardingProgressSerializer(item).data)


class LeadViewSet(viewsets.ModelViewSet):
    serializer_class = LeadSerializer
    permission_classes = [ScopedCapability]
    read_capability = "students.view"
    write_capability = "students.manage"
    def get_queryset(self):
        academy, unit = get_request_scope(self.request.user)
        queryset = Lead.objects.select_related("responsible", "converted_student").filter(academy=academy)
        if unit: queryset = queryset.filter(unit=unit)
        if self.request.query_params.get("stage"): queryset = queryset.filter(stage=self.request.query_params["stage"])
        return queryset
    def perform_create(self, serializer):
        academy, unit = get_request_scope(self.request.user)
        serializer.save(academy=academy, unit=unit, responsible=serializer.validated_data.get("responsible", self.request.user))
    def perform_update(self, serializer):
        lead = self.get_object(); previous = {"stage": lead.stage, "responsible": str(lead.responsible_id), "next_action_at": lead.next_action_at.isoformat() if lead.next_action_at else None}
        updated = serializer.save()
        AdministrativeAudit.objects.create(academy=updated.academy, actor=self.request.user, action="lead.updated", entity_type="lead", entity_id=str(updated.id), previous_state=previous, new_state={"stage": updated.stage, "responsible": str(updated.responsible_id), "next_action_at": updated.next_action_at.isoformat() if updated.next_action_at else None}, reason=updated.loss_reason if updated.stage == "lost" else "")
    @action(detail=True, methods=["post"])
    def convert(self, request, pk=None):
        lead = self.get_object()
        if lead.converted_student: return Response({"detail": "Lead já convertido."}, status=400)
        cpf = str(request.data.get("cpf", "")).strip()
        if not cpf:
            return Response({"cpf": ["Informe o CPF para converter o lead."]}, status=400)
        if Student.objects.filter(cpf=cpf).exists():
            return Response({"cpf": ["Já existe um aluno com este CPF."]}, status=400)
        student = Student.objects.create(academy=lead.academy, unit=lead.unit, name=lead.name, cpf=cpf, phone=lead.phone, email=lead.email, birth_date=request.data.get("birth_date"))
        lead.stage = "won"; lead.converted_student = student; lead.save(update_fields=["stage", "converted_student", "updated_at"])
        AdministrativeAudit.objects.create(academy=lead.academy, actor=request.user, action="lead.converted", entity_type="lead", entity_id=str(lead.id), new_state={"student": str(student.id), "source": lead.source})
        return Response({"lead": self.get_serializer(lead).data, "student": str(student.pk)})

    @action(detail=False, methods=["get"])
    def summary(self, request):
        queryset = self.get_queryset()
        stages = {item["stage"]: item["count"] for item in queryset.values("stage").annotate(count=Count("id"))}
        total = queryset.count(); won = stages.get("won", 0)
        return Response({"total": total, "stages": stages, "conversion_rate": round((won / total * 100), 1) if total else 0})


class GroupClassViewSet(viewsets.ModelViewSet):
    serializer_class = GroupClassSerializer
    permission_classes = [ScopedCapability]
    read_capability = "schedule.view"
    write_capability = "schedule.manage"
    def get_queryset(self):
        academy, unit = get_request_scope(self.request.user)
        queryset = GroupClass.objects.select_related("instructor", "unit", "schedule_event").prefetch_related("bookings__student").filter(academy=academy)
        if unit:
            queryset = queryset.filter(unit=unit)
        search = self.request.query_params.get("search", "").strip()
        status_value = self.request.query_params.get("status")
        modality = self.request.query_params.get("modality", "").strip()
        instructor = self.request.query_params.get("instructor")
        date_from = self.request.query_params.get("from")
        date_to = self.request.query_params.get("to")
        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(modality__icontains=search) | Q(location__icontains=search))
        if status_value in GroupClass.Status.values:
            queryset = queryset.filter(status=status_value)
        if modality:
            queryset = queryset.filter(modality__iexact=modality)
        if instructor:
            queryset = queryset.filter(instructor_id=instructor)
        if date_from:
            queryset = queryset.filter(starts_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(starts_at__date__lte=date_to)
        return queryset

    def _validate_instructor(self, instructor, academy):
        if not instructor.academy_users.filter(academy=academy, active=True).exists() and instructor != self.request.user:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"instructor": "O professor não pertence à academia da sessão."})

    def _ensure_available(self, *, unit, instructor, starts_at, ends_at, location, exclude_event=None):
        conflicts = ScheduleEvent.objects.filter(
            unit=unit, professional=instructor, starts_at__lt=ends_at, ends_at__gt=starts_at,
        ).exclude(status=ScheduleEvent.Status.CANCELED)
        if exclude_event:
            conflicts = conflicts.exclude(pk=exclude_event)
        if conflicts.exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"starts_at": "O professor já possui um compromisso neste horário."})
        if location:
            room_conflicts = ScheduleEvent.objects.filter(
                unit=unit, location__iexact=location, starts_at__lt=ends_at, ends_at__gt=starts_at,
            ).exclude(status=ScheduleEvent.Status.CANCELED)
            if exclude_event:
                room_conflicts = room_conflicts.exclude(pk=exclude_event)
            if room_conflicts.exists():
                from rest_framework.exceptions import ValidationError
                raise ValidationError({"location": "A sala ou local já está ocupado neste horário."})

    def perform_create(self, serializer):
        academy, unit = get_request_scope(self.request.user)
        if not unit:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"unit": "Selecione uma unidade ativa antes de criar uma turma."})
        instructor = serializer.validated_data.get("instructor", self.request.user)
        self._validate_instructor(instructor, academy)
        starts_at = serializer.validated_data["starts_at"]
        ends_at = serializer.validated_data["ends_at"]
        location = serializer.validated_data.get("location", "")
        recurrence = serializer.validated_data.get("recurrence", "none")
        recurrence_count = serializer.validated_data.get("recurrence_count", 1)
        interval = timedelta(days=1 if recurrence == "daily" else 7)
        occurrences = recurrence_count if recurrence != "none" else 1
        for offset in range(occurrences):
            self._ensure_available(
                unit=unit,
                instructor=instructor,
                starts_at=starts_at + interval * offset,
                ends_at=ends_at + interval * offset,
                location=location,
            )
        series_id = uuid.uuid4()
        with transaction.atomic():
            group_class = None
            for offset in range(occurrences):
                occurrence_start = starts_at + interval * offset
                occurrence_end = ends_at + interval * offset
                event = ScheduleEvent.objects.create(
                    unit=unit,
                    title=serializer.validated_data["title"],
                    event_type=ScheduleEvent.EventType.CLASS,
                    status=ScheduleEvent.Status.SCHEDULED,
                    starts_at=occurrence_start,
                    ends_at=occurrence_end,
                    professional=instructor,
                    location=location,
                    notes=f"Turma de {serializer.validated_data['modality']}",
                    recurrence=recurrence,
                    recurrence_count=occurrences,
                    series_id=series_id,
                )
                values = {
                    **serializer.validated_data,
                    "starts_at": occurrence_start,
                    "ends_at": occurrence_end,
                    "academy": academy,
                    "unit": unit,
                    "instructor": instructor,
                    "schedule_event": event,
                    "series_id": series_id,
                }
                if offset == 0:
                    group_class = serializer.save(**{key: value for key, value in values.items() if key not in serializer.validated_data})
                else:
                    GroupClass.objects.create(**values)
            AdministrativeAudit.objects.create(
                academy=academy,
                actor=self.request.user,
                action="group_class.created",
                entity_type="group_class",
                entity_id=str(group_class.pk),
                new_state={"title": group_class.title, "occurrences": occurrences, "capacity": group_class.capacity},
            )

    def perform_update(self, serializer):
        group_class = self.get_object()
        previous = {"title": group_class.title, "starts_at": group_class.starts_at.isoformat(), "ends_at": group_class.ends_at.isoformat(), "capacity": group_class.capacity, "status": group_class.status}
        instructor = serializer.validated_data.get("instructor", group_class.instructor)
        self._validate_instructor(instructor, group_class.academy)
        starts_at = serializer.validated_data.get("starts_at", group_class.starts_at)
        ends_at = serializer.validated_data.get("ends_at", group_class.ends_at)
        location = serializer.validated_data.get("location", group_class.location)
        self._ensure_available(unit=group_class.unit, instructor=instructor, starts_at=starts_at, ends_at=ends_at, location=location, exclude_event=group_class.schedule_event_id)
        with transaction.atomic():
            updated = serializer.save(instructor=instructor)
            event = updated.schedule_event
            if event:
                event.title = updated.title
                event.starts_at = updated.starts_at
                event.ends_at = updated.ends_at
                event.professional = updated.instructor
                event.location = updated.location
                event.status = ScheduleEvent.Status.CANCELED if updated.status in {GroupClass.Status.CANCELED, GroupClass.Status.INACTIVE} else updated.status
                event.save(update_fields=["title", "starts_at", "ends_at", "professional", "location", "status", "updated_at"])
            AdministrativeAudit.objects.create(academy=updated.academy, actor=self.request.user, action="group_class.updated", entity_type="group_class", entity_id=str(updated.pk), previous_state=previous, new_state={"title": updated.title, "starts_at": updated.starts_at.isoformat(), "ends_at": updated.ends_at.isoformat(), "capacity": updated.capacity, "status": updated.status})
    @action(detail=True, methods=["post"])
    def book(self, request, pk=None):
        group_class = self.get_object()
        if group_class.status in {GroupClass.Status.CANCELED, GroupClass.Status.COMPLETED, GroupClass.Status.INACTIVE}:
            return Response({"detail": "Esta turma não aceita novas inscrições."}, status=400)
        student = Student.objects.filter(pk=request.data.get("student"), academy=group_class.academy, unit=group_class.unit).first()
        if not student: return Response({"student": ["Aluno não encontrado nesta unidade."]}, status=400)
        confirmed = group_class.bookings.filter(status__in=["confirmed", "attended"]).count()
        booking, _ = ClassBooking.objects.update_or_create(group_class=group_class, student=student, defaults={"status": "confirmed" if confirmed < group_class.capacity else "waitlist"})
        AdministrativeAudit.objects.create(academy=group_class.academy, actor=request.user, action="group_class.booking_updated", entity_type="class_booking", entity_id=str(booking.pk), new_state={"class": str(group_class.pk), "student": str(student.pk), "status": booking.status})
        return Response(ClassBookingSerializer(booking).data, status=201)
    @action(detail=True, methods=["patch"], url_path=r"bookings/(?P<booking_id>[^/.]+)")
    def booking(self, request, pk=None, booking_id=None):
        group_class = self.get_object(); booking = group_class.bookings.get(pk=booking_id); previous_status = booking.status; serializer = ClassBookingSerializer(booking, data=request.data, partial=True); serializer.is_valid(raise_exception=True); saved = serializer.save()
        if saved.status == "canceled":
            waiting = group_class.bookings.filter(status="waitlist").order_by("created_at").first()
            if waiting:
                waiting.status = "confirmed"; waiting.save(update_fields=["status", "updated_at"])
        AdministrativeAudit.objects.create(academy=group_class.academy, actor=request.user, action="group_class.attendance_updated", entity_type="class_booking", entity_id=str(saved.pk), previous_state={"status": previous_status}, new_state={"status": saved.status})
        return Response(ClassBookingSerializer(saved).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        group_class = self.get_object()
        reason = str(request.data.get("reason", "")).strip()
        if not reason:
            return Response({"reason": ["Informe o motivo do cancelamento."]}, status=400)
        scope = request.data.get("scope", "occurrence")
        targets = GroupClass.objects.filter(pk=group_class.pk)
        if scope == "series" and group_class.series_id:
            targets = GroupClass.objects.filter(series_id=group_class.series_id)
        now = timezone.now()
        for target in targets.select_related("schedule_event"):
            target.canceled = True; target.status = GroupClass.Status.CANCELED; target.save(update_fields=["canceled", "status", "updated_at"])
            target.bookings.filter(status__in=["confirmed", "waitlist"]).update(status="canceled", updated_at=now)
            if target.schedule_event:
                target.schedule_event.status = ScheduleEvent.Status.CANCELED
                target.schedule_event.save(update_fields=["status", "updated_at"])
        AdministrativeAudit.objects.create(academy=group_class.academy, actor=request.user, action="group_class.canceled", entity_type="group_class", entity_id=str(group_class.pk), new_state={"scope": scope, "count": targets.count()}, reason=reason)
        return Response(self.get_serializer(group_class).data)

    @action(detail=True, methods=["post"])
    def duplicate(self, request, pk=None):
        group_class = self.get_object()
        starts_at = request.data.get("starts_at"); ends_at = request.data.get("ends_at")
        serializer = self.get_serializer(data={"title": group_class.title, "modality": group_class.modality, "starts_at": starts_at, "ends_at": ends_at, "capacity": group_class.capacity, "location": group_class.location, "instructor": group_class.instructor_id})
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        copy = serializer.instance
        AdministrativeAudit.objects.create(academy=group_class.academy, actor=request.user, action="group_class.duplicated", entity_type="group_class", entity_id=str(copy.pk), previous_state={"original": str(group_class.pk)}, new_state={"starts_at": copy.starts_at.isoformat()})
        return Response(self.get_serializer(copy).data, status=201)

    @action(detail=True, methods=["post"])
    def replace(self, request, pk=None):
        group_class = self.get_object()
        starts_at = request.data.get("starts_at")
        ends_at = request.data.get("ends_at")
        serializer = self.get_serializer(data={"title": request.data.get("title", f"Reposição · {group_class.title}"), "modality": group_class.modality, "starts_at": starts_at, "ends_at": ends_at, "capacity": group_class.capacity, "location": request.data.get("location", group_class.location), "instructor": request.data.get("instructor", group_class.instructor_id)})
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        replacement = serializer.instance
        AdministrativeAudit.objects.create(academy=group_class.academy, actor=request.user, action="group_class.replacement_created", entity_type="group_class", entity_id=str(replacement.pk), previous_state={"original": str(group_class.pk)}, new_state={"starts_at": replacement.starts_at.isoformat()})
        return Response(self.get_serializer(replacement).data, status=201)

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        group_class = self.get_object()
        reason = str(request.data.get("reason", "")).strip()
        if not reason:
            return Response({"reason": ["Informe o motivo da inativação."]}, status=400)
        group_class.status = GroupClass.Status.INACTIVE
        group_class.canceled = True
        group_class.save(update_fields=["status", "canceled", "updated_at"])
        if group_class.schedule_event:
            group_class.schedule_event.status = ScheduleEvent.Status.CANCELED
            group_class.schedule_event.save(update_fields=["status", "updated_at"])
        AdministrativeAudit.objects.create(academy=group_class.academy, actor=request.user, action="group_class.deactivated", entity_type="group_class", entity_id=str(group_class.pk), reason=reason)
        return Response(self.get_serializer(group_class).data)


class OperationalIssueViewSet(viewsets.ModelViewSet):
    serializer_class = OperationalIssueSerializer
    permission_classes = [ScopedCapability]
    read_capability = "operations.view"
    write_capability = "operations.manage"
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        academy, unit = get_request_scope(self.request.user)
        if self.action == "list" and academy:
            sync_operational_issues(academy, unit)
        queryset = OperationalIssue.objects.select_related("assigned_to").prefetch_related("history__actor").filter(academy=academy)
        if unit: queryset = queryset.filter(Q(unit=unit) | Q(unit__isnull=True))
        for field in ("source", "priority", "status", "assigned_to"):
            value = self.request.query_params.get(field)
            if value: queryset = queryset.filter(**{field: value})
        search = self.request.query_params.get("search", "").strip()
        if search: queryset = queryset.filter(Q(title__icontains=search)|Q(detail__icontains=search)|Q(next_action__icontains=search))
        if self.request.query_params.get("overdue") == "true": queryset = queryset.filter(due_at__lt=timezone.now()).exclude(status__in=["resolved","dismissed"])
        return queryset

    def perform_update(self, serializer):
        issue=self.get_object(); previous={"status":issue.status,"priority":issue.priority,"assigned_to":str(issue.assigned_to_id or "")}
        assigned=serializer.validated_data.get("assigned_to",issue.assigned_to)
        if assigned and not assigned.academy_users.filter(academy=issue.academy,active=True).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"assigned_to":"Responsável fora da academia."})
        updated=serializer.save()
        if updated.status in {"resolved","dismissed"}:
            if not updated.resolution.strip():
                from rest_framework.exceptions import ValidationError
                raise ValidationError({"resolution":"Informe a resolução."})
            updated.resolved_at=timezone.now(); updated.save(update_fields=["resolved_at","updated_at"])
        OperationalIssueHistory.objects.create(issue=updated,actor=self.request.user,event="updated",message=str(self.request.data.get("comment","")).strip()[:255],previous_state=previous,new_state={"status":updated.status,"priority":updated.priority,"assigned_to":str(updated.assigned_to_id or "")})
        AdministrativeAudit.objects.create(academy=updated.academy,actor=self.request.user,action="operational_issue.updated",entity_type="operational_issue",entity_id=str(updated.pk),previous_state=previous,new_state={"status":updated.status,"priority":updated.priority},reason=updated.resolution or str(self.request.data.get("comment","")))

    @action(detail=False, methods=["get"])
    def options(self, request):
        academy,_=get_request_scope(request.user)
        members=academy.academy_users.filter(active=True).select_related("user") if academy else []
        return Response({"responsibles":[{"id":str(item.user_id),"name":item.user.get_full_name() or item.user.email} for item in members],"sources":[["financial","Financeiro"],["retention","Retenção"],["access","Acesso"],["commercial","Comercial"],["documents","Documentos"],["schedule","Agenda"],["automations","Automações"]]})


class StudentDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentDocumentSerializer
    permission_classes = [ScopedCapability]
    read_capability = "students.view"
    write_capability = "students.manage"
    def get_queryset(self):
        academy, unit = get_request_scope(self.request.user); queryset = StudentDocument.objects.select_related("student").filter(student__academy=academy)
        if unit: queryset = queryset.filter(student__unit=unit)
        if self.request.query_params.get("student"): queryset = queryset.filter(student_id=self.request.query_params["student"])
        return queryset
    def perform_create(self, serializer):
        student = serializer.validated_data["student"]; title = serializer.validated_data["title"]
        latest = StudentDocument.objects.filter(student=student, title=title).order_by("-version").first()
        document = serializer.save(created_by=self.request.user, version=(latest.version + 1 if latest else 1))
        AdministrativeAudit.objects.create(academy=student.academy, actor=self.request.user, action="document.created", entity_type="student_document", entity_id=str(document.id), new_state={"student": str(student.id), "title": title, "version": document.version})
    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        document = self.get_object(); document.accepted_at = timezone.now(); document.accepted_by_name = str(request.data.get("name", "")).strip(); document.acceptance_ip = request.META.get("REMOTE_ADDR");
        if not document.accepted_by_name: return Response({"name": ["Informe o nome de quem aceitou."]}, status=400)
        document.save(update_fields=["accepted_at", "accepted_by_name", "acceptance_ip", "updated_at"]); return Response(self.get_serializer(document).data)

    @action(detail=False, methods=["get"], url_path="expiry-summary")
    def expiry_summary(self, request):
        today = timezone.localdate(); limit = today + timedelta(days=30)
        queryset = self.get_queryset().filter(expires_at__isnull=False, expires_at__lte=limit)
        return Response({"expired": queryset.filter(expires_at__lt=today).count(), "expiring": queryset.filter(expires_at__gte=today).count(), "results": self.get_serializer(queryset[:50], many=True).data})
