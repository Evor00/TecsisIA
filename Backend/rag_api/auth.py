"""
Token-based auth helpers for TecSis-IA.
Tokens live in memory (fine for a single-process dev/demo server).
"""
import secrets
import time

from django.contrib.auth.hashers import check_password, make_password  # noqa: F401 (make_password exported for mgmt)
from rest_framework.response import Response
from rest_framework import status

# {token: {'user_id': int, 'expires': float}}
_TOKEN_STORE: dict[str, dict] = {}

TOKEN_TTL = 60 * 60 * 8  # 8 horas


def create_token(user_id: int) -> str:
    token = secrets.token_hex(32)
    _TOKEN_STORE[token] = {'user_id': user_id, 'expires': time.time() + TOKEN_TTL}
    return token


def resolve_token(token: str) -> int | None:
    entry = _TOKEN_STORE.get(token)
    if not entry:
        return None
    if time.time() > entry['expires']:
        _TOKEN_STORE.pop(token, None)
        return None
    return entry['user_id']


def revoke_token(token: str) -> None:
    _TOKEN_STORE.pop(token, None)


def get_token_from_request(request) -> str | None:
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return auth[7:]
    return None


def authenticate(request):
    """
    Returns (user_id, None) if authenticated, or (None, 401 Response) if not.
    Usage:
        user_id, err = authenticate(request)
        if err: return err
    """
    token = get_token_from_request(request)
    if not token:
        return None, Response({'error': 'No autenticado.'}, status=status.HTTP_401_UNAUTHORIZED)
    user_id = resolve_token(token)
    if not user_id:
        return None, Response({'error': 'Token inválido o expirado.'}, status=status.HTTP_401_UNAUTHORIZED)
    return user_id, None
