from django.urls import path

from apps.users.api.viewsets import (
    AdministrativeAuditListView,
    CurrentUserView,
    CurrentUnitView,
    MembershipDetailView,
    MembershipListView,
)

urlpatterns = [
    path("me/", CurrentUserView.as_view()),
    path("me/active-unit/", CurrentUnitView.as_view()),
    path("members/", MembershipListView.as_view()),
    path("members/<uuid:pk>/", MembershipDetailView.as_view()),
    path("audits/", AdministrativeAuditListView.as_view()),
]
