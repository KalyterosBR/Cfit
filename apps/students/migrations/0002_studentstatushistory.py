import django.db.models.deletion
import uuid

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("students", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="StudentStatusHistory",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "event_type",
                    models.CharField(
                        choices=[
                            ("deactivated", "Aluno inativado"),
                            ("reactivated", "Aluno reativado"),
                        ],
                        max_length=20,
                    ),
                ),
                ("reason", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "actor",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="student_status_changes",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "student",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="status_history",
                        to="students.student",
                    ),
                ),
            ],
            options={
                "verbose_name": "Histórico de status do aluno",
                "verbose_name_plural": "Históricos de status dos alunos",
                "ordering": ["-created_at"],
            },
        ),
    ]
