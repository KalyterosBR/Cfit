import json

from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.automations.models import AutomationExecution, AutomationRule
from apps.users.models import AdministrativeAudit
from apps.users.permissions import HasCapability, get_active_membership


class RuleSerializer(serializers.ModelSerializer):
    event_label = serializers.CharField(source="get_event_type_display", read_only=True)
    class Meta:
        model = AutomationRule
        fields = ["id", "name", "event_type", "event_label", "action_description", "responsible", "active", "created_at"]
        read_only_fields = ["id", "created_at"]


class ExecutionSerializer(serializers.ModelSerializer):
    rule_name = serializers.CharField(source="rule.name", read_only=True)
    class Meta:
        model = AutomationExecution
        fields = ["id", "rule", "rule_name", "status", "entity_type", "entity_id", "explanation", "payload", "created_at"]
        read_only_fields = fields


class AutomationRuleViewSet(viewsets.ModelViewSet):
    serializer_class = RuleSerializer
    permission_classes = [HasCapability]
    required_capability = "automations.manage"
    http_method_names = ["get", "post", "patch", "head", "options"]

    def academy(self):
        membership = get_active_membership(self.request.user)
        if membership: return membership.academy
        from apps.academy.models import Academy
        return Academy.objects.first()

    def get_queryset(self):
        academy = self.academy()
        return AutomationRule.objects.filter(academy=academy) if academy else AutomationRule.objects.none()

    def perform_create(self, serializer):
        rule = serializer.save(academy=self.academy())
        AdministrativeAudit.objects.create(academy=rule.academy, actor=self.request.user, action="automation.created", entity_type="automation_rule", entity_id=str(rule.pk), new_state=json.loads(json.dumps(self.get_serializer(rule).data, default=str)))

    def perform_update(self, serializer):
        rule = self.get_object()
        previous = json.loads(json.dumps(self.get_serializer(rule).data, default=str))
        updated = serializer.save()
        AdministrativeAudit.objects.create(
            academy=updated.academy, actor=self.request.user, action="automation.updated",
            entity_type="automation_rule", entity_id=str(updated.pk),
            previous_state=previous, new_state=json.loads(json.dumps(self.get_serializer(updated).data, default=str)),
            reason=self.request.data.get("reason", ""),
        )

    @action(detail=True, methods=["post"])
    def trigger(self, request, pk=None):
        rule = self.get_object()
        if not rule.active:
            return Response({"detail": "A automação está inativa."}, status=status.HTTP_400_BAD_REQUEST)
        execution = AutomationExecution.objects.create(
            rule=rule, triggered_by=request.user, entity_type=request.data.get("entity_type", ""),
            entity_id=request.data.get("entity_id", ""), payload=request.data.get("payload", {}),
            explanation=f"Evento {rule.get_event_type_display()} processado: {rule.action_description}",
        )
        return Response(ExecutionSerializer(execution).data, status=status.HTTP_201_CREATED)


class AutomationExecutionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ExecutionSerializer
    permission_classes = [HasCapability]
    required_capability = "automations.manage"
    def get_queryset(self):
        membership = get_active_membership(self.request.user)
        academy = membership.academy if membership else None
        queryset = AutomationExecution.objects.select_related("rule")
        return queryset.filter(rule__academy=academy) if academy else queryset
