from django.db import connection
with connection.cursor() as cursor:
    cursor.execute("ALTER TABLE tesis ADD COLUMN IF NOT EXISTS tecnologias JSONB DEFAULT '[]'::jsonb;")
    cursor.execute("ALTER TABLE tesis ADD COLUMN IF NOT EXISTS similitud_maxima DECIMAL(5,2);")
    cursor.execute("ALTER TABLE tesis ADD COLUMN IF NOT EXISTS score VARCHAR(10);")
    cursor.execute("ALTER TABLE tesis ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;")
print('Added missing columns to tesis table.')
