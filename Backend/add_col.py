from django.db import connection
with connection.cursor() as cursor:
    cursor.execute('ALTER TABLE tesis ADD COLUMN IF NOT EXISTS grupo VARCHAR(50);')
print('Column added')
