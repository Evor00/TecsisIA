@echo off
setlocal
chcp 65001 >nul
title TecSis-IA - Iniciando
set "PROJECT_ROOT=%~dp0"

if not exist "%PROJECT_ROOT%Backend\venv\Scripts\python.exe" (
    echo  X Entorno Python no encontrado. Ejecuta setup.bat primero.
    pause
    exit /b 1
)

if not exist "%PROJECT_ROOT%Backend\.env" (
    echo  X Falta Backend\.env. Copia Backend\.env.example y completa sus valores.
    pause
    exit /b 1
)

if not exist "%PROJECT_ROOT%Frontend\frontend_admin\node_modules" (
    echo  X Dependencias frontend no encontradas. Ejecuta setup.bat primero.
    pause
    exit /b 1
)

echo  Levantando backend en http://localhost:8000 ...
start "TecSis-IA Backend" /D "%PROJECT_ROOT%Backend" cmd /k ""%PROJECT_ROOT%Backend\venv\Scripts\python.exe" manage.py runserver"

timeout /t 2 /nobreak >nul

echo  Levantando frontend en http://localhost:5173 ...
start "TecSis-IA Frontend" /D "%PROJECT_ROOT%Frontend\frontend_admin" cmd /k "npm run dev"

echo.
echo  TecSis-IA esta iniciando:
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:8000
echo.
echo  Cierra las dos terminales abiertas para detener la aplicacion.
pause
