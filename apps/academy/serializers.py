from rest_framework import serializers

from apps.academy.models.academy import Academy, Unit


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
