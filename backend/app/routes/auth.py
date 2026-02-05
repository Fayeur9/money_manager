"""
Authentication routes.
"""

from fastapi import APIRouter, HTTPException
import uuid

from app.database import get_db
from app.auth import create_access_token, verify_password, hash_password
from app.models.auth import LoginRequest, RegisterRequest

router = APIRouter(prefix="/auth", tags=["Authentication"])


# Catégories par défaut avec hiérarchie
DEFAULT_CATEGORIES = {
    "expense": {
        "Alimentation": {
            "icon": "/default/icons/cart.png",
            "color": "#ef4444",
            "children": ["Courses", "Restaurants", "Fast-food", "Livraison"]
        },
        "Transport": {
            "icon": "/default/icons/car.png",
            "color": "#f59e0b",
            "children": ["Carburant", "Transports en commun", "Taxi/VTC", "Entretien véhicule"]
        },
        "Logement": {
            "icon": "/default/icons/home.png",
            "color": "#eab308",
            "children": ["Loyer", "Charges", "Assurance habitation", "Travaux"]
        },
        "Santé": {
            "icon": "/default/icons/pill.png",
            "color": "#22c55e",
            "children": ["Médecin", "Pharmacie", "Mutuelle"]
        },
        "Loisirs": {
            "icon": "/default/icons/gamepad.png",
            "color": "#14b8a6",
            "children": ["Sorties", "Sport", "Jeux vidéo", "Culture"]
        },
        "Achats": {
            "icon": "/default/icons/bag.png",
            "color": "#06b6d4",
            "children": ["Vêtements", "High-tech", "Mobilier"]
        },
        "Abonnements": {
            "icon": "/default/icons/repeat.png",
            "color": "#3b82f6",
            "children": ["Streaming", "Téléphone", "Internet"]
        },
        "Éducation": {
            "icon": "/default/icons/book.png",
            "color": "#6366f1",
            "children": ["Formations", "Livres", "Fournitures"]
        },
        "Cadeaux": {
            "icon": "/default/icons/gift.png",
            "color": "#8b5cf6",
            "children": []
        },
        "Voyages": {
            "icon": "/default/icons/plane.png",
            "color": "#a855f7",
            "children": ["Hébergement", "Billets", "Activités"]
        },
        "Autres dépenses": {
            "icon": "/default/icons/money.png",
            "color": "#ec4899",
            "children": []
        },
    },
    "income": {
        "Salaire": {
            "icon": "/default/icons/salary.png",
            "color": "#22c55e",
            "children": []
        },
        "Travail indépendant": {
            "icon": "/default/icons/briefcase.png",
            "color": "#10b981",
            "children": ["Missions", "Consulting"]
        },
        "Investissements": {
            "icon": "/default/icons/chart.png",
            "color": "#14b8a6",
            "children": ["Dividendes", "Plus-values"]
        },
        "Remboursements": {
            "icon": "/default/icons/refresh.png",
            "color": "#06b6d4",
            "children": []
        },
        "Cadeaux reçus": {
            "icon": "/default/icons/gift.png",
            "color": "#0ea5e9",
            "children": []
        },
        "Autres revenus": {
            "icon": "/default/icons/plus.png",
            "color": "#3b82f6",
            "children": []
        },
    }
}


def create_default_categories_for_user(cursor, user_id: str):
    """Crée les catégories par défaut avec hiérarchie pour un nouvel utilisateur."""
    for cat_type, categories in DEFAULT_CATEGORIES.items():
        for parent_name, parent_data in categories.items():
            # Créer la catégorie parente
            parent_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO mm_categories (cat_id, cat_usr_id, cat_parent_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default)
                VALUES (%s, %s, NULL, %s, %s, %s, %s, FALSE)
            """, (parent_id, user_id, parent_name, cat_type, parent_data["icon"], parent_data["color"]))

            # Créer les sous-catégories
            for child_name in parent_data["children"]:
                child_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO mm_categories (cat_id, cat_usr_id, cat_parent_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, FALSE)
                """, (child_id, user_id, parent_id, child_name, cat_type, parent_data["icon"], parent_data["color"]))


@router.post("/login")
async def login(request: LoginRequest):
    """Authenticates a user and returns a JWT token."""
    with get_db() as (conn, cursor):
        cursor.execute("""
            SELECT usr_id, usr_email, usr_password_hash, usr_first_name, usr_last_name,
                   usr_avatar_url, usr_avatar_color
            FROM mm_users
            WHERE usr_email = %s
        """, (request.email,))
        user = cursor.fetchone()

    if not user:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    if not verify_password(request.password, user['usr_password_hash']):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    # Create token
    token = create_access_token({"sub": str(user['usr_id']), "email": user['usr_email']})

    return {
        "token": token,
        "user": {
            "id": user['usr_id'],
            "email": user['usr_email'],
            "first_name": user['usr_first_name'],
            "last_name": user['usr_last_name'],
            "avatar_url": user['usr_avatar_url'],
            "avatar_color": user['usr_avatar_color'],
        }
    }


@router.post("/register")
async def register(request: RegisterRequest):
    """Registers a new user with default categories."""
    with get_db() as (conn, cursor):
        cursor.execute("SELECT usr_id FROM mm_users WHERE usr_email = %s", (request.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")

        password_hash = hash_password(request.password)
        user_id = str(uuid.uuid4())

        # Créer l'utilisateur
        cursor.execute("""
            INSERT INTO mm_users (usr_id, usr_email, usr_password_hash, usr_first_name, usr_last_name)
            VALUES (%s, %s, %s, %s, %s)
        """, (user_id, request.email, password_hash, request.first_name, request.last_name))

        # Créer les catégories par défaut avec hiérarchie
        # Note: les comptes par défaut sont créés via le trigger after_user_insert
        create_default_categories_for_user(cursor, user_id)

    token = create_access_token({"sub": user_id, "email": request.email})

    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": request.email,
            "first_name": request.first_name,
            "last_name": request.last_name,
            "avatar_url": None,
            "avatar_color": "#6366f1",
        }
    }
