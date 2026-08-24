from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from rest_framework import serializers

from apps.enrollments.models import (
    Enrollment,
    EnrollmentHistory,
)
from apps.financial.services.billing import create_enrollment_charges
from apps.plans.models import Plan
from apps.users.permissions import get_request_scope


class EnrollmentChargePreviewSerializer(serializers.Serializer):
    plan = serializers.PrimaryKeyRelatedField(
        queryset=Plan.objects.filter(active=True),
    )
    discount_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.00"),
        default=Decimal("0.00"),
    )
    discount_reason = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=500,
    )
    due_date = serializers.DateField()
    billing_method = serializers.ChoiceField(
        choices=Enrollment.BillingMethod.choices,
    )

    def validate(self, attrs):
        plan = attrs["plan"]
        discount = attrs["discount_amount"]
        request = self.context.get("request")
        academy, _ = get_request_scope(request.user) if request else (None, None)
        if academy and plan.academy_id != academy.id:
            raise serializers.ValidationError({"plan": "O plano não pertence à academia da sessão."})

        if discount > plan.price:
            raise serializers.ValidationError(
                {"discount_amount": "O desconto não pode superar o valor do plano."}
            )

        if discount > 0 and not attrs.get("discount_reason", "").strip():
            raise serializers.ValidationError(
                {"discount_reason": "Informe a justificativa do desconto."}
            )

        return attrs


class EnrollmentSerializer(serializers.ModelSerializer):
    contract_accepted = serializers.BooleanField(
        write_only=True,
        required=False,
        default=False,
    )
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
            "unit",
            "student",
            "student_name",
            "plan",
            "plan_name",
            "original_price",
            "discount_amount",
            "discount_reason",
            "contracted_price",
            "start_date",
            "due_date",
            "status",
            "billing_method",
            "notes",
            "contract_accepted",
            "contract_version",
            "contract_snapshot",
            "contract_accepted_at",
            "contract_accepted_by",
            "created_by",
            "cancellation_reason",
            "frozen_until",
            "renewed_from",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "unit",
            "created_at",
            "updated_at",
            "original_price",
            "contracted_price",
            "contract_version",
            "contract_snapshot",
            "contract_accepted_at",
            "contract_accepted_by",
            "created_by",
            "cancellation_reason",
            "frozen_until",
            "renewed_from",
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

        existing = Enrollment.objects.none()

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

        if self.instance is None and plan:
            if not plan.available_for_enrollment:
                raise serializers.ValidationError(
                    {"plan": ["Este plano não está disponível para novas matrículas."]}
                )

            if not plan.contract_text.strip():
                raise serializers.ValidationError(
                    {
                        "plan": [
                            "Configure o contrato deste plano antes de criar novas matrículas."
                        ]
                    }
                )

            if not attrs.get("contract_accepted"):
                raise serializers.ValidationError(
                    {
                        "contract_accepted": [
                            "Confirme o aceite do contrato para concluir a matrícula."
                        ]
                    }
                )
            discount = attrs.get("discount_amount", 0)

            if discount > plan.price:
                raise serializers.ValidationError(
                    {
                        "discount_amount": [
                            "O desconto não pode superar o valor do plano."
                        ]
                    }
                )

            if discount > 0 and not attrs.get("discount_reason", "").strip():
                raise serializers.ValidationError(
                    {
                        "discount_reason": [
                            "Informe a justificativa do desconto."
                        ]
                    }
                )

            attrs["original_price"] = plan.price
            attrs["contracted_price"] = plan.price - discount

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        contract_accepted = validated_data.pop("contract_accepted", False)
        plan = validated_data["plan"]
        student = validated_data["student"]
        request = self.context.get("request")
        validated_data["created_by"] = (
            request.user if request and request.user.is_authenticated else None
        )
        request = self.context.get("request")
        academy, _ = get_request_scope(request.user) if request else (None, None)
        if academy and (
            student.academy_id != academy.id or plan.academy_id != academy.id
        ):
            raise serializers.ValidationError(
                {"student": ["Aluno e plano devem pertencer à academia da sessão."]}
            )
        membership = request.user.academy_users.filter(active=True).first() if request else None
        validated_data["unit"] = membership.active_unit if membership else None

        if contract_accepted and plan.contract_text.strip():
            validated_data.update(
                {
                    "contract_version": plan.contract_version,
                    "contract_snapshot": {
                        "plan_name": plan.name,
                        "version": plan.contract_version,
                        "contract_text": plan.contract_text,
                        "cancellation_rules": plan.cancellation_rules,
                        "freeze_rules": plan.freeze_rules,
                        "access_rules": plan.access_rules,
                        "modalities": plan.modalities,
                        "benefits": plan.benefits,
                        "price": str(plan.price),
                        "enrollment_fee": str(plan.enrollment_fee),
                        "duration_months": plan.duration_months,
                        "minimum_commitment_months": (
                            plan.minimum_commitment_months
                        ),
                    },
                    "contract_accepted_at": timezone.now(),
                    "contract_accepted_by": (
                        request.user if request and request.user.is_authenticated else None
                    ),
                }
            )

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

    def update(self, instance, validated_data):
        validated_data.pop("contract_accepted", None)
        return super().update(instance, validated_data)
