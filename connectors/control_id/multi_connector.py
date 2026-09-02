"""Executa vários equipamentos Control iD com uma única chave do Cfit Connector."""

import json
import logging
import os
import threading
from pathlib import Path

from connector import Connector, Settings


LOG = logging.getLogger("cfit.connector")


def load_settings(path: Path) -> list[Settings]:
    payload = json.loads(path.read_text(encoding="utf-8-sig"))
    cfit_url = str(payload.get("cfit_url", "")).rstrip("/")
    connector_key = os.getenv("CFIT_CONNECTOR_KEY", "")
    if not cfit_url or not connector_key:
        raise RuntimeError("Informe cfit_url e a variável CFIT_CONNECTOR_KEY.")
    settings = []
    for item in payload.get("devices", []):
        if item.get("provider") != "control_id":
            raise RuntimeError(
                f"O adaptador físico {item.get('provider')} ainda depende do SDK oficial e de homologação."
            )
        identifier = str(item.get("identifier", "")).strip()
        address = str(item.get("address", "")).rstrip("/")
        password_env = str(item.get("password_env", "")).strip()
        password = os.getenv(password_env, "") if password_env else ""
        if not identifier or not address or not password:
            raise RuntimeError(f"Configuração incompleta para o equipamento {identifier or 'sem identificador'}.")
        settings.append(Settings(
            cfit_url=cfit_url,
            device_identifier=identifier,
            device_key=connector_key,
            control_id_url=address,
            control_id_login=str(item.get("login") or "admin"),
            control_id_password=password,
            poll_interval=max(2, int(item.get("poll_interval", 5))),
            entry_direction=str(item.get("entry_direction") or "clockwise"),
            exit_direction=str(item.get("exit_direction") or "anticlockwise"),
        ))
    if not settings:
        raise RuntimeError("Cadastre ao menos um equipamento em devices.")
    return settings


def run_device(settings: Settings, state_file: str):
    LOG.info("Iniciando %s em %s", settings.device_identifier, settings.control_id_url)
    Connector(settings, Path(state_file)).run()


def main():
    path = Path(os.getenv("CFIT_CONNECTOR_CONFIG", Path(__file__).with_name("multi-connector-config.json")))
    payload = json.loads(path.read_text(encoding="utf-8-sig"))
    configured = payload.get("devices", [])
    settings = load_settings(path)
    threads = []
    for position, item in enumerate(settings):
        state_file = str(configured[position].get("state_file") or path.with_name(f"connector-state-{item.device_identifier}.json"))
        thread = threading.Thread(target=run_device, args=(item, state_file), name=item.device_identifier, daemon=False)
        thread.start()
        threads.append(thread)
    for thread in threads:
        thread.join()


if __name__ == "__main__":
    logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format="%(asctime)s %(levelname)s [%(threadName)s] %(message)s")
    main()
