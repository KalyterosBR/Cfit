from apps.plans.models import Plan


def create_plan(data):
    return Plan.objects.create(**data)


def update_plan(plan, data):
    for key, value in data.items():
        setattr(plan, key, value)

    plan.save()

    return plan


def delete_plan(plan):
    plan.delete()


def get_plan(plan_id):
    return Plan.objects.get(id=plan_id)


def list_plans():
    return Plan.objects.filter(active=True)
