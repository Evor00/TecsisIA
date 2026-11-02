import os, sys
import django
sys.path.append(r'D:\TecsisAi-2\Backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_backend.settings')
django.setup()

from django.conf import settings
from google import genai

key = getattr(settings, 'GEMINI_API_KEY', '') or os.environ.get('GEMINI_API_KEY')
client = genai.Client(api_key=key)

for m_name in ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.7-flash", "gemini-3.8-flash"]:
    try:
        r = client.models.generate_content(model=m_name, contents="di hola en una sola palabra")
        print(f"SUCCESS with '{m_name}': {r.text.strip()}")
    except Exception as e:
        print(f"FAIL with '{m_name}': {e}")
