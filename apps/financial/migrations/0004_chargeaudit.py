import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("financial", "0003_charge_competence_date"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ChargeAudit",
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
                    "action",
                    models.CharField(
                        choices=[
                            ("payment_registered", "Pagamento registrado"),
                            ("canceled", "Cobrança cancelada"),
                        ],
                        max_length=30,
                        verbose_name="Ação",
                    ),
                ),
                (
                    "reason",
                    models.TextField(blank=True, default="", verbose_name="Motivo"),
                ),
                (
                    "previous_state",
                    models.JSONField(default=dict, verbose_name="Estado anterior"),
                ),
                (
                    "new_state",
                    models.JSONField(default=dict, verbose_name="Estado posterior"),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "actor",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="financial_audit_events",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Responsável",
                    ),
                ),
                (
                    "charge",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="audit_events",
                        to="financial.charge",
                        verbose_name="Cobrança",
                    ),
                ),
            ],
            options={
                "verbose_name": "Auditoria de cobrança",
                "verbose_name_plural": "Auditorias de cobrança",
                "ordering": ["-created_at"],
            },
        ),
    ]
