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

    class Meta:
        model = CheckIn

        fields = [
            "id",
            "student",
            "student_name",
            "checked_in_at",
            "source",
            "source_label",
            "notes",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "student_name",
            "source_label",
            "created_at",
        ]
