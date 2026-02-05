"""
Modèles Pydantic pour les transactions récurrentes.
"""

from pydantic import BaseModel


class RecurringCreate(BaseModel):
    """Création d'une transaction récurrente."""
    user_id: str
    account_id: str
    category_id: str | None = None
    type: str  # 'income', 'expense'
    amount: float
    description: str = ""
    frequency: str  # 'daily', 'weekly', 'monthly', 'yearly'
    start_date: str
    end_date: str | None = None
    occurrences_limit: int | None = None


class RecurringUpdate(BaseModel):
    """Mise à jour d'une transaction récurrente."""
    category_id: str | None = None
    type: str | None = None
    amount: float | None = None
    description: str | None = None
    frequency: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    is_active: bool | None = None
