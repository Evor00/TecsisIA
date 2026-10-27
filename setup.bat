@echo off
setlocal
chcp 65001 >nul
title TecSis-IA - Setup Inicial
pushd "%~dp0"

echo.
echo [1/6] Verificando Python 3.14...
py -3.14 --version >nul 2>&1
if errorlevel 1 (
    echo  X Python 3.14 no encontrado. Instala Python 3.14.
    goto :error
)

echo [2/6] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo  X Node.js no encontrado. Instala Node.js 24 o compatible.
    goto :error
)

echo [3/6] Creando entorno virtual Python...
if not exist "Backend\venv\Scripts\python.exe" (
    py -3.14 -m venv Backend\venv
    if errorlevel 1 goto :error
)

echo [4/6] Instalando dependencias del backend...
call Backend\venv\Scripts\python.exe -m pip install --upgrade pip
call Backend\venv\Scripts\pip.exe install -r Backend\requirements.txt
if errorlevel 1 goto :error

echo [5/6] Verificando configuracion Django...
call Backend\venv\Scripts\python.exe Backend\manage.py check
if errorlevel 1 goto :error

echo [6/6] Instalando dependencias del frontend desde package-lock.json...
pushd "Frontend\frontend_admin"
call npm ci
set "NPM_EXIT=%ERRORLEVEL%"
popd
if not "%NPM_EXIT%"=="0" goto :error

echo.
echo  Setup completado. Si aun no configuraste PostgreSQL, ejecuta db_setup.bat.
echo  Luego ejecuta verify.bat y start.bat.
popd
pause
exit /b 0

:error
echo.
echo  X El setup no pudo terminar. Revisa el mensaje anterior.
popd
pause
exit /b 1
