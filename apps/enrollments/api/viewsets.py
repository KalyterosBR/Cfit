from django.db import transaction
from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.enrollments.api.freeze_serializers import (
    EnrollmentFreezeSerializer,
)
from apps.enrollments.api.history_serializers import (
    EnrollmentHistorySerializer,
)
from apps.enrollments.api.serializers import (
    EnrollmentChargePreviewSerializer,
    EnrollmentSerializer,
)
from apps.enrollments.models import (
    Enrollment,
    EnrollmentFreeze,
    EnrollmentHistory,
)
from apps.enrollments.selectors import get_student_enrollments
from apps.financial.services.billing import build_charge_schedule
from apps.users.models import AdministrativeAudit
from apps.users.permissions import ScopedCapability, get_request_scope


class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.select_related(
        "student",
        "plan",
    ).all()

    serializer_class = EnrollmentSerializer
    permission_classes = [ScopedCapability]
    read_capability = "enrollments.view"
    write_capability = "enrollments.manage"

    def audit_status(self, enrollment, action, reason=""):
        AdministrativeAudit.objects.create(
            academy=enrollment.student.academy, actor=self.request.user,
            action=action, entity_type="enrollment", entity_id=str(enrollment.pk),
            new_state={"status": enrollment.status}, reason=reason,
        )

    def get_queryset(self):
        queryset = super().get_queryset()
        academy, unit = get_request_scope(self.request.user)
        if academy:
            queryset = queryset.filter(student__academy=academy)
        if unit:
            queryset = queryset.filter(unit=unit)
        search = self.request.query_params.get("search", "").strip()
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(student__name__icontains=search) | Q(plan__name__icontains=search)
            )
        return queryset

    def perform_create(self, serializer):
        enrollment = serializer.save()
        AdministrativeAudit.objects.create(
            academy=enrollment.student.academy, actor=self.request.user,
            action="enrollment.created", entity_type="enrollment",
            entity_id=str(enrollment.pk),
            new_state={"student": str(enrollment.student_id), "plan": str(enrollment.plan_id)},
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="preview-charges",
    )
    def preview_charges(self, request):
        serializer = EnrollmentChargePreviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        plan = data["plan"]
        final_price = plan.price - data["discount_amount"]
        schedule = build_charge_schedule(
            plan,
            final_price,
            data["due_date"],
            data["billing_method"],
        )

        return Response(
            {
                "original_price": plan.price,
                "discount_amount": data["discount_amount"],
                "final_price": final_price,
                "enrollment_fee": plan.enrollment_fee,
                "total_expected": sum(
                    (item["amount"] for item in schedule),
                    start=plan.price * 0,
                ),
                "charges": schedule,
            }
        )

    # ==========================================
    # MATRÍCULAS DO ALUNO
    # ==========================================

    @action(
        detail=False,
        methods=["get"],
        url_path=r"student/(?P<student_id>[^/.]+)",
    )
    def by_student(
        self,
        request,
        student_id=None,
    ):
        enrollments = self.get_queryset().filter(student_id=student_id)

        serializer = self.get_serializer(
            enrollments,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    # ==========================================
    # HISTÓRICO GERAL DO ALUNO
    # ==========================================

    @action(
        detail=False,
        methods=["get"],
        url_path=(
            r"student/"
            r"(?P<student_id>[^/.]+)/"
            r"history"
        ),
    )
    def history(
        self,
        request,
        student_id=None,
    ):
        history = (
            EnrollmentHistory.objects.filter(
                enrollment__student_id=student_id,
                enrollment__in=self.get_queryset(),
            )
            .select_related(
                "enrollment",
                "enrollment__student",
                "enrollment__plan",
            )
            .order_by(
                "-event_date",
                "-created_at",
            )
        )

        serializer = EnrollmentHistorySerializer(
            history,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    # ==========================================
    # HISTÓRICO DE CONGELAMENTOS
    # ==========================================

    @action(
        detail=False,
        methods=["get"],
        url_path=(
            r"student/"
            r"(?P<student_id>[^/.]+)/"
            r"freeze-history"
        ),
    )
    def freeze_history(
        self,
        request,
        student_id=None,
    ):
        freezes = (
            EnrollmentFreeze.objects.filter(
                enrollment__student_id=student_id,
                enrollment__in=self.get_queryset(),
            )
            .select_related(
                "enrollment",
                "enrollment__student",
                "enrollment__plan",
            )
            .order_by(
                "-frozen_at",
                "-created_at",
            )
        )

        serializer = EnrollmentFreezeSerializer(
            freezes,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    # ==========================================
    # CONGELAR MATRÍCULA
    # ==========================================

    @action(
        detail=True,
        methods=["post"],
        url_path="freeze",
    )
    @transaction.atomic
    def freeze(
        self,
        request,
        pk=None,
    ):
        enrollment = self.get_object()

        if enrollment.status != Enrollment.Status.ACTIVE:
            return Response(
                {"detail": ("Somente uma matrícula ativa pode ser congelada.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        open_freeze = EnrollmentFreeze.objects.filter(
            enrollment=enrollment,
            reactivated_at__isnull=True,
        ).exists()

        if open_freeze:
            return Response(
                {"detail": ("Esta matrícula já possui um congelamento em aberto.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        today = timezone.localdate()

        EnrollmentFreeze.objects.create(
            enrollment=enrollment,
            frozen_at=today,
        )

        enrollment.frozen_until = request.data.get("frozen_until") or None

        enrollment.status = Enrollment.Status.FROZEN

        enrollment.save(
            update_fields=[
                "status",
                "updated_at", "frozen_until",
            ]
        )

        EnrollmentHistory.objects.create(
            enrollment=enrollment,
            event_type=EnrollmentHistory.EventType.FROZEN,
            event_date=today,
            description=(f"Matrícula do plano {enrollment.plan.name} congelada."),
        )
        self.audit_status(enrollment, "enrollment.frozen")

        serializer = self.get_serializer(
            enrollment,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    # ==========================================
    # REATIVAR MATRÍCULA
    # ==========================================

    @action(
        detail=True,
        methods=["post"],
        url_path="reactivate",
    )
    @transaction.atomic
    def reactivate(
        self,
        request,
        pk=None,
    ):
        enrollment = self.get_object()

        if enrollment.status != Enrollment.Status.FROZEN:
            return Response(
                {"detail": ("Somente uma matrícula congelada pode ser reativada.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        freeze = (
            EnrollmentFreeze.objects.filter(
                enrollment=enrollment,
                reactivated_at__isnull=True,
            )
            .order_by(
                "-frozen_at",
                "-created_at",
            )
            .first()
        )

        if freeze is None:
            return Response(
                {
                    "detail": (
                        "Não foi encontrado um congelamento "
                        "em aberto para esta matrícula."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        today = timezone.localdate()

        freeze.reactivated_at = today

        freeze.save(
            update_fields=[
                "reactivated_at",
                "updated_at",
            ]
        )

        enrollment.status = Enrollment.Status.ACTIVE

        enrollment.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        EnrollmentHistory.objects.create(
            enrollment=enrollment,
            event_type=EnrollmentHistory.EventType.REACTIVATED,
            event_date=today,
            description=(f"Matrícula do plano {enrollment.plan.name} reativada."),
        )
        self.audit_status(enrollment, "enrollment.reactivated")

        serializer = self.get_serializer(
            enrollment,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    # ==========================================
    # CANCELAR MATRÍCULA
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
        enrollment = self.get_object()

        if enrollment.status in [
            Enrollment.Status.CANCELED,
            Enrollment.Status.FINISHED,
        ]:
            return Response(
                {"detail": ("Esta matrícula não pode ser cancelada no status atual.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        today = timezone.localdate()

        # Se estiver congelada, fecha
        # o congelamento em aberto.
        if enrollment.status == Enrollment.Status.FROZEN:
            freeze = (
                EnrollmentFreeze.objects.filter(
                    enrollment=enrollment,
                    reactivated_at__isnull=True,
                )
                .order_by(
                    "-frozen_at",
                    "-created_at",
                )
                .first()
            )

            if freeze:
                freeze.reactivated_at = today

                freeze.save(
                    update_fields=[
                        "reactivated_at",
                        "updated_at",
                    ]
                )

        reason = str(request.data.get("reason", "")).strip()
        if not reason:
            return Response({"reason": ["Informe o motivo do cancelamento."]}, status=status.HTTP_400_BAD_REQUEST)
        enrollment.status = Enrollment.Status.CANCELED
        enrollment.cancellation_reason = reason

        enrollment.save(
            update_fields=[
                "status",
                "updated_at", "cancellation_reason",
            ]
        )

        EnrollmentHistory.objects.create(
            enrollment=enrollment,
            event_type=EnrollmentHistory.EventType.CANCELED,
            event_date=today,
            description=(f"Matrícula do plano {enrollment.plan.name} cancelada."),
        )
        self.audit_status(enrollment, "enrollment.canceled", reason)

        serializer = self.get_serializer(
            enrollment,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    # ==========================================
    # ENCERRAR MATRÍCULA
    # ==========================================

    @action(
        detail=True,
        methods=["post"],
        url_path="finish",
    )
    @transaction.atomic
    def finish(
        self,
        request,
        pk=None,
    ):
        enrollment = self.get_object()

        if enrollment.status in [
            Enrollment.Status.CANCELED,
            Enrollment.Status.FINISHED,
        ]:
            return Response(
                {"detail": ("Esta matrícula não pode ser encerrada no status atual.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        today = timezone.localdate()

        # Se estiver congelada, fecha
        # o congelamento em aberto.
        if enrollment.status == Enrollment.Status.FROZEN:
            freeze = (
                EnrollmentFreeze.objects.filter(
                    enrollment=enrollment,
                    reactivated_at__isnull=True,
                )
                .order_by(
                    "-frozen_at",
                    "-created_at",
                )
                .first()
            )

            if freeze:
                freeze.reactivated_at = today

                freeze.save(
                    update_fields=[
                        "reactivated_at",
                        "updated_at",
                    ]
                )

        enrollment.status = Enrollment.Status.FINISHED

        enrollment.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        EnrollmentHistory.objects.create(
            enrollment=enrollment,
            event_type=EnrollmentHistory.EventType.FINISHED,
            event_date=today,
            description=(f"Matrícula do plano {enrollment.plan.name} encerrada."),
        )
        self.audit_status(enrollment, "enrollment.finished")

        return Response(self.get_serializer(enrollment).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="renew")
    @transaction.atomic
    def renew(self, request, pk=None):
        enrollment = self.get_object()
        previous_status = enrollment.status
        enrollment.status = Enrollment.Status.FINISHED
        enrollment.save(update_fields=["status", "updated_at"])
        serializer = self.get_serializer(data={
            "student": enrollment.student_id,
            "plan": request.data.get("plan", enrollment.plan_id),
            "contracted_price": request.data.get("contracted_price", enrollment.contracted_price),
            "original_price": request.data.get("original_price", enrollment.original_price),
            "discount_amount": request.data.get("discount_amount", 0),
            "discount_reason": request.data.get("discount_reason", ""),
            "start_date": request.data.get("start_date", timezone.localdate()),
            "due_date": request.data.get("due_date"),
            "billing_method": request.data.get("billing_method", enrollment.billing_method),
            "notes": request.data.get("notes", ""),
            "contract_accepted": True,
        })
        serializer.is_valid(raise_exception=True)
        renewed = serializer.save(unit=enrollment.unit, created_by=request.user, renewed_from=enrollment)
        EnrollmentHistory.objects.create(enrollment=enrollment, event_type=EnrollmentHistory.EventType.RENEWED, event_date=timezone.localdate(), description=f"Renovada para a matrícula {renewed.pk}.")
        self.audit_status(enrollment, "enrollment.renewed", request.data.get("reason", "") or f"Status anterior: {previous_status}")
        return Response(self.get_serializer(renewed).data, status=status.HTTP_201_CREATED)
