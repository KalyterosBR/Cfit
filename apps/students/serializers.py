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

    class Meta:
        model = Student
        fields = "__all__"

    def get_oldest_real_overdue_charge(self, student):
        """
        Retorna a cobrança atrasada mais antiga que
        realmente já venceu considerando a data atual.

        Isso evita que testes com datas futuras
        contaminem a situação financeira atual.
        """

        today = timezone.localdate()

        return (
            Charge.objects.filter(
                enrollment__student=student,
                status=Charge.Status.OVERDUE,
                due_date__lt=today,
            )
            .order_by("due_date")
            .first()
        )

    def get_is_defaulting(self, student):
        today = timezone.localdate()

        oldest_overdue = self.get_oldest_real_overdue_charge(
            student,
        )

        if not oldest_overdue:
            return False

        defaulting_date = oldest_overdue.due_date + timedelta(
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

        oldest_overdue = self.get_oldest_real_overdue_charge(
            student,
        )

        if not oldest_overdue:
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

        oldest_overdue = self.get_oldest_real_overdue_charge(
            student,
        )

        if not oldest_overdue:
            return None

        defaulting_date = oldest_overdue.due_date + timedelta(
            days=PAYMENT_GRACE_PERIOD_DAYS + 1,
        )

        if today >= defaulting_date:
            return 0

        return (defaulting_date - today).days
