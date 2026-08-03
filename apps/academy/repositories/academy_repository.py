from apps.academy.models import Academy


def list():
    return Academy.objects.all()


def get(academy_id):
    return Academy.objects.get(id=academy_id)


def create(data):
    return Academy.objects.create(**data)


def update(academy, data):
    for key, value in data.items():
        setattr(academy, key, value)

    academy.save()

    return academy


def delete(academy):
    academy.delete()
