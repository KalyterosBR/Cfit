from apps.{{ module_name }}.repositories import {{ variable_name }}_repository


def execute(instance):
    {{ variable_name }}_repository.delete(instance)