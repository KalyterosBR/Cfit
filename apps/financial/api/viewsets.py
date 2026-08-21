import csv
from datetime import date, timedelta
from decimal import Decimal

from django.db import transaction
from django.db.models import Avg, Count, Max, Min, Q, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404

from unidecode import unidecode

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.financial.api.serializers import (
    CancelChargeSerializer,
    BulkPayChargeSerializer,
    ChargeSerializer,
    ChargeViewCategory,
    DashboardSummaryFilterSerializer,
    FinancialFilterSerializer,
    PayChargeSerializer,
    ReconcileChargeSerializer,
)
from apps.financial.models import (
    CashTransaction,
    Charge,
    ChargeAudit,
    ChargeReconciliation,
    RecurringPaymentAttempt,
)


class ChargeViewSet(viewsets.ModelViewSet):
    queryset = Charge.objects.select_related(
        "enrollment",
        "enrollment__student",
        "enrollment__plan",
        "reconciliation",
        "reconciliation__reconciled_by",
    ).all()

    serializer_class = ChargeSerializer

    @staticmethod
    def audit_snapshot(charge):
        return {
            "status": charge.status,
            "amount": str(charge.amount),
            "paid_at": charge.paid_at.isoformat() if charge.paid_at else None,
            "payment_method": charge.payment_method,
        }

    @staticmethod
    def csv_safe(value):
        text = "" if value is None else str(value)

        if text.startswith(("=", "+", "-", "@")):
            return f"'{text}"

        return text

    def register_payment(self, charge, payment_method, actor):
        previous_state = self.audit_snapshot(charge)
        charge.status = Charge.Status.PAID
        charge.paid_at = timezone.now()
        charge.payment_method = payment_method
        charge.save(
            update_fields=[
                "status",
                "paid_at",
                "payment_method",
                "updated_at",
            ]
        )
        ChargeAudit.objects.create(
            charge=charge,
            action=ChargeAudit.Action.PAYMENT_REGISTERED,
            actor=actor,
            previous_state=previous_state,
            new_state=self.audit_snapshot(charge),
        )

        return charge

    @staticmethod
    def shift_month(month_start, offset):
        month_index = month_start.year * 12 + month_start.month - 1 + offset

        return date(
            month_index // 12,
            month_index % 12 + 1,
            1,
        )

    # ==========================================
    # FILTROS
    # ==========================================

    def get_queryset(self):
        queryset = super().get_queryset()

        student_id = self.request.query_params.get("student")

        if student_id:
            queryset = queryset.filter(
                enrollment__student_id=student_id,
            )

        filter_serializer = FinancialFilterSerializer(
            data=self.request.query_params,
        )
        filter_serializer.is_valid(raise_exception=True)
        filters = filter_serializer.validated_data

        if filters.get("plan"):
            queryset = queryset.filter(enrollment__plan=filters["plan"])

        if filters.get("payment_method"):
            queryset = queryset.filter(
                payment_method=filters["payment_method"],
            )

        reconciliation_status = filters.get("reconciliation_status")

        if reconciliation_status == "pending":
            queryset = queryset.filter(
                status=Charge.Status.PAID,
                reconciliation__isnull=True,
            )
        elif reconciliation_status in {"reconciled", "divergent"}:
            queryset = queryset.filter(
                reconciliation__status=reconciliation_status,
            )

        date_filters = {
            "due_date_from": "due_date__gte",
            "due_date_to": "due_date__lte",
            "competence_date_from": "competence_date__gte",
            "competence_date_to": "competence_date__lte",
            "paid_date_from": "paid_at__date__gte",
            "paid_date_to": "paid_at__date__lte",
        }

        for parameter, lookup in date_filters.items():
            if filters.get(parameter):
                queryset = queryset.filter(
                    **{lookup: filters[parameter]},
                )

        if filters.get("charge"):
            queryset = queryset.filter(pk=filters["charge"].pk)

        charge_status = self.request.query_params.get("status")

        if charge_status in Charge.Status.values:
            queryset = queryset.filter(
                status=charge_status,
            )

        category = self.request.query_params.get("category")
        today = timezone.localdate()
        due_soon_limit = today + timedelta(days=30)
        inconsistent = (
            Q(status=Charge.Status.PAID)
            & (Q(paid_at__isnull=True) | Q(payment_method__isnull=True))
        ) | (
            ~Q(status=Charge.Status.PAID)
            & (Q(paid_at__isnull=False) | Q(payment_method__isnull=False))
        )
        consistent = ~inconsistent
        open_statuses = [Charge.Status.PENDING, Charge.Status.OVERDUE]

        overdue_ranges = {
            "1_7": (today - timedelta(days=7), today - timedelta(days=1)),
            "8_15": (today - timedelta(days=15), today - timedelta(days=8)),
            "16_30": (today - timedelta(days=30), today - timedelta(days=16)),
            "31_60": (today - timedelta(days=60), today - timedelta(days=31)),
        }
        overdue_range = filters.get("overdue_range")

        if overdue_range in overdue_ranges:
            start, end = overdue_ranges[overdue_range]
            queryset = queryset.filter(
                Q(
                    status__in=open_statuses,
                    due_date__gte=start,
                    due_date__lte=end,
                )
                & consistent
            )
        elif overdue_range == "over_60":
            queryset = queryset.filter(
                Q(
                    status__in=open_statuses,
                    due_date__lte=today - timedelta(days=61),
                )
                & consistent
            )

        category_filters = {
            "inconsistent": inconsistent,
            "paid": Q(status=Charge.Status.PAID) & consistent,
            "canceled": Q(status=Charge.Status.CANCELED) & consistent,
            "overdue": (
                Q(status__in=open_statuses, due_date__lt=today) & consistent
            ),
            "due_soon": (
                Q(
                    status__in=open_statuses,
                    due_date__gte=today,
                    due_date__lte=due_soon_limit,
                )
                & consistent
            ),
            "future": (
                Q(status__in=open_statuses, due_date__gt=due_soon_limit)
                & consistent
            ),
        }

        if category in category_filters:
            queryset = queryset.filter(category_filters[category])

        search = self.request.query_params.get("search", "").strip()

        if search:
            normalized_search = unidecode(search).lower()

            queryset = queryset.filter(
                Q(
                    enrollment__student__search_name__icontains=(
                        normalized_search
                    ),
                )
                | Q(description__icontains=search)
                | Q(enrollment__plan__name__icontains=search)
            )

        return queryset

    @action(
        detail=False,
        methods=["get"],
        url_path="filter-options",
    )
    def filter_options(self, request):
        plans = (
            self.queryset.values(
                "enrollment__plan_id",
                "enrollment__plan__name",
            )
            .distinct()
            .order_by("enrollment__plan__name")
        )

        return Response(
            {
                "plans": [
                    {
                        "id": item["enrollment__plan_id"],
                        "name": item["enrollment__plan__name"],
                    }
                    for item in plans
                ],
                "payment_methods": [
                    {"value": value, "label": label}
                    for value, label in Charge.PaymentMethod.choices
                ],
            }
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="grouped",
    )
    def grouped(self, request):
        group_by = request.query_params.get("group_by", "student")

        if group_by not in {"student", "enrollment"}:
            return Response(
                {"group_by": ["Use 'student' ou 'enrollment'."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = self.get_queryset()
        today = timezone.localdate()
        open_statuses = [Charge.Status.PENDING, Charge.Status.OVERDUE]

        if group_by == "student":
            group_fields = [
                "enrollment__student_id",
                "enrollment__student__name",
            ]
            group_ordering = ["enrollment__student__name"]
        else:
            group_fields = [
                "enrollment_id",
                "enrollment__student_id",
                "enrollment__student__name",
                "enrollment__plan__name",
            ]
            group_ordering = ["enrollment__student__name", "enrollment_id"]

        groups = (
            queryset.values(*group_fields)
            .annotate(
                charge_count=Count("id"),
                total_amount=Sum("amount"),
                open_total=Sum(
                    "amount",
                    filter=Q(status__in=open_statuses),
                    default=0,
                ),
                overdue_count=Count(
                    "id",
                    filter=Q(
                        status__in=open_statuses,
                        due_date__lt=today,
                    ),
                ),
                first_due_date=Min("due_date"),
                last_due_date=Max("due_date"),
            )
            .order_by(*group_ordering)
        )
        page = self.paginate_queryset(groups)
        page_groups = page if page is not None else groups
        student_ids = [item["enrollment__student_id"] for item in page_groups]
        enrollment_ids = [
            item["enrollment_id"]
            for item in page_groups
            if item.get("enrollment_id")
        ]
        group_charges = queryset.filter(
            enrollment__student_id__in=student_ids,
        )

        if group_by == "enrollment":
            group_charges = group_charges.filter(
                enrollment_id__in=enrollment_ids,
            )

        charges_by_key = {}

        for charge in group_charges.order_by("due_date", "created_at"):
            key = (
                str(charge.enrollment.student_id)
                if group_by == "student"
                else str(charge.enrollment_id)
            )
            charges_by_key.setdefault(key, []).append(charge)

        results = []

        for item in page_groups:
            key = (
                str(item["enrollment__student_id"])
                if group_by == "student"
                else str(item["enrollment_id"])
            )
            results.append(
                {
                    "key": key,
                    "student": item["enrollment__student_id"],
                    "student_name": item["enrollment__student__name"],
                    "enrollment": item.get("enrollment_id"),
                    "plan_name": item.get("enrollment__plan__name"),
                    "charge_count": item["charge_count"],
                    "total_amount": item["total_amount"],
                    "open_total": item["open_total"],
                    "overdue_count": item["overdue_count"],
                    "first_due_date": item["first_due_date"],
                    "last_due_date": item["last_due_date"],
                    "charges": self.get_serializer(
                        charges_by_key.get(key, []),
                        many=True,
                    ).data,
                }
            )

        if page is not None:
            return self.get_paginated_response(results)

        return Response(results)

    @action(
        detail=False,
        methods=["get"],
        url_path="export",
    )
    def export(self, request):
        queryset = self.get_queryset().order_by("due_date", "created_at")
        exported_at = timezone.localtime()
        category_labels = {
            "overdue": "Vencida",
            "due_soon": "A vencer",
            "future": "Futura",
            "paid": "Paga",
            "canceled": "Cancelada",
            "inconsistent": "Inconsistente",
        }

        class CsvBuffer:
            def write(self, value):
                return value

        writer = csv.writer(
            CsvBuffer(),
            delimiter=";",
            quoting=csv.QUOTE_MINIMAL,
            lineterminator="\r\n",
        )

        def rows():
            yield "\ufeff"
            yield writer.writerow(
                [
                    "Aluno",
                    "Plano",
                    "Cobrança",
                    "Competência",
                    "Vencimento",
                    "Valor",
                    "Situação",
                    "Meio de pagamento",
                    "Pago em",
                    "Exportado em",
                ]
            )

            for charge in queryset.iterator(chunk_size=500):
                category = ChargeViewCategory.for_charge(charge)
                yield writer.writerow(
                    [
                        self.csv_safe(charge.enrollment.student.name),
                        self.csv_safe(charge.enrollment.plan.name),
                        self.csv_safe(charge.description),
                        charge.competence_date.strftime("%d/%m/%Y"),
                        charge.due_date.strftime("%d/%m/%Y"),
                        str(charge.amount).replace(".", ","),
                        category_labels[category],
                        (
                            charge.get_payment_method_display()
                            if charge.payment_method
                            else ""
                        ),
                        (
                            timezone.localtime(charge.paid_at).strftime(
                                "%d/%m/%Y %H:%M"
                            )
                            if charge.paid_at
                            else ""
                        ),
                        exported_at.strftime("%d/%m/%Y %H:%M"),
                    ]
                )

        response = StreamingHttpResponse(
            rows(),
            content_type="text/csv; charset=utf-8",
        )
        filename = exported_at.strftime("cfit-financeiro-%Y%m%d-%H%M%S.csv")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        return response

    @action(
        detail=False,
        methods=["get"],
        url_path="inconsistencies",
    )
    def inconsistencies(self, request):
        checked_at = timezone.now()
        issues = []

        def add_issue(
            *,
            issue_id,
            kind,
            priority,
            title,
            cause,
            next_action,
            entity_type,
            entity_id,
            student=None,
            context="",
            responsible=None,
            source_updated_at=None,
        ):
            issues.append(
                {
                    "id": issue_id,
                    "kind": kind,
                    "priority": priority,
                    "title": title,
                    "cause": cause,
                    "next_action": next_action,
                    "entity_type": entity_type,
                    "entity_id": str(entity_id),
                    "student": str(student.id) if student else None,
                    "student_name": student.name if student else None,
                    "context": context,
                    "responsible": responsible,
                    "source_updated_at": source_updated_at,
                    "checked_at": checked_at,
                }
            )

        incomplete_paid = self.queryset.filter(
            status=Charge.Status.PAID,
        ).filter(Q(paid_at__isnull=True) | Q(payment_method__isnull=True))

        for charge in incomplete_paid:
            add_issue(
                issue_id=f"paid-incomplete-{charge.id}",
                kind="paid_incomplete",
                priority="critical",
                title="Pagamento com dados incompletos",
                cause="A cobrança está paga, mas não possui data ou meio de pagamento.",
                next_action="Revisar o recebimento e completar os dados do pagamento.",
                entity_type="charge",
                entity_id=charge.id,
                student=charge.enrollment.student,
                context=charge.description,
                source_updated_at=charge.updated_at,
            )

        open_with_payment = self.queryset.filter(
            status__in=[Charge.Status.PENDING, Charge.Status.OVERDUE],
        ).filter(Q(paid_at__isnull=False) | Q(payment_method__isnull=False))

        for charge in open_with_payment:
            add_issue(
                issue_id=f"open-with-payment-{charge.id}",
                kind="open_with_payment",
                priority="critical",
                title="Cobrança aberta com dados de pagamento",
                cause="Existem dados de recebimento, mas a cobrança continua em aberto.",
                next_action="Confirmar se houve pagamento e corrigir a situação da cobrança.",
                entity_type="charge",
                entity_id=charge.id,
                student=charge.enrollment.student,
                context=charge.description,
                source_updated_at=charge.updated_at,
            )

        divergent_reconciliations = ChargeReconciliation.objects.filter(
            status=ChargeReconciliation.Status.DIVERGENT,
        ).select_related(
            "charge__enrollment__student",
            "reconciled_by",
        )

        for reconciliation in divergent_reconciliations:
            charge = reconciliation.charge
            difference = reconciliation.received_amount - reconciliation.expected_amount
            add_issue(
                issue_id=f"reconciliation-divergent-{reconciliation.id}",
                kind="reconciliation_divergent",
                priority="high",
                title="Conciliação com valor divergente",
                cause=f"Diferença de R$ {difference:.2f} entre o esperado e o recebido.",
                next_action="Conferir extrato, taxas e valor efetivamente liquidado.",
                entity_type="reconciliation",
                entity_id=reconciliation.id,
                student=charge.enrollment.student,
                context=charge.description,
                responsible=reconciliation.reconciled_by.email,
                source_updated_at=reconciliation.reconciled_at,
            )

        latest_attempts = {}

        for attempt in RecurringPaymentAttempt.objects.select_related(
            "charge__enrollment__student",
            "recorded_by",
        ).order_by("occurred_at", "attempt_number"):
            latest_attempts[attempt.charge_id] = attempt

        for attempt in latest_attempts.values():
            if attempt.status != RecurringPaymentAttempt.Status.REJECTED:
                continue

            add_issue(
                issue_id=f"recurrence-unresolved-{attempt.charge_id}",
                kind="recurrence_unresolved",
                priority="high",
                title="Recorrência rejeitada sem resolução",
                cause=attempt.failure_reason or "A última tentativa foi rejeitada.",
                next_action="Contatar o aluno ou executar a próxima tentativa prevista.",
                entity_type="recurring_attempt",
                entity_id=attempt.id,
                student=attempt.charge.enrollment.student,
                context=attempt.charge.description,
                responsible=(attempt.recorded_by.email if attempt.recorded_by else None),
                source_updated_at=attempt.occurred_at,
            )

        invalid_cash_transactions = CashTransaction.objects.filter(
            Q(status=CashTransaction.Status.REALIZED, transaction_date__isnull=True)
            | Q(transaction_type=CashTransaction.Type.EXPENSE, charge__isnull=False)
        ).select_related("charge__enrollment__student", "created_by")

        for transaction in invalid_cash_transactions:
            student = (
                transaction.charge.enrollment.student
                if transaction.charge
                else None
            )
            add_issue(
                issue_id=f"cash-invalid-{transaction.id}",
                kind="cash_transaction_invalid",
                priority="high",
                title="Movimentação de caixa inconsistente",
                cause=(
                    "Movimentação realizada sem data efetiva."
                    if not transaction.transaction_date
                    else "Uma saída está vinculada indevidamente a uma cobrança."
                ),
                next_action="Revisar a origem e regularizar a movimentação.",
                entity_type="cash_transaction",
                entity_id=transaction.id,
                student=student,
                context=transaction.description,
                responsible=transaction.created_by.email,
                source_updated_at=transaction.updated_at,
            )

        duplicate_groups = (
            Charge.objects.exclude(status=Charge.Status.CANCELED)
            .values(
                "enrollment_id",
                "competence_date",
                "description",
                "amount",
            )
            .annotate(total=Count("id"))
            .filter(total__gt=1)
        )

        for group in duplicate_groups:
            duplicates = self.queryset.filter(
                enrollment_id=group["enrollment_id"],
                competence_date=group["competence_date"],
                description=group["description"],
                amount=group["amount"],
            )
            first_charge = duplicates.first()

            if not first_charge:
                continue

            add_issue(
                issue_id=(
                    f"duplicate-{group['enrollment_id']}-"
                    f"{group['competence_date']}-{group['amount']}"
                ),
                kind="duplicate_charge",
                priority="high",
                title="Possível cobrança duplicada",
                cause=f"Foram encontradas {group['total']} cobranças iguais na mesma competência.",
                next_action="Comparar as cobranças antes de receber ou cancelar qualquer parcela.",
                entity_type="charge",
                entity_id=first_charge.id,
                student=first_charge.enrollment.student,
                context=first_charge.description,
                source_updated_at=first_charge.updated_at,
            )

        priority = request.query_params.get("priority")
        kind = request.query_params.get("kind")
        search = request.query_params.get("search", "").strip().lower()

        if priority in {"critical", "high", "medium", "low"}:
            issues = [issue for issue in issues if issue["priority"] == priority]

        if kind:
            issues = [issue for issue in issues if issue["kind"] == kind]

        if search:
            issues = [
                issue
                for issue in issues
                if search
                in " ".join(
                    filter(
                        None,
                        [
                            issue["title"],
                            issue["cause"],
                            issue["student_name"],
                            issue["context"],
                        ],
                    )
                ).lower()
            ]

        priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        issues.sort(
            key=lambda issue: (
                priority_order[issue["priority"]],
                -(issue["source_updated_at"].timestamp() if issue["source_updated_at"] else 0),
            )
        )
        summary = {
            "total_count": len(issues),
            "critical_count": sum(issue["priority"] == "critical" for issue in issues),
            "high_count": sum(issue["priority"] == "high" for issue in issues),
            "checked_at": checked_at,
        }
        page = self.paginate_queryset(issues)

        if page is not None:
            response = self.get_paginated_response(page)
            response.data["summary"] = summary
            return response

        return Response({"results": issues, "summary": summary})

    # ==========================================
    # RESUMO FINANCEIRO
    # ==========================================

    @action(
        detail=False,
        methods=["get"],
        url_path="forecast",
    )
    def forecast(self, request):
        try:
            months = int(request.query_params.get("months", 6))
        except (TypeError, ValueError):
            months = 0

        if months not in {3, 6, 12}:
            return Response(
                {"months": ["Use um período de 3, 6 ou 12 meses."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        today = timezone.localdate()
        period_start = today.replace(day=1)
        period_end = self.shift_month(period_start, months)
        open_statuses = [Charge.Status.PENDING, Charge.Status.OVERDUE]
        queryset = self.get_queryset()
        period_queryset = queryset.filter(
            competence_date__gte=period_start,
            competence_date__lt=period_end,
        )
        monthly_items = (
            period_queryset.annotate(
                month=TruncMonth("competence_date"),
            )
            .values("month")
            .annotate(
                expected=Sum(
                    "amount",
                    filter=~Q(status=Charge.Status.CANCELED),
                    default=0,
                ),
                received=Sum(
                    "amount",
                    filter=Q(status=Charge.Status.PAID),
                    default=0,
                ),
                pending=Sum(
                    "amount",
                    filter=Q(
                        status__in=open_statuses,
                        due_date__gte=today,
                    ),
                    default=0,
                ),
                overdue=Sum(
                    "amount",
                    filter=Q(
                        status__in=open_statuses,
                        due_date__lt=today,
                    ),
                    default=0,
                ),
            )
            .order_by("month")
        )
        monthly_values = {
            (
                item["month"].date()
                if hasattr(item["month"], "date")
                else item["month"]
            ): item
            for item in monthly_items
        }
        monthly = []

        for offset in range(months):
            month = self.shift_month(period_start, offset)
            values = monthly_values.get(month, {})
            monthly.append(
                {
                    "period": month.strftime("%Y-%m"),
                    "expected": values.get("expected", Decimal("0")),
                    "received": values.get("received", Decimal("0")),
                    "pending": values.get("pending", Decimal("0")),
                    "overdue": values.get("overdue", Decimal("0")),
                }
            )

        totals = {
            key: sum(
                (item[key] for item in monthly),
                Decimal("0"),
            )
            for key in ["expected", "received", "pending", "overdue"]
        }
        historical_overdue = queryset.filter(
            status__in=open_statuses,
            due_date__lt=today,
        ).aggregate(total=Sum("amount", default=0))["total"]

        return Response(
            {
                "months": months,
                "period_start": period_start,
                "period_end": period_end,
                "totals": totals,
                "historical_overdue": historical_overdue,
                "monthly": monthly,
            }
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="summary",
    )
    def summary(self, request):
        queryset = self.get_queryset()

        paid = queryset.filter(
            status=Charge.Status.PAID,
        )

        open_charges = queryset.filter(
            status__in=[
                Charge.Status.PENDING,
                Charge.Status.OVERDUE,
            ],
        )

        overdue = queryset.filter(
            status__in=[Charge.Status.PENDING, Charge.Status.OVERDUE],
            due_date__lt=timezone.localdate(),
        )

        return Response(
            {
                "total_count": queryset.count(),
                "paid_total": paid.aggregate(
                    total=Sum("amount", default=0),
                )["total"],
                "open_total": open_charges.aggregate(
                    total=Sum("amount", default=0),
                )["total"],
                "overdue_count": overdue.count(),
                "overdue_total": overdue.aggregate(
                    total=Sum("amount", default=0),
                )["total"],
            }
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="dashboard-summary",
    )
    def dashboard_summary(self, request):
        today = timezone.localdate()
        filter_serializer = DashboardSummaryFilterSerializer(
            data=request.query_params,
        )
        filter_serializer.is_valid(raise_exception=True)
        requested_period = filter_serializer.validated_data.get("period")
        period_start = (
            date.fromisoformat(f"{requested_period}-01")
            if requested_period
            else today.replace(day=1)
        )

        if period_start > today.replace(day=1):
            return Response(
                {"period": ["O período não pode estar no futuro."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        period_end = self.shift_month(period_start, 1)
        is_current_period = period_start == today.replace(day=1)
        current_comparison_end = (
            today + timedelta(days=1)
            if is_current_period
            else period_end
        )

        previous_period_start = self.shift_month(period_start, -1)
        previous_month_last_day = period_start - timedelta(days=1)
        comparison_day = (
            today.day
            if is_current_period
            else previous_month_last_day.day
        )
        previous_comparison_day = min(
            comparison_day,
            previous_month_last_day.day,
        )
        previous_comparison_end = previous_period_start.replace(
            day=previous_comparison_day,
        ) + timedelta(days=1)

        current_metrics = Charge.objects.filter(
            status=Charge.Status.PAID,
            paid_at__date__gte=period_start,
            paid_at__date__lt=current_comparison_end,
        ).aggregate(
            total=Sum("amount", default=0),
            count=Count("id"),
            average=Avg("amount", default=0),
        )
        monthly_revenue = current_metrics["total"]

        previous_metrics = Charge.objects.filter(
            status=Charge.Status.PAID,
            paid_at__date__gte=previous_period_start,
            paid_at__date__lt=previous_comparison_end,
        ).aggregate(
            total=Sum("amount", default=0),
            count=Count("id"),
            average=Avg("amount", default=0),
        )
        previous_revenue = previous_metrics["total"]
        current_payment_count = current_metrics["count"]
        previous_payment_count = previous_metrics["count"]
        current_average_ticket = current_metrics["average"]
        previous_average_ticket = previous_metrics["average"]
        revenue_difference = monthly_revenue - previous_revenue
        volume_effect = (
            Decimal(current_payment_count - previous_payment_count)
            * previous_average_ticket
        )
        ticket_effect = (
            current_average_ticket - previous_average_ticket
        ) * Decimal(current_payment_count)

        growth_percentage = None

        if previous_revenue:
            growth_percentage = (
                (monthly_revenue - previous_revenue)
                / previous_revenue
                * Decimal("100")
            ).quantize(Decimal("0.1"))

        if not previous_revenue:
            growth_driver = "no_comparison"
        elif revenue_difference == 0:
            growth_driver = "stable"
        else:
            absolute_volume_effect = abs(volume_effect)
            absolute_ticket_effect = abs(ticket_effect)
            largest_effect = max(absolute_volume_effect, absolute_ticket_effect)
            effects_have_same_direction = volume_effect * ticket_effect > 0
            effects_are_both_material = (
                largest_effect > 0
                and min(absolute_volume_effect, absolute_ticket_effect)
                / largest_effect
                >= Decimal("0.5")
            )

            if effects_have_same_direction and effects_are_both_material:
                growth_driver = "combined"
            elif absolute_volume_effect >= absolute_ticket_effect:
                growth_driver = "payment_volume"
            else:
                growth_driver = "average_ticket"

        history_start = self.shift_month(period_start, -5)
        revenue_by_month = {
            item["month"].date(): item["total"]
            for item in Charge.objects.filter(
                status=Charge.Status.PAID,
                paid_at__date__gte=history_start,
                paid_at__date__lt=period_end,
            )
            .annotate(month=TruncMonth("paid_at"))
            .values("month")
            .annotate(total=Sum("amount"))
            .order_by("month")
        }

        revenue_history = []

        for offset in range(6):
            month = self.shift_month(history_start, offset)
            revenue_history.append(
                {
                    "period": month.strftime("%Y-%m"),
                    "revenue": revenue_by_month.get(
                        month,
                        Decimal("0"),
                    ),
                }
            )

        recent_payments = self.queryset.filter(
            status=Charge.Status.PAID,
            paid_at__isnull=False,
            paid_at__date__gte=period_start,
            paid_at__date__lt=current_comparison_end,
        ).order_by("-paid_at")[:4]

        return Response(
            {
                "monthly_revenue": monthly_revenue,
                "period_start": period_start.isoformat(),
                "period_end": period_end.isoformat(),
                "previous_revenue": previous_revenue,
                "growth_percentage": growth_percentage,
                "revenue_difference": revenue_difference,
                "current_payment_count": current_payment_count,
                "previous_payment_count": previous_payment_count,
                "current_average_ticket": current_average_ticket,
                "previous_average_ticket": previous_average_ticket,
                "volume_effect": volume_effect.quantize(Decimal("0.01")),
                "ticket_effect": ticket_effect.quantize(Decimal("0.01")),
                "growth_driver": growth_driver,
                "comparison_start": previous_period_start.isoformat(),
                "comparison_end": previous_comparison_end.isoformat(),
                "revenue_history": revenue_history,
                "recent_payments": self.get_serializer(
                    recent_payments,
                    many=True,
                ).data,
            }
        )

    # ==========================================
    # REGISTRAR PAGAMENTO
    # ==========================================

    @action(
        detail=True,
        methods=["post"],
        url_path="pay",
    )
    @transaction.atomic
    def pay(
        self,
        request,
        pk=None,
    ):
        charge = self.get_object()

        input_serializer = PayChargeSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        if charge.status == Charge.Status.PAID:
            return Response(
                {
                    "detail": "Esta cobrança já está paga.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if charge.status == Charge.Status.CANCELED:
            return Response(
                {
                    "detail": (
                        "Uma cobrança cancelada não pode ser marcada como paga."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        self.register_payment(
            charge,
            input_serializer.validated_data["payment_method"],
            request.user,
        )

        serializer = self.get_serializer(charge)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="bulk-pay",
    )
    def bulk_pay(self, request):
        input_serializer = BulkPayChargeSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        charge_ids = input_serializer.validated_data["charge_ids"]
        payment_method = input_serializer.validated_data["payment_method"]
        succeeded = []
        failed = []

        for charge_id in charge_ids:
            try:
                with transaction.atomic():
                    charge = (
                        Charge.objects.select_related(
                            "enrollment",
                            "enrollment__student",
                            "enrollment__plan",
                        )
                        .select_for_update()
                        .get(pk=charge_id)
                    )

                    if charge.status not in {
                        Charge.Status.PENDING,
                        Charge.Status.OVERDUE,
                    }:
                        failed.append(
                            {
                                "id": charge_id,
                                "detail": "A cobrança não está disponível para pagamento.",
                            }
                        )
                        continue

                    if charge.paid_at or charge.payment_method:
                        failed.append(
                            {
                                "id": charge_id,
                                "detail": "A cobrança possui dados financeiros inconsistentes.",
                            }
                        )
                        continue

                    self.register_payment(
                        charge,
                        payment_method,
                        request.user,
                    )
                    succeeded.append(charge)
            except Charge.DoesNotExist:
                failed.append(
                    {
                        "id": charge_id,
                        "detail": "Cobrança não encontrada.",
                    }
                )

        return Response(
            {
                "succeeded_count": len(succeeded),
                "failed_count": len(failed),
                "succeeded": self.get_serializer(succeeded, many=True).data,
                "failed": failed,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="reconcile",
    )
    @transaction.atomic
    def reconcile(self, request, pk=None):
        input_serializer = ReconcileChargeSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        charge = get_object_or_404(
            Charge.objects.select_related(
                "enrollment",
                "enrollment__student",
                "enrollment__plan",
            ).select_for_update(),
            pk=pk,
        )

        if charge.status != Charge.Status.PAID:
            return Response(
                {"detail": "Somente cobranças pagas podem ser conciliadas."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not charge.paid_at or not charge.payment_method:
            return Response(
                {"detail": "Complete os dados do pagamento antes da conciliação."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if hasattr(charge, "reconciliation"):
            return Response(
                {"detail": "Esta cobrança já foi conciliada."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        received_amount = input_serializer.validated_data["received_amount"]
        reconciliation_status = (
            ChargeReconciliation.Status.RECONCILED
            if received_amount == charge.amount
            else ChargeReconciliation.Status.DIVERGENT
        )
        reconciliation = ChargeReconciliation.objects.create(
            charge=charge,
            expected_amount=charge.amount,
            received_amount=received_amount,
            status=reconciliation_status,
            notes=input_serializer.validated_data.get("notes", ""),
            reconciled_by=request.user,
        )
        ChargeAudit.objects.create(
            charge=charge,
            action=ChargeAudit.Action.RECONCILED,
            actor=request.user,
            reason=reconciliation.notes,
            previous_state={"reconciliation": None},
            new_state={
                "reconciliation": {
                    "status": reconciliation.status,
                    "expected_amount": str(reconciliation.expected_amount),
                    "received_amount": str(reconciliation.received_amount),
                }
            },
        )

        charge.refresh_from_db()

        return Response(
            self.get_serializer(charge).data,
            status=status.HTTP_200_OK,
        )

    # ==========================================
    # CANCELAR COBRANÇA
    # ==========================================

    @action(
        detail=True,
        methods=["post"],
        url_path="cancel",
    )
    @transaction.atomic
    def cancel(
        self,
        request,
        pk=None,
    ):
        charge = self.get_object()

        input_serializer = CancelChargeSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        if charge.status == Charge.Status.PAID:
            return Response(
                {
                    "detail": ("Uma cobrança paga não pode ser cancelada."),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if charge.status == Charge.Status.CANCELED:
            return Response(
                {
                    "detail": "Esta cobrança já está cancelada.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        previous_state = self.audit_snapshot(charge)
        charge.status = Charge.Status.CANCELED

        charge.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        ChargeAudit.objects.create(
            charge=charge,
            action=ChargeAudit.Action.CANCELED,
            actor=request.user,
            reason=input_serializer.validated_data["reason"],
            previous_state=previous_state,
            new_state=self.audit_snapshot(charge),
        )

        serializer = self.get_serializer(charge)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )
