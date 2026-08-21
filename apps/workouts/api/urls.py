from rest_framework.routers import DefaultRouter

from apps.workouts.api.viewsets import (
    ExerciseViewSet,
    WorkoutExerciseViewSet,
    WorkoutPlanViewSet,
    WorkoutProgressViewSet,
    WorkoutTemplateViewSet,
)


router = DefaultRouter()
router.register("exercises", ExerciseViewSet, basename="exercise")
router.register("templates", WorkoutTemplateViewSet, basename="workout-template")
router.register("plans", WorkoutPlanViewSet, basename="workout-plan")
router.register("plan-exercises", WorkoutExerciseViewSet, basename="workout-exercise")
router.register("progress", WorkoutProgressViewSet, basename="workout-progress")
urlpatterns = router.urls
