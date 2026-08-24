from decimal import Decimal

from rest_framework import serializers

from apps.financial.models import Charge
from apps.plans.models import Plan


class FinancialFilterSerializer(serializers.Serializer):
    OVERDUE_RANGE_CHOICES = [
        ("1_7", "1 a 7 dias"),
        ("8_15", "8 a 15 dias"),
        ("16_30", "16 a 30 dias"),
        ("31_60", "31 a 60 dias"),
        ("over_60", "Mais de 60 dias"),
    ]

    plan = serializers.PrimaryKeyRelatedField(
        queryset=Plan.objects.all(),
        required=False,
    )
    payment_method = serializers.ChoiceField(
        choices=Charge.PaymentMethod.choices,
        required=False,
    )
    due_date_from = serializers.DateField(required=False)
    due_date_to = serializers.DateField(required=False)
    competence_date_from = serializers.DateField(required=False)
    competence_date_to = serializers.DateField(required=False)
    paid_date_from = serializers.DateField(required=False)
    paid_date_to = serializers.DateField(required=False)
    charge = serializers.PrimaryKeyRelatedField(
        queryset=Charge.objects.all(),
        required=False,
    )
    overdue_range = serializers.ChoiceField(
        choices=OVERDUE_RANGE_CHOICES,
        required=False,
    )
    reconciliation_status = serializers.ChoiceField(
        choices=[
            ("pending", "Pendente"),
            ("reconciled", "Conciliado"),
            ("divergent", "Divergente"),
        ],
        required=False,
    )

    def validate(self, attrs):
        ranges = [
            ("due_date_from", "due_date_to", "vencimento"),
            ("competence_date_from", "competence_date_to", "competência"),
            ("paid_date_from", "paid_date_to", "pagamento"),
        ]

        for start_field, end_field, label in ranges:
            start = attrs.get(start_field)
            end = attrs.get(end_field)

            if start and end and start > end:
                raise serializers.ValidationError(
                    {end_field: f"O fim do período de {label} deve ser posterior ao início."}
                )

        return attrs


class DashboardSummaryFilterSerializer(serializers.Serializer):
    period = serializers.RegexField(
        regex=r"^\d{4}-(0[1-9]|1[0-2])$",
        required=False,
        error_messages={
            "invalid": "Informe o período no formato AAAA-MM.",
        },
    )


class ChargeSerializer(serializers.ModelSerializer):
    operational_category = serializers.SerializerMethodField()
    overdue_days = serializers.SerializerMethodField()
    reconciliation = serializers.SerializerMethodField()
    student = serializers.UUIDField(
        source="enrollment.student_id",
        read_only=True,
    )

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
            "unit",
            "enrollment",
            "student",
            "student_name",
            "plan_name",
            "description",
            "amount",
            "due_date",
            "competence_date",
            "status",
            "operational_category",
            "overdue_days",
            "paid_at",
            "payment_method",
            "reconciliation",
            "notes",
            "payment_provider",
            "provider_charge_id",
            "payment_url",
            "pix_code",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "unit",
            "student",
            "student_name",
            "plan_name",
            "paid_at",
            "payment_method",
            "payment_provider",
            "provider_charge_id",
            "payment_url",
            "pix_code",
            "created_at",
            "updated_at",
        ]

    def get_operational_category(self, charge):
        return ChargeViewCategory.for_charge(charge)

    def get_overdue_days(self, charge):
        from django.utils import timezone

        if ChargeViewCategory.for_charge(charge) != "overdue":
            return 0

        return (timezone.localdate() - charge.due_date).days

    def get_reconciliation(self, charge):
        reconciliation = getattr(charge, "reconciliation", None)

        if not reconciliation:
            return None

        return {
            "status": reconciliation.status,
            "expected_amount": reconciliation.expected_amount,
            "received_amount": reconciliation.received_amount,
            "notes": reconciliation.notes,
            "reconciled_at": reconciliation.reconciled_at,
            "reconciled_by": reconciliation.reconciled_by.email,
        }


class ChargeViewCategory:
    DUE_SOON_DAYS = 30

    @classmethod
    def for_charge(cls, charge):
        from datetime import timedelta

        from django.utils import timezone

        has_payment_data = bool(charge.paid_at or charge.payment_method)
        payment_complete = bool(charge.paid_at and charge.payment_method)

        if (
            (charge.status == Charge.Status.PAID and not payment_complete)
            or (charge.status != Charge.Status.PAID and has_payment_data)
        ):
            return "inconsistent"

        if charge.status == Charge.Status.PAID:
            return "paid"

        if charge.status == Charge.Status.CANCELED:
            return "canceled"

        today = timezone.localdate()

        if charge.due_date < today:
            return "overdue"

        if charge.due_date <= today + timedelta(days=cls.DUE_SOON_DAYS):
            return "due_soon"

        return "future"


class PayChargeSerializer(serializers.Serializer):
    payment_method = serializers.ChoiceField(
        choices=Charge.PaymentMethod.choices,
    )


class CancelChargeSerializer(serializers.Serializer):
    reason = serializers.CharField(
        max_length=500,
        trim_whitespace=True,
        allow_blank=False,
    )


class BulkPayChargeSerializer(serializers.Serializer):
    charge_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        min_length=1,
        max_length=100,
        allow_empty=False,
    )
    payment_method = serializers.ChoiceField(
        choices=Charge.PaymentMethod.choices,
    )

    def validate_charge_ids(self, charge_ids):
        return list(dict.fromkeys(charge_ids))


class ReconcileChargeSerializer(serializers.Serializer):
    received_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.00"),
    )
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=500,
    )
