from django.db import connection
with connection.cursor() as cursor:
    cursor.execute('SELECT * FROM usuarios LIMIT 1;')
    columns = [col[0] for col in cursor.description]
print('Columns in usuarios:', columns)
