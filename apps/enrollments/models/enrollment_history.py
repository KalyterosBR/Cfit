from django.db import models

from apps.core.base.models import BaseModel
from apps.enrollments.models.enrollment import Enrollment


class EnrollmentHistory(BaseModel):
    class EventType(models.TextChoices):
        CREATED = "created", "Matrícula criada"
        FROZEN = "frozen", "Matrícula congelada"
        REACTIVATED = "reactivated", "Matrícula reativada"
        CANCELED = "canceled", "Matrícula cancelada"
        FINISHED = "finished", "Matrícula encerrada"
        RENEWED = "renewed", "Matrícula renovada"

    enrollment = models.ForeignKey(
        Enrollment,
        on_delete=models.CASCADE,
        related_name="history",
        verbose_name="Matrícula",
    )

    event_type = models.CharField(
        max_length=20,
        choices=EventType.choices,
        verbose_name="Tipo do evento",
    )

    event_date = models.DateField(
        verbose_name="Data do evento",
    )

    description = models.TextField(
        blank=True,
        verbose_name="Descrição",
    )

    def __str__(self):
        return (
            f"{self.enrollment} - {self.get_event_type_display()} - {self.event_date}"
        )

    class Meta:
        verbose_name = "Histórico da matrícula"
        verbose_name_plural = "Históricos das matrículas"
        ordering = [
            "-event_date",
            "-created_at",
        ]
