from django.db import models

from apps.core.base.models import BaseModel
from apps.enrollments.models.enrollment import Enrollment


class EnrollmentFreeze(BaseModel):
    enrollment = models.ForeignKey(
        Enrollment,
        on_delete=models.PROTECT,
        related_name="freezes",
        verbose_name="Matrícula",
    )

    frozen_at = models.DateField(
        verbose_name="Data do congelamento",
    )

    reactivated_at = models.DateField(
        null=True,
        blank=True,
        verbose_name="Data da reativação",
    )

    reason = models.TextField(
        blank=True,
        verbose_name="Motivo",
    )

    @property
    def is_active(self):
        return self.reactivated_at is None

    def __str__(self):
        return f"{self.enrollment} - Congelamento em {self.frozen_at}"
