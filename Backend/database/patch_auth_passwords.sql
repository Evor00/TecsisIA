-- ============================================================
--  TecSis-IA · Patch: Contraseñas iniciales para autenticación
--  Ejecutar en pgAdmin/DBeaver sobre la base de datos tecsisai.
--  Establece password_hash compatible con Django PBKDF2SHA256.
--  Contraseña por defecto: tecsup2024
--  CAMBIAR ANTES DE PRODUCCIÓN.
-- ============================================================

SET search_path TO tecsisai, public;

-- Actualiza todos los usuarios que aún tienen un placeholder (schema.sql inserta
-- '$2b$12$placeholder_hash_*', que no es un hash Django válido para autenticar)
UPDATE usuarios
SET password_hash = 'pbkdf2_sha256$1200000$rv4KxTfJvzNTnYdemXGeyO$2eWkpyJeOMi0RfybfCD15Z/B0Xz5lpZjHvyZf+9bEIU='
WHERE password_hash = 'CHANGEME'
   OR password_hash IS NULL
   OR password_hash = ''
   OR password_hash LIKE '$2b$12$placeholder%';

-- Verificación
SELECT id, nombre, email, rol, LEFT(password_hash, 20) AS hash_preview
FROM usuarios;
