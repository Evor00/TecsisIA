-- ============================================================
--  PATCH: Columnas extra en la tabla tesis
--  Ejecutar DESPUÉS de tecsisai_schema.sql
-- ============================================================
SET search_path TO tecsisai, public;

ALTER TABLE tesis
    ADD COLUMN IF NOT EXISTS grupo           VARCHAR(50),
    ADD COLUMN IF NOT EXISTS tecnologias     JSONB          NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS similitud_maxima NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS score           VARCHAR(10);

-- Rellenar los registros de prueba del seed
UPDATE tesis SET grupo = 'Grupo Alpha', tecnologias = '["React","Spring Boot","PostgreSQL"]', similitud_maxima = 88, score = '94/100' WHERE codigo = 'C24-001';
UPDATE tesis SET grupo = 'Grupo Beta',  tecnologias = '["Flutter","FastAPI","MongoDB"]',      similitud_maxima = 32, score = NULL    WHERE codigo = 'C24-002';
UPDATE tesis SET grupo = 'Grupo Gamma', tecnologias = '["React","Node.js","Firebase"]',       similitud_maxima = 61, score = NULL    WHERE codigo = 'C24-003';
UPDATE tesis SET grupo = 'Grupo Delta', tecnologias = '["Vue.js","Spring Boot","MySQL"]',     similitud_maxima = 45, score = '87/100' WHERE codigo = 'C24-004';
UPDATE tesis SET grupo = 'Grupo Epsilon',tecnologias = '["React","FastAPI","PostgreSQL"]',    similitud_maxima = 28, score = NULL    WHERE codigo = 'C24-005';
UPDATE tesis SET grupo = 'Grupo Zeta',  tecnologias = '["Angular","Spring Boot","Oracle"]',   similitud_maxima = 82, score = NULL    WHERE codigo = 'C24-006';

-- Verificar
SELECT codigo, grupo, tecnologias, similitud_maxima, score FROM tesis ORDER BY id;
