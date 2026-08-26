from django.conf import settings
from django.db import models

from apps.core.base.models import BaseModel


class AccessDevice(BaseModel):
    class Provider(models.TextChoices):
        SIMULATOR = "simulator", "Simulador Cfit"
        CONTROL_ID = "control_id", "Control iD"
        TOPDATA_INNER = "topdata_inner", "Topdata Inner"
        TOPDATA_FACIAL = "topdata_facial", "Topdata Facial/Easy"

    class Kind(models.TextChoices):
        TURNSTILE = "turnstile", "Catraca"
        READER = "reader", "Leitor"
        FACIAL = "facial", "Reconhecimento facial"
        SIMULATOR = "simulator", "Simulador"

    academy = models.ForeignKey("academy.Academy", on_delete=models.PROTECT, related_name="access_devices")
    unit = models.ForeignKey("academy.Unit", on_delete=models.PROTECT, related_name="access_devices")
    name = models.CharField(max_length=120)
    identifier = models.CharField(max_length=80)
    kind = models.CharField(max_length=20, choices=Kind.choices, default=Kind.SIMULATOR)
    active = models.BooleanField(default=True)
    last_seen_at = models.DateTimeField(null=True, blank=True)
    provider = models.CharField(max_length=40, choices=Provider.choices, default=Provider.SIMULATOR)
    credential_env_key = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=[("never_connected", "Nunca conectado"), ("online", "Online"), ("offline", "Offline"), ("error", "Com falha")], default="never_connected")
    last_error = models.CharField(max_length=255, blank=True)
    last_latency_ms = models.PositiveIntegerField(null=True, blank=True)
    firmware_version = models.CharField(max_length=80, blank=True)
    webhook_key_hash = models.CharField(max_length=128, blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["academy", "identifier"], name="unique_device_identifier_per_academy")]


class CommunicationCampaign(BaseModel):
    class Channel(models.TextChoices):
        WHATSAPP = "whatsapp", "WhatsApp"
        EMAIL = "email", "E-mail"

    class Status(models.TextChoices):
        DRAFT = "draft", "Rascunho"
        READY = "ready", "Pronta para integração"
        PROCESSING = "processing", "Processando"
        COMPLETED = "completed", "Concluída"

    academy = models.ForeignKey("academy.Academy", on_delete=models.PROTECT, related_name="communication_campaigns")
    unit = models.ForeignKey("academy.Unit", on_delete=models.PROTECT, null=True, blank=True, related_name="communication_campaigns")
    name = models.CharField(max_length=120)
    channel = models.CharField(max_length=20, choices=Channel.choices)
    segment = models.CharField(max_length=30, choices=[("at_risk", "Em risco"), ("defaulting", "Inadimplentes"), ("inactive", "Inativos"), ("all_active", "Todos ativos")])
    message = models.TextField()
    template_name = models.CharField(max_length=100, blank=True)
    scheduled_at = models.DateTimeField(null=True, blank=True, db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_campaigns")


class PhysicalAssessment(BaseModel):
    student = models.ForeignKey("students.Student", on_delete=models.PROTECT, related_name="physical_assessments")
    unit = models.ForeignKey("academy.Unit", on_delete=models.PROTECT, null=True, blank=True, related_name="physical_assessments")
    workout_plan = models.ForeignKey("workouts.WorkoutPlan", on_delete=models.PROTECT, null=True, blank=True, related_name="physical_assessments")
    assessed_at = models.DateField()
    next_assessment_at = models.DateField(null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    height_cm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    body_fat_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    goal = models.CharField(max_length=160, blank=True)
    notes = models.TextField(blank=True)
    measurements = models.JSONField(default=dict, blank=True)
    blood_pressure = models.CharField(max_length=20, blank=True)
    resting_heart_rate = models.PositiveSmallIntegerField(null=True, blank=True)
    photo = models.ImageField(upload_to="assessments/photos/", null=True, blank=True)
    evaluator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="physical_assessments")

    class Meta:
        ordering = ["-assessed_at", "-created_at"]


class OnboardingProgress(BaseModel):
    academy = models.ForeignKey("academy.Academy", on_delete=models.PROTECT, related_name="onboarding_progress")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="onboarding_progress")
    step = models.CharField(max_length=80)
    completed = models.BooleanField(default=False)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["academy", "user", "step"], name="unique_onboarding_step")]


