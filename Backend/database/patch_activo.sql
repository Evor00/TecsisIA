-- ============================================================
--  TecSis-IA · Patch: Campo activo en tesis (EP-03)
--  Permite activar/desactivar un proyecto sin eliminarlo.
--  Los proyectos inactivos no aparecen en búsquedas RAG.
-- ============================================================

SET search_path TO tecsisai, public;

ALTER TABLE tesis
    ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;

-- Índice para filtrar activos en queries RAG
CREATE INDEX IF NOT EXISTS idx_tesis_activo ON tesis (activo);

-- Verificación
SELECT id, codigo, titulo, activo FROM tesis ORDER BY id;
