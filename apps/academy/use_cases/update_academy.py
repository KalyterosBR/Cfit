from apps.academy.models import Academy


def update_academy(academy, data):
    for key, value in data.items():
        setattr(academy, key, value)

    academy.save()

    return academy
