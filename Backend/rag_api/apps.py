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
