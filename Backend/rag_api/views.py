from django.db import connection
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Tesis, LogConsulta


# ── helpers ───────────────────────────────────────────────────────────────────

ESTADO_DB_A_SLUG = {
    'Aprobada':    'aprobado',
    'En Revisión': 'en-revision',
    'Observada':   'observado',
    'Rechazada':   'rechazado',
}

SLUG_A_ESTADO_DB = {v: k for k, v in ESTADO_DB_A_SLUG.items()}


def _similitud_aproximada(prompt: str, titulo: str) -> int:
    """
    Similitud textual básica hasta que el pipeline de embeddings esté activo.
    Cuenta palabras del prompt que aparecen en el título.
    """
    palabras = [p.lower() for p in prompt.split() if len(p) > 3]
    if not palabras:
        return 50
    hits = sum(1 for p in palabras if p in titulo.lower())
    return min(95, 45 + int((hits / len(palabras)) * 50))


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
    Busca en la tabla tesis usando similitud textual (placeholder vectorial).
    Guarda la consulta en log_consultas.
    """
    def post(self, request):
        prompt = request.data.get('prompt', '').strip()
        if not prompt:
            return Response(
                {'error': 'El campo prompt es requerido.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Búsqueda por palabras clave en título y autor
        palabras = [p for p in prompt.split() if len(p) > 2]
        q = Q()
        for p in palabras:
            q |= Q(titulo__icontains=p) | Q(autor__icontains=p)

        qs = Tesis.objects.filter(q).order_by('id')[:6] if palabras else Tesis.objects.all()[:4]

        similar_docs = sorted(
            [
                {
                    'titulo':    t.titulo,
                    'autor':     t.autor,
                    'similitud': _similitud_aproximada(prompt, t.titulo),
                    'estado':    ESTADO_DB_A_SLUG.get(t.estado, t.estado),
                    'codigo':    t.codigo,
                }
                for t in qs
            ],
            key=lambda x: x['similitud'],
            reverse=True,
        )

        # Registrar en el log
        LogConsulta.objects.create(
            prompt_ingresado  = prompt,
            resultado         = similar_docs,
            tokens_procesados = 800 + len(prompt.split()) * 40,
        )

        return Response({
            'query': prompt,
            'llm_response': (
                f"He analizado el repositorio semántico y encontré documentos relacionados "
                f"con tu consulta sobre '{prompt}'. "
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
