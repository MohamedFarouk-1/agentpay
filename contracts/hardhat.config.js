require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";

// RPC URLs
const BASE_SEPOLIA_RPC = process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org";
const BASE_MAINNET_RPC = process.env.BASE_MAINNET_RPC || "https://mainnet.base.org";
const ARBITRUM_SEPOLIA_RPC = process.env.ARBITRUM_SEPOLIA_RPC || "https://sepolia-rollup.arbitrum.io/rpc";
const ARBITRUM_MAINNET_RPC = process.env.ARBITRUM_MAINNET_RPC || "https://arb1.arbitrum.io/rpc";

// API Keys for verification
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY || "";
const ARBISCAN_API_KEY = process.env.ARBISCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // Base Sepolia Testnet
    "base-sepolia": {
      url: BASE_SEPOLIA_RPC,
      chainId: 84532,
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
    },
    // Base Mainnet
    base: {
      url: BASE_MAINNET_RPC,
      chainId: 8453,
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
    },
    // Arbitrum Sepolia Testnet
    "arbitrum-sepolia": {
      url: ARBITRUM_SEPOLIA_RPC,
      chainId: 421614,
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
    },
    // Arbitrum Mainnet
    arbitrum: {
      url: ARBITRUM_MAINNET_RPC,
      chainId: 42161,
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
    },
  },
  etherscan: {
    apiKey: {
      // Base
      "base": BASESCAN_API_KEY,
      "base-sepolia": BASESCAN_API_KEY,
      "baseSepolia": BASESCAN_API_KEY,
      // Arbitrum
      "arbitrum": ARBISCAN_API_KEY,
      "arbitrum-sepolia": ARBISCAN_API_KEY,
      "arbitrumSepolia": ARBISCAN_API_KEY,
    },
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org"
        }
      },
      {
        network: "base-sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      },
      {
        network: "arbitrum",
        chainId: 42161,
        urls: {
          apiURL: "https://api.arbiscan.io/api",
          browserURL: "https://arbiscan.io"
        }
      },
      {
        network: "arbitrum-sepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io"
        }
      }
    ]
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
};
