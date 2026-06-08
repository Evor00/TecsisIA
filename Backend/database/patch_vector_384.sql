-- ============================================================
--  PATCH: Cambiar dimensión del vector de 1536 → 384
--  Modelo: paraphrase-multilingual-MiniLM-L12-v2 (384 dims)
--  Ejecutar en pgAdmin ANTES de subir el primer PDF.
-- ============================================================
SET search_path TO tecsisai, public;

-- 1. Eliminar índice HNSW existente (cualquier nombre posible)
DROP INDEX IF EXISTS idx_documentos_embedding;
DROP INDEX IF EXISTS idx_rag_embedding_hnsw;

-- 2. Cambiar dimensión (los embeddings existentes eran NULL, no hay pérdida)
ALTER TABLE documentos_rag
    ALTER COLUMN embedding TYPE vector(384) USING NULL;

-- 3. Recrear índice HNSW con la nueva dimensión
CREATE INDEX idx_documentos_embedding
    ON documentos_rag
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Verificar
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'tecsisai' AND table_name = 'documentos_rag';
