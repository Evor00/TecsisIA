from django.db import connection
with connection.cursor() as cursor:
    cursor.execute('SELECT * FROM log_consultas LIMIT 1;')
    columns = [col[0] for col in cursor.description]
print('Columns in log_consultas:', columns)
