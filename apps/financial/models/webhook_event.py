from django.db import models


class PaymentWebhookEvent(models.Model):
    event_id = models.CharField(max_length=120, unique=True)
    provider = models.CharField(max_length=40)
    charge = models.ForeignKey("financial.Charge", on_delete=models.PROTECT, null=True, blank=True, related_name="provider_events")
    event_type = models.CharField(max_length=40)
    payload = models.JSONField(default=dict)
    processed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-processed_at"]
