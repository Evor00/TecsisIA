@echo off
chcp 65001 >nul
title TecSis-IA - Setup Base de Datos

:: El script de PowerShell pide la contraseña sin guardarla en disco y aplica
:: todos los parches necesarios. No usa rutas ni credenciales fijas.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Backend\database\setup_database.ps1"
if errorlevel 1 (
    echo.
    echo  X La configuracion de base de datos no termino correctamente.
    pause
    exit /b 1
)

echo.
echo  Base de datos configurada correctamente.
echo  Ejecuta setup.bat para configurar el entorno Python y Node.
pause
