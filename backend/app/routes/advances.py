"""
Routes pour la gestion des avances (prêts en attente de remboursement).
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import date as date_module
import uuid

from app.database import get_db
from app.models.advance import AdvanceCreate, AdvanceUpdate, AdvancePayment

router = APIRouter(prefix="/advances", tags=["Advances"])


@router.get("")
async def get_advances(
    user_id: str,
    direction: Optional[str] = Query(None, description="Filtrer par direction: given, received"),
    status: Optional[str] = Query(None, description="Filtrer par statut: pending, partial, paid"),
    person: Optional[str] = Query(None, description="Filtrer par personne")
):
    """
    Récupère la liste des avances d'un utilisateur.
    Peut être filtré par direction, statut et/ou par personne.
    """
    with get_db() as (conn, cursor):
        query = """
            SELECT
                a.adv_id as id,
                a.adv_usr_id as user_id,
                a.adv_acc_id as account_id,
                a.adv_amount as amount,
                a.adv_description as description,
                a.adv_person as person,
                a.adv_date as date,
                a.adv_due_date as due_date,
                a.adv_direction as direction,
                a.adv_status as status,
                a.adv_amount_received as amount_received,
                a.adv_trx_id as transaction_id,
                a.created_at,
                a.updated_at,
                acc.acc_name as account_name,
                acc.acc_icon as account_icon,
                acc.acc_color as account_color
            FROM mm_advances a
            JOIN mm_accounts acc ON a.adv_acc_id = acc.acc_id
            WHERE a.adv_usr_id = %s
        """
        params = [user_id]

        if direction:
            if direction not in ['given', 'received']:
                raise HTTPException(status_code=400, detail="Direction invalide. Valeurs acceptées: given, received")
            query += " AND a.adv_direction = %s"
            params.append(direction)

        if status:
            if status not in ['pending', 'partial', 'paid']:
                raise HTTPException(status_code=400, detail="Statut invalide. Valeurs acceptées: pending, partial, paid")
            query += " AND a.adv_status = %s"
            params.append(status)

        if person:
            query += " AND a.adv_person LIKE %s"
            params.append(f"%{person}%")

        query += " ORDER BY a.adv_date DESC, a.created_at DESC"

        cursor.execute(query, params)
        advances = cursor.fetchall()

    return {"advances": advances}


@router.post("/create-categories")
async def create_advance_categories(user_id: str):
    """
    Crée les catégories pour les avances:
    - Avances (expense): quand je prête de l'argent
    - Remboursements (income): quand on me rembourse
    - Emprunts (income): quand on me prête de l'argent
    - Remboursement d'emprunt (expense): quand je rembourse
    """
    with get_db() as (conn, cursor):
        created = []

        # Catégories pour les avances données (j'ai prêté)
        # Avances (expense) - quand je prête
        cursor.execute("""
            SELECT cat_id FROM mm_categories
            WHERE cat_usr_id = %s AND cat_name = 'Avances' AND cat_type = 'expense'
        """, (user_id,))
        if not cursor.fetchone():
            cat_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO mm_categories (cat_id, cat_usr_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default)
                VALUES (%s, %s, 'Avances', 'expense', '/default/icons/handshake.png', '#f97316', TRUE)
            """, (cat_id, user_id))
            created.append('Avances')

        # Remboursements (income) - quand on me rembourse
        cursor.execute("""
            SELECT cat_id FROM mm_categories
            WHERE cat_usr_id = %s AND cat_name = 'Remboursements' AND cat_type = 'income'
        """, (user_id,))
        if not cursor.fetchone():
            cat_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO mm_categories (cat_id, cat_usr_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default)
                VALUES (%s, %s, 'Remboursements', 'income', '/default/icons/money-receive.png', '#22c55e', TRUE)
            """, (cat_id, user_id))
            created.append('Remboursements')

        # Catégories pour les avances reçues (on m'a prêté)
        # Emprunts (income) - quand on me prête
        cursor.execute("""
            SELECT cat_id FROM mm_categories
            WHERE cat_usr_id = %s AND cat_name = 'Emprunts' AND cat_type = 'income'
        """, (user_id,))
        if not cursor.fetchone():
            cat_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO mm_categories (cat_id, cat_usr_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default)
                VALUES (%s, %s, 'Emprunts', 'income', '/default/icons/money-receive.png', '#f97316', TRUE)
            """, (cat_id, user_id))
            created.append('Emprunts')

        # Remboursement d'emprunt (expense) - quand je rembourse
        cursor.execute("""
            SELECT cat_id FROM mm_categories
            WHERE cat_usr_id = %s AND cat_name = 'Remboursement d''emprunt' AND cat_type = 'expense'
        """, (user_id,))
        if not cursor.fetchone():
            cat_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO mm_categories (cat_id, cat_usr_id, cat_name, cat_type, cat_icon, cat_color, cat_is_default)
                VALUES (%s, %s, 'Remboursement d''emprunt', 'expense', '/default/icons/money-send.png', '#dc2626', TRUE)
            """, (cat_id, user_id))
            created.append("Remboursement d'emprunt")

    return {"created": created, "message": f"Catégories créées: {', '.join(created)}" if created else "Toutes les catégories existent déjà"}


@router.post("")
async def create_advance(request: AdvanceCreate):
    """
    Crée une nouvelle avance et génère automatiquement une transaction.
    - direction='given': j'ai prêté → transaction expense (catégorie "Avances")
    - direction='received': on m'a prêté → transaction income (catégorie "Emprunts")
    Si skip_transaction=True, ne crée pas de transaction.
    """
    # Valider la direction
    if request.direction not in ['given', 'received']:
        raise HTTPException(status_code=400, detail="Direction invalide. Valeurs acceptées: given, received")

    with get_db() as (conn, cursor):
        # Vérifier que le compte existe et appartient à l'utilisateur
        cursor.execute("""
            SELECT acc_id FROM mm_accounts
            WHERE acc_id = %s AND acc_usr_id = %s
        """, (request.account_id, request.user_id))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Compte non trouvé")

        transaction_id = None

        if not request.skip_transaction:
            # Déterminer la catégorie et le type de transaction selon la direction
            if request.direction == 'given':
                # J'ai prêté → dépense
                category_name = 'Avances'
                category_type = 'expense'
                trx_type = 'expense'
                transaction_description = f"Avance à {request.person}"
            else:
                # On m'a prêté → revenu
                category_name = 'Emprunts'
                category_type = 'income'
                trx_type = 'income'
                transaction_description = f"Emprunt de {request.person}"

            if request.description:
                transaction_description += f" - {request.description}"

            # Trouver la catégorie appropriée
            cursor.execute("""
                SELECT cat_id FROM mm_categories
                WHERE cat_usr_id = %s AND cat_name = %s AND cat_type = %s
            """, (request.user_id, category_name, category_type))
            category = cursor.fetchone()

            if not category:
                raise HTTPException(
                    status_code=422,
                    detail={
                        "error_code": "MISSING_CATEGORY",
                        "message": f"Catégorie '{category_name}' non trouvée",
                        "missing_categories": [category_name]
                    }
                )

            # Créer la transaction associée
            transaction_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO mm_transactions (
                    trx_id, trx_acc_id, trx_cat_id, trx_amount, trx_type,
                    trx_description, trx_date
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                transaction_id, request.account_id, category['cat_id'],
                request.amount, trx_type, transaction_description, request.date
            ))

        advance_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO mm_advances (
                adv_id, adv_usr_id, adv_acc_id, adv_amount, adv_description,
                adv_person, adv_date, adv_due_date, adv_direction, adv_trx_id
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            advance_id, request.user_id, request.account_id, request.amount,
            request.description, request.person, request.date, request.due_date,
            request.direction, transaction_id
        ))

        # Récupérer l'avance créée avec les infos du compte
        cursor.execute("""
            SELECT
                a.adv_id as id,
                a.adv_usr_id as user_id,
                a.adv_acc_id as account_id,
                a.adv_amount as amount,
                a.adv_description as description,
                a.adv_person as person,
                a.adv_date as date,
                a.adv_due_date as due_date,
                a.adv_direction as direction,
                a.adv_status as status,
                a.adv_amount_received as amount_received,
                a.adv_trx_id as transaction_id,
                a.created_at,
                acc.acc_name as account_name,
                acc.acc_icon as account_icon,
                acc.acc_color as account_color
            FROM mm_advances a
            JOIN mm_accounts acc ON a.adv_acc_id = acc.acc_id
            WHERE a.adv_id = %s
        """, (advance_id,))
        advance = cursor.fetchone()

    return {"advance": advance}


@router.get("/summary")
async def get_advances_summary(
    user_id: str,
    direction: Optional[str] = Query(None, description="Filtrer par direction: given, received")
):
    """
    Récupère un résumé des avances par personne et direction.
    - direction='given': avances données (à recevoir)
    - direction='received': avances reçues (à rembourser)
    """
    with get_db() as (conn, cursor):
        # Construire la condition de direction
        direction_condition = ""
        params_base = [user_id]
        if direction:
            if direction not in ['given', 'received']:
                raise HTTPException(status_code=400, detail="Direction invalide")
            direction_condition = " AND adv_direction = %s"
            params_base.append(direction)

        # Total par personne (avances non payées)
        cursor.execute(f"""
            SELECT
                adv_person as person,
                COUNT(*) as count,
                SUM(adv_amount) as total_amount,
                SUM(adv_amount_received) as total_received,
                SUM(adv_amount - adv_amount_received) as total_pending
            FROM mm_advances
            WHERE adv_usr_id = %s AND adv_status != 'paid'{direction_condition}
            GROUP BY adv_person
            ORDER BY total_pending DESC
        """, params_base)
        by_person = cursor.fetchall()

        # Totaux globaux
        cursor.execute(f"""
            SELECT
                COUNT(*) as total_advances,
                COALESCE(SUM(adv_amount), 0) as total_amount,
                COALESCE(SUM(adv_amount_received), 0) as total_received,
                COALESCE(SUM(adv_amount - adv_amount_received), 0) as total_pending,
                COUNT(CASE WHEN adv_status = 'pending' THEN 1 END) as count_pending,
                COUNT(CASE WHEN adv_status = 'partial' THEN 1 END) as count_partial,
                COUNT(CASE WHEN adv_status = 'paid' THEN 1 END) as count_paid
            FROM mm_advances
            WHERE adv_usr_id = %s{direction_condition}
        """, params_base)
        totals = cursor.fetchone()

    return {
        "by_person": by_person,
        "totals": totals
    }


@router.get("/{advance_id}")
async def get_advance(advance_id: str):
    """
    Récupère une avance par son ID.
    """
    with get_db() as (conn, cursor):
        cursor.execute("""
            SELECT
                a.adv_id as id,
                a.adv_usr_id as user_id,
                a.adv_acc_id as account_id,
                a.adv_amount as amount,
                a.adv_description as description,
                a.adv_person as person,
                a.adv_date as date,
                a.adv_due_date as due_date,
                a.adv_direction as direction,
                a.adv_status as status,
                a.adv_amount_received as amount_received,
                a.adv_trx_id as transaction_id,
                a.created_at,
                a.updated_at,
                acc.acc_name as account_name,
                acc.acc_icon as account_icon,
                acc.acc_color as account_color
            FROM mm_advances a
            JOIN mm_accounts acc ON a.adv_acc_id = acc.acc_id
            WHERE a.adv_id = %s
        """, (advance_id,))
        advance = cursor.fetchone()

    if not advance:
        raise HTTPException(status_code=404, detail="Avance non trouvée")

    return {"advance": advance}


@router.put("/{advance_id}")
async def update_advance(advance_id: str, request: AdvanceUpdate):
    """
    Met à jour une avance.
    """
    with get_db() as (conn, cursor):
        # Vérifier que l'avance existe
        cursor.execute("SELECT adv_id, adv_amount FROM mm_advances WHERE adv_id = %s", (advance_id,))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Avance non trouvée")

        # Construire la requête de mise à jour
        updates = []
        params = []

        if request.description is not None:
            updates.append("adv_description = %s")
            params.append(request.description)

        if request.person is not None:
            updates.append("adv_person = %s")
            params.append(request.person)

        if request.due_date is not None:
            updates.append("adv_due_date = %s")
            params.append(request.due_date if request.due_date else None)

        if request.status is not None:
            if request.status not in ['pending', 'partial', 'paid']:
                raise HTTPException(status_code=400, detail="Statut invalide")
            updates.append("adv_status = %s")
            params.append(request.status)

        if request.amount_received is not None:
            if request.amount_received < 0:
                raise HTTPException(status_code=400, detail="Le montant reçu ne peut pas être négatif")
            if request.amount_received > existing['adv_amount']:
                raise HTTPException(status_code=400, detail="Le montant reçu ne peut pas dépasser le montant de l'avance")
            updates.append("adv_amount_received = %s")
            params.append(request.amount_received)

            # Mettre à jour automatiquement le statut
            if request.amount_received == 0:
                updates.append("adv_status = 'pending'")
            elif request.amount_received >= existing['adv_amount']:
                updates.append("adv_status = 'paid'")
            else:
                updates.append("adv_status = 'partial'")

        if not updates:
            raise HTTPException(status_code=400, detail="Aucune modification fournie")

        params.append(advance_id)
        cursor.execute(f"""
            UPDATE mm_advances SET {', '.join(updates)} WHERE adv_id = %s
        """, params)

        # Récupérer l'avance mise à jour
        cursor.execute("""
            SELECT
                a.adv_id as id,
                a.adv_usr_id as user_id,
                a.adv_acc_id as account_id,
                a.adv_amount as amount,
                a.adv_description as description,
                a.adv_person as person,
                a.adv_date as date,
                a.adv_due_date as due_date,
                a.adv_direction as direction,
                a.adv_status as status,
                a.adv_amount_received as amount_received,
                a.adv_trx_id as transaction_id,
                a.created_at,
                a.updated_at,
                acc.acc_name as account_name,
                acc.acc_icon as account_icon,
                acc.acc_color as account_color
            FROM mm_advances a
            JOIN mm_accounts acc ON a.adv_acc_id = acc.acc_id
            WHERE a.adv_id = %s
        """, (advance_id,))
        advance = cursor.fetchone()

    return {"advance": advance}


@router.post("/{advance_id}/payment")
async def record_payment(advance_id: str, request: AdvancePayment):
    """
    Enregistre un remboursement (partiel ou total) pour une avance.
    - direction='given': je reçois un remboursement → transaction income (catégorie "Remboursements")
    - direction='received': je rembourse → transaction expense (catégorie "Remboursement d'emprunt")
    """
    with get_db() as (conn, cursor):
        # Récupérer l'avance avec les infos utilisateur et compte
        cursor.execute("""
            SELECT adv_id, adv_usr_id, adv_acc_id, adv_amount, adv_amount_received,
                   adv_status, adv_direction, adv_person, adv_description
            FROM mm_advances WHERE adv_id = %s
        """, (advance_id,))
        advance = cursor.fetchone()

        if not advance:
            raise HTTPException(status_code=404, detail="Avance non trouvée")

        if advance['adv_status'] == 'paid':
            raise HTTPException(status_code=400, detail="Cette avance est déjà entièrement remboursée")

        if request.amount <= 0:
            raise HTTPException(status_code=400, detail="Le montant du remboursement doit être positif")

        # Calculer le nouveau montant reçu/payé
        new_amount_received = float(advance['adv_amount_received']) + request.amount
        remaining = float(advance['adv_amount']) - new_amount_received

        if remaining < 0:
            raise HTTPException(
                status_code=400,
                detail=f"Le remboursement dépasse le montant restant ({float(advance['adv_amount']) - float(advance['adv_amount_received']):.2f} €)"
            )

        if not request.skip_transaction:
            direction = advance['adv_direction'] or 'given'

            # Déterminer la catégorie et le type de transaction selon la direction
            if direction == 'given':
                # Je reçois un remboursement → revenu
                category_name = 'Remboursements'
                category_type = 'income'
                trx_type = 'income'
                transaction_description = f"Remboursement de {advance['adv_person']}"
            else:
                # Je rembourse → dépense
                category_name = "Remboursement d'emprunt"
                category_type = 'expense'
                trx_type = 'expense'
                transaction_description = f"Remboursement à {advance['adv_person']}"

            if advance['adv_description']:
                transaction_description += f" - {advance['adv_description']}"

            # Trouver la catégorie appropriée
            cursor.execute("""
                SELECT cat_id FROM mm_categories
                WHERE cat_usr_id = %s AND cat_name = %s AND cat_type = %s
            """, (advance['adv_usr_id'], category_name, category_type))
            category = cursor.fetchone()

            if not category:
                raise HTTPException(
                    status_code=422,
                    detail={
                        "error_code": "MISSING_CATEGORY",
                        "message": f"Catégorie '{category_name}' non trouvée",
                        "missing_categories": [category_name]
                    }
                )

            # Créer la transaction pour le remboursement
            transaction_id = str(uuid.uuid4())
            today = date_module.today().isoformat()

            cursor.execute("""
                INSERT INTO mm_transactions (
                    trx_id, trx_acc_id, trx_cat_id, trx_amount, trx_type,
                    trx_description, trx_date
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                transaction_id, advance['adv_acc_id'], category['cat_id'],
                request.amount, trx_type, transaction_description, today
            ))

        # Déterminer le nouveau statut
        if remaining == 0:
            new_status = 'paid'
        else:
            new_status = 'partial'

        # Mettre à jour l'avance
        cursor.execute("""
            UPDATE mm_advances
            SET adv_amount_received = %s, adv_status = %s
            WHERE adv_id = %s
        """, (new_amount_received, new_status, advance_id))

        # Récupérer l'avance mise à jour
        cursor.execute("""
            SELECT
                a.adv_id as id,
                a.adv_usr_id as user_id,
                a.adv_acc_id as account_id,
                a.adv_amount as amount,
                a.adv_description as description,
                a.adv_person as person,
                a.adv_date as date,
                a.adv_due_date as due_date,
                a.adv_direction as direction,
                a.adv_status as status,
                a.adv_amount_received as amount_received,
                a.adv_trx_id as transaction_id,
                a.created_at,
                a.updated_at,
                acc.acc_name as account_name,
                acc.acc_icon as account_icon,
                acc.acc_color as account_color
            FROM mm_advances a
            JOIN mm_accounts acc ON a.adv_acc_id = acc.acc_id
            WHERE a.adv_id = %s
        """, (advance_id,))
        updated_advance = cursor.fetchone()

    return {
        "advance": updated_advance,
        "payment": {
            "amount": request.amount,
            "remaining": remaining,
            "is_fully_paid": remaining == 0
        }
    }


@router.delete("/{advance_id}")
async def delete_advance(advance_id: str):
    """
    Supprime une avance.
    """
    with get_db() as (conn, cursor):
        cursor.execute("SELECT adv_id FROM mm_advances WHERE adv_id = %s", (advance_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Avance non trouvée")

        cursor.execute("DELETE FROM mm_advances WHERE adv_id = %s", (advance_id,))

    return {"message": "Avance supprimée"}
