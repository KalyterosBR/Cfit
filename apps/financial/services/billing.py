from calendar import monthrange
from datetime import date, timedelta
from decimal import Decimal, ROUND_DOWN

from django.utils import timezone

from apps.enrollments.models import Enrollment
from apps.financial.models import Charge


RECURRING_CHARGE_DAYS_BEFORE = 10
PAYMENT_GRACE_PERIOD_DAYS = 7

BILLING_PERIOD_MONTHS = {
    "monthly": 1,
    "quarterly": 3,
    "semiannual": 6,
    "annual": 12,
}


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


def get_billing_cycle_months(plan):
    return BILLING_PERIOD_MONTHS.get(plan.billing_period)


def get_installment_count(plan):
    cycle_months = get_billing_cycle_months(plan)

    if not cycle_months:
        return 1

    return max(
        1,
        (plan.duration_months + cycle_months - 1) // cycle_months,
    )

def build_charge_schedule(plan, total, due_date, billing_method):
    total = Decimal(total)
    schedule = []

    if plan.enrollment_fee > 0:
        schedule.append(
            {
                "description": f"Taxa de matrícula - {plan.name}",
                "amount": plan.enrollment_fee,
                "due_date": due_date,
            }
        )

    if billing_method == "full" or plan.billing_period == "one_time":
        schedule.append(
            {
                "description": f"Pagamento do plano - {plan.name}",
                "amount": total,
                "due_date": due_date,
            }
        )
        return schedule

    installment_count = get_installment_count(plan)
    cycle_months = get_billing_cycle_months(plan) or 1
    installment_value = (total / Decimal(installment_count)).quantize(
        Decimal("0.01"),
        rounding=ROUND_DOWN,
    )
    accumulated = Decimal("0.00")

    for installment in range(1, installment_count + 1):
        amount = (
            total - accumulated
            if installment == installment_count
            else installment_value
        )
        description = (
            f"Mensalidade - {plan.name}"
            if installment_count == 1
            else f"Parcela {installment}/{installment_count} - {plan.name}"
        )
        schedule.append(
            {
                "description": description,
                "amount": amount,
                "due_date": add_months(
                    due_date,
                    (installment - 1) * cycle_months,
                ),
            }
        )
        accumulated += amount

    return schedule


def create_enrollment_charges(enrollment):
    return [
        Charge.objects.create(
            enrollment=enrollment,
            description=item["description"],
            amount=item["amount"],
            due_date=item["due_date"],
            competence_date=item["due_date"],
            status=Charge.Status.PENDING,
        )
        for item in build_charge_schedule(
            enrollment.plan,
            enrollment.contracted_price,
            enrollment.due_date,
            enrollment.billing_method,
        )
    ]


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
        plan__recurring=True,
        plan__auto_renew=True,
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

        cycle_months = get_billing_cycle_months(enrollment.plan)

        if not cycle_months:
            continue

        next_due_date = add_months(
            last_charge.due_date,
            cycle_months,
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

        recurring_amount = (
            enrollment.contracted_price
            / Decimal(get_installment_count(enrollment.plan))
        ).quantize(
            Decimal("0.01"),
            rounding=ROUND_DOWN,
        )

        charge = Charge.objects.create(
            enrollment=enrollment,
            description=(f"Mensalidade - {enrollment.plan.name}"),
            amount=recurring_amount,
            due_date=next_due_date,
            competence_date=next_due_date,
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
