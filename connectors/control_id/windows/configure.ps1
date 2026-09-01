$ErrorActionPreference = "Stop"

$connectorRoot = Split-Path -Parent $PSScriptRoot
$configPath = Join-Path $connectorRoot "connector-config.json"
$deviceKeyPath = Join-Path $connectorRoot "device-key.xml"
$controlIdPasswordPath = Join-Path $connectorRoot "control-id-password.xml"

Write-Host "Configuracao segura do conector Cfit - Control iD"
Write-Host "As credenciais serao protegidas pelo Windows para este usuario e computador."

$cfitUrl = Read-Host "URL do backend Cfit [https://cfit-api.vercel.app]"
if (-not $cfitUrl) { $cfitUrl = "https://cfit-api.vercel.app" }

$deviceIdentifier = Read-Host "Identificador do equipamento [CID-ENTRADA-01]"
if (-not $deviceIdentifier) { $deviceIdentifier = "CID-ENTRADA-01" }

$controlIdUrl = Read-Host "URL do iDFace primario [http://192.168.50.38]"
if (-not $controlIdUrl) { $controlIdUrl = "http://192.168.50.38" }

$controlIdLogin = Read-Host "Usuario da Control iD [admin]"
if (-not $controlIdLogin) { $controlIdLogin = "admin" }

$deviceKey = Read-Host "Cole a chave do dispositivo Cfit" -AsSecureString
$controlIdPassword = Read-Host "Digite a senha da Control iD" -AsSecureString

$config = [ordered]@{
    cfit_url = $cfitUrl.TrimEnd("/")
    device_identifier = $deviceIdentifier
    poll_interval = 5
    control_id_url = $controlIdUrl.TrimEnd("/")
    control_id_login = $controlIdLogin
    entry_direction = "clockwise"
    exit_direction = "anticlockwise"
}

$config | ConvertTo-Json | Set-Content -Path $configPath -Encoding UTF8
$deviceKey | Export-Clixml -Path $deviceKeyPath
$controlIdPassword | Export-Clixml -Path $controlIdPasswordPath

Write-Host "Configuracao salva com protecao DPAPI do Windows."
Write-Host "Execute windows\run-connector.ps1 para validar antes de instalar a tarefa."
