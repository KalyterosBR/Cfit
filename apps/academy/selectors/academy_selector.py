from apps.academy.models.academy import Academy


def get_all_academies():
    return Academy.objects.all()


def get_active_academies():
    return Academy.objects.filter(active=True)
