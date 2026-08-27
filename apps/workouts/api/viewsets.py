from datetime import timedelta

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
from apps.workouts.models import Exercise, WorkoutExercise, WorkoutLoadRecord, WorkoutPlan, WorkoutProgress, WorkoutTemplate, WorkoutTemplateExercise, WorkoutSession
from apps.users.models import AdministrativeAudit
from apps.users.permissions import HasCapability, get_active_membership


def audit_workout(request, action, entity_type, entity, previous=None, current=None, reason=""):
    membership = get_active_membership(request.user)
    AdministrativeAudit.objects.create(
        academy=membership.academy if membership else None,
        actor=request.user,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity.pk),
        previous_state=previous or {},
        new_state=current or {},
        reason=reason,
    )


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
        exercise = serializer.save(unit=self.active_unit())
        audit_workout(self.request, "workout.exercise_created", "exercise", exercise, current={"name": exercise.name, "muscle_group": exercise.muscle_group})


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
        template = serializer.save(unit=self.active_unit())
        audit_workout(self.request, "workout.template_created", "workout_template", template, current={"name": template.name, "objective": template.objective})


class WorkoutPlanViewSet(WorkoutPermissionMixin, viewsets.ModelViewSet):
    serializer_class = WorkoutPlanSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "objective", "student__name", "instructor__email"]
    ordering = ["-start_date"]

    def get_queryset(self):
        queryset = WorkoutPlan.objects.select_related(
            "student", "instructor", "template"
        ).prefetch_related("workout_exercises__exercise", "workout_exercises__load_history__recorded_by", "progress_records", "sessions")
        student = self.request.query_params.get("student")
        status_value = self.request.query_params.get("status")
        if student:
            queryset = queryset.filter(student_id=student)
        if status_value in WorkoutPlan.Status.values:
            queryset = queryset.filter(status=status_value)
        review = self.request.query_params.get("review")
        today = timezone.localdate()
        if review == "overdue":
            queryset = queryset.filter(status=WorkoutPlan.Status.ACTIVE, review_date__lt=today)
        elif review == "upcoming":
            queryset = queryset.filter(status=WorkoutPlan.Status.ACTIVE, review_date__gte=today, review_date__lte=today + timedelta(days=14))
        instructor = self.request.query_params.get("instructor")
        if instructor:
            queryset = queryset.filter(instructor_id=instructor)
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
        workout = serializer.save(
            instructor=serializer.validated_data.get("instructor", self.request.user),
            unit=serializer.validated_data.get("unit", self.active_unit()),
        )
        audit_workout(self.request, "workout.plan_created", "workout_plan", workout, current={"student": str(workout.student_id), "name": workout.name, "status": workout.status, "review_date": str(workout.review_date or "")})

    def perform_update(self, serializer):
        workout = serializer.instance
        previous = {"name": workout.name, "status": workout.status, "review_date": str(workout.review_date or ""), "instructor": str(workout.instructor_id)}
        updated = serializer.save()
        audit_workout(self.request, "workout.plan_updated", "workout_plan", updated, previous=previous, current={"name": updated.name, "status": updated.status, "review_date": str(updated.review_date or ""), "instructor": str(updated.instructor_id)})

    @action(detail=True, methods=["post"], url_path="apply-template")
    def apply_template(self, request, pk=None):
        workout = self.get_object()
        template = WorkoutTemplate.objects.prefetch_related("template_exercises").filter(pk=request.data.get("template")).first()
        if not template:
            return Response({"template": ["Modelo não encontrado."]}, status=status.HTTP_400_BAD_REQUEST)
        created = 0
        for item in template.template_exercises.all():
            prescribed, was_created = WorkoutExercise.objects.get_or_create(
                workout=workout, exercise=item.exercise,
                defaults={"sets": item.sets, "repetitions": item.repetitions, "load": item.load, "rest_seconds": item.rest_seconds, "order": item.order, "notes": item.notes},
            )
            if was_created:
                WorkoutLoadRecord.objects.create(workout_exercise=prescribed, load=prescribed.load, sets=prescribed.sets, repetitions=prescribed.repetitions, recorded_at=timezone.localdate(), recorded_by=request.user, notes="Carga inicial aplicada pelo modelo")
            created += was_created
        workout.template = template
        workout.save(update_fields=["template", "updated_at"])
        audit_workout(request, "workout.template_applied", "workout_plan", workout, current={"template": str(template.pk), "created_exercises": created})
        workout = self.get_queryset().get(pk=workout.pk)
        return Response({"created": created, "workout": self.get_serializer(workout).data})


