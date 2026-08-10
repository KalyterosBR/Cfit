from django.contrib import admin

from apps.plans.models import Plan


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "active", "created_at")
    search_fields = ("name",)
    list_filter = ("active",)