from django.contrib import admin

from apps.students.models import Student, StudentStatusHistory


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "active", "created_at")
    search_fields = ("name",)
    list_filter = ("active",)


@admin.register(StudentStatusHistory)
class StudentStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ("student", "event_type", "actor", "created_at")
    list_filter = ("event_type",)
    search_fields = ("student__name", "actor__email", "reason")
    readonly_fields = (
        "student",
        "event_type",
        "reason",
        "actor",
        "created_at",
    )
