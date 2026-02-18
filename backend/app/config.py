"""
Configuration settings for the application
Loads environment variables and provides type-safe access
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Application
    APP_NAME: str = "AgentPay"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./agent_payment.db"  # Default to SQLite for dev

    # Blockchain
    RPC_URL: str = "https://sepolia.base.org"
    CHAIN_ID: int = 84532  # Base Sepolia
    CONTRACT_ADDRESS: str = "0x0000000000000000000000000000000000000000"  # Update after deployment
    USDC_ADDRESS: str = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"  # Base Sepolia USDC

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # API
    API_PREFIX: str = "/api/v1"

    # JWT Secret (for future auth implementation)
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"
        case_sensitive = True


# Create global settings instance
settings = Settings()
