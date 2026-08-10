from django.db.models import Q

from apps.students.models import Student


def search_students(search=None):
    queryset = Student.objects.all()

    if search:
        search = search.lower()

        queryset = queryset.filter(
            Q(search_name__icontains=search) | Q(cpf__icontains=search)
        )

    return queryset.order_by("name")
