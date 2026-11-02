import re

# -- 1. Fix ProyectoDetailView.patch() to handle all editable fields ----------
with open('rag_api/views.py', 'r', encoding='utf-8') as f:
    views = f.read()

old_patch = '''    def patch(self, request, pk):
        """PATCH /api/proyectos/<pk>/  - toggle activo o actualizar estado/score"""
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
        })'''

new_patch = '''    def patch(self, request, pk):
        """PATCH /api/proyectos/<pk>/  - edicion completa de un proyecto"""
        _, err = _auth.authenticate(request)
        if err: return err
        try:
            tesis = Tesis.objects.get(pk=pk)
        except Tesis.DoesNotExist:
            return Response({'error': 'No encontrado'}, status=status.HTTP_404_NOT_FOUND)

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
            slug = request.data['estado']
            tesis.estado = SLUG_A_ESTADO_DB.get(slug, slug)

        tesis.save()

        # Actualizar resumen (primer chunk)
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
        })'''

if old_patch in views:
    views = views.replace(old_patch, new_patch)
    print("PATCH method updated successfully.")
else:
    print("WARNING: Could not find old patch exactly, trying regex...")
    views = re.sub(
        r'def patch\(self, request, pk\):\s+"""PATCH.*?return Response\(\{[^}]*\}\)',
        new_patch,
        views,
        flags=re.DOTALL,
        count=1
    )
    print("Regex replacement done.")

with open('rag_api/views.py', 'w', encoding='utf-8') as f:
    f.write(views)

print("views.py saved.")
