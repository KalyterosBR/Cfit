from django.db import models

from apps.core.base.models import BaseModel


class Plan(BaseModel):
    name = models.CharField(
        max_length=150,
        verbose_name="Nome",
    )

    description = models.TextField(
        blank=True,
        verbose_name="Descrição",
    )

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Valor",
    )

    duration_months = models.PositiveSmallIntegerField(
        verbose_name="Duração (meses)",
    )

    def __str__(self):
        return self.name
