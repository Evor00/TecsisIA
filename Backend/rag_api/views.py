from django.db import connection
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Tesis, LogConsulta, Usuario, DocumentoRAG, Conversacion, Mensaje
from . import llm_client
from . import auth as _auth


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

def _get_model():
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        _embedding_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
    return _embedding_model

def _encode(text: str) -> list[float]:
    return _get_model().encode(text[:1000]).tolist()

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
        qs = Tesis.objects.order_by('codigo')[:8]
    else:
        q = Q()
        for p in palabras:
            q |= (
                Q(titulo__icontains=p) |
                Q(autor__icontains=p)  |
                Q(tecnologias__icontains=p) |
                Q(grupo__icontains=p)
            )
        qs = list(Tesis.objects.filter(q).distinct()[:6]) if palabras else []
        if not qs:
            qs = Tesis.objects.order_by('codigo')[:6]

    return sorted([
        {
            'titulo':    t.titulo,
            'autor':     t.autor,
            'similitud': 50 if es_listado else _similitud_aproximada(prompt, t.titulo),
            'estado':    ESTADO_DB_A_SLUG.get(t.estado, t.estado),
            'codigo':    t.codigo,
        }
        for t in qs
    ], key=lambda x: x['similitud'], reverse=True)


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
        conversacion = None
        if conversacion_id:
            conversacion = Conversacion.objects.filter(pk=conversacion_id).first()

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
        # Si patch_conversaciones.sql aún no se aplicó, el chat sigue funcionando
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

        similar_docs    = []
        context_chunks  = []
        usando_vectores = False

        try:
            vec_prompt = _vec_str(_encode(prompt))

            with connection.cursor() as cur:
                cur.execute("""
                    WITH ranked AS (
                        SELECT
                            t.id AS tesis_id,
                            t.titulo,
                            t.autor,
                            t.estado,
                            t.codigo,
                            dr.contenido_texto,
                            (1 - (dr.embedding <=> %s::vector)) * 100 AS similitud,
                            ROW_NUMBER() OVER (
                                PARTITION BY t.id
                                ORDER BY dr.embedding <=> %s::vector
                            ) AS rn
                        FROM documentos_rag dr
                        JOIN tesis t ON dr.tesis_id = t.id
                        WHERE dr.embedding IS NOT NULL
                          AND t.activo = TRUE
                    )
                    SELECT tesis_id, titulo, autor, estado, codigo, contenido_texto, similitud
                    FROM ranked
                    WHERE rn = 1
                    ORDER BY similitud DESC
                    LIMIT 6
                """, [vec_prompt, vec_prompt])
                rows = cur.fetchall()

            if rows:
                top = []
                for _tesis_id, titulo, autor, estado, codigo, texto, similitud in rows:
                    top.append({
                        'titulo':    titulo,
                        'autor':     autor,
                        'similitud': round(float(similitud), 1),
                        'estado':    ESTADO_DB_A_SLUG.get(estado, estado),
                        'codigo':    codigo,
                        'texto':     texto,
                    })

                similar_docs = [{k: v for k, v in d.items() if k != 'texto'} for d in top]
                context_chunks = [f"[{d['titulo']} — {d['autor']}]\n{d['texto'][:1500]}" for d in top]
                usando_vectores = True
        except Exception as e:
            print(f"[TecSis-IA] Error en búsqueda vectorial RAG: {e}")

        if not similar_docs:
            similar_docs = _keyword_search(prompt)

        try:
            llm_response = llm_client.generate_answer(prompt, context_chunks)
        except llm_client.LLMUnavailableError:
            metodo = 'similitud coseno (pgvector)' if usando_vectores else 'búsqueda por palabras clave'
            llm_response = (
                f"⚠️ El motor de IA local no está disponible en este momento (revisa la conexión con OpenWebUI). "
                f"Mientras tanto, esto es lo que encontré por {metodo} para tu consulta sobre '{prompt}':"
            )

        LogConsulta.objects.create(
            usuario_id        = user_id,
            prompt_ingresado  = prompt,
            resultado         = similar_docs,
            tokens_procesados = 800 + len(prompt.split()) * 40,
        )

        # ── Persistir la conversación (historial navegable tipo ChatGPT) ──
        conversacion = _persistir_mensajes(
            conversacion_id, prompt, llm_response, similar_docs,
            usuario_id=user_id,
        )

        return Response({
            'query': prompt,
            'llm_response': llm_response,
            'similar_documents': similar_docs,
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
                Q(autor__icontains=search_param)  |
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
        primer = chunks.first()

        return Response({
            'id':           tesis.id,
            'codigo':       tesis.codigo or '',
            'titulo':       tesis.titulo,
            'autores':      tesis.autor,
            'grupo':        tesis.grupo or '',
            'estado':       ESTADO_DB_A_SLUG.get(tesis.estado, tesis.estado),
            'tecnologias':  tesis.tecnologias if isinstance(tesis.tecnologias, list) else [],
            'similitud':    float(tesis.similitud_maxima) if tesis.similitud_maxima else 0,
            'score':        tesis.score,
            'fecha':        tesis.fecha_subida.strftime('%d %b %Y'),
            'resumen':      primer.contenido_texto if primer else None,
            'total_chunks': chunks.count(),
            'activo':       tesis.activo,
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
        """PATCH /api/proyectos/<pk>/  — toggle activo o actualizar estado/score"""
        _, err = _auth.authenticate(request)
        if err: return err
        try:
            tesis = Tesis.objects.get(pk=pk)
        except Tesis.DoesNotExist:
            return Response({'error': 'No encontrado'}, status=status.HTTP_404_NOT_FOUND)

        changed = []
        if 'activo' in request.data:
            tesis.activo = bool(request.data['activo'])
            changed.append('activo')

        if 'estado' in request.data:
            ESTADOS_VALIDOS = {'En Revisión', 'Aprobada', 'Observada', 'Rechazada'}
            nuevo = request.data['estado']
            if nuevo in ESTADOS_VALIDOS:
                tesis.estado = nuevo
                changed.append('estado')

        if 'score' in request.data:
            tesis.score = request.data['score'] or None
            changed.append('score')

        if changed:
            tesis.save(update_fields=changed + ['updated_at'])

        return Response({
            'id':     tesis.id,
            'activo': tesis.activo,
            'estado': ESTADO_DB_A_SLUG.get(tesis.estado, tesis.estado),
            'score':  tesis.score,
        })


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

        # Extraer texto por página
        try:
            from pypdf import PdfReader
            reader     = PdfReader(pdf_file)
            pages_text = [p.extract_text() or '' for p in reader.pages]
        except Exception as e:
            return Response({'error': f'No se pudo leer el PDF: {e}'}, status=status.HTTP_400_BAD_REQUEST)

        # Obtener o crear la Tesis asociada
        if tesis_id:
            try:
                tesis = Tesis.objects.get(pk=int(tesis_id))
            except (Tesis.DoesNotExist, ValueError):
                return Response({'error': 'Proyecto no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            titulo = pdf_file.name[:-4].replace('_', ' ').replace('-', ' ').title()
            tesis  = Tesis.objects.create(
                titulo      = titulo,
                autor       = 'Por determinar',
                promocion   = 'C24',
                estado      = 'En Revisión',
                tecnologias = [],
            )
            tesis.refresh_from_db()

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
            root = ET.fromstring(raw)
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
