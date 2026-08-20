from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("plans", "0002_plan_commercial_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="plan",
            name="access_rules",
            field=models.TextField(blank=True, verbose_name="Regras de acesso"),
        ),
        migrations.AddField(
            model_name="plan",
            name="benefits",
            field=models.TextField(blank=True, verbose_name="Benefícios e serviços"),
        ),
        migrations.AddField(
            model_name="plan",
            name="cancellation_rules",
            field=models.TextField(blank=True, verbose_name="Regras de cancelamento"),
        ),
        migrations.AddField(
            model_name="plan",
            name="contract_text",
            field=models.TextField(blank=True, verbose_name="Contrato"),
        ),
        migrations.AddField(
            model_name="plan",
            name="contract_version",
            field=models.PositiveIntegerField(default=1, verbose_name="Versão do contrato"),
        ),
        migrations.AddField(
            model_name="plan",
            name="freeze_rules",
            field=models.TextField(blank=True, verbose_name="Regras de trancamento"),
        ),
        migrations.AddField(
            model_name="plan",
            name="modalities",
            field=models.TextField(blank=True, verbose_name="Modalidades incluídas"),
        ),
    ]
