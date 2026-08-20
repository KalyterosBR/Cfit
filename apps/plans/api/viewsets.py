from django.db.models import Count, Q

from rest_framework import filters, viewsets

from apps.plans.models import Plan
from apps.plans.serializers import PlanSerializer


class PlanViewSet(viewsets.ModelViewSet):
    serializer_class = PlanSerializer

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "name",
        "description",
    ]

    ordering_fields = [
        "name",
        "price",
        "duration_months",
        "created_at",
    ]

    ordering = [
        "name",
    ]

    def get_queryset(self):
        queryset = Plan.objects.annotate(
            active_students_count=Count(
                "enrollments__student",
                filter=Q(enrollments__status="active"),
                distinct=True,
            )
        )

        if self.action != "list":
            return queryset

        include_inactive = self.request.query_params.get(
            "include_inactive",
            "false",
        ).lower() == "true"

        if not include_inactive:
            queryset = queryset.filter(
                active=True,
            )

        active = self.request.query_params.get(
            "active",
        )

        if active in {
            "true",
            "false",
        }:
            queryset = queryset.filter(
                active=active == "true",
            )

        return queryset
