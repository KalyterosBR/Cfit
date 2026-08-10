from rest_framework import serializers

from apps.financial.models import Charge


class ChargeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="enrollment.student.name",
        read_only=True,
    )

    plan_name = serializers.CharField(
        source="enrollment.plan.name",
        read_only=True,
    )

    class Meta:
        model = Charge

        fields = [
            "id",
            "enrollment",
            "student_name",
            "plan_name",
            "description",
            "amount",
            "due_date",
            "status",
            "paid_at",
            "notes",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "student_name",
            "plan_name",
            "paid_at",
            "created_at",
            "updated_at",
        ]
