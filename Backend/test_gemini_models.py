import os, sys
import django
sys.path.append(r'D:\TecsisAi-2\Backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_backend.settings')
django.setup()

from django.conf import settings
from google import genai

key = getattr(settings, 'GEMINI_API_KEY', '') or os.environ.get('GEMINI_API_KEY')
print("GEMINI_API_KEY found:", bool(key))

client = genai.Client(api_key=key)

for m_name in ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-3.8-flash"]:
    try:
        r = client.models.generate_content(model=m_name, contents="hola")
        print(f"  Model '{m_name}': OK -> {r.text[:30]}")
    except Exception as e:
        print(f"  Model '{m_name}': ERROR -> {e}")
