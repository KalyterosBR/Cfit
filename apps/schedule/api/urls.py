from rest_framework.routers import DefaultRouter
from apps.schedule.api.viewsets import ScheduleEventViewSet

router = DefaultRouter()
router.register("events", ScheduleEventViewSet, basename="schedule-event")
urlpatterns = router.urls
