import pymysql
from pymysql.cursors import DictCursor
from contextlib import contextmanager
from app.config import get_settings

settings = get_settings()


def get_connection():
    """
    Crée une nouvelle connexion à la base de données MySQL.
    Retourne un objet connexion pymysql.
    """
    return pymysql.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME,
        charset="utf8mb4",
        cursorclass=DictCursor,  # Retourne les résultats sous forme de dictionnaires
        autocommit=False,
    )


@contextmanager
def get_db():
    """
    Context manager pour gérer les connexions à la base de données.
    Gère automatiquement le commit/rollback et la fermeture de la connexion.

    Utilisation:
        with get_db() as (conn, cursor):
            cursor.execute("SELECT * FROM mm_users")
            results = cursor.fetchall()
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        yield conn, cursor
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()


def init_database():
    """
    Initialise la base de données en exécutant le fichier schema.sql.
    Crée les tables si elles n'existent pas.
    """
    import os

    schema_path = os.path.join(os.path.dirname(__file__), "..", "schema.sql")

    # Connexion sans spécifier la base de données (pour pouvoir la créer)
    conn = pymysql.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        charset="utf8mb4",
        autocommit=True,
    )

    try:
        with open(schema_path, "r", encoding="utf-8") as f:
            schema_sql = f.read()

        cursor = conn.cursor()
        # Exécute chaque instruction SQL séparément
        for statement in schema_sql.split(";"):
            statement = statement.strip()
            if statement:
                cursor.execute(statement)
        cursor.close()
        print("Base de données initialisée avec succès.")
    except FileNotFoundError:
        print(f"Fichier schema.sql non trouvé: {schema_path}")
    except Exception as e:
        print(f"Erreur lors de l'initialisation de la base de données: {e}")
        raise
    finally:
        conn.close()


def test_connection():
    """
    Teste la connexion à la base de données.
    Retourne True si la connexion réussit, False sinon.
    """
    try:
        with get_db() as (conn, cursor):
            cursor.execute("SELECT 1")
            return True
    except Exception:
        return False
