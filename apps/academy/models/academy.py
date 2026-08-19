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
