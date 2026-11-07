' Hideout: lanzador para el acceso directo del escritorio/menu Inicio.
' Arranca el modo desarrollo con la consola minimizada (no oculta, para
' poder recuperarla si la build falla).
Set ws = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
carpeta = fso.GetParentFolderName(WScript.ScriptFullName)
ws.CurrentDirectory = carpeta
ws.Run "cmd /c pnpm dev", 7, False
