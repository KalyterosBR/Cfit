from apps.academy.repositories import academy_repository


def execute(academy, data):
    return academy_repository.update(academy, data)
