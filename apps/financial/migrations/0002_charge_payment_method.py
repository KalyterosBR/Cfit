from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("financial", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="charge",
            name="payment_method",
            field=models.CharField(
                blank=True,
                choices=[
                    ("pix", "Pix"),
                    ("cash", "Dinheiro"),
                    ("debit_card", "Cartão de débito"),
                    ("credit_card", "Cartão de crédito"),
                    ("bank_transfer", "Transferência bancária"),
                ],
                max_length=20,
                null=True,
                verbose_name="Método de pagamento",
            ),
        ),
    ]
