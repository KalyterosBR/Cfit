from django.contrib import admin
from django.urls import include, path

from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

from apps.users.api.viewsets import (
    TurnstileTokenObtainPairView,
)


urlpatterns = [
    path(
        "admin/",
        admin.site.urls,
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
    # API - Check-ins
    path(
        "api/checkins/",
        include("apps.checkins.api.urls"),
    ),
    path(
        "api/workouts/",
        include("apps.workouts.api.urls"),
    ),
    # Autenticação
    path(
        "api/auth/login/",
        TurnstileTokenObtainPairView.as_view(),
    ),
    path(
        "api/auth/refresh/",
        TokenRefreshView.as_view(),
    ),
]
