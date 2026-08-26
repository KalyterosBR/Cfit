import django.db.models.deletion
from django.db import migrations, models


def link_existing_classes(apps, schema_editor):
    GroupClass = apps.get_model("operations", "GroupClass")
    ScheduleEvent = apps.get_model("schedule", "ScheduleEvent")
    for group_class in GroupClass.objects.filter(schedule_event__isnull=True).iterator():
        event = ScheduleEvent.objects.create(
            unit_id=group_class.unit_id,
            title=group_class.title,
            event_type="class",
            status="canceled" if group_class.canceled else "scheduled",
            starts_at=group_class.starts_at,
            ends_at=group_class.ends_at,
            professional_id=group_class.instructor_id,
            location=group_class.location,
            notes=f"Turma de {group_class.modality}",
        )
        group_class.schedule_event_id = event.pk
        group_class.status = "canceled" if group_class.canceled else "scheduled"
        group_class.series_id = event.series_id
        group_class.save(update_fields=["schedule_event", "status", "series_id"])


class Migration(migrations.Migration):

    dependencies = [
        ("operations", "0007_accessdevice_diagnostics"),
        ("schedule", "0004_schedule_recurrence"),
    ]

    operations = [
        migrations.AddField(
            model_name="groupclass",
            name="recurrence",
            field=models.CharField(
                choices=[("none", "Não repetir"), ("daily", "Diariamente"), ("weekly", "Semanalmente")],
                default="none",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="groupclass",
            name="recurrence_count",
            field=models.PositiveSmallIntegerField(default=1),
        ),
        migrations.AddField(
            model_name="groupclass",
            name="schedule_event",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="group_class",
                to="schedule.scheduleevent",
            ),
        ),
        migrations.AddField(
            model_name="groupclass",
            name="series_id",
            field=models.UUIDField(blank=True, db_index=True, null=True),
        ),
        migrations.AddField(
            model_name="groupclass",
            name="status",
            field=models.CharField(
                choices=[
                    ("scheduled", "Agendada"),
                    ("in_progress", "Em andamento"),
                    ("completed", "Realizada"),
                    ("canceled", "Cancelada"),
                    ("inactive", "Inativa"),
                ],
                db_index=True,
                default="scheduled",
                max_length=20,
            ),
        ),
        migrations.RunPython(link_existing_classes, migrations.RunPython.noop),
    ]
