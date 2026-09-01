@echo off
setlocal
cd /d "%~dp0.."

where py >nul 2>nul
if errorlevel 1 (
  echo O Python nao foi encontrado neste computador.
  echo Instale o Python pelo site python.org e marque a opcao Add Python to PATH.
  pause
  exit /b 1
)

if not exist ".venv\Scripts\python.exe" (
  echo Preparando o Cfit Connector...
  py -m venv .venv
  if errorlevel 1 goto :error
)

echo Instalando os componentes necessarios...
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 goto :error

start "" ".venv\Scripts\pythonw.exe" "windows\cfit_connector_app.pyw"
exit /b 0

:error
echo.
echo Nao foi possivel instalar o Cfit Connector.
echo Verifique a conexao com a internet e tente novamente.
pause
exit /b 1
