# Agent Payment Platform - Frontend

React frontend for the AI Agent Payment Platform. Built with Vite, RainbowKit, wagmi, and TailwindCSS.

## Features

- **Wallet Connection**: RainbowKit integration for easy wallet connection
- **Vault Management**: Deposit and withdraw USDC
- **Bot Authorization**: Browse marketplace and authorize trading bots
- **Transaction History**: View all purchases made by bots
- **Spending Limits**: View and manage daily/per-transaction limits
- **Responsive Design**: Works on mobile, tablet, and desktop

## Tech Stack

- **Framework**: React 18 with Vite
- **Styling**: TailwindCSS
- **Web3**: wagmi v2 + viem + RainbowKit
- **State Management**: @tanstack/react-query
- **HTTP Client**: Axios
- **Routing**: React Router v6

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Get a WalletConnect Project ID:
   - Go to https://cloud.walletconnect.com
   - Create a new project
   - Copy the Project ID to `.env`

4. Update contract addresses in `src/config/contracts.js` after deploying contracts

## Running the App

### Development Mode

```bash
npm run dev
```

The app will be available at http://localhost:5173

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
agent-payment-frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── WalletConnect.jsx
│   │   ├── Dashboard.jsx
│   │   ├── DepositModal.jsx
│   │   ├── WithdrawModal.jsx
│   │   ├── BotCard.jsx
│   │   └── AuthorizeBotModal.jsx
│   ├── pages/              # Page components
│   │   ├── Home.jsx
│   │   ├── FundDashboard.jsx
│   │   └── Marketplace.jsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useContract.js  # Contract interaction hooks
│   │   └── useApi.js       # Backend API hooks
│   ├── config/             # Configuration
│   │   ├── contracts.js    # Contract addresses & ABIs
│   │   └── wagmi.js        # Wagmi configuration
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## Configuration

### Update Contract Addresses

After deploying contracts, update [src/config/contracts.js](src/config/contracts.js):

```javascript
export const VAULT_CONTRACT_ADDRESS = 'YOUR_DEPLOYED_VAULT_ADDRESS';
export const USDC_CONTRACT_ADDRESS = 'YOUR_USDC_ADDRESS';
```

### Update Backend API URL

Edit `.env`:
```
VITE_API_URL=http://localhost:8000/api/v1
```

Or update in production deployment settings.

## Features Walkthrough

### 1. Connect Wallet
- Users connect their Web3 wallet using RainbowKit
- Supports MetaMask, WalletConnect, Coinbase Wallet, and more
- Automatically switches to Base Sepolia network

### 2. Dashboard
- View vault balance and wallet USDC balance
- Deposit USDC into vault (approve + deposit flow)
- Withdraw USDC from vault
- View spending limits
- See recent transaction history

### 3. Marketplace
- Browse available trading bots
- View bot details (name, price, description)
- Authorize bots to make purchases
- See authorization status

### 4. Transaction Flow

**Deposit:**
1. User enters amount
2. Approve USDC spending (transaction 1)
3. Deposit to vault (transaction 2)
4. Balance updates automatically

**Authorize Bot:**
1. User selects bot from marketplace
2. Reviews bot details
3. Confirms authorization transaction
4. Bot can now make purchases

## Smart Contract Integration

The frontend interacts with smart contracts using wagmi hooks:

- `useFundAccount()` - Get vault balance and limits
- `useUSDCBalance()` - Get USDC wallet balance
- `useApproveUSDC()` - Approve USDC spending
- `useDeposit()` - Deposit USDC to vault
- `useWithdraw()` - Withdraw USDC from vault
- `useAuthorizeBot()` - Authorize a bot
- `useRevokeBot()` - Revoke bot authorization
- `useSetLimits()` - Set spending limits

## Backend API Integration

The frontend fetches off-chain data from the backend:

- `useBots()` - Get all bots from marketplace
- `useTransactions()` - Get transaction history for wallet
- `createFund()` - Register fund account
- `recordTransaction()` - Record on-chain transaction

## Styling

The app uses TailwindCSS for styling:
- Utility-first CSS framework
- Responsive design with mobile-first approach
- Custom color scheme in `tailwind.config.js`
- Custom components in `src/index.css`

## Environment Variables

- `VITE_API_URL` - Backend API URL (default: http://localhost:8000/api/v1)
- `VITE_WALLETCONNECT_PROJECT_ID` - WalletConnect Project ID

## Deployment

### Vercel
```bash
npm run build
# Deploy dist/ folder to Vercel
```

### Netlify
```bash
npm run build
# Deploy dist/ folder to Netlify
```

### Environment Variables in Production
Set these in your hosting platform:
- `VITE_API_URL` - Your production API URL
- `VITE_WALLETCONNECT_PROJECT_ID` - Your WalletConnect Project ID

## Troubleshooting

### Contract not found
- Make sure you've deployed contracts and updated addresses in `src/config/contracts.js`
- Check that you're on the correct network (Base Sepolia)

### Transactions failing
- Ensure you have enough ETH for gas fees
- Ensure you have USDC to deposit
- Check that contract addresses are correct

### Backend API errors
- Ensure backend is running at the correct URL
- Check CORS settings in backend
- Verify API endpoints are accessible

## License

MIT
