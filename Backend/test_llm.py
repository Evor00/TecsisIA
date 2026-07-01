"""
Script de prueba de conexión al motor de IA local del instituto (OpenWebUI).
Equivalente a tdgpt_ia/src/test_model_api_rest.py, pero usando la config de Django.

Ejecutar desde la carpeta Backend/ (con el venv activado o usando venv/Scripts/python):

    venv/Scripts/python test_llm.py
    venv/Scripts/python test_llm.py "¿Qué tesis hay sobre React?"

Requiere que Backend/.env tenga OPENWEBUI_TOKEN completado (desde la red del instituto).
"""
import os
import sys
import django

# La consola de Windows usa cp1252 por defecto; forzamos UTF-8 para los acentos/emojis.
try:
    sys.stdout.reconfigure(encoding='utf-8')
except (AttributeError, ValueError):
    pass

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_backend.settings')
django.setup()

from django.conf import settings  # noqa: E402
from rag_api import llm_client     # noqa: E402


def main():
    prompt = sys.argv[1] if len(sys.argv) > 1 else 'Hola, ¿puedes confirmar que estás funcionando?'

    print('─' * 60)
    print(f'  URL    : {settings.OPENWEBUI_URL}')
    print(f'  MODELO : {settings.OPENWEBUI_MODEL}')
    print(f'  TOKEN  : {"configurado ✓" if settings.OPENWEBUI_TOKEN else "VACÍO ✗ (completa OPENWEBUI_TOKEN en .env)"}')
    print('─' * 60)
    print(f'  PROMPT : {prompt}')
    print('─' * 60)

    if not llm_client.is_configured():
        print('\n⚠️  No hay token configurado. Edita Backend/.env y agrega OPENWEBUI_TOKEN.')
        print('   (El token se obtiene en OpenWebUI → Configuración → Cuenta → Claves API)')
        sys.exit(1)

    # Contexto de ejemplo (en producción lo aporta la búsqueda RAG con pgvector)
    contexto_demo = [
        '[Sistema de Gestión de Inventarios Cloud — K. Quispe]\n'
        'Arquitectura de microservicios con Spring Boot 3.1 y React 18, orquestada con Docker.',
    ]

    try:
        respuesta = llm_client.generate_answer(prompt, contexto_demo)
        print('\n✅ RESPUESTA DEL MODELO:\n')
        print(respuesta)
        print('\n' + '─' * 60)
        print('Conexión exitosa. El panel ya puede generar respuestas reales.')
    except llm_client.LLMUnavailableError as e:
        print(f'\n❌ Error de conexión con el motor de IA local:\n   {e}')
        print('\n   Verifica que:')
        print('   • Estás en la red del instituto (la URL es una IP privada 192.168.x.x).')
        print('   • El token en .env es válido y no expiró.')
        print('   • El nombre del modelo (OPENWEBUI_MODEL) existe en OpenWebUI.')
        sys.exit(1)


if __name__ == '__main__':
    main()
