from rest_framework.routers import DefaultRouter

from apps.workouts.api.viewsets import (
    ExerciseViewSet,
    WorkoutExerciseViewSet,
    WorkoutPlanViewSet,
    WorkoutProgressViewSet,
    WorkoutTemplateViewSet,
    WorkoutTemplateExerciseViewSet,
    WorkoutSessionViewSet,
)


router = DefaultRouter()
router.register("exercises", ExerciseViewSet, basename="exercise")
router.register("templates", WorkoutTemplateViewSet, basename="workout-template")
router.register("plans", WorkoutPlanViewSet, basename="workout-plan")
router.register("plan-exercises", WorkoutExerciseViewSet, basename="workout-exercise")
router.register("progress", WorkoutProgressViewSet, basename="workout-progress")
router.register("template-exercises", WorkoutTemplateExerciseViewSet, basename="workout-template-exercise")
router.register("sessions", WorkoutSessionViewSet, basename="workout-session")
urlpatterns = router.urls
