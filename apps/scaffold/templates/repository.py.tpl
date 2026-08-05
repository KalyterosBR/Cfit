from apps.{{ module_name }}.models import {{ class_name }}
from apps.core.base.repositories import BaseRepository


class {{ class_name }}Repository(BaseRepository):
    model = {{ class_name }}


{{ variable_name }}_repository = {{ class_name }}Repository()