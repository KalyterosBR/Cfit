from datetime import date

from django.db import transaction
from django.db.models import Count
from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from django.utils import timezone

from apps.checkins.api.serializers import (
    CheckInGoalInputSerializer,
    CheckInFilterSerializer,
    CheckInPeriodSerializer,
    CheckInSerializer,
    AccessPolicySerializer,
)
from apps.checkins.models import AccessPolicy, CheckIn, MonthlyCheckInGoal
from apps.users.models import AdministrativeAudit
from apps.users.permissions import ScopedCapability, get_request_scope


class CheckInViewSet(viewsets.ModelViewSet):
    serializer_class = CheckInSerializer
    permission_classes = [ScopedCapability]
    read_capability = "checkins.view"
    write_capability = "checkins.manage"

    http_method_names = [
        "get",
        "post",
        "patch",
        "head",
        "options",
    ]

    def get_queryset(self):
        queryset = CheckIn.objects.select_related(
            "student",
        ).all()
        academy, unit = get_request_scope(self.request.user)
        if academy:
            queryset = queryset.filter(student__academy=academy)
        if unit:
            queryset = queryset.filter(unit=unit)

        student_id = self.request.query_params.get(
            "student",
        )
        search = self.request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(student__name__icontains=search)
                | Q(student__cpf__icontains=search)
                | Q(equipment__icontains=search)
                | Q(location__icontains=search)
            )

        if student_id:
            queryset = queryset.filter(
                student_id=student_id,
            )

        filter_serializer = CheckInFilterSerializer(
            data=self.request.query_params,
        )
        filter_serializer.is_valid(raise_exception=True)
        filters = filter_serializer.validated_data

        if filters.get("checked_in_from"):
            queryset = queryset.filter(
                checked_in_at__date__gte=filters["checked_in_from"],
            )
        if filters.get("checked_in_to"):
            queryset = queryset.filter(
                checked_in_at__date__lte=filters["checked_in_to"],
            )
        if filters.get("source"):
            queryset = queryset.filter(source=filters["source"])
        if filters.get("access_result"):
            queryset = queryset.filter(access_result=filters["access_result"])

        return queryset

    def perform_create(self, serializer):
        academy, unit = get_request_scope(self.request.user)
        checkin = serializer.save(
            unit=unit,
            authorized_by=self.request.user if serializer.validated_data.get("contingency_reason") else None,
        )
        AdministrativeAudit.objects.create(
            academy=academy, actor=self.request.user, action="checkin.created",
            entity_type="checkin", entity_id=str(checkin.pk),
            new_state={
                "student": str(checkin.student_id),
                "result": checkin.access_result,
                "unit": str(unit.pk) if unit else None,
            },
        )

    @action(detail=False, methods=["get", "patch"], url_path="access-policy")
    def access_policy(self, request):
        academy, unit = get_request_scope(request.user)
        if not unit:
            return Response({"detail": "Selecione uma unidade ativa."}, status=400)
        policy, _ = AccessPolicy.objects.get_or_create(unit=unit)
        if request.method == "GET":
            return Response(AccessPolicySerializer(policy).data)
        serializer = AccessPolicySerializer(policy, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        previous = AccessPolicySerializer(policy).data
        policy = serializer.save()
        AdministrativeAudit.objects.create(
            academy=academy, actor=request.user, action="access_policy.updated",
            entity_type="access_policy", entity_id=str(policy.pk),
            previous_state=previous, new_state=serializer.data,
            reason=request.data.get("reason", ""),
        )
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="access-summary")
    def access_summary(self, request):
        queryset = self.get_queryset()
        return Response(
            {
                "total_count": queryset.count(),
                "allowed_count": queryset.filter(
                    access_result=CheckIn.AccessResult.ALLOWED,
                ).count(),
                "blocked_count": queryset.filter(
                    access_result=CheckIn.AccessResult.BLOCKED,
                ).count(),
                "by_source": list(
                    queryset.values("source")
                    .annotate(count=Count("id"))
                    .order_by("source")
                ),
            }
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="dashboard-summary",
    )
    def dashboard_summary(self, request):
        queryset = self.get_queryset()
        filter_serializer = CheckInPeriodSerializer(data=request.query_params)
        filter_serializer.is_valid(raise_exception=True)
        today = timezone.localdate()
        period = filter_serializer.validated_data.get(
            "period",
            today.strftime("%Y-%m"),
        )
        period_start = date.fromisoformat(f"{period}-01")
        period_end = (
            period_start.replace(year=period_start.year + 1, month=1)
            if period_start.month == 12
            else period_start.replace(month=period_start.month + 1)
        )
        recent_checkins = queryset[:4]

        return Response(
            {
                "today_count": queryset.filter(
                    checked_in_at__date=today,
                ).count(),
                "period": period,
                "period_count": queryset.filter(
                    checked_in_at__date__gte=period_start,
                    checked_in_at__date__lt=period_end,
                ).count(),
                "recent_checkins": self.get_serializer(
                    recent_checkins,
                    many=True,
                ).data,
            }
        )

    @action(
        detail=False,
        methods=["get", "post"],
        url_path="monthly-goal",
    )
    @transaction.atomic
    def monthly_goal(self, request):
        serializer_class = (
            CheckInGoalInputSerializer
            if request.method == "POST"
            else CheckInPeriodSerializer
        )
        serializer = serializer_class(
            data=(
                request.data
                if request.method == "POST"
                else request.query_params
            )
        )
        serializer.is_valid(raise_exception=True)
        period = serializer.validated_data.get("period")

        if not period:
            period = timezone.localdate().strftime("%Y-%m")

        period_date = date.fromisoformat(f"{period}-01")
        academy, _ = get_request_scope(request.user)
        goal = MonthlyCheckInGoal.objects.filter(
            academy=academy,
            period=period_date,
        ).select_related("updated_by").first()

        if request.method == "POST":
            previous_target = goal.target_count if goal else None
            goal, created = MonthlyCheckInGoal.objects.get_or_create(
                academy=academy,
                period=period_date,
                defaults={
                    "target_count": serializer.validated_data["target_count"],
                    "created_by": request.user,
                    "updated_by": request.user,
                },
            )

            if not created:
                goal.target_count = serializer.validated_data["target_count"]
                goal.updated_by = request.user
                goal.save(
                    update_fields=["target_count", "updated_by", "updated_at"]
                )

            response_status = (
                status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )
            AdministrativeAudit.objects.create(academy=academy, actor=request.user, action="goal.checkins_updated", entity_type="monthly_checkin_goal", entity_id=str(goal.pk), previous_state={"target_count": previous_target}, new_state={"target_count": goal.target_count, "period": period}, reason=str(request.data.get("reason", "Definição de meta operacional"))[:255])
        else:
            response_status = status.HTTP_200_OK

        return Response(
            {
                "period": period,
                "target_count": goal.target_count if goal else None,
                "updated_at": goal.updated_at if goal else None,
                "updated_by": goal.updated_by.email if goal else None,
            },
            status=response_status,
        )
