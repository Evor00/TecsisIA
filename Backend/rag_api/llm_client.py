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
    "Eres el asistente del repositorio académico TecSis-IA del departamento de "
    "Tecnología Digital de TECSUP. Responde ÚNICAMENTE con base en el CONTEXTO "
    "proporcionado, que son fragmentos de tesis y pre-tesis indexadas. "
    "Si el contexto no contiene información suficiente para responder, dilo "
    "claramente en vez de inventar datos. Responde en español, de forma clara y concisa."
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
        oraciones = _oraciones_relevantes(chunk, palabras)
        if oraciones:
            extracto = ' '.join(oraciones)
            partes.append(f"**Fragmento {i}:** {extracto}")
        else:
            # Fallback: primeras 200 caracteres del chunk
            extracto = textwrap.shorten(chunk.strip(), width=200, placeholder='...')
            partes.append(f"**Fragmento {i}:** {extracto}")

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


# ---------------------------------------------------------------------------
# Función principal
# ---------------------------------------------------------------------------

def generate_answer(prompt: str, context_chunks: list[str], timeout: float = 30.0) -> str:
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

    payload = {
        'model': settings.OPENWEBUI_MODEL,
        'messages': [
            {'role': 'system', 'content': SYSTEM_PROMPT},
            {'role': 'user', 'content': user_message},
        ],
        'stream': False,
    }
    headers = {
        'Authorization': f'Bearer {settings.OPENWEBUI_TOKEN}',
        'Content-Type': 'application/json',
    }

    try:
        resp = httpx.post(
            f'{settings.OPENWEBUI_URL}/api/chat/completions',
            json=payload,
            headers=headers,
            timeout=timeout,
        )
    except httpx.RequestError as e:
        raise LLMUnavailableError(f'No se pudo conectar al motor de IA local: {e}') from e

    if resp.status_code != 200:
        raise LLMUnavailableError(f'El motor de IA respondió {resp.status_code}: {resp.text[:200]}')

    try:
        return resp.json()['choices'][0]['message']['content']
    except (KeyError, IndexError, ValueError) as e:
        raise LLMUnavailableError(f'Respuesta del motor de IA con formato inesperado: {e}') from e
