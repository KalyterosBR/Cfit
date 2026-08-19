class BaseRepository:
    model = None

    def list(self):
        return self.model.objects.filter(active=True)

    def get(self, **filters):
        return self.model.objects.get(**filters)

    def create(self, **data):
        return self.model.objects.create(**data)

    def update(self, instance, **data):
        for key, value in data.items():
            setattr(instance, key, value)

        instance.save()

        return instance

    def delete(self, instance):
        instance.active = False
        instance.save(update_fields=["active"])

        return instance
