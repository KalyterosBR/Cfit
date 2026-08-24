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
from apps.financial.models import Charge, RecurringPaymentAttempt
from apps.financial.services.billing import PAYMENT_GRACE_PERIOD_DAYS, get_payment_grace_period_days
from apps.students.models import Student, StudentStatusHistory
from apps.workouts.models import WorkoutPlan


def search_students(search=None, active=None, segment=None, base_queryset=None):
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

    queryset = (base_queryset if base_queryset is not None else Student.objects.all()).annotate(
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

    if segment == "plan_ending":
        queryset = queryset.filter(
            enrollments__status=Enrollment.Status.ACTIVE,
            enrollments__due_date__range=(timezone.localdate(), timezone.localdate() + timedelta(days=30)),
        ).distinct()

    if segment == "without_workout":
        queryset = queryset.annotate(has_active_workout=Exists(
            WorkoutPlan.objects.filter(student_id=OuterRef("pk"), status=WorkoutPlan.Status.ACTIVE)
        )).filter(has_active_workout=False)

    if segment == "without_assessment":
        from apps.operations.models import PhysicalAssessment
        queryset = queryset.annotate(has_assessment=Exists(
            PhysicalAssessment.objects.filter(student_id=OuterRef("pk"))
        )).filter(has_assessment=False)

    if segment == "birthdays":
        today = timezone.localdate()
        queryset = queryset.filter(birth_date__month=today.month)

    if segment == "access_blocked":
        queryset = queryset.annotate(has_blocked_access=Exists(
            CheckIn.objects.filter(student_id=OuterRef("pk"), access_result=CheckIn.AccessResult.BLOCKED)
        )).filter(has_blocked_access=True)

    if segment == "incomplete_profile":
        queryset = queryset.filter(Q(email__isnull=True) | Q(email="") | Q(cep__isnull=True) | Q(cep=""))

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
        days=get_payment_grace_period_days(student) + 1,
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
    else:
        recent_frequency = CheckIn.objects.filter(
            student=student,
            access_result=CheckIn.AccessResult.ALLOWED,
            checked_in_at__gte=timezone.now() - timedelta(days=30),
        ).count()
        if recent_frequency < 4:
            score -= 10
            factors.append({"code": "low_frequency", "impact": -10, "label": "Baixa frequência nos últimos 30 dias"})

    if RecurringPaymentAttempt.objects.filter(
        charge__enrollment__student=student,
        status=RecurringPaymentAttempt.Status.REJECTED,
        occurred_at__gte=timezone.now() - timedelta(days=60),
    ).exists():
        score -= 15
        factors.append({"code": "recurring_failure", "impact": -15, "label": "Falha recente de recorrência"})

    if not WorkoutPlan.objects.filter(
        student=student,
        status=WorkoutPlan.Status.ACTIVE,
    ).exists():
        score -= 10
        factors.append({"code": "without_workout", "impact": -10, "label": "Sem treino ativo"})

    active_enrollment = Enrollment.objects.filter(student=student, status=Enrollment.Status.ACTIVE).order_by("due_date").first()
    if active_enrollment and active_enrollment.due_date <= timezone.localdate() + timedelta(days=30):
        score -= 10
        factors.append({"code": "plan_ending", "impact": -10, "label": "Plano termina nos próximos 30 dias"})

    if Enrollment.objects.filter(student=student, status=Enrollment.Status.FROZEN).exists():
        score -= 10
        factors.append({"code": "frozen_enrollment", "impact": -10, "label": "Matrícula trancada"})

    from apps.operations.models import PhysicalAssessment
    latest_assessment = PhysicalAssessment.objects.filter(student=student).order_by("-assessed_at").first()
    if latest_assessment and latest_assessment.assessed_at < timezone.localdate() - timedelta(days=180):
        score -= 5
        factors.append({"code": "outdated_assessment", "impact": -5, "label": "Avaliação física desatualizada"})

    latest_contact = student.interactions.order_by("-created_at").first()
    if latest_contact and latest_contact.status == "pending" and latest_contact.next_contact_at and latest_contact.next_contact_at < timezone.now():
        score -= 5
        factors.append({"code": "overdue_contact", "impact": -5, "label": "Contato de relacionamento atrasado"})

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


def get_student_financial_status(student_or_id):
    student = student_or_id if isinstance(student_or_id, Student) else Student.objects.get(pk=student_or_id)
    today = timezone.localdate()
    charges = Charge.objects.filter(enrollment__student=student).select_related("enrollment", "enrollment__plan")
    open_charges = charges.filter(status__in=[Charge.Status.PENDING, Charge.Status.OVERDUE])
    next_charge = open_charges.order_by("due_date", "created_at").first()
    if not Enrollment.objects.filter(student=student).exists() and not charges.exists():
        status, reason = "no_financial_link", "Aluno sem matrícula ou cobrança vinculada"
    elif open_charges.exclude(enrollment__status=Enrollment.Status.ACTIVE).exists():
        status, reason = "inconsistency", "Existe cobrança aberta vinculada a uma matrícula não ativa"
    else:
        overdue = open_charges.filter(status=Charge.Status.OVERDUE, due_date__lt=today).order_by("due_date").first()
        recurring_failure = RecurringPaymentAttempt.objects.filter(charge__enrollment__student=student, status=RecurringPaymentAttempt.Status.REJECTED, occurred_at__gte=timezone.now() - timedelta(days=60)).exists()
        if overdue:
            grace_limit = overdue.due_date + timedelta(days=get_payment_grace_period_days(student) + 1)
            status = "defaulting" if today >= grace_limit else "attention"
            reason = "Cobrança vencida além da tolerância" if status == "defaulting" else f"Cobrança vencida dentro da tolerância até {grace_limit:%d/%m/%Y}"
        elif recurring_failure:
            status, reason = "attention", "Falha recente em tentativa de cobrança recorrente"
        elif next_charge and next_charge.due_date <= today:
            status, reason = "pending", "Cobrança pendente com vencimento atingido"
        else:
            status, reason = "regular", "Sem pendências financeiras identificadas"
    origin = None
    if next_charge:
        origin = {"enrollment_id": str(next_charge.enrollment_id), "enrollment_status": next_charge.enrollment.status, "enrollment_status_label": next_charge.enrollment.get_status_display(), "plan_name": next_charge.enrollment.plan.name, "is_active_enrollment": next_charge.enrollment.status == Enrollment.Status.ACTIVE}
    return {"status": status, "reason": reason, "next_charge": next_charge, "next_charge_origin": origin}


def count_active_students_at(period_end, base_queryset=None):
    latest_status_event = StudentStatusHistory.objects.filter(
        student_id=OuterRef("pk"),
        created_at__lt=period_end,
    ).order_by("-created_at")

    return (
        (base_queryset if base_queryset is not None else Student.objects.all()).filter(created_at__lt=period_end)
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
