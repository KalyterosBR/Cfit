from datetime import date, datetime, time, timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.enrollments.models import Enrollment, EnrollmentHistory
from apps.financial.models import Charge, ChargeAudit, RecurringPaymentAttempt
from apps.students.models import MonthlyActiveStudentGoal, Student, StudentStatusHistory
from apps.students.selectors import (
    count_active_students_at,
    get_student_health_score,
    search_students,
)
from apps.students.serializers import (
    ActiveStudentGoalInputSerializer,
    ActiveStudentGoalQuerySerializer,
    StudentSerializer,
)
from apps.students.services.student_service import (
    activate_student,
    create_student,
    deactivate_student,
    delete_student,
    update_student,
)
from apps.workouts.models import WorkoutPlan


class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer

    filter_backends = [
        filters.OrderingFilter,
    ]

    ordering_fields = [
        "name",
        "created_at",
    ]

    ordering = [
        "name",
    ]

    def get_queryset(self):
        search = self.request.query_params.get("search")
        active_param = self.request.query_params.get("active")
        segment = self.request.query_params.get("segment")
        active = None

        if active_param in {"true", "false"}:
            active = active_param == "true"

        if segment not in {
            "defaulting",
            "without_plan",
            "without_recent_checkin",
            "at_risk",
        }:
            segment = None

        return search_students(search, active, segment)

    @action(detail=True, methods=["get"], url_path="health-score")
    def health_score(self, request, pk=None):
        return Response(get_student_health_score(self.get_object()))

    @action(detail=False, methods=["get"], url_path="health-summary")
    def health_summary(self, request):
        scores = [
            get_student_health_score(student)
            for student in Student.objects.filter(active=True).order_by("name")
        ]
        return Response(
            {
                "total_count": len(scores),
                "healthy_count": sum(item["status"] == "healthy" for item in scores),
                "attention_count": sum(item["status"] == "attention" for item in scores),
                "risk_count": sum(item["status"] == "risk" for item in scores),
                "at_risk": sorted(scores, key=lambda item: item["score"])[:10],
                "methodology": {
                    "base_score": 100,
                    "thresholds": {"healthy": 70, "attention": 40},
                    "factors": {
                        "without_plan": -30,
                        "defaulting": -30,
                        "never_checked_in": -30,
                        "inactive_30_days": -25,
                    },
                },
            }
        )

    def perform_create(self, serializer):
        return create_student(serializer.validated_data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        student = self.perform_create(serializer)

        return Response(
            self.get_serializer(student).data,
            status=status.HTTP_201_CREATED,
        )

    def perform_update(self, serializer):
        return update_student(
            self.get_object(),
            serializer.validated_data,
        )

    def update(self, request, *args, **kwargs):
        student = self.get_object()

        serializer = self.get_serializer(
            student,
            data=request.data,
            partial=False,
        )

        serializer.is_valid(raise_exception=True)

        student = self.perform_update(serializer)

        return Response(self.get_serializer(student).data)

    def partial_update(self, request, *args, **kwargs):
        student = self.get_object()

        serializer = self.get_serializer(
            student,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)

        student = update_student(
            student,
            serializer.validated_data,
        )

        return Response(self.get_serializer(student).data)

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        return Response(
            {
                "count": self.filter_queryset(
                    self.get_queryset(),
                ).count(),
            }
        )

    @action(detail=False, methods=["get"], url_path="dashboard-summary")
    def dashboard_summary(self, request):
        period = request.query_params.get(
            "period",
            timezone.localdate().strftime("%Y-%m"),
        )

        try:
            period_start = date.fromisoformat(f"{period}-01")
        except ValueError:
            return Response(
                {"period": ["Informe o período no formato AAAA-MM."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        next_month = (
            period_start.replace(year=period_start.year + 1, month=1)
            if period_start.month == 12
            else period_start.replace(month=period_start.month + 1)
        )
        previous_month = (
            period_start.replace(year=period_start.year - 1, month=12)
            if period_start.month == 1
            else period_start.replace(month=period_start.month - 1)
        )
        period_end = timezone.make_aware(datetime.combine(next_month, time.min))
        previous_period_end = timezone.make_aware(
            datetime.combine(period_start, time.min)
        )
        period_end_datetime = period_end
        created_count = self.get_queryset().filter(
            created_at__gte=previous_period_end,
            created_at__lt=period_end_datetime,
        ).count()
        status_events = StudentStatusHistory.objects.filter(
            created_at__gte=previous_period_end,
            created_at__lt=period_end_datetime,
        )
        deactivated_count = status_events.filter(
            event_type=StudentStatusHistory.EventType.DEACTIVATED,
        ).count()
        reactivated_count = status_events.filter(
            event_type=StudentStatusHistory.EventType.REACTIVATED,
        ).count()
        active_count = count_active_students_at(period_end)
        previous_active_count = count_active_students_at(previous_period_end)
        change = active_count - previous_active_count
        change_percentage = (
            round(change / previous_active_count * 100, 1)
            if previous_active_count
            else None
        )
        first_status_event = StudentStatusHistory.objects.order_by(
            "created_at"
        ).values_list("created_at", flat=True).first()
        data_quality = (
            "complete"
            if first_status_event and period_start >= first_status_event.date()
            else "partial"
        )

        return Response(
            {
                "period": period,
                "period_start": period_start,
                "period_end": next_month,
                "active_count": active_count,
                "previous_period": previous_month.strftime("%Y-%m"),
                "previous_active_count": previous_active_count,
                "change": change,
                "change_percentage": change_percentage,
                "created_count": created_count,
                "deactivated_count": deactivated_count,
                "reactivated_count": reactivated_count,
                "event_net_change": (
                    created_count - deactivated_count + reactivated_count
                ),
                "data_quality": data_quality,
                "history_available_from": first_status_event,
            }
        )

    @action(detail=False, methods=["get", "post"], url_path="monthly-goal")
    @transaction.atomic
    def monthly_goal(self, request):
        serializer_class = (
            ActiveStudentGoalInputSerializer
            if request.method == "POST"
            else ActiveStudentGoalQuerySerializer
        )
        serializer = serializer_class(
            data=request.data if request.method == "POST" else request.query_params
        )
        serializer.is_valid(raise_exception=True)
        period = serializer.validated_data["period"]
        period_date = date.fromisoformat(f"{period}-01")
        goal = MonthlyActiveStudentGoal.objects.filter(
            academy__isnull=True,
            period=period_date,
        ).select_related("updated_by").first()
        response_status = status.HTTP_200_OK

        if request.method == "POST":
            goal, created = MonthlyActiveStudentGoal.objects.get_or_create(
                academy=None,
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

        return Response(
            {
                "period": period,
                "target_count": goal.target_count if goal else None,
                "updated_at": goal.updated_at if goal else None,
                "updated_by": goal.updated_by.email if goal else None,
            },
            status=response_status,
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="operational-summary",
    )
    def operational_summary(self, request, pk=None):
        student = self.get_object()

        active_enrollments = (
            Enrollment.objects.filter(
                student=student,
                status=Enrollment.Status.ACTIVE,
            )
            .select_related("plan")
            .order_by("due_date", "plan__name")
        )

        next_charge = (
            Charge.objects.filter(
                enrollment__student=student,
                status__in=[
                    Charge.Status.PENDING,
                    Charge.Status.OVERDUE,
                ],
            )
            .order_by("due_date", "created_at")
            .first()
        )

        latest_checkin = student.checkins.order_by(
            "-checked_in_at",
        ).first()
        frequency_since = timezone.now() - timedelta(days=30)
        current_workout = WorkoutPlan.objects.filter(
            student=student,
            status=WorkoutPlan.Status.ACTIVE,
        ).select_related("instructor").first()

        return Response(
            {
                "active_plans": [
                    {
                        "id": enrollment.plan_id,
                        "name": enrollment.plan.name,
                    }
                    for enrollment in active_enrollments
                ],
                "next_charge": (
                    {
                        "id": next_charge.id,
                        "due_date": next_charge.due_date,
                        "amount": next_charge.amount,
                        "status": next_charge.status,
                    }
                    if next_charge
                    else None
                ),
                "latest_checkin_at": (
                    latest_checkin.checked_in_at
                    if latest_checkin
                    else None
                ),
                "checkins_last_30_days": student.checkins.filter(
                    checked_in_at__gte=frequency_since,
                ).count(),
                "current_workout": (
                    {
                        "id": current_workout.id,
                        "name": current_workout.name,
                        "objective": current_workout.objective,
                        "review_date": current_workout.review_date,
                        "instructor": current_workout.instructor.email,
                    }
                    if current_workout
                    else None
                ),
            }
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="timeline",
    )
    def timeline(self, request, pk=None):
        student = self.get_object()
        events = []

        enrollment_events = EnrollmentHistory.objects.filter(
            enrollment__student=student,
        ).select_related("enrollment__plan", "enrollment__created_by")

        for history in enrollment_events:
            events.append(
                {
                    "id": f"enrollment-{history.id}",
                    "type": f"enrollment_{history.event_type}",
                    "category": "Matrícula",
                    "title": history.get_event_type_display(),
                    "description": history.description,
                    "occurred_at": history.created_at,
                    "context": history.enrollment.plan.name,
                    "actor_name": (
                        history.enrollment.created_by.email
                        if history.event_type == EnrollmentHistory.EventType.CREATED
                        and history.enrollment.created_by
                        else None
                    ),
                }
            )

        charges = Charge.objects.filter(
            enrollment__student=student,
        ).select_related("enrollment__plan").prefetch_related(
            "audit_events__actor",
        )

        for charge in charges:
            amount = f"R$ {charge.amount:.2f}".replace(".", ",")
            context = charge.enrollment.plan.name

            events.append(
                {
                    "id": f"charge-created-{charge.id}",
                    "type": "charge_created",
                    "category": "Financeiro",
                    "title": "Cobrança gerada",
                    "description": (
                        f"{charge.description} · {amount} · "
                        f"vencimento em {charge.due_date:%d/%m/%Y}."
                    ),
                    "occurred_at": charge.created_at,
                    "context": context,
                    "actor_name": None,
                }
            )

            audit_events = list(charge.audit_events.all())
            audited_actions = {event.action for event in audit_events}

            for audit_event in audit_events:
                if audit_event.action == ChargeAudit.Action.PAYMENT_REGISTERED:
                    payment_method = charge.get_payment_method_display()
                    title = "Pagamento registrado"
                    description = (
                        f"{charge.description} · {amount} · {payment_method}."
                    )
                    event_type = "payment_registered"
                elif audit_event.action == ChargeAudit.Action.CANCELED:
                    title = "Cobrança cancelada"
                    description = (
                        f"{charge.description} · {amount}. "
                        f"Motivo: {audit_event.reason}"
                    )
                    event_type = "charge_canceled"
                else:
                    reconciliation = audit_event.new_state.get(
                        "reconciliation",
                        {},
                    )
                    expected = reconciliation.get("expected_amount", "0")
                    received = reconciliation.get("received_amount", "0")
                    title = "Cobrança conciliada"
                    description = (
                        f"{charge.description} · esperado R$ {expected} · "
                        f"recebido R$ {received}."
                    )

                    if audit_event.reason:
                        description += f" Observação: {audit_event.reason}"

                    event_type = "charge_reconciled"

                events.append(
                    {
                        "id": f"charge-audit-{audit_event.id}",
                        "type": event_type,
                        "category": "Financeiro",
                        "title": title,
                        "description": description,
                        "occurred_at": audit_event.created_at,
                        "context": context,
                        "actor_name": audit_event.actor.email,
                    }
                )

            if (
                charge.paid_at
                and ChargeAudit.Action.PAYMENT_REGISTERED not in audited_actions
            ):
                payment_method = (
                    charge.get_payment_method_display()
                    if charge.payment_method
                    else "Método não informado"
                )
                events.append(
                    {
                        "id": f"charge-paid-{charge.id}",
                        "type": "payment_registered",
                        "category": "Financeiro",
                        "title": "Pagamento registrado",
                        "description": (
                            f"{charge.description} · {amount} · "
                            f"{payment_method}."
                        ),
                        "occurred_at": charge.paid_at,
                        "context": context,
                        "actor_name": None,
                    }
                )

            if (
                charge.status == Charge.Status.CANCELED
                and ChargeAudit.Action.CANCELED not in audited_actions
            ):
                events.append(
                    {
                        "id": f"charge-canceled-{charge.id}",
                        "type": "charge_canceled",
                        "category": "Financeiro",
                        "title": "Cobrança cancelada",
                        "description": f"{charge.description} · {amount}.",
                        "occurred_at": charge.updated_at,
                        "context": context,
                        "actor_name": None,
                    }
                )

        for checkin in student.checkins.all():
            events.append(
                {
                    "id": f"checkin-{checkin.id}",
                    "type": "checkin_registered",
                    "category": "Check-in",
                    "title": "Check-in registrado",
                    "description": checkin.notes,
                    "occurred_at": checkin.checked_in_at,
                    "context": checkin.get_source_display(),
                    "actor_name": None,
                }
            )

        recurring_attempts = RecurringPaymentAttempt.objects.filter(
            charge__enrollment__student=student,
        ).select_related(
            "charge__enrollment__plan",
            "recorded_by",
        )

        for attempt in recurring_attempts:
            description = (
                f"{attempt.charge.description} · tentativa "
                f"{attempt.attempt_number} · {attempt.get_status_display()}."
            )

            if attempt.failure_reason:
                description += f" Motivo: {attempt.failure_reason}"

            events.append(
                {
                    "id": f"recurring-attempt-{attempt.id}",
                    "type": "recurring_attempt",
                    "category": "Financeiro",
                    "title": "Tentativa de cobrança recorrente",
                    "description": description,
                    "occurred_at": attempt.occurred_at,
                    "context": attempt.charge.enrollment.plan.name,
                    "actor_name": (
                        attempt.recorded_by.email
                        if attempt.recorded_by
                        else attempt.get_source_display()
                    ),
                }
            )

        for status_event in student.status_history.select_related("actor"):
            events.append(
                {
                    "id": f"student-status-{status_event.id}",
                    "type": f"student_{status_event.event_type}",
                    "category": "Cadastro",
                    "title": status_event.get_event_type_display(),
                    "description": status_event.reason,
                    "occurred_at": status_event.created_at,
                    "context": "Status do aluno",
                    "actor_name": status_event.actor.email,
                }
            )

        events.sort(
            key=lambda event: event["occurred_at"],
            reverse=True,
        )

        return Response({"events": events})

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        student = self.get_object()
        reason = str(request.data.get("reason", "")).strip()

        if not reason:
            return Response(
                {"reason": ["Informe o motivo da inativação."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(reason) > 500:
            return Response(
                {"reason": ["O motivo deve ter no máximo 500 caracteres."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        student = deactivate_student(
            student,
            reason=reason,
            actor=request.user,
        )

        return Response(
            self.get_serializer(student).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        student = self.get_object()
        student = activate_student(student, actor=request.user)

        return Response(
            self.get_serializer(student).data,
            status=status.HTTP_200_OK,
        )

    def perform_destroy(self, instance):
        delete_student(instance)
