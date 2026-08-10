from django.db import models
from django.db.models import Q

from apps.core.base.models import BaseModel
from apps.plans.models.plan import Plan
from apps.students.models.student import Student


class Enrollment(BaseModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Ativa"
        FROZEN = "frozen", "Congelada"
        CANCELED = "canceled", "Cancelada"
        FINISHED = "finished", "Encerrada"
        EXPIRED = "expired", "Vencida"

    class BillingMethod(models.TextChoices):
        MONTHLY = "monthly", "Mensal"
        FULL = "full", "À vista"

    student = models.ForeignKey(
        Student,
        on_delete=models.PROTECT,
        related_name="enrollments",
        verbose_name="Aluno",
    )

    plan = models.ForeignKey(
        Plan,
        on_delete=models.PROTECT,
        related_name="enrollments",
        verbose_name="Plano",
    )

    contracted_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Valor contratado",
    )

    start_date = models.DateField(
        verbose_name="Data de início",
    )

    due_date = models.DateField(
        verbose_name="Data de vencimento",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        verbose_name="Status",
    )

    billing_method = models.CharField(
        max_length=20,
        choices=BillingMethod.choices,
        default=BillingMethod.MONTHLY,
        verbose_name="Forma de cobrança",
    )

    notes = models.TextField(
        blank=True,
        verbose_name="Observações",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["student", "plan"],
                condition=Q(
                    status__in=[
                        "active",
                        "frozen",
                    ],
                ),
                name="unique_active_plan_per_student",
            ),
        ]

    def __str__(self):
        return f"{self.student} - {self.plan}"
