import json
from datetime import timedelta

from django.utils import timezone
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
        fields = ["id", "unit", "name", "event_type", "event_label", "action_description", "priority", "responsible", "sla_hours", "paused_at", "active", "created_at", "updated_at"]
        read_only_fields = ["id", "unit", "created_at"]


class ExecutionSerializer(serializers.ModelSerializer):
    rule_name = serializers.CharField(source="rule.name", read_only=True)
    class Meta:
        model = AutomationExecution
        fields = ["id", "rule", "rule_name", "status", "entity_type", "entity_id", "explanation", "payload", "operational_status", "priority", "assigned_to", "resolution_notes", "resolved_at", "mode", "due_at", "attempts", "idempotency_key", "last_error", "created_at"]
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
        queryset = AutomationRule.objects.filter(academy=academy) if academy else AutomationRule.objects.none()
        membership = get_active_membership(self.request.user)
        return queryset.filter(unit=membership.active_unit) if membership and membership.active_unit else queryset

    def perform_create(self, serializer):
        membership = get_active_membership(self.request.user)
        rule = serializer.save(academy=self.academy(), unit=membership.active_unit if membership else None)
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
        mode = request.data.get("mode", AutomationExecution.Mode.TEST)
        if mode not in AutomationExecution.Mode.values:
            return Response({"mode": ["Modo de execução inválido."]}, status=400)
        execution = AutomationExecution.objects.create(
            rule=rule, triggered_by=request.user, entity_type=request.data.get("entity_type", ""),
            entity_id=request.data.get("entity_id", ""), payload=request.data.get("payload", {}),
            explanation=f"Evento {rule.get_event_type_display()} processado: {rule.action_description}",
            priority=rule.priority, assigned_to=rule.responsible,
            mode=mode, due_at=timezone.now() + timedelta(hours=rule.sla_hours),
        )
        return Response(ExecutionSerializer(execution).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"], url_path="process-events")
    def process_events(self, request):
        """Avalia regras ativas usando somente registros do contexto atual."""
        academy = self.academy()
        if academy and hasattr(academy, "operational_settings") and not academy.operational_settings.automations_enabled:
            return Response({"detail": "As automações estão desabilitadas nas configurações da academia."}, status=400)
        from apps.financial.models import Charge, RecurringPaymentAttempt
        from apps.schedule.models import ScheduleEvent
        from apps.students.models import Student

        today = timezone.localdate()
        created = []
        for rule in self.get_queryset().filter(active=True, paused_at__isnull=True):
            matches = []
            if rule.event_type == AutomationRule.Event.OVERDUE_CHARGE:
                matches = Charge.objects.filter(
                    unit=rule.unit, status=Charge.Status.OVERDUE, due_date__lt=today,
                ).values_list("pk", flat=True)[:50]
            elif rule.event_type == AutomationRule.Event.RECURRING_REJECTED:
                matches = RecurringPaymentAttempt.objects.filter(
                    charge__unit=rule.unit,
                    status=RecurringPaymentAttempt.Status.REJECTED,
                    occurred_at__gte=timezone.now() - timedelta(days=7),
                ).values_list("pk", flat=True)[:50]
            elif rule.event_type == AutomationRule.Event.PROLONGED_ABSENCE:
                matches = Student.objects.filter(
                    unit=rule.unit, active=True,
                ).exclude(
                    checkins__checked_in_at__gte=timezone.now() - timedelta(days=30),
                ).values_list("pk", flat=True)[:50]
            elif rule.event_type == AutomationRule.Event.PLAN_ENDING:
                matches = Student.objects.filter(
                    unit=rule.unit,
                    enrollments__status="active",
                    enrollments__due_date__range=(today, today + timedelta(days=15)),
                ).distinct().values_list("pk", flat=True)[:50]
            elif rule.event_type == AutomationRule.Event.BIRTHDAY:
                matches = Student.objects.filter(
                    unit=rule.unit, birth_date__month=today.month,
                    birth_date__day=today.day, active=True,
                ).values_list("pk", flat=True)[:50]
            elif rule.event_type == AutomationRule.Event.VISIT_WITHOUT_RETURN:
                matches = ScheduleEvent.objects.filter(
                    unit=rule.unit, event_type=ScheduleEvent.EventType.VISIT,
                    status=ScheduleEvent.Status.COMPLETED,
                    starts_at__lt=timezone.now() - timedelta(days=3),
                    student__isnull=True,
                ).values_list("pk", flat=True)[:50]

            for entity_id in matches:
                execution, was_created = AutomationExecution.objects.get_or_create(
                    idempotency_key=f"{rule.id}:{entity_id}:{today.isoformat()}",
                    defaults={
                        "rule": rule, "entity_id": str(entity_id),
                        "triggered_by": request.user,
                        "entity_type": rule.event_type,
                        "explanation": f"Condição {rule.get_event_type_display()} identificada: {rule.action_description}",
                        "payload": {"processed_on": today.isoformat()},
                        "priority": rule.priority,
                        "assigned_to": rule.responsible,
                        "mode": AutomationExecution.Mode.REAL,
                        "due_at": timezone.now() + timedelta(hours=rule.sla_hours),
                    },
                )
                if was_created:
                    created.append(execution)
        return Response(
            {"created_count": len(created), "executions": ExecutionSerializer(created, many=True).data},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def pause(self, request, pk=None):
        rule = self.get_object()
        rule.paused_at = None if rule.paused_at else timezone.now()
        rule.save(update_fields=["paused_at", "updated_at"])
        AdministrativeAudit.objects.create(academy=rule.academy, actor=request.user, action="automation.resumed" if rule.paused_at is None else "automation.paused", entity_type="automation_rule", entity_id=str(rule.id), reason=str(request.data.get("reason", "Pausa operacional"))[:255])
        return Response(self.get_serializer(rule).data)

    @action(detail=True, methods=["post"], url_path="resolve-execution")
    def resolve_execution(self, request, pk=None):
        rule = self.get_object()
        execution = rule.executions.filter(pk=request.data.get("execution")).first()
        if not execution:
            return Response({"execution": ["Ocorrência não encontrada."]}, status=404)
        operational_status = request.data.get("operational_status", "completed")
        if operational_status not in {"pending", "in_progress", "completed"}:
            return Response({"operational_status": ["Estado inválido."]}, status=400)
        execution.operational_status = operational_status
        execution.resolution_notes = request.data.get("resolution_notes", "")
        execution.assigned_to = request.user
        execution.resolved_at = timezone.now() if operational_status == "completed" else None
        execution.save(update_fields=["operational_status", "resolution_notes", "assigned_to", "resolved_at", "updated_at"])
        return Response(ExecutionSerializer(execution).data)


class AutomationExecutionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ExecutionSerializer
    permission_classes = [HasCapability]
    required_capability = "automations.manage"
    def get_queryset(self):
        membership = get_active_membership(self.request.user)
        academy = membership.academy if membership else None
        queryset = AutomationExecution.objects.select_related("rule")
        return queryset.filter(rule__academy=academy) if academy else queryset
