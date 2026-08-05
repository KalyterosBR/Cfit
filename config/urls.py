from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    ##    path("api/", include("students.api_urls")),  ## legado
    path("api/academies/", include("apps.academy.api.urls")),
    path("api/students/", include("apps.students.api.router")),
]
