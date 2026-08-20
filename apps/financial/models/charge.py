from django.db import models

from apps.enrollments.models import Enrollment


class Charge(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pendente"
        PAID = "paid", "Pago"
        OVERDUE = "overdue", "Atrasado"
        CANCELED = "canceled", "Cancelado"

    class PaymentMethod(models.TextChoices):
        PIX = "pix", "Pix"
        CASH = "cash", "Dinheiro"
        DEBIT_CARD = "debit_card", "Cartão de débito"
        CREDIT_CARD = "credit_card", "Cartão de crédito"
        BANK_TRANSFER = "bank_transfer", "Transferência bancária"

    enrollment = models.ForeignKey(
        Enrollment,
        on_delete=models.PROTECT,
        related_name="charges",
        verbose_name="Matrícula",
    )

    description = models.CharField(
        max_length=255,
        verbose_name="Descrição",
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Valor",
    )

    due_date = models.DateField(
        verbose_name="Vencimento",
    )

    competence_date = models.DateField(
        verbose_name="Competência",
        help_text="Mês de referência financeira da cobrança.",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name="Status",
    )

    paid_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Pago em",
    )

    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        null=True,
        blank=True,
        verbose_name="Método de pagamento",
    )

    notes = models.TextField(
        blank=True,
        default="",
        verbose_name="Observações",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "-due_date",
            "-created_at",
        ]

        verbose_name = "Cobrança"
        verbose_name_plural = "Cobranças"

    def __str__(self):
        return f"{self.enrollment.student.name} - {self.description} - R$ {self.amount}"
