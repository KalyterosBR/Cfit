class UseCase:
    repository = None

    def __init__(self):
        if self.repository is None:
            raise NotImplementedError("Repository não definido.")
