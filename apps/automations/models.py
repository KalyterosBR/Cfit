from django.conf import settings
from django.db import models

from apps.core.base.models import BaseModel


class AutomationRule(BaseModel):
    class Event(models.TextChoices):
        OVERDUE_CHARGE = "overdue_charge", "Cobrança vencida"
        RECURRING_REJECTED = "recurring_rejected", "Recorrência rejeitada"
        PROLONGED_ABSENCE = "prolonged_absence", "Ausência prolongada"
        PLAN_ENDING = "plan_ending", "Plano próximo do fim"
        BIRTHDAY = "birthday", "Aniversário"
        VISIT_WITHOUT_RETURN = "visit_without_return", "Visita sem retorno"

    academy = models.ForeignKey("academy.Academy", on_delete=models.PROTECT, related_name="automation_rules")
    unit = models.ForeignKey(
        "academy.Unit", on_delete=models.PROTECT, null=True, blank=True,
        related_name="automation_rules",
    )
    name = models.CharField(max_length=120)
    event_type = models.CharField(max_length=40, choices=Event.choices)
    action_description = models.CharField(max_length=255)
    priority = models.CharField(
        max_length=10,
        choices=[("low", "Baixa"), ("medium", "Média"), ("high", "Alta"), ("critical", "Crítica")],
        default="medium",
    )
    responsible = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=True, blank=True, related_name="automation_rules")
    sla_hours = models.PositiveSmallIntegerField(default=24)
    paused_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["name"]


class AutomationExecution(BaseModel):
    class Mode(models.TextChoices):
        TEST = "test", "Teste"
        SIMULATION = "simulation", "Simulação"
        REAL = "real", "Execução real"
    class Status(models.TextChoices):
        EXECUTED = "executed", "Executada"
        SKIPPED = "skipped", "Ignorada"
        FAILED = "failed", "Falhou"

    rule = models.ForeignKey(AutomationRule, on_delete=models.PROTECT, related_name="executions")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.EXECUTED)
    entity_type = models.CharField(max_length=80, blank=True)
    entity_id = models.CharField(max_length=64, blank=True)
    explanation = models.CharField(max_length=255)
    payload = models.JSONField(default=dict, blank=True)
    triggered_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="triggered_automations")
    operational_status = models.CharField(
        max_length=20,
        choices=[("pending", "Pendente"), ("in_progress", "Em andamento"), ("completed", "Concluída")],
        default="pending",
    )
    priority = models.CharField(
        max_length=10,
        choices=[("low", "Baixa"), ("medium", "Média"), ("high", "Alta"), ("critical", "Crítica")],
        default="medium",
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=True, blank=True,
        related_name="assigned_automation_executions",
    )
    resolution_notes = models.CharField(max_length=255, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    mode = models.CharField(max_length=20, choices=Mode.choices, default=Mode.REAL)
    due_at = models.DateTimeField(null=True, blank=True)
    attempts = models.PositiveSmallIntegerField(default=1)
    idempotency_key = models.CharField(max_length=160, null=True, blank=True, unique=True)
    last_error = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-created_at"]
