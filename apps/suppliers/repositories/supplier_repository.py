from apps.suppliers.models import Supplier
from apps.core.base.repositories import BaseRepository


class SupplierRepository(BaseRepository):
    model = Supplier


supplier_repository = SupplierRepository()