from rest_framework import serializers

from apps.enrollments.models import EnrollmentHistory


class EnrollmentHistorySerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="enrollment.student.name",
        read_only=True,
    )

    plan_name = serializers.CharField(
        source="enrollment.plan.name",
        read_only=True,
    )

    event_label = serializers.CharField(
        source="get_event_type_display",
        read_only=True,
    )

    class Meta:
        model = EnrollmentHistory

        fields = [
            "id",
            "enrollment",
            "student_name",
            "plan_name",
            "event_type",
            "event_label",
            "event_date",
            "description",
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields
