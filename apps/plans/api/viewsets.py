from django.db.models import Count, Q

from rest_framework import filters, viewsets

from apps.plans.models import Plan
from apps.plans.serializers import PlanSerializer
from apps.users.models import AdministrativeAudit
from apps.users.permissions import ScopedCapability, get_request_scope


class PlanViewSet(viewsets.ModelViewSet):
    serializer_class = PlanSerializer
    permission_classes = [ScopedCapability]
    read_capability = "plans.view"
    write_capability = "plans.manage"

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
        academy, _ = get_request_scope(self.request.user)
        if academy:
            queryset = queryset.filter(academy=academy)

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

    def perform_create(self, serializer):
        academy, _ = get_request_scope(self.request.user)
        plan = serializer.save(academy=academy)
        AdministrativeAudit.objects.create(
            academy=academy, actor=self.request.user, action="plan.created",
            entity_type="plan", entity_id=str(plan.pk),
            new_state={"name": plan.name, "price": str(plan.price)},
        )

    def perform_update(self, serializer):
        plan = serializer.save()
        AdministrativeAudit.objects.create(
            academy=plan.academy, actor=self.request.user, action="plan.updated",
            entity_type="plan", entity_id=str(plan.pk),
            new_state={"name": plan.name, "price": str(plan.price)},
            reason=self.request.data.get("reason", ""),
        )
