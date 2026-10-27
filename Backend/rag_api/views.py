from copy import deepcopy
import logging
import re
from pathlib import Path
from threading import Lock
from time import monotonic, perf_counter

from django.db import connection
from django.conf import settings
from django.core.files.storage import default_storage
from django.http import FileResponse
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Tesis, LogConsulta, Usuario, DocumentoRAG, Conversacion, Mensaje
from . import llm_client
from . import auth as _auth

logger = logging.getLogger(__name__)

# ── helpers ───────────────────────────────────────────────────────────────────

ESTADO_DB_A_SLUG = {
    'Aprobada':    'aprobado',
    'En Revisión': 'en-revision',
    'Observada':   'observado',
    'Rechazada':   'rechazado',
}

SLUG_A_ESTADO_DB = {v: k for k, v in ESTADO_DB_A_SLUG.items()}

# Singleton del modelo de embeddings (se carga una vez por proceso)
_embedding_model = None

# Límites deliberadamente conservadores: menos contexto irrelevante reduce
# alucinaciones y también el tiempo de respuesta del modelo.
RAG_MAX_SOURCES = 4
RAG_MAX_CHARS_PER_SOURCE = 1_200
RAG_MIN_SIMILARITY = 40.0
# Se piden más chunks al índice porque varios pueden pertenecer a la misma
# tesis; después se conserva el mejor chunk de cada una.
RAG_VECTOR_CANDIDATES = 24
RAG_CACHE_TTL_SECONDS = 120
MAX_PDF_PAGES = 150
_rag_query_cache: dict[str, tuple[float, list[dict], list[str], str]] = {}
_rag_cache_lock = Lock()


def _cache_key(prompt: str) -> str:
    return ' '.join(prompt.casefold().split())


def _leer_cache_evidencia(prompt: str):
    key = _cache_key(prompt)
    with _rag_cache_lock:
        cached = _rag_query_cache.get(key)
        if not cached or monotonic() - cached[0] >= RAG_CACHE_TTL_SECONDS:
            _rag_query_cache.pop(key, None)
            return None
        _, docs, chunks, metodo = cached
        return deepcopy(docs), list(chunks), metodo


def _guardar_cache_evidencia(prompt: str, docs: list[dict], chunks: list[str], metodo: str):
    # No se guardan fallos ni resultados vacíos: la siguiente petición puede
    # recuperarse correctamente cuando el servicio o la BD vuelva a estar disponible.
    if not docs:
        return
    key = _cache_key(prompt)
    with _rag_cache_lock:
        _rag_query_cache[key] = (monotonic(), deepcopy(docs), list(chunks), metodo)


def _invalidar_cache_evidencia():
    """Se llama al indexar nuevo contenido para no servir resultados antiguos."""
    with _rag_cache_lock:
        _rag_query_cache.clear()

def _get_model():
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        _embedding_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
    return _embedding_model

def _encode(text: str) -> list[float]:
    return _get_model().encode(
        text[:1000], normalize_embeddings=True,
    ).tolist()

def _vec_str(vec: list[float]) -> str:
    return '[' + ','.join(f'{v:.6f}' for v in vec) + ']'

def _guardar_embedding(documento_id: int, texto: str) -> bool:
    """Genera y guarda el embedding de un documento RAG usando pgvector."""
    vec = _encode(texto)
    with connection.cursor() as cur:
        cur.execute(
            "UPDATE documentos_rag SET embedding = %s::vector WHERE id = %s",
            [_vec_str(vec), documento_id],
        )
    _invalidar_cache_evidencia()
    return True

def _similitud_aproximada(prompt: str, titulo: str) -> int:
    palabras = [p.lower() for p in prompt.split() if len(p) > 3]
    if not palabras:
        return 50
    hits = sum(1 for p in palabras if p in titulo.lower())
    return min(95, 45 + int((hits / len(palabras)) * 50))

_INTENT_LISTAR = {
    'lista', 'listar', 'listame', 'muestra', 'muestrame', 'mostrar', 'ver',
    'todas', 'todos', 'todo', 'registradas', 'registrados', 'disponibles',
    'hay', 'tenemos', 'existen', 'cuales', 'cuáles', 'repositorio',
}

_STOPWORDS = {
    'que', 'con', 'los', 'las', 'del', 'por', 'para', 'una', 'uno',
    'sus', 'son', 'fue', 'ser', 'han', 'sobre', 'esta', 'este', 'como',
    'pero', 'mas', 'muy', 'sin', 'dos', 'hay', 'uso', 'usa', 'usan',
    'tesis', 'proyecto', 'proyectos', 'sistema', 'sistemas', 'quiero',
    'busco', 'dame', 'dime', 'cuales', 'cuáles', 'tienen', 'tiene',
}

def _keyword_search(prompt: str) -> list[dict]:
    palabras_raw = [p.lower() for p in prompt.split() if len(p) > 2]
    palabras     = [p for p in palabras_raw if p not in _STOPWORDS]
    es_listado   = bool(set(palabras_raw) & _INTENT_LISTAR)

    if es_listado:
        qs = list(Tesis.objects.filter(activo=True).order_by('codigo')[:8])
    else:
        q = Q()
        for p in palabras:
            q |= (
                Q(titulo__icontains=p) |
                Q(autor__icontains=p)  |
                Q(tecnologias__icontains=p) )
        qs = list(Tesis.objects.filter(q, activo=True).distinct()[:6]) if palabras else []
        if not qs and palabras:
            # Segundo intento: busca en texto de los chunks
            chunk_ids = DocumentoRAG.objects.filter(
                contenido_texto__icontains=palabras[0]
            ).values_list('tesis_id', flat=True).distinct()[:6]
            qs = list(Tesis.objects.filter(id__in=chunk_ids, activo=True))
        # No devolver tesis arbitrarias cuando no hay coincidencias: sería una
        # falsa evidencia para el modelo generativo.

    # Incluir texto del primer chunk para que el LLM tenga contexto real
    result = []
    for t in qs:
        primer_chunk = DocumentoRAG.objects.filter(tesis=t).order_by('pagina_origen', 'chunk_index').first()
        texto = primer_chunk.contenido_texto if primer_chunk else ''
        result.append({
            'tesis_id':  t.id,
            'titulo':    t.titulo,
            'autor':     t.autor,
            'similitud': 50 if es_listado else _similitud_aproximada(prompt, t.titulo),
            'estado':    ESTADO_DB_A_SLUG.get(t.estado, t.estado),
            'codigo':    t.codigo,
            '_texto':    texto,  # usado internamente para context_chunks, no se envía al frontend
        })

    return sorted(result, key=lambda x: x['similitud'], reverse=True)


def _cita(tesis_id: int, codigo: str | None) -> str:
    """Identificador estable que el modelo y la interfaz pueden mostrar."""
    return codigo or f'TESIS-{tesis_id}'


def _formatear_contexto(documento: dict) -> str:
    return (
        f"[FUENTE: {documento['cita']}]\n"
        f"TÍTULO: {documento['titulo']}\n"
        f"AUTOR: {documento['autor']}\n"
        f"CONTENIDO:\n{documento['texto'][:RAG_MAX_CHARS_PER_SOURCE]}"
    )


def _documentos_vectoriales(rows) -> list[dict]:
    """Convierte filas pgvector en fuentes solo si superan el umbral RAG."""
    documentos = []
    tesis_vistas = set()
    for tesis_id, titulo, autor, estado, codigo, texto, similitud in rows:
        if tesis_id in tesis_vistas:
            continue
        tesis_vistas.add(tesis_id)
        similitud = round(float(similitud), 1)
        if similitud < RAG_MIN_SIMILARITY:
            continue
        documentos.append({
            'titulo': titulo,
            'autor': autor,
            'similitud': similitud,
            'estado': ESTADO_DB_A_SLUG.get(estado, estado),
            'codigo': codigo,
            'cita': _cita(tesis_id, codigo),
            'texto': texto,
        })
        if len(documentos) == RAG_MAX_SOURCES:
            break
    return documentos


