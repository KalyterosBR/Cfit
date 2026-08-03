from apps.academy.repositories import academy_repository


def execute():
    return academy_repository.list()
