# TecSis-IA

Plataforma web de gestión documental y búsqueda semántica de tesis para la carrera de Diseño y Desarrollo de Software. Combina un panel administrativo en React con un motor de Inteligencia Artificial local (RAG) que permite realizar consultas en lenguaje natural sobre el repositorio de proyectos.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite 8 + Tailwind CSS 4 |
| Backend | Django 6 + Django REST Framework 3.17 |
| Base de datos | PostgreSQL 18 + pgvector 0.8.6 |
| Modelo de IA | paraphrase-multilingual-MiniLM-L12-v2 (384 dims, local) |
| Extracción PDF | pypdf |
| Búsqueda vectorial | pgvector con índice HNSW y distancia coseno |

---

## Requisitos previos

| Herramienta | Versión usada | Descarga |
|---|---|---|
| Python | 3.14.7 | https://www.python.org/downloads/ |
| Node.js | 24.21.0 | https://nodejs.org/ |
| PostgreSQL | 18 | https://www.postgresql.org/download/ |
| pgvector | 0.8.6 | https://github.com/pgvector/pgvector |
| pgAdmin 4 | cualquiera | incluido con PostgreSQL |
| Git | cualquiera | https://git-scm.com/download/win |
| Visual Studio Build Tools | 2022 | https://visualstudio.microsoft.com/visual-cpp-build-tools/ |

> **Windows**: durante la instalación de PostgreSQL, anota la contraseña del usuario `postgres`. La necesitarás en los pasos siguientes.

---

## Instalación rapida (scripts automatizados)

El proyecto incluye cuatro scripts `.bat` para preparar y verificar el entorno:

| Script | Descripcion |
|---|---|
| `db_setup.bat` | Crea o valida la BD y aplica solo los parches que faltan |
| `setup.bat` | Crea el venv e instala dependencias Python y Node desde sus lockfiles |
| `verify.bat` | Ejecuta checks Django, pruebas, lint y build del frontend |
| `start.bat` | Levanta el backend (Django :8000) y frontend (Vite :5173) en paralelo |

### Orden de ejecucion:
1. Instalar PostgreSQL + pgvector (ver seccion 1 abajo)
2. Ejecutar `db_setup.bat` como administrador
3. Ejecutar `setup.bat`
4. Ejecutar `verify.bat`
5. Ejecutar `start.bat`

---

## 1. Instalar pgvector (compilacion desde fuente en Windows)

pgvector no tiene instalador precompilado para PostgreSQL 18. Requiere compilacion manual.

### Prerequisitos para compilar:
- Git: https://git-scm.com/download/win
- Visual Studio Build Tools 2022 con workload **"Desarrollo para escritorio con C++"**

### Pasos (ejecutar en CMD como administrador):

```cmd
set "PGROOT=C:\Program Files\PostgreSQL\18"
cd %TEMP%
git clone --branch v0.8.6 https://github.com/pgvector/pgvector.git
cd pgvector
nmake /F Makefile.win
nmake /F Makefile.win install
```

> Si nmake no se reconoce, abrir el **"Developer Command Prompt for VS 2022"** desde el menu inicio.

### Verificar en pgAdmin:
```sql
SELECT * FROM pg_available_extensions WHERE name = 'vector';
-- Debe aparecer una fila con version 0.8.6
```

---

## 2. Configurar la base de datos

### Opcion A — Script automatico (recomendado)
Ejecutar `db_setup.bat` como administrador desde la raiz del proyecto.

### Opcion B — Manual en pgAdmin

**2.1 Crear la base de datos:**
```sql
CREATE DATABASE tecsisai ENCODING = 'UTF8' TEMPLATE = template0;
```

**2.2 Habilitar pgvector:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**2.3 Cargar el schema:**
Abrir y ejecutar `Backend/database/tecsisai_schema.sql`

**2.4 Aplicar parche de vectores (384 dims):**
```sql
-- Ejecutar: Backend/database/patch_vector_384.sql
-- Cambia embedding de vector(1536) a vector(384) para el modelo local
```

**2.5 Aplicar los parches restantes:**
```sql
-- Ejecutar en este orden:
-- Backend/database/patch_abstract_constraint.sql
-- Backend/database/patch_columnas_tesis.sql
-- Backend/database/patch_activo.sql
-- Backend/database/patch_auth_passwords.sql
-- Backend/database/patch_conversaciones.sql
```

**2.6 (Opcional) Datos extra de demo:**
```sql
-- Ejecutar: Backend/database/seed_datos_extra.sql
-- Agrega 10 tesis adicionales (C24-007 a C24-016)
```

---

## 3. Configurar el Backend (Django)

### 3.1 Crear el entorno virtual

```powershell
cd Backend
python -m venv venv
```

Activar:
```powershell
# PowerShell
venv\Scripts\Activate.ps1

# CMD
venv\Scripts\activate.bat
```

### 3.2 Instalar dependencias

```bash
pip install -r requirements.txt
```

> La primera instalacion descarga torch y sentence-transformers (~1 GB). Ten paciencia.

### 3.3 Configurar conexion a PostgreSQL

Copiar `Backend/.env.example` como `Backend/.env` y completar la conexión:

```dotenv
POSTGRES_DB=tecsisai
POSTGRES_USER=postgres
POSTGRES_PASSWORD=TU_CONTRASENA
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

> No subas `Backend/.env` ni claves de OpenWebUI/Gemini al repositorio. El archivo
> `.env.example` solo contiene marcadores de ejemplo.

### 3.4 Aplicar migraciones y levantar servidor

```bash
python manage.py migrate
python manage.py runserver
```

Backend disponible en `http://localhost:8000`

