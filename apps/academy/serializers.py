from rest_framework import serializers

from apps.academy.models.academy import Academy


class AcademySerializer(serializers.ModelSerializer):
    class Meta:
        model = Academy
        fields = "__all__"
