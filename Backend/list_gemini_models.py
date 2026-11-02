import os, sys
import django
sys.path.append(r'D:\TecsisAi-2\Backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_backend.settings')
django.setup()

from django.conf import settings
from google import genai

key = getattr(settings, 'GEMINI_API_KEY', '') or os.environ.get('GEMINI_API_KEY')
client = genai.Client(api_key=key)

print("Listing models...")
for m in client.models.list():
    if "flash" in m.name or "pro" in m.name or "gemini" in m.name:
        print(f"  {m.name}")

# Try testing a few alternative model names
for name in ["gemini-2.5-flash", "gemini-3.8-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"]:
    try:
        r = client.models.generate_content(model=name, contents="di hola en 2 palabras")
        print(f"SUCCESS with '{name}': {r.text.strip()}")
        break
    except Exception as e:
        print(f"FAIL with '{name}': {e}")
