from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.users.models import AcademyUser


ROLE_CAPABILITIES = {
    AcademyUser.Role.OWNER: {"*"},
    AcademyUser.Role.ADMIN: {"*"},
    AcademyUser.Role.MANAGER: {
        "students.manage", "plans.manage", "enrollments.manage",
        "checkins.manage", "workouts.manage", "schedule.manage",
        "reports.view", "finance.view", "automations.manage",
        "units.view", "settings.view",
    },
    AcademyUser.Role.RECEPTION: {
        "students.manage", "enrollments.manage", "checkins.manage",
        "schedule.manage", "finance.view", "plans.view", "units.view",
    },
    AcademyUser.Role.TRAINER: {
        "students.view", "workouts.manage", "schedule.manage", "units.view",
    },
    AcademyUser.Role.FINANCIAL: {
        "finance.view", "finance.manage", "reports.view", "students.view",
        "plans.view", "units.view",
    },
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
    if user.is_student_portal:
        return capability == "portal.view"
    membership = get_active_membership(user)
    if not membership:
        # Compatibilidade com contas administrativas criadas antes do RBAC.
        return not user.academy_users.exists()
    capabilities = ROLE_CAPABILITIES.get(membership.role, set())
    return "*" in capabilities or capability in capabilities


def get_request_scope(user):
    """Retorna o contexto confiável de academia e unidade da sessão."""
    membership = get_active_membership(user)
    if membership:
        return membership.academy, membership.active_unit
    return None, None


class ScopedCapability(BasePermission):
    """Diferencia leitura e escrita sem confiar em dados enviados pelo cliente."""

    def has_permission(self, request, view):
        read_capability = getattr(view, "read_capability", None)
        write_capability = getattr(view, "write_capability", None)
        if request.method in SAFE_METHODS:
            return bool(
                read_capability
                and (
                    user_has_capability(request.user, read_capability)
                    or (write_capability and user_has_capability(request.user, write_capability))
                )
            )
        return bool(write_capability and user_has_capability(request.user, write_capability))


class HasCapability(BasePermission):
    def has_permission(self, request, view):
        capability = getattr(view, "required_capability", None)
        return bool(capability and user_has_capability(request.user, capability))


class HasFinancialAccess(BasePermission):
    def has_permission(self, request, view):
        capability = "finance.view" if request.method in SAFE_METHODS else "finance.manage"
        return user_has_capability(request.user, capability)
