from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework import authentication, exceptions


ACCESS_TOKEN_TTL = timedelta(minutes=60)


def generate_access_token(user) -> str:
    """Create a signed JWT for the given user."""
    payload = {
        "sub": str(user.pk),
        "email": user.email,
        "exp": datetime.now(tz=timezone.utc) + ACCESS_TOKEN_TTL,
        "iat": datetime.now(tz=timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise exceptions.AuthenticationFailed("Token has expired")
    except jwt.InvalidTokenError:
        raise exceptions.AuthenticationFailed("Invalid token")


def build_auth_response(user) -> dict:
    """Payload used by login/register endpoints."""
    return {
        "token": generate_access_token(user),
        "token_type": "bearer",
        "user": {
            "id": str(user.pk),
            "email": user.email,
            "name": user.get_full_name() or user.email,
        },
    }


class JWTAuthentication(authentication.BaseAuthentication):
    """
    Lightweight JWT auth for API endpoints.
    Looks for: Authorization: Bearer <token>
    """

    keyword = "Bearer"

    def authenticate(self, request) -> Optional[Tuple[object, str]]:
        auth_header = authentication.get_authorization_header(request).decode("utf-8")
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0] != self.keyword:
            raise exceptions.AuthenticationFailed("Invalid Authorization header")

        token = parts[1]
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise exceptions.AuthenticationFailed("Invalid token payload")

        User = get_user_model()
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed("User not found")

        return user, token

    def authenticate_header(self, request) -> str:
        return self.keyword


def get_current_user(request):
    """Convenience helper to extract user from request (JWT or anonymous)."""
    user = getattr(request, "user", None)
    if not user or isinstance(user, AnonymousUser):
        raise exceptions.NotAuthenticated("Authentication credentials were not provided.")
    return user

