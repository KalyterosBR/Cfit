$ErrorActionPreference = "Stop"

$taskName = "Cfit Control iD Connector"
$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($task) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "Tarefa '$taskName' removida. Credenciais e cursor foram preservados."
} else {
    Write-Host "Tarefa '$taskName' nao esta instalada."
}
