$ErrorActionPreference = "Stop"

$connectorRoot = Split-Path -Parent $PSScriptRoot
$configPath = Join-Path $connectorRoot "connector-config.json"
$deviceKeyPath = Join-Path $connectorRoot "device-key.xml"
$controlIdPasswordPath = Join-Path $connectorRoot "control-id-password.xml"
$pythonPath = Join-Path $connectorRoot ".venv\Scripts\python.exe"
$connectorPath = Join-Path $connectorRoot "connector.py"

foreach ($requiredPath in @($configPath, $deviceKeyPath, $controlIdPasswordPath, $pythonPath, $connectorPath)) {
    if (-not (Test-Path $requiredPath)) {
        throw "Arquivo obrigatorio ausente: $requiredPath"
    }
}

function ConvertFrom-ProtectedCredential([string]$path) {
    $secureValue = Import-Clixml -Path $path
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureValue)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    }
}

$config = Get-Content -Raw -Path $configPath | ConvertFrom-Json

try {
    $env:CFIT_URL = $config.cfit_url
    $env:CFIT_DEVICE_IDENTIFIER = $config.device_identifier
    $env:CFIT_DEVICE_KEY = ConvertFrom-ProtectedCredential $deviceKeyPath
    $env:CFIT_POLL_INTERVAL = [string]$config.poll_interval
    $env:CFIT_STATE_FILE = Join-Path $connectorRoot "connector-state.json"
    $env:CONTROL_ID_URL = $config.control_id_url
    $env:CONTROL_ID_LOGIN = $config.control_id_login
    $env:CONTROL_ID_PASSWORD = ConvertFrom-ProtectedCredential $controlIdPasswordPath
    $env:CONTROL_ID_ENTRY_DIRECTION = $config.entry_direction
    $env:CONTROL_ID_EXIT_DIRECTION = $config.exit_direction

    Set-Location $connectorRoot
    & $pythonPath $connectorPath
    exit $LASTEXITCODE
}
finally {
    $env:CFIT_DEVICE_KEY = $null
    $env:CONTROL_ID_PASSWORD = $null
}
