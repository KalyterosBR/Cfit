import base64

import requests
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend


class ResendEmailBackend(BaseEmailBackend):
    """Django email backend backed by Resend's transactional email API."""

    endpoint = "https://api.resend.com/emails"

    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        api_key = getattr(settings, "RESEND_API_KEY", "")
        if not api_key:
            if self.fail_silently:
                return 0
            raise RuntimeError("RESEND_API_KEY não foi configurada.")

        sent = 0
        for message in email_messages:
            if not message.recipients():
                continue
            try:
                response = requests.post(
                    self.endpoint,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json=self._payload(message),
                    timeout=10,
                )
                response.raise_for_status()
                sent += 1
            except requests.RequestException:
                if not self.fail_silently:
                    raise
        return sent

    @staticmethod
    def _payload(message):
        payload = {
            "from": message.from_email or settings.DEFAULT_FROM_EMAIL,
            "to": list(message.to),
            "subject": message.subject,
        }
        if message.cc:
            payload["cc"] = list(message.cc)
        if message.bcc:
            payload["bcc"] = list(message.bcc)
        if message.reply_to:
            payload["reply_to"] = list(message.reply_to)

        html_body = None
        for alternative in getattr(message, "alternatives", ()):
            content, mimetype = alternative
            if mimetype == "text/html":
                html_body = content
                break

        if message.content_subtype == "html":
            payload["html"] = message.body
        else:
            payload["text"] = message.body
            if html_body:
                payload["html"] = html_body

        attachments = []
        for attachment in message.attachments:
            filename, content, _mimetype = attachment
            if not filename:
                continue
            if isinstance(content, str):
                content = content.encode()
            attachments.append(
                {
                    "filename": filename,
                    "content": base64.b64encode(content).decode("ascii"),
                }
            )
        if attachments:
            payload["attachments"] = attachments
        return payload
