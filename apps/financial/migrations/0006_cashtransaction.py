import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("financial", "0005_chargereconciliation"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="CashTransaction",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("transaction_type", models.CharField(choices=[("income", "Entrada"), ("expense", "Saída")], max_length=10, verbose_name="Tipo")),
                ("status", models.CharField(choices=[("planned", "Prevista"), ("realized", "Realizada")], max_length=10, verbose_name="Situação")),
                ("category", models.CharField(choices=[("membership", "Mensalidades"), ("services", "Serviços"), ("payroll", "Folha de pagamento"), ("rent", "Aluguel"), ("utilities", "Água, energia e internet"), ("taxes", "Impostos e taxas"), ("maintenance", "Manutenção"), ("marketing", "Marketing"), ("other", "Outros")], max_length=20, verbose_name="Categoria")),
                ("description", models.CharField(max_length=255, verbose_name="Descrição")),
                ("amount", models.DecimalField(decimal_places=2, max_digits=12, verbose_name="Valor")),
                ("competence_date", models.DateField(verbose_name="Competência")),
                ("transaction_date", models.DateField(blank=True, null=True, verbose_name="Data efetiva")),
                ("notes", models.TextField(blank=True, default="", verbose_name="Observações")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("charge", models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="cash_transaction", to="financial.charge", verbose_name="Cobrança vinculada")),
                ("created_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="cash_transactions", to=settings.AUTH_USER_MODEL, verbose_name="Responsável")),
            ],
            options={
                "verbose_name": "Movimentação de caixa",
                "verbose_name_plural": "Movimentações de caixa",
                "ordering": ["-competence_date", "-created_at"],
            },
        ),
    ]
