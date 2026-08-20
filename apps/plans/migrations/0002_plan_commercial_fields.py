from django.db import migrations, models


def preserve_existing_recurring_plans(apps, schema_editor):
    Plan = apps.get_model("plans", "Plan")
    Plan.objects.filter(duration_months=1).update(
        recurring=True,
        auto_renew=True,
    )


class Migration(migrations.Migration):
    dependencies = [
        ("plans", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="plan",
            name="auto_renew",
            field=models.BooleanField(
                default=False,
                verbose_name="Renovação automática",
            ),
        ),
        migrations.AddField(
            model_name="plan",
            name="available_for_enrollment",
            field=models.BooleanField(
                default=True,
                verbose_name="Disponível para novas matrículas",
            ),
        ),
        migrations.AddField(
            model_name="plan",
            name="billing_period",
            field=models.CharField(
                choices=[
                    ("monthly", "Mensal"),
                    ("quarterly", "Trimestral"),
                    ("semiannual", "Semestral"),
                    ("annual", "Anual"),
                    ("one_time", "Pagamento único"),
                ],
                default="monthly",
                max_length=20,
                verbose_name="Periodicidade de cobrança",
            ),
        ),
        migrations.AddField(
            model_name="plan",
            name="enrollment_fee",
            field=models.DecimalField(
                decimal_places=2,
                default=0,
                max_digits=10,
                verbose_name="Taxa de matrícula",
            ),
        ),
        migrations.AddField(
            model_name="plan",
            name="minimum_commitment_months",
            field=models.PositiveSmallIntegerField(
                default=0,
                verbose_name="Fidelidade mínima (meses)",
            ),
        ),
        migrations.AddField(
            model_name="plan",
            name="recurring",
            field=models.BooleanField(
                default=False,
                verbose_name="Cobrança recorrente",
            ),
        ),
        migrations.AlterField(
            model_name="plan",
            name="price",
            field=models.DecimalField(
                decimal_places=2,
                max_digits=10,
                verbose_name="Valor total",
            ),
        ),
        migrations.RunPython(
            preserve_existing_recurring_plans,
            migrations.RunPython.noop,
        ),
    ]
