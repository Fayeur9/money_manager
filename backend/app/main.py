"""
Point d'entrée de l'API FastAPI.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_database, test_connection
from app.routes import (
    auth_router,
    users_router,
    accounts_router,
    categories_router,
    transactions_router,
    recurring_router,
    icons_router,
    budgets_router,
    advances_router,
)

settings = get_settings()

# Création de l'application FastAPI
app = FastAPI(
    title="Gestion Comptes API",
    description="API pour la gestion des comptes personnels",
    version="1.0.0",
)

# Configuration CORS pour permettre les requêtes du frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    """Initialise la base de données au démarrage."""
    try:
        init_database()
    except Exception as e:
        print(f"Erreur lors de l'initialisation: {e}")


# =============================================================================
# ROUTES DE BASE
# =============================================================================

@app.get("/")
async def root():
    """Route racine - vérification que l'API fonctionne."""
    return {"message": "API Gestion Comptes", "status": "running"}


@app.get("/health")
async def health_check():
    """Vérifie l'état de santé de l'API et la connexion à la BDD."""
    db_connected = test_connection()
    return {
        "status": "healthy" if db_connected else "degraded",
        "database": "connected" if db_connected else "disconnected",
    }


# =============================================================================
# INCLUSION DES ROUTERS
# =============================================================================

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(accounts_router)
app.include_router(categories_router)
app.include_router(transactions_router)
app.include_router(recurring_router)
app.include_router(icons_router)
app.include_router(budgets_router)
app.include_router(advances_router)
