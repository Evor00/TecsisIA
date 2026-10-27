[CmdletBinding()]
param(
    [switch]$CheckDatabase
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$python = Join-Path $projectRoot 'Backend\venv\Scripts\python.exe'
$frontend = Join-Path $projectRoot 'Frontend\frontend_admin'

function Invoke-Check {
    param([string]$Name, [scriptblock]$Command)

    Write-Host "`n==> $Name" -ForegroundColor Cyan
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Name terminó con código $LASTEXITCODE."
    }
}

if (-not (Test-Path -LiteralPath $python)) {
    throw 'No existe Backend\venv. Ejecuta setup.bat primero.'
}
if (-not (Test-Path -LiteralPath (Join-Path $frontend 'node_modules'))) {
    throw 'No existe node_modules. Ejecuta setup.bat primero.'
}

Push-Location $projectRoot
try {
    Invoke-Check 'Django system check' { & $python 'Backend\manage.py' check }
    Invoke-Check 'Django unit tests' { & $python 'Backend\manage.py' test rag_api }
    if ($CheckDatabase) {
        Invoke-Check 'PostgreSQL connection' {
            & $python -c "import os, sys; sys.path.insert(0, 'Backend'); os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_backend.settings'); import django; django.setup(); from django.db import connection; connection.ensure_connection(); print('DATABASE_CONNECTION_OK')"
        }
    }

    Push-Location $frontend
    try {
        Invoke-Check 'Frontend lint' { npm run lint }
        Invoke-Check 'Frontend production build' { npm run build }
    }
    finally {
        Pop-Location
    }
}
finally {
    Pop-Location
}

Write-Host "`nTodo correcto." -ForegroundColor Green
