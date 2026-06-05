-- ============================================================
--  TecSis-IA  ·  Script DDL + DML Completo
--  Motor    : PostgreSQL 15+  (requiere extensión pgvector)
--  Ejecutar : pgAdmin 4 / DBeaver  →  Database tecsisai
-- ============================================================


-- ════════════════════════════════════════════════════════════
--  0. EXTENSIONES
-- ════════════════════════════════════════════════════════════

-- pgvector: habilita el tipo vector y búsqueda por similitud coseno.
-- Si no está instalado: https://github.com/pgvector/pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- pgcrypto: utilidades criptográficas (gen_random_uuid disponible).
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ════════════════════════════════════════════════════════════
--  1. SCHEMA Y TIPOS ENUMERADOS
-- ════════════════════════════════════════════════════════════

CREATE SCHEMA IF NOT EXISTS tecsisai;
SET search_path TO tecsisai, public;

-- Roles posibles de un usuario del sistema
CREATE TYPE rol_usuario AS ENUM ('admin', 'docente');

-- Ciclo de vida de una tesis dentro del sistema
CREATE TYPE estado_tesis AS ENUM (
    'En Revisión',
    'Aprobada',
    'Observada',
    'Rechazada'
);


-- ════════════════════════════════════════════════════════════
--  2. TABLAS
-- ════════════════════════════════════════════════════════════

