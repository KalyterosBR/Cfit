from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.academy.api.views import academy_list, academy_onboarding, operational_settings
from apps.academy.api.viewsets import UnitViewSet

urlpatterns = [
    path("", academy_list),
    path("settings/", operational_settings),
    path("onboarding/", academy_onboarding),
]

router = DefaultRouter()
router.register("units", UnitViewSet, basename="unit")
urlpatterns += [path("", include(router.urls))]
