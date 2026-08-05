from django.urls import path

from apps.{{ module_name }}.api.views import {{ variable_name }}_list

urlpatterns = [
    path("", {{ variable_name }}_list),
]