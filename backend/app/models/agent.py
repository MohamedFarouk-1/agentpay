"""
Agent model - represents an AI agent in the marketplace
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, Numeric, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Agent(Base):
    """AI agent model"""

    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    wallet_address = Column(String(42), unique=True, nullable=False, index=True)
    price = Column(Numeric(20, 6), nullable=False)  # Price in USDC (6 decimals)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    transactions = relationship("Transaction", back_populates="agent", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Agent(id={self.id}, name={self.name}, price={self.price})>"

    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "name": self.name,
            "wallet_address": self.wallet_address,
            "price": str(self.price),  # Convert Decimal to string for JSON
            "description": self.description,
            "image_url": self.image_url,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
