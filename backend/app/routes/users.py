"""
User management routes.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pathlib import Path
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
import uuid

from app.database import get_db
from app.models.user import UserProfileUpdate


def calculate_next_occurrence(current_date: date, frequency: str) -> date:
    """Calculate the next occurrence date based on frequency."""
    if frequency == 'daily':
        return current_date + timedelta(days=1)
    elif frequency == 'weekly':
        return current_date + timedelta(weeks=1)
    elif frequency == 'biweekly':
        return current_date + timedelta(weeks=2)
    elif frequency == 'monthly':
        return current_date + relativedelta(months=1)
    elif frequency == 'quarterly':
        return current_date + relativedelta(months=3)
    elif frequency == 'semi_annual':
        return current_date + relativedelta(months=6)
    elif frequency == 'annual':
        return current_date + relativedelta(years=1)
    return current_date + relativedelta(months=1)

router = APIRouter(prefix="/users", tags=["Users"])

FRONTEND_PUBLIC_PATH = Path(__file__).parent.parent.parent.parent / "frontend" / "public"
ALLOWED_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp'}


# =============================================================================
# ROUTES /users
# =============================================================================

@router.get("")
async def get_users():
    """Get all users."""
    with get_db() as (conn, cursor):
        cursor.execute("""
            SELECT usr_id as id, usr_email as email, usr_first_name as first_name,
                   usr_last_name as last_name, usr_avatar_url as avatar_url,
                   usr_avatar_color as avatar_color, created_at, updated_at
            FROM mm_users
            ORDER BY created_at DESC
        """)
        users = cursor.fetchall()
    return {"users": users}


@router.get("/{user_id}")
async def get_user(user_id: str):
    """Get a user by ID."""
    with get_db() as (conn, cursor):
        cursor.execute("""
            SELECT usr_id as id, usr_email as email, usr_first_name as first_name,
                   usr_last_name as last_name, usr_avatar_url as avatar_url,
                   usr_avatar_color as avatar_color, created_at, updated_at
            FROM mm_users
            WHERE usr_id = %s
        """, (user_id,))
        user = cursor.fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return {"user": user}


@router.put("/{user_id}/profile")
async def update_user_profile(user_id: str, profile: UserProfileUpdate):
    """Update user profile information."""
    with get_db() as (conn, cursor):
        cursor.execute("SELECT usr_id FROM mm_users WHERE usr_id = %s", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

        updates = []
        values = []

        if profile.first_name is not None:
            updates.append("usr_first_name = %s")
            values.append(profile.first_name)
        if profile.last_name is not None:
            updates.append("usr_last_name = %s")
            values.append(profile.last_name)
        if profile.avatar_color is not None:
            updates.append("usr_avatar_color = %s")
            values.append(profile.avatar_color)

        if not updates:
            raise HTTPException(status_code=400, detail="Aucune donnée à mettre à jour")

        values.append(user_id)
        cursor.execute(f"""
            UPDATE mm_users SET {', '.join(updates)} WHERE usr_id = %s
        """, tuple(values))

        cursor.execute("""
            SELECT usr_id as id, usr_email as email, usr_first_name as first_name,
                   usr_last_name as last_name, usr_avatar_url as avatar_url,
                   usr_avatar_color as avatar_color
            FROM mm_users WHERE usr_id = %s
        """, (user_id,))
        user = cursor.fetchone()

    return {"user": user}


@router.post("/{user_id}/avatar")
async def upload_user_avatar(user_id: str, file: UploadFile = File(...)):
    """Upload a profile picture for the user."""
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Extension non autorisée. Extensions acceptées: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    with get_db() as (conn, cursor):
        cursor.execute("SELECT usr_id, usr_avatar_url FROM mm_users WHERE usr_id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

        if user['usr_avatar_url']:
            old_path = FRONTEND_PUBLIC_PATH / user['usr_avatar_url'].lstrip('/')
            if old_path.exists():
                old_path.unlink()

    unique_name = f"{user_id}_{uuid.uuid4().hex}{ext}"
    upload_path = FRONTEND_PUBLIC_PATH / "uploads" / "users"
    upload_path.mkdir(parents=True, exist_ok=True)

    file_path = upload_path / unique_name
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'upload: {str(e)}")

    avatar_url = f"/uploads/users/{unique_name}"
    with get_db() as (conn, cursor):
        cursor.execute("UPDATE mm_users SET usr_avatar_url = %s WHERE usr_id = %s", (avatar_url, user_id))
        cursor.execute("""
            SELECT usr_id as id, usr_email as email, usr_first_name as first_name,
                   usr_last_name as last_name, usr_avatar_url as avatar_url,
                   usr_avatar_color as avatar_color
            FROM mm_users WHERE usr_id = %s
        """, (user_id,))
        user = cursor.fetchone()

    return {"user": user}


@router.delete("/{user_id}/avatar")
async def delete_user_avatar(user_id: str):
    """Delete user's profile picture."""
    with get_db() as (conn, cursor):
        cursor.execute("SELECT usr_id, usr_avatar_url FROM mm_users WHERE usr_id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

        if user['usr_avatar_url']:
            old_path = FRONTEND_PUBLIC_PATH / user['usr_avatar_url'].lstrip('/')
            if old_path.exists():
                old_path.unlink()
            cursor.execute("UPDATE mm_users SET usr_avatar_url = NULL WHERE usr_id = %s", (user_id,))

        cursor.execute("""
            SELECT usr_id as id, usr_email as email, usr_first_name as first_name,
                   usr_last_name as last_name, usr_avatar_url as avatar_url,
                   usr_avatar_color as avatar_color
            FROM mm_users WHERE usr_id = %s
        """, (user_id,))
        user = cursor.fetchone()

    return {"user": user}


# =============================================================================
# ROUTES /users/{user_id}/accounts
# =============================================================================

@router.get("/{user_id}/accounts")
async def get_user_accounts(user_id: str):
    """Get all accounts for a user."""
    with get_db() as (conn, cursor):
        cursor.execute("""
            SELECT acc_id as id, acc_name as name, acc_type as type, acc_balance as balance,
                   acc_currency as currency, acc_icon as icon, acc_color as color, created_at
            FROM mm_accounts
            WHERE acc_usr_id = %s
            ORDER BY created_at DESC
        """, (user_id,))
        accounts = cursor.fetchall()
    return {"accounts": accounts}


# =============================================================================
# ROUTES /users/{user_id}/transactions
# =============================================================================

@router.get("/{user_id}/transactions")
async def get_user_transactions(
    user_id: str,
    limit: int = 50,
    offset: int = 0,
    category_id: str = None,
    start_date: str = None,
    end_date: str = None,
    include_children: bool = True
):
    """
    Get all transactions for a user (all accounts).

    Args:
        category_id: Filter by category (includes children if include_children=True)
        start_date: Filter from this date (YYYY-MM-DD)
        end_date: Filter until this date (YYYY-MM-DD)
        include_children: If True and category_id is set, include transactions from child categories
    """
    today = date.today()

    with get_db() as (conn, cursor):
        # Build the WHERE clause dynamically
        where_conditions = ["a.acc_usr_id = %s"]
        params = [user_id]

        # Date filtering
        if start_date:
            where_conditions.append("t.trx_date >= %s")
            params.append(start_date)
        if end_date:
            where_conditions.append("t.trx_date <= %s")
            params.append(end_date)
        else:
            # Default: exclude future transactions
            where_conditions.append("t.trx_date <= %s")
            params.append(today)

        # Category filtering (with optional children)
        if category_id:
            if include_children:
                # Get the category and all its children
                cursor.execute("""
                    SELECT cat_id FROM mm_categories
                    WHERE cat_id = %s OR cat_parent_id = %s
                """, (category_id, category_id))
                category_ids = [row['cat_id'] for row in cursor.fetchall()]
                if category_ids:
                    placeholders = ','.join(['%s'] * len(category_ids))
                    where_conditions.append(f"t.trx_cat_id IN ({placeholders})")
                    params.extend(category_ids)
            else:
                where_conditions.append("t.trx_cat_id = %s")
                params.append(category_id)

        where_clause = " AND ".join(where_conditions)
        params.extend([limit, offset])

        cursor.execute(f"""
            SELECT t.trx_id as id, t.trx_acc_id as account_id, t.trx_target_acc_id as target_account_id,
                   t.trx_cat_id as category_id, t.trx_rec_id as recurring_id, t.trx_type as type,
                   t.trx_amount as amount, t.trx_description as description, t.trx_date as date,
                   t.created_at, c.cat_name as category_name, c.cat_icon as category_icon,
                   c.cat_color as category_color, a.acc_name as account_name,
                   ta.acc_name as target_account_name
            FROM mm_transactions t
            LEFT JOIN mm_categories c ON t.trx_cat_id = c.cat_id
            JOIN mm_accounts a ON t.trx_acc_id = a.acc_id
            LEFT JOIN mm_accounts ta ON t.trx_target_acc_id = ta.acc_id
            WHERE {where_clause}
            ORDER BY t.trx_date DESC, t.created_at DESC
            LIMIT %s OFFSET %s
        """, params)
        transactions = cursor.fetchall()
    return {"transactions": transactions}


# =============================================================================
# ROUTES /users/{user_id}/recurring
# =============================================================================

@router.get("/{user_id}/recurring")
async def get_user_recurring_transactions(user_id: str):
    """Get recurring transactions for a user."""
    with get_db() as (conn, cursor):
        cursor.execute("""
            SELECT r.rec_id as id, r.rec_acc_id as account_id, r.rec_cat_id as category_id,
                   r.rec_type as type, r.rec_amount as amount, r.rec_description as description,
                   r.rec_frequency as frequency, r.rec_start_date as start_date,
                   r.rec_end_date as end_date, r.rec_occurrences_limit as occurrences_limit,
                   r.rec_occurrences_count as occurrences_count, r.rec_next_occurrence as next_occurrence,
                   r.rec_is_active as is_active, c.cat_name as category_name, c.cat_icon as category_icon,
                   c.cat_color as category_color, a.acc_name as account_name
            FROM mm_recurring r
            LEFT JOIN mm_categories c ON r.rec_cat_id = c.cat_id
            JOIN mm_accounts a ON r.rec_acc_id = a.acc_id
            WHERE r.rec_usr_id = %s
            ORDER BY r.rec_next_occurrence ASC
        """, (user_id,))
        recurring = cursor.fetchall()
    return {"recurring_transactions": recurring}


@router.post("/{user_id}/recurring/process")
async def process_recurring_transactions(user_id: str):
    """
    Process due recurring transactions for a user.
    Generates transactions for all recurrences where next_occurrence <= today.
    """
    today = date.today()
    transactions_created = []

    with get_db() as (conn, cursor):
        cursor.execute("""
            SELECT r.rec_id, r.rec_acc_id, r.rec_cat_id, r.rec_type, r.rec_amount,
                   r.rec_description, r.rec_frequency, r.rec_next_occurrence, r.rec_end_date,
                   r.rec_occurrences_limit, r.rec_occurrences_count
            FROM mm_recurring r
            WHERE r.rec_usr_id = %s
              AND r.rec_is_active = TRUE
              AND r.rec_next_occurrence <= %s
        """, (user_id, today))
        recurring_due = cursor.fetchall()

        for recurring in recurring_due:
            current_occurrence = recurring['rec_next_occurrence']
            occurrences_count = recurring['rec_occurrences_count']
            occurrences_limit = recurring['rec_occurrences_limit']
            end_date = recurring['rec_end_date']

            while current_occurrence <= today:
                if occurrences_limit and occurrences_count >= occurrences_limit:
                    cursor.execute("""
                        UPDATE mm_recurring SET rec_is_active = FALSE WHERE rec_id = %s
                    """, (recurring['rec_id'],))
                    break

                if end_date and current_occurrence > end_date:
                    cursor.execute("""
                        UPDATE mm_recurring SET rec_is_active = FALSE WHERE rec_id = %s
                    """, (recurring['rec_id'],))
                    break

                transaction_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_cat_id, trx_rec_id,
                                                  trx_type, trx_amount, trx_description, trx_date)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    transaction_id,
                    recurring['rec_acc_id'],
                    recurring['rec_cat_id'],
                    recurring['rec_id'],
                    recurring['rec_type'],
                    recurring['rec_amount'],
                    recurring['rec_description'],
                    current_occurrence
                ))

                if recurring['rec_type'] == 'income':
                    cursor.execute("""
                        UPDATE mm_accounts SET acc_balance = acc_balance + %s WHERE acc_id = %s
                    """, (recurring['rec_amount'], recurring['rec_acc_id']))
                else:
                    cursor.execute("""
                        UPDATE mm_accounts SET acc_balance = acc_balance - %s WHERE acc_id = %s
                    """, (recurring['rec_amount'], recurring['rec_acc_id']))

                transactions_created.append({
                    'id': transaction_id,
                    'recurring_id': recurring['rec_id'],
                    'amount': float(recurring['rec_amount']),
                    'date': str(current_occurrence),
                    'description': recurring['rec_description']
                })

                occurrences_count += 1
                current_occurrence = calculate_next_occurrence(current_occurrence, recurring['rec_frequency'])

            cursor.execute("""
                UPDATE mm_recurring
                SET rec_next_occurrence = %s, rec_occurrences_count = %s
                WHERE rec_id = %s
            """, (current_occurrence, occurrences_count, recurring['rec_id']))

            if occurrences_limit and occurrences_count >= occurrences_limit:
                cursor.execute("""
                    UPDATE mm_recurring SET rec_is_active = FALSE WHERE rec_id = %s
                """, (recurring['rec_id'],))
            if end_date and current_occurrence > end_date:
                cursor.execute("""
                    UPDATE mm_recurring SET rec_is_active = FALSE WHERE rec_id = %s
                """, (recurring['rec_id'],))

    return {
        "processed": len(transactions_created),
        "transactions": transactions_created
    }