class WorkoutExerciseViewSet(WorkoutPermissionMixin, viewsets.ModelViewSet):
    serializer_class = WorkoutExerciseSerializer

    def get_queryset(self):
        queryset = WorkoutExercise.objects.select_related("exercise", "workout").prefetch_related("load_history__recorded_by")
        unit = self.active_unit()
        return queryset.filter(workout__unit=unit) if unit else queryset

    def perform_create(self, serializer):
        item = serializer.save()
        WorkoutLoadRecord.objects.create(workout_exercise=item, load=item.load, sets=item.sets, repetitions=item.repetitions, recorded_at=timezone.localdate(), recorded_by=self.request.user, notes="Carga inicial da prescrição")
        audit_workout(self.request, "workout.exercise_prescribed", "workout_exercise", item, current={"workout": str(item.workout_id), "exercise": str(item.exercise_id), "load": str(item.load or ""), "sets": item.sets, "repetitions": item.repetitions})

    def perform_update(self, serializer):
        item = serializer.instance
        previous = {"load": str(item.load or ""), "sets": item.sets, "repetitions": item.repetitions, "order": item.order}
        updated = serializer.save()
        current = {"load": str(updated.load or ""), "sets": updated.sets, "repetitions": updated.repetitions, "order": updated.order}
        if previous != current:
            WorkoutLoadRecord.objects.create(workout_exercise=updated, load=updated.load, sets=updated.sets, repetitions=updated.repetitions, recorded_at=timezone.localdate(), recorded_by=self.request.user, notes=str(self.request.data.get("change_reason", "Atualização da prescrição"))[:255])
        audit_workout(self.request, "workout.exercise_updated", "workout_exercise", updated, previous=previous, current=current, reason=str(self.request.data.get("change_reason", ""))[:255])

    def perform_destroy(self, instance):
        audit_workout(self.request, "workout.exercise_removed", "workout_exercise", instance, previous={"workout": str(instance.workout_id), "exercise": str(instance.exercise_id), "load": str(instance.load or "")})
        instance.delete()


class WorkoutProgressViewSet(WorkoutPermissionMixin, viewsets.ModelViewSet):
    serializer_class = WorkoutProgressSerializer
    def get_queryset(self):
        queryset = WorkoutProgress.objects.select_related("workout", "created_by")
        unit = self.active_unit()
        return queryset.filter(workout__unit=unit) if unit else queryset

    def perform_create(self, serializer):
        progress = serializer.save(created_by=self.request.user)
        audit_workout(self.request, "workout.progress_recorded", "workout_progress", progress, current={"workout": str(progress.workout_id), "recorded_at": str(progress.recorded_at), "adherence_percentage": progress.adherence_percentage})


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
        session = serializer.save(recorded_by=self.request.user, completed_at=completed_at)
        audit_workout(self.request, "workout.session_recorded", "workout_session", session, current={"workout": str(session.workout_id), "scheduled_for": str(session.scheduled_for), "status": session.status, "duration_minutes": session.duration_minutes})

    def perform_update(self, serializer):
        status_value = serializer.validated_data.get("status", serializer.instance.status)
        previous = {"status": serializer.instance.status, "duration_minutes": serializer.instance.duration_minutes}
        session = serializer.save(completed_at=timezone.now() if status_value == WorkoutSession.Status.COMPLETED else None)
        audit_workout(self.request, "workout.session_updated", "workout_session", session, previous=previous, current={"status": session.status, "duration_minutes": session.duration_minutes})
