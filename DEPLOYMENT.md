# Despliegue de TecSis-IA

Esta guía es para una demostración de tesis en una red local. No publiques la
base de datos ni el backend directamente a Internet sin una revisión de seguridad.

## 1. Configuración de producción

Copia `Backend/.env.example` como `Backend/.env` y define, como mínimo:

```dotenv
DJANGO_SECRET_KEY=genera-una-clave-larga-y-unica
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,IP_O_DOMINIO_DEL_SERVIDOR
CORS_ALLOWED_ORIGINS=http://IP_O_DOMINIO_DEL_SERVIDOR:5173
DJANGO_HTTPS=False
DJANGO_HSTS_SECONDS=0

POSTGRES_DB=tecsisai
POSTGRES_USER=usuario_sin_privilegios_globales
POSTGRES_PASSWORD=una-contrasena-unica
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

Las claves de OpenWebUI o Gemini se mantienen únicamente en ese `.env` local.

Si publicas el sistema detrás de un certificado HTTPS, configura
`DJANGO_HTTPS=True` y `DJANGO_HSTS_SECONDS=31536000` antes de ejecutarlo.
Esto activa HSTS con `includeSubDomains` y `preload`; úsalo solo si todos los
subdominios previstos estarán disponibles exclusivamente por HTTPS.

## 2. Preparación y verificación

Desde la raíz del proyecto, ejecuta:

```bat
db_setup.bat
setup.bat
verify.bat
```

Para validar también la conectividad con PostgreSQL:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\verify.ps1 -CheckDatabase
```

## 3. Ejecución en red local

Construye el frontend:

```powershell
cd Frontend\frontend_admin
npm run build
npm run preview -- --host 0.0.0.0 --port 5173
```

En otra terminal, inicia Django con Waitress:

```powershell
cd Backend
.\venv\Scripts\waitress-serve.exe --listen=0.0.0.0:8000 core_backend.wsgi:application
```

El proxy de Vite está diseñado para desarrollo. Para una demostración en red
local, abre el frontend desde el mismo servidor o configura un proxy inverso
(por ejemplo, Nginx) que dirija `/api/` al backend en el puerto 8000.

## Lista antes de presentar

- Revoca cualquier token expuesto y registra uno nuevo solo en `Backend/.env`.
- Cambia las contraseñas de las cuentas semilla.
- Ejecuta `verify.bat` y conserva el resultado.
- Restringe el firewall a la red que usarás para la demostración.
- Haz una copia de seguridad de PostgreSQL antes de cargar nuevas tesis.
