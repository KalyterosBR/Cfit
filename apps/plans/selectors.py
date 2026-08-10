from apps.plans.models import Plan


def get_all_plans():
    return Plan.objects.all()


def get_active_plans():
    return Plan.objects.filter(active=True)