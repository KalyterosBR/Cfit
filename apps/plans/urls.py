from django.urls import path

from apps.plans.views import plans_list

urlpatterns = [
    path("", plans_list, name="plans-list"),
]
