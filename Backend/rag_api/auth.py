"""Tokens firmados para TecSis-IA, válidos aun tras reiniciar el servidor."""
import hashlib
import hmac
import secrets
import time

from django.conf import settings

from django.contrib.auth.hashers import check_password, make_password  # noqa: F401 (make_password exported for mgmt)
from rest_framework.response import Response
from rest_framework import status

# Conserva únicamente revocaciones del proceso actual. La validez normal se
# obtiene de la firma, por eso no depende de memoria y sobrevive a reinicios.
_TOKEN_STORE: dict[str, dict] = {}

TOKEN_TTL = 60 * 60 * 8  # 8 horas


def create_token(user_id: int) -> str:
    expires = int(time.time() + TOKEN_TTL)
    payload = f'{user_id}.{expires}.{secrets.token_hex(16)}'
    signature = hmac.new(settings.SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    token = f'{payload}.{signature}'
    _TOKEN_STORE[token] = {'expires': expires}
    return token


def resolve_token(token: str) -> int | None:
    entry = _TOKEN_STORE.get(token)
    if entry and entry.get('revoked'):
        return None
    try:
        user_id, expires, nonce, signature = token.split('.', 3)
        payload = f'{user_id}.{expires}.{nonce}'
        expected = hmac.new(settings.SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected) or time.time() > int(expires):
            _TOKEN_STORE.pop(token, None)
            return None
    except (TypeError, ValueError):
        _TOKEN_STORE.pop(token, None)
        return None
    return int(user_id)


def revoke_token(token: str) -> None:
    _TOKEN_STORE[token] = {'revoked': True}


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
