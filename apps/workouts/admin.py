from django.contrib import admin

from apps.workouts.models import (
    Exercise, WorkoutPlan, WorkoutProgress, WorkoutSession,
    WorkoutTemplate, WorkoutTemplateExercise,
)


admin.site.register([
    Exercise, WorkoutTemplate, WorkoutTemplateExercise,
    WorkoutPlan, WorkoutProgress, WorkoutSession,
])
