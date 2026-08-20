import uuid

from django.conf import settings
from django.db import models

from apps.students.models.student import Student


class StudentStatusHistory(models.Model):
    class EventType(models.TextChoices):
        DEACTIVATED = "deactivated", "Aluno inativado"
        REACTIVATED = "reactivated", "Aluno reativado"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    student = models.ForeignKey(
        Student,
        on_delete=models.PROTECT,
        related_name="status_history",
    )
    event_type = models.CharField(
        max_length=20,
        choices=EventType.choices,
    )
    reason = models.TextField(blank=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="student_status_changes",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Histórico de status do aluno"
        verbose_name_plural = "Históricos de status dos alunos"

    def __str__(self):
        return f"{self.student.name} - {self.get_event_type_display()}"
