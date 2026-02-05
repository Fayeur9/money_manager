"""
Recurring transaction management routes.
"""

from fastapi import APIRouter, HTTPException
import uuid

from app.database import get_db
from app.models.recurring import RecurringCreate, RecurringUpdate

router = APIRouter(prefix="/recurring", tags=["Recurring Transactions"])


@router.get("/{recurring_id}")
async def get_recurring_transaction(recurring_id: str):
    """Get a recurring transaction by ID."""
    with get_db() as (conn, cursor):
        cursor.execute("""
            SELECT r.rec_id as id, r.rec_usr_id as user_id, r.rec_acc_id as account_id,
                   r.rec_cat_id as category_id, r.rec_type as type, r.rec_amount as amount,
                   r.rec_description as description, r.rec_frequency as frequency,
                   r.rec_start_date as start_date, r.rec_end_date as end_date,
                   r.rec_occurrences_limit as occurrences_limit, r.rec_occurrences_count as occurrences_count,
                   r.rec_next_occurrence as next_occurrence, r.rec_is_active as is_active,
                   c.cat_name as category_name, c.cat_icon as category_icon, c.cat_color as category_color,
                   a.acc_name as account_name
            FROM mm_recurring r
            LEFT JOIN mm_categories c ON r.rec_cat_id = c.cat_id
            JOIN mm_accounts a ON r.rec_acc_id = a.acc_id
            WHERE r.rec_id = %s
        """, (recurring_id,))
        recurring = cursor.fetchone()

    if not recurring:
        raise HTTPException(status_code=404, detail="Transaction récurrente non trouvée")
    return {"recurring": recurring}


@router.post("")
async def create_recurring_transaction(request: RecurringCreate):
    """Create a new recurring transaction."""
    with get_db() as (conn, cursor):
        cursor.execute("SELECT acc_id FROM mm_accounts WHERE acc_id = %s", (request.account_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Compte non trouvé")

        recurring_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO mm_recurring
            (rec_id, rec_usr_id, rec_acc_id, rec_cat_id, rec_type, rec_amount, rec_description,
             rec_frequency, rec_start_date, rec_end_date, rec_occurrences_limit, rec_next_occurrence, rec_is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE)
        """, (recurring_id, request.user_id, request.account_id, request.category_id,
              request.type, request.amount, request.description,
              request.frequency, request.start_date, request.end_date,
              request.occurrences_limit, request.start_date))

        cursor.execute("""
            SELECT r.rec_id as id, r.rec_usr_id as user_id, r.rec_acc_id as account_id,
                   r.rec_cat_id as category_id, r.rec_type as type, r.rec_amount as amount,
                   r.rec_description as description, r.rec_frequency as frequency,
                   r.rec_start_date as start_date, r.rec_end_date as end_date,
                   r.rec_occurrences_limit as occurrences_limit, r.rec_occurrences_count as occurrences_count,
                   r.rec_next_occurrence as next_occurrence, r.rec_is_active as is_active,
                   c.cat_name as category_name, c.cat_icon as category_icon, c.cat_color as category_color,
                   a.acc_name as account_name
            FROM mm_recurring r
            LEFT JOIN mm_categories c ON r.rec_cat_id = c.cat_id
            JOIN mm_accounts a ON r.rec_acc_id = a.acc_id
            WHERE r.rec_id = %s
        """, (recurring_id,))
        recurring = cursor.fetchone()

    return {"recurring": recurring}


@router.put("/{recurring_id}")
async def update_recurring_transaction(recurring_id: str, request: RecurringUpdate):
    """Update a recurring transaction."""
    with get_db() as (conn, cursor):
        cursor.execute("SELECT rec_id FROM mm_recurring WHERE rec_id = %s", (recurring_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Transaction récurrente non trouvée")

        field_mapping = {
            'account_id': 'rec_acc_id',
            'category_id': 'rec_cat_id',
            'type': 'rec_type',
            'amount': 'rec_amount',
            'description': 'rec_description',
            'frequency': 'rec_frequency',
            'start_date': 'rec_start_date',
            'end_date': 'rec_end_date',
            'occurrences_limit': 'rec_occurrences_limit',
            'is_active': 'rec_is_active'
        }

        updates = []
        values = []
        for field, value in request.model_dump(exclude_unset=True).items():
            if value is not None and field in field_mapping:
                updates.append(f"{field_mapping[field]} = %s")
                values.append(value)

        if request.start_date is not None:
            updates.append("rec_next_occurrence = %s")
            values.append(request.start_date)

        if updates:
            values.append(recurring_id)
            cursor.execute(f"""
                UPDATE mm_recurring SET {', '.join(updates)} WHERE rec_id = %s
            """, values)

        cursor.execute("""
            SELECT r.rec_id as id, r.rec_usr_id as user_id, r.rec_acc_id as account_id,
                   r.rec_cat_id as category_id, r.rec_type as type, r.rec_amount as amount,
                   r.rec_description as description, r.rec_frequency as frequency,
                   r.rec_start_date as start_date, r.rec_end_date as end_date,
                   r.rec_occurrences_limit as occurrences_limit, r.rec_occurrences_count as occurrences_count,
                   r.rec_next_occurrence as next_occurrence, r.rec_is_active as is_active,
                   c.cat_name as category_name, c.cat_icon as category_icon, c.cat_color as category_color,
                   a.acc_name as account_name
            FROM mm_recurring r
            LEFT JOIN mm_categories c ON r.rec_cat_id = c.cat_id
            JOIN mm_accounts a ON r.rec_acc_id = a.acc_id
            WHERE r.rec_id = %s
        """, (recurring_id,))
        recurring = cursor.fetchone()

    return {"recurring": recurring}


@router.delete("/{recurring_id}")
async def delete_recurring_transaction(recurring_id: str):
    """Delete a recurring transaction."""
    with get_db() as (conn, cursor):
        cursor.execute("SELECT rec_id FROM mm_recurring WHERE rec_id = %s", (recurring_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Transaction récurrente non trouvée")

        cursor.execute("DELETE FROM mm_recurring WHERE rec_id = %s", (recurring_id,))

    return {"message": "Transaction récurrente supprimée"}
