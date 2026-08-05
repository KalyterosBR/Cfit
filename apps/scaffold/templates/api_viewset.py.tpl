from rest_framework import filters, viewsets

from apps.{{ module_name }}.models import {{ class_name }}
from apps.{{ module_name }}.serializers import {{ class_name }}Serializer


class {{ class_name }}ViewSet(viewsets.ModelViewSet):
    queryset = {{ class_name }}.objects.filter(active=True)
    serializer_class = {{ class_name }}Serializer

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]