---

## 4. Configurar el Frontend (React + Vite)

```bash
cd Frontend/frontend_admin
npm install
npm run dev
```

Frontend disponible en `http://localhost:5173`

> Vite redirige automaticamente `/api/*` al backend en `localhost:8000`.

---

## 5. Crear usuario administrador

```bash
# Con el venv activado, desde la carpeta Backend/
python manage.py createsuperuser
```

---

## 6. Verificar que todo funciona

Con ambos servidores corriendo, abrir `http://localhost:5173`:

1. **Login** — Ingresar con el usuario creado en el paso 5
2. **Dashboard** — Deben aparecer metricas (total tesis, aprobadas, en revision, etc.)
3. **Proyectos** — Deben listarse las tesis del seed data con sus estados
4. **Chat IA** — Escribir `lista de tesis registradas` y deben aparecer los proyectos
5. **Historial** — Deben aparecer las consultas registradas en `log_consultas`

---

## 7. Estructura del proyecto

```
TecsisAi-2/
├── setup.bat                    ← Configura venv + dependencias + migraciones
├── start.bat                    ← Levanta backend y frontend en paralelo
├── db_setup.bat                 ← Crea BD y aplica schema + parches SQL
├── Backend/
│   ├── .env                     ← Variables de entorno (OpenWebUI URL/token)
│   ├── manage.py
│   ├── requirements.txt
│   ├── core_backend/            ← Configuracion Django (settings, urls)
│   ├── rag_api/                 ← App principal
│   │   ├── models.py            ← Modelos Django
│   │   ├── views.py             ← API endpoints (RAG, auth, tesis, etc.)
│   │   ├── urls.py              ← Rutas de la API
│   │   ├── llm_client.py        ← Cliente para OpenWebUI
│   │   ├── auth.py              ← Autenticacion por sesion
│   │   └── management/commands/ ← Comando reindex_rag
│   └── database/
│       ├── tecsisai_schema.sql       ← Schema completo + seed data inicial
│       ├── patch_vector_384.sql      ← Ajuste dimension embeddings (1536→384)
│       ├── patch_abstract_constraint.sql ← Permite resumenes manuales
│       ├── patch_columnas_tesis.sql  ← Columnas extra (grupo, tecnologias)
│       ├── patch_conversaciones.sql  ← Historial de conversaciones
│       ├── seed_datos_extra.sql      ← 10 tesis adicionales para demo
│       ├── ejemplo_tesis.xml         ← XML de ejemplo para importar
│       └── proyecto_demo.xml         ← XML demo completo
└── Frontend/
    └── frontend_admin/
        ├── src/
        │   ├── views/               ← Pantallas principales
        │   │   ├── LoginScreen.jsx
        │   │   ├── DashboardChatView.jsx
        │   │   ├── ProyectosView.jsx
        │   │   ├── HistorialView.jsx
        │   │   └── PerfilView.jsx
        │   ├── components/          ← Componentes reutilizables
        │   │   └── common.jsx
        │   ├── services/            ← Llamadas a la API
        │   │   └── api.js
        │   ├── utils/               ← Utilitarios
        │   │   └── similarity.js
        │   ├── data/                ← Datos de fallback
        │   │   └── fallbackData.js
        │   ├── App.jsx
        │   └── main.jsx
        ├── vite.config.js           ← Proxy /api → localhost:8000
        └── package.json
```

---

## 8. Comandos utiles

```bash
# Regenerar embeddings de todos los documentos RAG
python manage.py reindex_rag

# Regenerar embeddings forzando recalculo
python manage.py reindex_rag --force

# Descargar y comprobar el modelo de embeddings antes de atender usuarios
python manage.py warm_rag_model

# Crear superusuario admin
python manage.py createsuperuser

# Ver logs en tiempo real del backend
python manage.py runserver --verbosity=2
```

---

## 9. Solucion de problemas

**`django.db.utils.OperationalError: connection refused`**
→ PostgreSQL no esta corriendo. Verifica el servicio en el Administrador de servicios de Windows.

**`extension "vector" does not exist`**
→ pgvector no esta instalado o no se ejecuto `CREATE EXTENSION vector;` en la BD tecsisai.

**`ERROR: column "embedding" is of type vector(1536) but expression is of type vector(384)`**
→ No aplicaste el parche. Ejecuta `Backend/database/patch_vector_384.sql` en pgAdmin.

**`Unauthorized 401` al hacer login**
→ El usuario no existe en la BD. Ejecuta `python manage.py createsuperuser`.

**El chat no devuelve resultados**
→ Las tesis no tienen embeddings. Registra un proyecto con PDF para que el sistema genere los vectores.

**`torch` falla al instalar**
→ Instala primero la version CPU:
```bash
pip install torch --index-url https://download.pytorch.org/whl/cpu
```

**El modelo tarda en cargar la primera vez**
→ Normal. `sentence-transformers` descarga el modelo (~100 MB) la primera vez. Las siguientes usan el cache local.
En producción, ejecuta una vez `python manage.py warm_rag_model` después de instalar dependencias y configura
`RAG_PRELOAD_EMBEDDINGS=True` en `Backend/.env` para cargarlo al iniciar Waitress.

**`nmake` no se reconoce al compilar pgvector**
→ Abrir el **"Developer Command Prompt for VS 2022"** desde el menu inicio en lugar de PowerShell normal.
