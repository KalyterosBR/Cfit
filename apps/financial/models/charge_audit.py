from django.db import models

from apps.financial.models.charge import Charge


class ChargeAudit(models.Model):
    class Action(models.TextChoices):
        PAYMENT_REGISTERED = "payment_registered", "Pagamento registrado"
        CANCELED = "canceled", "Cobrança cancelada"
        RECONCILED = "reconciled", "Cobrança conciliada"

    charge = models.ForeignKey(
        Charge,
        on_delete=models.PROTECT,
        related_name="audit_events",
        verbose_name="Cobrança",
    )
    action = models.CharField(
        max_length=30,
        choices=Action.choices,
        verbose_name="Ação",
    )
    actor = models.ForeignKey(
        "users.User",
        on_delete=models.PROTECT,
        related_name="financial_audit_events",
        verbose_name="Responsável",
    )
    reason = models.TextField(
        blank=True,
        default="",
        verbose_name="Motivo",
    )
    previous_state = models.JSONField(
        default=dict,
        verbose_name="Estado anterior",
    )
    new_state = models.JSONField(
        default=dict,
        verbose_name="Estado posterior",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Auditoria de cobrança"
        verbose_name_plural = "Auditorias de cobrança"

    def __str__(self):
        return f"{self.get_action_display()} - {self.charge}"
