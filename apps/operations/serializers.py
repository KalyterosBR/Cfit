from rest_framework import serializers
from django.utils import timezone

from apps.operations.models import AccessDevice, CampaignSegment, ClassBooking, CommunicationCampaign, DeviceCommand, DeviceEvent, GroupClass, Lead, LeadInteraction, LeadProposal, MessageDelivery, OnboardingProgress, OperationalIssue, OperationalIssueHistory, PhysicalAssessment, StudentDocument


class AccessDeviceSerializer(serializers.ModelSerializer):
    unit_name = serializers.CharField(source="unit.name", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    health = serializers.SerializerMethodField()

    class Meta:
        model = AccessDevice
        fields = ["id", "unit", "unit_name", "name", "identifier", "kind", "provider", "credential_env_key", "active", "status", "status_label", "health", "last_seen_at", "last_latency_ms", "firmware_version", "last_error"]
        read_only_fields = ["last_seen_at", "status", "status_label", "health", "last_latency_ms", "firmware_version", "last_error"]

    def get_health(self, obj):
        if not obj.active:
            return {"status": "inactive", "label": "Inativo", "detail": "Dispositivo desativado"}
        details = {"never_connected": "Aguardando o primeiro contato do equipamento", "online": "Comunicação normal", "offline": "Equipamento sem comunicação", "error": obj.last_error or "Falha de comunicação"}
        return {"status": obj.status, "label": obj.get_status_display(), "detail": details.get(obj.status, "Estado desconhecido")}

    def validate_unit(self, unit):
        request = self.context.get("request")
        if request:
            from apps.users.permissions import get_request_scope
            academy, active_unit = get_request_scope(request.user)
            if unit.academy_id != getattr(academy, "id", None) or (active_unit and unit.id != active_unit.id):
                raise serializers.ValidationError("A unidade não pertence ao contexto ativo.")
        return unit


class CommunicationCampaignSerializer(serializers.ModelSerializer):
    audience_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = CommunicationCampaign
        fields = ["id", "name", "channel", "segment", "segment_definition", "message", "template_name", "scheduled_at", "status", "audience_count", "created_at"]
        read_only_fields = ["status"]

    def validate_segment_definition(self, segment_definition):
        request = self.context.get("request")
        if request and segment_definition:
            from apps.users.permissions import get_request_scope
            academy, unit = get_request_scope(request.user)
            if segment_definition.academy_id != getattr(academy, "id", None) or (segment_definition.unit_id and unit and segment_definition.unit_id != unit.id):
                raise serializers.ValidationError("O segmento não pertence ao contexto da sessão.")
        return segment_definition


class PhysicalAssessmentSerializer(serializers.ModelSerializer):
    evaluator_name = serializers.SerializerMethodField()
    workout_plan_name = serializers.CharField(source="workout_plan.name", read_only=True)

    def get_evaluator_name(self, obj):
        return obj.evaluator.get_full_name() or obj.evaluator.email

    class Meta:
        model = PhysicalAssessment
        fields = ["id", "student", "workout_plan", "workout_plan_name", "assessed_at", "next_assessment_at", "weight_kg", "height_cm", "body_fat_percentage", "goal", "notes", "measurements", "blood_pressure", "resting_heart_rate", "photo", "evaluator_name", "created_at"]

    def validate(self, attrs):
        student = attrs.get("student", getattr(self.instance, "student", None))
        workout = attrs.get("workout_plan", getattr(self.instance, "workout_plan", None))
        if workout and student and workout.student_id != student.id:
            raise serializers.ValidationError({"workout_plan": "O treino não pertence ao aluno avaliado."})
        return attrs


class DeviceEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceEvent
        fields = ["id", "event_type", "success", "message", "payload", "idempotency_key", "processed_at", "created_at"]


class DeviceCommandSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceCommand
        fields = ["id", "command_type", "payload", "status", "attempts", "dispatched_at", "completed_at", "result", "last_error", "created_at"]
        read_only_fields = ["status", "attempts", "dispatched_at", "completed_at", "result", "last_error", "created_at"]


class MessageDeliverySerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.name", read_only=True)
    class Meta:
        model = MessageDelivery
        fields = ["id", "student_name", "recipient", "provider", "status", "attempts", "last_error", "sent_at", "external_id", "delivered_at"]


class OnboardingProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnboardingProgress
        fields = ["step", "completed"]


class LeadInteractionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.email", read_only=True)
    interaction_type_label = serializers.CharField(source="get_interaction_type_display", read_only=True)
    class Meta:
        model = LeadInteraction
        fields = ["id", "lead", "interaction_type", "interaction_type_label", "occurred_at", "notes", "created_by_name", "created_at"]
        read_only_fields = ["created_by_name"]


class LeadProposalSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.email", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    class Meta:
        model = LeadProposal
        fields = ["id", "lead", "title", "amount", "status", "status_label", "valid_until", "notes", "created_by_name", "created_at"]


class CampaignSegmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignSegment
        fields = ["id", "name", "criteria", "unit", "created_at"]
        read_only_fields = ["unit"]

    def validate_criteria(self, value):
        allowed = {"status", "plan", "inactive_days", "has_overdue_charges", "unit"}
        unknown = set(value) - allowed
        if unknown:
            raise serializers.ValidationError(f"Critérios não suportados: {', '.join(sorted(unknown))}.")
        return value


class LeadSerializer(serializers.ModelSerializer):
    responsible_name = serializers.CharField(source="responsible.email", read_only=True)
    stage_label = serializers.CharField(source="get_stage_display", read_only=True)
    interactions = LeadInteractionSerializer(many=True, read_only=True)
    proposals = LeadProposalSerializer(many=True, read_only=True)
    class Meta:
        model = Lead
        fields = ["id", "name", "phone", "email", "source", "stage", "stage_label", "responsible", "responsible_name", "next_action_at", "loss_reason", "converted_student", "notes", "interactions", "proposals", "created_at"]
        read_only_fields = ["converted_student"]
        extra_kwargs = {"responsible": {"required": False}}

    def validate_responsible(self, responsible):
        request = self.context.get("request")
        if request:
            from apps.users.permissions import get_request_scope
            academy, _ = get_request_scope(request.user)
            if academy and not responsible.academy_users.filter(academy=academy, active=True).exists():
                raise serializers.ValidationError("O responsável não pertence à academia.")
        return responsible


class ClassBookingSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.name", read_only=True)
    class Meta:
        model = ClassBooking
        fields = ["id", "student", "student_name", "status", "created_at"]


class GroupClassSerializer(serializers.ModelSerializer):
    instructor_name = serializers.CharField(source="instructor.email", read_only=True)
    confirmed_count = serializers.SerializerMethodField()
    waitlist_count = serializers.SerializerMethodField()
    available_spots = serializers.SerializerMethodField()
    occupancy_percentage = serializers.SerializerMethodField()
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    bookings = ClassBookingSerializer(many=True, read_only=True)
    class Meta:
        model = GroupClass
        fields = ["id", "title", "modality", "instructor", "instructor_name", "starts_at", "ends_at", "capacity", "location", "canceled", "status", "status_label", "schedule_event", "series_id", "recurrence", "recurrence_count", "confirmed_count", "waitlist_count", "available_spots", "occupancy_percentage", "bookings"]
        read_only_fields = ["schedule_event", "series_id", "canceled"]
        extra_kwargs = {"instructor": {"required": False}}
    def validate(self, attrs):
        if attrs.get("ends_at") and attrs.get("starts_at") and attrs["ends_at"] <= attrs["starts_at"]:
            raise serializers.ValidationError({"ends_at": "O término deve ocorrer depois do início."})
        recurrence_count = attrs.get("recurrence_count", getattr(self.instance, "recurrence_count", 1))
        if recurrence_count > 52:
            raise serializers.ValidationError({"recurrence_count": "Crie no máximo 52 ocorrências por série."})
        return attrs
    def get_confirmed_count(self, obj): return obj.bookings.filter(status__in=["confirmed", "attended"]).count()
    def get_waitlist_count(self, obj): return obj.bookings.filter(status="waitlist").count()
    def get_available_spots(self, obj): return max(obj.capacity - self.get_confirmed_count(obj), 0)
    def get_occupancy_percentage(self, obj): return round(self.get_confirmed_count(obj) / obj.capacity * 100, 1) if obj.capacity else 0


class StudentDocumentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.name", read_only=True)
    class Meta:
        model = StudentDocument
        fields = ["id", "student", "student_name", "enrollment", "document_type", "title", "version", "content_snapshot", "file", "expires_at", "requires_acceptance", "accepted_at", "accepted_by_name", "archived_at", "created_at"]
        read_only_fields = ["accepted_at", "accepted_by_name", "archived_at"]

    def validate(self, attrs):
        request = self.context.get("request")
        student = attrs.get("student") or getattr(self.instance, "student", None)
        if request and student:
            from apps.users.permissions import get_request_scope
            academy, unit = get_request_scope(request.user)
            if student.academy_id != getattr(academy, "id", None) or (unit and student.unit_id != unit.id):
                raise serializers.ValidationError({"student": "Aluno fora do contexto ativo."})
        enrollment = attrs.get("enrollment")
        if enrollment and enrollment.student_id != student.id:
            raise serializers.ValidationError({"enrollment": "A matrícula não pertence ao aluno."})
        return attrs


class OperationalIssueHistorySerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    class Meta:
        model = OperationalIssueHistory
        fields = ["id", "event", "message", "previous_state", "new_state", "actor_name", "created_at"]
    def get_actor_name(self, obj): return (obj.actor.get_full_name() or obj.actor.email) if obj.actor else "Sistema Cfit"


class OperationalIssueSerializer(serializers.ModelSerializer):
    priority_label = serializers.CharField(source="get_priority_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    overdue = serializers.SerializerMethodField()
    history = OperationalIssueHistorySerializer(many=True, read_only=True)
    class Meta:
        model = OperationalIssue
        fields = ["id","source","source_key","source_url","title","detail","next_action","priority","priority_label","status","status_label","assigned_to","assigned_to_name","due_at","overdue","resolution","history","created_at","updated_at"]
        read_only_fields = ["source","source_key","source_url","title","detail","next_action","created_at","updated_at"]
    def get_assigned_to_name(self,obj): return (obj.assigned_to.get_full_name() or obj.assigned_to.email) if obj.assigned_to else None
    def get_overdue(self,obj): return bool(obj.due_at and obj.due_at < timezone.now() and obj.status not in {"resolved","dismissed"})
