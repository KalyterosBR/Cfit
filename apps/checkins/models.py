from django.db import models
from django.utils import timezone

from apps.core.base.models import BaseModel
from apps.students.models import Student


class CheckIn(BaseModel):
    class Source(models.TextChoices):
        MANUAL = "manual", "Manual"
        ACCESS_CONTROL = "access_control", "Controle de acesso"
        FACIAL_RECOGNITION = "facial_recognition", "Reconhecimento facial"

    student = models.ForeignKey(
        Student,
        on_delete=models.PROTECT,
        related_name="checkins",
    )

    checked_in_at = models.DateTimeField(
        default=timezone.now,
        db_index=True,
    )

    source = models.CharField(
        max_length=30,
        choices=Source.choices,
        default=Source.MANUAL,
    )

    notes = models.CharField(
        max_length=255,
        blank=True,
    )

    class Meta:
        ordering = [
            "-checked_in_at",
            "-created_at",
        ]

        indexes = [
            models.Index(
                fields=[
                    "student",
                    "checked_in_at",
                ],
                name="checkin_student_date_idx",
            ),
        ]

    def __str__(self):
        return f"{self.student.name} - {self.checked_in_at:%d/%m/%Y %H:%M}"
