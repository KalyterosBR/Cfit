from django.db import migrations, models


def copy_due_date_to_competence(apps, schema_editor):
    Charge = apps.get_model("financial", "Charge")

    for charge in Charge.objects.only("id", "due_date").iterator():
        charge.competence_date = charge.due_date
        charge.save(update_fields=["competence_date"])


class Migration(migrations.Migration):
    dependencies = [
        ("financial", "0002_charge_payment_method"),
    ]

    operations = [
        migrations.AddField(
            model_name="charge",
            name="competence_date",
            field=models.DateField(
                null=True,
                verbose_name="Competência",
                help_text="Mês de referência financeira da cobrança.",
            ),
        ),
        migrations.RunPython(
            copy_due_date_to_competence,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="charge",
            name="competence_date",
            field=models.DateField(
                verbose_name="Competência",
                help_text="Mês de referência financeira da cobrança.",
            ),
        ),
    ]
