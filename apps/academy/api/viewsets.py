import json
from datetime import date, timedelta

from django.db.models import Count, Q, Sum
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.academy.models import Unit
from apps.academy.serializers import UnitSerializer
from apps.users.permissions import ScopedCapability, get_active_membership
from apps.users.models import AdministrativeAudit


class UnitViewSet(viewsets.ModelViewSet):
    serializer_class = UnitSerializer
    permission_classes = [ScopedCapability]
    read_capability = "units.view"
    write_capability = "units.manage"
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        membership = get_active_membership(self.request.user)
        if membership:
            return Unit.objects.filter(academy=membership.academy)
        return Unit.objects.all() if self.request.user.is_superuser or not self.request.user.academy_users.exists() else Unit.objects.none()

    def perform_create(self, serializer):
        membership = get_active_membership(self.request.user)
        academy = membership.academy if membership else serializer.validated_data.get("academy")
        if academy is None:
            from apps.academy.models import Academy
            academy = Academy.objects.first()
        unit = serializer.save(academy=academy)
        AdministrativeAudit.objects.create(
            academy=academy, actor=self.request.user, action="unit.created",
            entity_type="unit", entity_id=str(unit.pk),
            new_state=json.loads(json.dumps(self.get_serializer(unit).data, default=str)),
        )

    def perform_update(self, serializer):
        unit = self.get_object()
        if serializer.validated_data.get("active") is False and unit.active_users.filter(active=True).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"active": "Remova esta unidade do contexto ativo dos usuários antes de inativá-la."})
        previous = json.loads(json.dumps(self.get_serializer(unit).data, default=str))
        updated = serializer.save()
        AdministrativeAudit.objects.create(
            academy=updated.academy, actor=self.request.user, action="unit.updated",
            entity_type="unit", entity_id=str(updated.pk), previous_state=previous,
            new_state=json.loads(json.dumps(self.get_serializer(updated).data, default=str)),
            reason=self.request.data.get("reason", ""),
        )

    @action(detail=False, methods=["get"], url_path="comparison")
    def comparison(self, request):
        period = request.query_params.get("period")
        try:
            start = date.fromisoformat(f"{period}-01") if period else date.today().replace(day=1)
        except ValueError:
            return Response({"period": ["Informe o período no formato AAAA-MM."]}, status=400)
        end = start.replace(year=start.year + 1, month=1) if start.month == 12 else start.replace(month=start.month + 1)
        previous_end = start
        previous_start = (start - timedelta(days=1)).replace(day=1)
        units = self.get_queryset().annotate(
            active_students=Count("students", filter=Q(students__active=True), distinct=True),
            checkin_count=Count(
                "checkins",
                filter=Q(checkins__checked_in_at__date__gte=start, checkins__checked_in_at__date__lt=end),
                distinct=True,
            ),
            revenue=Sum(
                "charges__amount",
                filter=Q(charges__status="paid", charges__paid_at__date__gte=start, charges__paid_at__date__lt=end),
            ),
            previous_checkins=Count(
                "checkins",
                filter=Q(checkins__checked_in_at__date__gte=previous_start, checkins__checked_in_at__date__lt=previous_end),
                distinct=True,
            ),
            previous_revenue=Sum(
                "charges__amount",
                filter=Q(charges__status="paid", charges__paid_at__date__gte=previous_start, charges__paid_at__date__lt=previous_end),
            ),
        )
        rows = [
            {
                "id": str(unit.pk), "name": unit.name,
                "active_students": unit.active_students,
                "checkins": unit.checkin_count,
                "revenue": str(unit.revenue or 0),
                "previous_checkins": unit.previous_checkins,
                "previous_revenue": str(unit.previous_revenue or 0),
            }
            for unit in units
        ]
        ranking = {row["id"]: position for position, row in enumerate(sorted(rows, key=lambda item: (float(item["revenue"]), item["checkins"]), reverse=True), start=1)}
        for row in rows:
            row["rank"] = ranking[row["id"]]
            row["revenue_per_student"] = round(float(row["revenue"]) / row["active_students"], 2) if row["active_students"] else 0
            row["revenue_change"] = round((float(row["revenue"]) - float(row["previous_revenue"])) * 100 / float(row["previous_revenue"]), 1) if float(row["previous_revenue"]) else None
            row["checkin_change"] = round((row["checkins"] - row["previous_checkins"]) * 100 / row["previous_checkins"], 1) if row["previous_checkins"] else None
            row["alerts"] = (["Receita abaixo do período anterior"] if float(row["revenue"]) < float(row["previous_revenue"]) else []) + (["Check-ins abaixo do período anterior"] if row["checkins"] < row["previous_checkins"] else [])
        return Response(rows)

    @action(detail=False, methods=["get"], url_path="unit-coverage")
    def unit_coverage(self, request):
        """Diagnóstico somente leitura; dados ambíguos nunca são atribuídos automaticamente."""
        from apps.checkins.models import CheckIn
        from apps.enrollments.models import Enrollment
        from apps.financial.models import Charge
        from apps.students.models import Student
        from apps.workouts.models import WorkoutPlan

        membership = get_active_membership(request.user)
        academy = membership.academy if membership else None
        if academy is None:
            return Response({"domains": [], "unassigned_total": 0})
        domains = [
            ("students", "Alunos", Student.objects.filter(academy=academy, unit__isnull=True).count()),
            ("enrollments", "Matrículas", Enrollment.objects.filter(student__academy=academy, unit__isnull=True).count()),
            ("charges", "Cobranças", Charge.objects.filter(enrollment__student__academy=academy, unit__isnull=True).count()),
            ("checkins", "Check-ins", CheckIn.objects.filter(student__academy=academy, unit__isnull=True).count()),
            ("workouts", "Treinos", WorkoutPlan.objects.filter(student__academy=academy, unit__isnull=True).count()),
        ]
        return Response({
            "domains": [{"key": key, "label": label, "unassigned": count} for key, label, count in domains],
            "unassigned_total": sum(item[2] for item in domains),
            "migration_policy": "manual_review_required",
        })
