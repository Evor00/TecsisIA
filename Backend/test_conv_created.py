import os, sys
import django
sys.path.append(r'D:\TecsisAi-2\Backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_backend.settings')
django.setup()

from rag_api.models import Conversacion, Mensaje, Usuario

print("Conversaciones count:", Conversacion.objects.count())
print("Mensajes count:", Mensaje.objects.count())

# Let's create a test conversation to verify full persistence
user = Usuario.objects.filter(email__iexact='enrique.oporto@tecsup.edu.pe').first()
if user:
    c = Conversacion.objects.create(usuario_id=user.id, titulo='Consulta sobre Sistemas IoT')
    Mensaje.objects.create(conversacion=c, rol='user', contenido='¿Qué tesis tratan sobre IoT y Raspberry Pi?')
    Mensaje.objects.create(conversacion=c, rol='assistant', contenido='La tesis C24-101 aborda monitoreo IoT con Raspberry Pi.')
    print(f"Created sample conversation ID: {c.id} for user: {user.email}")
