from datetime import date

from django.core.management.base import BaseCommand

from apps.financial.services.billing import (
    generate_recurring_charges,
    mark_overdue_charges,
)


class Command(BaseCommand):
    help = "Executa as rotinas financeiras diárias."

    def add_arguments(self, parser):
        parser.add_argument(
            "--date",
            type=str,
            help="Data de referência no formato YYYY-MM-DD.",
        )

    def handle(self, *args, **options):
        reference_date = None

        if options["date"]:
            try:
                reference_date = date.fromisoformat(
                    options["date"],
                )
            except ValueError:
                self.stderr.write(
                    self.style.ERROR("Data inválida. Use o formato YYYY-MM-DD.")
                )
                return

        if reference_date:
            self.stdout.write(f"Data de referência: {reference_date}")

        # ======================================
        # 1. GERAR COBRANÇAS RECORRENTES
        # ======================================

        created_charges = generate_recurring_charges(
            reference_date=reference_date,
        )

        # ======================================
        # 2. ATUALIZAR COBRANÇAS ATRASADAS
        # ======================================

        overdue_count = mark_overdue_charges(
            reference_date=reference_date,
        )

        # ======================================
        # RESULTADO
        # ======================================

        self.stdout.write(
            self.style.SUCCESS(
                f"{len(created_charges)} cobrança(s) recorrente(s) criada(s)."
            )
        )

        for charge in created_charges:
            self.stdout.write(
                (
                    f"  - {charge.enrollment.student.name}"
                    f" | {charge.description}"
                    f" | Vencimento: {charge.due_date}"
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"{overdue_count} cobrança(s) marcada(s) como atrasada(s)."
            )
        )

        self.stdout.write(self.style.SUCCESS("Rotina financeira diária concluída."))
