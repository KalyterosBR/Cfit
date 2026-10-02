from datetime import timedelta
from unittest.mock import patch

from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.academy.models import Academy
from apps.operations.models import LoginSession
from apps.students.models import Student
from apps.users.models import MobileLoginBucket, MobileLoginChallenge, User


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class MobileLoginTests(APITestCase):
    url = "/api/auth/mobile/login/"

    def setUp(self):
        cache.clear()
        self.academy = Academy.objects.create(name="Academia teste")
        self.user = User.objects.create_user(email="aluno@cfit.test", password="Teste123!", is_student_portal=True, must_change_password=True)
        self.student = Student.objects.create(name="Aluno teste", cpf="12345678901", academy=self.academy, portal_user=self.user)
        self.payload = {"email": self.user.email, "password": "Teste123!"}

    @patch("apps.users.api.viewsets.validate_turnstile", return_value=False)
    def test_native_login_does_not_require_captcha_but_web_still_requires_it(self, validate):
        native = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(native.status_code, 200)
        self.assertIn("access", native.data)
        validate.assert_not_called()
        self.assertEqual(LoginSession.objects.filter(user=self.user).count(), 1)
        web = self.client.post("/api/auth/login/", self.payload, format="json")
        self.assertEqual(web.status_code, 400)
        validate.assert_called_once()

    def test_session_refresh_profile_and_isolated_portal(self):
        other = Student.objects.create(name="Outro aluno", cpf="98765432100", academy=self.academy)
        tokens = self.client.post(self.url, self.payload, format="json").data
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        profile = self.client.get("/api/users/me/")
        self.assertEqual(profile.data["role"], "STUDENT")
        self.assertTrue(profile.data["must_change_password"])
        portal = self.client.get("/api/users/portal/me/", {"student_id": str(other.pk)})
        self.assertEqual(portal.data["student"]["id"], self.student.id)
        refreshed = self.client.post("/api/auth/refresh/", {"refresh": tokens["refresh"]}, format="json")
        self.assertEqual(refreshed.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refreshed.data['access']}")
        self.assertEqual(self.client.get("/api/users/me/").status_code, 200)
        LoginSession.objects.filter(user=self.user).update(revoked_at=timezone.now())
        self.assertEqual(self.client.get("/api/users/me/").status_code, 401)

    def test_admin_and_unlinked_student_cannot_use_native_login(self):
        self.user.is_student_portal = False
        self.user.save()
        self.assertEqual(self.client.post(self.url, self.payload, format="json").status_code, 403)
        self.user.is_student_portal = True
        self.user.save()
        self.student.portal_user = None
        self.student.save()
        self.assertEqual(self.client.post(self.url, self.payload, format="json").status_code, 403)
        self.assertFalse(LoginSession.objects.exists())

    def test_inactive_user_and_invalid_password_do_not_create_session(self):
        self.assertEqual(self.client.post(self.url, {**self.payload, "password": "wrong"}, format="json").status_code, 401)
        self.user.is_active = False
        self.user.save()
        self.assertEqual(self.client.post(self.url, self.payload, format="json").status_code, 401)
        self.assertFalse(LoginSession.objects.exists())

    def test_limits_survive_cache_clear_and_block_distributed_account_attempts(self):
        for i in range(10):
            result = self.client.post(self.url, {**self.payload, "password": "wrong"}, format="json", REMOTE_ADDR=f"192.0.2.{i + 1}")
            self.assertEqual(result.status_code, 401)
            cache.clear()
        blocked = self.client.post(self.url, self.payload, format="json", REMOTE_ADDR="192.0.2.50")
        self.assertEqual(blocked.status_code, 429)
        MobileLoginBucket.objects.update(expires_at=timezone.now() - timedelta(seconds=1))
        self.assertEqual(self.client.post(self.url, self.payload, format="json").status_code, 200)

    def test_ip_limit_cannot_be_bypassed_with_email_or_forwarded_header(self):
        for i in range(30):
            self.client.post(self.url, {"email": f"unknown{i}@cfit.test", "password": "wrong"}, format="json", HTTP_X_FORWARDED_FOR=f"192.0.2.{i}")
        self.assertEqual(self.client.post(self.url, self.payload, format="json", HTTP_X_FORWARDED_FOR="203.0.113.50").status_code, 429)

    def test_two_factor_is_hashed_persistent_single_use_and_email_is_rate_limited(self):
        self.user.two_factor_enabled = True
        self.user.save()
        first = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(first.status_code, 428)
        self.assertNotIn("access", first.data)
        self.assertFalse(LoginSession.objects.exists())
        code = mail.outbox[-1].body.split("é ")[1].split(".")[0]
        self.assertNotEqual(MobileLoginChallenge.objects.get(user=self.user).code_hash, code)
        self.client.post(self.url, self.payload, format="json")
        self.assertEqual(len(mail.outbox), 1)
        cache.clear()
        invalid = self.client.post(self.url, {**self.payload, "two_factor_code": "000000" if code != "000000" else "111111"}, format="json")
        self.assertEqual(invalid.status_code, 401)
        accepted = self.client.post(self.url, {**self.payload, "two_factor_code": code}, format="json")
        self.assertEqual(accepted.status_code, 200)
        self.assertFalse(MobileLoginChallenge.objects.exists())
        reused = self.client.post(self.url, {**self.payload, "two_factor_code": code}, format="json")
        self.assertEqual(reused.status_code, 401)

    def test_expired_two_factor_code_is_rejected(self):
        self.user.two_factor_enabled = True
        self.user.save()
        self.client.post(self.url, self.payload, format="json")
        code = mail.outbox[-1].body.split("é ")[1].split(".")[0]
        MobileLoginChallenge.objects.update(expires_at=timezone.now() - timedelta(seconds=1))
        self.assertEqual(self.client.post(self.url, {**self.payload, "two_factor_code": code}, format="json").status_code, 401)

    def test_native_login_normalizes_email(self):
        self.assertEqual(self.client.post(self.url, {**self.payload, "email": " ALUNO@CFIT.TEST "}, format="json").status_code, 200)

    @patch.dict("os.environ", {"VERCEL": "1"})
    def test_vercel_uses_the_ip_overwritten_by_its_ingress(self):
        from apps.users.api.mobile_login import client_ip
        from rest_framework.test import APIRequestFactory
        request = APIRequestFactory().post(self.url, HTTP_X_FORWARDED_FOR="2001:db8::1", REMOTE_ADDR="127.0.0.1")
        self.assertEqual(client_ip(request), "2001:db8::1")
        result = self.client.post(self.url, self.payload, format="json", HTTP_X_FORWARDED_FOR="192.0.2.9")
        self.assertEqual(result.status_code, 200)
        self.assertEqual(str(LoginSession.objects.get(user=self.user).ip_address), "192.0.2.9")
