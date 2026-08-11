from django.db import transaction
from django.utils import timezone

from rest_framework import serializers

from apps.enrollments.models import (
    Enrollment,
    EnrollmentHistory,
)
from apps.financial.services.billing import create_enrollment_charges


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="student.name",
        read_only=True,
    )

    plan_name = serializers.CharField(
        source="plan.name",
        read_only=True,
    )

    class Meta:
        model = Enrollment

        fields = [
            "id",
            "student",
            "student_name",
            "plan",
            "plan_name",
            "contracted_price",
            "start_date",
            "due_date",
            "status",
            "billing_method",
            "notes",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

        validators = []

    def validate(self, attrs):
        student = attrs.get(
            "student",
            getattr(self.instance, "student", None),
        )

        plan = attrs.get(
            "plan",
            getattr(self.instance, "plan", None),
        )

        enrollment_status = attrs.get(
            "status",
            getattr(
                self.instance,
                "status",
                Enrollment.Status.ACTIVE,
            ),
        )

        protected_statuses = [
            Enrollment.Status.ACTIVE,
            Enrollment.Status.FROZEN,
        ]

        if student and plan and enrollment_status in protected_statuses:
            existing = Enrollment.objects.filter(
                student=student,
                plan=plan,
                status__in=protected_statuses,
            )

            if self.instance:
                existing = existing.exclude(
                    pk=self.instance.pk,
                )

            if existing.exists():
                raise serializers.ValidationError(
                    {
                        "plan": [
                            "Este aluno já possui uma "
                            "matrícula ativa ou congelada "
                            "neste plano."
                        ]
                    }
                )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        enrollment = super().create(
            validated_data,
        )

        EnrollmentHistory.objects.create(
            enrollment=enrollment,
            event_type=EnrollmentHistory.EventType.CREATED,
            event_date=timezone.localdate(),
            description=(f"Matrícula criada no plano {enrollment.plan.name}."),
        )

        create_enrollment_charges(enrollment)

        return enrollment
