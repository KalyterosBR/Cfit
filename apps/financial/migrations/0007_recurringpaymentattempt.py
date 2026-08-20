import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("financial", "0006_cashtransaction"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="RecurringPaymentAttempt",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("attempt_number", models.PositiveIntegerField(verbose_name="Número da tentativa")),
                ("status", models.CharField(choices=[("pending", "Pendente"), ("processing", "Processando"), ("approved", "Aprovada"), ("rejected", "Rejeitada")], max_length=20, verbose_name="Situação")),
                ("source", models.CharField(choices=[("automatic", "Automação Cfit"), ("integration", "Integração externa"), ("manual", "Registro manual")], max_length=20, verbose_name="Origem")),
                ("provider", models.CharField(blank=True, default="", max_length=100, verbose_name="Provedor")),
                ("external_reference", models.CharField(blank=True, default="", max_length=150, verbose_name="Referência externa")),
                ("failure_code", models.CharField(blank=True, default="", max_length=100, verbose_name="Código da falha")),
                ("failure_reason", models.TextField(blank=True, default="", verbose_name="Motivo da falha")),
                ("next_retry_at", models.DateTimeField(blank=True, null=True, verbose_name="Próxima tentativa")),
                ("occurred_at", models.DateTimeField(verbose_name="Ocorrida em")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("charge", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="recurring_attempts", to="financial.charge", verbose_name="Cobrança")),
                ("recorded_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="recorded_recurring_attempts", to=settings.AUTH_USER_MODEL, verbose_name="Responsável pelo registro")),
            ],
            options={
                "verbose_name": "Tentativa de recorrência",
                "verbose_name_plural": "Tentativas de recorrência",
                "ordering": ["-occurred_at", "-attempt_number"],
            },
        ),
        migrations.AddConstraint(
            model_name="recurringpaymentattempt",
            constraint=models.UniqueConstraint(fields=("charge", "attempt_number"), name="unique_recurring_attempt_number_per_charge"),
        ),
    ]
