"""
Modèles Pydantic pour l'authentification.
"""

from pydantic import BaseModel


class LoginRequest(BaseModel):
    """Requête de connexion."""
    email: str
    password: str


class RegisterRequest(BaseModel):
    """Requête d'inscription."""
    email: str
    password: str
    first_name: str
    last_name: str
