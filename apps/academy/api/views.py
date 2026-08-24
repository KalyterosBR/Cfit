from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.academy.serializers import AcademyOnboardingSerializer, AcademyOperationalSettingsSerializer, AcademySerializer
from apps.academy.models import AcademyOperationalSettings, Unit
from apps.academy.services.academy_service import (
    create_academy,
    list_academies,
)
from apps.users.models import AdministrativeAudit
from apps.users.permissions import get_request_scope, user_has_capability


@api_view(["GET", "POST", "PATCH"])
def academy_list(request):

    academy, _ = get_request_scope(request.user)

    if request.method == "GET":
        academies = [academy] if academy else list_academies()
        serializer = AcademySerializer(academies, many=True)
        return Response(serializer.data)

    if request.method == "PATCH":
        if not academy or not user_has_capability(request.user, "settings.manage"):
            return Response({"detail": "Sem permissão para alterar a academia."}, status=status.HTTP_403_FORBIDDEN)
        previous = AcademySerializer(academy).data
        serializer = AcademySerializer(academy, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        academy = serializer.save()
        AdministrativeAudit.objects.create(
            academy=academy, actor=request.user, action="academy.updated",
            entity_type="academy", entity_id=str(academy.pk),
            previous_state=previous, new_state=AcademySerializer(academy).data,
            reason=request.data.get("reason", ""),
        )
        return Response(AcademySerializer(academy).data)

    if request.method == "POST":
        if not user_has_capability(request.user, "settings.manage"):
            return Response({"detail": "Sem permissão para criar academias."}, status=status.HTTP_403_FORBIDDEN)
        serializer = AcademySerializer(data=request.data)

        if serializer.is_valid():
            academy = create_academy(serializer.validated_data)
            return Response(AcademySerializer(academy).data, status=201)

        return Response(serializer.errors, status=400)


@api_view(["GET", "PATCH"])
def operational_settings(request):
    academy, _ = get_request_scope(request.user)
    if not academy:
        return Response({"detail": "Academia não encontrada."}, status=404)
    settings, _ = AcademyOperationalSettings.objects.get_or_create(academy=academy)
    if request.method == "GET":
        return Response(AcademyOperationalSettingsSerializer(settings).data)
    if not user_has_capability(request.user, "settings.manage"):
        return Response({"detail": "Sem permissão para alterar configurações."}, status=403)
    previous = AcademyOperationalSettingsSerializer(settings).data
    serializer = AcademyOperationalSettingsSerializer(settings, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    settings = serializer.save()
    AdministrativeAudit.objects.create(
        academy=academy, actor=request.user, action="settings.updated",
        entity_type="academy_settings", entity_id=str(settings.pk),
        previous_state=previous, new_state=serializer.data,
        reason=request.data.get("reason", ""),
    )
    return Response(serializer.data)


@api_view(["GET", "POST"])
def academy_onboarding(request):
    academy, active_unit = get_request_scope(request.user)
    if not academy:
        return Response({"detail": "Academia não encontrada."}, status=404)
    if not user_has_capability(request.user, "settings.manage"):
        return Response({"detail": "Sem permissão para configurar a academia."}, status=403)
    unit = active_unit or academy.units.filter(active=True).first()
    if request.method == "GET":
        settings, _ = AcademyOperationalSettings.objects.get_or_create(academy=academy)
        return Response({
            "completed": bool(academy.onboarding_completed_at),
            "academy": AcademySerializer(academy).data,
            "unit": {"id": str(unit.id), "name": unit.name, "address": unit.address, "phone": unit.phone} if unit else None,
            "payment_grace_days": settings.payment_grace_days,
        })

    serializer = AcademyOnboardingSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    previous = AcademySerializer(academy).data
    with transaction.atomic():
        for field in ["name", "trade_name", "establishment_type", "size_range", "primary_goal", "phone", "email"]:
            setattr(academy, field, data.get(field, ""))
        academy.onboarding_completed_at = timezone.now()
        academy.save(update_fields=["name", "trade_name", "establishment_type", "size_range", "primary_goal", "phone", "email", "onboarding_completed_at", "updated_at"])

        if unit:
            unit.name = data["unit_name"]
            unit.address = data.get("unit_address", "")
            unit.phone = data.get("unit_phone", "")
            unit.save(update_fields=["name", "address", "phone", "updated_at"])
        else:
            base_code = slugify(data["unit_name"])[:32] or "matriz"
            code = base_code
            suffix = 2
            while academy.units.filter(code=code).exists():
                code = f"{base_code[:35]}-{suffix}"
                suffix += 1
            unit = Unit.objects.create(academy=academy, name=data["unit_name"], code=code, address=data.get("unit_address", ""), phone=data.get("unit_phone", ""))
            membership = request.user.academy_users.filter(academy=academy, active=True).first()
            if membership and not membership.active_unit:
                membership.active_unit = unit
                membership.save(update_fields=["active_unit", "updated_at"])

        settings, _ = AcademyOperationalSettings.objects.get_or_create(academy=academy)
        settings.payment_grace_days = data["payment_grace_days"]
        settings.save(update_fields=["payment_grace_days", "updated_at"])
        AdministrativeAudit.objects.create(
            academy=academy, actor=request.user, action="academy.onboarding_completed",
            entity_type="academy", entity_id=str(academy.pk), previous_state=previous,
            new_state=AcademySerializer(academy).data,
        )
    return Response({"completed": True, "academy": AcademySerializer(academy).data, "unit": {"id": str(unit.id), "name": unit.name}})
