from apps.enrollments.models import Enrollment


def get_student_enrollments(student_id):
    return (
        Enrollment.objects.filter(student_id=student_id)
        .select_related("student", "plan")
        .order_by("-start_date")
    )
