"""
Transaction management routes.
"""

from fastapi import APIRouter, HTTPException
from datetime import date
import uuid

from app.database import get_db
from app.models.transaction import TransactionCreate, TransactionUpdate

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("/{transaction_id}")
async def get_transaction(transaction_id: str):
    """Get a transaction by ID."""
    with get_db() as (conn, cursor):
        cursor.execute("""
            SELECT t.trx_id as id, t.trx_acc_id as account_id, t.trx_target_acc_id as target_account_id,
                   t.trx_cat_id as category_id, t.trx_rec_id as recurring_id, t.trx_type as type,
                   t.trx_amount as amount, t.trx_description as description, t.trx_date as date,
                   t.created_at, c.cat_name as category_name, c.cat_icon as category_icon
            FROM mm_transactions t
            LEFT JOIN mm_categories c ON t.trx_cat_id = c.cat_id
            WHERE t.trx_id = %s
        """, (transaction_id,))
        transaction = cursor.fetchone()

    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction non trouvée")
    return {"transaction": transaction}


@router.post("")
async def create_transaction(request: TransactionCreate):
    """Create a new transaction and update account balance."""
    with get_db() as (conn, cursor):
        cursor.execute("SELECT acc_id, acc_balance FROM mm_accounts WHERE acc_id = %s", (request.account_id,))
        account = cursor.fetchone()
        if not account:
            raise HTTPException(status_code=404, detail="Compte source non trouvé")

        if request.type == 'transfer':
            if not request.target_account_id:
                raise HTTPException(status_code=400, detail="Le compte destinataire est requis pour un transfert")
            if request.target_account_id == request.account_id:
                raise HTTPException(status_code=400, detail="Le compte destinataire doit être différent du compte source")
            cursor.execute("SELECT acc_id FROM mm_accounts WHERE acc_id = %s", (request.target_account_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Compte destinataire non trouvé")

        transaction_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO mm_transactions (trx_id, trx_acc_id, trx_target_acc_id, trx_cat_id,
                                          trx_type, trx_amount, trx_description, trx_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (transaction_id, request.account_id, request.target_account_id, request.category_id,
              request.type, request.amount, request.description, request.date))

        if request.type == 'income':
            cursor.execute("UPDATE mm_accounts SET acc_balance = acc_balance + %s WHERE acc_id = %s",
                           (request.amount, request.account_id))
        elif request.type == 'expense':
            cursor.execute("UPDATE mm_accounts SET acc_balance = acc_balance - %s WHERE acc_id = %s",
                           (request.amount, request.account_id))
        elif request.type == 'transfer' and request.target_account_id:
            cursor.execute("UPDATE mm_accounts SET acc_balance = acc_balance - %s WHERE acc_id = %s",
                           (request.amount, request.account_id))
            cursor.execute("UPDATE mm_accounts SET acc_balance = acc_balance + %s WHERE acc_id = %s",
                           (request.amount, request.target_account_id))

        cursor.execute("""
            SELECT t.trx_id as id, t.trx_acc_id as account_id, t.trx_target_acc_id as target_account_id,
                   t.trx_cat_id as category_id, t.trx_type as type, t.trx_amount as amount,
                   t.trx_description as description, t.trx_date as date, t.created_at,
                   c.cat_name as category_name, c.cat_icon as category_icon
            FROM mm_transactions t
            LEFT JOIN mm_categories c ON t.trx_cat_id = c.cat_id
            WHERE t.trx_id = %s
        """, (transaction_id,))
        transaction = cursor.fetchone()

    return {"transaction": transaction}


@router.put("/{transaction_id}")
async def update_transaction(transaction_id: str, request: TransactionUpdate):
    """Update a transaction (without recalculating balance for simplicity)."""
    with get_db() as (conn, cursor):
        cursor.execute("SELECT trx_id FROM mm_transactions WHERE trx_id = %s", (transaction_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Transaction non trouvée")

        field_mapping = {
            'account_id': 'trx_acc_id',
            'target_account_id': 'trx_target_acc_id',
            'category_id': 'trx_cat_id',
            'type': 'trx_type',
            'amount': 'trx_amount',
            'description': 'trx_description',
            'date': 'trx_date'
        }

        updates = []
        values = []
        for field, value in request.model_dump(exclude_unset=True).items():
            if value is not None and field in field_mapping:
                updates.append(f"{field_mapping[field]} = %s")
                values.append(value)

        if updates:
            values.append(transaction_id)
            cursor.execute(f"""
                UPDATE mm_transactions SET {', '.join(updates)} WHERE trx_id = %s
            """, values)

        cursor.execute("""
            SELECT t.trx_id as id, t.trx_acc_id as account_id, t.trx_target_acc_id as target_account_id,
                   t.trx_cat_id as category_id, t.trx_type as type, t.trx_amount as amount,
                   t.trx_description as description, t.trx_date as date, t.created_at,
                   c.cat_name as category_name, c.cat_icon as category_icon
            FROM mm_transactions t
            LEFT JOIN mm_categories c ON t.trx_cat_id = c.cat_id
            WHERE t.trx_id = %s
        """, (transaction_id,))
        transaction = cursor.fetchone()

    return {"transaction": transaction}


@router.delete("/{transaction_id}")
async def delete_transaction(transaction_id: str):
    """Delete a transaction and reverse the balance effect."""
    with get_db() as (conn, cursor):
        cursor.execute("""
            SELECT trx_id, trx_acc_id, trx_target_acc_id, trx_type, trx_amount
            FROM mm_transactions WHERE trx_id = %s
        """, (transaction_id,))
        transaction = cursor.fetchone()
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction non trouvée")

        if transaction['trx_type'] == 'income':
            cursor.execute("UPDATE mm_accounts SET acc_balance = acc_balance - %s WHERE acc_id = %s",
                           (transaction['trx_amount'], transaction['trx_acc_id']))
        elif transaction['trx_type'] == 'expense':
            cursor.execute("UPDATE mm_accounts SET acc_balance = acc_balance + %s WHERE acc_id = %s",
                           (transaction['trx_amount'], transaction['trx_acc_id']))
        elif transaction['trx_type'] == 'transfer' and transaction['trx_target_acc_id']:
            cursor.execute("UPDATE mm_accounts SET acc_balance = acc_balance + %s WHERE acc_id = %s",
                           (transaction['trx_amount'], transaction['trx_acc_id']))
            cursor.execute("UPDATE mm_accounts SET acc_balance = acc_balance - %s WHERE acc_id = %s",
                           (transaction['trx_amount'], transaction['trx_target_acc_id']))

        cursor.execute("DELETE FROM mm_transactions WHERE trx_id = %s", (transaction_id,))

    return {"message": "Transaction supprimée"}