class DeviceEvent(BaseModel):
    device = models.ForeignKey(AccessDevice, on_delete=models.PROTECT, related_name="events")
    event_type = models.CharField(max_length=30, choices=[("heartbeat", "Heartbeat"), ("access", "Acesso"), ("error", "Erro")])
    success = models.BooleanField(default=True)
    message = models.CharField(max_length=255, blank=True)
    payload = models.JSONField(default=dict, blank=True)
    idempotency_key = models.CharField(max_length=100, null=True, blank=True, unique=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]


class DeviceCommand(BaseModel):
    class Type(models.TextChoices):
        SYNC_STUDENT = "sync_student", "Sincronizar aluno"
        REMOVE_STUDENT = "remove_student", "Remover aluno"
        RELEASE_ENTRY = "release_entry", "Liberar entrada"
        RELEASE_EXIT = "release_exit", "Liberar saída"
        SYNC_ACCESS_RULES = "sync_access_rules", "Sincronizar regras"
        COLLECT_LOGS = "collect_logs", "Coletar registros"

    class Status(models.TextChoices):
        QUEUED = "queued", "Na fila"
        DISPATCHED = "dispatched", "Entregue ao conector"
        SUCCEEDED = "succeeded", "Executado"
        FAILED = "failed", "Falhou"

    device = models.ForeignKey(AccessDevice, on_delete=models.PROTECT, related_name="commands")
    command_type = models.CharField(max_length=40, choices=Type.choices)
    payload = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.QUEUED, db_index=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    dispatched_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    result = models.JSONField(default=dict, blank=True)
    last_error = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["created_at"]


class MessageDelivery(BaseModel):
    campaign = models.ForeignKey(CommunicationCampaign, on_delete=models.PROTECT, related_name="deliveries")
    student = models.ForeignKey("students.Student", on_delete=models.PROTECT, related_name="message_deliveries")
    recipient = models.CharField(max_length=255)
    provider = models.CharField(max_length=40, default="sandbox")
    status = models.CharField(max_length=20, choices=[("queued", "Na fila"), ("sent", "Enviada"), ("delivered", "Entregue"), ("failed", "Falhou"), ("skipped", "Ignorada")], default="queued")
    attempts = models.PositiveSmallIntegerField(default=0)
    last_error = models.CharField(max_length=255, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    external_id = models.CharField(max_length=120, blank=True, db_index=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["campaign", "student"], name="unique_campaign_student_delivery")]


class Lead(BaseModel):
    academy = models.ForeignKey("academy.Academy", on_delete=models.PROTECT, related_name="leads")
    unit = models.ForeignKey("academy.Unit", on_delete=models.PROTECT, null=True, blank=True, related_name="leads")
    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    source = models.CharField(max_length=60, blank=True)
    stage = models.CharField(max_length=20, choices=[("new", "Novo"), ("contacted", "Contatado"), ("visit", "Visita agendada"), ("proposal", "Proposta"), ("won", "Convertido"), ("lost", "Perdido")], default="new")
    responsible = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="responsible_leads")
    next_action_at = models.DateTimeField(null=True, blank=True)
    loss_reason = models.CharField(max_length=255, blank=True)
    converted_student = models.ForeignKey("students.Student", on_delete=models.PROTECT, null=True, blank=True, related_name="source_leads")
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["stage", "-created_at"]


class GroupClass(BaseModel):
    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Agendada"
        IN_PROGRESS = "in_progress", "Em andamento"
        COMPLETED = "completed", "Realizada"
        CANCELED = "canceled", "Cancelada"
        INACTIVE = "inactive", "Inativa"

    academy = models.ForeignKey("academy.Academy", on_delete=models.PROTECT, related_name="group_classes")
    unit = models.ForeignKey("academy.Unit", on_delete=models.PROTECT, related_name="group_classes")
    title = models.CharField(max_length=120)
    modality = models.CharField(max_length=80)
    instructor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="group_classes")
    starts_at = models.DateTimeField(db_index=True)
    ends_at = models.DateTimeField()
    capacity = models.PositiveSmallIntegerField(default=10)
    location = models.CharField(max_length=120, blank=True)
    canceled = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED, db_index=True)
    schedule_event = models.OneToOneField(
        "schedule.ScheduleEvent",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="group_class",
    )
    series_id = models.UUIDField(null=True, blank=True, db_index=True)
    recurrence = models.CharField(
        max_length=20,
        choices=[("none", "Não repetir"), ("daily", "Diariamente"), ("weekly", "Semanalmente")],
        default="none",
    )
    recurrence_count = models.PositiveSmallIntegerField(default=1)

    class Meta:
        ordering = ["starts_at"]


