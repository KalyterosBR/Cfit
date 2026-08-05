from django.db import models

from apps.core.base.models import BaseModel


class Supplier(BaseModel):
    name = models.CharField(
        max_length=150,
    )

    def __str__(self):
        return self.name