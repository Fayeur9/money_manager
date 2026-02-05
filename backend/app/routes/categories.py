"""
Category management routes.
Supports hierarchical categories with parent/child relationships.
"""

from fastapi import APIRouter, HTTPException
import uuid

from app.database import get_db
from app.models.category import CategoryCreate, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("")
async def get_categories(user_id: str = None):
    """
    Get categories for a user.
    All categories belong to a specific user (no more global default categories).
    Includes parent_id for hierarchical display.
    """
    with get_db() as (conn, cursor):
        if user_id:
            cursor.execute("""
                SELECT cat_id as id, cat_usr_id as user_id, cat_parent_id as parent_id,
                       cat_name as name, cat_type as type, cat_icon as icon,
                       cat_color as color, cat_is_default as is_default
                FROM mm_categories
                WHERE cat_usr_id = %s
                ORDER BY cat_parent_id IS NOT NULL, cat_name ASC
            """, (user_id,))
        else:
            # Sans user_id, retourner une liste vide (plus de catégories globales)
            return {"categories": []}
        categories = cursor.fetchall()
    return {"categories": categories}


@router.post("")
async def create_category(request: CategoryCreate):
    """Create a new custom category with optional parent."""
    with get_db() as (conn, cursor):
        # Validation du parent si fourni
        if request.parent_id:
            cursor.execute("""
                SELECT cat_id, cat_type FROM mm_categories WHERE cat_id = %s
            """, (request.parent_id,))
            parent = cursor.fetchone()
            if not parent:
                raise HTTPException(status_code=404, detail="Catégorie parente non trouvée")
            if parent['cat_type'] != request.type:
                raise HTTPException(
                    status_code=400,
                    detail="La catégorie enfant doit être du même type que son parent"
                )

        category_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO mm_categories (cat_id, cat_usr_id, cat_parent_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default)
            VALUES (%s, %s, %s, %s, %s, %s, %s, FALSE)
        """, (category_id, request.user_id, request.parent_id, request.name, request.type, request.icon, request.color))

        cursor.execute("""
            SELECT cat_id as id, cat_usr_id as user_id, cat_parent_id as parent_id,
                   cat_name as name, cat_type as type, cat_icon as icon,
                   cat_color as color, cat_is_default as is_default
            FROM mm_categories WHERE cat_id = %s
        """, (category_id,))
        category = cursor.fetchone()

    return {"category": category}


@router.put("/{category_id}")
async def update_category(category_id: str, request: CategoryUpdate):
    """Update a category (name, icon, color, parent)."""
    with get_db() as (conn, cursor):
        cursor.execute("""
            SELECT cat_id, cat_type FROM mm_categories WHERE cat_id = %s
        """, (category_id,))
        category = cursor.fetchone()
        if not category:
            raise HTTPException(status_code=404, detail="Catégorie non trouvée")

        # Validation du parent si fourni
        request_data = request.model_dump(exclude_unset=True)
        if 'parent_id' in request_data and request_data['parent_id'] is not None:
            parent_id = request_data['parent_id']
            # Une catégorie ne peut pas être son propre parent
            if parent_id == category_id:
                raise HTTPException(status_code=400, detail="Une catégorie ne peut pas être son propre parent")

            cursor.execute("""
                SELECT cat_id, cat_type FROM mm_categories WHERE cat_id = %s
            """, (parent_id,))
            parent = cursor.fetchone()
            if not parent:
                raise HTTPException(status_code=404, detail="Catégorie parente non trouvée")

            # Le type doit correspondre
            new_type = request_data.get('type', category['cat_type'])
            if parent['cat_type'] != new_type:
                raise HTTPException(
                    status_code=400,
                    detail="La catégorie enfant doit être du même type que son parent"
                )

        field_mapping = {
            'name': 'cat_name',
            'type': 'cat_type',
            'icon': 'cat_icon',
            'color': 'cat_color',
            'parent_id': 'cat_parent_id'
        }

        updates = []
        values = []
        for field, value in request_data.items():
            if field in field_mapping:
                updates.append(f"{field_mapping[field]} = %s")
                values.append(value)

        if updates:
            values.append(category_id)
            cursor.execute(f"""
                UPDATE mm_categories SET {', '.join(updates)} WHERE cat_id = %s
            """, values)

        cursor.execute("""
            SELECT cat_id as id, cat_usr_id as user_id, cat_parent_id as parent_id,
                   cat_name as name, cat_type as type, cat_icon as icon,
                   cat_color as color, cat_is_default as is_default
            FROM mm_categories WHERE cat_id = %s
        """, (category_id,))
        category = cursor.fetchone()

    return {"category": category}


@router.delete("/{category_id}")
async def delete_category(category_id: str):
    """Delete a category. Children become orphans (parent_id = NULL)."""
    with get_db() as (conn, cursor):
        cursor.execute("SELECT cat_id FROM mm_categories WHERE cat_id = %s", (category_id,))
        category = cursor.fetchone()
        if not category:
            raise HTTPException(status_code=404, detail="Catégorie non trouvée")

        # Les enfants deviennent orphelins (géré par ON DELETE SET NULL dans le schema)
        # Mettre à jour les transactions et récurrentes
        cursor.execute("UPDATE mm_transactions SET trx_cat_id = NULL WHERE trx_cat_id = %s", (category_id,))
        cursor.execute("UPDATE mm_recurring SET rec_cat_id = NULL WHERE rec_cat_id = %s", (category_id,))
        cursor.execute("DELETE FROM mm_categories WHERE cat_id = %s", (category_id,))

    return {"message": "Catégorie supprimée"}


@router.get("/{category_id}/children")
async def get_category_children(category_id: str):
    """Get all direct children of a category."""
    with get_db() as (conn, cursor):
        cursor.execute("""
            SELECT cat_id as id, cat_usr_id as user_id, cat_parent_id as parent_id,
                   cat_name as name, cat_type as type, cat_icon as icon,
                   cat_color as color, cat_is_default as is_default
            FROM mm_categories
            WHERE cat_parent_id = %s
            ORDER BY cat_name ASC
        """, (category_id,))
        children = cursor.fetchall()
    return {"children": children}


@router.get("/{category_id}/descendants")
async def get_category_descendants(category_id: str):
    """Get all descendants (children, grandchildren, etc.) of a category recursively."""
    with get_db() as (conn, cursor):
        # Requête récursive avec CTE pour obtenir tous les descendants
        cursor.execute("""
            WITH RECURSIVE descendants AS (
                SELECT cat_id, cat_usr_id, cat_parent_id, cat_name, cat_type,
                       cat_icon, cat_color, cat_is_default, 0 as level
                FROM mm_categories
                WHERE cat_parent_id = %s

                UNION ALL

                SELECT c.cat_id, c.cat_usr_id, c.cat_parent_id, c.cat_name, c.cat_type,
                       c.cat_icon, c.cat_color, c.cat_is_default, d.level + 1
                FROM mm_categories c
                INNER JOIN descendants d ON c.cat_parent_id = d.cat_id
            )
            SELECT cat_id as id, cat_usr_id as user_id, cat_parent_id as parent_id,
                   cat_name as name, cat_type as type, cat_icon as icon,
                   cat_color as color, cat_is_default as is_default, level
            FROM descendants
            ORDER BY level, cat_name
        """, (category_id,))
        descendants = cursor.fetchall()
    return {"descendants": descendants}


@router.post("/reset")
async def reset_categories(user_id: str):
    """
    Reset user's categories to default.
    Deletes all existing categories and recreates the default ones.
    Warning: This will also unlink all transactions and recurring from their categories.
    """
    with get_db() as (conn, cursor):
        # Vérifier que l'utilisateur existe
        cursor.execute("SELECT usr_id FROM mm_users WHERE usr_id = %s", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

        # Supprimer les budgets liés aux catégories de l'utilisateur
        cursor.execute("""
            DELETE FROM mm_budgets WHERE bgt_usr_id = %s
        """, (user_id,))

        # Délier les transactions et récurrentes de leurs catégories
        cursor.execute("""
            UPDATE mm_transactions t
            JOIN mm_accounts a ON t.trx_acc_id = a.acc_id
            SET t.trx_cat_id = NULL
            WHERE a.acc_usr_id = %s
        """, (user_id,))

        cursor.execute("""
            UPDATE mm_recurring SET rec_cat_id = NULL WHERE rec_usr_id = %s
        """, (user_id,))

        # Supprimer toutes les catégories de l'utilisateur
        cursor.execute("DELETE FROM mm_categories WHERE cat_usr_id = %s", (user_id,))

        # Appeler la procédure pour créer les catégories par défaut
        cursor.callproc('create_default_categories_for_user', (user_id,))

        # Récupérer les nouvelles catégories
        cursor.execute("""
            SELECT cat_id as id, cat_usr_id as user_id, cat_parent_id as parent_id,
                   cat_name as name, cat_type as type, cat_icon as icon,
                   cat_color as color, cat_is_default as is_default
            FROM mm_categories
            WHERE cat_usr_id = %s
            ORDER BY cat_parent_id IS NOT NULL, cat_name ASC
        """, (user_id,))
        categories = cursor.fetchall()

    return {"message": "Catégories réinitialisées", "categories": categories}
