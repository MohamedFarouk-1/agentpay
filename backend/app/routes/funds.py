"""
Funds routes - handle fund account operations
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.database import get_db
from app.models.fund import Fund
from app.services.blockchain import blockchain_service
from app.auth.wallet import wallet_auth

router = APIRouter(prefix="/funds", tags=["funds"])


# Pydantic schemas
class FundCreate(BaseModel):
    wallet_address: str


class FundResponse(BaseModel):
    id: int
    wallet_address: str
    created_at: str
    updated_at: str | None


class FundBalanceResponse(BaseModel):
    wallet_address: str
    balance: float
    daily_spending_limit: float
    per_transaction_limit: float
    today_spent: float
    last_reset_day: int
    usdc_wallet_balance: float


@router.post("/", response_model=FundResponse)
async def create_fund(fund_data: FundCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new fund account
    Validates wallet address and stores in database
    """
    # Validate wallet address
    if not wallet_auth.is_valid_address(fund_data.wallet_address):
        raise HTTPException(status_code=400, detail="Invalid wallet address")

    # Convert to checksum address
    checksum_address = wallet_auth.to_checksum_address(fund_data.wallet_address)

    # Check if fund already exists
    result = await db.execute(
        select(Fund).where(Fund.wallet_address == checksum_address)
    )
    existing_fund = result.scalar_one_or_none()

    if existing_fund:
        raise HTTPException(status_code=400, detail="Fund already exists")

    # Create new fund
    new_fund = Fund(wallet_address=checksum_address)
    db.add(new_fund)
    await db.commit()
    await db.refresh(new_fund)

    return FundResponse(**new_fund.to_dict())


@router.get("/", response_model=list[FundResponse])
async def list_funds(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    """
    List all funds
    Supports pagination with skip and limit
    """
    result = await db.execute(
        select(Fund).offset(skip).limit(limit)
    )
    funds = result.scalars().all()

    return [FundResponse(**fund.to_dict()) for fund in funds]


@router.get("/{wallet_address}", response_model=FundResponse)
async def get_fund(wallet_address: str, db: AsyncSession = Depends(get_db)):
    """
    Get a specific fund by wallet address
    """
    # Validate and convert to checksum
    if not wallet_auth.is_valid_address(wallet_address):
        raise HTTPException(status_code=400, detail="Invalid wallet address")

    checksum_address = wallet_auth.to_checksum_address(wallet_address)

    result = await db.execute(
        select(Fund).where(Fund.wallet_address == checksum_address)
    )
    fund = result.scalar_one_or_none()

    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")

    return FundResponse(**fund.to_dict())


@router.get("/{wallet_address}/balance", response_model=FundBalanceResponse)
async def get_fund_balance(wallet_address: str, db: AsyncSession = Depends(get_db)):
    """
    Get fund balance and limits from smart contract
    Also returns USDC balance in wallet
    """
    # Validate wallet address
    if not wallet_auth.is_valid_address(wallet_address):
        raise HTTPException(status_code=400, detail="Invalid wallet address")

    checksum_address = wallet_auth.to_checksum_address(wallet_address)

    # Get balance from blockchain
    balance_info = blockchain_service.get_fund_balance(checksum_address)

    if "error" in balance_info:
        raise HTTPException(status_code=500, detail=f"Blockchain error: {balance_info['error']}")

    # Get USDC balance in wallet
    usdc_balance = blockchain_service.get_usdc_balance(checksum_address)

    return FundBalanceResponse(
        wallet_address=checksum_address,
        balance=balance_info["balance"],
        daily_spending_limit=balance_info["daily_spending_limit"],
        per_transaction_limit=balance_info["per_transaction_limit"],
        today_spent=balance_info["today_spent"],
        last_reset_day=balance_info["last_reset_day"],
        usdc_wallet_balance=usdc_balance,
    )


@router.delete("/{wallet_address}")
async def delete_fund(wallet_address: str, db: AsyncSession = Depends(get_db)):
    """
    Delete a fund account
    """
    if not wallet_auth.is_valid_address(wallet_address):
        raise HTTPException(status_code=400, detail="Invalid wallet address")

    checksum_address = wallet_auth.to_checksum_address(wallet_address)

    result = await db.execute(
        select(Fund).where(Fund.wallet_address == checksum_address)
    )
    fund = result.scalar_one_or_none()

    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")

    await db.delete(fund)
    await db.commit()

    return {"message": "Fund deleted successfully"}
