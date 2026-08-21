from rest_framework import serializers
from apps.schedule.models import ScheduleEvent


class ScheduleEventSerializer(serializers.ModelSerializer):
    event_type_label = serializers.CharField(source="get_event_type_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    student_name = serializers.CharField(source="student.name", read_only=True)
    professional_name = serializers.CharField(source="professional.email", read_only=True)

    class Meta:
        model = ScheduleEvent
        fields = "__all__"
        extra_kwargs = {"professional": {"required": False}}

    def validate(self, attrs):
        start = attrs.get("starts_at", getattr(self.instance, "starts_at", None))
        end = attrs.get("ends_at", getattr(self.instance, "ends_at", None))
        if start and end and end <= start:
            raise serializers.ValidationError({"ends_at": "O término deve ser posterior ao início."})
        return attrs
