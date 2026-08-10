from django.db import models

from apps.academy.models import Academy
from apps.core.base.models import BaseModel
from apps.users.models.user import User


class AcademyUser(BaseModel):
    class Role(models.TextChoices):
        OWNER = "OWNER", "Proprietário"
        ADMIN = "ADMIN", "Administrador"
        MANAGER = "MANAGER", "Gerente"
        RECEPTION = "RECEPTION", "Recepção"
        TRAINER = "TRAINER", "Professor"
        FINANCIAL = "FINANCIAL", "Financeiro"

    academy = models.ForeignKey(
        Academy,
        on_delete=models.CASCADE,
        related_name="academy_users",
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="academy_users",
    )

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.RECEPTION,
    )

    active = models.BooleanField(
        default=True,
    )

    joined_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["academy", "user"],
                name="unique_academy_user",
            ),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.academy.name}"
