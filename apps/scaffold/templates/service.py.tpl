from apps.{{ module_name }}.models import {{ class_name }}


def create_{{ variable_name }}(data):
    return {{ class_name }}.objects.create(**data)


def update_{{ variable_name }}({{ variable_name }}, data):
    for key, value in data.items():
        setattr({{ variable_name }}, key, value)

    {{ variable_name }}.save()

    return {{ variable_name }}


def delete_{{ variable_name }}({{ variable_name }}):
    {{ variable_name }}.delete()


def get_{{ variable_name }}({{ variable_name }}_id):
    return {{ class_name }}.objects.get(id={{ variable_name }}_id)


def list_{{ module_name }}():
    return {{ class_name }}.objects.all()