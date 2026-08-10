from rest_framework import filters, viewsets

from apps.plans.models import Plan
from apps.plans.serializers import PlanSerializer


class PlanViewSet(viewsets.ModelViewSet):
    queryset = Plan.objects.filter(active=True)
    serializer_class = PlanSerializer

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]