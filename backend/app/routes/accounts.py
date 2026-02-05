"""
Bank account management routes.
"""

from fastapi import APIRouter, HTTPException
from datetime import date, timedelta
from calendar import monthrange
import uuid

from app.database import get_db
from app.models.account import AccountCreate, AccountUpdate

router = APIRouter(prefix="/accounts", tags=["Accounts"])


@router.get("/{account_id}")
async def get_account(account_id: str):
    """Get an account by ID."""
    with get_db() as (conn, cursor):
        cursor.execute("""
            SELECT acc_id as id, acc_usr_id as user_id, acc_name as name, acc_type as type,
                   acc_balance as balance, acc_currency as currency, acc_icon as icon,
                   acc_color as color, created_at
            FROM mm_accounts
            WHERE acc_id = %s
        """, (account_id,))
        account = cursor.fetchone()

    if not account:
        raise HTTPException(status_code=404, detail="Compte non trouvé")
    return {"account": account}


@router.post("")
async def create_account(request: AccountCreate):
    """Create a new account."""
    with get_db() as (conn, cursor):
        account_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO mm_accounts (acc_id, acc_usr_id, acc_name, acc_type, acc_balance,
                                      acc_currency, acc_icon, acc_color)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (account_id, request.user_id, request.name, request.type, request.balance,
              request.currency, request.icon, request.color))

        cursor.execute("""
            SELECT acc_id as id, acc_usr_id as user_id, acc_name as name, acc_type as type,
                   acc_balance as balance, acc_currency as currency, acc_icon as icon,
                   acc_color as color, created_at
            FROM mm_accounts WHERE acc_id = %s
        """, (account_id,))
        account = cursor.fetchone()

    return {"account": account}


