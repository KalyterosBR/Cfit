from django.db import models

from apps.core.base.models import BaseModel


class {{ class_name }}(BaseModel):
    name = models.CharField(
        max_length=150,
    )

    def __str__(self):
        return self.name