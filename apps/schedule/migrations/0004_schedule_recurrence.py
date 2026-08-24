import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("schedule", "0003_scheduleevent_confirmed_at_scheduleevent_reminder_at")]
    operations = [
        migrations.AddField(model_name="scheduleevent", name="recurrence", field=models.CharField(choices=[("none", "Não repetir"), ("daily", "Diariamente"), ("weekly", "Semanalmente")], default="none", max_length=20)),
        migrations.AddField(model_name="scheduleevent", name="recurrence_count", field=models.PositiveSmallIntegerField(default=1)),
        migrations.AddField(model_name="scheduleevent", name="series_id", field=models.UUIDField(db_index=True, default=uuid.uuid4, editable=False)),
    ]
