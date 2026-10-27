[CmdletBinding()]
param(
    [string]$PostgresUser = $env:POSTGRES_USER,
    [string]$Database = $env:POSTGRES_DB,
    [string]$PsqlPath = $env:PSQL_PATH
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($PostgresUser)) { $PostgresUser = 'postgres' }
if ([string]::IsNullOrWhiteSpace($Database)) { $Database = 'tecsisai' }

if ([string]::IsNullOrWhiteSpace($PsqlPath)) {
    $psqlCommand = Get-Command psql.exe -ErrorAction SilentlyContinue
    if ($psqlCommand) { $PsqlPath = $psqlCommand.Source }
}

if ([string]::IsNullOrWhiteSpace($PsqlPath) -or -not (Test-Path -LiteralPath $PsqlPath)) {
    throw 'No se encontró psql.exe. Instala PostgreSQL o define PSQL_PATH con la ruta completa a psql.exe.'
}

function Invoke-Psql {
    param([string[]]$Arguments)

    & $PsqlPath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "psql terminó con código $LASTEXITCODE."
    }
}

function Get-PsqlScalar {
    param([string]$Query)

    $result = & $PsqlPath '-X' '-tA' '-U' $PostgresUser '-d' $Database '-c' $Query
    if ($LASTEXITCODE -ne 0) {
        throw "No se pudo consultar el estado de la base de datos (código $LASTEXITCODE)."
    }
    return ($result | Out-String).Trim()
}

function Test-DatabaseExists {
    $result = & $PsqlPath '-X' '-tA' '-U' $PostgresUser '-d' 'postgres' '-c' "SELECT 1 FROM pg_database WHERE datname = '$Database';"
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo conectar a PostgreSQL.' }
    return $result -match '^1$'
}

$securePassword = Read-Host "Contraseña de PostgreSQL para '$PostgresUser'" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
    $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)

    if (-not (Test-DatabaseExists)) {
        Write-Host "Creando la base '$Database'..."
        Invoke-Psql @('-X', '-v', 'ON_ERROR_STOP=1', '-U', $PostgresUser, '-d', 'postgres', '-c', "CREATE DATABASE `"$Database`" ENCODING 'UTF8' TEMPLATE template0;")
    }

    $schemaExists = (Get-PsqlScalar "SELECT 1 FROM information_schema.schemata WHERE schema_name = 'tecsisai';") -eq '1'
    if (-not $schemaExists) {
        Write-Host 'Cargando esquema base...'
        Invoke-Psql @('-X', '-v', 'ON_ERROR_STOP=1', '-U', $PostgresUser, '-d', $Database, '-f', (Join-Path $PSScriptRoot 'tecsisai_schema.sql'))
    } else {
        Write-Host 'Esquema existente detectado; no se reemplazarán datos ni tablas.'
    }

    $dimension = Get-PsqlScalar "SELECT a.atttypmod FROM pg_attribute a WHERE a.attrelid = 'tecsisai.documentos_rag'::regclass AND a.attname = 'embedding' AND NOT a.attisdropped;"
    if ($dimension -eq '1536') {
        $embeddingCount = Get-PsqlScalar 'SELECT COUNT(*) FROM tecsisai.documentos_rag WHERE embedding IS NOT NULL;'
        if ($embeddingCount -ne '0') {
            throw 'La base usa vectores de 1536 dimensiones con datos existentes. No se realizará una conversión destructiva; reindexa los documentos manualmente antes de aplicar el parche de 384 dimensiones.'
        }
        Write-Host 'Ajustando vectores a 384 dimensiones...'
        Invoke-Psql @('-X', '-v', 'ON_ERROR_STOP=1', '-U', $PostgresUser, '-d', $Database, '-f', (Join-Path $PSScriptRoot 'patch_vector_384.sql'))
    } elseif ($dimension -ne '384') {
        throw "No se pudo validar la dimensión del vector (valor: '$dimension')."
    }

    $patches = @('patch_abstract_constraint.sql')
    $tesisExtraColumns = Get-PsqlScalar "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'tecsisai' AND table_name = 'tesis' AND column_name IN ('grupo', 'tecnologias', 'similitud_maxima', 'score');"
    if ($tesisExtraColumns -ne '4') { $patches += 'patch_columnas_tesis.sql' }

    $hasActivo = Get-PsqlScalar "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'tecsisai' AND table_name = 'tesis' AND column_name = 'activo';"
    if ($hasActivo -ne '1') { $patches += 'patch_activo.sql' }

    $placeholderPasswords = Get-PsqlScalar "SELECT COUNT(*) FROM tecsisai.usuarios WHERE password_hash = 'CHANGEME' OR password_hash IS NULL OR password_hash = '' OR password_hash LIKE '%placeholder%';"
    if ($placeholderPasswords -ne '0') { $patches += 'patch_auth_passwords.sql' }

    $hasConversations = Get-PsqlScalar "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'tecsisai' AND table_name IN ('conversaciones', 'mensajes');"
    if ($hasConversations -ne '2') { $patches += 'patch_conversaciones.sql' }
    foreach ($patch in $patches) {
        Write-Host "Aplicando $patch..."
        Invoke-Psql @('-X', '-v', 'ON_ERROR_STOP=1', '-U', $PostgresUser, '-d', $Database, '-f', (Join-Path $PSScriptRoot $patch))
    }

    Write-Host "Base '$Database' lista. Los parches requeridos fueron verificados/aplicados."
}
finally {
    if ($bstr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
