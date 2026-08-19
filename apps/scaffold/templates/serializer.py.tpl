from rest_framework import serializers

from apps.{{ module_name }}.models import {{ class_name }}


class {{ class_name }}Serializer(serializers.ModelSerializer):
    class Meta:
        model = {{ class_name }}
        fields = "__all__"