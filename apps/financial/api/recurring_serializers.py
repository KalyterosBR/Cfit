from django.utils import timezone

from rest_framework import serializers

from apps.financial.models import Charge, RecurringPaymentAttempt
from apps.users.permissions import get_request_scope


class RecurringPaymentAttemptSerializer(serializers.ModelSerializer):
    attempt_number = serializers.IntegerField(read_only=True)
    occurred_at = serializers.DateTimeField(required=False, default=timezone.now)
    student = serializers.UUIDField(
        source="charge.enrollment.student_id",
        read_only=True,
    )
    student_name = serializers.CharField(
        source="charge.enrollment.student.name",
        read_only=True,
    )
    plan_name = serializers.CharField(
        source="charge.enrollment.plan.name",
        read_only=True,
    )
    charge_description = serializers.CharField(
        source="charge.description",
        read_only=True,
    )
    charge_amount = serializers.DecimalField(
        source="charge.amount",
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    source_label = serializers.CharField(source="get_source_display", read_only=True)
    recorded_by = serializers.EmailField(
        source="recorded_by.email",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = RecurringPaymentAttempt
        fields = [
            "id",
            "charge",
            "charge_description",
            "charge_amount",
            "student",
            "student_name",
            "plan_name",
            "attempt_number",
            "status",
            "status_label",
            "source",
            "source_label",
            "provider",
            "external_reference",
            "failure_code",
            "failure_reason",
            "next_retry_at",
            "recorded_by",
            "occurred_at",
            "created_at",
        ]
        read_only_fields = ["id", "attempt_number", "recorded_by", "created_at"]

    def validate(self, attrs):
        charge: Charge = attrs["charge"]
        request = self.context.get("request")
        academy, unit = get_request_scope(request.user) if request else (None, None)
        if academy and charge.enrollment.student.academy_id != academy.id:
            raise serializers.ValidationError({"charge": "A cobrança não pertence à academia da sessão."})
        if unit and charge.unit_id != unit.id:
            raise serializers.ValidationError({"charge": "A cobrança não pertence à unidade ativa."})
        attempt_status = attrs["status"]
        source = attrs["source"]

        if not charge.enrollment.plan.recurring:
            raise serializers.ValidationError(
                {"charge": "A cobrança não pertence a um plano recorrente."}
            )

        if charge.status == Charge.Status.CANCELED:
            raise serializers.ValidationError(
                {"charge": "Não registre tentativas em cobranças canceladas."}
            )

        if (
            attempt_status == RecurringPaymentAttempt.Status.REJECTED
            and not attrs.get("failure_reason", "").strip()
        ):
            raise serializers.ValidationError(
                {"failure_reason": "Informe o motivo da rejeição."}
            )

        if (
            attempt_status != RecurringPaymentAttempt.Status.REJECTED
            and (attrs.get("failure_code") or attrs.get("failure_reason"))
        ):
            raise serializers.ValidationError(
                {"failure_reason": "Dados de falha são exclusivos de tentativas rejeitadas."}
            )

        if source == RecurringPaymentAttempt.Source.INTEGRATION and not attrs.get(
            "provider",
            "",
        ).strip():
            raise serializers.ValidationError(
                {"provider": "Informe o provedor da integração."}
            )

        return attrs
