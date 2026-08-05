from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.academy.serializers.academy_serializer import AcademySerializer
from apps.academy.services.academy_service import (
    create_academy,
    list_academies,
)


@api_view(["GET", "POST"])
def academy_list(request):

    if request.method == "GET":
        academies = list_academies()
        serializer = AcademySerializer(academies, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        serializer = AcademySerializer(data=request.data)

        if serializer.is_valid():
            academy = create_academy(serializer.validated_data)
            return Response(AcademySerializer(academy).data, status=201)

        return Response(serializer.errors, status=400)
