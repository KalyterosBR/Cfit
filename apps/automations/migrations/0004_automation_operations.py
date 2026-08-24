from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("automations", "0003_automationexecution_assigned_to_and_more")]

    operations = [
        migrations.AddField(model_name="automationrule", name="sla_hours", field=models.PositiveSmallIntegerField(default=24)),
        migrations.AddField(model_name="automationrule", name="paused_at", field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name="automationexecution", name="mode", field=models.CharField(choices=[("test", "Teste"), ("simulation", "Simulação"), ("real", "Execução real")], default="real", max_length=20)),
        migrations.AddField(model_name="automationexecution", name="due_at", field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name="automationexecution", name="attempts", field=models.PositiveSmallIntegerField(default=1)),
        migrations.AddField(model_name="automationexecution", name="idempotency_key", field=models.CharField(blank=True, max_length=160, null=True, unique=True)),
        migrations.AddField(model_name="automationexecution", name="last_error", field=models.CharField(blank=True, max_length=255)),
    ]
