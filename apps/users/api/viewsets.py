from rest_framework import status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.generics import ListAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.users.api.turnstile import validate_turnstile
from apps.users.api.serializers import AcademyUserSerializer, AdministrativeAuditSerializer
from apps.users.models import AcademyUser, AdministrativeAudit
from apps.users.permissions import ROLE_CAPABILITIES, HasCapability, get_active_membership
from apps.academy.models import Academy
from apps.academy.models import Unit


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


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        membership = get_active_membership(request.user)
        role = AcademyUser.Role.OWNER if request.user.is_superuser else (
            membership.role if membership else AcademyUser.Role.ADMIN
        )
        capabilities = ROLE_CAPABILITIES.get(role, set())
        return Response({
            "email": request.user.email,
            "name": request.user.get_full_name() or request.user.email,
            "role": role,
            "role_label": dict(AcademyUser.Role.choices).get(role),
            "academy": ({"id": membership.academy_id, "name": str(membership.academy)} if membership else None),
            "active_unit": ({"id": membership.active_unit_id, "name": membership.active_unit.name} if membership and membership.active_unit else None),
            "units": ([{"id": unit.id, "name": unit.name} for unit in membership.academy.units.filter(active=True)] if membership else []),
            "capabilities": ["*"] if "*" in capabilities else sorted(capabilities),
        })


class CurrentUnitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        membership = get_active_membership(request.user)
        if not membership:
            return Response({"detail": "Vínculo com academia não encontrado."}, status=status.HTTP_400_BAD_REQUEST)
        unit = Unit.objects.filter(pk=request.data.get("unit"), academy=membership.academy, active=True).first()
        if not unit:
            return Response({"unit": ["Selecione uma unidade ativa da sua academia."]}, status=status.HTTP_400_BAD_REQUEST)
        membership.active_unit = unit
        membership.save(update_fields=["active_unit", "updated_at"])
        return Response({"id": unit.id, "name": unit.name})


class AcademyScopedMixin:
    def get_membership(self):
        return get_active_membership(self.request.user)

    def get_academy(self):
        membership = self.get_membership()
        if membership:
            return membership.academy
        return Academy.objects.first() if self.request.user.is_superuser else None


class MembershipListView(AcademyScopedMixin, ListAPIView):
    serializer_class = AcademyUserSerializer
    permission_classes = [HasCapability]
    required_capability = "users.manage"

    def get_queryset(self):
        academy = self.get_academy()
        return AcademyUser.objects.filter(academy=academy).select_related("user") if academy else AcademyUser.objects.none()


class MembershipDetailView(AcademyScopedMixin, RetrieveUpdateAPIView):
    serializer_class = AcademyUserSerializer
    permission_classes = [HasCapability]
    required_capability = "users.manage"
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        academy = self.get_academy()
        return AcademyUser.objects.filter(academy=academy).select_related("user") if academy else AcademyUser.objects.none()

    def perform_update(self, serializer):
        membership = self.get_object()
        previous = {"role": membership.role, "active": membership.active}
        updated = serializer.save()
        AdministrativeAudit.objects.create(
            academy=updated.academy,
            actor=self.request.user,
            action="membership.updated",
            entity_type="academy_user",
            entity_id=str(updated.pk),
            previous_state=previous,
            new_state={"role": updated.role, "active": updated.active},
            reason=self.request.data.get("reason", ""),
        )


class AdministrativeAuditListView(AcademyScopedMixin, ListAPIView):
    serializer_class = AdministrativeAuditSerializer
    permission_classes = [HasCapability]
    required_capability = "audit.view"

    def get_queryset(self):
        academy = self.get_academy()
        return AdministrativeAudit.objects.filter(academy=academy).select_related("actor") if academy else AdministrativeAudit.objects.none()
