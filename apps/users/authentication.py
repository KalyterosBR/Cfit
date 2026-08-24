from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication


class SessionAwareJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        from apps.operations.models import LoginSession
        sessions = LoginSession.objects.filter(user=user)
        session = sessions.filter(token_jti=str(validated_token.get("jti", ""))).first()
        if sessions.exists() and (not session or session.revoked_at):
            raise AuthenticationFailed("Esta sessão foi encerrada.")
        return user
