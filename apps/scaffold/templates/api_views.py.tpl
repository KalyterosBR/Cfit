from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.{{ module_name }}.serializers import {{ class_name }}Serializer
from apps.{{ module_name }}.use_cases.{{ variable_name }} import (
    create_{{ variable_name }},
    list_{{ variable_name }}s,
)


@api_view(["GET", "POST"])
def {{ variable_name }}_list(request):

    if request.method == "GET":
        objects = list_{{ variable_name }}s()
        serializer = {{ class_name }}Serializer(objects, many=True)
        return Response(serializer.data)

    serializer = {{ class_name }}Serializer(data=request.data)

    if serializer.is_valid():
        obj = create_{{ variable_name }}(serializer.validated_data)
        return Response({{ class_name }}Serializer(obj).data, status=201)

    return Response(serializer.errors, status=400)