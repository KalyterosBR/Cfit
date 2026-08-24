from django.conf import settings
from django.db import models
from apps.core.base.models import BaseModel


class InconsistencyWorkflow(BaseModel):
    academy = models.ForeignKey("academy.Academy", on_delete=models.PROTECT, related_name="financial_inconsistency_workflows")
    issue_key = models.CharField(max_length=180)
    entity_type = models.CharField(max_length=80)
    entity_id = models.CharField(max_length=64)
    status = models.CharField(max_length=20, choices=[("open", "Aberta"), ("in_progress", "Em andamento"), ("resolved", "Resolvida")], default="open")
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=True, blank=True, related_name="financial_inconsistencies")
    due_at = models.DateTimeField(null=True, blank=True)
    resolution = models.TextField(blank=True)
    comments = models.JSONField(default=list, blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["academy", "issue_key"], name="unique_financial_issue_workflow")]
