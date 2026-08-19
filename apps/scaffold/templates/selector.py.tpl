from apps.{{ module_name }}.models import {{ class_name }}


def get_all_{{ module_name }}():
    return {{ class_name }}.objects.all()


def get_active_{{ module_name }}():
    return {{ class_name }}.objects.filter(active=True)