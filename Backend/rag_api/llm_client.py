"""
Cliente hacia el motor de IA local del instituto (OpenWebUI).
Mismo contrato que tdgpt_ia/src/test_model_api_rest.py: endpoint OpenAI-compatible
POST /api/chat/completions con autenticación Bearer.

Modo demo: cuando OPENWEBUI_TOKEN está vacío, generate_answer devuelve una respuesta
estructurada construida a partir del contexto RAG sin llamar a ningún LLM externo.
Útil para demostraciones offline o cuando no hay acceso a la red del instituto.
"""
import re
import textwrap

import httpx
from django.conf import settings

SYSTEM_PROMPT = (
    "Eres TecSis-IA, el asistente inteligente del repositorio académico del departamento "
    "de Desarrollo de Software de TECSUP, promoción C24.\n\n"
    "INSTRUCCIONES IMPORTANTES:\n"
    "- Usa únicamente afirmaciones que estén respaldadas por el CONTEXTO. El contexto son "
    "fragmentos reales de proyectos de tesis indexados en el repositorio.\n"
    "- Después de cada afirmación factual, agrega la cita de la fuente en formato [FUENTE: CODIGO]. "
    "El código aparece en el encabezado de cada fragmento.\n"
    "- No inventes datos, tecnologías, porcentajes, autores o conclusiones que no aparezcan en "
    "el contexto. Si debes inferir algo, indícalo explícitamente como una inferencia.\n"
    "- Si el contexto está vacío o no respalda la pregunta, responde exactamente que no existe "
    "evidencia suficiente en el repositorio y pide reformular la consulta.\n"
    "- Si hay múltiples proyectos relevantes, compara solo los aspectos respaldados por sus fuentes.\n"
    "- Responde en español, de forma clara, estructurada y útil para un docente evaluador.\n"
    "- Puedes usar listas, negritas y emojis para hacer la respuesta más legible."
)


class LLMUnavailableError(Exception):
    """El motor de IA local no respondió o no está configurado."""


def is_configured() -> bool:
    return bool(settings.OPENWEBUI_TOKEN)


# ---------------------------------------------------------------------------
# Modo demo — respuesta estructurada sin LLM
# ---------------------------------------------------------------------------

def _oraciones_relevantes(texto: str, palabras_clave: list[str], max_oraciones: int = 3) -> list[str]:
    """Extrae oraciones del texto que contengan alguna palabra clave del prompt."""
    oraciones = re.split(r'(?<=[.!?])\s+', texto.strip())
    clave_lower = [p.lower() for p in palabras_clave if len(p) > 3]
    puntuadas = []
    for o in oraciones:
        o = o.strip()
        if len(o) < 30:
            continue
        score = sum(1 for c in clave_lower if c in o.lower())
        puntuadas.append((score, o))
    puntuadas.sort(key=lambda x: -x[0])
    return [o for _, o in puntuadas[:max_oraciones]]


def _generar_respuesta_demo(prompt: str, context_chunks: list[str]) -> str:
    """
    Construye una respuesta legible a partir de los chunks RAG recuperados,
    extrayendo las oraciones más relevantes para el prompt dado.
    No requiere LLM ni conexión de red.
    """
    if not context_chunks:
        return (
            "No encontré proyectos en el repositorio que estén relacionados con tu consulta. "
            "Puedes intentar con otros términos o verificar que los proyectos relevantes "
            "estén activos en el sistema."
        )

    palabras = re.findall(r'\w+', prompt)
    partes: list[str] = []

    for i, chunk in enumerate(context_chunks[:3], 1):
        source_match = re.search(r'\[FUENTE:\s*([^\]]+)\]', chunk)
        cita = source_match.group(1) if source_match else f'FRAGMENTO-{i}'
        oraciones = _oraciones_relevantes(chunk, palabras)
        if oraciones:
            extracto = ' '.join(oraciones)
            partes.append(f"**Fragmento {i}:** {extracto} [FUENTE: {cita}]")
        else:
            # Fallback: primeras 200 caracteres del chunk
            extracto = textwrap.shorten(chunk.strip(), width=200, placeholder='...')
            partes.append(f"**Fragmento {i}:** {extracto} [FUENTE: {cita}]")

    intro = (
        f"Basándome en los proyectos indexados en TecSis-IA, encontré "
        f"{len(context_chunks)} fragmento(s) relevantes para tu consulta "
        f"**\"{prompt[:80]}{'...' if len(prompt) > 80 else ''}\"**:\n\n"
    )
    cuerpo = '\n\n'.join(partes)
    nota = (
        "\n\n---\n*Modo demostración — respuesta generada a partir del índice RAG "
        "sin motor de IA. Conecta al sistema del instituto para respuestas completas.*"
    )

    return intro + cuerpo + nota


