from rest_framework.routers import DefaultRouter

from apps.enrollments.api.viewsets import EnrollmentViewSet


router = DefaultRouter()

router.register(
    "",
    EnrollmentViewSet,
    basename="enrollment",
)

urlpatterns = router.urls
