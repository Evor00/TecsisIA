from time import perf_counter

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Descarga y carga el modelo de embeddings RAG para preparar el servidor.'

    def handle(self, *args, **options):
        from rag_api.views import _get_model

        inicio = perf_counter()
        model = _get_model()
        dimension = model.get_sentence_embedding_dimension()
        elapsed = perf_counter() - inicio
        self.stdout.write(self.style.SUCCESS(
            f'Modelo RAG listo: {dimension} dimensiones en {elapsed:.1f} s.'
        ))
