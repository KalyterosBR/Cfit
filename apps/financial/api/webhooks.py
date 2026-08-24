import os
import secrets

from django.db import transaction
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.financial.models import Charge, PaymentWebhookEvent


class PaymentWebhookView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        configured = os.getenv("PAYMENT_WEBHOOK_SECRET", "")
        supplied = request.headers.get("X-Cfit-Webhook-Secret", "")
        if not configured or not secrets.compare_digest(configured, supplied):
            return Response({"detail": "Webhook não autorizado."}, status=401)
        event_id = str(request.data.get("event_id", "")).strip()
        if not event_id:
            return Response({"event_id": ["Informe o identificador idempotente do evento."]}, status=400)
        previous = PaymentWebhookEvent.objects.filter(event_id=event_id).first()
        if previous:
            return Response({"detail": "Evento já processado."})
        charge = Charge.objects.select_for_update().filter(provider_charge_id=request.data.get("charge_id")).first()
        event = PaymentWebhookEvent.objects.create(event_id=event_id, provider=str(request.data.get("provider", "external")), charge=charge, event_type=str(request.data.get("status", "unknown")), payload=request.data)
        if not charge:
            return Response({"detail": "Cobrança não encontrada.", "event": event.id}, status=404)
        if request.data.get("status") == "paid" and charge.status != Charge.Status.PAID:
            charge.status = Charge.Status.PAID; charge.paid_at = timezone.now(); charge.payment_method = request.data.get("payment_method", Charge.PaymentMethod.PIX)
            charge.save(update_fields=["status", "paid_at", "payment_method", "updated_at"])
        elif request.data.get("status") in {"refunded", "canceled"}:
            charge.status = Charge.Status.CANCELED; charge.notes = f"Atualizada pelo gateway: {request.data.get('status')}"
            charge.save(update_fields=["status", "notes", "updated_at"])
        return Response({"detail": "Evento processado.", "charge": charge.id})
