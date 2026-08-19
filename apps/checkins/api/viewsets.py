from rest_framework import viewsets

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
