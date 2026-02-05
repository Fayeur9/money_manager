"""
Budget management routes.
Budget hierarchy is independent from category hierarchy.
Same category can appear in multiple parent budgets.
"""

from fastapi import APIRouter, HTTPException
from datetime import date
from calendar import monthrange
import uuid

from app.database import get_db
from app.models.budget import BudgetCreate, BudgetUpdate, BudgetCheckRequest, BudgetOrderUpdate

router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.post("")
async def create_budget(request: BudgetCreate):
    """
    Create a new budget for a category.
    Budget hierarchy is independent from category hierarchy.
    """
    with get_db() as (conn, cursor):
        # Si c'est un budget enfant, vérifier que le parent existe
        if request.parent_budget_id:
            cursor.execute("""
                SELECT bgt_id, bgt_parent_id FROM mm_budgets WHERE bgt_id = %s AND bgt_usr_id = %s
            """, (request.parent_budget_id, request.user_id))
            parent_budget = cursor.fetchone()
            if not parent_budget:
                raise HTTPException(status_code=404, detail="Budget parent non trouvé")
            # Un budget enfant ne peut pas avoir d'enfants (1 seul niveau)
            if parent_budget['bgt_parent_id']:
                raise HTTPException(status_code=400, detail="Un budget enfant ne peut pas avoir d'enfants")

            # Vérifier que cette catégorie n'est pas déjà enfant de ce parent
            cursor.execute("""
                SELECT bgt_id FROM mm_budgets
                WHERE bgt_parent_id = %s AND bgt_cat_id = %s
            """, (request.parent_budget_id, request.category_id))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Cette catégorie a déjà un budget sous ce parent")

            # Vérifier que cette catégorie n'est pas elle-même un budget parent
            cursor.execute("""
                SELECT b.bgt_id FROM mm_budgets b
                WHERE b.bgt_cat_id = %s AND b.bgt_usr_id = %s AND b.bgt_parent_id IS NULL
                AND EXISTS (SELECT 1 FROM mm_budgets child WHERE child.bgt_parent_id = b.bgt_id)
            """, (request.category_id, request.user_id))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Cette catégorie est déjà un budget parent avec des enfants")
        else:
            # Budget parent : vérifier qu'il n'existe pas déjà un budget parent pour cette catégorie
            cursor.execute("""
                SELECT bgt_id FROM mm_budgets
                WHERE bgt_usr_id = %s AND bgt_cat_id = %s AND bgt_parent_id IS NULL
            """, (request.user_id, request.category_id))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Un budget parent existe déjà pour cette catégorie")

        # Vérifier que la catégorie existe et est une dépense
        cursor.execute("""
            SELECT cat_id, cat_type FROM mm_categories WHERE cat_id = %s
        """, (request.category_id,))
        category = cursor.fetchone()
        if not category:
            raise HTTPException(status_code=404, detail="Catégorie non trouvée")
        if category['cat_type'] != 'expense':
            raise HTTPException(status_code=400, detail="Les budgets ne peuvent être créés que pour les catégories de dépenses")

        budget_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO mm_budgets (bgt_id, bgt_usr_id, bgt_cat_id, bgt_parent_id, bgt_amount)
            VALUES (%s, %s, %s, %s, %s)
        """, (budget_id, request.user_id, request.category_id, request.parent_budget_id, request.amount))

        cursor.execute("""
            SELECT b.bgt_id as id, b.bgt_cat_id as category_id, b.bgt_parent_id as parent_budget_id,
                   b.bgt_amount as amount, c.cat_name as category_name,
                   c.cat_icon as category_icon, c.cat_color as category_color
            FROM mm_budgets b
            JOIN mm_categories c ON b.bgt_cat_id = c.cat_id
            WHERE b.bgt_id = %s
        """, (budget_id,))
        budget = cursor.fetchone()

    return {"budget": budget}


@router.put("/{budget_id}")
async def update_budget(budget_id: str, request: BudgetUpdate):
    """Update a budget."""
    with get_db() as (conn, cursor):
        cursor.execute("SELECT bgt_id, bgt_usr_id, bgt_parent_id FROM mm_budgets WHERE bgt_id = %s", (budget_id,))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Budget non trouvé")

        # Update category if provided
        if request.category_id is not None:
            # Check that the new category exists and is an expense
            cursor.execute("""
                SELECT cat_id, cat_type FROM mm_categories WHERE cat_id = %s
            """, (request.category_id,))
            category = cursor.fetchone()
            if not category:
                raise HTTPException(status_code=404, detail="Catégorie non trouvée")
            if category['cat_type'] != 'expense':
                raise HTTPException(status_code=400, detail="Les budgets ne peuvent être créés que pour les catégories de dépenses")

            # Check that no budget already exists for this category under same parent
            cursor.execute("""
                SELECT bgt_id FROM mm_budgets
                WHERE bgt_usr_id = %s AND bgt_cat_id = %s AND bgt_id != %s
                AND (bgt_parent_id = %s OR (bgt_parent_id IS NULL AND %s IS NULL))
            """, (existing['bgt_usr_id'], request.category_id, budget_id,
                  existing['bgt_parent_id'], existing['bgt_parent_id']))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Un budget existe déjà pour cette catégorie sous ce parent")

            cursor.execute("UPDATE mm_budgets SET bgt_cat_id = %s WHERE bgt_id = %s",
                          (request.category_id, budget_id))

        # Update amount if provided
        if request.amount is not None:
            cursor.execute("UPDATE mm_budgets SET bgt_amount = %s WHERE bgt_id = %s",
                          (request.amount, budget_id))

        cursor.execute("""
            SELECT b.bgt_id as id, b.bgt_cat_id as category_id, b.bgt_parent_id as parent_budget_id,
                   b.bgt_amount as amount, c.cat_name as category_name,
                   c.cat_icon as category_icon, c.cat_color as category_color
            FROM mm_budgets b
            JOIN mm_categories c ON b.bgt_cat_id = c.cat_id
            WHERE b.bgt_id = %s
        """, (budget_id,))
        budget = cursor.fetchone()

    return {"budget": budget}


@router.delete("/{budget_id}")
async def delete_budget(budget_id: str):
    """
    Delete a budget.
    Child budgets are automatically deleted via CASCADE.
    """
    with get_db() as (conn, cursor):
        cursor.execute("SELECT bgt_id FROM mm_budgets WHERE bgt_id = %s", (budget_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Budget non trouvé")

        # La suppression en cascade des enfants est gérée par la FK ON DELETE CASCADE
        cursor.execute("DELETE FROM mm_budgets WHERE bgt_id = %s", (budget_id,))

    return {"message": "Budget supprimé"}


@router.get("/{budget_id}/available-categories")
async def get_available_categories_for_child_budget(budget_id: str, user_id: str):
    """
    Get categories available to add as child budgets.
    Excludes:
    - Categories already child of this parent budget
    - Categories that are themselves parent budgets (with children)
    """
    with get_db() as (conn, cursor):
        # Vérifier que le budget existe et est un parent (pas d'enfant)
        cursor.execute("""
            SELECT bgt_id, bgt_parent_id FROM mm_budgets WHERE bgt_id = %s AND bgt_usr_id = %s
        """, (budget_id, user_id))
        budget = cursor.fetchone()
        if not budget:
            raise HTTPException(status_code=404, detail="Budget non trouvé")
        if budget['bgt_parent_id']:
            raise HTTPException(status_code=400, detail="Seuls les budgets parents peuvent avoir des enfants")

        # Récupérer les catégories disponibles
        cursor.execute("""
            SELECT c.cat_id as id, c.cat_name as name, c.cat_icon as icon, c.cat_color as color,
                   c.cat_parent_id as parent_id, pc.cat_name as parent_name
            FROM mm_categories c
            LEFT JOIN mm_categories pc ON c.cat_parent_id = pc.cat_id
            WHERE c.cat_type = 'expense'
            AND (c.cat_usr_id = %s OR c.cat_usr_id IS NULL)
            -- Exclure les catégories déjà enfants de ce budget parent
            AND c.cat_id NOT IN (
                SELECT bgt_cat_id FROM mm_budgets WHERE bgt_parent_id = %s
            )
            -- Exclure les catégories qui sont elles-mêmes des budgets parents avec enfants
            AND c.cat_id NOT IN (
                SELECT b.bgt_cat_id FROM mm_budgets b
                WHERE b.bgt_usr_id = %s AND b.bgt_parent_id IS NULL
                AND EXISTS (SELECT 1 FROM mm_budgets child WHERE child.bgt_parent_id = b.bgt_id)
            )
            ORDER BY c.cat_name ASC
        """, (user_id, budget_id, user_id))
        categories = cursor.fetchall()

    return {"categories": categories}
