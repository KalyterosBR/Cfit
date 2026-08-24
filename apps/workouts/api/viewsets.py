from django.db.models import Q
from django.utils import timezone
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.workouts.api.serializers import (
    ExerciseSerializer,
    WorkoutExerciseSerializer,
    WorkoutPlanSerializer,
    WorkoutProgressSerializer,
    WorkoutTemplateSerializer,
    WorkoutTemplateExerciseSerializer,
    WorkoutSessionSerializer,
)
from apps.workouts.models import Exercise, WorkoutExercise, WorkoutPlan, WorkoutProgress, WorkoutTemplate, WorkoutTemplateExercise, WorkoutSession
from apps.users.permissions import HasCapability, get_active_membership


class WorkoutPermissionMixin:
    permission_classes = [HasCapability]
    required_capability = "workouts.manage"

    def active_unit(self):
        membership = get_active_membership(self.request.user)
        return membership.active_unit if membership else None


class ExerciseViewSet(WorkoutPermissionMixin, viewsets.ModelViewSet):
    serializer_class = ExerciseSerializer
    queryset = Exercise.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "muscle_group"]
    ordering = ["name"]

    def get_queryset(self):
        unit = self.active_unit()
        return Exercise.objects.filter(Q(unit=unit) | Q(unit__isnull=True)) if unit else Exercise.objects.all()

    def perform_create(self, serializer):
        serializer.save(unit=self.active_unit())


class WorkoutTemplateViewSet(WorkoutPermissionMixin, viewsets.ModelViewSet):
    serializer_class = WorkoutTemplateSerializer
    queryset = WorkoutTemplate.objects.all()
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "objective"]

    def get_queryset(self):
        unit = self.active_unit()
        queryset = WorkoutTemplate.objects.prefetch_related("template_exercises__exercise")
        return queryset.filter(Q(unit=unit) | Q(unit__isnull=True)) if unit else queryset

    def perform_create(self, serializer):
        serializer.save(unit=self.active_unit())


class WorkoutPlanViewSet(WorkoutPermissionMixin, viewsets.ModelViewSet):
    serializer_class = WorkoutPlanSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "objective", "student__name", "instructor__email"]
    ordering = ["-start_date"]

    def get_queryset(self):
        queryset = WorkoutPlan.objects.select_related(
            "student", "instructor", "template"
        ).prefetch_related("workout_exercises__exercise", "progress_records", "sessions")
        student = self.request.query_params.get("student")
        status_value = self.request.query_params.get("status")
        if student:
            queryset = queryset.filter(student_id=student)
        if status_value in WorkoutPlan.Status.values:
            queryset = queryset.filter(status=status_value)
        unit = self.request.query_params.get("unit")
        active_unit = self.active_unit()
        if unit:
            membership = get_active_membership(self.request.user)
            if membership:
                queryset = queryset.filter(unit_id=unit, unit__academy=membership.academy)
            else:
                queryset = queryset.filter(unit_id=unit)
        elif active_unit:
            queryset = queryset.filter(unit=active_unit)
        return queryset

    def perform_create(self, serializer):
        membership = get_active_membership(self.request.user)
        requested_unit = serializer.validated_data.get("unit")
        if membership and requested_unit and requested_unit.academy_id != membership.academy_id:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"unit": "Selecione uma unidade da sua academia."})
        serializer.save(
            instructor=serializer.validated_data.get("instructor", self.request.user),
            unit=serializer.validated_data.get("unit", self.active_unit()),
        )

    @action(detail=True, methods=["post"], url_path="apply-template")
    def apply_template(self, request, pk=None):
        workout = self.get_object()
        template = WorkoutTemplate.objects.prefetch_related("template_exercises").filter(pk=request.data.get("template")).first()
        if not template:
            return Response({"template": ["Modelo não encontrado."]}, status=status.HTTP_400_BAD_REQUEST)
        created = 0
        for item in template.template_exercises.all():
            _, was_created = WorkoutExercise.objects.get_or_create(
                workout=workout, exercise=item.exercise,
                defaults={"sets": item.sets, "repetitions": item.repetitions, "load": item.load, "rest_seconds": item.rest_seconds, "order": item.order, "notes": item.notes},
            )
            created += was_created
        workout.template = template
        workout.save(update_fields=["template", "updated_at"])
        workout = self.get_queryset().get(pk=workout.pk)
        return Response({"created": created, "workout": self.get_serializer(workout).data})


class WorkoutExerciseViewSet(WorkoutPermissionMixin, viewsets.ModelViewSet):
    serializer_class = WorkoutExerciseSerializer

    def get_queryset(self):
        queryset = WorkoutExercise.objects.select_related("exercise", "workout")
        unit = self.active_unit()
        return queryset.filter(workout__unit=unit) if unit else queryset


class WorkoutProgressViewSet(WorkoutPermissionMixin, viewsets.ModelViewSet):
    serializer_class = WorkoutProgressSerializer
    def get_queryset(self):
        queryset = WorkoutProgress.objects.select_related("workout", "created_by")
        unit = self.active_unit()
        return queryset.filter(workout__unit=unit) if unit else queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class WorkoutTemplateExerciseViewSet(WorkoutPermissionMixin, viewsets.ModelViewSet):
    serializer_class = WorkoutTemplateExerciseSerializer
    def get_queryset(self):
        queryset = WorkoutTemplateExercise.objects.select_related("template", "exercise")
        unit = self.active_unit()
        return queryset.filter(template__unit=unit) if unit else queryset


class WorkoutSessionViewSet(WorkoutPermissionMixin, viewsets.ModelViewSet):
    serializer_class = WorkoutSessionSerializer

    def get_queryset(self):
        queryset = WorkoutSession.objects.select_related("workout", "recorded_by")
        unit = self.active_unit()
        if unit:
            queryset = queryset.filter(workout__unit=unit)
        workout = self.request.query_params.get("workout")
        return queryset.filter(workout_id=workout) if workout else queryset

    def perform_create(self, serializer):
        completed_at = timezone.now() if serializer.validated_data.get("status") == WorkoutSession.Status.COMPLETED else None
        serializer.save(recorded_by=self.request.user, completed_at=completed_at)

    def perform_update(self, serializer):
        status_value = serializer.validated_data.get("status", serializer.instance.status)
        serializer.save(completed_at=timezone.now() if status_value == WorkoutSession.Status.COMPLETED else None)
