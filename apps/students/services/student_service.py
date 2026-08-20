from django.db import transaction

from apps.students.models import Student, StudentStatusHistory


def create_student(data):
    data["active"] = True

    if not data.get("identifier"):
        data["identifier"] = None

    return Student.objects.create(**data)


def update_student(student, data):
    for key, value in data.items():
        setattr(student, key, value)

    student.save()

    return student


def delete_student(student):
    student.delete()


@transaction.atomic
def deactivate_student(student, reason, actor):
    if student.active:
        student.active = False
        student.save(update_fields=["active", "updated_at"])
        StudentStatusHistory.objects.create(
            student=student,
            event_type=StudentStatusHistory.EventType.DEACTIVATED,
            reason=reason,
            actor=actor,
        )

    return student


@transaction.atomic
def activate_student(student, actor):
    if not student.active:
        student.active = True
        student.save(update_fields=["active", "updated_at"])
        StudentStatusHistory.objects.create(
            student=student,
            event_type=StudentStatusHistory.EventType.REACTIVATED,
            actor=actor,
        )

    return student


def get_student(student_id):
    return Student.objects.get(id=student_id)


def list_students():
    return Student.objects.all()
