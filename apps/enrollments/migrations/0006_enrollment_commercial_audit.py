import django.db.models.deletion

from django.conf import settings
from django.db import migrations, models


def preserve_existing_prices(apps, schema_editor):
    Enrollment = apps.get_model("enrollments", "Enrollment")

    for enrollment in Enrollment.objects.all().iterator():
        enrollment.original_price = enrollment.contracted_price
        enrollment.save(update_fields=["original_price"])


class Migration(migrations.Migration):
    dependencies = [
        ("enrollments", "0005_enrollment_contract_acceptance"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="enrollment",
            name="created_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="created_enrollments",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Matrícula criada por",
            ),
        ),
        migrations.AddField(
            model_name="enrollment",
            name="discount_amount",
            field=models.DecimalField(
                decimal_places=2,
                default=0,
                max_digits=10,
                verbose_name="Desconto",
            ),
        ),
        migrations.AddField(
            model_name="enrollment",
            name="discount_reason",
            field=models.TextField(
                blank=True,
                verbose_name="Justificativa do desconto",
            ),
        ),
        migrations.AddField(
            model_name="enrollment",
            name="original_price",
            field=models.DecimalField(
                decimal_places=2,
                default=0,
                max_digits=10,
                verbose_name="Valor original",
            ),
        ),
        migrations.RunPython(
            preserve_existing_prices,
            migrations.RunPython.noop,
        ),
    ]
