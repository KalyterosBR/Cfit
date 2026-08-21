from rest_framework import filters, viewsets

from apps.workouts.api.serializers import (
    ExerciseSerializer,
    WorkoutExerciseSerializer,
    WorkoutPlanSerializer,
    WorkoutProgressSerializer,
    WorkoutTemplateSerializer,
)
from apps.workouts.models import Exercise, WorkoutExercise, WorkoutPlan, WorkoutProgress, WorkoutTemplate


class ExerciseViewSet(viewsets.ModelViewSet):
    serializer_class = ExerciseSerializer
    queryset = Exercise.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "muscle_group"]
    ordering = ["name"]


class WorkoutTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutTemplateSerializer
    queryset = WorkoutTemplate.objects.all()
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "objective"]


class WorkoutPlanViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutPlanSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "objective", "student__name", "instructor__email"]
    ordering = ["-start_date"]

    def get_queryset(self):
        queryset = WorkoutPlan.objects.select_related(
            "student", "instructor", "template"
        ).prefetch_related("workout_exercises__exercise", "progress_records")
        student = self.request.query_params.get("student")
        status_value = self.request.query_params.get("status")
        if student:
            queryset = queryset.filter(student_id=student)
        if status_value in WorkoutPlan.Status.values:
            queryset = queryset.filter(status=status_value)
        return queryset

    def perform_create(self, serializer):
        serializer.save(
            instructor=serializer.validated_data.get("instructor", self.request.user)
        )


class WorkoutExerciseViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutExerciseSerializer
    queryset = WorkoutExercise.objects.select_related("exercise", "workout")


class WorkoutProgressViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutProgressSerializer
    queryset = WorkoutProgress.objects.select_related("workout", "created_by")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
