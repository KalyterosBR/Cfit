from rest_framework import status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.users.api.turnstile import validate_turnstile


class TurnstileTokenObtainPairView(
    TokenObtainPairView,
):
    def post(
        self,
        request,
        *args,
        **kwargs,
    ):
        turnstile_token = request.data.get(
            "turnstile_token",
        )

        if not validate_turnstile(
            turnstile_token,
        ):
            return Response(
                {
                    "detail": ("Falha na verificação de segurança."),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().post(
            request,
            *args,
            **kwargs,
        )
