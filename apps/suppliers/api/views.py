from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.suppliers.serializers import SupplierSerializer
from apps.suppliers.use_cases.supplier import (
    create_supplier,
    list_suppliers,
)


@api_view(["GET", "POST"])
def supplier_list(request):

    if request.method == "GET":
        objects = list_suppliers()
        serializer = SupplierSerializer(objects, many=True)
        return Response(serializer.data)

    serializer = SupplierSerializer(data=request.data)

    if serializer.is_valid():
        obj = create_supplier(serializer.validated_data)
        return Response(SupplierSerializer(obj).data, status=201)

    return Response(serializer.errors, status=400)