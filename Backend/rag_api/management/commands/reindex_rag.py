from django.core.management.base import BaseCommand
from django.db import connection

from rag_api.models import DocumentoRAG
from rag_api.views import _encode, _vec_str


class Command(BaseCommand):
    help = "Regenera embeddings vector(384) para documentos_rag."

    def add_arguments(self, parser):
        parser.add_argument(
            "--all",
            action="store_true",
            help="Recalcula todos los embeddings, incluso los que ya tienen vector.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Cantidad maxima de chunks a procesar.",
        )

    def handle(self, *args, **options):
        if options["all"]:
            qs = DocumentoRAG.objects.order_by("id")
        else:
            with connection.cursor() as cur:
                cur.execute(
                    "SELECT id FROM documentos_rag WHERE embedding IS NULL ORDER BY id"
                )
                ids = [row[0] for row in cur.fetchall()]
            qs = DocumentoRAG.objects.filter(id__in=ids).order_by("id")

        docs = list(qs[: options["limit"]]) if options["limit"] else list(qs)
        total = len(docs)
        procesados = 0
        errores = 0

        for doc in docs:
            texto = (doc.contenido_texto or "").strip()
            if not texto:
                continue

            try:
                vec = _vec_str(_encode(texto))
                with connection.cursor() as cur:
                    cur.execute(
                        "UPDATE documentos_rag SET embedding = %s::vector WHERE id = %s",
                        [vec, doc.id],
                    )
                procesados += 1
                self.stdout.write(f"OK documento_rag.id={doc.id}")
            except Exception as exc:
                errores += 1
                self.stderr.write(f"ERROR documento_rag.id={doc.id}: {exc}")

        self.stdout.write(
            self.style.SUCCESS(
                f"Reindexado RAG terminado. Objetivo={total}, procesados={procesados}, errores={errores}"
            )
        )
