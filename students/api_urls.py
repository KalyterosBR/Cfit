from django.urls import path
from .api_views import students_list, student_detail, student_delete, student_update

urlpatterns = [
    path("students/", students_list),
    path("students/<int:student_id>/", student_detail),
    path("students/<int:student_id>/delete/", student_delete),
    path("students/<int:student_id>/update/", student_update),
]
