import json

from rest_framework import viewsets

from apps.academy.models import Unit
from apps.academy.serializers import UnitSerializer
from apps.users.permissions import HasCapability, get_active_membership
from apps.users.models import AdministrativeAudit


class UnitViewSet(viewsets.ModelViewSet):
    serializer_class = UnitSerializer
    permission_classes = [HasCapability]
    required_capability = "units.manage"
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        membership = get_active_membership(self.request.user)
        if membership:
            return Unit.objects.filter(academy=membership.academy)
        return Unit.objects.all() if self.request.user.is_superuser or not self.request.user.academy_users.exists() else Unit.objects.none()

    def perform_create(self, serializer):
        membership = get_active_membership(self.request.user)
        academy = membership.academy if membership else serializer.validated_data.get("academy")
        if academy is None:
            from apps.academy.models import Academy
            academy = Academy.objects.first()
        unit = serializer.save(academy=academy)
        AdministrativeAudit.objects.create(
            academy=academy, actor=self.request.user, action="unit.created",
            entity_type="unit", entity_id=str(unit.pk),
            new_state=json.loads(json.dumps(self.get_serializer(unit).data, default=str)),
        )

    def perform_update(self, serializer):
        unit = self.get_object()
        previous = json.loads(json.dumps(self.get_serializer(unit).data, default=str))
        updated = serializer.save()
        AdministrativeAudit.objects.create(
            academy=updated.academy, actor=self.request.user, action="unit.updated",
            entity_type="unit", entity_id=str(updated.pk), previous_state=previous,
            new_state=json.loads(json.dumps(self.get_serializer(updated).data, default=str)),
            reason=self.request.data.get("reason", ""),
        )