-- ─── 2.1 usuarios ────────────────────────────────────────────
CREATE TABLE usuarios (
    id              SERIAL          PRIMARY KEY,
    nombre          VARCHAR(150)    NOT NULL,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL DEFAULT 'CHANGEME',
    rol             rol_usuario     NOT NULL DEFAULT 'docente',
    codigo_docente  VARCHAR(20)     UNIQUE,
    departamento    VARCHAR(100),
    biografia       TEXT,
    estado          BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  usuarios                 IS 'Administradores y docentes que operan el sistema TecSis-IA.';
COMMENT ON COLUMN usuarios.password_hash   IS 'Hash bcrypt — nunca almacenar texto plano.';
COMMENT ON COLUMN usuarios.codigo_docente  IS 'Código institucional único, Ej: DOC-2024-047.';


-- ─── 2.2 tesis ───────────────────────────────────────────────
-- La columna "codigo" se genera automáticamente vía trigger (sección 5).
CREATE TABLE tesis (
    id              SERIAL          PRIMARY KEY,
    codigo          VARCHAR(20)     UNIQUE,                -- Ej: C24-001
    titulo          VARCHAR(350)    NOT NULL,
    autor           VARCHAR(250)    NOT NULL,
    promocion       VARCHAR(10)     NOT NULL,              -- 'C24', 'C25', …
    estado          estado_tesis    NOT NULL DEFAULT 'En Revisión',
    ruta_pdf        VARCHAR(500),                          -- Ruta relativa al servidor de archivos
    usuario_id      INTEGER         REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_subida    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  tesis           IS 'Catálogo maestro de proyectos de tesis indexados en el sistema RAG.';
COMMENT ON COLUMN tesis.codigo    IS 'Código auto-generado: {promoción}-{secuencia}, Ej: C24-001.';
COMMENT ON COLUMN tesis.ruta_pdf  IS 'Ruta relativa al directorio de almacenamiento, Ej: /docs/C24/C24-001.pdf.';


-- ─── 2.3 documentos_rag ──────────────────────────────────────
--
--  Almacena los fragmentos (chunks) de texto extraídos de cada
--  tesis y sus vectores de embedding generados por el LLM.
--
--  El tipo "vector(1536)" corresponde a modelos como:
--    · OpenAI text-embedding-3-small  → 1536 dims
--    · Mistral embed                  → 1024 dims  (ajustar)
--    · nomic-embed-text               → 768  dims  (ajustar)
--
--  Si NO se usa pgvector, comentar la línea "embedding vector(...)"
--  y descomentar "embedding JSONB" como alternativa portable.
--
CREATE TABLE documentos_rag (
    id              SERIAL          PRIMARY KEY,
    tesis_id        INTEGER         NOT NULL REFERENCES tesis(id) ON DELETE CASCADE,
    contenido_texto TEXT            NOT NULL,
    embedding       vector(1536),
    -- embedding    JSONB,          -- Alternativa sin pgvector (array de floats)
    pagina_origen   SMALLINT        NOT NULL CHECK (pagina_origen > 0),
    chunk_index     SMALLINT        NOT NULL DEFAULT 0 CHECK (chunk_index >= 0),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (tesis_id, pagina_origen, chunk_index)
);

COMMENT ON TABLE  documentos_rag               IS 'Fragmentos vectorizados de cada tesis para el motor RAG.';
COMMENT ON COLUMN documentos_rag.embedding     IS 'Vector de embedding generado por el LLM. Requiere pgvector.';
COMMENT ON COLUMN documentos_rag.pagina_origen IS 'Número de página del PDF origen del fragmento.';
COMMENT ON COLUMN documentos_rag.chunk_index   IS 'Índice del chunk dentro de la misma página.';


-- ─── 2.4 log_consultas ───────────────────────────────────────
CREATE TABLE log_consultas (
    id                  SERIAL      PRIMARY KEY,
    usuario_id          INTEGER     REFERENCES usuarios(id) ON DELETE SET NULL,
    prompt_ingresado    TEXT        NOT NULL,
    -- JSON con los documentos devueltos: [{tesis_id, titulo, similitud}, ...]
    resultado           JSONB,
    tokens_procesados   INTEGER     NOT NULL DEFAULT 0 CHECK (tokens_procesados >= 0),
    fecha               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  log_consultas                    IS 'Registro histórico de todas las consultas RAG ejecutadas.';
COMMENT ON COLUMN log_consultas.resultado          IS 'Snapshot JSON de los documentos similares encontrados.';
COMMENT ON COLUMN log_consultas.tokens_procesados  IS 'Tokens consumidos por el LLM en esta consulta.';


-- ════════════════════════════════════════════════════════════
--  3. ÍNDICES
-- ════════════════════════════════════════════════════════════

-- Índice HNSW (Hierarchical Navigable Small World) para búsqueda
-- vectorial aproximada (ANN).  Es el estándar de producción en pgvector.
-- m = 16: conectividad del grafo | ef_construction = 64: calidad de construcción.
CREATE INDEX idx_rag_embedding_hnsw
    ON documentos_rag
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Índices relacionales frecuentes
CREATE INDEX idx_tesis_estado        ON tesis         (estado);
CREATE INDEX idx_tesis_promocion     ON tesis         (promocion);
CREATE INDEX idx_tesis_usuario       ON tesis         (usuario_id);
CREATE INDEX idx_log_fecha           ON log_consultas (fecha DESC);
CREATE INDEX idx_log_usuario         ON log_consultas (usuario_id);
CREATE INDEX idx_rag_tesis           ON documentos_rag(tesis_id);


-- ════════════════════════════════════════════════════════════
--  4. FUNCIONES AUXILIARES
-- ════════════════════════════════════════════════════════════

-- ─── Función genérica para actualizar updated_at ──────────────
-- Reutilizable por cualquier trigger de la BD.
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_set_updated_at IS
    'Establece updated_at = NOW() antes de cada UPDATE. '
    'Diseñada para ser reutilizada por múltiples triggers.';


-- ─── Función para auto-generar el código de tesis ─────────────
-- Genera "C24-001", "C24-002", etc., por promoción de forma atómica.
CREATE OR REPLACE FUNCTION fn_generar_codigo_tesis()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_secuencia INTEGER;
BEGIN
    -- Cuenta cuántas tesis ya existen en esa promoción (bloqueando para evitar race conditions)
    SELECT COUNT(*) + 1
    INTO   v_secuencia
    FROM   tesis
    WHERE  promocion = NEW.promocion
    FOR UPDATE;

    NEW.codigo := NEW.promocion || '-' || LPAD(v_secuencia::TEXT, 3, '0');
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_generar_codigo_tesis IS
    'Auto-genera el código de tesis en formato {PROMOCION}-{NNN} '
    'usando el correlativo dentro de cada promoción.';


-- ─── Función del trigger de aprobación ────────────────────────
-- Se activa cuando el estado pasa de "En Revisión" a "Aprobada".
CREATE OR REPLACE FUNCTION fn_tesis_registro_aprobacion()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    -- Sólo actúa en la transición específica solicitada
    IF OLD.estado = 'En Revisión' AND NEW.estado = 'Aprobada' THEN
        NEW.updated_at = NOW();

        RAISE NOTICE
            '[TecSis-IA] Tesis aprobada → ID: % | Código: % | Título: "%" | Fecha: %',
            NEW.id,
            NEW.codigo,
            LEFT(NEW.titulo, 60),
            TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI:SS');
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_tesis_registro_aprobacion IS
    'Sello de tiempo y notificación cuando una tesis pasa '
    'de "En Revisión" a "Aprobada". Parte del workflow de revisión.';


-- ════════════════════════════════════════════════════════════
--  5. TRIGGERS
-- ════════════════════════════════════════════════════════════

-- ─── Trigger genérico updated_at → usuarios ───────────────────
CREATE TRIGGER trg_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION fn_set_updated_at();

-- ─── Trigger genérico updated_at → tesis ─────────────────────
-- Aplica a cualquier UPDATE que no sea la transición de aprobación
-- (que tiene su propio trigger dedicado a continuación).
CREATE TRIGGER trg_tesis_updated_at
    BEFORE UPDATE ON tesis
    FOR EACH ROW
    WHEN (OLD.estado IS NOT DISTINCT FROM NEW.estado)   -- No es cambio de estado
    EXECUTE FUNCTION fn_set_updated_at();

-- ─── Trigger de aprobación: "En Revisión" → "Aprobada" ────────
--  · Se dispara ÚNICAMENTE cuando la columna "estado" cambia.
--  · La función interna verifica la transición específica.
CREATE TRIGGER trg_tesis_aprobacion
    BEFORE UPDATE OF estado ON tesis
    FOR EACH ROW
    EXECUTE FUNCTION fn_tesis_registro_aprobacion();

-- ─── Trigger auto-código de tesis ────────────────────────────
CREATE TRIGGER trg_tesis_generar_codigo
    BEFORE INSERT ON tesis
    FOR EACH ROW
    WHEN (NEW.codigo IS NULL)           -- Solo si no se proporcionó manualmente
    EXECUTE FUNCTION fn_generar_codigo_tesis();


-- ════════════════════════════════════════════════════════════
--  6. STORED PROCEDURES Y FUNCIONES DE NEGOCIO
-- ════════════════════════════════════════════════════════════

-- ─── sp_obtener_metricas_dashboard ───────────────────────────
--
--  Devuelve en UNA sola llamada todas las métricas del panel
--  administrativo, evitando múltiples roundtrips desde Django.
--
--  Uso:
--      SELECT * FROM sp_obtener_metricas_dashboard();
--
CREATE OR REPLACE FUNCTION sp_obtener_metricas_dashboard()
RETURNS TABLE (
    total_tesis         BIGINT,
    total_aprobadas     BIGINT,
    total_en_revision   BIGINT,
    total_observadas    BIGINT,
    total_rechazadas    BIGINT,
    consultas_este_mes  BIGINT,
    tokens_mes          BIGINT,
    alertas_similitud   BIGINT    -- consultas que devolvieron similitud > 80%
)
LANGUAGE plpgsql
STABLE                            -- No modifica datos; el planificador puede cachearlo
AS $$
BEGIN
    RETURN QUERY
    SELECT
        -- ── Métricas de tesis ────────────────────────────────
        COUNT(*)                                                AS total_tesis,
        COUNT(*) FILTER (WHERE t.estado = 'Aprobada')         AS total_aprobadas,
        COUNT(*) FILTER (WHERE t.estado = 'En Revisión')      AS total_en_revision,
        COUNT(*) FILTER (WHERE t.estado = 'Observada')        AS total_observadas,
        COUNT(*) FILTER (WHERE t.estado = 'Rechazada')        AS total_rechazadas,
        -- ── Métricas de uso del LLM (mes actual) ────────────
        (
            SELECT COUNT(*)
            FROM   log_consultas
            WHERE  DATE_TRUNC('month', fecha) = DATE_TRUNC('month', NOW())
        )                                                       AS consultas_este_mes,
        (
            SELECT COALESCE(SUM(tokens_procesados), 0)
            FROM   log_consultas
            WHERE  DATE_TRUNC('month', fecha) = DATE_TRUNC('month', NOW())
        )                                                       AS tokens_mes,
        -- Alertas: consultas donde el resultado JSON tiene similitud > 0.80
        (
            SELECT COUNT(*)
            FROM   log_consultas
            WHERE  DATE_TRUNC('month', fecha) = DATE_TRUNC('month', NOW())
            AND    resultado IS NOT NULL
            AND    EXISTS (
                       SELECT 1
                       FROM   jsonb_array_elements(resultado) AS elem
                       WHERE  (elem->>'similitud')::NUMERIC > 80
                   )
        )                                                       AS alertas_similitud
    FROM tesis t;
END;
$$;

COMMENT ON FUNCTION sp_obtener_metricas_dashboard IS
    'Retorna el resumen completo del Dashboard en una sola llamada. '
    'Incluye conteos por estado de tesis y métricas de uso del LLM del mes.';


-- ─── sp_registrar_nueva_tesis ────────────────────────────────
--
--  Registra una nueva tesis con estado inicial "En Revisión".
--  El código (Ej: C24-007) se genera automáticamente.
--
--  Uso desde psql / pgAdmin:
--      CALL sp_registrar_nueva_tesis(
--          'Mi Tesis de Prueba',
--          'Juan Perez · Ana Gomez',
--          'C24',
--          '/docs/C24/mi_tesis.pdf',
--          1
--      );
--
--  Uso desde Python / Django (con psycopg2):
--      cursor.callproc('tecsisai.sp_registrar_nueva_tesis', [titulo, autor, ...])
--
CREATE OR REPLACE PROCEDURE sp_registrar_nueva_tesis(
    IN  p_titulo        VARCHAR(350),
    IN  p_autor         VARCHAR(250),
    IN  p_promocion     VARCHAR(10),
    IN  p_ruta_pdf      VARCHAR(500)    DEFAULT NULL,
    IN  p_usuario_id    INTEGER         DEFAULT NULL,
    OUT p_tesis_id      INTEGER,
    OUT p_codigo        VARCHAR(20)
)
LANGUAGE plpgsql AS $$
BEGIN
    -- Validaciones básicas
    IF TRIM(p_titulo) = '' THEN
        RAISE EXCEPTION 'El título de la tesis no puede estar vacío.';
    END IF;
    IF TRIM(p_autor) = '' THEN
        RAISE EXCEPTION 'El campo autor no puede estar vacío.';
    END IF;
    IF TRIM(p_promocion) = '' THEN
        RAISE EXCEPTION 'La promoción no puede estar vacía (Ej: C24).';
    END IF;

    -- Inserción — el trigger trg_tesis_generar_codigo asigna el código
    INSERT INTO tesis (titulo, autor, promocion, ruta_pdf, usuario_id)
    VALUES (
        TRIM(p_titulo),
        TRIM(p_autor),
        UPPER(TRIM(p_promocion)),
        p_ruta_pdf,
        p_usuario_id
    )
    RETURNING id, codigo
    INTO p_tesis_id, p_codigo;

    RAISE NOTICE '[TecSis-IA] Nueva tesis registrada → ID: % | Código: % | Estado: En Revisión',
                 p_tesis_id, p_codigo;
END;
$$;

COMMENT ON PROCEDURE sp_registrar_nueva_tesis IS
    'Registra una tesis nueva con estado "En Revisión". '
    'El código (C24-NNN) se auto-genera por trigger. '
    'Retorna el ID y el código asignado como parámetros OUT.';


-- ════════════════════════════════════════════════════════════
--  7. SEED DATA — Datos de prueba realistas (Promoción C24)
-- ════════════════════════════════════════════════════════════

-- ─── 7.1 Usuarios ─────────────────────────────────────────────
INSERT INTO usuarios (nombre, email, password_hash, rol, codigo_docente, departamento, biografia) VALUES
(
    'Jaime Gomez Quispe',
    'j.gomez@tecsis.edu.pe',
    '$2b$12$placeholder_hash_admin',
    'admin',
    'DOC-2024-047',
    'Ing. de Software',
    'Docente de la carrera de Diseño y Desarrollo de Software con especialización en arquitectura de sistemas distribuidos y análisis semántico de documentos académicos.'
),
(
    'Rosa Mendez Paredes',
    'r.mendez@tecsis.edu.pe',
    '$2b$12$placeholder_hash_docente1',
    'docente',
    'DOC-2024-012',
    'Ing. de Software',
    'Especialista en bases de datos relacionales y modelado de datos para aplicaciones empresariales.'
),
(
    'Carlos Vera Leon',
    'c.vera@tecsis.edu.pe',
    '$2b$12$placeholder_hash_docente2',
    'docente',
    'DOC-2024-033',
    'Desarrollo Web',
    'Docente de tecnologías front-end modernas y metodologías ágiles de desarrollo de software.'
);

-- ─── 7.2 Tesis (el código C24-00N se genera automáticamente) ──
INSERT INTO tesis (titulo, autor, promocion, estado, ruta_pdf, usuario_id) VALUES
(
    'Sistema de Gestión de Inventarios Cloud con React y Spring Boot',
    'K. Quispe · M. Torres · L. Ramos',
    'C24', 'Aprobada',
    '/docs/C24/C24-001_inventarios_cloud.pdf',
    1
),
(
    'Plataforma de Telemedicina con IA — Flutter y FastAPI',
    'A. Mendoza · R. Ccori',
    'C24', 'En Revisión',
    '/docs/C24/C24-002_telemedicina_ia.pdf',
    1
),
(
    'App de Delivery con Seguimiento GPS — React y Node.js',
    'P. Solis · N. Huanca · C. Vargas',
    'C24', 'Observada',
    '/docs/C24/C24-003_delivery_gps.pdf',
    2
),
(
    'Sistema ERP para PYMEs con Vue.js y Spring Boot',
    'F. Paredes · J. Llanos',
    'C24', 'Aprobada',
    '/docs/C24/C24-004_erp_pymes.pdf',
    2
),
(
    'Chatbot de Atención al Cliente con NLP — React y FastAPI',
    'D. Cueva · B. Arce · S. Puma',
    'C24', 'En Revisión',
    '/docs/C24/C24-005_chatbot_nlp.pdf',
    1
),
(
    'Control de Almacén con RFID — Angular y Spring Boot',
    'E. Valois · G. Cruz',
    'C24', 'Rechazada',
    '/docs/C24/C24-006_almacen_rfid.pdf',
    3
);

-- ─── 7.3 Fragmentos RAG ───────────────────────────────────────
-- Los embeddings se insertan NULL — el pipeline de indexación
-- (LangChain / LlamaIndex) los rellenará al procesar los PDFs.
INSERT INTO documentos_rag (tesis_id, contenido_texto, pagina_origen, chunk_index) VALUES
(
    1,
    'El sistema implementa una arquitectura de microservicios usando Spring Boot 3.1 para el backend y React 18 para la interfaz de usuario. Los contenedores Docker orquestan los servicios de inventario, autenticación y notificaciones de forma independiente.',
    1, 0
),
(
    1,
    'La base de datos relacional PostgreSQL 15 almacena los movimientos de inventario con soporte para múltiples almacenes, categorías de productos y proveedores. Se utiliza Flyway para la gestión de migraciones.',
    3, 0
),
(
    2,
    'La plataforma de telemedicina integra modelos de IA para la clasificación automática de síntomas utilizando una API REST en FastAPI. El cliente móvil multiplataforma fue desarrollado con Flutter 3.16, permitiendo videollamadas entre pacientes y médicos.',
    1, 0
),
(
    4,
    'El módulo de contabilidad del ERP gestiona facturación electrónica conforme a la normativa SUNAT vigente. Se implementó con Vue.js 3 (Composition API) y Spring Boot, aplicando el patrón CQRS para separar lecturas de escrituras.',
    2, 0
),
(
    5,
    'El chatbot utiliza modelos transformer fine-tuned con datos de atención al cliente en español para clasificar intenciones y generar respuestas contextuales. El pipeline NLP combina FastAPI con LangChain y ChromaDB como vector store local.',
    1, 0
);

-- ─── 7.4 Log de consultas ─────────────────────────────────────
INSERT INTO log_consultas (usuario_id, prompt_ingresado, resultado, tokens_procesados, fecha) VALUES
(
    1,
    'sistemas web con React y Spring Boot',
    '[{"tesis_id": 1, "titulo": "Sistema de Gestión de Inventarios Cloud", "similitud": 88}, {"tesis_id": 3, "titulo": "App de Delivery con Seguimiento GPS", "similitud": 74}]'::JSONB,
    1240,
    NOW() - INTERVAL '1 day'
),
(
    1,
    'aplicaciones móviles Flutter para el sector salud',
    '[{"tesis_id": 2, "titulo": "Plataforma de Telemedicina con IA", "similitud": 91}]'::JSONB,
    980,
    NOW() - INTERVAL '2 days'
),
(
    2,
    'plataformas e-learning con arquitectura de microservicios',
    '[{"tesis_id": 1, "titulo": "Sistema de Gestión de Inventarios Cloud", "similitud": 62}, {"tesis_id": 4, "titulo": "Sistema ERP para PYMEs", "similitud": 55}]'::JSONB,
    1560,
    NOW() - INTERVAL '3 days'
),
(
    1,
    'API RESTful con Node.js y MongoDB para control de activos',
    '[]'::JSONB,
    870,
    NOW() - INTERVAL '4 days'
),
(
    3,
    'dashboard analítico con Python FastAPI y React',
    '[{"tesis_id": 5, "titulo": "Chatbot de Atención al Cliente con NLP", "similitud": 67}]'::JSONB,
    1120,
    NOW() - INTERVAL '5 days'
),
(
    2,
    'sistemas de matrícula universitaria con Vue.js',
    '[{"tesis_id": 4, "titulo": "Sistema ERP para PYMEs", "similitud": 79}, {"tesis_id": 3, "titulo": "App de Delivery con Seguimiento GPS", "similitud": 61}]'::JSONB,
    1340,
    NOW() - INTERVAL '7 days'
),
(
    1,
    'IoT con Raspberry Pi para monitoreo ambiental en tiempo real',
    '[]'::JSONB,
    760,
    NOW() - INTERVAL '9 days'
);


-- ════════════════════════════════════════════════════════════
--  8. VERIFICACIÓN — Ejecutar luego del script para validar
-- ════════════════════════════════════════════════════════════

-- 8.1 Estructura de tablas creadas
SELECT table_name
FROM   information_schema.tables
WHERE  table_schema = 'tecsisai'
ORDER  BY table_name;

-- 8.2 Tesis con códigos auto-generados
SELECT id, codigo, titulo, promocion, estado
FROM   tesis
ORDER  BY id;

-- 8.3 Dashboard en una sola llamada
SELECT * FROM sp_obtener_metricas_dashboard();

-- 8.4 Simular registro de nueva tesis vía procedure
CALL sp_registrar_nueva_tesis(
    'Despliegue Automatizado con Docker y Django en AWS',
    'L. Flores · M. Quispe',
    'C24',
    '/docs/C24/C24-007_docker_django_aws.pdf',
    1
);

-- 8.5 Simular transición "En Revisión" → "Aprobada" (activa el trigger)
-- UPDATE tesis SET estado = 'Aprobada' WHERE codigo = 'C24-002';
-- Verificar: SELECT codigo, estado, updated_at FROM tesis WHERE codigo = 'C24-002';

-- 8.6 Búsqueda vectorial de similitud coseno (cuando embeddings estén cargados)
-- SELECT
--     t.titulo,
--     t.autor,
--     1 - (d.embedding <=> '[0.02, 0.15, ...]'::vector) AS similitud_coseno
-- FROM   documentos_rag d
-- JOIN   tesis t ON t.id = d.tesis_id
-- ORDER  BY d.embedding <=> '[0.02, 0.15, ...]'::vector
-- LIMIT  5;
