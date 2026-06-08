from django.db import connection
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Tesis, LogConsulta, Usuario, DocumentoRAG


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


# ── Vistas ────────────────────────────────────────────────────────────────────

class DashboardMetricsView(APIView):
    """
    GET /api/dashboard/metrics/
    Llama al stored procedure sp_obtener_metricas_dashboard() en PostgreSQL.
    """
    def get(self, request):
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
        prompt = request.data.get('prompt', '').strip()
        if not prompt:
            return Response(
                {'error': 'El campo prompt es requerido.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        similar_docs = []
        usando_vectores = False

        try:
            vec = _encode(prompt)
            vec_str = _vec_str(vec)

            with connection.cursor() as cur:
                cur.execute("""
                    SELECT
                        t.id, t.titulo, t.autor, t.estado, t.codigo,
                        ROUND(CAST((1 - MIN(dr.embedding <=> %s::vector)) * 100 AS numeric), 1) AS similitud
                    FROM documentos_rag dr
                    JOIN tesis t ON dr.tesis_id = t.id
                    WHERE dr.embedding IS NOT NULL
                    GROUP BY t.id, t.titulo, t.autor, t.estado, t.codigo
                    ORDER BY MIN(dr.embedding <=> %s::vector)
                    LIMIT 6
                """, [vec_str, vec_str])
                cols = [d[0] for d in cur.description]
                rows = cur.fetchall()

            if rows:
                similar_docs = [
                    {
                        'titulo':    r[1],
                        'autor':     r[2],
                        'similitud': float(r[5]),
                        'estado':    ESTADO_DB_A_SLUG.get(r[3], r[3]),
                        'codigo':    r[4],
                    }
                    for r in rows
                ]
                usando_vectores = True
        except Exception:
            pass

        if not similar_docs:
            similar_docs = _keyword_search(prompt)

        LogConsulta.objects.create(
            prompt_ingresado  = prompt,
            resultado         = similar_docs,
            tokens_procesados = 800 + len(prompt.split()) * 40,
        )

        metodo = 'similitud coseno (pgvector)' if usando_vectores else 'búsqueda por palabras clave'
        return Response({
            'query': prompt,
            'llm_response': (
                f"He analizado el repositorio semántico usando {metodo} "
                f"y encontré documentos relacionados con tu consulta sobre '{prompt}'. "
                f"Los resultados con mayor similitud son:"
            ),
            'similar_documents': similar_docs,
        })


class HistorialListView(APIView):
    """
    GET /api/historial/
    Devuelve los últimos 50 registros de log_consultas formateados
    para la tabla del Historial de Análisis.
    """
    def get(self, request):
        logs = LogConsulta.objects.order_by('-fecha')[:50]
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
        titulo      = request.data.get('titulo', '').strip()
        autor       = request.data.get('autor', '').strip()
        grupo       = request.data.get('grupo', '').strip() or None
        tecnologias = request.data.get('tecnologias', [])
        promocion   = request.data.get('promocion', 'C24').strip()
        resumen     = request.data.get('resumen', '').strip()

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
            estado      = 'En Revisión',
        )
        tesis.refresh_from_db()

        # Guardar resumen como chunk 0 (pagina_origen=0 = abstract)
        # Requiere patch_abstract_constraint.sql aplicado en BD
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
                try:
                    vec = _encode(resumen)
                    with connection.cursor() as cur:
                        cur.execute(
                            "UPDATE documentos_rag SET embedding = %s::vector WHERE id = %s",
                            [_vec_str(vec), chunk.id],
                        )
                except Exception:
                    pass
            except Exception:
                # Si el constraint aún no fue parcheado, la tesis igual se registra
                pass

        return Response({
            'id':              tesis.id,
            'codigo':          tesis.codigo or '',
            'grupo':           tesis.grupo  or 'Sin Grupo',
            'estado':          'en-revision',
            'titulo':          tesis.titulo,
            'tecnologias':     tesis.tecnologias if isinstance(tesis.tecnologias, list) else [],
            'autores':         tesis.autor,
            'similitud':       0,
            'score':           None,
            'fecha':           tesis.fecha_subida.strftime('%d %b %Y'),
            'resumen_guardado': resumen_guardado,
        }, status=status.HTTP_201_CREATED)


class ProyectoDetailView(APIView):
    """
    GET /api/proyectos/<pk>/
    Devuelve los datos completos de una tesis + su resumen/abstract
    (primer chunk de documentos_rag) y el total de chunks indexados.
    """
    def get(self, request, pk):
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
        })


class RAGUploadView(APIView):
    """
    POST /api/rag/upload/   multipart: file=<PDF>, tesis_id=<int|omitir>
    Extrae texto del PDF página a página, guarda chunks en documentos_rag.
    Si no se indica tesis_id, crea una nueva Tesis con el nombre del archivo.
    """
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
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
                try:
                    vec     = model.encode(texto[:1000]).tolist()
                    vec_str = _vec_str(vec)
                    with connection.cursor() as cur:
                        cur.execute(
                            "UPDATE documentos_rag SET embedding = %s::vector WHERE id = %s",
                            [vec_str, chunk.id],
                        )
                except Exception:
                    pass

            chunks_creados += 1

        return Response({
            'ok':             True,
            'filename':       pdf_file.name,
            'pages':          len(pages_text),
            'chunks':         chunks_creados,
            'embeddings':     model_loaded,
            'tesis_id':       tesis.id,
            'tesis_codigo':   tesis.codigo or '',
            'tesis_titulo':   tesis.titulo,
        }, status=status.HTTP_201_CREATED)


class PerfilView(APIView):
    """
    GET   /api/perfil/  → datos del docente activo + estadísticas
    PATCH /api/perfil/  → actualiza campos editables (nombre, correo, departamento, bio)
    """
    ACTIVE_USER_ID = 1  # placeholder hasta implementar autenticación real

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
        try:
            user = Usuario.objects.get(pk=self.ACTIVE_USER_ID)
            return Response(self._serialize(user))
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request):
        try:
            user = Usuario.objects.get(pk=self.ACTIVE_USER_ID)
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
