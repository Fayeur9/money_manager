"""
Modèles Pydantic pour les comptes bancaires.
"""

from pydantic import BaseModel


class AccountCreate(BaseModel):
    """Création d'un compte bancaire."""
    user_id: str
    name: str
    type: str = "checking"
    balance: float = 0.0
    currency: str = "EUR"
    icon: str = "/default/icons/wallet.png"
    color: str = "#6366f1"


class AccountUpdate(BaseModel):
    """Mise à jour d'un compte bancaire."""
    name: str | None = None
    type: str | None = None
    currency: str | None = None
    icon: str | None = None
    color: str | None = None
