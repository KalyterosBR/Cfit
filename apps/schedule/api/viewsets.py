from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.schedule.api.serializers import ScheduleEventSerializer
from apps.schedule.models import ScheduleEvent
from apps.users.models import AdministrativeAudit
from apps.users.permissions import ScopedCapability, get_request_scope


class ScheduleEventViewSet(viewsets.ModelViewSet):
    serializer_class = ScheduleEventSerializer
    permission_classes = [ScopedCapability]
    read_capability = "schedule.view"
    write_capability = "schedule.manage"

    def get_queryset(self):
        queryset = ScheduleEvent.objects.select_related("student", "professional")
        academy, unit = get_request_scope(self.request.user)
        if academy:
            queryset = queryset.filter(unit__academy=academy)
        if unit:
            queryset = queryset.filter(unit=unit)
        start = self.request.query_params.get("from")
        end = self.request.query_params.get("to")
        event_type = self.request.query_params.get("event_type")
        status_value = self.request.query_params.get("status")
        professional = self.request.query_params.get("professional")
        search = self.request.query_params.get("search", "").strip()
        if start: queryset = queryset.filter(starts_at__date__gte=start)
        if end: queryset = queryset.filter(starts_at__date__lte=end)
        if event_type in ScheduleEvent.EventType.values: queryset = queryset.filter(event_type=event_type)
        if status_value in ScheduleEvent.Status.values: queryset = queryset.filter(status=status_value)
        if professional: queryset = queryset.filter(professional_id=professional)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(student__name__icontains=search)
                | Q(location__icontains=search) | Q(notes__icontains=search)
            )
        return queryset

    def perform_create(self, serializer):
        academy, unit = get_request_scope(self.request.user)
        event = serializer.save(
            unit=unit,
            professional=serializer.validated_data.get("professional", self.request.user),
        )
        AdministrativeAudit.objects.create(
            academy=academy, actor=self.request.user, action="schedule.created",
            entity_type="schedule_event", entity_id=str(event.pk),
            new_state={"title": event.title, "status": event.status},
        )
        if event.recurrence != "none" and event.recurrence_count > 1:
            interval = timedelta(days=1 if event.recurrence == "daily" else 7)
            ScheduleEvent.objects.bulk_create([
                ScheduleEvent(unit=event.unit, title=event.title, event_type=event.event_type, status=event.status, starts_at=event.starts_at + interval * offset, ends_at=event.ends_at + interval * offset, student=event.student, professional=event.professional, location=event.location, notes=event.notes, reminder_at=event.reminder_at + interval * offset if event.reminder_at else None, recurrence=event.recurrence, recurrence_count=event.recurrence_count, series_id=event.series_id)
                for offset in range(1, event.recurrence_count)
            ])

    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        event = self.get_object()
        event.confirmed_at = timezone.now()
        event.save(update_fields=["confirmed_at", "updated_at"])
        return Response(self.get_serializer(event).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        event = self.get_object()
        event.status = ScheduleEvent.Status.CANCELED
        event.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(event).data)
