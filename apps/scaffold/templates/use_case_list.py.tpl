from apps.{{ module_name }}.repositories import {{ variable_name }}_repository


def execute():
    return {{ variable_name }}_repository.list()