class ClassBooking(BaseModel):
    group_class = models.ForeignKey(GroupClass, on_delete=models.PROTECT, related_name="bookings")
    student = models.ForeignKey("students.Student", on_delete=models.PROTECT, related_name="class_bookings")
    status = models.CharField(max_length=20, choices=[("confirmed", "Confirmada"), ("waitlist", "Lista de espera"), ("attended", "Presente"), ("absent", "Ausente"), ("canceled", "Cancelada")], default="confirmed")

    class Meta:
        constraints = [models.UniqueConstraint(fields=["group_class", "student"], name="unique_student_class_booking")]


class StudentDocument(BaseModel):
    student = models.ForeignKey("students.Student", on_delete=models.PROTECT, related_name="documents")
    enrollment = models.ForeignKey("enrollments.Enrollment", on_delete=models.PROTECT, null=True, blank=True, related_name="documents")
    document_type = models.CharField(max_length=30, choices=[("contract", "Contrato"), ("medical", "Atestado"), ("authorization", "Autorização"), ("other", "Outro")])
    title = models.CharField(max_length=150)
    version = models.PositiveIntegerField(default=1)
    content_snapshot = models.TextField(blank=True)
    file = models.FileField(upload_to="student_documents/", null=True, blank=True)
    expires_at = models.DateField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    accepted_by_name = models.CharField(max_length=120, blank=True)
    acceptance_ip = models.GenericIPAddressField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_student_documents")

    class Meta:
        ordering = ["-created_at"]


class LoginSession(BaseModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="login_sessions")
    token_jti = models.CharField(max_length=64, unique=True)
    refresh_jti = models.CharField(max_length=64, blank=True, db_index=True)
    user_agent = models.CharField(max_length=255, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    last_seen_at = models.DateTimeField(auto_now=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-last_seen_at"]


class OperationalIssue(BaseModel):
    class Priority(models.TextChoices):
        CRITICAL = "critical", "Crítica"
        HIGH = "high", "Alta"
        MEDIUM = "medium", "Média"
        LOW = "low", "Baixa"

    class Status(models.TextChoices):
        OPEN = "open", "Aberta"
        IN_PROGRESS = "in_progress", "Em andamento"
        RESOLVED = "resolved", "Resolvida"
        DISMISSED = "dismissed", "Descartada"

    academy = models.ForeignKey("academy.Academy", on_delete=models.PROTECT, related_name="operational_issues")
    unit = models.ForeignKey("academy.Unit", on_delete=models.PROTECT, null=True, blank=True, related_name="operational_issues")
    source = models.CharField(max_length=30, db_index=True)
    source_key = models.CharField(max_length=160)
    source_url = models.CharField(max_length=255, blank=True)
    title = models.CharField(max_length=180)
    detail = models.CharField(max_length=255, blank=True)
    next_action = models.CharField(max_length=180)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM, db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN, db_index=True)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=True, blank=True, related_name="assigned_operational_issues")
    due_at = models.DateTimeField(null=True, blank=True, db_index=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution = models.TextField(blank=True)
    last_synced_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-priority", "due_at", "-created_at"]
        constraints = [models.UniqueConstraint(fields=["academy", "source", "source_key"], name="unique_operational_issue_source")]


class OperationalIssueHistory(BaseModel):
    issue = models.ForeignKey(OperationalIssue, on_delete=models.CASCADE, related_name="history")
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=True, blank=True, related_name="operational_issue_history")
    event = models.CharField(max_length=40)
    message = models.CharField(max_length=255, blank=True)
    previous_state = models.JSONField(default=dict, blank=True)
    new_state = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["created_at"]
