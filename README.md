# TecSis-IA

Plataforma web de gestión documental y búsqueda semántica de tesis para la carrera de Diseño y Desarrollo de Software. Combina un panel administrativo en React con un motor de Inteligencia Artificial local (RAG) que permite realizar consultas en lenguaje natural sobre el repositorio de proyectos.

---

## Requisitos previos

Antes de instalar, asegúrate de tener lo siguiente:

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| Python | 3.11+ | https://www.python.org/downloads/ |
| Node.js | 18+ | https://nodejs.org/ |
| PostgreSQL | 15+ | https://www.postgresql.org/download/ |
| pgvector | 0.7+ | https://github.com/pgvector/pgvector |
| pgAdmin 4 | cualquiera | incluido con PostgreSQL |

> **Windows**: durante la instalación de PostgreSQL, anota bien la contraseña que le pones al usuario `postgres`. La necesitarás más adelante.

---

## 1. Instalar la extensión pgvector

pgvector es la extensión de PostgreSQL que permite almacenar y buscar vectores de embedding. Sin ella el sistema no funciona.

**Opción A — Instalador precompilado (Windows, recomendado):**

1. Ve a https://github.com/pgvector/pgvector/releases
2. Descarga el archivo `.zip` que corresponda a tu versión de PostgreSQL (Ej: `pgvector-pg15-win.zip`)
3. Copia `vector.dll` a `C:\Program Files\PostgreSQL\15\lib\`
4. Copia `vector.control` y los archivos `vector--*.sql` a `C:\Program Files\PostgreSQL\15\share\extension\`
5. Reinicia el servicio de PostgreSQL desde el Administrador de servicios de Windows

**Verificar que está disponible:**

```sql
-- Ejecutar en pgAdmin
SELECT * FROM pg_available_extensions WHERE name = 'vector';
-- Debe aparecer una fila
```

---

## 2. Configurar la base de datos

### 2.1 Crear la base de datos

Abre pgAdmin 4, conecta al servidor local y ejecuta:

```sql
CREATE DATABASE tecsisai
    ENCODING = 'UTF8'
    LC_COLLATE = 'es_PE.UTF-8'
    LC_CTYPE   = 'es_PE.UTF-8';
```

> Si el locale `es_PE.UTF-8` no está disponible en tu sistema, usa `C` como alternativa:
> ```sql
> CREATE DATABASE tecsisai ENCODING = 'UTF8' TEMPLATE = template0;
> ```

### 2.2 Ejecutar el schema principal

En pgAdmin, conecta a la base de datos `tecsisai` y abre el archivo:

```
Backend/database/tecsisai_schema.sql
```

Ejecútalo completo (F5 o botón "Execute"). Este script crea:
- Schema `tecsisai` y sus tablas (`usuarios`, `tesis`, `documentos_rag`, `log_consultas`)
- Triggers (auto-código de tesis, updated_at)
- Stored procedure `sp_obtener_metricas_dashboard()`
- Datos de prueba iniciales (3 usuarios, 6 tesis, logs de consulta)

### 2.3 Aplicar el parche de vectores

El schema original usa `vector(1536)` (dimensión OpenAI). El modelo de IA local que usa este proyecto genera vectores de 384 dimensiones. Ejecuta el parche:

```
Backend/database/patch_vector_384.sql
```

Esto modifica la columna `embedding` a `vector(384)` y recrea el índice HNSW.

### 2.4 Aplicar el parche de constraint de abstract

**Este paso es obligatorio.** El schema original limita `pagina_origen > 0`, pero el sistema usa el valor `0` para almacenar el resumen/abstract de proyectos registrados manualmente. Sin este parche, registrar un proyecto con resumen lanzará un error de PostgreSQL.

```
Backend/database/patch_abstract_constraint.sql
```

### 2.6 (Opcional) Cargar datos extra

Para tener más tesis de demostración, ejecuta:

```
Backend/database/seed_datos_extra.sql
```

Agrega 10 tesis adicionales (C24-007 a C24-016) y más entradas en el historial de consultas.

### 2.7 (Opcional) Aplicar parche de columnas adicionales

Si algunas columnas como `grupo`, `tecnologias`, `similitud_maxima` o `score` no están en tu schema, ejecuta:

```
Backend/database/patch_columnas_tesis.sql
```

---

## 3. Configurar el backend (Django)

### 3.1 Crear el entorno virtual

```bash
cd Backend
python -m venv venv
```

Activar el entorno:

```bash
# Windows PowerShell
venv\Scripts\Activate.ps1

# Windows CMD
venv\Scripts\activate.bat

# Linux / macOS
source venv/bin/activate
```

### 3.2 Instalar dependencias

```bash
pip install -r requirements.txt
```

> La primera instalación descarga `torch` y `sentence-transformers` (~1 GB). Ten paciencia.
> Si `torch` falla en Windows, instálalo manualmente primero:
> ```bash
> pip install torch --index-url https://download.pytorch.org/whl/cpu
> ```

### 3.3 Configurar la conexión a PostgreSQL

Abre `Backend/core_backend/settings.py` y edita el bloque `DATABASES`:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'tecsisai',     # nombre de la base de datos
        'USER': 'postgres',     # usuario de PostgreSQL
        'PASSWORD': 'TU_CONTRASEÑA',  # <-- cambia esto
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### 3.4 Ejecutar el servidor Django

```bash
# Desde la carpeta Backend/ con el venv activado
python manage.py migrate
python manage.py runserver
```

El backend quedará corriendo en `http://localhost:8000`.

