from rest_framework import serializers

from apps.academy.models.academy import Academy, AcademyOperationalSettings, Unit
from apps.users.permissions import get_active_membership


class AcademySerializer(serializers.ModelSerializer):
    class Meta:
        model = Academy
        fields = "__all__"


class UnitSerializer(serializers.ModelSerializer):
    academy_name = serializers.CharField(source="academy.name", read_only=True)

    class Meta:
        model = Unit
        fields = ["id", "academy", "academy_name", "name", "code", "address", "phone", "active"]
        read_only_fields = ["id", "academy", "academy_name"]

    def validate_code(self, value):
        request = self.context.get("request")
        membership = get_active_membership(request.user) if request else None
        academy = membership.academy if membership else getattr(self.instance, "academy", None)
        queryset = Unit.objects.filter(academy=academy, code=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if academy and queryset.exists():
            raise serializers.ValidationError("Já existe uma unidade com este código nesta academia.")
        return value


class AcademyOperationalSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademyOperationalSettings
        fields = ["payment_grace_days", "cancellation_reasons", "access_block_reasons", "opening_hours", "automations_enabled", "updated_at"]
        read_only_fields = ["updated_at"]


class AcademyOnboardingSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150, min_length=2)
    trade_name = serializers.CharField(max_length=150, min_length=2)
    establishment_type = serializers.ChoiceField(choices=Academy.EstablishmentType.choices)
    size_range = serializers.ChoiceField(choices=Academy.SizeRange.choices)
    primary_goal = serializers.ChoiceField(choices=Academy.PrimaryGoal.choices)
    phone = serializers.CharField(max_length=20, min_length=10)
    email = serializers.EmailField()
    unit_name = serializers.CharField(max_length=120, min_length=2)
    unit_address = serializers.CharField(max_length=255, min_length=8)
    unit_phone = serializers.CharField(max_length=20, min_length=10)
    payment_grace_days = serializers.IntegerField(min_value=0, max_value=90, default=7)

    def validate_phone(self, value):
        if len("".join(filter(str.isdigit, value))) not in {10, 11}:
            raise serializers.ValidationError("Informe um telefone com DDD.")
        return value

    def validate_unit_phone(self, value):
        if len("".join(filter(str.isdigit, value))) not in {10, 11}:
            raise serializers.ValidationError("Informe um telefone da unidade com DDD.")
        return value
