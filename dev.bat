@echo off
cd /d "%~dp0"
if not exist "node_modules\.bin\vite.cmd" (
  echo Vite manquant. Lancez install.bat d'abord.
  pause
  exit /b 1
)
call node_modules\.bin\vite.cmd --host
