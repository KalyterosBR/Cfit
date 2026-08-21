from rest_framework.routers import DefaultRouter
from apps.automations.api import AutomationExecutionViewSet, AutomationRuleViewSet

router = DefaultRouter()
router.register("rules", AutomationRuleViewSet, basename="automation-rule")
router.register("executions", AutomationExecutionViewSet, basename="automation-execution")
urlpatterns = router.urls