# =============================================================================
# ROUTES /users/{user_id}/budgets
# =============================================================================

@router.get("/{user_id}/budgets")
async def get_user_budgets(user_id: str):
    """
    Get budgets for a user with current month spending.
    Budget hierarchy is independent from category hierarchy.
    Spent = transactions of budget's category + all its subcategories (category hierarchy).
    """
    from calendar import monthrange

    today = date.today()
    first_day = today.replace(day=1)
    last_day = today.replace(day=monthrange(today.year, today.month)[1])

    with get_db() as (conn, cursor):
        # Récupérer tous les budgets
        cursor.execute("""
            SELECT b.bgt_id as id, b.bgt_cat_id as category_id, b.bgt_parent_id as parent_budget_id,
                   b.bgt_amount as budget_amount, b.bgt_display_order as display_order,
                   c.cat_name as category_name, c.cat_icon as category_icon, c.cat_color as category_color
            FROM mm_budgets b
            JOIN mm_categories c ON b.bgt_cat_id = c.cat_id
            WHERE b.bgt_usr_id = %s
            ORDER BY b.bgt_parent_id IS NOT NULL,
                     CASE WHEN b.bgt_display_order IS NULL THEN 1 ELSE 0 END,
                     b.bgt_display_order ASC, b.created_at ASC
        """, (user_id,))
        budgets = cursor.fetchall()

        # Calculer le spent pour chaque budget (catégorie + sous-catégories)
        budget_spent = {}
        for budget in budgets:
            # Utiliser une CTE récursive pour inclure la catégorie et toutes ses sous-catégories
            cursor.execute("""
                WITH RECURSIVE category_tree AS (
                    SELECT cat_id FROM mm_categories WHERE cat_id = %s
                    UNION ALL
                    SELECT c.cat_id FROM mm_categories c
                    INNER JOIN category_tree ct ON c.cat_parent_id = ct.cat_id
                )
                SELECT COALESCE(SUM(t.trx_amount), 0) as spent
                FROM mm_transactions t
                JOIN mm_accounts a ON t.trx_acc_id = a.acc_id
                WHERE a.acc_usr_id = %s
                  AND t.trx_cat_id IN (SELECT cat_id FROM category_tree)
                  AND t.trx_type = 'expense'
                  AND t.trx_date BETWEEN %s AND %s
            """, (budget['category_id'], user_id, first_day, last_day))
            spent_row = cursor.fetchone()
            budget_spent[budget['id']] = float(spent_row['spent']) if spent_row else 0

        result = []
        for budget in budgets:
            budget_id = budget['id']
            parent_budget_id = budget['parent_budget_id']
            spent = budget_spent[budget_id]

            budget_amount = float(budget['budget_amount'])
            remaining = budget_amount - spent
            percentage = (spent / budget_amount * 100) if budget_amount > 0 else 0

            result.append({
                'id': budget_id,
                'category_id': budget['category_id'],
                'category_name': budget['category_name'],
                'category_icon': budget['category_icon'],
                'category_color': budget['category_color'],
                'parent_budget_id': parent_budget_id,
                'budget_amount': budget_amount,
                'spent': spent,
                'remaining': remaining,
                'percentage': min(percentage, 100),
                'is_exceeded': spent > budget_amount,
                'display_order': budget['display_order']
            })

    return {"budgets": result}


