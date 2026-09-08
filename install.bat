@echo off
cd /d "%~dp0"
echo === FreshStock - Installation ===
if exist node_modules (
  echo Suppression de node_modules...
  rmdir /s /q node_modules
)
if exist package-lock.json del /f package-lock.json
echo Installation des dependances...
call npm.cmd install
if errorlevel 1 (
  echo ERREUR lors de l'installation.
  pause
  exit /b 1
)
echo.
echo === Installation reussie ! ===
echo Lancez: npm.cmd run dev
pause
