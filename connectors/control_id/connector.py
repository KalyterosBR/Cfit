"""Agente local Cfit para equipamentos Control iD da linha de acesso."""

import logging
import os
import time
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests


LOG = logging.getLogger("cfit.control_id")


@dataclass(frozen=True)
class Settings:
    cfit_url: str
    device_identifier: str
    device_key: str
    control_id_url: str
    control_id_login: str
    control_id_password: str
    poll_interval: int
    entry_direction: str
    exit_direction: str

    @classmethod
    def from_env(cls):
        required = ["CFIT_URL", "CFIT_DEVICE_IDENTIFIER", "CFIT_DEVICE_KEY", "CONTROL_ID_URL", "CONTROL_ID_PASSWORD"]
        missing = [name for name in required if not os.getenv(name)]
        if missing:
            raise RuntimeError(f"Variáveis obrigatórias ausentes: {', '.join(missing)}")
        return cls(
            cfit_url=os.environ["CFIT_URL"].rstrip("/"),
            device_identifier=os.environ["CFIT_DEVICE_IDENTIFIER"],
            device_key=os.environ["CFIT_DEVICE_KEY"],
            control_id_url=os.environ["CONTROL_ID_URL"].rstrip("/"),
            control_id_login=os.getenv("CONTROL_ID_LOGIN", "admin"),
            control_id_password=os.environ["CONTROL_ID_PASSWORD"],
            poll_interval=max(2, int(os.getenv("CFIT_POLL_INTERVAL", "5"))),
            entry_direction=os.getenv("CONTROL_ID_ENTRY_DIRECTION", "clockwise"),
            exit_direction=os.getenv("CONTROL_ID_EXIT_DIRECTION", "anticlockwise"),
        )


class CfitClient:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.session = requests.Session()
        self.session.headers["X-Cfit-Device-Key"] = settings.device_key

    def pull_commands(self):
        response = self.session.get(
            f"{self.settings.cfit_url}/api/operations/device-commands/",
            params={"device_identifier": self.settings.device_identifier},
            timeout=15,
        )
        response.raise_for_status()
        return response.json().get("commands", [])

    def confirm(self, command_id: str, success: bool, result=None, error=""):
        response = self.session.post(
            f"{self.settings.cfit_url}/api/operations/device-commands/",
            json={
                "device_identifier": self.settings.device_identifier,
                "command_id": command_id,
                "success": success,
                "result": result or {},
                "error": error,
            },
            timeout=15,
        )
        response.raise_for_status()

    def send_access_event(self, log: dict[str, Any], student_id: str):
        event_code = int(log["event"])
        response = self.session.post(
            f"{self.settings.cfit_url}/api/operations/device-events/",
            json={
                "device_identifier": self.settings.device_identifier,
                "idempotency_key": f"control-id:{self.settings.device_identifier}:access:{log['id']}",
                "event_type": "access",
                "student": student_id,
                "checked_in_at": datetime.fromtimestamp(int(log["time"]), tz=timezone.utc).isoformat(),
                "access_result": "allowed" if event_code == 7 else "blocked",
                "block_reason": "" if event_code == 7 else "Acesso negado pelo equipamento Control iD",
                "device_response": f"Control iD · evento {event_code} · portal {log.get('portal_id', '')}",
            },
            timeout=15,
        )
        response.raise_for_status()


