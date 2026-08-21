from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.users.models import AcademyUser


ROLE_CAPABILITIES = {
    AcademyUser.Role.OWNER: {"*"},
    AcademyUser.Role.ADMIN: {"*"},
    AcademyUser.Role.MANAGER: {
        "students.manage", "plans.manage", "enrollments.manage",
        "checkins.manage", "workouts.manage", "schedule.manage",
        "reports.view", "finance.view",
    },
    AcademyUser.Role.RECEPTION: {
        "students.manage", "enrollments.manage", "checkins.manage",
        "schedule.manage", "finance.view",
    },
    AcademyUser.Role.TRAINER: {
        "students.view", "workouts.manage", "schedule.manage",
    },
    AcademyUser.Role.FINANCIAL: {"finance.view", "finance.manage", "reports.view"},
}


def get_active_membership(user):
    if not user or not user.is_authenticated:
        return None
    return user.academy_users.filter(active=True).select_related("academy").first()


def user_has_capability(user, capability):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    membership = get_active_membership(user)
    if not membership:
        # Compatibilidade com contas administrativas criadas antes do RBAC.
        return not user.academy_users.exists()
    capabilities = ROLE_CAPABILITIES.get(membership.role, set())
    return "*" in capabilities or capability in capabilities


class HasCapability(BasePermission):
    def has_permission(self, request, view):
        capability = getattr(view, "required_capability", None)
        return bool(capability and user_has_capability(request.user, capability))


class HasFinancialAccess(BasePermission):
    def has_permission(self, request, view):
        capability = "finance.view" if request.method in SAFE_METHODS else "finance.manage"
        return user_has_capability(request.user, capability)