@router.put("/{user_id}/budgets/order")
async def update_budgets_order(user_id: str, request: dict):
    """Update budget display order."""
    budget_ids = request.get('budget_ids', [])

    with get_db() as (conn, cursor):
        cursor.execute("UPDATE mm_budgets SET bgt_display_order = NULL WHERE bgt_usr_id = %s", (user_id,))

        for index, budget_id in enumerate(budget_ids):
            cursor.execute("""
                UPDATE mm_budgets SET bgt_display_order = %s
                WHERE bgt_id = %s AND bgt_usr_id = %s
            """, (index + 1, budget_id, user_id))

    return {"message": "Ordre mis à jour", "count": len(budget_ids)}


@router.post("/{user_id}/budgets/check")
async def check_budget_exceeded(user_id: str, request: dict):
    """
    Check if an expense would exceed a category's budget.
    Also checks ancestor categories (if they have a budget that includes this category).
    """
    from calendar import monthrange

    category_id = request.get('category_id')
    amount = request.get('amount', 0)

    if not category_id:
        return {"has_budget": False, "would_exceed": False}

    today = date.today()
    first_day = today.replace(day=1)
    last_day = today.replace(day=monthrange(today.year, today.month)[1])

    with get_db() as (conn, cursor):
        # Chercher un budget sur la catégorie elle-même ou ses ancêtres
        cursor.execute("""
            WITH RECURSIVE ancestors AS (
                SELECT cat_id, cat_parent_id, cat_name, 0 as level
                FROM mm_categories WHERE cat_id = %s
                UNION ALL
                SELECT c.cat_id, c.cat_parent_id, c.cat_name, a.level + 1
                FROM mm_categories c
                INNER JOIN ancestors a ON c.cat_id = a.cat_parent_id
            )
            SELECT b.bgt_id, b.bgt_cat_id, b.bgt_amount as budget_amount,
                   a.cat_name as category_name, a.level
            FROM mm_budgets b
            JOIN ancestors a ON b.bgt_cat_id = a.cat_id
            WHERE b.bgt_usr_id = %s
            ORDER BY a.level ASC
            LIMIT 1
        """, (category_id, user_id))
        budget = cursor.fetchone()

        if not budget:
            return {"has_budget": False, "would_exceed": False}

        # Calculer les dépenses incluant les catégories enfants du budget trouvé
        cursor.execute("""
            WITH RECURSIVE category_tree AS (
                SELECT cat_id FROM mm_categories WHERE cat_id = %s
                UNION ALL
                SELECT c.cat_id FROM mm_categories c
                INNER JOIN category_tree ct ON c.cat_parent_id = ct.cat_id
            )
            SELECT COALESCE(SUM(t.trx_amount), 0) as spent
            FROM mm_transactions t
            JOIN mm_accounts a ON t.trx_acc_id = a.acc_id
            WHERE a.acc_usr_id = %s
              AND t.trx_cat_id IN (SELECT cat_id FROM category_tree)
              AND t.trx_type = 'expense'
              AND t.trx_date BETWEEN %s AND %s
        """, (budget['bgt_cat_id'], user_id, first_day, last_day))
        spent_row = cursor.fetchone()
        current_spent = float(spent_row['spent']) if spent_row else 0

        budget_amount = float(budget['budget_amount'])
        new_total = current_spent + amount
        would_exceed = new_total > budget_amount
        excess_amount = new_total - budget_amount if would_exceed else 0

    return {
        "has_budget": True,
        "would_exceed": would_exceed,
        "category_name": budget['category_name'],
        "budget_amount": budget_amount,
        "current_spent": current_spent,
        "new_expense": amount,
        "new_total": new_total,
        "excess_amount": excess_amount,
        "remaining_before": budget_amount - current_spent
    }


