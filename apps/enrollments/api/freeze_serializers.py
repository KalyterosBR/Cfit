from rest_framework import serializers

from apps.enrollments.models import EnrollmentFreeze


class EnrollmentFreezeSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(
        source="enrollment.plan.name",
        read_only=True,
    )

    student_name = serializers.CharField(
        source="enrollment.student.name",
        read_only=True,
    )

    class Meta:
        model = EnrollmentFreeze

        fields = [
            "id",
            "enrollment",
            "plan_name",
            "student_name",
            "frozen_at",
            "reactivated_at",
            "reason",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "enrollment",
            "plan_name",
            "student_name",
            "frozen_at",
            "reactivated_at",
            "created_at",
            "updated_at",
        ]
