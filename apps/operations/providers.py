import os

import requests
from django.core.mail import send_mail


class DeviceAdapter:
    def diagnose(self, device):
        if device.kind == "simulator":
            return True, "Simulador operacional"
        if not device.credential_env_key:
            return False, "Informe a variável de ambiente das credenciais."
        if not os.getenv(device.credential_env_key):
            return False, f"Credencial {device.credential_env_key} não configurada no ambiente."
        return True, f"Adaptador {device.provider} configurado; aguardando heartbeat do equipamento."


class CommunicationAdapter:
    def send(self, delivery):
        campaign = delivery.campaign
        if delivery.provider == "sandbox":
            return True, "Entrega simulada localmente", f"sandbox-{delivery.id}"
        if delivery.provider == "django_email":
            send_mail(campaign.name, campaign.message, None, [delivery.recipient], fail_silently=False)
            return True, "E-mail entregue ao backend configurado", ""
        if delivery.provider == "whatsapp_http":
            url = os.getenv("WHATSAPP_API_URL")
            token = os.getenv("WHATSAPP_API_TOKEN")
            if not url or not token:
                return False, "Configure WHATSAPP_API_URL e WHATSAPP_API_TOKEN no ambiente.", ""
            response = requests.post(
                url,
                json={"to": delivery.recipient, "message": campaign.message, "campaign_id": str(campaign.id)},
                headers={"Authorization": f"Bearer {token}"},
                timeout=10,
            )
            if response.ok:
                payload = response.json() if response.content else {}
                return True, "Mensagem aceita pelo provedor de WhatsApp", str(payload.get("id") or payload.get("message_id") or "")
            return False, f"Provedor respondeu HTTP {response.status_code}", ""
        return False, "Provedor de WhatsApp ainda não possui credenciais/adaptador configurado.", ""
