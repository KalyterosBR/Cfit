import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("operations", "0005_loginsession_refresh_jti")]

    operations = [
        migrations.AlterField(
            model_name="accessdevice",
            name="provider",
            field=models.CharField(choices=[("simulator", "Simulador Cfit"), ("control_id", "Control iD"), ("topdata_inner", "Topdata Inner"), ("topdata_facial", "Topdata Facial/Easy")], default="simulator", max_length=40),
        ),
        migrations.CreateModel(
            name="DeviceCommand",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("command_type", models.CharField(choices=[("sync_student", "Sincronizar aluno"), ("remove_student", "Remover aluno"), ("release_entry", "Liberar entrada"), ("release_exit", "Liberar saída"), ("sync_access_rules", "Sincronizar regras"), ("collect_logs", "Coletar registros")], max_length=40)),
                ("payload", models.JSONField(blank=True, default=dict)),
                ("status", models.CharField(choices=[("queued", "Na fila"), ("dispatched", "Entregue ao conector"), ("succeeded", "Executado"), ("failed", "Falhou")], db_index=True, default="queued", max_length=20)),
                ("attempts", models.PositiveSmallIntegerField(default=0)),
                ("dispatched_at", models.DateTimeField(blank=True, null=True)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("result", models.JSONField(blank=True, default=dict)),
                ("last_error", models.CharField(blank=True, max_length=255)),
                ("device", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="commands", to="operations.accessdevice")),
            ],
            options={"ordering": ["created_at"]},
        ),
    ]
