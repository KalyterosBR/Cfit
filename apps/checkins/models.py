from django.db import models
from django.utils import timezone

from apps.core.base.models import BaseModel
from apps.students.models import Student


class CheckIn(BaseModel):
    class Source(models.TextChoices):
        MANUAL = "manual", "Manual"
        ACCESS_CONTROL = "access_control", "Controle de acesso"
        FACIAL_RECOGNITION = "facial_recognition", "Reconhecimento facial"

    class AccessResult(models.TextChoices):
        ALLOWED = "allowed", "Liberado"
        BLOCKED = "blocked", "Bloqueado"

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

    access_result = models.CharField(
        max_length=20,
        choices=AccessResult.choices,
        default=AccessResult.ALLOWED,
    )

    block_reason = models.CharField(max_length=255, blank=True)
    equipment = models.CharField(max_length=100, blank=True)

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


class MonthlyCheckInGoal(models.Model):
    academy = models.ForeignKey(
        "academy.Academy",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="monthly_checkin_goals",
        verbose_name="Academia",
    )
    period = models.DateField(verbose_name="Competência")
    target_count = models.PositiveIntegerField(verbose_name="Meta de check-ins")
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.PROTECT,
        related_name="created_checkin_goals",
        verbose_name="Criada por",
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.PROTECT,
        related_name="updated_checkin_goals",
        verbose_name="Atualizada por",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-period"]
        verbose_name = "Meta mensal de check-ins"
        verbose_name_plural = "Metas mensais de check-ins"
        constraints = [
            models.UniqueConstraint(
                fields=["academy", "period"],
                name="unique_checkin_goal_per_academy_period",
            ),
            models.UniqueConstraint(
                fields=["period"],
                condition=models.Q(academy__isnull=True),
                name="unique_global_checkin_goal_period",
            ),
            models.CheckConstraint(
                condition=models.Q(target_count__gt=0),
                name="checkin_goal_target_count_positive",
            ),
        ]

    def __str__(self):
        return f"{self.period:%m/%Y} - {self.target_count} check-ins"
