import os
import sys

sys.path.append('D:\\TecsisAi-2\\Backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_backend.settings')
import django
django.setup()

from rag_api.llm_client import _fallback_to_gemini
messages = [{'role': 'user', 'content': 'hola'}]
try:
    res = _fallback_to_gemini(messages)
    print("SUCCESS:", res)
except Exception as e:
    print("ERROR:", e)
