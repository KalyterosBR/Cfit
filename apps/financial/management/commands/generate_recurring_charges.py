from datetime import datetime

from django.core.management.base import (
    BaseCommand,
    CommandError,
)
from django.utils import timezone

from apps.financial.services.billing import (
    generate_recurring_charges,
)


class Command(BaseCommand):
    help = "Gera cobranças de planos mensais recorrentes."

    def add_arguments(self, parser):
        parser.add_argument(
            "--date",
            type=str,
            help=("Data de referência para testes no formato AAAA-MM-DD."),
        )

    def handle(self, *args, **options):
        date_string = options.get("date")

        if date_string:
            try:
                reference_date = datetime.strptime(
                    date_string,
                    "%Y-%m-%d",
                ).date()
            except ValueError:
                raise CommandError("Data inválida. Use o formato AAAA-MM-DD.")
        else:
            reference_date = timezone.localdate()

        charges = generate_recurring_charges(
            reference_date=reference_date,
        )

        self.stdout.write(f"Data de referência: {reference_date}")

        if not charges:
            self.stdout.write(
                self.style.SUCCESS("Nenhuma nova cobrança recorrente necessária.")
            )
            return

        self.stdout.write(
            self.style.SUCCESS(f"{len(charges)} cobrança(s) recorrente(s) criada(s).")
        )

        for charge in charges:
            self.stdout.write(
                (
                    f"- {charge.enrollment.student.name} | "
                    f"{charge.description} | "
                    f"Vencimento: {charge.due_date}"
                )
            )
