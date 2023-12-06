"""(Un)persistent MongoDB-alike

This module is intended to be used in development apps where database is not persistent."""

from json import loads, dumps

class FakeCollection:
    def __init__(self):
        self._data: list[dict] = []

    def save(self, path):
        with open(path, 'w') as file:
            file.write(dumps(self._data))

    @classmethod
    def load(cls, path):
        with open(path) as file:
            self = cls()
            self._data = loads(file.read())
        return self

    def insert_one(self, data: dict):
        self._data.append(data)

    def delete_one(self, data: dict):
        captured_index = []
        # ! Very bad implementation
        for i, value in enumerate(self._data):
            if not data in value:
                continue
            vars = data.keys()
            for k in vars:
                if value[k] == data[k]:
                    captured_index.append(i)
        for i in captured_index:
            self._data.pop(i)

    def find(*args, **kwargs):
        pass
