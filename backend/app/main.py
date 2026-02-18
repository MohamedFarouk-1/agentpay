"""
Main FastAPI application
Initializes the API server with all routes and middleware
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import init_db, close_db
from app.routes import funds, agents, transactions
from app.services.blockchain import blockchain_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle manager for the application
    Initializes database on startup, closes on shutdown
    """
    # Startup
    print("🚀 Starting AgentPay API...")
    print(f"📡 Connected to blockchain: {blockchain_service.is_connected()}")
    print(f"🔗 RPC URL: {settings.RPC_URL}")
    print(f"📝 Contract Address: {settings.CONTRACT_ADDRESS}")

    # Initialize database
    await init_db()
    print("✅ Database initialized")

    yield

    # Shutdown
    print("🛑 Shutting down...")
    await close_db()
    print("✅ Database connections closed")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API for AgentPay - Payment infrastructure for autonomous AI agents",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(funds.router, prefix=settings.API_PREFIX)
app.include_router(agents.router, prefix=settings.API_PREFIX)
app.include_router(transactions.router, prefix=settings.API_PREFIX)


@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "blockchain_connected": blockchain_service.is_connected(),
        "chain_id": settings.CHAIN_ID,
        "contract_address": settings.CONTRACT_ADDRESS,
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "blockchain": "connected" if blockchain_service.is_connected() else "disconnected",
    }


@app.get(f"{settings.API_PREFIX}/stats")
async def get_stats():
    """Get platform statistics"""
    return {
        "platform_fee_bps": 200,  # 2%
        "chain_id": settings.CHAIN_ID,
        "contract_address": settings.CONTRACT_ADDRESS,
        "usdc_address": settings.USDC_ADDRESS,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
