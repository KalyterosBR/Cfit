from datetime import timedelta
from decimal import Decimal

from django.db.models import Q
from django.utils import timezone

from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.financial.api.cash_serializers import CashTransactionSerializer
from apps.financial.models import CashTransaction, Charge
from apps.financial.services.billing import add_months
from apps.users.permissions import HasFinancialAccess, get_request_scope


class CashTransactionViewSet(viewsets.ModelViewSet):
    permission_classes = [HasFinancialAccess]
    serializer_class = CashTransactionSerializer
    http_method_names = ["get", "post", "head", "options"]
    filter_backends = [filters.SearchFilter]
    search_fields = ["description", "notes"]

    def get_queryset(self):
        queryset = CashTransaction.objects.select_related(
            "created_by",
            "charge",
        )
        academy, unit = get_request_scope(self.request.user)
        if academy:
            queryset = queryset.filter(unit__academy=academy)
        if unit:
            queryset = queryset.filter(unit=unit)
        transaction_type = self.request.query_params.get("transaction_type")
        transaction_status = self.request.query_params.get("status")
        category = self.request.query_params.get("category")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")

        if transaction_type in CashTransaction.Type.values:
            queryset = queryset.filter(transaction_type=transaction_type)

        if transaction_status in CashTransaction.Status.values:
            queryset = queryset.filter(status=transaction_status)

        if category in CashTransaction.Category.values:
            queryset = queryset.filter(category=category)

        if date_from:
            queryset = queryset.filter(competence_date__gte=date_from)

        if date_to:
            queryset = queryset.filter(competence_date__lte=date_to)

        return queryset

    def perform_create(self, serializer):
        _, unit = get_request_scope(self.request.user)
        serializer.save(created_by=self.request.user, unit=unit)

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        granularity = request.query_params.get("granularity", "monthly")

        if granularity not in {"daily", "monthly"}:
            return Response(
                {"granularity": ["Use 'daily' ou 'monthly'."]},
                status=400,
            )

        today = timezone.localdate()

        if granularity == "daily":
            period_starts = [today + timedelta(days=offset) for offset in range(30)]
            period_end = today + timedelta(days=30)
            key_for = lambda value: value
        else:
            try:
                months = int(request.query_params.get("months", 6))
            except (TypeError, ValueError):
                months = 0

            if months not in {3, 6, 12}:
                return Response({"months": ["Use 3, 6 ou 12 meses."]}, status=400)

            first_month = today.replace(day=1)
            period_starts = [add_months(first_month, offset) for offset in range(months)]
            period_end = add_months(first_month, months)
            key_for = lambda value: value.replace(day=1)

        period_start = period_starts[0]
        transaction_type = request.query_params.get("transaction_type")
        transaction_status = request.query_params.get("status")
        category = request.query_params.get("category")
        include_charge_income = transaction_type != CashTransaction.Type.EXPENSE
        include_charge_income = include_charge_income and category in {
            None,
            "",
            CashTransaction.Category.MEMBERSHIP,
        }
        charge_queryset = Charge.objects.filter(
            competence_date__gte=period_start,
            competence_date__lt=period_end,
            cash_transaction__isnull=True,
        ).exclude(status=Charge.Status.CANCELED)
        academy, unit = get_request_scope(request.user)
        if academy:
            charge_queryset = charge_queryset.filter(enrollment__student__academy=academy)
        if unit:
            charge_queryset = charge_queryset.filter(unit=unit)

        if transaction_status == CashTransaction.Status.PLANNED:
            charge_queryset = charge_queryset.filter(
                status__in=[Charge.Status.PENDING, Charge.Status.OVERDUE],
            )
        elif transaction_status == CashTransaction.Status.REALIZED:
            charge_queryset = charge_queryset.filter(status=Charge.Status.PAID)

        transaction_queryset = CashTransaction.objects.filter(
            competence_date__gte=period_start,
            competence_date__lt=period_end,
        )

        if transaction_type in CashTransaction.Type.values:
            transaction_queryset = transaction_queryset.filter(
                transaction_type=transaction_type,
            )

        if transaction_status in CashTransaction.Status.values:
            transaction_queryset = transaction_queryset.filter(status=transaction_status)

        if category in CashTransaction.Category.values:
            transaction_queryset = transaction_queryset.filter(category=category)

        buckets = {
            period: {
                "period": period.isoformat(),
                "projected_income": Decimal("0"),
                "realized_income": Decimal("0"),
                "projected_expense": Decimal("0"),
                "realized_expense": Decimal("0"),
            }
            for period in period_starts
        }

        if include_charge_income:
            for charge in charge_queryset.iterator():
                bucket = buckets.get(key_for(charge.competence_date))

                if not bucket:
                    continue

                bucket["projected_income"] += charge.amount

                if charge.status == Charge.Status.PAID:
                    bucket["realized_income"] += charge.amount

        for transaction in transaction_queryset.iterator():
            bucket = buckets.get(key_for(transaction.competence_date))

            if not bucket:
                continue

            projected_key = (
                "projected_income"
                if transaction.transaction_type == CashTransaction.Type.INCOME
                else "projected_expense"
            )
            bucket[projected_key] += transaction.amount

            if transaction.status == CashTransaction.Status.REALIZED:
                realized_key = (
                    "realized_income"
                    if transaction.transaction_type == CashTransaction.Type.INCOME
                    else "realized_expense"
                )
                bucket[realized_key] += transaction.amount

        projected_balance = Decimal("0")
        realized_balance = Decimal("0")
        periods = []

        for period in period_starts:
            bucket = buckets[period]
            projected_net = bucket["projected_income"] - bucket["projected_expense"]
            realized_net = bucket["realized_income"] - bucket["realized_expense"]
            projected_balance += projected_net
            realized_balance += realized_net
            bucket.update(
                {
                    "projected_net": projected_net,
                    "realized_net": realized_net,
                    "projected_balance": projected_balance,
                    "realized_balance": realized_balance,
                }
            )
            periods.append(bucket)

        totals = {
            key: sum((item[key] for item in periods), Decimal("0"))
            for key in [
                "projected_income",
                "realized_income",
                "projected_expense",
                "realized_expense",
            ]
        }
        totals["projected_balance"] = projected_balance
        totals["realized_balance"] = realized_balance

        return Response(
            {
                "granularity": granularity,
                "period_start": period_start,
                "period_end": period_end,
                "opening_balance_included": False,
                "totals": totals,
                "periods": periods,
            }
        )
