/**
 * Contract addresses and configuration
 * Update these after deploying contracts
 */

// Base Sepolia Testnet
export const CHAIN_ID = 84532;

// Contract Addresses (update after deployment)
export const VAULT_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000'; // Update after deployment
export const USDC_CONTRACT_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'; // Base Sepolia USDC

// Backend API URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Platform Configuration
export const PLATFORM_FEE_BPS = 200; // 2%
export const USDC_DECIMALS = 6;

// Chain Configuration
export const baseSepolia = {
  id: 84532,
  name: 'Base Sepolia',
  network: 'base-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia.base.org'],
    },
    public: {
      http: ['https://sepolia.base.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BaseScan',
      url: 'https://sepolia.basescan.org',
    },
  },
  testnet: true,
};
