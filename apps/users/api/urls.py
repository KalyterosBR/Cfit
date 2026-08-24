from django.urls import path

from apps.users.api.viewsets import (
    AdministrativeAuditListView,
    CurrentUserView,
    CurrentUnitView,
    MembershipDetailView,
    MembershipListView,
    OperationalNotificationView,
    PasswordChangeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    StudentPortalAccessView,
    StudentPortalView,
    ActiveSessionView,
    TwoFactorSettingsView,
    OwnershipTransferView,
)

urlpatterns = [
    path("me/", CurrentUserView.as_view()),
    path("me/active-unit/", CurrentUnitView.as_view()),
    path("members/", MembershipListView.as_view()),
    path("members/<uuid:pk>/", MembershipDetailView.as_view()),
    path("audits/", AdministrativeAuditListView.as_view()),
    path("notifications/", OperationalNotificationView.as_view()),
    path("password/change/", PasswordChangeView.as_view()),
    path("password/reset/", PasswordResetRequestView.as_view()),
    path("password/reset/confirm/", PasswordResetConfirmView.as_view()),
    path("portal/me/", StudentPortalView.as_view()),
    path("portal/students/<uuid:student_id>/access/", StudentPortalAccessView.as_view()),
    path("me/sessions/", ActiveSessionView.as_view()),
    path("me/two-factor/", TwoFactorSettingsView.as_view()),
    path("ownership/transfer/", OwnershipTransferView.as_view()),
]
