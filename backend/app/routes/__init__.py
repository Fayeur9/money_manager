"""
Routes de l'API.
"""

from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.accounts import router as accounts_router
from app.routes.categories import router as categories_router
from app.routes.transactions import router as transactions_router
from app.routes.recurring import router as recurring_router
from app.routes.icons import router as icons_router
from app.routes.budgets import router as budgets_router
from app.routes.advances import router as advances_router

__all__ = [
    "auth_router",
    "users_router",
    "accounts_router",
    "categories_router",
    "transactions_router",
    "recurring_router",
    "icons_router",
    "budgets_router",
    "advances_router",
]