@router.put("/{account_id}")
async def update_account(account_id: str, request: AccountUpdate):
    """Update an account."""
    with get_db() as (conn, cursor):
        cursor.execute("SELECT acc_id FROM mm_accounts WHERE acc_id = %s", (account_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Compte non trouvé")

        # Map request fields to database columns
        field_mapping = {
            'name': 'acc_name',
            'type': 'acc_type',
            'balance': 'acc_balance',
            'currency': 'acc_currency',
            'icon': 'acc_icon',
            'color': 'acc_color'
        }

        updates = []
        values = []
        for field, value in request.model_dump(exclude_unset=True).items():
            if value is not None and field in field_mapping:
                updates.append(f"{field_mapping[field]} = %s")
                values.append(value)

        if updates:
            values.append(account_id)
            cursor.execute(f"""
                UPDATE mm_accounts SET {', '.join(updates)} WHERE acc_id = %s
            """, values)

        cursor.execute("""
            SELECT acc_id as id, acc_usr_id as user_id, acc_name as name, acc_type as type,
                   acc_balance as balance, acc_currency as currency, acc_icon as icon,
                   acc_color as color, created_at
            FROM mm_accounts WHERE acc_id = %s
        """, (account_id,))
        account = cursor.fetchone()

    return {"account": account}


@router.delete("/{account_id}")
async def delete_account(account_id: str):
    """Delete an account and all its transactions."""
    with get_db() as (conn, cursor):
        cursor.execute("SELECT acc_id FROM mm_accounts WHERE acc_id = %s", (account_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Compte non trouvé")

        cursor.execute("DELETE FROM mm_transactions WHERE trx_acc_id = %s OR trx_target_acc_id = %s",
                       (account_id, account_id))
        cursor.execute("DELETE FROM mm_recurring WHERE rec_acc_id = %s", (account_id,))
        cursor.execute("DELETE FROM mm_accounts WHERE acc_id = %s", (account_id,))

    return {"message": "Compte supprimé"}


@router.get("/{account_id}/transactions")
async def get_account_transactions(account_id: str, limit: int = 50, offset: int = 0):
    """Get transactions for an account with pagination."""
    with get_db() as (conn, cursor):
        cursor.execute("""
            SELECT t.trx_id as id, t.trx_acc_id as account_id, t.trx_target_acc_id as target_account_id,
                   t.trx_cat_id as category_id, t.trx_rec_id as recurring_id, t.trx_type as type,
                   t.trx_amount as amount, t.trx_description as description, t.trx_date as date,
                   t.created_at, c.cat_name as category_name, c.cat_icon as category_icon,
                   c.cat_color as category_color
            FROM mm_transactions t
            LEFT JOIN mm_categories c ON t.trx_cat_id = c.cat_id
            WHERE t.trx_acc_id = %s OR t.trx_target_acc_id = %s
            ORDER BY t.trx_date DESC, t.created_at DESC
            LIMIT %s OFFSET %s
        """, (account_id, account_id, limit, offset))
        transactions = cursor.fetchall()
    return {"transactions": transactions}


@router.get("/{account_id}/dashboard")
async def get_account_dashboard(account_id: str):
    """Get all dashboard data for a specific account."""
    today = date.today()
    first_day_current_month = today.replace(day=1)
    last_day_current_month = today.replace(day=monthrange(today.year, today.month)[1])
    thirty_one_days_ago = today - timedelta(days=31)

    with get_db() as (conn, cursor):
        cursor.execute("""
            SELECT acc_id as id, acc_usr_id as user_id, acc_name as name, acc_type as type,
                   acc_balance as balance, acc_currency as currency, acc_icon as icon, acc_color as color
            FROM mm_accounts WHERE acc_id = %s
        """, (account_id,))
        account = cursor.fetchone()
        if not account:
            raise HTTPException(status_code=404, detail="Compte non trouvé")

        cursor.execute("""
            SELECT
                COALESCE(SUM(CASE WHEN trx_type = 'income' THEN trx_amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN trx_type = 'expense' THEN trx_amount ELSE 0 END), 0) as total_expense,
                COUNT(*) as transaction_count
            FROM mm_transactions
            WHERE trx_acc_id = %s AND trx_date BETWEEN %s AND %s
        """, (account_id, first_day_current_month, last_day_current_month))
        monthly_totals = cursor.fetchone()

        cursor.execute("""
            SELECT
                c.cat_id as id, c.cat_name as name, c.cat_color as color, c.cat_icon as icon,
                COALESCE(SUM(t.trx_amount), 0) as total
            FROM mm_transactions t
            LEFT JOIN mm_categories c ON t.trx_cat_id = c.cat_id
            WHERE t.trx_acc_id = %s
              AND t.trx_type = 'expense'
              AND t.trx_date >= %s
            GROUP BY c.cat_id, c.cat_name, c.cat_color, c.cat_icon
            ORDER BY total DESC
        """, (account_id, thirty_one_days_ago))
        expenses_by_category = cursor.fetchall()

        MOIS_FR = {
            1: 'Jan', 2: 'Fév', 3: 'Mar', 4: 'Avr',
            5: 'Mai', 6: 'Juin', 7: 'Juil', 8: 'Août',
            9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Déc'
        }

        def get_month_range(year, month):
            first_day = date(year, month, 1)
            last_day = date(year, month, monthrange(year, month)[1])
            return first_day, last_day

        def get_month_data_from_transactions(cursor, account_id, first_day, last_day):
            cursor.execute("""
                SELECT c.cat_name, c.cat_color, COALESCE(SUM(t.trx_amount), 0) as total
                FROM mm_transactions t
                LEFT JOIN mm_categories c ON t.trx_cat_id = c.cat_id
                WHERE t.trx_acc_id = %s AND t.trx_type = 'expense'
                  AND t.trx_date BETWEEN %s AND %s
                GROUP BY c.cat_id, c.cat_name, c.cat_color
            """, (account_id, first_day, last_day))
            expenses = {row['cat_name'] or 'Sans catégorie': {'total': float(row['total']), 'color': row['cat_color'] or '#6b7280'} for row in cursor.fetchall()}

            cursor.execute("""
                SELECT COALESCE(SUM(trx_amount), 0) as total
                FROM mm_transactions
                WHERE trx_acc_id = %s AND trx_type = 'income'
                  AND trx_date BETWEEN %s AND %s
            """, (account_id, first_day, last_day))
            total_income = float(cursor.fetchone()['total'])

            total_expenses = sum(cat['total'] for cat in expenses.values())
            reste = max(0, total_income - total_expenses)

            return {
                'expenses': expenses,
                'total_income': total_income,
                'total_expenses': total_expenses,
                'reste': reste
            }

        def get_month_data_from_recurring(cursor, account_id):
            cursor.execute("""
                SELECT c.cat_name, c.cat_color, COALESCE(SUM(r.rec_amount), 0) as total
                FROM mm_recurring r
                LEFT JOIN mm_categories c ON r.rec_cat_id = c.cat_id
                WHERE r.rec_acc_id = %s AND r.rec_type = 'expense' AND r.rec_is_active = TRUE
                GROUP BY c.cat_id, c.cat_name, c.cat_color
            """, (account_id,))
            expenses = {row['cat_name'] or 'Sans catégorie': {'total': float(row['total']), 'color': row['cat_color'] or '#6b7280'} for row in cursor.fetchall()}

            cursor.execute("""
                SELECT COALESCE(SUM(rec_amount), 0) as total
                FROM mm_recurring
                WHERE rec_acc_id = %s AND rec_type = 'income' AND rec_is_active = TRUE
            """, (account_id,))
            total_income = float(cursor.fetchone()['total'])

            total_expenses = sum(cat['total'] for cat in expenses.values())
            reste = max(0, total_income - total_expenses)

            return {
                'expenses': expenses,
                'total_income': total_income,
                'total_expenses': total_expenses,
                'reste': reste
            }

        current_year = today.year
        months_config = []

        for month in range(1, 13):
            is_future = month > today.month
            months_config.append({
                'year': current_year,
                'month': month,
                'is_forecast': is_future
            })

        comparison_months = []
        all_categories = set()
        category_colors = {}

        for config in months_config:
            y, m = config['year'], config['month']
            first_day, last_day = get_month_range(y, m)

            if config['is_forecast']:
                current_data = get_month_data_from_recurring(cursor, account_id)
            else:
                current_data = get_month_data_from_transactions(cursor, account_id, first_day, last_day)

            first_day_ly, last_day_ly = get_month_range(y - 1, m)
            last_year_data = get_month_data_from_transactions(cursor, account_id, first_day_ly, last_day_ly)

            for cat_name, cat_data in current_data['expenses'].items():
                all_categories.add(cat_name)
                if cat_name not in category_colors:
                    category_colors[cat_name] = cat_data['color']
            for cat_name, cat_data in last_year_data['expenses'].items():
                all_categories.add(cat_name)
                if cat_name not in category_colors:
                    category_colors[cat_name] = cat_data['color']

            month_name = MOIS_FR[m]

            comparison_months.append({
                'month': month_name,
                'is_forecast': config['is_forecast'],
                'current_year': {'year': y, 'data': current_data},
                'last_year': {'year': y - 1, 'data': last_year_data}
            })

        comparison_data = {
            'months': [m['month'] for m in comparison_months],
            'categories': list(all_categories),
            'category_colors': category_colors,
            'current_year': current_year,
            'last_year': current_year - 1,
            'data': []
        }

        for month_data in comparison_months:
            current = month_data['current_year']['data']
            last = month_data['last_year']['data']

            comparison_data['data'].append({
                'month': month_data['month'],
                'is_forecast': month_data['is_forecast'],
                'current_year': {
                    'year': month_data['current_year']['year'],
                    'categories': {cat: current['expenses'].get(cat, {}).get('total', 0) for cat in all_categories},
                    'total_income': current['total_income'],
                    'total_expenses': current['total_expenses'],
                    'reste': current['reste']
                },
                'last_year': {
                    'year': month_data['last_year']['year'],
                    'categories': {cat: last['expenses'].get(cat, {}).get('total', 0) for cat in all_categories},
                    'total_income': last['total_income'],
                    'total_expenses': last['total_expenses'],
                    'reste': last['reste']
                }
            })

        cursor.execute("""
            SELECT t.trx_id as id, t.trx_amount as amount, t.trx_description as description,
                   t.trx_date as date, c.cat_name as category_name, c.cat_icon as category_icon,
                   c.cat_color as category_color
            FROM mm_transactions t
            LEFT JOIN mm_categories c ON t.trx_cat_id = c.cat_id
            WHERE t.trx_acc_id = %s AND t.trx_type = 'expense' AND t.trx_date <= %s
            ORDER BY t.trx_date DESC, t.created_at DESC
            LIMIT 3
        """, (account_id, today))
        last_expenses = cursor.fetchall()

        cursor.execute("""
            SELECT t.trx_id as id, t.trx_amount as amount, t.trx_description as description,
                   t.trx_date as date, c.cat_name as category_name, c.cat_icon as category_icon,
                   c.cat_color as category_color
            FROM mm_transactions t
            LEFT JOIN mm_categories c ON t.trx_cat_id = c.cat_id
            WHERE t.trx_acc_id = %s AND t.trx_type = 'income' AND t.trx_date <= %s
            ORDER BY t.trx_date DESC, t.created_at DESC
            LIMIT 3
        """, (account_id, today))
        last_incomes = cursor.fetchall()

        cursor.execute("""
            SELECT r.rec_id as id, r.rec_type as type, r.rec_amount as amount,
                   r.rec_description as description, r.rec_next_occurrence as next_occurrence,
                   r.rec_frequency as frequency, c.cat_name as category_name,
                   c.cat_icon as category_icon, c.cat_color as category_color
            FROM mm_recurring r
            LEFT JOIN mm_categories c ON r.rec_cat_id = c.cat_id
            WHERE r.rec_acc_id = %s
              AND r.rec_is_active = TRUE
              AND r.rec_next_occurrence BETWEEN %s AND %s
            ORDER BY r.rec_next_occurrence ASC
        """, (account_id, today, last_day_current_month))
        remaining_recurring = cursor.fetchall()

        forecasted_balance = float(account['balance'])
        for rec in remaining_recurring:
            if rec['type'] == 'income':
                forecasted_balance += float(rec['amount'])
            else:
                forecasted_balance -= float(rec['amount'])

    return {
        "account": account,
        "monthly_summary": {
            "total_income": float(monthly_totals['total_income']),
            "total_expense": float(monthly_totals['total_expense']),
            "transaction_count": monthly_totals['transaction_count'],
            "net": float(monthly_totals['total_income']) - float(monthly_totals['total_expense'])
        },
        "expenses_by_category": [
            {
                "id": row['id'],
                "name": row['name'] or 'Sans catégorie',
                "color": row['color'] or '#6b7280',
                "icon": row['icon'],
                "total": float(row['total'])
            }
            for row in expenses_by_category
        ],
        "category_comparison": comparison_data,
        "last_expenses": last_expenses,
        "last_incomes": last_incomes,
        "recurring": {
            "remaining": remaining_recurring,
            "forecasted_balance": forecasted_balance
        }
    }
