from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("operations", "0006_accessdevice_provider_devicecommand")]

    operations = [
        migrations.AddField(model_name="accessdevice", name="last_latency_ms", field=models.PositiveIntegerField(blank=True, null=True)),
        migrations.AddField(model_name="accessdevice", name="firmware_version", field=models.CharField(blank=True, max_length=80)),
    ]
