-- ============================================================
--  PATCH: Permitir pagina_origen = 0 en documentos_rag
--  El valor 0 se usa como sentinel para el resumen/abstract
--  de un proyecto registrado manualmente (sin PDF).
--  Ejecutar DESPUÉS de tecsisai_schema.sql y patch_vector_384.sql
-- ============================================================
SET search_path TO tecsisai, public;

-- Eliminar el constraint antiguo (pagina_origen > 0)
ALTER TABLE documentos_rag
    DROP CONSTRAINT IF EXISTS documentos_rag_pagina_origen_check;

-- Agregar constraint nuevo que permite 0 (abstract) y números de página reales
ALTER TABLE documentos_rag
    ADD CONSTRAINT documentos_rag_pagina_origen_check
    CHECK (pagina_origen >= 0);

-- Verificar
SELECT conname, pg_get_constraintdef(oid)
FROM   pg_constraint
WHERE  conrelid = 'tecsisai.documentos_rag'::regclass
AND    contype  = 'c';
