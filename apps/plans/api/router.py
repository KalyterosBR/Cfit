from rest_framework.routers import DefaultRouter

from apps.plans.api.viewsets import PlanViewSet

router = DefaultRouter()
router.register("", PlanViewSet, basename="plans")

urlpatterns = router.urls