import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Cria de forma idempotente o primeiro superusuário a partir do ambiente."

    def handle(self, *args, **options):
        email = os.getenv("DJANGO_BOOTSTRAP_SUPERUSER_EMAIL", "").strip().lower()
        password = os.getenv("DJANGO_BOOTSTRAP_SUPERUSER_PASSWORD", "")
        if not email and not password:
            self.stdout.write("Bootstrap administrativo não configurado.")
            return
        if not email or not password:
            raise CommandError("Informe e-mail e senha do bootstrap administrativo juntos.")
        if len(password) < 12:
            raise CommandError("A senha inicial deve possuir pelo menos 12 caracteres.")

        user_model = get_user_model()
        if user_model.objects.filter(email=email).exists():
            self.stdout.write("Administrador inicial já existe; nenhuma alteração realizada.")
            return
        user_model.objects.create_superuser(email=email, password=password)
        self.stdout.write(self.style.SUCCESS("Administrador inicial criado."))
