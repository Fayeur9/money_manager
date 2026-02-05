from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Configuration de l'application chargée depuis les variables d'environnement."""

    # Configuration de la base de données
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "money_manager"
    DB_USER: str = "root"
    DB_PASSWORD: str = ""

    # Configuration de l'API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    DEBUG: bool = False

    # Clé secrète pour les tokens JWT
    SECRET_KEY: str = "votre-cle-secrete-a-changer-en-production"

    # CORS - origines autorisées pour le frontend
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    @property
    def database_url(self) -> str:
        """Construit l'URL de connexion MySQL."""
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Retourne les settings en cache (singleton)."""
    return Settings()
