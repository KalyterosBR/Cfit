from rest_framework import serializers

from apps.checkins.models import CheckIn


class CheckInSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="student.name",
        read_only=True,
    )

    source_label = serializers.CharField(
        source="get_source_display",
        read_only=True,
    )
    access_result_label = serializers.CharField(
        source="get_access_result_display",
        read_only=True,
    )

    class Meta:
        model = CheckIn

        fields = [
            "id",
            "student",
            "student_name",
            "checked_in_at",
            "source",
            "source_label",
            "access_result",
            "access_result_label",
            "block_reason",
            "equipment",
            "notes",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "student_name",
            "source_label",
            "access_result_label",
            "created_at",
        ]

    def validate(self, attrs):
        if (
            attrs.get("access_result") == CheckIn.AccessResult.BLOCKED
            and not attrs.get("block_reason", "").strip()
        ):
            raise serializers.ValidationError(
                {"block_reason": "Informe o motivo do bloqueio."}
            )
        return attrs


class CheckInPeriodSerializer(serializers.Serializer):
    period = serializers.RegexField(
        regex=r"^\d{4}-(0[1-9]|1[0-2])$",
        required=False,
        error_messages={
            "invalid": "Informe o período no formato AAAA-MM.",
        },
    )


class CheckInGoalInputSerializer(serializers.Serializer):
    period = serializers.RegexField(
        regex=r"^\d{4}-(0[1-9]|1[0-2])$",
        error_messages={
            "invalid": "Informe o período no formato AAAA-MM.",
        },
    )
    target_count = serializers.IntegerField(min_value=1)


class CheckInFilterSerializer(serializers.Serializer):
    checked_in_from = serializers.DateField(required=False)
    checked_in_to = serializers.DateField(required=False)
    source = serializers.ChoiceField(
        choices=CheckIn.Source.choices,
        required=False,
    )
    access_result = serializers.ChoiceField(
        choices=CheckIn.AccessResult.choices,
        required=False,
    )

    def validate(self, attrs):
        start = attrs.get("checked_in_from")
        end = attrs.get("checked_in_to")
        if start and end and start > end:
            raise serializers.ValidationError(
                {"checked_in_to": "O fim deve ser posterior ao início."}
            )
        return attrs
