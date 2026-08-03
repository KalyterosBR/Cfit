from apps.academy.repositories import academy_repository


def execute(academy):
    academy_repository.delete(academy)