> **Nota**: `migrate` solo aplica las migraciones de Django (sesiones, admin, etc.). Las tablas del proyecto ya las creaste con el SQL del paso 2.

---

## 4. Configurar el frontend (React + Vite)

### 4.1 Instalar dependencias

```bash
cd Frontend/frontend_admin
npm install
```

### 4.2 Iniciar el servidor de desarrollo

```bash
npm run dev
```

El frontend estará disponible en `http://localhost:5173`.

> Vite redirige automáticamente `/api/*` al backend en `localhost:8000`, por lo que no necesitas cambiar ninguna URL.

---

## 5. Verificar que todo funciona

Con ambos servidores corriendo, abre `http://localhost:5173` y comprueba:

1. **Dashboard** — Deben aparecer las métricas (total tesis, aprobadas, en revisión, etc.)
2. **Proyectos** — Deben listarse las 6+ tesis del seed data con sus estados
3. **Chat IA** — Escribe `lista de tesis registradas` y deben aparecer los proyectos
4. **Historial** — Deben aparecer las consultas registradas en `log_consultas`

---

## 6. Cómo usar las funciones principales

### Registrar un proyecto con XML

1. Ve a la sección **Proyectos**
2. Clic en **Registrar proyecto**
3. Clic en **XML — autocompletar** y selecciona `Backend/database/proyecto_demo.xml`
4. Los campos se llenan automáticamente
5. Opcionalmente adjunta un PDF para indexar su contenido completo
6. Clic en **Registrar proyecto**

### Subir un PDF para búsqueda semántica

Al registrar un proyecto, adjunta el PDF en el modal. El sistema:
1. Registra la tesis en la base de datos
2. Extrae el texto del PDF página por página con `pypdf`
3. Genera embeddings con `paraphrase-multilingual-MiniLM-L12-v2` (modelo local, sin costo de API)
4. Almacena los vectores en PostgreSQL con pgvector

### Buscar en lenguaje natural

El chat soporta:
- Consultas de listado: `muéstrame todas las tesis`, `lista de proyectos aprobados`
- Búsqueda semántica: `sistemas de gestión con microservicios`, `aplicaciones móviles para salud`
- El motor calcula similitud coseno contra los embeddings almacenados en pgvector

---

## 7. Estructura del proyecto

```
TecsisAi/
├── Backend/
│   ├── core_backend/         # Configuración Django (settings, urls)
│   ├── rag_api/              # App principal: modelos, vistas, urls
│   ├── database/             # Scripts SQL
│   │   ├── tecsisai_schema.sql      # Schema completo + seed data
│   │   ├── patch_vector_384.sql     # Ajuste de dimensión de embeddings
│   │   ├── patch_columnas_tesis.sql # Columnas adicionales (grupo, tecnologias)
│   │   ├── seed_datos_extra.sql     # 10 tesis adicionales para demo
│   │   └── proyecto_demo.xml        # XML de ejemplo para importar
│   ├── requirements.txt
│   └── manage.py
└── Frontend/
    └── frontend_admin/
        ├── src/
        │   └── App.jsx       # Toda la UI (panel, chat, modales)
        ├── vite.config.js    # Proxy /api → localhost:8000
        └── package.json
```

---

## 8. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite 8 + Tailwind CSS 4 |
| Backend | Django 6 + Django REST Framework 3.17 |
| Base de datos | PostgreSQL 15 + pgvector |
| Modelo de IA | `paraphrase-multilingual-MiniLM-L12-v2` (384 dims, local) |
| Extracción PDF | pypdf |
| Búsqueda vectorial | pgvector con índice HNSW y distancia coseno |

---

## 9. Solución de problemas comunes

**`django.db.utils.OperationalError: connection refused`**
→ PostgreSQL no está corriendo. Verifica el servicio en el Administrador de servicios de Windows.

**`extension "vector" does not exist`**
→ No está instalado pgvector. Sigue el paso 1.

**`ERROR: column "embedding" is of type vector(1536) but expression is of type vector(384)`**
→ No aplicaste el parche. Ejecuta `Backend/database/patch_vector_384.sql` en pgAdmin.

**El chat no devuelve resultados al buscar temas**
→ Las tesis no tienen embeddings. Registra un proyecto con PDF para que el sistema genere los vectores, o agrega texto al campo "Resumen" al registrar manualmente.

**`torch` falla al instalar en Windows**
→ Instala primero la versión CPU: `pip install torch --index-url https://download.pytorch.org/whl/cpu`, luego vuelve a ejecutar `pip install -r requirements.txt`.

**El modelo de IA tarda en cargar la primera vez**
→ Normal. `sentence-transformers` descarga el modelo (~100 MB) la primera vez que se hace una consulta. Las siguientes veces usa el caché local.
