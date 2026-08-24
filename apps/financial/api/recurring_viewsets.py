from django.db import transaction
from django.db.models import Count, Max, Q
from django.utils import timezone

from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.financial.api.recurring_serializers import (
    RecurringPaymentAttemptSerializer,
)
from apps.financial.models import Charge, RecurringPaymentAttempt
from apps.users.permissions import HasFinancialAccess, get_request_scope


class RecurringPaymentAttemptViewSet(viewsets.ModelViewSet):
    permission_classes = [HasFinancialAccess]
    serializer_class = RecurringPaymentAttemptSerializer
    http_method_names = ["get", "post", "head", "options"]
    filter_backends = [filters.SearchFilter]
    search_fields = [
        "charge__enrollment__student__name",
        "charge__enrollment__plan__name",
        "charge__description",
        "failure_code",
        "failure_reason",
    ]

    def get_queryset(self):
        queryset = RecurringPaymentAttempt.objects.select_related(
            "charge",
            "charge__enrollment",
            "charge__enrollment__student",
            "charge__enrollment__plan",
            "recorded_by",
        )
        academy, unit = get_request_scope(self.request.user)
        if academy:
            queryset = queryset.filter(charge__enrollment__student__academy=academy)
        if unit:
            queryset = queryset.filter(charge__unit=unit)
        attempt_status = self.request.query_params.get("status")
        source = self.request.query_params.get("source")
        student = self.request.query_params.get("student")
        search = self.request.query_params.get("search", "").strip()

        if attempt_status in RecurringPaymentAttempt.Status.values:
            queryset = queryset.filter(status=attempt_status)

        if source in RecurringPaymentAttempt.Source.values:
            queryset = queryset.filter(source=source)

        if student:
            queryset = queryset.filter(charge__enrollment__student_id=student)

        if search:
            queryset = queryset.filter(
                Q(charge__enrollment__student__name__icontains=search)
                | Q(charge__enrollment__plan__name__icontains=search)
                | Q(charge__description__icontains=search)
                | Q(failure_code__icontains=search)
                | Q(failure_reason__icontains=search)
            )

        return queryset

    @transaction.atomic
    def perform_create(self, serializer):
        charge = Charge.objects.select_for_update().get(
            pk=serializer.validated_data["charge"].pk,
        )
        last_attempt = RecurringPaymentAttempt.objects.filter(
            charge=charge,
        ).aggregate(maximum=Max("attempt_number"))["maximum"] or 0
        serializer.save(
            charge=charge,
            attempt_number=last_attempt + 1,
            recorded_by=self.request.user,
        )

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        queryset = self.get_queryset()
        counts = {
            item["status"]: item["count"]
            for item in queryset.values("status").annotate(count=Count("id"))
        }
        retry_due = queryset.filter(
            status=RecurringPaymentAttempt.Status.REJECTED,
            next_retry_at__isnull=False,
            next_retry_at__lte=timezone.now(),
        ).count()
        latest_status_by_charge = {}

        for attempt in queryset.order_by("occurred_at", "attempt_number").values(
            "charge_id",
            "status",
        ):
            latest_status_by_charge[attempt["charge_id"]] = attempt["status"]

        unresolved_charges = sum(
            status == RecurringPaymentAttempt.Status.REJECTED
            for status in latest_status_by_charge.values()
        )

        return Response(
            {
                "total_count": queryset.count(),
                "pending_count": counts.get("pending", 0),
                "processing_count": counts.get("processing", 0),
                "approved_count": counts.get("approved", 0),
                "rejected_count": counts.get("rejected", 0),
                "retry_due_count": retry_due,
                "unresolved_charge_count": unresolved_charges,
            }
        )
