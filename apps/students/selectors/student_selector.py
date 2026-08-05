from django.db.models import Q

from apps.students.models import Student


def search_students(search=None):
    queryset = Student.objects.filter(active=True)

    if search:
        queryset = queryset.filter(Q(name__icontains=search) | Q(cpf__icontains=search))

    return queryset
