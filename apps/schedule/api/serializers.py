from datetime import timedelta

from rest_framework import serializers
from apps.schedule.models import ScheduleEvent
from apps.users.permissions import get_request_scope


class ScheduleEventSerializer(serializers.ModelSerializer):
    event_type_label = serializers.CharField(source="get_event_type_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    student_name = serializers.CharField(source="student.name", read_only=True)
    professional_name = serializers.CharField(source="professional.email", read_only=True)
    group_class_id = serializers.UUIDField(source="group_class.id", read_only=True)
    group_class_modality = serializers.CharField(source="group_class.modality", read_only=True)
    capacity = serializers.IntegerField(source="group_class.capacity", read_only=True)
    confirmed_count = serializers.SerializerMethodField()
    waitlist_count = serializers.SerializerMethodField()
    available_spots = serializers.SerializerMethodField()

    class Meta:
        model = ScheduleEvent
        fields = "__all__"
        extra_kwargs = {"professional": {"required": False}}

    def _group_class(self, obj):
        try:
            return obj.group_class
        except ScheduleEvent.group_class.RelatedObjectDoesNotExist:
            return None

    def get_confirmed_count(self, obj):
        group_class = self._group_class(obj)
        return group_class.bookings.filter(status__in=["confirmed", "attended"]).count() if group_class else None

    def get_waitlist_count(self, obj):
        group_class = self._group_class(obj)
        return group_class.bookings.filter(status="waitlist").count() if group_class else None

    def get_available_spots(self, obj):
        group_class = self._group_class(obj)
        if not group_class:
            return None
        return max(group_class.capacity - self.get_confirmed_count(obj), 0)

    def validate(self, attrs):
        start = attrs.get("starts_at", getattr(self.instance, "starts_at", None))
        end = attrs.get("ends_at", getattr(self.instance, "ends_at", None))
        if start and end and end <= start:
            raise serializers.ValidationError({"ends_at": "O término deve ser posterior ao início."})
        request = self.context.get("request")
        academy, _ = get_request_scope(request.user) if request else (None, None)
        student = attrs.get("student", getattr(self.instance, "student", None))
        if academy and student and student.academy_id != academy.id:
            raise serializers.ValidationError({"student": "O aluno não pertence à academia da sessão."})
        professional = attrs.get("professional", getattr(self.instance, "professional", None)) or (request.user if request else None)
        if academy and professional and not professional.academy_users.filter(
            academy=academy, active=True,
        ).exists() and professional != request.user:
            raise serializers.ValidationError({"professional": "O profissional não pertence à academia da sessão."})
        unit = getattr(self.instance, "unit", None)
        if request and not unit:
            _, unit = get_request_scope(request.user)
        if start and end and professional and unit:
            conflicts = ScheduleEvent.objects.filter(
                unit=unit, professional=professional, starts_at__lt=end, ends_at__gt=start,
            ).exclude(status=ScheduleEvent.Status.CANCELED)
            if self.instance:
                conflicts = conflicts.exclude(pk=self.instance.pk)
            if conflicts.exists():
                raise serializers.ValidationError({"starts_at": "O profissional já possui um compromisso neste horário."})
            location = attrs.get("location", getattr(self.instance, "location", ""))
            if location and ScheduleEvent.objects.filter(unit=unit, location__iexact=location, starts_at__lt=end, ends_at__gt=start).exclude(status=ScheduleEvent.Status.CANCELED).exclude(pk=getattr(self.instance, "pk", None)).exists():
                raise serializers.ValidationError({"location": "A sala ou local já está ocupado neste horário."})
        if attrs.get("recurrence_count", getattr(self.instance, "recurrence_count", 1)) > 52:
            raise serializers.ValidationError({"recurrence_count": "Crie no máximo 52 ocorrências por série."})
        recurrence = attrs.get("recurrence", getattr(self.instance, "recurrence", "none"))
        recurrence_count = attrs.get("recurrence_count", getattr(self.instance, "recurrence_count", 1))
        if not self.instance and recurrence != "none" and recurrence_count > 1 and start and end and unit:
            interval = timedelta(days=1 if recurrence == "daily" else 7)
            for offset in range(1, recurrence_count):
                occurrence_start = start + interval * offset
                occurrence_end = end + interval * offset
                if ScheduleEvent.objects.filter(
                    unit=unit,
                    professional=professional,
                    starts_at__lt=occurrence_end,
                    ends_at__gt=occurrence_start,
                ).exclude(status=ScheduleEvent.Status.CANCELED).exists():
                    raise serializers.ValidationError({
                        "recurrence_count": f"A ocorrência {offset + 1} conflita com outro compromisso do profissional.",
                    })
                location = attrs.get("location", "")
                if location and ScheduleEvent.objects.filter(
                    unit=unit,
                    location__iexact=location,
                    starts_at__lt=occurrence_end,
                    ends_at__gt=occurrence_start,
                ).exclude(status=ScheduleEvent.Status.CANCELED).exists():
                    raise serializers.ValidationError({
                        "recurrence_count": f"A ocorrência {offset + 1} conflita com a ocupação da sala ou local.",
                    })
        return attrs
