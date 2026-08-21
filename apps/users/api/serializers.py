from rest_framework import serializers

from apps.users.models import AcademyUser, AdministrativeAudit


class AcademyUserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    name = serializers.SerializerMethodField()
    role_label = serializers.CharField(source="get_role_display", read_only=True)
    reason = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=255)

    class Meta:
        model = AcademyUser
        fields = ["id", "email", "name", "role", "role_label", "active", "active_unit", "joined_at", "reason"]
        read_only_fields = ["id", "email", "name", "role_label", "joined_at"]

    def validate_active_unit(self, unit):
        if unit and self.instance and unit.academy_id != self.instance.academy_id:
            raise serializers.ValidationError("Selecione uma unidade da mesma academia.")
        return unit

    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.email

    def update(self, instance, validated_data):
        validated_data.pop("reason", None)
        return super().update(instance, validated_data)


class AdministrativeAuditSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(source="actor.email", read_only=True)

    class Meta:
        model = AdministrativeAudit
        fields = [
            "id", "actor_email", "action", "entity_type", "entity_id",
            "previous_state", "new_state", "reason", "origin", "created_at",
        ]
