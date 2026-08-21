from django.contrib import admin

from apps.workouts.models import Exercise, WorkoutPlan, WorkoutProgress, WorkoutTemplate


admin.site.register([Exercise, WorkoutTemplate, WorkoutPlan, WorkoutProgress])
