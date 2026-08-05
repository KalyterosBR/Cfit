from rest_framework.routers import DefaultRouter

from apps.{{ module_name }}.api.viewsets import {{ class_name }}ViewSet

router = DefaultRouter()
router.register("", {{ class_name }}ViewSet, basename="{{ module_name }}")

urlpatterns = router.urls