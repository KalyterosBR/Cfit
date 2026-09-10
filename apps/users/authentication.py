from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from rest_framework_simplejwt.authentication import JWTAuthentication


class SessionAwareJWTAuthentication(JWTAuthentication):
    TERMS_ALLOWED_PATHS = {
        "/api/users/me/",
        "/api/users/password/change/",
        "/api/users/terms/current/",
    }

    def authenticate(self, request):
        result = super().authenticate(request)
        if not result:
            return result

        user, validated_token = result
        if request.path in self.TERMS_ALLOWED_PATHS or user.is_student_portal:
            return result

        from apps.users.models import AcademyUser, LegalTerm, LegalTermAcceptance

        membership = (
            AcademyUser.objects.filter(user=user, active=True)
            .select_related("academy")
            .first()
        )
        if not membership:
            return result

        active_term = LegalTerm.objects.filter(
            academy=membership.academy,
            active=True,
        ).first()
        if active_term and not LegalTermAcceptance.objects.filter(
            term=active_term,
            user=user,
        ).exists():
            raise PermissionDenied(
                {
                    "detail": "Aceite o termo de uso e privacidade vigente para continuar.",
                    "code": "legal_terms_pending",
                }
            )
        return result

    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        from apps.operations.models import LoginSession
        sessions = LoginSession.objects.filter(user=user)
        session = sessions.filter(token_jti=str(validated_token.get("jti", ""))).first()
        if sessions.exists() and (not session or session.revoked_at):
            raise AuthenticationFailed("Esta sessão foi encerrada.")
        return user