class ControlIdClient:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.session = requests.Session()
        self.token = ""

    def login(self):
        response = self.session.post(
            f"{self.settings.control_id_url}/login.fcgi",
            json={"login": self.settings.control_id_login, "password": self.settings.control_id_password},
            timeout=10,
        )
        response.raise_for_status()
        self.token = response.json()["session"]

    def post(self, endpoint: str, payload: dict[str, Any]):
        if not self.token:
            self.login()
        response = self.session.post(
            f"{self.settings.control_id_url}/{endpoint}",
            params={"session": self.token},
            json=payload,
            timeout=15,
        )
        if response.status_code in {401, 403}:
            self.login()
            response = self.session.post(
                f"{self.settings.control_id_url}/{endpoint}",
                params={"session": self.token},
                json=payload,
                timeout=15,
            )
        response.raise_for_status()
        return response.json() if response.content else {}

    def sync_student(self, payload):
        registration = str(payload.get("registration") or payload.get("student_identifier") or payload.get("student_id") or "")
        name = str(payload.get("name") or "").strip()
        if not registration or not name:
            raise ValueError("sync_student exige registration/student_id e name")
        return self.post("create_objects.fcgi", {"object": "users", "values": [{"registration": registration, "name": name}]})

    def release(self, direction: str):
        if direction not in {"clockwise", "anticlockwise", "both"}:
            raise ValueError("Sentido da catraca inválido")
        return self.post("execute_actions.fcgi", {"actions": [{"action": "catra", "parameters": f"allow={direction}"}]})

    def collect_logs(self, payload):
        limit = min(max(int(payload.get("limit", 100)), 1), 1000)
        body: dict[str, Any] = {"object": "access_logs", "limit": limit, "order": ["ascending", "id"]}
        after_id = int(payload.get("after_id", 0))
        if after_id:
            body["where"] = [{"object": "access_logs", "field": "id", "operator": ">", "value": after_id}]
        return self.post("load_objects.fcgi", body)

    def get_user(self, user_id: int):
        response = self.post("load_objects.fcgi", {
            "object": "users",
            "where": [{"object": "users", "field": "id", "operator": "=", "value": int(user_id)}],
            "limit": 1,
        })
        users = response.get("users", [])
        return users[0] if users else None


class CursorStore:
    def __init__(self, path: Path):
        self.path = path

    def load(self) -> int:
        try:
            return max(0, int(json.loads(self.path.read_text(encoding="utf-8")).get("last_access_log_id", 0)))
        except (FileNotFoundError, ValueError, TypeError, json.JSONDecodeError):
            return 0

    def save(self, value: int):
        temporary = self.path.with_suffix(f"{self.path.suffix}.tmp")
        temporary.write_text(json.dumps({"last_access_log_id": int(value)}), encoding="utf-8")
        temporary.replace(self.path)


class Connector:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.cfit = CfitClient(settings)
        self.device = ControlIdClient(settings)
        state_path = Path(os.getenv("CFIT_STATE_FILE", Path(__file__).with_name("connector-state.json")))
        self.cursor = CursorStore(state_path)
        self.user_cache: dict[int, str] = {}

    def execute(self, command):
        command_type = command["command_type"]
        payload = command.get("payload") or {}
        if command_type == "sync_student":
            return self.device.sync_student(payload)
        if command_type == "release_entry":
            return self.device.release(self.settings.entry_direction)
        if command_type == "release_exit":
            return self.device.release(self.settings.exit_direction)
        if command_type == "collect_logs":
            return self.device.collect_logs(payload)
        raise ValueError(f"Comando ainda não suportado pelo conector Control iD: {command_type}")

    def run_once(self):
        for command in self.cfit.pull_commands():
            try:
                result = self.execute(command)
                self.cfit.confirm(command["id"], True, result=result)
                LOG.info("Comando %s executado", command["id"])
            except Exception as error:
                LOG.exception("Falha no comando %s", command.get("id"))
                self.cfit.confirm(command["id"], False, error=str(error)[:255])
        self.sync_access_logs()

    def sync_access_logs(self):
        last_id = self.cursor.load()
        response = self.device.collect_logs({"limit": 1000, "after_id": last_id})
        logs = sorted(response.get("access_logs", []), key=lambda item: int(item["id"]))
        for log in logs:
            log_id = int(log["id"])
            event_code = int(log.get("event", 0))
            user_id = int(log.get("user_id", 0))
            if event_code not in {6, 7} or user_id <= 0:
                self.cursor.save(log_id)
                continue
            student_id = self.user_cache.get(user_id)
            if student_id is None:
                user = self.device.get_user(user_id)
                student_id = str((user or {}).get("registration") or "").strip()
                if not student_id:
                    LOG.warning("Log %s ignorado: usuário %s sem registration", log_id, user_id)
                    self.cursor.save(log_id)
                    continue
                self.user_cache[user_id] = student_id
            self.cfit.send_access_event(log, student_id)
            self.cursor.save(log_id)
            LOG.info("Acesso Control iD %s sincronizado", log_id)

    def run(self):
        while True:
            try:
                self.run_once()
            except Exception:
                LOG.exception("Falha de comunicação; nova tentativa em %ss", self.settings.poll_interval)
            time.sleep(self.settings.poll_interval)


if __name__ == "__main__":
    logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format="%(asctime)s %(levelname)s %(message)s")
    Connector(Settings.from_env()).run()
