import json
import os
import subprocess
import sys
import threading
import tkinter as tk
from pathlib import Path
from tkinter import messagebox, ttk

CONNECTOR_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(CONNECTOR_ROOT))

from connector import CfitClient, ControlIdClient, Settings


APP_TITLE = "Cfit Connector"
TASK_NAME = "Cfit Control iD Connector"
CREATE_NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)


class ConnectorApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.windows_dir = Path(__file__).resolve().parent
        self.connector_root = CONNECTOR_ROOT
        self.config_path = self.connector_root / "connector-config.json"
        self.device_key_path = self.connector_root / "device-key.xml"
        self.password_path = self.connector_root / "control-id-password.xml"
        self.variables = {
            "cfit_url": tk.StringVar(value="https://cfit-api.vercel.app"),
            "device_identifier": tk.StringVar(value="CID-ENTRADA-01"),
            "control_id_url": tk.StringVar(value="http://192.168.50.38"),
            "control_id_login": tk.StringVar(value="admin"),
            "device_key": tk.StringVar(),
            "control_id_password": tk.StringVar(),
        }
        self.status = tk.StringVar(value="Configuração local aguardando validação")
        self.status_tone = "warning"
        self.busy = False
        self._configure_window()
        self._configure_styles()
        self._build()
        self._load_config()
        self._refresh_task_status()

    def _configure_window(self):
        self.root.title(APP_TITLE)
        self.root.geometry("780x700")
        self.root.minsize(700, 640)
        self.root.configure(bg="#071426")

    def _configure_styles(self):
        style = ttk.Style()
        style.theme_use("clam")
        style.configure("App.TFrame", background="#071426")
        style.configure("Panel.TFrame", background="#0d1d32")
        style.configure("Title.TLabel", background="#071426", foreground="#f4f8fd", font=("Segoe UI", 24, "bold"))
        style.configure("Subtitle.TLabel", background="#071426", foreground="#9fb2c8", font=("Segoe UI", 10))
        style.configure("Section.TLabel", background="#0d1d32", foreground="#f4f8fd", font=("Segoe UI", 12, "bold"))
        style.configure("Field.TLabel", background="#0d1d32", foreground="#bfd0e2", font=("Segoe UI", 9, "bold"))
        style.configure("Hint.TLabel", background="#0d1d32", foreground="#8298b1", font=("Segoe UI", 8))
        style.configure("Status.TLabel", background="#10243d", foreground="#f8d477", font=("Segoe UI", 9, "bold"), padding=12)
        style.configure("App.TEntry", fieldbackground="#081625", foreground="#f4f8fd", insertcolor="#f4f8fd", bordercolor="#29415d", lightcolor="#29415d", darkcolor="#29415d", padding=9)
        style.configure("Primary.TButton", background="#2563eb", foreground="white", borderwidth=0, padding=(16, 11), font=("Segoe UI", 9, "bold"))
        style.map("Primary.TButton", background=[("active", "#1d4ed8"), ("disabled", "#243b5a")])
        style.configure("Secondary.TButton", background="#142a46", foreground="#dce8f5", borderwidth=1, padding=(14, 10), font=("Segoe UI", 9, "bold"))
        style.map("Secondary.TButton", background=[("active", "#1b3556"), ("disabled", "#102139")])
        style.configure("Danger.TButton", background="#3a1c2a", foreground="#fecdd3", borderwidth=1, padding=(14, 10), font=("Segoe UI", 9, "bold"))
        style.map("Danger.TButton", background=[("active", "#522033")])

    def _build(self):
        shell = ttk.Frame(self.root, style="App.TFrame", padding=(28, 24))
        shell.pack(fill="both", expand=True)

        ttk.Label(shell, text="CFIT  /  ACESSO", style="Subtitle.TLabel").pack(anchor="w")
        ttk.Label(shell, text="Cfit Connector", style="Title.TLabel").pack(anchor="w", pady=(5, 3))
        ttk.Label(shell, text="Conecte o Cfit ao iDFace primário sem usar comandos manuais.", style="Subtitle.TLabel").pack(anchor="w", pady=(0, 18))

        panel = ttk.Frame(shell, style="Panel.TFrame", padding=22)
        panel.pack(fill="both", expand=True)
        ttk.Label(panel, text="Configuração do equipamento", style="Section.TLabel").grid(row=0, column=0, columnspan=2, sticky="w", pady=(0, 15))
        panel.columnconfigure(0, weight=1)
        panel.columnconfigure(1, weight=1)

        self._field(panel, 1, 0, "Backend do Cfit", "cfit_url", "https://cfit-api.vercel.app")
        self._field(panel, 1, 1, "Identificador no Cfit", "device_identifier", "CID-ENTRADA-01")
        self._field(panel, 2, 0, "Endereço do iDFace primário", "control_id_url", "http://192.168.50.38")
        self._field(panel, 2, 1, "Usuário da Control iD", "control_id_login", "admin")
        self._field(panel, 3, 0, "Chave gerada no Cfit", "device_key", "Cole somente ao configurar ou trocar", secret=True)
        self._field(panel, 3, 1, "Senha da Control iD", "control_id_password", "Digite somente ao configurar ou trocar", secret=True)

        ttk.Label(panel, text="Campos secretos vazios preservam as credenciais já protegidas neste computador.", style="Hint.TLabel").grid(row=4, column=0, columnspan=2, sticky="w", pady=(4, 16))

        actions = ttk.Frame(panel, style="Panel.TFrame")
        actions.grid(row=5, column=0, columnspan=2, sticky="ew")
        for index in range(3):
            actions.columnconfigure(index, weight=1)
        self.save_button = ttk.Button(actions, text="Salvar configuração", style="Primary.TButton", command=self._save_clicked)
        self.save_button.grid(row=0, column=0, sticky="ew", padx=(0, 6))
        self.test_button = ttk.Button(actions, text="Testar conexões", style="Secondary.TButton", command=self._test_clicked)
        self.test_button.grid(row=0, column=1, sticky="ew", padx=6)
        self.install_button = ttk.Button(actions, text="Instalar e iniciar", style="Secondary.TButton", command=self._install_clicked)
        self.install_button.grid(row=0, column=2, sticky="ew", padx=(6, 0))

        service_actions = ttk.Frame(panel, style="Panel.TFrame")
        service_actions.grid(row=6, column=0, columnspan=2, sticky="ew", pady=(10, 0))
        service_actions.columnconfigure(0, weight=1)
        service_actions.columnconfigure(1, weight=1)
        self.start_button = ttk.Button(service_actions, text="Iniciar sincronização", style="Secondary.TButton", command=lambda: self._task_action("/Run"))
        self.start_button.grid(row=0, column=0, sticky="ew", padx=(0, 5))
        self.stop_button = ttk.Button(service_actions, text="Parar sincronização", style="Danger.TButton", command=lambda: self._task_action("/End"))
        self.stop_button.grid(row=0, column=1, sticky="ew", padx=(5, 0))

        self.status_label = ttk.Label(shell, textvariable=self.status, style="Status.TLabel", anchor="w")
        self.status_label.pack(fill="x", pady=(16, 0))
        ttk.Label(shell, text="A catraca continua operando em modo standalone mesmo quando este computador estiver desligado.", style="Subtitle.TLabel").pack(anchor="w", pady=(10, 0))

    def _field(self, parent, row, column, label, key, hint, secret=False):
        frame = ttk.Frame(parent, style="Panel.TFrame")
        frame.grid(row=row, column=column, sticky="ew", padx=(0, 8) if column == 0 else (8, 0), pady=(0, 13))
        frame.columnconfigure(0, weight=1)
        ttk.Label(frame, text=label, style="Field.TLabel").grid(row=0, column=0, sticky="w")
        entry = ttk.Entry(frame, textvariable=self.variables[key], style="App.TEntry", show="•" if secret else "")
        entry.grid(row=1, column=0, sticky="ew", pady=(6, 0))
        ttk.Label(frame, text=hint, style="Hint.TLabel").grid(row=2, column=0, sticky="w", pady=(4, 0))

    def _load_config(self):
        if not self.config_path.exists():
            return
        try:
            config = json.loads(self.config_path.read_text(encoding="utf-8-sig"))
            for key in ("cfit_url", "device_identifier", "control_id_url", "control_id_login"):
                if config.get(key):
                    self.variables[key].set(str(config[key]))
            self.status.set("Configuração protegida encontrada neste computador")
        except (OSError, ValueError):
            self.status.set("Não foi possível ler a configuração local")

    def _settings(self, require_visible_secrets=False):
        device_key = self.variables["device_key"].get().strip()
        password = self.variables["control_id_password"].get()
        if not device_key and self.device_key_path.exists() and not require_visible_secrets:
            device_key = self._unprotect(self.device_key_path)
        if not password and self.password_path.exists() and not require_visible_secrets:
            password = self._unprotect(self.password_path)
        required = {
            "Backend do Cfit": self.variables["cfit_url"].get().strip(),
            "Identificador": self.variables["device_identifier"].get().strip(),
            "Endereço do iDFace": self.variables["control_id_url"].get().strip(),
            "Chave do dispositivo": device_key,
            "Senha da Control iD": password,
        }
        missing = [label for label, value in required.items() if not value]
        if missing:
            raise ValueError("Preencha: " + ", ".join(missing))
        return Settings(
            cfit_url=required["Backend do Cfit"].rstrip("/"),
            device_identifier=required["Identificador"],
            device_key=device_key,
            control_id_url=required["Endereço do iDFace"].rstrip("/"),
            control_id_login=self.variables["control_id_login"].get().strip() or "admin",
            control_id_password=password,
            poll_interval=5,
            entry_direction="clockwise",
            exit_direction="anticlockwise",
        )

    def _protect(self, value, path):
        command = "$value=[Console]::In.ReadToEnd();$secure=ConvertTo-SecureString $value -AsPlainText -Force;$secure|Export-Clixml -Path $args[0]"
        result = subprocess.run(
            ["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", command, str(path)],
            input=value,
            text=True,
            capture_output=True,
            creationflags=CREATE_NO_WINDOW,
        )
        if result.returncode:
            raise RuntimeError(result.stderr.strip() or "Falha ao proteger credencial")

    def _unprotect(self, path):
        command = "$s=Import-Clixml -Path $args[0];$p=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($s);try{[Console]::Out.Write([Runtime.InteropServices.Marshal]::PtrToStringBSTR($p))}finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($p)}"
        result = subprocess.run(
            ["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", command, str(path)],
            text=True,
            capture_output=True,
            creationflags=CREATE_NO_WINDOW,
        )
        if result.returncode:
            raise RuntimeError("Credencial protegida não pôde ser aberta por este usuário")
        return result.stdout

    def _save(self):
        settings = self._settings()
        config = {
            "cfit_url": settings.cfit_url,
            "device_identifier": settings.device_identifier,
            "poll_interval": settings.poll_interval,
            "control_id_url": settings.control_id_url,
            "control_id_login": settings.control_id_login,
            "entry_direction": settings.entry_direction,
            "exit_direction": settings.exit_direction,
        }
        self.config_path.write_text(json.dumps(config, indent=2), encoding="utf-8")
        visible_key = self.variables["device_key"].get().strip()
        visible_password = self.variables["control_id_password"].get()
        if visible_key:
            self._protect(visible_key, self.device_key_path)
        if visible_password:
            self._protect(visible_password, self.password_path)
        self.variables["device_key"].set("")
        self.variables["control_id_password"].set("")

    def _background(self, message, operation, success_message):
        if self.busy:
            return
        self.busy = True
        self.status.set(message)
        self._set_buttons("disabled")

        def work():
            try:
                operation()
            except Exception as error:
                self.root.after(0, lambda: self._finish_error(str(error)))
            else:
                self.root.after(0, lambda: self._finish_success(success_message))

        threading.Thread(target=work, daemon=True).start()

    def _set_buttons(self, state):
        for button in (self.save_button, self.test_button, self.install_button, self.start_button, self.stop_button):
            button.configure(state=state)

    def _finish_error(self, message):
        self.busy = False
        self._set_buttons("normal")
        self.status.set("Falha: " + message[:220])
        messagebox.showerror(APP_TITLE, message)

    def _finish_success(self, message):
        self.busy = False
        self._set_buttons("normal")
        self.status.set(message)
        messagebox.showinfo(APP_TITLE, message)
        self._refresh_task_status(delay=600)

    def _save_clicked(self):
        self._background("Salvando configuração protegida...", self._save, "Configuração salva e credenciais protegidas")

    def _test_clicked(self):
        def test():
            settings = self._settings()
            CfitClient(settings).pull_commands()
            ControlIdClient(settings).login()
        self._background("Testando Cfit e iDFace...", test, "Cfit e iDFace responderam corretamente")

    def _install_clicked(self):
        def install():
            self._save()
            result = subprocess.run(
                ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(self.windows_dir / "install-task.ps1")],
                text=True,
                capture_output=True,
                creationflags=CREATE_NO_WINDOW,
            )
            if result.returncode:
                raise RuntimeError(result.stderr.strip() or "Não foi possível instalar a tarefa automática")
        self._background("Instalando sincronização automática...", install, "Sincronização instalada e iniciada automaticamente")

    def _task_action(self, action):
        label = "Iniciando" if action == "/Run" else "Parando"
        success = "Sincronização iniciada" if action == "/Run" else "Sincronização parada"

        def execute():
            result = subprocess.run(
                ["schtasks.exe", action, "/TN", TASK_NAME],
                text=True,
                capture_output=True,
                creationflags=CREATE_NO_WINDOW,
            )
            if result.returncode:
                raise RuntimeError("A tarefa automática ainda não está instalada" if action == "/Run" else "Não foi possível parar a tarefa")
        self._background(f"{label} sincronização...", execute, success)

    def _refresh_task_status(self, delay=0):
        def refresh():
            result = subprocess.run(
                ["schtasks.exe", "/Query", "/TN", TASK_NAME],
                capture_output=True,
                creationflags=CREATE_NO_WINDOW,
            )
            if result.returncode == 0:
                self.status.set("Serviço automático instalado neste computador")

        self.root.after(delay, refresh)


if __name__ == "__main__":
    root = tk.Tk()
    ConnectorApp(root)
    root.mainloop()
