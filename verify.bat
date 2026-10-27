@echo off
setlocal
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\verify.ps1"
set "VERIFY_EXIT=%ERRORLEVEL%"
if not "%VERIFY_EXIT%"=="0" (
    echo.
    echo  X La verificacion encontro errores.
    pause
    exit /b %VERIFY_EXIT%
)
echo.
echo  Verificacion completada correctamente.
pause
