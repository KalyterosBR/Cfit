from django.contrib import admin

from apps.{{ module_name }}.models import {{ class_name }}


@admin.register({{ class_name }})
class {{ class_name }}Admin(admin.ModelAdmin):
    list_display = ("id", "name", "active", "created_at")
    search_fields = ("name",)
    list_filter = ("active",)