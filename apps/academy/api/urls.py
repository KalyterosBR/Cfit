from django.urls import path

from apps.academy.api.views import academy_list

urlpatterns = [
    path("", academy_list),
]
