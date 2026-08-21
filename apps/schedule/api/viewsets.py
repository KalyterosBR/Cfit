from rest_framework import viewsets
from apps.schedule.api.serializers import ScheduleEventSerializer
from apps.schedule.models import ScheduleEvent


class ScheduleEventViewSet(viewsets.ModelViewSet):
    serializer_class = ScheduleEventSerializer

    def get_queryset(self):
        queryset = ScheduleEvent.objects.select_related("student", "professional")
        start = self.request.query_params.get("from")
        end = self.request.query_params.get("to")
        event_type = self.request.query_params.get("event_type")
        if start: queryset = queryset.filter(starts_at__date__gte=start)
        if end: queryset = queryset.filter(starts_at__date__lte=end)
        if event_type in ScheduleEvent.EventType.values: queryset = queryset.filter(event_type=event_type)
        return queryset

    def perform_create(self, serializer):
        serializer.save(professional=serializer.validated_data.get("professional", self.request.user))
