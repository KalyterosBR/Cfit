$ErrorActionPreference = "Stop"
$adbPath = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
if ($env:ANDROID_HOME) {
    $adbPath = Join-Path $env:ANDROID_HOME "platform-tools\adb.exe"
}
if (!(Test-Path $adbPath)) {
    throw "adb não encontrado. Configure ANDROID_HOME para o Android SDK."
}

# Execute com somente um emulador/dispositivo conectado e o Expo Go instalado.
# O Expo deve estar rodando no WSL em localhost:8081.
& $adbPath reverse tcp:8081 tcp:8081
if ($LASTEXITCODE -ne 0) { throw "Não foi possível conectar ao Android. Verifique o emulador." }
& $adbPath shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081" -p host.exp.exponent
if ($LASTEXITCODE -ne 0) { throw "Não foi possível abrir o Expo Go." }
