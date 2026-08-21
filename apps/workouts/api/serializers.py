from rest_framework import serializers

from apps.workouts.models import (
    Exercise,
    WorkoutExercise,
    WorkoutPlan,
    WorkoutProgress,
    WorkoutTemplate,
)


class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = "__all__"


class WorkoutTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkoutTemplate
        fields = "__all__"


class WorkoutExerciseSerializer(serializers.ModelSerializer):
    exercise_name = serializers.CharField(source="exercise.name", read_only=True)

    class Meta:
        model = WorkoutExercise
        fields = "__all__"


class WorkoutProgressSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.email", read_only=True)

    class Meta:
        model = WorkoutProgress
        fields = "__all__"
        read_only_fields = ["created_by"]


class WorkoutPlanSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.name", read_only=True)
    instructor_name = serializers.CharField(source="instructor.email", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    exercises = WorkoutExerciseSerializer(source="workout_exercises", many=True, read_only=True)
    progress = WorkoutProgressSerializer(source="progress_records", many=True, read_only=True)

    class Meta:
        model = WorkoutPlan
        fields = "__all__"
        extra_kwargs = {"instructor": {"required": False}}

    def validate(self, attrs):
        start = attrs.get("start_date", getattr(self.instance, "start_date", None))
        review = attrs.get("review_date", getattr(self.instance, "review_date", None))
        if start and review and review < start:
            raise serializers.ValidationError({"review_date": "A revisão não pode anteceder o início."})
        student = attrs.get("student", getattr(self.instance, "student", None))
        status_value = attrs.get("status", getattr(self.instance, "status", WorkoutPlan.Status.ACTIVE))
        active_plans = WorkoutPlan.objects.filter(
            student=student,
            status=WorkoutPlan.Status.ACTIVE,
        )
        if self.instance:
            active_plans = active_plans.exclude(pk=self.instance.pk)
        if student and status_value == WorkoutPlan.Status.ACTIVE and active_plans.exists():
            raise serializers.ValidationError(
                {"status": "O aluno já possui um treino ativo."}
            )
        return attrs
