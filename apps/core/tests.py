from unittest.mock import Mock, patch

from django.core import mail
from django.test import SimpleTestCase, override_settings


@override_settings(
    EMAIL_BACKEND="apps.core.email_backends.ResendEmailBackend",
    RESEND_API_KEY="re_test_key",
    DEFAULT_FROM_EMAIL="Cfit <acesso@cfit.test>",
)
class ResendEmailBackendTests(SimpleTestCase):
    @patch("apps.core.email_backends.requests.post")
    def test_sends_text_and_html_through_resend(self, post):
        post.return_value = Mock(raise_for_status=Mock())

        sent = mail.send_mail(
            "Redefina sua senha",
            "Versão em texto",
            None,
            ["cliente@example.com"],
            html_message="<strong>Versão em HTML</strong>",
        )

        self.assertEqual(sent, 1)
        payload = post.call_args.kwargs["json"]
        self.assertEqual(payload["from"], "Cfit <acesso@cfit.test>")
        self.assertEqual(payload["to"], ["cliente@example.com"])
        self.assertEqual(payload["text"], "Versão em texto")
        self.assertEqual(payload["html"], "<strong>Versão em HTML</strong>")
        self.assertEqual(post.call_args.kwargs["timeout"], 10)

    @override_settings(RESEND_API_KEY="")
    def test_missing_api_key_raises_when_not_silent(self):
        with self.assertRaisesRegex(RuntimeError, "RESEND_API_KEY"):
            mail.send_mail("Assunto", "Mensagem", None, ["cliente@example.com"])
