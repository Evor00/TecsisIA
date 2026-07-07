import os
import sys
import threading

from django.apps import AppConfig


class RagApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'rag_api'

    def ready(self):
        from django.db.backends.signals import connection_created

        def set_search_path(sender, connection, **kwargs):
            if connection.vendor == 'postgresql':
                with connection.cursor() as cursor:
                    cursor.execute("SET search_path TO tecsisai, public;")

        connection_created.connect(set_search_path)

        # Precarga el modelo de embeddings en un hilo aparte para que la primera
        # consulta RAG no pague el costo de carga de sentence-transformers.
        # Solo se hace en el proceso real de `runserver`; comandos como migrate,
        # shell o reindex_rag no deben disparar una carga paralela del modelo.
        if 'runserver' in sys.argv and os.environ.get('RUN_MAIN'):
            def _preload_embedding_model():
                from .views import _get_model
                _get_model()

            threading.Thread(target=_preload_embedding_model, daemon=True).start()
