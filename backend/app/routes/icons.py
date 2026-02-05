"""
Routes pour la gestion des icônes.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pathlib import Path
import uuid

from app.database import get_db

router = APIRouter(prefix="/icons", tags=["Icônes"])

# Chemin vers le dossier frontend/public
FRONTEND_PUBLIC_PATH = Path(__file__).parent.parent.parent.parent / "frontend" / "public"
ALLOWED_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp'}


@router.get("/default")
async def get_default_icons():
    """Récupère la liste des icônes par défaut."""
    icons_path = FRONTEND_PUBLIC_PATH / "default" / "icons"
    icons = []

    if icons_path.exists():
        for file in icons_path.iterdir():
            if file.suffix.lower() in ALLOWED_EXTENSIONS:
                icons.append({
                    "name": file.stem,
                    "path": f"/default/icons/{file.name}"
                })

    return {"icons": sorted(icons, key=lambda x: x['name'])}
