from django.contrib import admin

from apps.checkins.models import CheckIn


@admin.register(CheckIn)
class CheckInAdmin(admin.ModelAdmin):
    list_display = [
        "student",
        "checked_in_at",
        "source",
    ]

    list_filter = [
        "source",
        "checked_in_at",
    ]

    search_fields = [
        "student__name",
        "student__cpf",
    ]
