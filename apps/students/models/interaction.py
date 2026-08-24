from django.db import models

from apps.core.base.models import BaseModel


class StudentInteraction(BaseModel):
    class Type(models.TextChoices):
        CALL = "call", "Ligação"
        WHATSAPP = "whatsapp", "WhatsApp"
        EMAIL = "email", "E-mail"
        NOTE = "note", "Observação"

    class Status(models.TextChoices):
        PENDING = "pending", "Pendente"
        COMPLETED = "completed", "Concluído"

    student = models.ForeignKey("students.Student", on_delete=models.PROTECT, related_name="interactions")
    interaction_type = models.CharField(max_length=20, choices=Type.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    notes = models.TextField()
    next_action = models.CharField(max_length=255, blank=True)
    next_contact_at = models.DateTimeField(null=True, blank=True)
    responsible = models.ForeignKey("users.User", on_delete=models.PROTECT, related_name="responsible_student_interactions")
    created_by = models.ForeignKey("users.User", on_delete=models.PROTECT, related_name="created_student_interactions")

    class Meta:
        ordering = ["-created_at"]
