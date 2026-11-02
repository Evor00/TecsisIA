import os, sys
import django
sys.path.append(r'D:\TecsisAi-2\Backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_backend.settings')
django.setup()

from rag_api.models import Conversacion, Mensaje, LogConsulta, Usuario

print("Total usuarios:", Usuario.objects.count())
for u in Usuario.objects.all():
    print(f"  User {u.id}: {u.email} ({u.nombre})")

print("\nTotal conversaciones en BD:", Conversacion.objects.count())
for c in Conversacion.objects.all()[:10]:
    print(f"  Conv {c.id} | user_id: {c.usuario_id} | titulo: {c.titulo} | msgs: {c.mensajes.count()}")

print("\nTotal log_consultas:", LogConsulta.objects.count())
for l in LogConsulta.objects.all().order_by('-fecha')[:5]:
    print(f"  Log {l.id} | user_id: {l.usuario_id} | prompt: {l.prompt_ingresado[:40]}")
