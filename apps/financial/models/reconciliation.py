from django.db import models

from apps.financial.models.charge import Charge


class ChargeReconciliation(models.Model):
    class Status(models.TextChoices):
        RECONCILED = "reconciled", "Conciliado"
        DIVERGENT = "divergent", "Divergente"

    charge = models.OneToOneField(
        Charge,
        on_delete=models.PROTECT,
        related_name="reconciliation",
        verbose_name="Cobrança",
    )
    expected_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Valor esperado",
    )
    received_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Valor recebido",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        verbose_name="Situação",
    )
    notes = models.TextField(
        blank=True,
        default="",
        verbose_name="Observações",
    )
    reconciled_by = models.ForeignKey(
        "users.User",
        on_delete=models.PROTECT,
        related_name="financial_reconciliations",
        verbose_name="Responsável",
    )
    reconciled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-reconciled_at"]
        verbose_name = "Conciliação de cobrança"
        verbose_name_plural = "Conciliações de cobranças"

    def __str__(self):
        return f"{self.get_status_display()} - {self.charge}"
