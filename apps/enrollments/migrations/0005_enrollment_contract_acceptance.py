import django.db.models.deletion

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("enrollments", "0004_enrollmenthistory"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="enrollment",
            name="contract_accepted_at",
            field=models.DateTimeField(
                blank=True,
                null=True,
                verbose_name="Contrato aceito em",
            ),
        ),
        migrations.AddField(
            model_name="enrollment",
            name="contract_accepted_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="accepted_enrollment_contracts",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Aceite registrado por",
            ),
        ),
        migrations.AddField(
            model_name="enrollment",
            name="contract_snapshot",
            field=models.JSONField(
                blank=True,
                default=dict,
                verbose_name="Cópia do contrato aceito",
            ),
        ),
        migrations.AddField(
            model_name="enrollment",
            name="contract_version",
            field=models.PositiveIntegerField(
                blank=True,
                null=True,
                verbose_name="Versão do contrato aceita",
            ),
        ),
    ]
