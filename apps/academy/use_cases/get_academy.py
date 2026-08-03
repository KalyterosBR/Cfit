from apps.academy.models import Academy


def get_academy(academy_id):
    return Academy.objects.get(id=academy_id)
