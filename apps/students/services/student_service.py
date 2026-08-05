from apps.students.models import Student


def create_student(data):
    return Student.objects.create(**data)


def update_student(student, data):
    for key, value in data.items():
        setattr(student, key, value)

    student.save()

    return student


def delete_student(student):
    student.delete()


def get_student(student_id):
    return Student.objects.get(id=student_id)


def list_students():
    return Student.objects.all()
