from django.contrib import admin
from django.urls import include, path

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


urlpatterns = [
    path(
        "admin/",
        admin.site.urls,
    ),
    # Página antiga de planos
    path(
        "plans/",
        include("apps.plans.urls"),
    ),
    # API - Academias
    path(
        "api/academies/",
        include("apps.academy.api.urls"),
    ),
    # API - Alunos
    path(
        "api/students/",
        include("apps.students.api.router"),
    ),
    # API - Planos
    path(
        "api/plans/",
        include("apps.plans.api.router"),
    ),
    # API - Matrículas
    path(
        "api/enrollments/",
        include("apps.enrollments.api.urls"),
    ),
    # API - Financeiro
    path(
        "api/financial/",
        include("apps.financial.api.urls"),
    ),
    # Autenticação
    path(
        "api/auth/login/",
        TokenObtainPairView.as_view(),
    ),
    path(
        "api/auth/refresh/",
        TokenRefreshView.as_view(),
    ),
]
