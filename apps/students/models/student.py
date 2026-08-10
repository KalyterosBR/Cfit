from unidecode import unidecode

from django.db import models

from apps.core.base.models import BaseModel


class Student(BaseModel):
    name = models.CharField(
        max_length=100,
    )

    search_name = models.CharField(
        max_length=100,
        blank=True,
        default="",
        db_index=True,
    )

    cpf = models.CharField(
        max_length=14,
        unique=True,
        null=True,
        blank=True,
    )

    phone = models.CharField(
        max_length=20,
        null=True,
        blank=True,
    )

    identifier = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True,
    )

    birth_date = models.DateField(
        null=True,
        blank=True,
    )

    email = models.EmailField(
        null=True,
        blank=True,
    )

    cep = models.CharField(
        max_length=9,
        null=True,
        blank=True,
    )

    street = models.CharField(
        max_length=150,
        null=True,
        blank=True,
    )

    number = models.CharField(
        max_length=10,
        null=True,
        blank=True,
    )

    neighborhood = models.CharField(
        max_length=100,
        null=True,
        blank=True,
    )

    city = models.CharField(
        max_length=100,
        null=True,
        blank=True,
    )

    state = models.CharField(
        max_length=2,
        null=True,
        blank=True,
    )

    emergency_contact = models.CharField(
        max_length=100,
        null=True,
        blank=True,
    )

    emergency_phone = models.CharField(
        max_length=20,
        null=True,
        blank=True,
    )

    def save(self, *args, **kwargs):
        self.search_name = unidecode(self.name).lower()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
