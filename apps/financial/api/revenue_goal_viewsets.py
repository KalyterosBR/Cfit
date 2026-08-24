from datetime import date
from decimal import Decimal

from django.db import transaction
from rest_framework import serializers, status, viewsets
from rest_framework.response import Response

from apps.financial.models import MonthlyRevenueGoal
from apps.users.permissions import HasFinancialAccess, get_request_scope
from apps.users.models import AdministrativeAudit


class RevenueGoalInputSerializer(serializers.Serializer):
    period = serializers.RegexField(
        regex=r"^\d{4}-(0[1-9]|1[0-2])$",
        error_messages={
            "invalid": "Informe o período no formato AAAA-MM.",
        },
    )
    target_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )


class RevenueGoalQuerySerializer(serializers.Serializer):
    period = serializers.RegexField(
        regex=r"^\d{4}-(0[1-9]|1[0-2])$",
        error_messages={
            "invalid": "Informe o período no formato AAAA-MM.",
        },
    )


def goal_data(goal, period):
    return {
        "period": period,
        "target_amount": str(goal.target_amount) if goal else None,
        "updated_at": goal.updated_at if goal else None,
        "updated_by": goal.updated_by.email if goal else None,
    }


class MonthlyRevenueGoalViewSet(viewsets.ViewSet):
    permission_classes = [HasFinancialAccess]
    def list(self, request):
        serializer = RevenueGoalQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        period = serializer.validated_data["period"]
        period_date = date.fromisoformat(f"{period}-01")
        academy, _ = get_request_scope(request.user)
        goal = MonthlyRevenueGoal.objects.filter(
            academy=academy,
            period=period_date,
        ).select_related("updated_by").first()

        return Response(goal_data(goal, period))

    @transaction.atomic
    def create(self, request):
        serializer = RevenueGoalInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        period = serializer.validated_data["period"]
        period_date = date.fromisoformat(f"{period}-01")
        academy, _ = get_request_scope(request.user)
        goal, created = MonthlyRevenueGoal.objects.get_or_create(
            academy=academy,
            period=period_date,
            defaults={
                "target_amount": serializer.validated_data["target_amount"],
                "created_by": request.user,
                "updated_by": request.user,
            },
        )

        if not created:
            previous = str(goal.target_amount)
            goal.target_amount = serializer.validated_data["target_amount"]
            goal.updated_by = request.user
            goal.save(
                update_fields=["target_amount", "updated_by", "updated_at"]
            )
        else:
            previous = None
        AdministrativeAudit.objects.create(academy=academy, actor=request.user, action="goal.revenue_updated", entity_type="monthly_revenue_goal", entity_id=str(goal.pk), previous_state={"target_amount": previous}, new_state={"target_amount": str(goal.target_amount), "period": period}, reason=str(request.data.get("reason", "Definição de meta operacional"))[:255])

        return Response(
            goal_data(goal, period),
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