def generate_local_answer(prompt: str, context_chunks: list[str]) -> str:
    """Respuesta determinista basada solo en las fuentes RAG disponibles."""
    return _generar_respuesta_demo(prompt, context_chunks)


# ---------------------------------------------------------------------------
# Función principal
# ---------------------------------------------------------------------------

def generate_answer(prompt: str, context_chunks: list[str], timeout: float = 30.0, historial: list[dict] | None = None) -> str:
    """
    Llama al LLM local con el prompt del usuario + contexto recuperado por RAG.
    Si OPENWEBUI_TOKEN no está configurado, usa el modo demo (sin LLM).
    """
    if not settings.OPENWEBUI_TOKEN:
        return _generar_respuesta_demo(prompt, context_chunks)

    contexto = '\n\n---\n\n'.join(context_chunks) if context_chunks else '(sin documentos relevantes encontrados)'

    user_message = (
        f"CONTEXTO:\n{contexto}\n\n"
        f"PREGUNTA DEL USUARIO:\n{prompt}"
    )

    # Construir lista de mensajes incluyendo historial multi-turno
    messages_ga = [{'role': 'system', 'content': SYSTEM_PROMPT}]
    if historial:
        messages_ga.extend(historial)
    messages_ga.append({'role': 'user', 'content': user_message})

    payload = {
        'model': settings.OPENWEBUI_MODEL,
        'messages': messages_ga,
        'stream': False,
    }
    headers = {
        'Authorization': f'Bearer {settings.OPENWEBUI_TOKEN}',
        'Content-Type': 'application/json',
    }

    # Timeout de conexión corto: si el servidor del instituto no es alcanzable
    # (red distinta, VPN caída, etc.) fallamos en segundos en vez de esperar
    # el timeout completo antes de mostrar la respuesta de respaldo.
    timeout_cfg = httpx.Timeout(timeout, connect=5.0)

    try:
        resp = httpx.post(
            f'{settings.OPENWEBUI_URL}/api/chat/completions',
            json=payload,
            headers=headers,
            timeout=timeout_cfg,
        )
    except httpx.RequestError:
        return _fallback_to_gemini(messages_ga, timeout)

    if resp.status_code != 200:
        return _fallback_to_gemini(messages_ga, timeout)

    try:
        return resp.json()['choices'][0]['message']['content']
    except (KeyError, IndexError, ValueError) as e:
        raise LLMUnavailableError(f'Respuesta del motor de IA con formato inesperado: {e}') from e


# ---------------------------------------------------------------------------
# Streaming — genera la respuesta token a token (SSE)
# ---------------------------------------------------------------------------

def generate_answer_stream(prompt: str, context_chunks: list[str], model: str | None = None, timeout: float = 20.0, historial: list[dict] | None = None):
    """
    Generador que hace streaming de la respuesta del LLM token a token.
    Cada yield es un fragmento de texto (string).
    Si el LLM no está disponible, hace yield de la respuesta demo completa en un solo chunk.
    """
    if not settings.OPENWEBUI_TOKEN:
        yield _generar_respuesta_demo(prompt, context_chunks)
        return

    contexto = '\n\n---\n\n'.join(context_chunks) if context_chunks else '(sin documentos relevantes encontrados)'
    user_message = (
        f"CONTEXTO:\n{contexto}\n\n"
        f"PREGUNTA DEL USUARIO:\n{prompt}"
    )

    # Construir lista de mensajes incluyendo historial multi-turno
    messages_gs = [{'role': 'system', 'content': SYSTEM_PROMPT}]
    if historial:
        messages_gs.extend(historial)
    messages_gs.append({'role': 'user', 'content': user_message})

    payload = {
        'model': model or settings.OPENWEBUI_MODEL,
        'messages': messages_gs,
        'stream': True,
    }
    headers = {
        'Authorization': f'Bearer {settings.OPENWEBUI_TOKEN}',
        'Content-Type': 'application/json',
    }

    timeout_cfg = httpx.Timeout(timeout, connect=5.0)

    try:
        with httpx.stream(
            'POST',
            f'{settings.OPENWEBUI_URL}/api/chat/completions',
            json=payload,
            headers=headers,
            timeout=timeout_cfg,
        ) as resp:
            if resp.status_code != 200:
                yield from _fallback_to_gemini_stream(messages_gs, timeout)
                return

            for line in resp.iter_lines():
                line = line.strip()
                if not line or line == 'data: [DONE]':
                    continue
                if line.startswith('data: '):
                    import json as _json
                    try:
                        chunk = _json.loads(line[6:])
                        delta = chunk['choices'][0]['delta'].get('content', '')
                        if delta:
                            yield delta
                    except Exception:
                        continue

    except httpx.RequestError:
        yield from _fallback_to_gemini_stream(messages_gs, timeout)


