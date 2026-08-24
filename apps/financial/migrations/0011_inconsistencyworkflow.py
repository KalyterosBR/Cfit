import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("academy", "0004_academy_onboarding_fields"),
        ("financial", "0010_charge_payment_provider_charge_payment_url_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]
    operations = [
        migrations.CreateModel(
            name="InconsistencyWorkflow",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("active", models.BooleanField(default=True)),
                ("issue_key", models.CharField(max_length=180)),
                ("entity_type", models.CharField(max_length=80)),
                ("entity_id", models.CharField(max_length=64)),
                ("status", models.CharField(choices=[("open", "Aberta"), ("in_progress", "Em andamento"), ("resolved", "Resolvida")], default="open", max_length=20)),
                ("due_at", models.DateTimeField(blank=True, null=True)),
                ("resolution", models.TextField(blank=True)),
                ("comments", models.JSONField(blank=True, default=list)),
                ("academy", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="financial_inconsistency_workflows", to="academy.academy")),
                ("assigned_to", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="financial_inconsistencies", to=settings.AUTH_USER_MODEL)),
            ],
            options={"constraints": [models.UniqueConstraint(fields=("academy", "issue_key"), name="unique_financial_issue_workflow")]},
        ),
    ]
