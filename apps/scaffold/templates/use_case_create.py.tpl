from apps.{{ module_name }}.repositories import {{ variable_name }}_repository


def execute(data):
    return {{ variable_name }}_repository.create(**data)