from django.urls import path

from apps.suppliers.api.views import supplier_list

urlpatterns = [
    path("", supplier_list),
]