"""
Modèles Pydantic pour les utilisateurs.
"""

from pydantic import BaseModel


class UserProfileUpdate(BaseModel):
    """Mise à jour du profil utilisateur."""
    first_name: str | None = None
    last_name: str | None = None
    avatar_color: str | None = None
