from apps.academy.models import Academy
from apps.core.base.repositories import BaseRepository


class AcademyRepository(BaseRepository):
    model = Academy


academy_repository = AcademyRepository()
