from django.db import models

from apps.core.base.models import BaseModel


class Academy(BaseModel):
    class EstablishmentType(models.TextChoices):
        GYM = "gym", "Academia"
        STUDIO = "studio", "Estúdio"
        CROSSFIT = "crossfit", "Cross training"
        FUNCTIONAL = "functional", "Treinamento funcional"
        MARTIAL_ARTS = "martial_arts", "Artes marciais"
        SWIMMING = "swimming", "Natação"
        CLUB = "club", "Clube ou centro esportivo"
        OTHER = "other", "Outro"

    class SizeRange(models.TextChoices):
        UP_TO_100 = "up_to_100", "Até 100 alunos"
        FROM_101_TO_300 = "101_300", "101 a 300 alunos"
        FROM_301_TO_700 = "301_700", "301 a 700 alunos"
        FROM_701_TO_1500 = "701_1500", "701 a 1.500 alunos"
        ABOVE_1500 = "above_1500", "Mais de 1.500 alunos"

    class PrimaryGoal(models.TextChoices):
        ORGANIZE = "organize", "Organizar a operação"
        GROW = "grow", "Atrair e converter mais alunos"
        RETAIN = "retain", "Aumentar retenção"
        FINANCE = "finance", "Melhorar o controle financeiro"
        ACCESS = "access", "Automatizar controle de acesso"

    name = models.CharField(
        max_length=150,
    )

    trade_name = models.CharField(
        max_length=150,
        blank=True,
    )

    cnpj = models.CharField(
        max_length=18,
        unique=True,
        null=True,
        blank=True,
    )

    phone = models.CharField(
        max_length=20,
        blank=True,
    )

    email = models.EmailField(
        blank=True,
    )

    establishment_type = models.CharField(max_length=30, choices=EstablishmentType.choices, blank=True)
    size_range = models.CharField(max_length=20, choices=SizeRange.choices, blank=True)
    primary_goal = models.CharField(max_length=30, choices=PrimaryGoal.choices, blank=True)
    onboarding_completed_at = models.DateTimeField(null=True, blank=True)

    logo = models.ImageField(
        upload_to="academies/logos/",
        null=True,
        blank=True,
    )

    active = models.BooleanField(
        default=True,
        db_index=True,
    )

    def __str__(self):
        return self.trade_name or self.name


class Unit(BaseModel):
    academy = models.ForeignKey(Academy, on_delete=models.PROTECT, related_name="units")
    name = models.CharField(max_length=120)
    code = models.SlugField(max_length=40)
    address = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=20, blank=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["academy", "code"], name="unique_unit_code_per_academy")
        ]

    def __str__(self):
        return f"{self.academy} · {self.name}"


class AcademyOperationalSettings(BaseModel):
    academy = models.OneToOneField(Academy, on_delete=models.PROTECT, related_name="operational_settings")
    payment_grace_days = models.PositiveSmallIntegerField(default=7)
    cancellation_reasons = models.TextField(blank=True)
    access_block_reasons = models.TextField(blank=True)
    opening_hours = models.JSONField(default=dict, blank=True)
    automations_enabled = models.BooleanField(default=True)

    def __str__(self):
        return f"Configurações · {self.academy}"
