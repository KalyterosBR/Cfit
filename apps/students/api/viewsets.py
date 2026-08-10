from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.students.selectors import search_students
from apps.students.serializers import StudentSerializer
from apps.students.services.student_service import (
    activate_student,
    create_student,
    deactivate_student,
    delete_student,
    update_student,
)


class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer

    filter_backends = [
        filters.OrderingFilter,
    ]

    ordering_fields = [
        "name",
        "created_at",
    ]

    ordering = [
        "name",
    ]

    def get_queryset(self):
        search = self.request.query_params.get("search")
        return search_students(search)

    def perform_create(self, serializer):
        return create_student(serializer.validated_data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        student = self.perform_create(serializer)

        return Response(
            self.get_serializer(student).data,
            status=status.HTTP_201_CREATED,
        )

    def perform_update(self, serializer):
        return update_student(
            self.get_object(),
            serializer.validated_data,
        )

    def update(self, request, *args, **kwargs):
        student = self.get_object()

        serializer = self.get_serializer(
            student,
            data=request.data,
            partial=False,
        )

        serializer.is_valid(raise_exception=True)

        student = self.perform_update(serializer)

        return Response(self.get_serializer(student).data)

    def partial_update(self, request, *args, **kwargs):
        student = self.get_object()

        serializer = self.get_serializer(
            student,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)

        student = update_student(
            student,
            serializer.validated_data,
        )

        return Response(self.get_serializer(student).data)

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        student = self.get_object()
        student = deactivate_student(student)

        return Response(
            self.get_serializer(student).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        student = self.get_object()
        student = activate_student(student)

        return Response(
            self.get_serializer(student).data,
            status=status.HTTP_200_OK,
        )

    def perform_destroy(self, instance):
        delete_student(instance)
