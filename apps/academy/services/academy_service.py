from apps.academy.models import Academy


def create_academy(data):
    return Academy.objects.create(**data)


def update_academy(academy, data):
    for key, value in data.items():
        setattr(academy, key, value)

    academy.save()

    return academy


def delete_academy(academy):
    academy.delete()


def get_academy(academy_id):
    return Academy.objects.get(id=academy_id)


def list_academies():
    return Academy.objects.all()
