from rest_framework.routers import DefaultRouter

from apps.checkins.api.viewsets import CheckInViewSet


router = DefaultRouter()

router.register(
    "",
    CheckInViewSet,
    basename="checkin",
)


urlpatterns = router.urls
