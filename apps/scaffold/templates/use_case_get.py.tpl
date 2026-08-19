from apps.{{ module_name }}.repositories import {{ variable_name }}_repository


def execute(object_id):
    return {{ variable_name }}_repository.get(id=object_id)