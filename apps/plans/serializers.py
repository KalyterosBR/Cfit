from rest_framework import serializers
from decimal import Decimal, ROUND_HALF_UP

from apps.plans.models import Plan


class PlanSerializer(serializers.ModelSerializer):
    active_students_count = serializers.SerializerMethodField()
    monthly_equivalent = serializers.SerializerMethodField()
    billing_period_label = serializers.CharField(
        source="get_billing_period_display",
        read_only=True,
    )

    class Meta:
        model = Plan
        fields = "__all__"
        extra_kwargs = {"academy": {"read_only": True}}
        read_only_fields = ["contract_version"]

    def get_active_students_count(self, plan):
        annotated_count = getattr(
            plan,
            "active_students_count",
            None,
        )

        if annotated_count is not None:
            return annotated_count

        return plan.enrollments.filter(
            status="active",
        ).values(
            "student_id",
        ).distinct().count()

    def get_monthly_equivalent(self, plan):
        value = (plan.price / Decimal(plan.duration_months)).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )

        return f"{value:.2f}"

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "O valor total deve ser maior que zero."
            )

        return value

    def validate(self, attrs):
        instance = self.instance
        billing_period = attrs.get(
            "billing_period",
            getattr(instance, "billing_period", None),
        )
        recurring = attrs.get(
            "recurring",
            getattr(instance, "recurring", False),
        )
        auto_renew = attrs.get(
            "auto_renew",
            getattr(instance, "auto_renew", False),
        )
        duration = attrs.get(
            "duration_months",
            getattr(instance, "duration_months", 0),
        )
        commitment = attrs.get(
            "minimum_commitment_months",
            getattr(instance, "minimum_commitment_months", 0),
        )
        installment_count = attrs.get(
            "installment_count",
            getattr(instance, "installment_count", 1),
        )
        contract_text = attrs.get(
            "contract_text",
            getattr(instance, "contract_text", ""),
        )
        promotion_price = attrs.get("promotion_price", getattr(instance, "promotion_price", None))
        price = attrs.get("price", getattr(instance, "price", None))
        penalty = attrs.get("cancellation_penalty_percentage", getattr(instance, "cancellation_penalty_percentage", 0))

        if promotion_price is not None and (promotion_price <= 0 or (price is not None and promotion_price >= price)):
            raise serializers.ValidationError({"promotion_price": "O valor promocional deve ser positivo e menor que o valor total."})
        if penalty < 0 or penalty > 100:
            raise serializers.ValidationError({"cancellation_penalty_percentage": "A multa deve estar entre 0% e 100%."})

        if (instance is None or "contract_text" in attrs) and not contract_text.strip():
            raise serializers.ValidationError(
                {"contract_text": "Informe o texto do contrato do plano."}
            )

        if duration < 1:
            raise serializers.ValidationError(
                {"duration_months": "A duração deve ser de pelo menos 1 mês."}
            )

        if billing_period == Plan.BillingPeriod.ONE_TIME and recurring:
            raise serializers.ValidationError(
                {
                    "recurring": (
                        "Pagamento único não pode possuir recorrência."
                    )
                }
            )

        if installment_count < 1:
            raise serializers.ValidationError(
                {"installment_count": "Informe ao menos uma parcela."}
            )

        if billing_period == Plan.BillingPeriod.ONE_TIME and installment_count != 1:
            raise serializers.ValidationError(
                {"installment_count": "Pagamento único deve possuir exatamente uma parcela."}
            )

        if auto_renew and not recurring:
            raise serializers.ValidationError(
                {
                    "auto_renew": (
                        "A renovação automática exige cobrança recorrente."
                    )
                }
            )

        if commitment > duration:
            raise serializers.ValidationError(
                {
                    "minimum_commitment_months": (
                        "A fidelidade não pode superar a duração do plano."
                    )
                }
            )

        return attrs

    def update(self, instance, validated_data):
        versioned_fields = {
            "modalities",
            "benefits",
            "access_rules",
            "cancellation_rules",
            "freeze_rules",
            "contract_text",
        }
        contract_changed = any(
            field in validated_data
            and validated_data[field] != getattr(instance, field)
            for field in versioned_fields
        )

        if contract_changed:
            validated_data["contract_version"] = instance.contract_version + 1

        return super().update(instance, validated_data)
