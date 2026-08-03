from apps.academy.models import Academy


def create_academy(data):
    return Academy.objects.create(**data)
