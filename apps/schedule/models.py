from django.conf import settings
from django.db import models
import uuid

from apps.core.base.models import BaseModel


class ScheduleEvent(BaseModel):
    unit = models.ForeignKey(
        "academy.Unit", on_delete=models.PROTECT, null=True, blank=True,
        related_name="schedule_events",
    )
    class EventType(models.TextChoices):
        CLASS = "class", "Aula"
        ASSESSMENT = "assessment", "Avaliação"
        TASK = "task", "Tarefa"
        CONTACT = "contact", "Contato"
        VISIT = "visit", "Visita"

    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Agendado"
        IN_PROGRESS = "in_progress", "Em andamento"
        COMPLETED = "completed", "Realizado"
        CANCELED = "canceled", "Cancelado"

    title = models.CharField(max_length=150)
    event_type = models.CharField(max_length=20, choices=EventType.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)
    starts_at = models.DateTimeField(db_index=True)
    ends_at = models.DateTimeField()
    student = models.ForeignKey("students.Student", on_delete=models.PROTECT, null=True, blank=True, related_name="schedule_events")
    professional = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="schedule_events")
    location = models.CharField(max_length=120, blank=True)
    notes = models.TextField(blank=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    reminder_at = models.DateTimeField(null=True, blank=True)
    recurrence = models.CharField(max_length=20, choices=[("none", "Não repetir"), ("daily", "Diariamente"), ("weekly", "Semanalmente")], default="none")
    recurrence_count = models.PositiveSmallIntegerField(default=1)
    series_id = models.UUIDField(default=uuid.uuid4, editable=False, db_index=True)

    class Meta:
        ordering = ["starts_at", "created_at"]

    def __str__(self):
        return self.title
