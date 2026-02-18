"""
Agents routes - handle AI agent marketplace CRUD operations
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from decimal import Decimal
from app.database import get_db
from app.models.agent import Agent
from app.auth.wallet import wallet_auth

router = APIRouter(prefix="/agents", tags=["agents"])


# Pydantic schemas
class AgentCreate(BaseModel):
    name: str
    wallet_address: str
    price: float
    description: str | None = None
    image_url: str | None = None


class AgentUpdate(BaseModel):
    name: str | None = None
    price: float | None = None
    description: str | None = None
    image_url: str | None = None
    is_active: bool | None = None


class AgentResponse(BaseModel):
    id: int
    name: str
    wallet_address: str
    price: str
    description: str | None
    image_url: str | None
    is_active: bool
    created_at: str
    updated_at: str | None


@router.post("/", response_model=AgentResponse)
async def create_agent(agent_data: AgentCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new AI agent in the marketplace
    """
    # Validate wallet address
    if not wallet_auth.is_valid_address(agent_data.wallet_address):
        raise HTTPException(status_code=400, detail="Invalid wallet address")

    checksum_address = wallet_auth.to_checksum_address(agent_data.wallet_address)

    # Check if agent with this wallet already exists
    result = await db.execute(
        select(Agent).where(Agent.wallet_address == checksum_address)
    )
    existing_agent = result.scalar_one_or_none()

    if existing_agent:
        raise HTTPException(status_code=400, detail="Agent with this wallet address already exists")

    # Create new agent
    new_agent = Agent(
        name=agent_data.name,
        wallet_address=checksum_address,
        price=Decimal(str(agent_data.price)),
        description=agent_data.description,
        image_url=agent_data.image_url,
    )
    db.add(new_agent)
    await db.commit()
    await db.refresh(new_agent)

    return AgentResponse(**new_agent.to_dict())


@router.get("/", response_model=list[AgentResponse])
async def list_agents(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """
    List all AI agents in the marketplace
    Can filter by active status
    """
    query = select(Agent)

    if active_only:
        query = query.where(Agent.is_active == True)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    agents = result.scalars().all()

    return [AgentResponse(**agent.to_dict()) for agent in agents]


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get a specific AI agent by ID
    """
    result = await db.execute(
        select(Agent).where(Agent.id == agent_id)
    )
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    return AgentResponse(**agent.to_dict())


@router.get("/wallet/{wallet_address}", response_model=AgentResponse)
async def get_agent_by_wallet(wallet_address: str, db: AsyncSession = Depends(get_db)):
    """
    Get an AI agent by wallet address
    """
    if not wallet_auth.is_valid_address(wallet_address):
        raise HTTPException(status_code=400, detail="Invalid wallet address")

    checksum_address = wallet_auth.to_checksum_address(wallet_address)

    result = await db.execute(
        select(Agent).where(Agent.wallet_address == checksum_address)
    )
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    return AgentResponse(**agent.to_dict())


@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(agent_id: int, agent_data: AgentUpdate, db: AsyncSession = Depends(get_db)):
    """
    Update an AI agent's information
    """
    result = await db.execute(
        select(Agent).where(Agent.id == agent_id)
    )
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Update fields if provided
    if agent_data.name is not None:
        agent.name = agent_data.name
    if agent_data.price is not None:
        agent.price = Decimal(str(agent_data.price))
    if agent_data.description is not None:
        agent.description = agent_data.description
    if agent_data.image_url is not None:
        agent.image_url = agent_data.image_url
    if agent_data.is_active is not None:
        agent.is_active = agent_data.is_active

    await db.commit()
    await db.refresh(agent)

    return AgentResponse(**agent.to_dict())


@router.delete("/{agent_id}")
async def delete_agent(agent_id: int, db: AsyncSession = Depends(get_db)):
    """
    Delete an AI agent from the marketplace
    """
    result = await db.execute(
        select(Agent).where(Agent.id == agent_id)
    )
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    await db.delete(agent)
    await db.commit()

    return {"message": "Agent deleted successfully"}
