from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.operations.models import AccessDevice, CommunicationCampaign
from apps.operations.providers import CommunicationAdapter


class Command(BaseCommand):
    help = "Atualiza dispositivos offline e sinaliza campanhas agendadas prontas para processamento."

    def handle(self, *args, **options):
        offline_before = timezone.now() - timedelta(minutes=5)
        offline = AccessDevice.objects.filter(active=True, last_seen_at__lt=offline_before).exclude(status="offline").update(status="offline", last_error="Heartbeat não recebido nos últimos 5 minutos", updated_at=timezone.now())
        campaigns = CommunicationCampaign.objects.filter(status=CommunicationCampaign.Status.READY, scheduled_at__isnull=False, scheduled_at__lte=timezone.now())
        processed = 0
        for campaign in campaigns:
            campaign.status = CommunicationCampaign.Status.PROCESSING; campaign.save(update_fields=["status", "updated_at"])
            for delivery in campaign.deliveries.filter(status__in=["queued", "failed"]):
                delivery.attempts += 1
                try:
                    success, message, external_id = CommunicationAdapter().send(delivery)
                except Exception as error:
                    success, message, external_id = False, str(error)[:255], ""
                delivery.status = "sent" if success else "failed"; delivery.last_error = "" if success else message; delivery.external_id = external_id; delivery.sent_at = timezone.now() if success else None
                delivery.save(update_fields=["attempts", "status", "last_error", "external_id", "sent_at", "updated_at"])
            campaign.status = CommunicationCampaign.Status.COMPLETED; campaign.save(update_fields=["status", "updated_at"]); processed += 1
        self.stdout.write(self.style.SUCCESS(f"Dispositivos offline: {offline}; campanhas processadas: {processed}."))
