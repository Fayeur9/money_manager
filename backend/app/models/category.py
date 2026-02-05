"""
Modèles Pydantic pour les catégories.
"""

from pydantic import BaseModel


class CategoryCreate(BaseModel):
    """Création d'une catégorie personnalisée."""
    user_id: str
    name: str
    type: str  # 'income' ou 'expense'
    icon: str = "/default/icons/dots.png"
    color: str = "#6366f1"
    parent_id: str | None = None  # ID de la catégorie parente (hiérarchie)


class CategoryUpdate(BaseModel):
    """Mise à jour d'une catégorie."""
    name: str | None = None
    type: str | None = None
    icon: str | None = None
    color: str | None = None
    parent_id: str | None = None  # ID de la catégorie parente (hiérarchie)
