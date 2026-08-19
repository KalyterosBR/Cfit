from apps.{{ module_name }}.repositories import {{ variable_name }}_repository


def execute(instance, data):
    return {{ variable_name }}_repository.update(
        instance,
        **data,
    )