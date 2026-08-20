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
from apps.students.models import Student


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

    return queryset.order_by("name")
