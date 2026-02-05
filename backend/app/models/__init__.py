"""
Modèles Pydantic pour la validation des données.
"""

from app.models.auth import LoginRequest, RegisterRequest
from app.models.user import UserProfileUpdate
from app.models.account import AccountCreate, AccountUpdate
from app.models.category import CategoryCreate, CategoryUpdate
from app.models.transaction import TransactionCreate, TransactionUpdate
from app.models.recurring import RecurringCreate, RecurringUpdate
from app.models.budget import BudgetCreate, BudgetUpdate, BudgetCheckRequest, BudgetOrderUpdate

__all__ = [
    # Auth
    "LoginRequest",
    "RegisterRequest",
    # User
    "UserProfileUpdate",
    # Account
    "AccountCreate",
    "AccountUpdate",
    # Category
    "CategoryCreate",
    "CategoryUpdate",
    # Transaction
    "TransactionCreate",
    "TransactionUpdate",
    # Recurring
    "RecurringCreate",
    "RecurringUpdate",
    # Budget
    "BudgetCreate",
    "BudgetUpdate",
    "BudgetCheckRequest",
    "BudgetOrderUpdate",
]
