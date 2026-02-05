"""
Modèles Pydantic pour les transactions.
"""

from pydantic import BaseModel


class TransactionCreate(BaseModel):
    """Création d'une transaction."""
    account_id: str
    category_id: str | None = None
    target_account_id: str | None = None  # Pour les transferts
    type: str  # 'income', 'expense', 'transfer'
    amount: float
    description: str = ""
    date: str  # Format: YYYY-MM-DD


class TransactionUpdate(BaseModel):
    """Mise à jour d'une transaction."""
    category_id: str | None = None
    type: str | None = None
    amount: float | None = None
    description: str | None = None
    date: str | None = None
