# Agent Payment Platform - Backend API

FastAPI backend for the AI Agent Payment Platform. Handles off-chain data storage and provides REST API endpoints for the frontend.

## Features

- **Fund Management**: Create and manage fund accounts
- **Bot Marketplace**: CRUD operations for trading bots
- **Transaction History**: Track and query purchase history
- **Blockchain Integration**: Read from smart contracts using Web3.py
- **Wallet Authentication**: Verify wallet signatures for auth
- **Async Database**: SQLAlchemy with async support (SQLite/PostgreSQL)

## Tech Stack

- **Framework**: FastAPI 0.104+
- **Database**: SQLAlchemy (async) with SQLite (dev) / PostgreSQL (prod)
- **Blockchain**: Web3.py for contract interactions
- **Auth**: Wallet signature verification with eth-account

## Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Update CONTRACT_ADDRESS in .env after deploying contracts

## Running the Server

### Development Mode

```bash
# With auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or using Python directly
python -m app.main
```

The API will be available at:
- API: http://localhost:8000
- Interactive Docs: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc

### Production Mode

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

### General
- `GET /` - API information
- `GET /health` - Health check
- `GET /api/v1/stats` - Platform statistics

### Funds
- `POST /api/v1/funds` - Create fund account
- `GET /api/v1/funds` - List all funds
- `GET /api/v1/funds/{wallet_address}` - Get fund by wallet
- `GET /api/v1/funds/{wallet_address}/balance` - Get fund balance from contract
- `DELETE /api/v1/funds/{wallet_address}` - Delete fund

### Bots
- `POST /api/v1/bots` - Create bot
- `GET /api/v1/bots` - List all bots
- `GET /api/v1/bots/{bot_id}` - Get bot by ID
- `GET /api/v1/bots/wallet/{wallet_address}` - Get bot by wallet
- `PUT /api/v1/bots/{bot_id}` - Update bot
- `DELETE /api/v1/bots/{bot_id}` - Delete bot

### Transactions
- `POST /api/v1/transactions` - Record transaction
- `GET /api/v1/transactions` - List all transactions
- `GET /api/v1/transactions/fund/{fund_id}` - Get fund transactions
- `GET /api/v1/transactions/wallet/{wallet_address}` - Get wallet transactions
- `GET /api/v1/transactions/{transaction_id}` - Get transaction by ID
- `GET /api/v1/transactions/hash/{tx_hash}` - Get transaction by hash

## Project Structure

```
agent-payment-backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app & routes
│   ├── config.py            # Configuration settings
│   ├── database.py          # Database setup
│   ├── models/              # SQLAlchemy models
│   │   ├── fund.py
│   │   ├── bot.py
│   │   └── transaction.py
│   ├── routes/              # API routes
│   │   ├── funds.py
│   │   ├── bots.py
│   │   └── transactions.py
│   ├── services/            # Business logic
│   │   └── blockchain.py    # Web3 interactions
│   └── auth/                # Authentication
│       └── wallet.py        # Wallet signature verification
├── requirements.txt
├── .env.example
└── README.md
```

## Database

### SQLite (Development)
The default configuration uses SQLite, which creates a local `agent_payment.db` file.

### PostgreSQL (Production)
For production, update DATABASE_URL in .env:
```
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/agent_payment
```

### Migrations
For production use, consider adding Alembic migrations:
```bash
alembic init alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

## Blockchain Integration

The backend reads from smart contracts but does NOT execute transactions. All on-chain operations (deposit, withdraw, authorize, purchase) are handled directly by the frontend using wagmi.

The backend:
- Reads fund balances and limits
- Checks bot authorization status
- Retrieves transaction history
- Stores transaction records after they occur on-chain

## Testing

Run tests with pytest:
```bash
pytest
```

## Environment Variables

See [.env.example](.env.example) for all configuration options.

Key variables:
- `DATABASE_URL` - Database connection string
- `RPC_URL` - Blockchain RPC endpoint
- `CONTRACT_ADDRESS` - AgentPaymentVault contract address
- `USDC_ADDRESS` - USDC token address
- `CORS_ORIGINS` - Allowed frontend origins

## CORS Configuration

Update CORS_ORIGINS in .env to include your frontend URL:
```
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000","https://your-domain.com"]
```

## Deployment

### Docker
See root docker-compose.yml for containerized deployment.

### Manual Deployment
1. Set up PostgreSQL database
2. Update .env with production values
3. Run with gunicorn or uvicorn
4. Use a reverse proxy (nginx) for SSL

## License

MIT
