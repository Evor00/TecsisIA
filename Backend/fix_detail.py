import re

with open('rag_api/views.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_class = '''class ProyectoDetailView(APIView):
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
            'autor':        tesis.autor,
            'grupo':        tesis.grupo or '',
            'promocion':    tesis.promocion or '',
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
        _, err = _auth.authenticate(request)
        if err: return err
        try:
            tesis = Tesis.objects.get(pk=pk)
            DocumentoRAG.objects.filter(tesis=tesis).delete()
            tesis.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Tesis.DoesNotExist:
            return Response({'error': 'No encontrado'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        _, err = _auth.authenticate(request)
        if err: return err
        try:
            tesis = Tesis.objects.get(pk=pk)
        except Tesis.DoesNotExist:
            return Response({'error': 'No encontrado'}, status=status.HTTP_404_NOT_FOUND)

        if 'titulo' in request.data:       tesis.titulo       = request.data['titulo']
        if 'autor' in request.data:        tesis.autor        = request.data['autor']
        if 'grupo' in request.data:        tesis.grupo        = request.data['grupo']
        if 'estado' in request.data:
            tesis.estado = SLUG_A_ESTADO_DB.get(request.data['estado'], request.data['estado'])
        if 'tecnologias' in request.data:  tesis.tecnologias  = request.data['tecnologias']
        if 'promocion' in request.data:    tesis.promocion    = request.data['promocion']
        if 'codigo' in request.data:       tesis.codigo       = request.data['codigo']
        if 'activo' in request.data:       tesis.activo       = bool(request.data['activo'])
        if 'score' in request.data:        tesis.score        = request.data['score']

        tesis.save()
        
        if 'resumen' in request.data:
            primer_chunk = DocumentoRAG.objects.filter(tesis=tesis).order_by('pagina_origen', 'chunk_index').first()
            if primer_chunk:
                primer_chunk.contenido_texto = request.data['resumen']
                primer_chunk.save()
            else:
                DocumentoRAG.objects.create(tesis=tesis, contenido_texto=request.data['resumen'], pagina_origen=1, chunk_index=1)

        return Response({'ok': True, 'id': tesis.id, 'titulo': tesis.titulo})
'''

content = re.sub(
    r"class ProyectoDetailView\(APIView\):.*?def get_client_ip\(request\):",
    new_class + "\n\n\ndef get_client_ip(request):",
    content,
    flags=re.DOTALL
)

with open('rag_api/views.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replaced ProyectoDetailView successfully.")
