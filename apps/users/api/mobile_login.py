"""Student login for native clients. Public endpoint: never trust app headers as identity."""
import hashlib
import ipaddress
import os
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password, check_password
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone
from rest_framework.response import Response
from rest_framework import serializers
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.users.models import MobileLoginBucket, MobileLoginChallenge
from apps.users.api.login_session import record_login_session


class MobileCredentials(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(trim_whitespace=False, max_length=1024)
    two_factor_code = serializers.RegexField(r"^\d{6}$", required=False)


def client_ip(request):
    # Vercel overwrites X-Forwarded-For at its ingress. Trust it only when
    # this process is running on Vercel; local/direct requests use REMOTE_ADDR.
    candidate = request.META.get("REMOTE_ADDR", "")
    if os.getenv("VERCEL") == "1":
        candidate = request.META.get("HTTP_X_FORWARDED_FOR", candidate).split(",")[0].strip()
    try:
        return str(ipaddress.ip_address(candidate))
    except ValueError:
        return "unknown"


def consume_limit(kind, value, limit):
    key = hashlib.sha256(f"{kind}:{value}".encode()).hexdigest()
    now = timezone.now()
    with transaction.atomic():
        bucket, _ = MobileLoginBucket.objects.get_or_create(key=key, defaults={"expires_at": now + timedelta(minutes=15)})
        bucket = MobileLoginBucket.objects.select_for_update().get(pk=bucket.pk)
        if bucket.expires_at <= now:
            bucket.count = 0
            bucket.expires_at = now + timedelta(minutes=15)
        if bucket.count >= limit:
            return False
        bucket.count += 1
        bucket.save(update_fields=["count", "expires_at"])
    return True


class MobileTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        ip = client_ip(request)
        if not consume_limit("ip", ip, 30):
            return Response({"detail": "Muitas tentativas de acesso. Aguarde 15 minutos."}, status=429)
        serializer = MobileCredentials(data=request.data)
        serializer.is_valid(raise_exception=True)
        credentials = serializer.validated_data
        email = credentials["email"].strip().lower()
        if not consume_limit("account", email, 10):
            return Response({"detail": "Muitas tentativas de acesso. Aguarde 15 minutos."}, status=429)
        user = authenticate(request, email=email, password=credentials["password"])
        if not user:
            return Response({"detail": "E-mail ou senha inválidos."}, status=401)
        if not user.is_student_portal or not getattr(user, "portal_student", None):
            return Response({"detail": "Use a conta do portal do aluno. O acesso da gestão continua no Cfit web."}, status=403)
        if user.academy_users.exists() and not user.academy_users.filter(active=True).exists():
            return Response({"detail": "Este acesso foi desativado. Procure sua academia."}, status=403)
        if user.two_factor_enabled:
            supplied = credentials.get("two_factor_code")
            with transaction.atomic():
                challenge = MobileLoginChallenge.objects.select_for_update().filter(user=user).first()
                now = timezone.now()
                if not supplied:
                    if not challenge or (now - challenge.sent_at).total_seconds() >= 60:
                        code = f"{secrets.randbelow(1_000_000):06d}"
                        # Row lock for the user serializes creation of their first challenge.
                        type(user).objects.select_for_update().get(pk=user.pk)
                        challenge = MobileLoginChallenge.objects.select_for_update().filter(user=user).first()
                        if not challenge or (now - challenge.sent_at).total_seconds() >= 60:
                            MobileLoginChallenge.objects.update_or_create(user=user, defaults={"code_hash": make_password(code), "expires_at": now + timedelta(minutes=5), "sent_at": now})
                            send_mail("Código de acesso do Cfit", f"Seu código de verificação é {code}. Ele expira em 5 minutos.", settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
                    return Response({"detail": "Enviamos um código de verificação para o seu e-mail.", "two_factor_required": True}, status=428)
                if not challenge or challenge.expires_at <= now or not check_password(supplied, challenge.code_hash):
                    return Response({"detail": "Código de verificação inválido ou expirado.", "two_factor_required": True}, status=401)
                challenge.delete()
        # Reuse SimpleJWT validation, token policy, blacklist and last_login behavior.
        token_serializer = self.get_serializer(data={"email": user.email, "password": credentials["password"]})
        token_serializer.is_valid(raise_exception=True)
        response = Response(token_serializer.validated_data, status=200)
        if response.status_code == 200:
            record_login_session(request, user, response.data, ip_address=None if ip == "unknown" else ip)
        return response
