from django.db import models

from apps.financial.models.charge import Charge


class CashTransaction(models.Model):
    class Type(models.TextChoices):
        INCOME = "income", "Entrada"
        EXPENSE = "expense", "Saída"

    class Status(models.TextChoices):
        PLANNED = "planned", "Prevista"
        REALIZED = "realized", "Realizada"

    class Category(models.TextChoices):
        MEMBERSHIP = "membership", "Mensalidades"
        SERVICES = "services", "Serviços"
        PAYROLL = "payroll", "Folha de pagamento"
        RENT = "rent", "Aluguel"
        UTILITIES = "utilities", "Água, energia e internet"
        TAXES = "taxes", "Impostos e taxas"
        MAINTENANCE = "maintenance", "Manutenção"
        MARKETING = "marketing", "Marketing"
        OTHER = "other", "Outros"

    transaction_type = models.CharField(
        max_length=10,
        choices=Type.choices,
        verbose_name="Tipo",
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        verbose_name="Situação",
    )
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        verbose_name="Categoria",
    )
    description = models.CharField(max_length=255, verbose_name="Descrição")
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Valor",
    )
    competence_date = models.DateField(verbose_name="Competência")
    transaction_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Data efetiva",
    )
    charge = models.OneToOneField(
        Charge,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="cash_transaction",
        verbose_name="Cobrança vinculada",
    )
    notes = models.TextField(blank=True, default="", verbose_name="Observações")
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.PROTECT,
        related_name="cash_transactions",
        verbose_name="Responsável",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-competence_date", "-created_at"]
        verbose_name = "Movimentação de caixa"
        verbose_name_plural = "Movimentações de caixa"

    def __str__(self):
        return f"{self.get_transaction_type_display()} - {self.description}"
