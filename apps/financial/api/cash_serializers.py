from decimal import Decimal

from rest_framework import serializers

from apps.financial.models import CashTransaction


class CashTransactionSerializer(serializers.ModelSerializer):
    transaction_type_label = serializers.CharField(
        source="get_transaction_type_display",
        read_only=True,
    )
    status_label = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )
    category_label = serializers.CharField(
        source="get_category_display",
        read_only=True,
    )
    created_by = serializers.EmailField(source="created_by.email", read_only=True)

    class Meta:
        model = CashTransaction
        fields = [
            "id",
            "transaction_type",
            "transaction_type_label",
            "status",
            "status_label",
            "category",
            "category_label",
            "description",
            "amount",
            "competence_date",
            "transaction_date",
            "charge",
            "notes",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]

    def validate_amount(self, amount):
        if amount <= Decimal("0.00"):
            raise serializers.ValidationError("O valor deve ser maior que zero.")

        return amount

    def validate(self, attrs):
        transaction_status = attrs.get("status")
        transaction_date = attrs.get("transaction_date")
        charge = attrs.get("charge")
        transaction_type = attrs.get("transaction_type")

        if transaction_status == CashTransaction.Status.REALIZED and not transaction_date:
            raise serializers.ValidationError(
                {"transaction_date": "Informe a data efetiva da movimentação realizada."}
            )

        if transaction_status == CashTransaction.Status.PLANNED and transaction_date:
            raise serializers.ValidationError(
                {"transaction_date": "Movimentações previstas não possuem data efetiva."}
            )

        if charge and transaction_type != CashTransaction.Type.INCOME:
            raise serializers.ValidationError(
                {"charge": "Somente entradas podem ser vinculadas a cobranças."}
            )

        return attrs
