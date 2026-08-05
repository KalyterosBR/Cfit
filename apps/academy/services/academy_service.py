from apps.academy.repositories import academy_repository


def create_academy(data):
    return academy_repository.create(data)


def update_academy(academy, data):
    return academy_repository.update(academy, data)


def delete_academy(academy):
    academy_repository.delete(academy)


def get_academy(academy_id):
    return academy_repository.get(academy_id)


def list_academies():
    return academy_repository.list()
