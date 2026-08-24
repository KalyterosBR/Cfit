from django.db import models

from apps.core.base.models import BaseModel


class Plan(BaseModel):
    academy = models.ForeignKey(
        "academy.Academy", on_delete=models.PROTECT, null=True, blank=True,
        related_name="plans",
    )
    class BillingPeriod(models.TextChoices):
        MONTHLY = "monthly", "Mensal"
        QUARTERLY = "quarterly", "Trimestral"
        SEMIANNUAL = "semiannual", "Semestral"
        ANNUAL = "annual", "Anual"
        ONE_TIME = "one_time", "Pagamento único"

    name = models.CharField(
        max_length=150,
        verbose_name="Nome",
    )

    description = models.TextField(
        blank=True,
        verbose_name="Descrição",
    )

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Valor total",
    )

    duration_months = models.PositiveSmallIntegerField(
        verbose_name="Duração (meses)",
    )

    billing_period = models.CharField(
        max_length=20,
        choices=BillingPeriod.choices,
        default=BillingPeriod.MONTHLY,
        verbose_name="Periodicidade de cobrança",
    )

    recurring = models.BooleanField(
        default=False,
        verbose_name="Cobrança recorrente",
    )

    installment_count = models.PositiveSmallIntegerField(
        default=1,
        verbose_name="Quantidade de parcelas",
    )

    enrollment_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name="Taxa de matrícula",
    )

    minimum_commitment_months = models.PositiveSmallIntegerField(
        default=0,
        verbose_name="Fidelidade mínima (meses)",
    )

    auto_renew = models.BooleanField(
        default=False,
        verbose_name="Renovação automática",
    )

    available_for_enrollment = models.BooleanField(
        default=True,
        verbose_name="Disponível para novas matrículas",
    )

    modalities = models.TextField(
        blank=True,
        verbose_name="Modalidades incluídas",
    )

    benefits = models.TextField(
        blank=True,
        verbose_name="Benefícios e serviços",
    )

    access_rules = models.TextField(
        blank=True,
        verbose_name="Regras de acesso",
    )

    cancellation_rules = models.TextField(
        blank=True,
        verbose_name="Regras de cancelamento",
    )

    freeze_rules = models.TextField(
        blank=True,
        verbose_name="Regras de trancamento",
    )

    contract_text = models.TextField(
        blank=True,
        verbose_name="Contrato",
    )

    contract_version = models.PositiveIntegerField(
        default=1,
        verbose_name="Versão do contrato",
    )

    def __str__(self):
        return self.name
