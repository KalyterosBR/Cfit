Option Explicit

Dim fileSystem, shell, windowsDirectory, connectorDirectory, pythonWindow, application
Set fileSystem = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

windowsDirectory = fileSystem.GetParentFolderName(WScript.ScriptFullName)
connectorDirectory = fileSystem.GetParentFolderName(windowsDirectory)
pythonWindow = fileSystem.BuildPath(connectorDirectory, ".venv\Scripts\pythonw.exe")
application = fileSystem.BuildPath(windowsDirectory, "cfit_connector_app.pyw")

If Not fileSystem.FileExists(pythonWindow) Then
    MsgBox "Python do Cfit Connector nao foi encontrado. Reinstale o aplicativo.", 16, "Cfit Connector"
    WScript.Quit 1
End If

shell.Run Chr(34) & pythonWindow & Chr(34) & " " & Chr(34) & application & Chr(34), 0, False
