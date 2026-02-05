"""
Modèles Pydantic pour les avances (prêts en attente de remboursement).
"""

from pydantic import BaseModel
from typing import Optional


class AdvanceCreate(BaseModel):
    """Création d'une avance."""
    user_id: str
    account_id: str
    amount: float
    description: str = ""
    person: str  # Personne concernée (qui doit rembourser ou à qui je dois)
    date: str  # Format: YYYY-MM-DD
    due_date: Optional[str] = None  # Date limite de remboursement (optionnel)
    direction: str = "given"  # 'given' = j'ai prêté, 'received' = on m'a prêté
    transaction_id: Optional[str] = None  # Transaction liée (optionnel)
    skip_transaction: bool = False  # Ne pas créer de transaction automatique


class AdvanceUpdate(BaseModel):
    """Mise à jour d'une avance."""
    description: Optional[str] = None
    person: Optional[str] = None
    due_date: Optional[str] = None
    status: Optional[str] = None  # 'pending', 'partial', 'paid'
    amount_received: Optional[float] = None


class AdvancePayment(BaseModel):
    """Enregistrement d'un remboursement (partiel ou total)."""
    amount: float
    skip_transaction: bool = False  # Ne pas créer de transaction automatique
