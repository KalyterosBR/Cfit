from datetime import date

from django.core.management.base import BaseCommand

from apps.financial.services.billing import mark_overdue_charges


class Command(BaseCommand):
    help = "Marca cobranças pendentes vencidas como atrasadas."

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

        updated_count = mark_overdue_charges(
            reference_date=reference_date,
        )

        if reference_date:
            self.stdout.write(f"Data de referência: {reference_date}")

        if updated_count == 0:
            self.stdout.write(
                self.style.SUCCESS("Nenhuma cobrança vencida encontrada.")
            )
            return

        self.stdout.write(
            self.style.SUCCESS(
                f"{updated_count} cobrança(s) marcada(s) como atrasada(s)."
            )
        )
