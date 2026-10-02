from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from apps.operations.models import LoginSession


def record_login_session(request, user, data, **session_context):
    token = AccessToken(data["access"])
    refresh = RefreshToken(data["refresh"])
    LoginSession.objects.update_or_create(
        token_jti=str(token["jti"]),
        defaults={"user": user, "refresh_jti": str(refresh["jti"]), "user_agent": request.headers.get("User-Agent", "")[:255], "ip_address": session_context.get("ip_address", request.META.get("REMOTE_ADDR"))},
    )
