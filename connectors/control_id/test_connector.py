import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path

from connector import Connector, CursorStore
from multi_connector import load_settings


class MemoryCursor:
    def __init__(self, value=0):
        self.value = value

    def load(self):
        return self.value

    def save(self, value):
        self.value = value


class FakeDevice:
    def __init__(self):
        self.requested_after_id = None

    def collect_logs(self, payload):
        self.requested_after_id = payload["after_id"]
        return {
            "access_logs": [
                {"id": 13, "time": 1_725_120_000, "event": 7, "user_id": 5, "portal_id": 1},
                {"id": 12, "time": 1_725_119_900, "event": 3, "user_id": 0, "portal_id": 1},
            ]
        }

    def get_user(self, user_id):
        return {"id": user_id, "registration": "426d6acf-5c0f-4702-8ae6-fe16ea6c4d24"}


class FakeCfit:
    def __init__(self):
        self.events = []

    def send_access_event(self, log, student_id):
        self.events.append((log, student_id))


class ConnectorTests(unittest.TestCase):
    def test_cursor_store_persists_last_processed_log(self):
        with tempfile.TemporaryDirectory() as directory:
            store = CursorStore(Path(directory) / "state.json")
            self.assertEqual(store.load(), 0)
            store.save(42)
            self.assertEqual(store.load(), 42)

    def test_sync_access_logs_maps_user_and_advances_cursor(self):
        connector = Connector.__new__(Connector)
        connector.device = FakeDevice()
        connector.cfit = FakeCfit()
        connector.cursor = MemoryCursor(11)
        connector.user_cache = {}

        connector.sync_access_logs()

        self.assertEqual(connector.device.requested_after_id, 11)
        self.assertEqual(connector.cursor.value, 13)
        self.assertEqual(len(connector.cfit.events), 1)
        self.assertEqual(connector.cfit.events[0][0]["id"], 13)
        self.assertEqual(connector.cfit.events[0][1], "426d6acf-5c0f-4702-8ae6-fe16ea6c4d24")

    def test_multi_connector_loads_multiple_devices_with_one_key(self):
        with tempfile.TemporaryDirectory() as directory:
            config = Path(directory) / "config.json"
            config.write_text('{"cfit_url":"https://cfit.test","devices":[{"identifier":"A","provider":"control_id","address":"http://10.0.0.1","password_env":"DEVICE_A_PASSWORD"},{"identifier":"B","provider":"control_id","address":"http://10.0.0.2","password_env":"DEVICE_B_PASSWORD"}]}', encoding="utf-8")
            with patch.dict("os.environ", {"CFIT_CONNECTOR_KEY": "shared", "DEVICE_A_PASSWORD": "a", "DEVICE_B_PASSWORD": "b"}, clear=False):
                settings = load_settings(config)
        self.assertEqual([item.device_identifier for item in settings], ["A", "B"])
        self.assertTrue(all(item.device_key == "shared" for item in settings))


if __name__ == "__main__":
    unittest.main()
