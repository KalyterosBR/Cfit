from apps.students.models import Student


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


def deactivate_student(student):
    student.active = False
    student.save(update_fields=["active", "updated_at"])

    return student


def activate_student(student):
    student.active = True
    student.save(update_fields=["active", "updated_at"])

    return student


def get_student(student_id):
    return Student.objects.get(id=student_id)


def list_students():
    return Student.objects.all()
