from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.academy.api.views import academy_list
from apps.academy.api.viewsets import UnitViewSet

urlpatterns = [
    path("", academy_list),
]

router = DefaultRouter()
router.register("units", UnitViewSet, basename="unit")
urlpatterns += [path("", include(router.urls))]
