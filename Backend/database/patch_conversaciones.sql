-- ============================================================
--  TecSis-IA · Patch: Persistencia de conversaciones del chat IA
--  Ejecutar en pgAdmin/DBeaver sobre la base de datos tecsisai.
--  Crea las tablas conversaciones y mensajes (historial navegable),
--  separadas de log_consultas (que es solo auditoría analítica).
-- ============================================================

SET search_path TO tecsisai, public;

-- ─── conversaciones ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversaciones (
    id          SERIAL       PRIMARY KEY,
    usuario_id  INTEGER      REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo      VARCHAR(200) NOT NULL DEFAULT 'Nueva conversación',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  conversaciones        IS 'Hilos de conversación del asistente RAG, navegables desde el panel.';
COMMENT ON COLUMN conversaciones.titulo IS 'Título corto; se autogenera con las primeras palabras del primer mensaje.';

-- ─── mensajes ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mensajes (
    id               SERIAL       PRIMARY KEY,
    conversacion_id  INTEGER      NOT NULL REFERENCES conversaciones(id) ON DELETE CASCADE,
    rol              VARCHAR(12)  NOT NULL DEFAULT 'user',  -- 'user' | 'assistant'
    contenido        TEXT         NOT NULL,
    -- Snapshot JSON de los documentos similares mostrados en este mensaje (si aplica)
    documentos       JSONB,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  mensajes            IS 'Mensajes individuales (usuario y asistente) de cada conversación.';
COMMENT ON COLUMN mensajes.documentos IS 'Documentos RAG citados en la respuesta del asistente, en formato JSON.';

-- ─── Índices ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_conv_usuario      ON conversaciones (usuario_id);
CREATE INDEX IF NOT EXISTS idx_conv_updated      ON conversaciones (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_msg_conversacion  ON mensajes       (conversacion_id, created_at);

-- ─── Trigger: refrescar updated_at de la conversación ────────
-- Reutiliza fn_set_updated_at() ya definida en el schema principal.
DROP TRIGGER IF EXISTS trg_conversaciones_updated_at ON conversaciones;
CREATE TRIGGER trg_conversaciones_updated_at
    BEFORE UPDATE ON conversaciones
    FOR EACH ROW
    EXECUTE FUNCTION fn_set_updated_at();
