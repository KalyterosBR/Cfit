from django.conf import settings
from django.db import models

from apps.core.base.models import BaseModel


class Exercise(BaseModel):
    unit = models.ForeignKey("academy.Unit", on_delete=models.PROTECT, null=True, blank=True, related_name="exercises")
    name = models.CharField(max_length=120)
    muscle_group = models.CharField(max_length=80, blank=True)
    instructions = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class WorkoutTemplate(BaseModel):
    unit = models.ForeignKey("academy.Unit", on_delete=models.PROTECT, null=True, blank=True, related_name="workout_templates")
    name = models.CharField(max_length=120)
    objective = models.CharField(max_length=120, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class WorkoutPlan(BaseModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Ativo"
        COMPLETED = "completed", "Concluído"
        CANCELED = "canceled", "Cancelado"

    student = models.ForeignKey(
        "students.Student",
        on_delete=models.PROTECT,
        related_name="workout_plans",
    )
    unit = models.ForeignKey("academy.Unit", on_delete=models.PROTECT, null=True, blank=True, related_name="workout_plans")
    template = models.ForeignKey(
        WorkoutTemplate,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="plans",
    )
    name = models.CharField(max_length=120)
    objective = models.CharField(max_length=120)
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="assigned_workout_plans",
    )
    start_date = models.DateField()
    review_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-start_date", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["student"],
                condition=models.Q(status="active"),
                name="unique_active_workout_per_student",
            ),
        ]

    def __str__(self):
        return f"{self.student} - {self.name}"


class WorkoutExercise(BaseModel):
    workout = models.ForeignKey(
        WorkoutPlan,
        on_delete=models.PROTECT,
        related_name="workout_exercises",
    )
    exercise = models.ForeignKey(
        Exercise,
        on_delete=models.PROTECT,
        related_name="workout_exercises",
    )
    sets = models.PositiveSmallIntegerField(default=3)
    repetitions = models.CharField(max_length=40, default="10")
    load = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    rest_seconds = models.PositiveSmallIntegerField(default=60)
    order = models.PositiveSmallIntegerField(default=1)
    notes = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["order", "created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["workout", "exercise"],
                name="unique_exercise_per_workout",
            ),
        ]


class WorkoutProgress(BaseModel):
    workout = models.ForeignKey(
        WorkoutPlan,
        on_delete=models.PROTECT,
        related_name="progress_records",
    )
    recorded_at = models.DateField()
    adherence_percentage = models.PositiveSmallIntegerField()
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="workout_progress_records",
    )

    class Meta:
        ordering = ["-recorded_at", "-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(adherence_percentage__lte=100),
                name="workout_adherence_lte_100",
            ),
        ]


class WorkoutTemplateExercise(BaseModel):
    template = models.ForeignKey(WorkoutTemplate, on_delete=models.PROTECT, related_name="template_exercises")
    exercise = models.ForeignKey(Exercise, on_delete=models.PROTECT, related_name="template_exercises")
    sets = models.PositiveSmallIntegerField(default=3)
    repetitions = models.CharField(max_length=40, default="10")
    load = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    rest_seconds = models.PositiveSmallIntegerField(default=60)
    order = models.PositiveSmallIntegerField(default=1)
    notes = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["order", "created_at"]
        constraints = [models.UniqueConstraint(fields=["template", "exercise"], name="unique_exercise_per_template")]


class WorkoutSession(BaseModel):
    class Status(models.TextChoices):
        PLANNED = "planned", "Planejada"
        COMPLETED = "completed", "Realizada"
        SKIPPED = "skipped", "Não realizada"

    workout = models.ForeignKey(WorkoutPlan, on_delete=models.PROTECT, related_name="sessions")
    scheduled_for = models.DateField(db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNED)
    duration_minutes = models.PositiveSmallIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="recorded_workout_sessions")

    class Meta:
        ordering = ["-scheduled_for", "-created_at"]
        constraints = [models.UniqueConstraint(fields=["workout", "scheduled_for"], name="unique_workout_session_date")]
