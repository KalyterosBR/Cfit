from calendar import monthrange
from datetime import date, timedelta
from decimal import Decimal, ROUND_DOWN

from django.utils import timezone

from apps.enrollments.models import Enrollment
from apps.financial.models import Charge


RECURRING_CHARGE_DAYS_BEFORE = 10
PAYMENT_GRACE_PERIOD_DAYS = 7


def add_months(
    original_date: date,
    months: int,
) -> date:
    month_index = original_date.month - 1 + months

    year = original_date.year + month_index // 12
    month = month_index % 12 + 1

    day = min(
        original_date.day,
        monthrange(year, month)[1],
    )

    return date(year, month, day)


def create_enrollment_charges(enrollment):
    # ==========================================
    # PAGAMENTO À VISTA
    # ==========================================

    if enrollment.billing_method == "full":
        return [
            Charge.objects.create(
                enrollment=enrollment,
                description=(f"Pagamento do plano - {enrollment.plan.name}"),
                amount=enrollment.contracted_price,
                due_date=enrollment.due_date,
                status=Charge.Status.PENDING,
            )
        ]

    # ==========================================
    # PLANO MENSAL RECORRENTE
    # ==========================================

    duration_months = enrollment.plan.duration_months

    if duration_months == 1:
        return [
            Charge.objects.create(
                enrollment=enrollment,
                description=(f"Mensalidade - {enrollment.plan.name}"),
                amount=enrollment.contracted_price,
                due_date=enrollment.due_date,
                status=Charge.Status.PENDING,
            )
        ]

    # ==========================================
    # PLANO PARCELADO
    # ==========================================

    total = enrollment.contracted_price

    installment_value = (total / Decimal(duration_months)).quantize(
        Decimal("0.01"),
        rounding=ROUND_DOWN,
    )

    charges = []
    accumulated = Decimal("0.00")

    for installment in range(
        1,
        duration_months + 1,
    ):
        if installment == duration_months:
            amount = total - accumulated
        else:
            amount = installment_value

        due_date = add_months(
            enrollment.due_date,
            installment - 1,
        )

        charge = Charge.objects.create(
            enrollment=enrollment,
            description=(
                f"Parcela {installment}/{duration_months} - {enrollment.plan.name}"
            ),
            amount=amount,
            due_date=due_date,
            status=Charge.Status.PENDING,
        )

        charges.append(charge)
        accumulated += amount

    return charges


def generate_recurring_charges(
    reference_date: date | None = None,
):
    """
    Gera a próxima cobrança dos planos mensais
    recorrentes quando faltar 10 dias ou menos
    para o próximo vencimento.

    Pode ser executada várias vezes sem gerar
    duplicidades.
    """

    if reference_date is None:
        reference_date = timezone.localdate()

    enrollments = Enrollment.objects.select_related(
        "plan",
        "student",
    ).filter(
        status=Enrollment.Status.ACTIVE,
        billing_method=Enrollment.BillingMethod.MONTHLY,
        plan__duration_months=1,
    )

    created_charges = []

    for enrollment in enrollments:
        last_charge = (
            Charge.objects.filter(
                enrollment=enrollment,
            )
            .exclude(
                status=Charge.Status.CANCELED,
            )
            .order_by("-due_date")
            .first()
        )

        if not last_charge:
            continue

        next_due_date = add_months(
            last_charge.due_date,
            1,
        )

        generation_date = next_due_date - timedelta(
            days=RECURRING_CHARGE_DAYS_BEFORE,
        )

        if reference_date < generation_date:
            continue

        already_exists = (
            Charge.objects.filter(
                enrollment=enrollment,
                due_date=next_due_date,
            )
            .exclude(
                status=Charge.Status.CANCELED,
            )
            .exists()
        )

        if already_exists:
            continue

        charge = Charge.objects.create(
            enrollment=enrollment,
            description=(f"Mensalidade - {enrollment.plan.name}"),
            amount=enrollment.contracted_price,
            due_date=next_due_date,
            status=Charge.Status.PENDING,
        )

        created_charges.append(charge)

    return created_charges


def mark_overdue_charges(
    reference_date: date | None = None,
):
    """
    Marca como atrasadas as cobranças pendentes
    cujo vencimento já passou.
    """

    if reference_date is None:
        reference_date = timezone.localdate()

    overdue_charges = Charge.objects.filter(
        status=Charge.Status.PENDING,
        due_date__lt=reference_date,
    )

    updated_count = overdue_charges.update(
        status=Charge.Status.OVERDUE,
        updated_at=timezone.now(),
    )

    return updated_count


def is_student_defaulting(
    student,
    reference_date: date | None = None,
) -> bool:
    """
    Retorna True quando o aluno possui pelo menos
    uma cobrança atrasada que ultrapassou o período
    de tolerância financeira.
    """

    if reference_date is None:
        reference_date = timezone.localdate()

    grace_limit = reference_date - timedelta(
        days=PAYMENT_GRACE_PERIOD_DAYS,
    )

    return Charge.objects.filter(
        enrollment__student=student,
        status=Charge.Status.OVERDUE,
        due_date__lt=grace_limit,
    ).exists()
