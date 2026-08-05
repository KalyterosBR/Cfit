from rest_framework.routers import DefaultRouter

from apps.students.api.viewsets import StudentViewSet

router = DefaultRouter()

router.register(
    "",
    StudentViewSet,
    basename="students",
)

urlpatterns = router.urls
