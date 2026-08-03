from django.shortcuts import render
from .models import Student
from rest_framework.response import Response
from .serializers import StudentSerializer
from rest_framework.decorators import api_view
from .services.student_service import (
    list_students,
    create_student,
    get_student,
    delete_student,
    update_student,
)


@api_view(["GET", "POST"])
def students_list(request):

    if request.method == "GET":
        students = list_students()
        serializer = StudentSerializer(students, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        serializer = StudentSerializer(data=request.data)

        if serializer.is_valid():
            student = create_student(serializer.validated_data)
            return Response(StudentSerializer(student).data, status=201)

        return Response(serializer.errors, status=400)


@api_view(["GET"])
def student_detail(request, student_id):
    student = get_student(student_id)
    serializer = StudentSerializer(student)

    return Response(serializer.data)


@api_view(["DELETE"])
def student_delete(request, student_id):
    student = get_student(student_id)
    delete_student(student)

    return Response(status=204)


@api_view(["PUT"])
def student_update(request, student_id):
    student = get_student(student_id)

    serializer = StudentSerializer(data=request.data)

    if serializer.is_valid():
        student = update_student(student, serializer.validated_data)
        return Response(StudentSerializer(student).data)

    return Response(serializer.errors, status=400)
