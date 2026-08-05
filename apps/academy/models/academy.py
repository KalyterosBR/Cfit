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

    def __str__(self):
        return self.name
