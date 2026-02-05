"""
Modèles Pydantic pour les budgets.
"""

from pydantic import BaseModel


class BudgetCreate(BaseModel):
    """Création d'un budget."""
    user_id: str
    category_id: str
    amount: float
    parent_budget_id: str | None = None


class BudgetUpdate(BaseModel):
    """Mise à jour d'un budget."""
    category_id: str | None = None
    amount: float | None = None


class BudgetCheckRequest(BaseModel):
    """Vérification de dépassement de budget."""
    category_id: str
    amount: float


class BudgetOrderUpdate(BaseModel):
    """Mise à jour de l'ordre d'affichage des budgets."""
    budget_ids: list[str]  # Liste ordonnée des IDs de budgets à afficher