def _buscar_evidencia(prompt: str) -> tuple[list[dict], list[str], dict]:
    """Recupera evidencia RAG una sola vez para las rutas normal y SSE.

    Solo los resultados que superan el umbral vectorial se entregan como
    evidencia al LLM. La búsqueda por palabras clave queda como respaldo, pero
    no inventa una puntuación semántica ni rellena resultados sin coincidencia.
    """
    inicio = perf_counter()
    documentos: list[dict] = []
    context_chunks: list[str] = []
    metodo = 'sin_coincidencias'

    cached = _leer_cache_evidencia(prompt)
    if cached:
        public_docs, context_chunks, metodo = cached
        return public_docs, context_chunks, {
            'metodo': metodo,
            'tiene_evidencia': bool(public_docs),
            'umbral_similitud': RAG_MIN_SIMILARITY,
            'fuentes_recuperadas': len(public_docs),
            'tiempo_recuperacion_ms': round((perf_counter() - inicio) * 1000),
            'cache_hit': True,
        }

    try:
        vec_prompt = _vec_str(_encode(prompt))
        with connection.cursor() as cur:
            cur.execute("""
                WITH nearest_chunks AS (
                    SELECT tesis_id, contenido_texto, embedding <=> %s::vector AS distancia
                    FROM documentos_rag
                    WHERE embedding IS NOT NULL
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s
                )
                SELECT t.id, t.titulo, t.autor, t.estado, t.codigo,
                       n.contenido_texto, (1 - n.distancia) * 100 AS similitud
                FROM nearest_chunks n
                JOIN tesis t ON t.id = n.tesis_id
                WHERE t.activo = TRUE
                ORDER BY n.distancia
            """, [vec_prompt, vec_prompt, RAG_VECTOR_CANDIDATES])
            rows = cur.fetchall()

        documentos = _documentos_vectoriales(rows)
        metodo = 'vectorial' if documentos else metodo
    except Exception as exc:
        # La consulta sigue siendo útil en instalaciones sin pgvector o sin
        # embeddings, mediante el respaldo por palabras clave.
        print(f'[TecSis-IA] Error en búsqueda vectorial RAG: {exc}')

    if not documentos:
        try:
            for doc in _keyword_search(prompt)[:RAG_MAX_SOURCES]:
                texto = doc.get('_texto', '')
                if not texto:
                    continue
                documentos.append({
                    'titulo': doc['titulo'],
                    'autor': doc['autor'],
                    'similitud': doc['similitud'],
                    'estado': doc['estado'],
                    'codigo': doc['codigo'],
                    'cita': _cita(doc['tesis_id'], doc['codigo']),
                    'texto': texto,
                })
            if documentos:
                metodo = 'palabras_clave'
        except Exception as exc:
            print(f'[TecSis-IA] Error en búsqueda por palabras clave: {exc}')

    context_chunks = [_formatear_contexto(doc) for doc in documentos]
    public_docs = [{k: v for k, v in doc.items() if k != 'texto'} for doc in documentos]
    _guardar_cache_evidencia(prompt, public_docs, context_chunks, metodo)
    metadata = {
        'metodo': metodo,
        'tiene_evidencia': bool(public_docs),
        'umbral_similitud': RAG_MIN_SIMILARITY,
        'fuentes_recuperadas': len(public_docs),
        'tiempo_recuperacion_ms': round((perf_counter() - inicio) * 1000),
        'cache_hit': False,
    }
    return public_docs, context_chunks, metadata


def _obtener_historial(conversacion_id) -> list[dict]:
    """Conserva contexto conversacional sin hacer crecer el prompt sin límite."""
    if not conversacion_id:
        return []
    try:
        mensajes = list(Mensaje.objects.filter(
            conversacion_id=conversacion_id,
        ).order_by('-created_at')[:8])
        return [
            {'role': mensaje.rol, 'content': mensaje.contenido[:1_200]}
            for mensaje in reversed(mensajes)
        ]
    except Exception:
        return []



def _titulo_desde_prompt(prompt: str, max_len: int = 60) -> str:
    titulo = ' '.join(prompt.split())
    return titulo[:max_len] + ('…' if len(titulo) > max_len else '')


def _persistir_mensajes(conversacion_id, prompt, respuesta, documentos, usuario_id=None):
    """
    Guarda el par usuario/asistente en una conversación. Si conversacion_id es
    None o no existe, crea una nueva conversación titulada con el primer prompt.
    Devuelve la Conversacion (o None si las tablas aún no fueron parcheadas en BD).
    """
    try:
        # Se guardan juntos: nunca queda un mensaje de usuario sin su respuesta
        # cuando la generación se completó correctamente.
        from django.db import transaction
        with transaction.atomic():
            conversacion = None
            if conversacion_id:
                conversacion = Conversacion.objects.filter(
                    pk=conversacion_id,
                    usuario_id=usuario_id,
                ).first()

            if conversacion is None:
                conversacion = Conversacion.objects.create(
                    usuario_id = usuario_id,
                    titulo     = _titulo_desde_prompt(prompt),
                )
            Mensaje.objects.create(conversacion=conversacion, rol='user', contenido=prompt)
            Mensaje.objects.create(
                conversacion=conversacion, rol='assistant',
                contenido=respuesta, documentos=documentos,
            )
        # Refresca updated_at para que suba al tope del historial
        conversacion.save(update_fields=['updated_at'])
        return conversacion
    except Exception:
        # El error no debe ser silencioso: el cliente informa al usuario y el
        # log conserva el detalle para poder corregir la base de datos.
        logger.exception('No se pudo persistir la conversación del chat')
        return None


# ── Vistas ────────────────────────────────────────────────────────────────────

def _calcular_similitud_maxima(tesis_id: int) -> float | None:
    """
    Calcula la similitud máxima del proyecto recién creado contra todos los
    demás proyectos indexados usando coseno con numpy (no requiere pgvector).
    """
    try:
        import numpy as np
        import json as _json

        with connection.cursor() as cur:
            cur.execute(
                "SELECT embedding FROM documentos_rag WHERE tesis_id = %s AND embedding IS NOT NULL",
                [tesis_id],
            )
            propios_raw = [r[0] for r in cur.fetchall()]

            cur.execute(
                "SELECT embedding FROM documentos_rag WHERE tesis_id != %s AND embedding IS NOT NULL",
                [tesis_id],
            )
            ajenos_raw = [r[0] for r in cur.fetchall()]

        if not propios_raw or not ajenos_raw:
            return None

        def to_arr(raw):
            if isinstance(raw, str):
                raw = _json.loads(raw)
            return np.array(raw, dtype='float32')

        propios = [to_arr(e) for e in propios_raw]
        ajenos  = [to_arr(e) for e in ajenos_raw]

        max_sim = 0.0
        for ep in propios:
            np_ = float(np.linalg.norm(ep))
            if np_ == 0:
                continue
            for ea in ajenos:
                na = float(np.linalg.norm(ea))
                if na == 0:
                    continue
                sim = float(np.dot(ep, ea) / (np_ * na))
                if sim > max_sim:
                    max_sim = sim

        return round(max_sim * 100, 1) if max_sim > 0 else None
    except Exception:
        return None


