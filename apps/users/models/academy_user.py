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

    active_unit = models.ForeignKey(
        "academy.Unit",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="active_users",
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


class AdministrativeAudit(BaseModel):
    academy = models.ForeignKey(
        Academy,
        on_delete=models.PROTECT,
        related_name="administrative_audits",
        null=True,
        blank=True,
    )

    actor = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="administrative_audits",
    )
    action = models.CharField(max_length=80)
    entity_type = models.CharField(max_length=80)
    entity_id = models.CharField(max_length=64, blank=True)
    previous_state = models.JSONField(default=dict, blank=True)
    new_state = models.JSONField(default=dict, blank=True)
    reason = models.CharField(max_length=255, blank=True)
    origin = models.CharField(max_length=40, default="web")

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["academy", "-created_at"])]


class DashboardPreference(BaseModel):
    academy = models.ForeignKey(Academy, on_delete=models.CASCADE, related_name="dashboard_preferences")
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name="dashboard_preferences")
    role = models.CharField(max_length=20, choices=AcademyUser.Role.choices, blank=True)
    unit = models.ForeignKey("academy.Unit", on_delete=models.CASCADE, null=True, blank=True, related_name="dashboard_preferences")
    hidden_sections = models.JSONField(default=list, blank=True)
    section_order = models.JSONField(default=list, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["academy", "user"], condition=models.Q(user__isnull=False), name="unique_user_dashboard_preference"),
            models.UniqueConstraint(fields=["academy", "role", "unit"], condition=models.Q(user__isnull=True), name="unique_scope_dashboard_preference"),
        ]


class SavedReportView(BaseModel):
    class Scope(models.TextChoices):
        PERSONAL = "personal", "Pessoal"
        UNIT = "unit", "Unidade"
        ACADEMY = "academy", "Academia"

    academy = models.ForeignKey(Academy, on_delete=models.CASCADE, related_name="saved_report_views")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="saved_report_views")
    unit = models.ForeignKey("academy.Unit", on_delete=models.CASCADE, null=True, blank=True, related_name="saved_report_views")
    name = models.CharField(max_length=120)
    period = models.CharField(max_length=7)
    favorite_questions = models.JSONField(default=list, blank=True)
    is_default = models.BooleanField(default=False)
    scope = models.CharField(max_length=12, choices=Scope.choices, default=Scope.PERSONAL)

    class Meta:
        ordering = ["name"]


class OperationalNotificationState(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notification_states")
    notification_key = models.CharField(max_length=80)
    read_at = models.DateTimeField(null=True, blank=True)
    archived_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "notification_key"], name="unique_user_notification_state")]
