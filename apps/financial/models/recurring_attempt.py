from django.db import models

from apps.financial.models.charge import Charge


class RecurringPaymentAttempt(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pendente"
        PROCESSING = "processing", "Processando"
        APPROVED = "approved", "Aprovada"
        REJECTED = "rejected", "Rejeitada"

    class Source(models.TextChoices):
        AUTOMATIC = "automatic", "Automação Cfit"
        INTEGRATION = "integration", "Integração externa"
        MANUAL = "manual", "Registro manual"

    charge = models.ForeignKey(
        Charge,
        on_delete=models.PROTECT,
        related_name="recurring_attempts",
        verbose_name="Cobrança",
    )
    attempt_number = models.PositiveIntegerField(verbose_name="Número da tentativa")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        verbose_name="Situação",
    )
    source = models.CharField(
        max_length=20,
        choices=Source.choices,
        verbose_name="Origem",
    )
    provider = models.CharField(
        max_length=100,
        blank=True,
        default="",
        verbose_name="Provedor",
    )
    external_reference = models.CharField(
        max_length=150,
        blank=True,
        default="",
        verbose_name="Referência externa",
    )
    failure_code = models.CharField(
        max_length=100,
        blank=True,
        default="",
        verbose_name="Código da falha",
    )
    failure_reason = models.TextField(
        blank=True,
        default="",
        verbose_name="Motivo da falha",
    )
    next_retry_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Próxima tentativa",
    )
    recorded_by = models.ForeignKey(
        "users.User",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="recorded_recurring_attempts",
        verbose_name="Responsável pelo registro",
    )
    occurred_at = models.DateTimeField(verbose_name="Ocorrida em")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-occurred_at", "-attempt_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["charge", "attempt_number"],
                name="unique_recurring_attempt_number_per_charge",
            )
        ]
        verbose_name = "Tentativa de recorrência"
        verbose_name_plural = "Tentativas de recorrência"

    def __str__(self):
        return f"Tentativa {self.attempt_number} - {self.charge}"
