from unittest.mock import patch

from django.test import SimpleTestCase, override_settings

from . import auth, llm_client
from .views import (
    RAG_MAX_CHARS_PER_SOURCE,
    _guardar_cache_evidencia,
    _invalidar_cache_evidencia,
    _leer_cache_evidencia,
    _documentos_vectoriales,
    _buscar_evidencia,
    _formatear_contexto,
    _titulo_desde_prompt,
)


class AuthHelpersTests(SimpleTestCase):
    def setUp(self):
        auth._TOKEN_STORE.clear()

    def tearDown(self):
        auth._TOKEN_STORE.clear()

    def test_created_token_resolves_to_its_user(self):
        token = auth.create_token(42)

        self.assertEqual(auth.resolve_token(token), 42)

    def test_revoked_token_no_longer_resolves(self):
        token = auth.create_token(42)
        auth.revoke_token(token)

        self.assertIsNone(auth.resolve_token(token))

    def test_expired_token_is_removed(self):
        with patch('rag_api.auth.time.time', return_value=100):
            token = auth.create_token(42)
        with patch('rag_api.auth.time.time', return_value=100 + auth.TOKEN_TTL + 1):
            self.assertIsNone(auth.resolve_token(token))

        self.assertNotIn(token, auth._TOKEN_STORE)


class RAGHelpersTests(SimpleTestCase):
    def setUp(self):
        _invalidar_cache_evidencia()

    def tearDown(self):
        _invalidar_cache_evidencia()

    def test_title_is_normalized_and_limited(self):
        title = _titulo_desde_prompt('  Consulta   sobre   tesis  ', max_len=60)

        self.assertEqual(title, 'Consulta sobre tesis')

    @override_settings(OPENWEBUI_TOKEN='')
    def test_demo_response_uses_available_context(self):
        answer = llm_client.generate_answer(
            '¿Qué tecnología usa el proyecto?',
            ['[FUENTE: C24-001]\nEl proyecto implementa una aplicación con React y PostgreSQL.'],
        )

        self.assertIn('React', answer)
        self.assertIn('[FUENTE: C24-001]', answer)
        self.assertIn('Modo demostración', answer)

    @override_settings(OPENWEBUI_TOKEN='')
    def test_demo_response_without_context_explains_the_result(self):
        answer = llm_client.generate_answer('Consulta sin coincidencias', [])

        self.assertIn('No encontré proyectos', answer)

    def test_vector_results_below_threshold_are_not_evidence(self):
        documentos = _documentos_vectoriales([
            (1, 'Tesis relevante', 'Ana', 'Aprobada', 'C24-001', 'Texto válido.', 72.4),
            (1, 'Mismo proyecto', 'Ana', 'Aprobada', 'C24-001', 'Otro texto.', 68.0),
            (2, 'Tesis no relacionada', 'Luis', 'Aprobada', 'C24-002', 'Texto dudoso.', 39.9),
        ])

        self.assertEqual(len(documentos), 1)
        self.assertEqual(documentos[0]['cita'], 'C24-001')
        self.assertEqual(documentos[0]['similitud'], 72.4)

    def test_evidence_cache_normalizes_the_prompt_and_returns_a_copy(self):
        docs = [{'titulo': 'Proyecto', 'cita': 'C24-001'}]
        chunks = ['[FUENTE: C24-001]\nCONTENIDO: texto']
        _guardar_cache_evidencia('  Consulta  RAG ', docs, chunks, 'vectorial')

        cached_docs, cached_chunks, method = _leer_cache_evidencia('consulta rag')
        cached_docs[0]['titulo'] = 'Modificado'

        self.assertEqual(method, 'vectorial')
        self.assertEqual(cached_chunks, chunks)
        self.assertEqual(_leer_cache_evidencia('CONSULTA RAG')[0][0]['titulo'], 'Proyecto')

    def test_context_has_identifiable_source_and_size_limit(self):
        contexto = _formatear_contexto({
            'cita': 'C24-003',
            'titulo': 'Sistema de prueba',
            'autor': 'María',
            'texto': 'x' * (RAG_MAX_CHARS_PER_SOURCE + 100),
        })

        self.assertIn('[FUENTE: C24-003]', contexto)
        self.assertIn('TÍTULO: Sistema de prueba', contexto)
        self.assertLessEqual(contexto.count('x'), RAG_MAX_CHARS_PER_SOURCE)

    @patch('rag_api.views._keyword_search', side_effect=RuntimeError('base no disponible'))
    @patch('rag_api.views._encode', side_effect=RuntimeError('modelo no disponible'))
    def test_retrieval_without_dependencies_returns_no_evidence(self, _encode, _keyword):
        documentos, contexto, metadata = _buscar_evidencia('consulta de prueba')

        self.assertEqual(documentos, [])
        self.assertEqual(contexto, [])
        self.assertFalse(metadata['tiene_evidencia'])
        self.assertEqual(metadata['metodo'], 'sin_coincidencias')
