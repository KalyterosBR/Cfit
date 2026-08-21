from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers

from apps.financial.models import Charge
from apps.financial.services.billing import (
    PAYMENT_GRACE_PERIOD_DAYS,
)
from apps.students.models import Student


class StudentSerializer(serializers.ModelSerializer):
    is_defaulting = serializers.SerializerMethodField()
    financial_status = serializers.SerializerMethodField()
    grace_days_remaining = serializers.SerializerMethodField()
    current_plan_name = serializers.SerializerMethodField()
    next_due_date = serializers.SerializerMethodField()
    last_checkin_at = serializers.SerializerMethodField()
    checkins_last_30_days = serializers.SerializerMethodField()
    class Meta:
        model = Student
        fields = "__all__"
        extra_kwargs = {
            "cpf": {
                "required": True,
                "allow_null": False,
                "allow_blank": False,
            },
            "phone": {
                "required": True,
                "allow_null": False,
                "allow_blank": False,
            },
            "birth_date": {
                "required": True,
                "allow_null": False,
            },
        }

    def validate_cpf(self, value):
        digits = "".join(
            character for character in value if character.isdigit()
        )

        if len(digits) != 11:
            raise serializers.ValidationError("Informe um CPF com 11 dígitos.")

        return value

    def validate_phone(self, value):
        digits = "".join(
            character for character in value if character.isdigit()
        )

        if len(digits) not in {10, 11}:
            raise serializers.ValidationError(
                "Informe um telefone com DDD válido."
            )

        return value

    def validate_emergency_phone(self, value):
        return self.validate_phone(value)

    def validate_cep(self, value):
        if value:
            digits = "".join(
                character for character in value if character.isdigit()
            )

            if len(digits) != 8:
                raise serializers.ValidationError("Informe um CEP completo.")

        return value

    def validate_state(self, value):
        if value and (
            len(value) != 2
            or not value.isascii()
            or not value.isalpha()
        ):
            raise serializers.ValidationError("Informe uma UF válida.")

        return value.upper() if value else value

    def validate_birth_date(self, value):
        if value and value > timezone.localdate():
            raise serializers.ValidationError(
                "A data de nascimento não pode ser futura."
            )

        return value

    def get_current_plan_name(self, student):
        if hasattr(student, "current_plan_name"):
            return student.current_plan_name

        enrollment = (
            student.enrollments.filter(status="active")
            .select_related("plan")
            .order_by("due_date", "plan__name")
            .first()
        )

        return enrollment.plan.name if enrollment else None

    def get_next_due_date(self, student):
        if hasattr(student, "next_due_date"):
            return student.next_due_date

        return (
            Charge.objects.filter(
                enrollment__student=student,
                status__in=[
                    Charge.Status.PENDING,
                    Charge.Status.OVERDUE,
                ],
            )
            .order_by("due_date", "created_at")
            .values_list("due_date", flat=True)
            .first()
        )

    def get_last_checkin_at(self, student):
        if hasattr(student, "last_checkin_at"):
            return student.last_checkin_at

        return (
            student.checkins.order_by("-checked_in_at")
            .values_list("checked_in_at", flat=True)
            .first()
        )

    def get_checkins_last_30_days(self, student):
        if hasattr(student, "checkins_last_30_days"):
            return student.checkins_last_30_days

        return student.checkins.filter(
            checked_in_at__gte=timezone.now() - timedelta(days=30),
        ).count()
    def get_oldest_real_overdue_date(self, student):
        """
        Retorna a cobrança atrasada mais antiga que
        realmente já venceu considerando a data atual.

        Isso evita que testes com datas futuras
        contaminem a situação financeira atual.
        """

        today = timezone.localdate()

        if hasattr(student, "oldest_overdue_due_date"):
            return student.oldest_overdue_due_date

        return (
            Charge.objects.filter(
                enrollment__student=student,
                status=Charge.Status.OVERDUE,
                due_date__lt=today,
            )
            .order_by("due_date")
            .values_list("due_date", flat=True)
            .first()
        )

    def get_is_defaulting(self, student):
        today = timezone.localdate()

        oldest_overdue_date = self.get_oldest_real_overdue_date(
            student,
        )

        if not oldest_overdue_date:
            return False

        defaulting_date = oldest_overdue_date + timedelta(
            days=PAYMENT_GRACE_PERIOD_DAYS + 1,
        )

        return today >= defaulting_date

    def get_financial_status(self, student):
        """
        Retorna:
        - regular
        - grace_period
        - defaulting
        """

        oldest_overdue_date = self.get_oldest_real_overdue_date(
            student,
        )

        if not oldest_overdue_date:
            return "regular"

        if self.get_is_defaulting(student):
            return "defaulting"

        return "grace_period"

    def get_grace_days_remaining(self, student):
        """
        Retorna quantos dias faltam para o aluno
        se tornar inadimplente.

        None = não possui atraso real.
        0 = já está inadimplente.
        """

        today = timezone.localdate()

        oldest_overdue_date = self.get_oldest_real_overdue_date(
            student,
        )

        if not oldest_overdue_date:
            return None

        defaulting_date = oldest_overdue_date + timedelta(
            days=PAYMENT_GRACE_PERIOD_DAYS + 1,
        )

        if today >= defaulting_date:
            return 0

        return (defaulting_date - today).days


class ActiveStudentGoalQuerySerializer(serializers.Serializer):
    period = serializers.RegexField(regex=r"^\d{4}-(0[1-9]|1[0-2])$")


class ActiveStudentGoalInputSerializer(ActiveStudentGoalQuerySerializer):
    target_count = serializers.IntegerField(min_value=1)
