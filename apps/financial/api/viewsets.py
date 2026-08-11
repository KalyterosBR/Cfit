from django.db import transaction
from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.financial.api.serializers import ChargeSerializer
from apps.financial.models import Charge


class ChargeViewSet(viewsets.ModelViewSet):
    queryset = Charge.objects.select_related(
        "enrollment",
        "enrollment__student",
        "enrollment__plan",
    ).all()

    serializer_class = ChargeSerializer

    # ==========================================
    # FILTROS
    # ==========================================

    def get_queryset(self):
        queryset = super().get_queryset()

        student_id = self.request.query_params.get("student")

        if student_id:
            queryset = queryset.filter(
                enrollment__student_id=student_id,
            )

        return queryset

    # ==========================================
    # REGISTRAR PAGAMENTO
    # ==========================================

    @action(
        detail=True,
        methods=["post"],
        url_path="pay",
    )
    @transaction.atomic
    def pay(
        self,
        request,
        pk=None,
    ):
        charge = self.get_object()

        if charge.status == Charge.Status.PAID:
            return Response(
                {
                    "detail": "Esta cobrança já está paga.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if charge.status == Charge.Status.CANCELED:
            return Response(
                {
                    "detail": (
                        "Uma cobrança cancelada não pode ser marcada como paga."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        charge.status = Charge.Status.PAID
        charge.paid_at = timezone.now()

        charge.save(
            update_fields=[
                "status",
                "paid_at",
                "updated_at",
            ]
        )

        serializer = self.get_serializer(charge)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    # ==========================================
    # CANCELAR COBRANÇA
    # ==========================================

    @action(
        detail=True,
        methods=["post"],
        url_path="cancel",
    )
    @transaction.atomic
    def cancel(
        self,
        request,
        pk=None,
    ):
        charge = self.get_object()

        if charge.status == Charge.Status.PAID:
            return Response(
                {
                    "detail": ("Uma cobrança paga não pode ser cancelada."),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if charge.status == Charge.Status.CANCELED:
            return Response(
                {
                    "detail": "Esta cobrança já está cancelada.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        charge.status = Charge.Status.CANCELED

        charge.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        serializer = self.get_serializer(charge)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )
