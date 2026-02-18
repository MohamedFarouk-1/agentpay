"""
Transactions routes - handle transaction history
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from decimal import Decimal
from app.database import get_db
from app.models.transaction import Transaction
from app.models.fund import Fund
from app.models.agent import Agent
from app.services.blockchain import blockchain_service
from app.auth.wallet import wallet_auth

router = APIRouter(prefix="/transactions", tags=["transactions"])


# Pydantic schemas
class TransactionCreate(BaseModel):
    fund_id: int
    agent_id: int
    amount: float
    fee: float
    tx_hash: str
    tx_metadata: str | None = None


class TransactionResponse(BaseModel):
    id: int
    fund_id: int
    agent_id: int
    amount: str
    fee: str
    tx_hash: str
    tx_metadata: str | None
    timestamp: str
    fund_wallet: str | None = None
    agent_name: str | None = None


@router.post("/", response_model=TransactionResponse)
async def create_transaction(tx_data: TransactionCreate, db: AsyncSession = Depends(get_db)):
    """
    Record a new transaction
    This is typically called after a successful on-chain purchase
    """
    # Verify fund exists
    fund_result = await db.execute(
        select(Fund).where(Fund.id == tx_data.fund_id)
    )
    fund = fund_result.scalar_one_or_none()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")

    # Verify agent exists
    agent_result = await db.execute(
        select(Agent).where(Agent.id == tx_data.agent_id)
    )
    agent = agent_result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Check if transaction already exists (prevent duplicates)
    existing_result = await db.execute(
        select(Transaction).where(Transaction.tx_hash == tx_data.tx_hash)
    )
    existing_tx = existing_result.scalar_one_or_none()
    if existing_tx:
        raise HTTPException(status_code=400, detail="Transaction already recorded")

    # Create transaction
    new_transaction = Transaction(
        fund_id=tx_data.fund_id,
        agent_id=tx_data.agent_id,
        amount=Decimal(str(tx_data.amount)),
        fee=Decimal(str(tx_data.fee)),
        tx_hash=tx_data.tx_hash,
        tx_metadata=tx_data.tx_metadata,
    )
    db.add(new_transaction)
    await db.commit()
    await db.refresh(new_transaction)

    response_data = new_transaction.to_dict()
    response_data["fund_wallet"] = fund.wallet_address
    response_data["agent_name"] = agent.name

    return TransactionResponse(**response_data)


@router.get("/", response_model=list[TransactionResponse])
async def list_transactions(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    List all transactions with pagination
    Ordered by timestamp descending (newest first)
    """
    result = await db.execute(
        select(Transaction, Fund, Agent)
        .join(Fund, Transaction.fund_id == Fund.id)
        .join(Agent, Transaction.agent_id == Agent.id)
        .order_by(desc(Transaction.timestamp))
        .offset(skip)
        .limit(limit)
    )

    transactions = []
    for tx, fund, agent in result.all():
        tx_data = tx.to_dict()
        tx_data["fund_wallet"] = fund.wallet_address
        tx_data["agent_name"] = agent.name
        transactions.append(TransactionResponse(**tx_data))

    return transactions


@router.get("/fund/{fund_id}", response_model=list[TransactionResponse])
async def get_fund_transactions(
    fund_id: int,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all transactions for a specific fund
    """
    result = await db.execute(
        select(Transaction, Fund, Agent)
        .join(Fund, Transaction.fund_id == Fund.id)
        .join(Agent, Transaction.agent_id == Agent.id)
        .where(Transaction.fund_id == fund_id)
        .order_by(desc(Transaction.timestamp))
        .offset(skip)
        .limit(limit)
    )

    transactions = []
    for tx, fund, agent in result.all():
        tx_data = tx.to_dict()
        tx_data["fund_wallet"] = fund.wallet_address
        tx_data["agent_name"] = agent.name
        transactions.append(TransactionResponse(**tx_data))

    return transactions


@router.get("/wallet/{wallet_address}", response_model=list[TransactionResponse])
async def get_wallet_transactions(
    wallet_address: str,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all transactions for a specific wallet address
    """
    # Validate wallet address
    if not wallet_auth.is_valid_address(wallet_address):
        raise HTTPException(status_code=400, detail="Invalid wallet address")

    checksum_address = wallet_auth.to_checksum_address(wallet_address)

    # Find fund by wallet address
    fund_result = await db.execute(
        select(Fund).where(Fund.wallet_address == checksum_address)
    )
    fund = fund_result.scalar_one_or_none()

    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found for this wallet")

    # Get transactions
    result = await db.execute(
        select(Transaction, Fund, Agent)
        .join(Fund, Transaction.fund_id == Fund.id)
        .join(Agent, Transaction.agent_id == Agent.id)
        .where(Transaction.fund_id == fund.id)
        .order_by(desc(Transaction.timestamp))
        .offset(skip)
        .limit(limit)
    )

    transactions = []
    for tx, fund, agent in result.all():
        tx_data = tx.to_dict()
        tx_data["fund_wallet"] = fund.wallet_address
        tx_data["agent_name"] = agent.name
        transactions.append(TransactionResponse(**tx_data))

    return transactions


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(transaction_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get a specific transaction by ID
    """
    result = await db.execute(
        select(Transaction, Fund, Agent)
        .join(Fund, Transaction.fund_id == Fund.id)
        .join(Agent, Transaction.agent_id == Agent.id)
        .where(Transaction.id == transaction_id)
    )

    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Transaction not found")

    tx, fund, agent = row
    tx_data = tx.to_dict()
    tx_data["fund_wallet"] = fund.wallet_address
    tx_data["agent_name"] = agent.name

    return TransactionResponse(**tx_data)


@router.get("/hash/{tx_hash}", response_model=TransactionResponse)
async def get_transaction_by_hash(tx_hash: str, db: AsyncSession = Depends(get_db)):
    """
    Get a transaction by its blockchain transaction hash
    """
    result = await db.execute(
        select(Transaction, Fund, Agent)
        .join(Fund, Transaction.fund_id == Fund.id)
        .join(Agent, Transaction.agent_id == Agent.id)
        .where(Transaction.tx_hash == tx_hash)
    )

    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Transaction not found")

    tx, fund, agent = row
    tx_data = tx.to_dict()
    tx_data["fund_wallet"] = fund.wallet_address
    tx_data["agent_name"] = agent.name

    return TransactionResponse(**tx_data)