class DashboardMetricsView(APIView):
    """
    GET /api/dashboard/metrics/
    Llama al stored procedure sp_obtener_metricas_dashboard() en PostgreSQL.
    """
    def get(self, request):
        _, err = _auth.authenticate(request)
        if err: return err
        try:
            with connection.cursor() as cur:
                cur.execute("SELECT * FROM sp_obtener_metricas_dashboard()")
                cols = [d[0] for d in cur.description]
                row  = cur.fetchone()

            if not row:
                raise ValueError("SP sin resultado")

            raw = dict(zip(cols, row))
            return Response({
                'total_tesis':      raw.get('total_tesis',       0),
                'aprobadas':        raw.get('total_aprobadas',   0),
                'en_revision':      raw.get('total_en_revision', 0),
                'observadas':       raw.get('total_observadas',  0),
                'rechazadas':       raw.get('total_rechazadas',  0),
                'consultas_mes':    raw.get('consultas_este_mes',0),
                'tokens_mes':       raw.get('tokens_mes',        0),
                'alertas_similitud':raw.get('alertas_similitud', 0),
            })

        except Exception:
            # Fallback estático mientras no haya conexión
            return Response({
                'total_tesis': 70, 'aprobadas': 50, 'en_revision': 20,
            })


class RAGQueryView(APIView):
    """
    POST /api/rag/query/
    Body: { "prompt": "..." }
    Búsqueda vectorial con pgvector (cosine similarity).
    Fallback a búsqueda por palabras clave si no hay embeddings indexados.
    """
    def post(self, request):
        user_id, err = _auth.authenticate(request)
        if err: return err

        prompt = request.data.get('prompt', '').strip()
        if not prompt:
            return Response(
                {'error': 'El campo prompt es requerido.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        conversacion_id = request.data.get('conversacion_id')

        similar_docs, context_chunks, retrieval = _buscar_evidencia(prompt)
        historial_llm = _obtener_historial(conversacion_id)

        try:
            llm_response = llm_client.generate_answer(prompt, context_chunks, historial=historial_llm)
        except llm_client.LLMUnavailableError:
            llm_response = (
                '*(Modo local de respaldo: el proveedor remoto no respondió.)*\n\n'
                + llm_client.generate_local_answer(prompt, context_chunks)
            )

        try:
            LogConsulta.objects.create(
                usuario_id        = user_id,
                prompt_ingresado  = prompt,
                resultado         = similar_docs,
                tokens_procesados = 800 + len(prompt.split()) * 40,
            )
        except Exception:
            logger.exception('No se pudo registrar la auditoría de consulta')

        # ── Persistir la conversación (historial navegable tipo ChatGPT) ──
        conversacion = _persistir_mensajes(
            conversacion_id, prompt, llm_response, similar_docs,
            usuario_id=user_id,
        )

        return Response({
            'query': prompt,
            'llm_response': llm_response,
            'similar_documents': similar_docs,
            'retrieval': retrieval,
            'conversacion_id': conversacion.id if conversacion else None,
        })


class HistorialListView(APIView):
    """
    GET /api/historial/
    Devuelve los últimos 50 registros de log_consultas del usuario autenticado.
    """
    def get(self, request):
        user_id, err = _auth.authenticate(request)
        if err: return err
        logs = LogConsulta.objects.filter(usuario_id=user_id).order_by('-fecha')[:50]
        data = []

        for log in logs:
            resultado      = log.resultado or []
            coincidencias  = len(resultado)
            similitudes    = [
                d.get('similitud', 0)
                for d in resultado
                if isinstance(d, dict)
            ]
            similitud_max  = max(similitudes) if similitudes else None

            if coincidencias == 0:
                estado = 'sin-coincidencias'
            elif similitud_max and similitud_max >= 85:
                estado = 'alta-similitud'
            else:
                estado = 'completado'

            data.append({
                'id':            log.id,
                'titulo':        log.prompt_ingresado,
                'tokens':        log.tokens_procesados,
                'fecha':         log.fecha.strftime('%d %b %Y'),
                'hora':          log.fecha.strftime('%H:%M'),
                'coincidencias': coincidencias,
                'similitud':     similitud_max,
                'estado':        estado,
            })

        return Response(data)


class ProyectosListView(APIView):
    """
    GET /api/proyectos/?estado=aprobado&search=react
    Devuelve proyectos (tesis) con filtros opcionales.
    También incluye conteos por estado para los tabs del frontend.
    """
    def get(self, request):
        _, err = _auth.authenticate(request)
        if err: return err
        estado_param = request.query_params.get('estado', 'todos')
        search_param = request.query_params.get('search', '').strip()

        qs = Tesis.objects.order_by('id')

        if search_param:
            qs = qs.filter(
                Q(titulo__icontains=search_param) |
                Q(autor__icontains=search_param) |
                Q(codigo__icontains=search_param) |
                Q(grupo__icontains=search_param)
            )

        if estado_param and estado_param != 'todos':
            db_estado = SLUG_A_ESTADO_DB.get(estado_param)
            if db_estado:
                qs = qs.filter(estado=db_estado)

        proyectos = [
            {
                'id':          t.id,
                'codigo':      t.codigo or '',
                'grupo':       t.grupo  or 'Sin Grupo',
                'promocion':   t.promocion,
                'estado':      ESTADO_DB_A_SLUG.get(t.estado, t.estado.lower()),
                'titulo':      t.titulo,
                'tecnologias': t.tecnologias if isinstance(t.tecnologias, list) else [],
                'autores':     t.autor,
                'similitud':   float(t.similitud_maxima) if t.similitud_maxima else 0,
                'score':       t.score,
                'fecha':       t.fecha_subida.strftime('%d %b %Y'),
                'activo':      t.activo,
            }
            for t in qs
        ]

        # Conteos para los tabs (siempre sobre la tabla completa, sin filtros)
        conteos = {
            'todos':       Tesis.objects.count(),
            'aprobado':    Tesis.objects.filter(estado='Aprobada').count(),
            'en-revision': Tesis.objects.filter(estado='En Revisión').count(),
            'observado':   Tesis.objects.filter(estado='Observada').count(),
            'rechazado':   Tesis.objects.filter(estado='Rechazada').count(),
        }

        return Response({'proyectos': proyectos, 'conteos': conteos})

    def post(self, request):
        user_id, err = _auth.authenticate(request)
        if err: return err

        titulo      = request.data.get('titulo', '').strip()
        autor       = request.data.get('autor', '').strip()
        grupo       = request.data.get('grupo', '').strip() or None
        tecnologias = request.data.get('tecnologias', [])
        promocion   = request.data.get('promocion', 'C24').strip()
        resumen     = request.data.get('resumen', '').strip()

        estado_raw  = request.data.get('estado', 'En Revisión').strip()
        codigo_raw  = request.data.get('codigo', '').strip() or None
        score_raw   = request.data.get('score',  '').strip() or None

        ESTADOS_VALIDOS = {'En Revisión', 'Aprobada', 'Observada', 'Rechazada'}
        estado = estado_raw if estado_raw in ESTADOS_VALIDOS else 'En Revisión'

        if not titulo or not autor:
            return Response(
                {'error': 'Título y autor son requeridos.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tesis = Tesis.objects.create(
            titulo      = titulo,
            autor       = autor,
            grupo       = grupo,
            tecnologias = tecnologias if isinstance(tecnologias, list) else [],
            promocion   = promocion,
            estado      = estado,
            codigo      = codigo_raw,
            score       = score_raw,
            usuario_id  = user_id,
        )
        tesis.refresh_from_db()

        # Indexar resumen como chunk 0 con embedding
        resumen_guardado = False
        if resumen:
            try:
                chunk = DocumentoRAG.objects.create(
                    tesis           = tesis,
                    contenido_texto = resumen,
                    pagina_origen   = 0,
                    chunk_index     = 0,
                )
                resumen_guardado = True
                _guardar_embedding(chunk.id, resumen)
            except Exception:
                pass

        # Calcular similitud máxima contra proyectos existentes
        sim = _calcular_similitud_maxima(tesis.id) if resumen_guardado else None
        if sim is not None:
            tesis.similitud_maxima = sim
            tesis.save(update_fields=['similitud_maxima'])

        return Response({
            'id':              tesis.id,
            'codigo':          tesis.codigo or '',
            'grupo':           tesis.grupo  or 'Sin Grupo',
            'promocion':       tesis.promocion,
            'estado':          ESTADO_DB_A_SLUG.get(tesis.estado, tesis.estado.lower()),
            'titulo':          tesis.titulo,
            'tecnologias':     tesis.tecnologias if isinstance(tesis.tecnologias, list) else [],
            'autores':         tesis.autor,
            'similitud':       float(sim) if sim is not None else 0,
            'score':           tesis.score,
            'fecha':           tesis.fecha_subida.strftime('%d %b %Y'),
            'resumen_guardado': resumen_guardado,
            'activo':          True,
        }, status=status.HTTP_201_CREATED)


class ProyectoDetailView(APIView):
    """
    GET /api/proyectos/<pk>/
    Devuelve los datos completos de una tesis + su resumen/abstract
    (primer chunk de documentos_rag) y el total de chunks indexados.
    """
    def get(self, request, pk):
        _, err = _auth.authenticate(request)
        if err: return err
        try:
            tesis = Tesis.objects.get(pk=pk)
        except Tesis.DoesNotExist:
            return Response({'error': 'No encontrado'}, status=status.HTTP_404_NOT_FOUND)

        chunks = DocumentoRAG.objects.filter(tesis=tesis).order_by('pagina_origen', 'chunk_index')
        primer = chunks.filter(pagina_origen=0).first() or chunks.first()

        return Response({
            'id':           tesis.id,
            'codigo':       tesis.codigo or '',
            'titulo':       tesis.titulo,
            'autores':      tesis.autor,
            'grupo':        tesis.grupo or '',
            'promocion':    tesis.promocion,
            'estado':       ESTADO_DB_A_SLUG.get(tesis.estado, tesis.estado),
            'tecnologias':  tesis.tecnologias if isinstance(tesis.tecnologias, list) else [],
            'similitud':    float(tesis.similitud_maxima) if tesis.similitud_maxima else 0,
            'score':        tesis.score,
            'fecha':        tesis.fecha_subida.strftime('%d %b %Y'),
            'resumen':      primer.contenido_texto if primer else None,
            'total_chunks': chunks.count(),
            'paginas_indexadas': chunks.exclude(pagina_origen=0).values('pagina_origen').distinct().count(),
            'activo':       tesis.activo,
            'tiene_pdf':    bool(tesis.ruta_pdf),
        })

    def delete(self, request, pk):
        """DELETE /api/proyectos/<pk>/  — elimina el proyecto y sus chunks"""
        _, err = _auth.authenticate(request)
        if err: return err
        try:
            tesis = Tesis.objects.get(pk=pk)
        except Tesis.DoesNotExist:
            return Response({'error': 'No encontrado'}, status=status.HTTP_404_NOT_FOUND)
        tesis.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, pk):
        """PATCH /api/proyectos/<pk>/  — edición completa de un proyecto"""
        _, err = _auth.authenticate(request)
        if err: return err
        try:
            tesis = Tesis.objects.get(pk=pk)
        except Tesis.DoesNotExist:
            return Response({'error': 'No encontrado'}, status=status.HTTP_404_NOT_FOUND)

        # Campos de texto simples
        if 'titulo' in request.data and request.data['titulo']:
            tesis.titulo = request.data['titulo']
        if 'autor' in request.data and request.data['autor']:
            tesis.autor = request.data['autor']
        if 'grupo' in request.data:
            tesis.grupo = request.data['grupo'] or None
        if 'codigo' in request.data:
            tesis.codigo = request.data['codigo'] or None
        if 'promocion' in request.data and request.data['promocion']:
            tesis.promocion = request.data['promocion']
        if 'tecnologias' in request.data:
            tesis.tecnologias = request.data['tecnologias'] if isinstance(request.data['tecnologias'], list) else []
        if 'activo' in request.data:
            tesis.activo = bool(request.data['activo'])
        if 'score' in request.data:
            tesis.score = request.data['score'] or None
        if 'estado' in request.data:
            # Acepta tanto slug ('en-revision') como valor DB ('En Revisión')
            slug = request.data['estado']
            tesis.estado = SLUG_A_ESTADO_DB.get(slug, slug)

        tesis.save()

        # Actualizar resumen (primer chunk) si se envió
        if 'resumen' in request.data and request.data['resumen']:
            primer = DocumentoRAG.objects.filter(tesis=tesis).order_by('pagina_origen', 'chunk_index').first()
            if primer:
                primer.contenido_texto = request.data['resumen']
                primer.save()
            else:
                DocumentoRAG.objects.create(
                    tesis=tesis,
                    contenido_texto=request.data['resumen'],
                    pagina_origen=1, chunk_index=1
                )

        return Response({
            'ok':     True,
            'id':     tesis.id,
            'titulo': tesis.titulo,
            'autor':  tesis.autor,
            'estado': ESTADO_DB_A_SLUG.get(tesis.estado, tesis.estado),
            'activo': tesis.activo,
            'score':  tesis.score,
        })


class ProyectoPDFView(APIView):
    """Descarga autenticada del PDF original asociado a una tesis."""
    def get(self, request, pk):
        _, err = _auth.authenticate(request)
        if err: return err
        try:
            tesis = Tesis.objects.get(pk=pk)
        except Tesis.DoesNotExist:
            return Response({'error': 'No encontrado'}, status=status.HTTP_404_NOT_FOUND)
        if not tesis.ruta_pdf or not default_storage.exists(tesis.ruta_pdf):
            return Response({'error': 'Este proyecto no tiene un PDF almacenado.'}, status=status.HTTP_404_NOT_FOUND)
        return FileResponse(
            default_storage.open(tesis.ruta_pdf, 'rb'),
            as_attachment=True,
            filename=Path(tesis.ruta_pdf).name,
        )


def _metadata_from_pdf(pdf_file):
    """Extrae los campos habituales de una carátula de tesis y el texto por página."""
    from pypdf import PdfReader

    reader = PdfReader(pdf_file)
    if len(reader.pages) > MAX_PDF_PAGES:
        raise ValueError(f'El PDF supera el límite de {MAX_PDF_PAGES} páginas.')
    pages = [page.extract_text() or '' for page in reader.pages]
    text = '\n'.join(pages[:3])
    filename = pdf_file.name.rsplit('.', 1)[0]
    filename_match = re.match(r'(?P<codigo>C\d{2}[_-]\d{3})[_-](?P<titulo>.+)', filename, re.I)
    filename_code = filename_match.group('codigo').replace('_', '-') if filename_match else ''
    filename_title = filename_match.group('titulo').replace('_', ' ').replace('-', ' ').strip() if filename_match else filename.replace('_', ' ').strip()

    def captured(pattern, default=''):
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        return re.sub(r'\s+', ' ', match.group(1)).strip() if match else default

    code = captured(r'C.digo\s*:\s*\n?\s*(C\d{2}[-_]\d{3})', filename_code).replace('_', '-')
    title = captured(r'Promoci.n\s+C\d{2}\s*\n\s*(.+?)\s*\n\s*Autores?\s*:', filename_title)
    authors = captured(r'Autores?\s*:\s*\n\s*(.+?)\s*\n\s*Grupo\s*:', 'Por determinar')
    group = captured(r'Grupo\s*:\s*\n\s*(.+?)\s*\n\s*C.digo\s*:', '')
    estado = captured(r'Estado\s*:\s*\n\s*(.+?)\s*\n\s*Calificaci.n\s*:', 'En Revisión')
    score = captured(r'Calificaci.n\s*:\s*\n\s*(.+?)\s*\n\s*Tecnolog.as\s*:', '')
    tech_text = captured(r'Tecnolog.as\s*:\s*\n\s*(.+?)\s*\n\s*Resumen\b', '')
    resumen = captured(r'Resumen\s*\n\s*(.+?)(?=\s*\n\s*Introducci.n\b|$)', '')
    tecnologias = [item.strip() for item in re.split(r'\s+[·•�]\s+|\s*,\s*', tech_text) if item.strip()]
    autores = ' · '.join(item.strip() for item in re.split(r'\s+[·•�]\s+', authors) if item.strip()) or 'Por determinar'
    estados = {'Aprobada', 'En Revisión', 'Observada', 'Rechazada'}
    promocion = code[:3] if re.fullmatch(r'C\d{2}-\d{3}', code) else 'C24'
    return {
        'titulo': title or filename_title,
        'autor': autores,
        'grupo': group,
        'promocion': promocion,
        'codigo': code,
        'estado': estado if estado in estados else 'En Revisión',
        'score': score,
        'tecnologias': tecnologias,
        'resumen': resumen,
    }, pages


class PDFPreviewView(APIView):
    """Extrae metadatos sin crear registros para completar el formulario antes de guardar."""
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        _, err = _auth.authenticate(request)
        if err: return err
        pdf_file = request.FILES.get('file')
        if not pdf_file or not pdf_file.name.lower().endswith('.pdf'):
            return Response({'error': 'Selecciona un archivo PDF válido.'}, status=status.HTTP_400_BAD_REQUEST)
        if pdf_file.size > 20 * 1024 * 1024:
            return Response({'error': 'El archivo supera los 20 MB.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            metadata, pages = _metadata_from_pdf(pdf_file)
        except Exception as exc:
            return Response({'error': f'No se pudo leer el PDF: {exc}'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'metadata': metadata, 'pages': len(pages)})


class RAGUploadView(APIView):
    """
    POST /api/rag/upload/   multipart: file=<PDF>, tesis_id=<int|omitir>
    Extrae texto del PDF página a página, guarda chunks en documentos_rag.
    Si no se indica tesis_id, crea una nueva Tesis con el nombre del archivo.
    """
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        user_id, err = _auth.authenticate(request)
        if err: return err

        pdf_file = request.FILES.get('file')
        tesis_id = request.data.get('tesis_id')

        if not pdf_file:
            return Response({'error': 'No se recibió ningún archivo.'}, status=status.HTTP_400_BAD_REQUEST)
        if not pdf_file.name.lower().endswith('.pdf'):
            return Response({'error': 'Solo se aceptan archivos PDF.'}, status=status.HTTP_400_BAD_REQUEST)
        if pdf_file.size > 20 * 1024 * 1024:
            return Response({'error': 'El archivo supera los 20 MB.'}, status=status.HTTP_400_BAD_REQUEST)

        # Extraer texto por página y datos de la carátula
        try:
            metadata, pages_text = _metadata_from_pdf(pdf_file)
        except Exception as e:
            return Response({'error': f'No se pudo leer el PDF: {e}'}, status=status.HTTP_400_BAD_REQUEST)

        # Obtener o crear la Tesis asociada
        if tesis_id:
            try:
                tesis = Tesis.objects.get(pk=int(tesis_id))
            except (Tesis.DoesNotExist, ValueError):
                return Response({'error': 'Proyecto no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            tesis  = Tesis.objects.create(
                titulo      = metadata['titulo'],
                autor       = metadata['autor'],
                grupo       = metadata['grupo'] or None,
                promocion   = metadata['promocion'],
                codigo      = metadata['codigo'] or None,
                estado      = metadata['estado'],
                score       = metadata['score'] or None,
                tecnologias = metadata['tecnologias'],
                usuario_id  = user_id,
            )
            tesis.refresh_from_db()

        safe_name = re.sub(r'[^A-Za-z0-9._-]+', '_', pdf_file.name)
        pdf_file.seek(0)
        target = f"tesis/{tesis.codigo or tesis.id}/{safe_name}"
        if default_storage.exists(target):
            default_storage.delete(target)
        tesis.ruta_pdf = default_storage.save(target, pdf_file)
        tesis.save(update_fields=['ruta_pdf'])

        if metadata['resumen']:
            DocumentoRAG.objects.filter(tesis=tesis, pagina_origen=0).delete()
            resumen_doc = DocumentoRAG.objects.create(
                tesis=tesis, contenido_texto=metadata['resumen'], pagina_origen=0, chunk_index=0,
            )
            try:
                _guardar_embedding(resumen_doc.id, metadata['resumen'])
            except Exception:
                pass

        # Cargar modelo de embeddings una vez para todo el archivo
        try:
            model = _get_model()
            model_loaded = True
        except Exception:
            model_loaded = False

        # Guardar chunks con embedding (un chunk por página)
        chunks_creados = 0
        for i, texto in enumerate(pages_text):
            texto = texto.strip()
            if not texto:
                continue

            DocumentoRAG.objects.filter(tesis=tesis, pagina_origen=i + 1, chunk_index=0).delete()
            chunk = DocumentoRAG.objects.create(
                tesis           = tesis,
                contenido_texto = texto[:4000],
                pagina_origen   = i + 1,
                chunk_index     = 0,
            )

            if model_loaded:
                _guardar_embedding(chunk.id, texto[:1000])

            chunks_creados += 1

        # Calcular similitud máxima contra proyectos existentes
        sim = _calcular_similitud_maxima(tesis.id) if chunks_creados > 0 else None
        if sim is not None:
            tesis.similitud_maxima = sim
            tesis.save(update_fields=['similitud_maxima'])

        return Response({
            'ok':             True,
            'filename':       pdf_file.name,
            'pages':          len(pages_text),
            'chunks':         chunks_creados,
            'embeddings':     model_loaded,
            'tesis_id':       tesis.id,
            'tesis_codigo':   tesis.codigo or '',
            'tesis_titulo':   tesis.titulo,
            'metadata':       metadata,
            'similitud':      float(sim) if sim is not None else 0,
        }, status=status.HTTP_201_CREATED)


class PerfilView(APIView):
    """
    GET   /api/perfil/  → datos del docente activo + estadísticas
    PATCH /api/perfil/  → actualiza campos editables (nombre, correo, departamento, bio)
    """
    ACTIVE_USER_ID = 1  # fallback cuando no hay token (solo para compatibilidad)

    def _stats(self, user_id):
        logs = list(LogConsulta.objects.filter(usuario_id=user_id).values('resultado')[:500])
        alertas = sum(
            1 for lc in logs
            if isinstance(lc['resultado'], list) and
               any(isinstance(d, dict) and d.get('similitud', 0) >= 85 for d in lc['resultado'])
        )
        return {
            'consultas_rag':       LogConsulta.objects.filter(usuario_id=user_id).count(),
            'proyectos_revisados': Tesis.objects.exclude(estado='En Revisión').count(),
            'alertas_emitidas':    alertas,
            'tesis_indexadas':     Tesis.objects.count(),
        }

    def _serialize(self, user):
        return {
            'nombre':      user.nombre,
            'correo':      user.email,
            'departamento': user.departamento or '',
            'codigo':      user.codigo_docente or '',
            'rol':         user.rol or '',
            'bio':         user.biografia or '',
            'stats':       self._stats(user.pk),
        }

    def get(self, request):
        user_id, err = _auth.authenticate(request)
        if err: return err
        try:
            user = Usuario.objects.get(pk=user_id)
            return Response(self._serialize(user))
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request):
        user_id, err = _auth.authenticate(request)
        if err: return err
        try:
            user = Usuario.objects.get(pk=user_id)
            mapping = {
                'nombre':      'nombre',
                'correo':      'email',
                'departamento': 'departamento',
                'bio':         'biografia',
            }
            changed = []
            for form_key, db_field in mapping.items():
                val = request.data.get(form_key)
                if val is not None and str(val).strip():
                    setattr(user, db_field, str(val).strip())
                    changed.append(db_field)
            if changed:
                user.save(update_fields=changed)
            return Response(self._serialize(user))
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)


class ConversacionListView(APIView):
    """
    GET  /api/conversaciones/   → lista de conversaciones del usuario activo
    POST /api/conversaciones/   → crea una conversación vacía (opcional)
    """
    def get(self, request):
        user_id, err = _auth.authenticate(request)
        if err: return err
        try:
            qs = Conversacion.objects.filter(
                usuario_id=user_id
            ).order_by('-updated_at')[:50]

            data = [
                {
                    'id':         c.id,
                    'titulo':     c.titulo,
                    'fecha':      c.updated_at.strftime('%d %b %Y'),
                    'hora':       c.updated_at.strftime('%H:%M'),
                }
                for c in qs
            ]
            return Response(data)
        except Exception:
            # Tablas aún no parcheadas en BD
            return Response([])

    def post(self, request):
        user_id, err = _auth.authenticate(request)
        if err: return err
        try:
            conv = Conversacion.objects.create(
                usuario_id = user_id,
                titulo     = 'Nueva conversación',
            )
            return Response({'id': conv.id, 'titulo': conv.titulo}, status=status.HTTP_201_CREATED)
        except Exception:
            return Response(
                {'error': 'La persistencia de conversaciones no está habilitada (aplica patch_conversaciones.sql).'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


class ConversacionDetailView(APIView):
    """
    GET    /api/conversaciones/<pk>/  → mensajes de la conversación
    DELETE /api/conversaciones/<pk>/  → elimina la conversación completa
    """
    def get(self, request, pk):
        user_id, err = _auth.authenticate(request)
        if err: return err
        try:
            conv = Conversacion.objects.get(pk=pk, usuario_id=user_id)
        except Conversacion.DoesNotExist:
            return Response({'error': 'Conversación no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        mensajes = [
            {
                'role':      m.rol,
                'content':   m.contenido,
                'documents': m.documentos if m.rol == 'assistant' else None,
            }
            for m in conv.mensajes.all()
        ]
        return Response({
            'id':       conv.id,
            'titulo':   conv.titulo,
            'mensajes': mensajes,
        })

    def delete(self, request, pk):
        user_id, err = _auth.authenticate(request)
        if err: return err
        try:
            Conversacion.objects.filter(pk=pk, usuario_id=user_id).delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception:
            return Response({'error': 'No se pudo eliminar'}, status=status.HTTP_400_BAD_REQUEST)


# ── XML Upload ────────────────────────────────────────────────────────────────

class XMLUploadView(APIView):
    """
    POST /api/xml/upload/
    Recibe un archivo XML con la estructura de tesis, crea el registro en BD
    e indexa todas las secciones como chunks RAG con embeddings.

    Formato XML esperado:
    <tesis>
      <titulo>...</titulo>
      <autores><autor>K. Quispe</autor></autores>
      <grupo>Grupo Alpha</grupo>
      <promocion>C24</promocion>
      <estado>Aprobada</estado>           <!-- opcional, default En Revisión -->
      <codigo>C24-001</codigo>            <!-- opcional -->
      <score>94/100</score>               <!-- opcional -->
      <tecnologias><tecnologia>React</tecnologia></tecnologias>
      <resumen>...</resumen>
      <secciones>
        <seccion titulo="Introducción">...</seccion>
        <seccion titulo="Marco Teórico">...</seccion>
      </secciones>
    </tesis>
    """
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        user_id, err = _auth.authenticate(request)
        if err: return err

        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No se recibió ningún archivo.'}, status=status.HTTP_400_BAD_REQUEST)
        if not file.name.lower().endswith('.xml'):
            return Response({'error': 'El archivo debe ser .xml'}, status=status.HTTP_400_BAD_REQUEST)

        import xml.etree.ElementTree as ET

        try:
            raw = file.read().decode('utf-8', errors='replace')
            try:
                root = ET.fromstring(raw)
            except ET.ParseError:
                # Los documentos académicos a veces incluyen comparadores como
                # "p<0.05" o ampersands sin escapar en el texto narrativo.
                sanitized = re.sub(r'&(?!#?\w+;)', '&amp;', raw)
                sanitized = re.sub(r'<(?!(?:/?[A-Za-z_?!]))', '&lt;', sanitized)
                root = ET.fromstring(sanitized)
        except ET.ParseError as e:
            return Response({'error': f'XML inválido: {e}'}, status=status.HTTP_400_BAD_REQUEST)

        def txt(tag, default=''):
            el = root.find(tag)
            return el.text.strip() if el is not None and el.text else default

        # ── Extraer metadata ──────────────────────────────────────────────────
        titulo    = txt('titulo')
        resumen   = txt('resumen')
        grupo     = txt('grupo') or None
        promocion = txt('promocion') or 'C24'
        codigo    = txt('codigo') or None
        score     = txt('score')  or None
        estado_raw = txt('estado') or 'En Revisión'

        ESTADOS_VALIDOS = {'En Revisión', 'Aprobada', 'Observada', 'Rechazada'}
        estado = estado_raw if estado_raw in ESTADOS_VALIDOS else 'En Revisión'

        # autores: <autores><autor>…</autor></autores>  ó  <autor>…</autor>
        autores_el = root.find('autores')
        if autores_el is not None:
            autor = ' · '.join(
                a.text.strip() for a in autores_el.findall('autor') if a.text
            )
        else:
            autor = txt('autor')

        # tecnologías
        techs_el = root.find('tecnologias')
        tecnologias = []
        if techs_el is not None:
            tecnologias = [t.text.strip() for t in techs_el.findall('tecnologia') if t.text]

        if not titulo or not autor:
            return Response(
                {'error': 'El XML debe contener <titulo> y <autores> (o <autor>).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Crear tesis ───────────────────────────────────────────────────────
        from django.db import IntegrityError
        try:
            tesis = Tesis.objects.create(
                titulo      = titulo,
                autor       = autor,
                grupo       = grupo,
                tecnologias = tecnologias,
                promocion   = promocion,
                estado      = estado,
                codigo      = codigo,
                score       = score,
                usuario_id  = user_id,
            )
        except IntegrityError:
            return Response(
                {'error': f'Ya existe un proyecto con el código "{codigo}". Cambia el <codigo> en el XML e intenta de nuevo.'},
                status=status.HTTP_409_CONFLICT,
            )

        # ── Indexar chunks ────────────────────────────────────────────────────
        chunks_indexados = 0
        textos = []

        # Resumen como chunk 0
        if resumen:
            textos.append({'texto': resumen, 'pagina': 0, 'chunk': 0, 'tag': 'Resumen'})

        # Secciones
        secciones_el = root.find('secciones')
        if secciones_el is not None:
            for pagina, sec in enumerate(secciones_el.findall('seccion'), start=1):
                contenido = (sec.text or '').strip()
                if not contenido:
                    continue
                # Partir en sub-chunks de ~1000 chars para textos largos
                MAX_CHUNK = 1000
                for ci, start in enumerate(range(0, len(contenido), MAX_CHUNK)):
                    textos.append({
                        'texto':  contenido[start:start + MAX_CHUNK],
                        'pagina': pagina,
                        'chunk':  ci,
                        'tag':    sec.get('titulo', f'Sección {pagina}'),
                    })

        for item in textos:
            try:
                doc = DocumentoRAG.objects.create(
                    tesis           = tesis,
                    contenido_texto = item['texto'],
                    pagina_origen   = item['pagina'],
                    chunk_index     = item['chunk'],
                )
                _guardar_embedding(doc.id, item['texto'])
                chunks_indexados += 1
            except Exception:
                pass

        # Calcular similitud máxima contra proyectos existentes
        sim = _calcular_similitud_maxima(tesis.id) if chunks_indexados > 0 else None
        if sim is not None:
            tesis.similitud_maxima = sim
            tesis.save(update_fields=['similitud_maxima'])

        return Response({
            'id':              tesis.id,
            'codigo':          tesis.codigo or '',
            'grupo':           tesis.grupo  or 'Sin Grupo',
            'estado':          ESTADO_DB_A_SLUG.get(tesis.estado, tesis.estado.lower()),
            'titulo':          tesis.titulo,
            'tecnologias':     tesis.tecnologias,
            'autores':         tesis.autor,
            'similitud':       float(sim) if sim is not None else 0,
            'score':           tesis.score,
            'fecha':           tesis.fecha_subida.strftime('%d %b %Y'),
            'chunks_indexados': chunks_indexados,
            'activo':          True,
        }, status=status.HTTP_201_CREATED)


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginView(APIView):
    """
    POST /api/auth/login/
    Body: { "email": "...", "password": "..." }
    Returns: { "token": "...", "nombre": "...", "rol": "..." }
    """
    def post(self, request):
        email    = (request.data.get('email') or '').strip().lower()
        password = (request.data.get('password') or '').strip()

        if not email or not password:
            return Response({'error': 'Email y contraseña requeridos.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = Usuario.objects.get(email__iexact=email, estado=True)
        except Usuario.DoesNotExist:
            return Response({'error': 'Credenciales incorrectas.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not _auth.check_password(password, user.password_hash):
            return Response({'error': 'Credenciales incorrectas.'}, status=status.HTTP_401_UNAUTHORIZED)

        token = _auth.create_token(user.pk)
        return Response({
            'token':  token,
            'nombre': user.nombre,
            'rol':    user.rol,
            'id':     user.pk,
        })


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Invalida el token del header Authorization.
    """
    def post(self, request):
        token = _auth.get_token_from_request(request)
        if token:
            _auth.revoke_token(token)
        return Response({'ok': True})

# == Estado de La BestIA ==

class StatusView(APIView):
    def get(self, request):
        import httpx
        from django.conf import settings

        _, err = _auth.authenticate(request)
        if err: return err

        gemini_configurado = bool(getattr(settings, 'GEMINI_API_KEY', ''))
        url    = getattr(settings, 'OPENWEBUI_URL', '')
        modelo = getattr(settings, 'OPENWEBUI_MODEL', '')
        
        if getattr(settings, 'OPENWEBUI_TOKEN', ''):
            try:
                resp = httpx.get(f'{url}/api/models', headers={'Authorization': f'Bearer {settings.OPENWEBUI_TOKEN}'}, timeout=2.0)
                if resp.status_code == 200:
                    return Response({'online': True, 'modo': 'ia', 'url': url, 'modelo': modelo, 'mensaje': 'La BestIA conectada'})
            except Exception:
                pass

        if gemini_configurado:
            return Response({'online': True, 'modo': 'ia_cloud', 'url': 'Nube (Gemini)', 'modelo': 'gemini-3.6-flash', 'mensaje': 'Usando Gemini'})

        return Response({'online': False, 'modo': 'demo', 'url': url, 'modelo': modelo, 'mensaje': 'Sin conexión a IA'})


class ModelosView(APIView):
    """
    GET /api/modelos/
    Lista los modelos disponibles en OpenWebUI.
    Retorna: { modelos: [ {id, name}, ... ], online: bool }
    """
    def get(self, request):
        import httpx
        from django.conf import settings

        _, err = _auth.authenticate(request)
        if err: return err

        if not settings.OPENWEBUI_TOKEN:
            return Response({'modelos': [
                {'id': 'local-rag', 'name': 'RAG Local (sin IA)'},
            ], 'online': False})

        try:
            resp = httpx.get(
                f'{settings.OPENWEBUI_URL}/api/models',
                headers={'Authorization': f'Bearer {settings.OPENWEBUI_TOKEN}'},
                timeout=5.0,
            )
            if resp.status_code != 200:
                raise Exception('no 200')
            data = resp.json()
            raw  = data.get('data', [])
            modelos = [
                {'id': m.get('id', ''), 'name': m.get('name', m.get('id', ''))}
                for m in raw
            ]
            return Response({'modelos': modelos, 'online': True})
        except Exception:
            return Response({'modelos': [
                {'id': 'local-rag', 'name': 'RAG Local (sin IA)'},
            ], 'online': False})


class RAGStreamView(APIView):
    """
    POST /api/rag/stream/
    Body: { "prompt": "...", "conversacion_id": null, "model": "..." }

    Devuelve una StreamingHttpResponse con formato Server-Sent Events (SSE).
    El frontend consume el stream con fetch + ReadableStream y actualiza el
    texto del mensaje token a token, igual que ChatGPT.

    Protocolo SSE:
      - data: {"type":"docs","docs":[...]}    ← primero: documentos similares
      - data: {"type":"delta","text":"..."}   ← luego: tokens del LLM
      - data: {"type":"done","conversacion_id":123}  ← final: id de conversación
    """
    def post(self, request):
        from django.http import StreamingHttpResponse
        import json as _json

        user_id, err = _auth.authenticate(request)
        if err:
            return err

        prompt = request.data.get('prompt', '').strip()
        if not prompt:
            return Response({'error': 'El campo prompt es requerido.'}, status=400)

        conversacion_id = request.data.get('conversacion_id')
        model           = request.data.get('model')

        # ── 1. Recuperación de evidencia ────────────────────────────────────
        similar_docs, context_chunks, retrieval = _buscar_evidencia(prompt)
        historial_llm = _obtener_historial(conversacion_id)

        # ── 2. Generador SSE ───────────────────────────────────────────────

        def event_stream():
            # Enviar documentos similares primero
            yield f"data: {_json.dumps({'type': 'docs', 'docs': similar_docs, 'retrieval': retrieval}, ensure_ascii=False)}\n\n"

            full_response = []
            try:
                for delta in llm_client.generate_answer_stream(prompt, context_chunks, model=model, historial=historial_llm):
                    full_response.append(delta)
                    yield f"data: {_json.dumps({'type': 'delta', 'text': delta}, ensure_ascii=False)}\n\n"
            except Exception:
                logger.exception('Falló la generación en streaming; se devuelve respuesta RAG local')
                msg = (
                    '*(Modo local de respaldo: el proveedor remoto no respondió.)*\n\n'
                    + llm_client.generate_local_answer(prompt, context_chunks)
                )
                full_response.append(msg)
                yield f"data: {_json.dumps({'type': 'delta', 'text': msg}, ensure_ascii=False)}\n\n"

            # Log + persistencia de conversación
            llm_response = ''.join(full_response)
            try:
                LogConsulta.objects.create(
                    usuario_id=user_id,
                    prompt_ingresado=prompt,
                    resultado=similar_docs,
                    tokens_procesados=800 + len(prompt.split()) * 40,
                )
            except Exception:
                # La auditoría no puede impedir que el chat se guarde.
                logger.exception('No se pudo registrar la auditoría de consulta stream')

            conv = _persistir_mensajes(
                conversacion_id, prompt, llm_response, similar_docs,
                usuario_id=user_id,
            )
            conv_id = conv.id if conv else None

            yield f"data: {_json.dumps({'type': 'done', 'conversacion_id': conv_id, 'persistence_error': conv is None, 'retrieval': retrieval}, ensure_ascii=False)}\n\n"

        resp = StreamingHttpResponse(event_stream(), content_type='text/event-stream; charset=utf-8')
        resp['Cache-Control']  = 'no-cache'
        resp['X-Accel-Buffering'] = 'no'
        return resp

class RAGCompararView(APIView):
    """
    POST /api/rag/comparar/
    Body: { "tesis_ids": [1, 2, 3], "modelo": "..." }
    """
    def post(self, request):
        from django.http import StreamingHttpResponse
        import json as _json

        user_id, err = _auth.authenticate(request)
        if err: return err

        tesis_ids = request.data.get('tesis_ids', [])
        if len(tesis_ids) < 2:
            return Response({'error': 'Se necesitan al menos 2 proyectos para comparar.'}, status=400)
        if len(tesis_ids) > 5:
            return Response({'error': 'Máximo 5 proyectos por comparación.'}, status=400)

        model = request.data.get('modelo')

        proyectos_info = []
        context_chunks = []
        try:
            tesis_list = Tesis.objects.filter(id__in=tesis_ids)
            for t in tesis_list:
                chunks = DocumentoRAG.objects.filter(tesis=t).order_by('pagina_origen')[:3]
                texto_resumen = ' '.join([c.contenido_texto[:800] for c in chunks])
                proyectos_info.append({
                    'id': t.id,
                    'titulo': t.titulo,
                    'autor': t.autor,
                    'estado': ESTADO_DB_A_SLUG.get(t.estado, t.estado),
                    'codigo': t.codigo,
                    'tecnologias': t.tecnologias if isinstance(t.tecnologias, list) else [],
                })
                context_chunks.append(f"PROYECTO: {t.titulo} ({t.codigo})\nAUTOR: {t.autor}\nCONTENIDO:\n{texto_resumen}")
        except Exception as e:
            return Response({'error': f'Error al recuperar proyectos: {e}'}, status=500)

        prompt_comparacion = (
            f"Analiza y compara los siguientes {len(proyectos_info)} proyectos de tesis del repositorio TecSis-IA. "
            f"Proyectos: {', '.join([p['titulo'] for p in proyectos_info])}. "
            f"Proporciona: 1) Similitudes temáticas y tecnológicas, "
            f"2) Diferencias clave en enfoque y metodología, "
            f"3) Cuál tiene mayor originalidad y por qué, "
            f"4) Riesgo de duplicidad entre ellos (porcentaje estimado). "
            f"Sé específico y menciona los títulos de cada proyecto."
        )

        def event_stream():
            yield f"data: {_json.dumps({'type': 'proyectos', 'proyectos': proyectos_info}, ensure_ascii=False)}\n\n"
            full_text = []
            try:
                for delta in llm_client.generate_answer_stream(prompt_comparacion, context_chunks, model=model):
                    full_text.append(delta)
                    yield f"data: {_json.dumps({'type': 'delta', 'text': delta}, ensure_ascii=False)}\n\n"
            except llm_client.LLMUnavailableError:
                msg = "⚠️ Motor de IA no disponible. Aquí el análisis básico basado en metadatos."
                full_text.append(msg)
                yield f"data: {_json.dumps({'type': 'delta', 'text': msg}, ensure_ascii=False)}\n\n"
            yield f"data: {_json.dumps({'type': 'done'}, ensure_ascii=False)}\n\n"

        resp = StreamingHttpResponse(event_stream(), content_type='text/event-stream; charset=utf-8')
        resp['Cache-Control'] = 'no-cache'
        resp['X-Accel-Buffering'] = 'no'
        return resp

class AdminModelosView(APIView):
    """
    GET  /api/admin/modelos/
    PATCH /api/admin/modelos/
    """
    def _authenticate_admin(self, request):
        user_id, err = _auth.authenticate(request)
        if err:
            return None, err
        is_admin = Usuario.objects.filter(pk=user_id, rol='admin', estado=True).exists()
        if not is_admin:
            return None, Response(
                {'error': 'Se requiere una cuenta administradora.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return user_id, None

    def get(self, request):
        import httpx
        from django.conf import settings

        _, err = self._authenticate_admin(request)
        if err: return err

        config_actual = {
            'openwebui_url':   settings.OPENWEBUI_URL,
            'modelo_activo':   settings.OPENWEBUI_MODEL,
            'tiene_token':     bool(settings.OPENWEBUI_TOKEN),
            'tiene_gemini':    bool(settings.GEMINI_API_KEY),
            'online':          False,
            'modelos_disponibles': [],
        }

        if settings.OPENWEBUI_TOKEN:
            try:
                resp = httpx.get(
                    f'{settings.OPENWEBUI_URL}/api/models',
                    headers={'Authorization': f'Bearer {settings.OPENWEBUI_TOKEN}'},
                    timeout=5.0,
                )
                if resp.status_code == 200:
                    raw = resp.json().get('data', [])
                    config_actual['modelos_disponibles'] = [
                        {'id': m.get('id',''), 'name': m.get('name', m.get('id',''))}
                        for m in raw
                    ]
                    config_actual['online'] = True
            except Exception:
                pass

        try:
            total_tokens = LogConsulta.objects.aggregate(
                total=__import__('django.db.models', fromlist=['Sum']).Sum('tokens_procesados')
            )['total'] or 0
            total_consultas = LogConsulta.objects.count()
            config_actual['stats'] = {'total_consultas': total_consultas, 'total_tokens': total_tokens}
        except Exception:
            config_actual['stats'] = {'total_consultas': 0, 'total_tokens': 0}

        return Response(config_actual)

    def patch(self, request):
        from django.conf import settings
        import os

        _, err = self._authenticate_admin(request)
        if err: return err

        nuevo_modelo = request.data.get('modelo', '').strip()
        nueva_url    = request.data.get('url', '').strip()
        nuevo_token  = request.data.get('token', '').strip()
        nuevo_gemini = request.data.get('gemini_key', '').strip()

        if not nuevo_modelo and not nueva_url and not nuevo_token and not nuevo_gemini:
            return Response({'error': 'Nada que actualizar.'}, status=400)

        if nuevo_modelo:
            settings.OPENWEBUI_MODEL = nuevo_modelo
            os.environ['OPENWEBUI_MODEL'] = nuevo_modelo
        if nueva_url:
            settings.OPENWEBUI_URL = nueva_url
            os.environ['OPENWEBUI_URL'] = nueva_url
        if nuevo_token:
            settings.OPENWEBUI_TOKEN = nuevo_token
            os.environ['OPENWEBUI_TOKEN'] = nuevo_token
        if nuevo_gemini:
            settings.GEMINI_API_KEY = nuevo_gemini
            os.environ['GEMINI_API_KEY'] = nuevo_gemini

        env_path = settings.BASE_DIR / '.env'
        try:
            with open(env_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            updates = {}
            if nuevo_modelo: updates['OPENWEBUI_MODEL'] = nuevo_modelo
            if nueva_url:    updates['OPENWEBUI_URL']   = nueva_url
            if nuevo_token:  updates['OPENWEBUI_TOKEN'] = nuevo_token
            if nuevo_gemini: updates['GEMINI_API_KEY'] = nuevo_gemini

            new_lines = []
            updated_keys = set()
            for line in lines:
                key = line.split('=')[0].strip()
                if key in updates:
                    new_lines.append(f"{key}={updates[key]}\n")
                    updated_keys.add(key)
                else:
                    new_lines.append(line)
            for k, v in updates.items():
                if k not in updated_keys:
                    new_lines.append(f"{k}={v}\n")

            with open(env_path, 'w', encoding='utf-8') as f:
                f.writelines(new_lines)
        except Exception as e:
            return Response({'warning': f'Error IO: {e}', 'modelo_activo': settings.OPENWEBUI_MODEL}, status=207)

        return Response({
            'ok': True,
            'modelo_activo': settings.OPENWEBUI_MODEL,
            'openwebui_url': settings.OPENWEBUI_URL,
            'tiene_token': bool(settings.OPENWEBUI_TOKEN),
            'tiene_gemini': bool(settings.GEMINI_API_KEY),
        })










