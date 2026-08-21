from datetime import timedelta

from django.db.models import (
    CharField,
    Count,
    DateField,
    DateTimeField,
    Exists,
    F,
    IntegerField,
    OuterRef,
    Q,
    Subquery,
    Value,
)
from django.db.models.functions import Coalesce, Replace
from django.utils import timezone
from unidecode import unidecode

from apps.checkins.models import CheckIn
from apps.enrollments.models import Enrollment
from apps.financial.models import Charge
from apps.financial.services.billing import PAYMENT_GRACE_PERIOD_DAYS
from apps.students.models import Student, StudentStatusHistory


def search_students(search=None, active=None, segment=None):
    active_enrollments = Enrollment.objects.filter(
        student_id=OuterRef("pk"),
        status=Enrollment.Status.ACTIVE,
    ).select_related("plan")
    open_charges = Charge.objects.filter(
        enrollment__student_id=OuterRef("pk"),
        status__in=[
            Charge.Status.PENDING,
            Charge.Status.OVERDUE,
        ],
    )
    overdue_charges = Charge.objects.filter(
        enrollment__student_id=OuterRef("pk"),
        status=Charge.Status.OVERDUE,
        due_date__lt=timezone.localdate(),
    )
    student_checkins = CheckIn.objects.filter(
        student_id=OuterRef("pk"),
    )
    recent_checkin_counts = (
        student_checkins.filter(
            checked_in_at__gte=timezone.now() - timedelta(days=30),
        )
        .values("student_id")
        .annotate(total=Count("id"))
        .values("total")
    )

    queryset = Student.objects.annotate(
        current_plan_name=Subquery(
            active_enrollments.order_by("due_date", "plan__name").values(
                "plan__name"
            )[:1],
        ),
        next_due_date=Subquery(
            open_charges.order_by("due_date", "created_at").values(
                "due_date"
            )[:1],
            output_field=DateField(),
        ),
        last_checkin_at=Subquery(
            student_checkins.order_by("-checked_in_at").values(
                "checked_in_at"
            )[:1],
            output_field=DateTimeField(),
        ),
        checkins_last_30_days=Coalesce(
            Subquery(
                recent_checkin_counts[:1],
                output_field=IntegerField(),
            ),
            Value(0),
        ),
        oldest_overdue_due_date=Subquery(
            overdue_charges.order_by("due_date").values("due_date")[:1],
            output_field=DateField(),
        ),
    )

    if active is not None:
        queryset = queryset.filter(active=active)

    if search:
        normalized_search = unidecode(search).casefold().strip()
        cpf_search = "".join(
            character for character in search if character.isdigit()
        )
        search_filter = Q(search_name__icontains=normalized_search)

        if cpf_search:
            queryset = queryset.annotate(
                normalized_cpf=Replace(
                    Replace(
                        F("cpf"),
                        Value("."),
                        Value(""),
                    ),
                    Value("-"),
                    Value(""),
                    output_field=CharField(),
                )
            )
            search_filter |= Q(normalized_cpf__icontains=cpf_search)

        queryset = queryset.filter(search_filter)

    if segment == "defaulting":
        defaulting_due_date = timezone.localdate() - timedelta(
            days=PAYMENT_GRACE_PERIOD_DAYS + 1,
        )
        defaulting_charges = Charge.objects.filter(
            enrollment__student_id=OuterRef("pk"),
            status=Charge.Status.OVERDUE,
            due_date__lte=defaulting_due_date,
        )
        queryset = queryset.annotate(
            has_defaulting_charge=Exists(defaulting_charges),
        ).filter(has_defaulting_charge=True)

    if segment == "without_plan":
        queryset = queryset.annotate(
            has_active_enrollment=Exists(active_enrollments),
        ).filter(has_active_enrollment=False)

    if segment == "without_recent_checkin":
        recent_checkins = CheckIn.objects.filter(
            student_id=OuterRef("pk"),
            checked_in_at__gte=timezone.now() - timedelta(days=30),
        )
        queryset = queryset.annotate(
            has_recent_checkin=Exists(recent_checkins),
        ).filter(has_recent_checkin=False)

    if segment == "at_risk":
        risk_ids = [
            student_id
            for student_id in Student.objects.filter(active=True).values_list("id", flat=True)
            if get_student_health_score(student_id)["status"] == "risk"
        ]
        queryset = queryset.filter(id__in=risk_ids)

    return queryset.order_by("name")


def get_student_health_score(student_or_id):
    student = (
        student_or_id
        if isinstance(student_or_id, Student)
        else Student.objects.get(pk=student_or_id)
    )
    factors = []
    score = 100
    has_plan = Enrollment.objects.filter(
        student=student,
        status=Enrollment.Status.ACTIVE,
    ).exists()
    if not has_plan:
        score -= 30
        factors.append({"code": "without_plan", "impact": -30, "label": "Sem matrícula ativa"})

    defaulting_date = timezone.localdate() - timedelta(
        days=PAYMENT_GRACE_PERIOD_DAYS + 1,
    )
    if Charge.objects.filter(
        enrollment__student=student,
        status=Charge.Status.OVERDUE,
        due_date__lte=defaulting_date,
    ).exists():
        score -= 30
        factors.append({"code": "defaulting", "impact": -30, "label": "Inadimplência além da tolerância"})

    last_checkin = CheckIn.objects.filter(student=student).order_by(
        "-checked_in_at"
    ).values_list("checked_in_at", flat=True).first()
    if not last_checkin:
        score -= 30
        factors.append({"code": "never_checked_in", "impact": -30, "label": "Nenhum check-in registrado"})
    elif last_checkin < timezone.now() - timedelta(days=30):
        score -= 25
        factors.append({"code": "inactive_30_days", "impact": -25, "label": "Sem check-in há mais de 30 dias"})

    if not student.active:
        score = 0
        factors.append({"code": "inactive", "impact": -100, "label": "Cadastro inativo"})

    score = max(score, 0)
    status_value = "healthy" if score >= 70 else "attention" if score >= 40 else "risk"
    return {
        "student": str(student.id),
        "student_name": student.name,
        "score": score,
        "status": status_value,
        "factors": factors,
    }


def count_active_students_at(period_end):
    latest_status_event = StudentStatusHistory.objects.filter(
        student_id=OuterRef("pk"),
        created_at__lt=period_end,
    ).order_by("-created_at")

    return (
        Student.objects.filter(created_at__lt=period_end)
        .annotate(
            latest_status_event=Subquery(
                latest_status_event.values("event_type")[:1],
                output_field=CharField(),
            )
        )
        .filter(
            Q(latest_status_event__isnull=True)
            | Q(
                latest_status_event=(
                    StudentStatusHistory.EventType.REACTIVATED
                )
            )
        )
        .count()
    )
