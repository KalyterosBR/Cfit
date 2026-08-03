from apps.academy.repositories import academy_repository


def execute(data):
    return academy_repository.create(data)
