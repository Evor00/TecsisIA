import os, sys
import django
sys.path.append(r'D:\TecsisAi-2\Backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_backend.settings')
django.setup()

from django.db import connection

sql_path = r'D:\TecsisAi-2\Backend\database\patch_conversaciones.sql'
with open(sql_path, 'r', encoding='utf-8') as f:
    sql = f.read()

with connection.cursor() as cur:
    cur.execute(sql)

print("SQL patch patch_conversaciones.sql executed successfully!")
