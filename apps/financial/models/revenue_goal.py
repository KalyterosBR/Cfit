from django.db import models
from django.db.models import Q


class MonthlyRevenueGoal(models.Model):
    academy = models.ForeignKey(
        "academy.Academy",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="monthly_revenue_goals",
        verbose_name="Academia",
    )
    period = models.DateField(verbose_name="Competência")
    target_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Meta de receita",
    )
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.PROTECT,
        related_name="created_revenue_goals",
        verbose_name="Criada por",
    )
    updated_by = models.ForeignKey(
        "users.User",
        on_delete=models.PROTECT,
        related_name="updated_revenue_goals",
        verbose_name="Atualizada por",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-period"]
        verbose_name = "Meta mensal de receita"
        verbose_name_plural = "Metas mensais de receita"
        constraints = [
            models.UniqueConstraint(
                fields=["academy", "period"],
                name="unique_revenue_goal_per_academy_period",
            ),
            models.UniqueConstraint(
                fields=["period"],
                condition=Q(academy__isnull=True),
                name="unique_global_revenue_goal_period",
            ),
            models.CheckConstraint(
                condition=Q(target_amount__gt=0),
                name="revenue_goal_target_amount_positive",
            ),
        ]

    def __str__(self):
        return f"{self.period:%m/%Y} - {self.target_amount}"