# ---------------------------------------------------------------------------
# Fallback Gemini
# ---------------------------------------------------------------------------
def _fallback_to_gemini(messages_ga: list[dict], timeout: float = 30.0) -> str:
    import os
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        return "⚠️ SDK de Gemini no instalado. Instala google-genai."

    gemini_key = getattr(settings, 'GEMINI_API_KEY', '') or os.environ.get('GEMINI_API_KEY')
    if not gemini_key:
        raise LLMUnavailableError("Gemini no está configurado (falta GEMINI_API_KEY en .env)")

    client = genai.Client(api_key=gemini_key)
    
    sys_prompt = ""
    history = []
    last_user_msg = ""
    for msg in messages_ga:
        if msg['role'] == 'system':
            sys_prompt = msg['content']
        elif msg == messages_ga[-1] and msg['role'] == 'user':
            last_user_msg = msg['content']
        else:
            role = 'user' if msg['role'] == 'user' else 'model'
            history.append(types.Content(role=role, parts=[types.Part.from_text(msg['content'])]))
            
    config = types.GenerateContentConfig(
        system_instruction=sys_prompt,
        temperature=0.4
    )

    # Un único intento acotado: reintentar varios modelos encadenados dejaba
    # el historial esperando durante minutos cuando el proveedor estaba caído.
    models_to_try = ["gemini-3.6-flash"]
    last_err = None
    for model_name in models_to_try:
        try:
            if history:
                chat = client.chats.create(model=model_name, config=config, history=history)
                response = chat.send_message(last_user_msg)
            else:
                response = client.models.generate_content(
                    model=model_name,
                    contents=last_user_msg,
                    config=config
                )
            return "*(Respondiendo desde Google Gemini en la nube)*\n\n" + (response.text or '')
        except Exception as e:
            last_err = e
            continue

    raise LLMUnavailableError(f"Fallo en Gemini Fallback: {last_err}")


def _fallback_to_gemini_stream(messages_gs: list[dict], timeout: float = 20.0):
    import os
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        yield "⚠️ SDK de Gemini no instalado."
        return

    gemini_key = getattr(settings, 'GEMINI_API_KEY', '') or os.environ.get('GEMINI_API_KEY')
    if not gemini_key:
        raise LLMUnavailableError("Gemini no está configurado.")

    # El proveedor remoto no debe dejar el chat cargando indefinidamente.
    # google-genai recibe el timeout en milisegundos.
    client = genai.Client(
        api_key=gemini_key,
        http_options=types.HttpOptions(timeout=int(timeout * 1000)),
    )
    
    sys_prompt = ""
    history = []
    last_user_msg = ""
    for msg in messages_gs:
        if msg['role'] == 'system':
            sys_prompt = msg['content']
        elif msg == messages_gs[-1] and msg['role'] == 'user':
            last_user_msg = msg['content']
        else:
            role = 'user' if msg['role'] == 'user' else 'model'
            history.append(types.Content(role=role, parts=[types.Part.from_text(msg['content'])]))

    config = types.GenerateContentConfig(
        system_instruction=sys_prompt,
        temperature=0.4
    )

    models_to_try = ["gemini-3.6-flash"]
    last_err = None

    for model_name in models_to_try:
        try:
            if history:
                chat = client.chats.create(model=model_name, config=config, history=history)
                response_stream = chat.send_message_stream(last_user_msg)
            else:
                response_stream = client.models.generate_content_stream(
                    model=model_name,
                    contents=last_user_msg,
                    config=config
                )
            
            got_any = False
            for chunk in response_stream:
                if chunk.text:
                    if not got_any:
                        yield "*(Respondiendo desde Google Gemini en la nube)*\n\n"
                    got_any = True
                    yield chunk.text
            if got_any:
                return
        except Exception as e:
            last_err = e
            continue

    # El RAG local siempre puede dar una respuesta útil y, sobre todo, cerrar
    # correctamente el stream para persistir la conversación.
    raise LLMUnavailableError(f"Fallo en Gemini Stream: {last_err}")

