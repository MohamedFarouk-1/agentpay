"""
Transaction model - represents a purchase transaction
"""
from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Transaction(Base):
    """Transaction model for purchase history"""

    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    fund_id = Column(Integer, ForeignKey("funds.id"), nullable=False, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False, index=True)
    amount = Column(Numeric(20, 6), nullable=False)  # Amount in USDC (6 decimals)
    fee = Column(Numeric(20, 6), nullable=False)  # Platform fee
    tx_hash = Column(String(66), unique=True, nullable=False, index=True)
    tx_metadata = Column(Text, nullable=True)  # Renamed from 'metadata' (reserved keyword)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    fund = relationship("Fund", back_populates="transactions")
    agent = relationship("Agent", back_populates="transactions")

    def __repr__(self):
        return f"<Transaction(id={self.id}, fund_id={self.fund_id}, agent_id={self.agent_id}, amount={self.amount})>"

    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "fund_id": self.fund_id,
            "agent_id": self.agent_id,
            "amount": str(self.amount),
            "fee": str(self.fee),
            "tx_hash": self.tx_hash,
            "tx_metadata": self.tx_metadata,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }
