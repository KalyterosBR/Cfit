from django.db import models


class MonthlyActiveStudentGoal(models.Model):
    academy = models.ForeignKey(
        "academy.Academy",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="monthly_active_student_goals",
    )
    period = models.DateField()
    target_count = models.PositiveIntegerField()
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.PROTECT,
        related_name="created_active_student_goals",
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.PROTECT,
        related_name="updated_active_student_goals",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-period"]
        constraints = [
            models.UniqueConstraint(
                fields=["academy", "period"],
                name="unique_active_goal_per_academy_period",
            ),
            models.UniqueConstraint(
                fields=["period"],
                condition=models.Q(academy__isnull=True),
                name="unique_global_active_goal_period",
            ),
            models.CheckConstraint(
                condition=models.Q(target_count__gt=0),
                name="active_goal_target_count_positive",
            ),
        ]
