from rest_framework import serializers

from apps.checkins.models import AccessPolicy, CheckIn
from apps.users.permissions import get_request_scope
from apps.enrollments.models import Enrollment
from apps.financial.models import Charge
from apps.financial.services.billing import get_payment_grace_period_days
from django.utils import timezone
from datetime import timedelta


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
            "unit",
            "student",
            "student_name",
            "checked_in_at",
            "source",
            "source_label",
            "access_result",
            "access_result_label",
            "block_reason",
            "equipment",
            "location",
            "device_response",
            "contingency_reason",
            "authorized_by",
            "notes",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "unit",
            "student_name",
            "source_label",
            "access_result_label",
            "created_at",
            "authorized_by",
        ]

    def validate(self, attrs):
        request = self.context.get("request")
        academy, unit = get_request_scope(request.user) if request else (None, None)
        student = attrs.get("student", getattr(self.instance, "student", None))
        if academy and student and student.academy_id != academy.id:
            raise serializers.ValidationError(
                {"student": "O aluno não pertence à academia da sessão."}
            )
        access_result = attrs.get("access_result", CheckIn.AccessResult.ALLOWED)
        contingency = attrs.get("contingency_reason", "").strip()
        policy = getattr(unit, "access_policy", None) if unit else None
        if policy and access_result == CheckIn.AccessResult.ALLOWED and not contingency:
            if policy.require_active_enrollment and not Enrollment.objects.filter(
                student=student, status=Enrollment.Status.ACTIVE,
            ).exists():
                raise serializers.ValidationError({"student": "Acesso bloqueado: aluno sem matrícula ativa."})
            overdue_limit = timezone.localdate() - timedelta(days=get_payment_grace_period_days(student) + 1)
            if policy.block_defaulting_students and Charge.objects.filter(
                enrollment__student=student, status=Charge.Status.OVERDUE, due_date__lte=overdue_limit,
            ).exists():
                raise serializers.ValidationError({"student": "Acesso bloqueado: aluno inadimplente além da tolerância."})
        if contingency and policy and not policy.allow_manual_contingency:
            raise serializers.ValidationError({"contingency_reason": "A contingência manual está desabilitada nesta unidade."})
        if (
            attrs.get("access_result") == CheckIn.AccessResult.BLOCKED
            and not attrs.get("block_reason", "").strip()
        ):
            raise serializers.ValidationError(
                {"block_reason": "Informe o motivo do bloqueio."}
            )
        return attrs


class AccessPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = AccessPolicy
        fields = ["require_active_enrollment", "block_defaulting_students", "allow_manual_contingency", "instructions", "updated_at"]
        read_only_fields = ["updated_at"]


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
