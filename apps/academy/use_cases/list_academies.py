from apps.academy.models import Academy


def list_academies():
    return Academy.objects.all()
