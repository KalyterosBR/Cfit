from datetime import date, timedelta

from django.core.cache import cache
from django.db.models import Avg, Count, Sum
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.checkins.models import CheckIn
from apps.enrollments.models import Enrollment
from apps.financial.models import Charge
from apps.users.permissions import HasCapability, get_request_scope
from apps.academy.models import Unit
from apps.operations.models import GroupClass, Lead, StudentDocument
from apps.schedule.models import ScheduleEvent
from apps.workouts.models import WorkoutProgress, WorkoutSession


class ManagementReportView(APIView):
    permission_classes = [HasCapability]
    required_capability = "reports.view"

    def get(self, request):
        academy, unit = get_request_scope(request.user)
        period = request.query_params.get("period", date.today().strftime("%Y-%m"))
        try:
            start = date.fromisoformat(f"{period}-01")
        except ValueError:
            return Response({"period": ["Informe o período no formato AAAA-MM."]}, status=400)
        cache_key = f"cfit:management-report:{academy.pk}:{unit.pk if unit else 'network'}:{period}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response({**cached, "cache": "hit"})
        end = start.replace(year=start.year + 1, month=1) if start.month == 12 else start.replace(month=start.month + 1)
        charges = Charge.objects.filter(enrollment__student__academy=academy)
        enrollments = Enrollment.objects.filter(student__academy=academy)
        checkins = CheckIn.objects.filter(student__academy=academy)
        if unit:
            charges = charges.filter(unit=unit); enrollments = enrollments.filter(unit=unit); checkins = checkins.filter(unit=unit)
        paid = charges.filter(status=Charge.Status.PAID, paid_at__date__gte=start, paid_at__date__lt=end)
        overdue = charges.filter(status=Charge.Status.OVERDUE)
        period_checkins = checkins.filter(checked_in_at__date__gte=start, checked_in_at__date__lt=end, access_result=CheckIn.AccessResult.ALLOWED)
        student_count = period_checkins.values("student_id").distinct().count()
        leads = Lead.objects.filter(academy=academy, created_at__date__gte=start, created_at__date__lt=end)
        classes = GroupClass.objects.filter(academy=academy, starts_at__date__gte=start, starts_at__date__lt=end, canceled=False)
        documents = StudentDocument.objects.filter(student__academy=academy)
        schedule_events = ScheduleEvent.objects.filter(unit__academy=academy, starts_at__date__gte=start, starts_at__date__lt=end)
        workout_progress = WorkoutProgress.objects.filter(workout__student__academy=academy, recorded_at__gte=start, recorded_at__lt=end)
        workout_sessions = WorkoutSession.objects.filter(workout__student__academy=academy, scheduled_for__gte=start, scheduled_for__lt=end)
        if unit:
            leads = leads.filter(unit=unit); classes = classes.filter(unit=unit); documents = documents.filter(student__unit=unit)
            schedule_events = schedule_events.filter(unit=unit); workout_progress = workout_progress.filter(workout__unit=unit); workout_sessions = workout_sessions.filter(workout__unit=unit)
        lead_total = leads.count(); won_leads = leads.filter(stage="won").count()
        offered_capacity = sum(item.capacity for item in classes)
        occupied = sum(item.bookings.filter(status__in=["confirmed", "attended"]).count() for item in classes)
        completed = enrollments.filter(status__in=[Enrollment.Status.FINISHED, Enrollment.Status.EXPIRED, Enrollment.Status.CANCELED], updated_at__date__gte=start, updated_at__date__lt=end)
        renewed = enrollments.filter(renewed_from__isnull=False, created_at__date__gte=start, created_at__date__lt=end).count()
        eligible_for_renewal = completed.exclude(status=Enrollment.Status.CANCELED).count()
        durations = [(item.updated_at.date() - item.start_date).days for item in completed.only("start_date", "updated_at")]
        cancellation_reasons = list(enrollments.filter(status=Enrollment.Status.CANCELED, updated_at__date__gte=start, updated_at__date__lt=end).exclude(cancellation_reason="").values("cancellation_reason").annotate(total=Count("id")).order_by("-total")[:10])
        payload = {
            "period": period,
            "scope": {"unit": str(unit.id) if unit else None, "unit_name": unit.name if unit else "Rede consolidada", "basis": "caixa recebido"},
            "revenue_by_plan": list(paid.values("enrollment__plan__name").annotate(total=Sum("amount"), payments=Count("id")).order_by("-total")),
            "overdue_by_plan": list(overdue.values("enrollment__plan__name").annotate(total=Sum("amount"), charges=Count("id")).order_by("-total")),
            "average_checkins_per_student": round(period_checkins.count() / student_count, 1) if student_count else 0,
            "students_with_checkins": student_count,
            "cancellations": enrollments.filter(status=Enrollment.Status.CANCELED, updated_at__date__gte=start, updated_at__date__lt=end).count(),
            "active_enrollments": enrollments.filter(status=Enrollment.Status.ACTIVE).count(),
            "renewal_rate": round(renewed * 100 / eligible_for_renewal, 1) if eligible_for_renewal else 0,
            "average_stay_days": round(sum(durations) / len(durations), 1) if durations else 0,
            "cancellation_reasons": cancellation_reasons,
            "lead_conversion_rate": round(won_leads * 100 / lead_total, 1) if lead_total else 0,
            "lead_total": lead_total,
            "class_occupancy_rate": round(occupied * 100 / offered_capacity, 1) if offered_capacity else 0,
            "schedule_completion_rate": round(schedule_events.filter(status=ScheduleEvent.Status.COMPLETED).count() * 100 / schedule_events.count(), 1) if schedule_events.exists() else 0,
            "workout_adherence": round(workout_progress.aggregate(value=Avg("adherence_percentage"))["value"] or 0, 1),
            "workout_sessions_completed": workout_sessions.filter(status=WorkoutSession.Status.COMPLETED).count(),
            "expired_documents": documents.filter(expires_at__lt=date.today()).count(),
            "expiring_documents": documents.filter(expires_at__gte=date.today(), expires_at__lte=date.today() + timedelta(days=30)).count(),
        }
        cache.set(cache_key, payload, timeout=60)
        return Response({**payload, "cache": "miss"})


class UnitComparisonReportView(APIView):
    permission_classes = [HasCapability]
    required_capability = "reports.view"

    def get(self, request):
        academy, _ = get_request_scope(request.user)
        rows = []
        for unit in Unit.objects.filter(academy=academy, active=True).order_by("name"):
            paid = Charge.objects.filter(unit=unit, status=Charge.Status.PAID)
            overdue = Charge.objects.filter(unit=unit, status=Charge.Status.OVERDUE)
            active = Enrollment.objects.filter(unit=unit, status=Enrollment.Status.ACTIVE)
            checkins = CheckIn.objects.filter(unit=unit, access_result=CheckIn.AccessResult.ALLOWED)
            students = active.values("student_id").distinct().count()
            revenue = paid.aggregate(total=Sum("amount"))["total"] or 0
            rows.append({
                "unit": str(unit.pk), "unit_name": unit.name,
                "active_students": students, "revenue": revenue,
                "revenue_per_student": round(revenue / students, 2) if students else 0,
                "overdue_total": overdue.aggregate(total=Sum("amount"))["total"] or 0,
                "checkins": checkins.count(),
            })
        return Response({"units": rows})
