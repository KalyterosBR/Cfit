import math
from decimal import Decimal
from datetime import timedelta

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import AdministrativeAudit
from apps.workouts.models import WorkoutPlan, WorkoutSession


class ExerciseResultSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    revision = serializers.DateTimeField()
    completed_sets = serializers.IntegerField(min_value=1, max_value=32767)
    load = serializers.DecimalField(max_digits=7, decimal_places=2, min_value=Decimal("0"), allow_null=True)


class CompletionSerializer(serializers.Serializer):
    submission_id = serializers.UUIDField()
    started_at = serializers.DateTimeField()
    ended_at = serializers.DateTimeField()
    exercises = ExerciseResultSerializer(many=True, allow_empty=False, max_length=100)


def session_data(session):
    return {
        "id": session.id, "scheduled_for": session.scheduled_for,
        "status": session.status, "completed_at": session.completed_at,
        "duration_minutes": session.duration_minutes, "exercises": session.exercise_results,
    }


class StudentWorkoutView(APIView):
    permission_classes = [IsAuthenticated]

    def student(self, request):
        student = getattr(request.user, "portal_student", None)
        if not request.user.is_student_portal or not student or not student.active:
            raise PermissionDenied("Acesso exclusivo do aluno ativo.")
        if request.user.must_change_password:
            raise PermissionDenied("Troque sua senha antes de iniciar o treino.")
        return student

    def get(self, request, workout_id):
        student = self.student(request)
        workout = get_object_or_404(WorkoutPlan, pk=workout_id, student=student)
        return Response({
            "id": workout.id, "name": workout.name, "objective": workout.objective,
            "status": workout.status,
            "exercises": [{
                "id": row.id, "revision": row.updated_at, "name": row.exercise.name, "instructions": row.exercise.instructions,
                "notes": row.notes, "sets": row.sets, "repetitions": row.repetitions,
                "load": str(row.load) if row.load is not None else None, "rest_seconds": row.rest_seconds,
            } for row in workout.workout_exercises.select_related("exercise").all()],
            "sessions": [session_data(item) for item in workout.sessions.filter(status="completed")[:20]],
        })

    @transaction.atomic
    def post(self, request, workout_id):
        student = self.student(request)
        workout = get_object_or_404(WorkoutPlan.objects.select_for_update(), pk=workout_id, student=student)
        serializer = CompletionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        existing = WorkoutSession.objects.filter(submission_id=values["submission_id"]).first()
        if existing:
            if existing.workout_id != workout.id or existing.recorded_by_id != request.user.id:
                raise ValidationError("Identificador de envio indisponível.")
            return Response(session_data(existing))
        if workout.status != WorkoutPlan.Status.ACTIVE:
            raise ValidationError("Este treino não está mais ativo.")
        now = timezone.now()
        started_at = values["started_at"]
        ended_at = values["ended_at"]
        if ended_at > now or started_at > ended_at or ended_at - started_at > timedelta(hours=24) or ended_at < now - timedelta(days=7):
            raise ValidationError({"started_at": "Inicie uma nova sessão de treino."})
        rows = list(workout.workout_exercises.select_related("exercise").select_for_update(of=("self",)))
        submitted = {item["id"]: item for item in values["exercises"]}
        if len(submitted) != len(values["exercises"]) or set(submitted) != {row.id for row in rows}:
            raise ValidationError({"exercises": "A ficha mudou ou os exercícios estão incompletos. Reabra o treino."})
        results = []
        for row in rows:
            item = submitted[row.id]
            if item["revision"] != row.updated_at:
                raise ValidationError({"exercises": "A ficha foi atualizada pela academia. Reabra o treino."})
            if item["completed_sets"] != row.sets:
                raise ValidationError({"exercises": "Conclua todas as séries da ficha antes de finalizar."})
            results.append({
                "id": str(row.id), "name": row.exercise.name, "sets": row.sets,
                "repetitions": row.repetitions,
                "load": str(item["load"]) if item["load"] is not None else None,
            })
        day = timezone.localdate(started_at)
        session = workout.sessions.filter(scheduled_for=day).first()
        if session and session.status == WorkoutSession.Status.COMPLETED:
            return Response({"detail": "Você já tem um treino concluído nesta data."}, status=409)
        if session is None:
            session = WorkoutSession(workout=workout, scheduled_for=day)
        session.status = WorkoutSession.Status.COMPLETED
        session.completed_at = ended_at
        session.duration_minutes = max(1, math.ceil((ended_at - started_at).total_seconds() / 60))
        session.recorded_by = request.user
        session.submission_id = values["submission_id"]
        session.exercise_results = results
        session.save()
        AdministrativeAudit.objects.create(
            academy=student.academy, actor=request.user, action="workout.student_session_completed",
            entity_type="workout_session", entity_id=str(session.id),
            new_state={"workout": str(workout.id), "status": session.status, "exercises": len(results)},
            origin="mobile",
        )
        return Response(session_data(session), status=201)
