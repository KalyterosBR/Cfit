import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("financial", "0004_chargeaudit"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name="chargeaudit",
            name="action",
            field=models.CharField(
                choices=[
                    ("payment_registered", "Pagamento registrado"),
                    ("canceled", "Cobrança cancelada"),
                    ("reconciled", "Cobrança conciliada"),
                ],
                max_length=30,
                verbose_name="Ação",
            ),
        ),
        migrations.CreateModel(
            name="ChargeReconciliation",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "expected_amount",
                    models.DecimalField(
                        decimal_places=2,
                        max_digits=10,
                        verbose_name="Valor esperado",
                    ),
                ),
                (
                    "received_amount",
                    models.DecimalField(
                        decimal_places=2,
                        max_digits=10,
                        verbose_name="Valor recebido",
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("reconciled", "Conciliado"),
                            ("divergent", "Divergente"),
                        ],
                        max_length=20,
                        verbose_name="Situação",
                    ),
                ),
                (
                    "notes",
                    models.TextField(blank=True, default="", verbose_name="Observações"),
                ),
                ("reconciled_at", models.DateTimeField(auto_now_add=True)),
                (
                    "charge",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="reconciliation",
                        to="financial.charge",
                        verbose_name="Cobrança",
                    ),
                ),
                (
                    "reconciled_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="financial_reconciliations",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Responsável",
                    ),
                ),
            ],
            options={
                "verbose_name": "Conciliação de cobrança",
                "verbose_name_plural": "Conciliações de cobranças",
                "ordering": ["-reconciled_at"],
            },
        ),
    ]
