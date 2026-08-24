from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("plans", "0004_plan_academy")]

    operations = [
        migrations.AddField(
            model_name="plan",
            name="installment_count",
            field=models.PositiveSmallIntegerField(default=1, verbose_name="Quantidade de parcelas"),
        ),
    ]
