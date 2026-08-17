@echo off
setlocal
set MSG=%*
if "%MSG%"=="" set MSG=chore: sync changes
powershell -ExecutionPolicy Bypass -File "%~dp0publish-main.ps1" -Message "%MSG%"
endlocal
