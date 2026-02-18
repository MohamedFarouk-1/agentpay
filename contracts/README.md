# Agent Payment Vault

An AI agent payment system that allows crypto trading bots to automatically purchase services on behalf of funds. Built with Solidity 0.8.20 and Hardhat.

## Features

- **Secure Fund Management**: Funds can deposit and withdraw USDC at any time
- **Bot Authorization**: Funds control which trading bots can make purchases on their behalf
- **Spending Limits**:
  - Daily spending limits to prevent runaway costs
  - Per-transaction limits for additional safety
  - Limits automatically reset daily
- **Platform Fees**: Configurable fee structure (default 2%)
- **Purchase Tracking**: Complete history of all purchases
- **Multi-Network Support**: Deploy to Base, Arbitrum, and testnets
- **Battle-Tested**: Comprehensive test suite with 50+ test cases

## Project Structure

```
agent-payment-vault/
├── contracts/
│   ├── AgentPaymentVault.sol    # Main payment vault contract
│   └── MockUSDC.sol              # Test USDC token (for development)
├── scripts/
│   └── deploy.js                 # Deployment script
├── test/
│   └── AgentPaymentVault.test.js # Comprehensive test suite
├── hardhat.config.js             # Hardhat configuration
├── package.json                  # Dependencies and scripts
├── .env.example                  # Environment variables template
└── README.md                     # This file
```

## Installation

1. Clone the repository:
```bash
cd agent-payment-vault
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Edit `.env` and add your configuration:
```env
PRIVATE_KEY=your_private_key_without_0x_prefix
TREASURY_ADDRESS=address_to_receive_fees
BASESCAN_API_KEY=your_basescan_api_key
ARBISCAN_API_KEY=your_arbiscan_api_key
```

## Usage

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm test
```

For test coverage:
```bash
npm run test:coverage
```

### Deploy

**Local Development:**
```bash
# Start a local Hardhat node (in one terminal)
npm run node

# Deploy to local network (in another terminal)
npm run deploy:local
```

**Testnets:**
```bash
# Base Sepolia
npm run deploy:base-sepolia

# Arbitrum Sepolia
npm run deploy:arbitrum-sepolia
```

**Mainnets:**
```bash
# Base Mainnet
npm run deploy:base

# Arbitrum Mainnet
npm run deploy:arbitrum
```

### Verify Contracts

Contracts are automatically verified during deployment. To verify manually:

```bash
npx hardhat verify --network base-sepolia DEPLOYED_CONTRACT_ADDRESS USDC_ADDRESS TREASURY_ADDRESS
```

## Smart Contract Overview

### AgentPaymentVault

The main contract that handles all payment operations.

#### Key Functions

**For Funds:**

- `deposit(uint256 amount)` - Deposit USDC into the vault
- `withdraw(uint256 amount)` - Withdraw USDC from the vault
- `authorizeBot(address bot)` - Authorize a bot to make purchases
- `revokeBot(address bot)` - Revoke a bot's authorization
- `setLimits(uint256 dailyLimit, uint256 perTxLimit)` - Set spending limits

**For Bots:**

- `purchaseOnBehalf(address fund, address recipient, uint256 amount, string metadata)` - Execute a purchase on behalf of a fund

**View Functions:**

- `getFundAccount(address fund)` - Get fund account details
- `isBotAuthorized(address fund, address bot)` - Check if bot is authorized
- `getFundPurchases(address fund)` - Get purchase history for a fund
- `getPurchase(uint256 purchaseId)` - Get details of a specific purchase

**Owner Functions:**

- `setPlatformFee(uint256 newFeeBps)` - Update platform fee (max 10%)
- `setTreasury(address newTreasury)` - Update treasury address

#### Events

- `Deposited(address fund, uint256 amount, uint256 newBalance)`
- `Withdrawn(address fund, uint256 amount, uint256 newBalance)`
- `BotAuthorized(address fund, address bot)`
- `BotRevoked(address fund, address bot)`
- `PurchaseExecuted(address fund, address bot, address recipient, uint256 amount, uint256 fee, uint256 purchaseId, string metadata)`
- `LimitsUpdated(address fund, uint256 dailyLimit, uint256 perTxLimit)`
- `PlatformFeeUpdated(uint256 oldFeeBps, uint256 newFeeBps)`
- `TreasuryUpdated(address oldTreasury, address newTreasury)`

## Example Workflow

1. **Fund deposits USDC:**
```javascript
const depositAmount = ethers.parseUnits("10000", 6); // 10,000 USDC
await usdc.approve(vaultAddress, depositAmount);
await vault.deposit(depositAmount);
```

2. **Fund authorizes a trading bot:**
```javascript
await vault.authorizeBot(botAddress);
```

3. **Fund sets spending limits:**
```javascript
const dailyLimit = ethers.parseUnits("1000", 6);   // $1,000/day
const perTxLimit = ethers.parseUnits("100", 6);    // $100/transaction
await vault.setLimits(dailyLimit, perTxLimit);
```

4. **Bot makes a purchase:**
```javascript
const purchaseAmount = ethers.parseUnits("50", 6); // $50
await vault.connect(bot).purchaseOnBehalf(
  fundAddress,
  recipientAddress,
  purchaseAmount,
  "API subscription payment"
);
```

## Security Considerations

- **Reentrancy Protection**: Uses OpenZeppelin's `ReentrancyGuard`
- **Access Control**: Implements proper authorization checks
- **Integer Overflow**: Solidity 0.8.20 has built-in overflow protection
- **Spending Limits**: Daily and per-transaction limits prevent abuse
- **Isolated Fund Accounts**: Each fund's balance and settings are independent

## Network Deployments

### USDC Addresses

The deployment script automatically uses the correct USDC address for each network:

- **Base Mainnet**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **Base Sepolia**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Arbitrum Mainnet**: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`
- **Arbitrum Sepolia**: `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d`

For local development, a MockUSDC contract is automatically deployed.

## Gas Optimization

The contract is optimized for gas efficiency:
- Uses `immutable` for USDC address
- Efficient storage packing
- Minimal external calls
- Optimized compiler settings (200 runs)

## Testing

The test suite includes:
- Deployment tests
- Deposit and withdrawal tests
- Bot authorization tests
- Purchase execution tests
- Spending limit enforcement
- Daily limit reset tests
- Fee calculation tests
- Edge case handling

Run tests with:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for solutions

## Acknowledgments

- Built with [Hardhat](https://hardhat.org/)
- Uses [OpenZeppelin Contracts](https://openzeppelin.com/contracts/)
- Tested with [Chai](https://www.chaijs.com/)
