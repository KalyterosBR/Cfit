from rest_framework.routers import DefaultRouter

from apps.financial.api.viewsets import ChargeViewSet


router = DefaultRouter()

router.register(
    "charges",
    ChargeViewSet,
    basename="charge",
)


urlpatterns = router.urls
