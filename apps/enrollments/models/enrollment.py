from django.db import models
from django.db.models import Q

from apps.core.base.models import BaseModel
from apps.plans.models.plan import Plan
from apps.students.models.student import Student


class Enrollment(BaseModel):
    unit = models.ForeignKey(
        "academy.Unit", on_delete=models.PROTECT, null=True, blank=True,
        related_name="enrollments",
    )
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

    original_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name="Valor original",
    )

    discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name="Desconto",
    )

    discount_reason = models.TextField(
        blank=True,
        verbose_name="Justificativa do desconto",
    )

    contract_version = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="Versão do contrato aceita",
    )

    contract_snapshot = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Cópia do contrato aceito",
    )

    contract_accepted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Contrato aceito em",
    )

    contract_accepted_by = models.ForeignKey(
        "users.User",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="accepted_enrollment_contracts",
        verbose_name="Aceite registrado por",
    )

    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="created_enrollments",
        verbose_name="Matrícula criada por",
    )
    cancellation_reason = models.TextField(blank=True)
    frozen_until = models.DateField(null=True, blank=True)
    renewed_from = models.ForeignKey("self", on_delete=models.PROTECT, null=True, blank=True, related_name="renewals")

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