# =============================================================================
# ROUTES /users/{user_id}/icons
# =============================================================================

@router.post("/{user_id}/icons/upload")
async def upload_user_icon(user_id: str, file: UploadFile = File(...)):
    """Upload a custom icon for a user."""
    with get_db() as (conn, cursor):
        cursor.execute("SELECT usr_id FROM mm_users WHERE usr_id = %s", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Extension non autorisée. Extensions acceptées: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    unique_name = f"{uuid.uuid4().hex}{ext}"
    upload_path = FRONTEND_PUBLIC_PATH / "uploads" / "icons" / str(user_id)
    upload_path.mkdir(parents=True, exist_ok=True)

    file_path = upload_path / unique_name
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'upload: {str(e)}")

    return {
        "icon": {
            "name": Path(file.filename).stem,
            "path": f"/uploads/icons/{user_id}/{unique_name}"
        }
    }


@router.get("/{user_id}/icons")
async def get_user_icons(user_id: str):
    """Get icons uploaded by a user."""
    upload_path = FRONTEND_PUBLIC_PATH / "uploads" / "icons" / str(user_id)
    icons = []

    if upload_path.exists():
        for file in upload_path.iterdir():
            if file.suffix.lower() in ALLOWED_EXTENSIONS:
                icons.append({
                    "name": file.stem,
                    "path": f"/uploads/icons/{user_id}/{file.name}"
                })

    return {"icons": sorted(icons, key=lambda x: x['name'])}


@router.delete("/{user_id}/icons/{icon_name}")
async def delete_user_icon(user_id: str, icon_name: str):
    """Delete a user-uploaded icon."""
    upload_path = FRONTEND_PUBLIC_PATH / "uploads" / "icons" / str(user_id)

    deleted = False
    if upload_path.exists():
        for file in upload_path.iterdir():
            if file.stem == icon_name or file.name == icon_name:
                file.unlink()
                deleted = True
                break

    if not deleted:
        raise HTTPException(status_code=404, detail="Icône non trouvée")

    return {"message": "Icône supprimée"}
