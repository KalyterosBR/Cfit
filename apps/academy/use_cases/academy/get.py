from apps.academy.repositories import academy_repository


def execute(academy_id):
    return academy_repository.get(academy_id)
