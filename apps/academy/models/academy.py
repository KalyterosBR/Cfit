from django.db import models

from apps.core.base.models import BaseModel


class Academy(BaseModel):
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
