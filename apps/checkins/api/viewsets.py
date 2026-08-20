from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from django.utils import timezone

from apps.checkins.api.serializers import CheckInSerializer
from apps.checkins.models import CheckIn


class CheckInViewSet(viewsets.ModelViewSet):
    serializer_class = CheckInSerializer

    http_method_names = [
        "get",
        "post",
        "head",
        "options",
    ]

    def get_queryset(self):
        queryset = CheckIn.objects.select_related(
            "student",
        ).all()

        student_id = self.request.query_params.get(
            "student",
        )

        if student_id:
            queryset = queryset.filter(
                student_id=student_id,
            )

        return queryset

    @action(
        detail=False,
        methods=["get"],
        url_path="dashboard-summary",
    )
    def dashboard_summary(self, request):
        queryset = self.get_queryset()
        recent_checkins = queryset[:4]

        return Response(
            {
                "today_count": queryset.filter(
                    checked_in_at__date=timezone.localdate(),
                ).count(),
                "recent_checkins": self.get_serializer(
                    recent_checkins,
                    many=True,
                ).data,
            }
        )
