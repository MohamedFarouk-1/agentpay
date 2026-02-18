"""
Blockchain service - handles Web3 interactions with smart contracts
"""
import json
from pathlib import Path
from web3 import Web3
from web3.contract import Contract
from eth_account import Account
from app.config import settings


class BlockchainService:
    """Service for interacting with smart contracts"""

    def __init__(self):
        """Initialize Web3 connection and contract"""
        self.w3 = Web3(Web3.HTTPProvider(settings.RPC_URL))
        self.chain_id = settings.CHAIN_ID
        self.contract_address = settings.CONTRACT_ADDRESS
        self.usdc_address = settings.USDC_ADDRESS

        # Load contract ABI
        self.contract_abi = self._load_contract_abi()
        self.usdc_abi = self._load_usdc_abi()

        # Initialize contracts
        if self.contract_address != "0x0000000000000000000000000000000000000000":
            self.vault_contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(self.contract_address),
                abi=self.contract_abi
            )
        else:
            self.vault_contract = None

        if self.usdc_address != "0x0000000000000000000000000000000000000000":
            self.usdc_contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(self.usdc_address),
                abi=self.usdc_abi
            )
        else:
            self.usdc_contract = None

    def _load_contract_abi(self) -> list:
        """Load AgentPaymentVault ABI from artifacts"""
        try:
            abi_path = Path(__file__).parent.parent.parent.parent / "agent-payment-vault" / "artifacts" / "contracts" / "AgentPaymentVault.sol" / "AgentPaymentVault.json"
            if abi_path.exists():
                with open(abi_path, 'r') as f:
                    contract_json = json.load(f)
                    return contract_json['abi']
        except Exception as e:
            print(f"Warning: Could not load contract ABI: {e}")

        # Return minimal ABI if file not found
        return [
            {
                "inputs": [{"internalType": "address", "name": "fund", "type": "address"}],
                "name": "getFundAccount",
                "outputs": [
                    {"internalType": "uint256", "name": "balance", "type": "uint256"},
                    {"internalType": "uint256", "name": "dailySpendingLimit", "type": "uint256"},
                    {"internalType": "uint256", "name": "perTransactionLimit", "type": "uint256"},
                    {"internalType": "uint256", "name": "todaySpent", "type": "uint256"},
                    {"internalType": "uint256", "name": "lastResetDay", "type": "uint256"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {"internalType": "address", "name": "fund", "type": "address"},
                    {"internalType": "address", "name": "bot", "type": "address"}
                ],
                "name": "isBotAuthorized",
                "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address", "name": "fund", "type": "address"}],
                "name": "getFundPurchases",
                "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "uint256", "name": "purchaseId", "type": "uint256"}],
                "name": "getPurchase",
                "outputs": [
                    {
                        "components": [
                            {"internalType": "address", "name": "fund", "type": "address"},
                            {"internalType": "address", "name": "bot", "type": "address"},
                            {"internalType": "address", "name": "recipient", "type": "address"},
                            {"internalType": "uint256", "name": "amount", "type": "uint256"},
                            {"internalType": "uint256", "name": "fee", "type": "uint256"},
                            {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
                            {"internalType": "string", "name": "metadata", "type": "string"}
                        ],
                        "internalType": "struct AgentPaymentVault.Purchase",
                        "name": "",
                        "type": "tuple"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            }
        ]

    def _load_usdc_abi(self) -> list:
        """Load USDC (ERC20) ABI"""
        return [
            {
                "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "decimals",
                "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
                "stateMutability": "view",
                "type": "function"
            }
        ]

    def is_connected(self) -> bool:
        """Check if Web3 is connected"""
        return self.w3.is_connected()

    def get_fund_balance(self, fund_address: str) -> dict:
        """
        Get fund account balance from contract
        Returns balance, limits, and spending info
        """
        if not self.vault_contract:
            return {"error": "Contract not initialized"}

        try:
            checksum_address = Web3.to_checksum_address(fund_address)
            result = self.vault_contract.functions.getFundAccount(checksum_address).call()

            return {
                "balance": result[0] / 1e6,  # Convert from 6 decimals to USDC
                "daily_spending_limit": result[1] / 1e6,
                "per_transaction_limit": result[2] / 1e6,
                "today_spent": result[3] / 1e6,
                "last_reset_day": result[4],
            }
        except Exception as e:
            return {"error": str(e)}

    def is_bot_authorized(self, fund_address: str, bot_address: str) -> bool:
        """Check if a bot is authorized for a fund"""
        if not self.vault_contract:
            return False

        try:
            checksum_fund = Web3.to_checksum_address(fund_address)
            checksum_bot = Web3.to_checksum_address(bot_address)
            return self.vault_contract.functions.isBotAuthorized(checksum_fund, checksum_bot).call()
        except Exception as e:
            print(f"Error checking bot authorization: {e}")
            return False

    def get_fund_purchases(self, fund_address: str) -> list:
        """Get all purchase IDs for a fund"""
        if not self.vault_contract:
            return []

        try:
            checksum_address = Web3.to_checksum_address(fund_address)
            purchase_ids = self.vault_contract.functions.getFundPurchases(checksum_address).call()
            return purchase_ids
        except Exception as e:
            print(f"Error getting fund purchases: {e}")
            return []

    def get_purchase_details(self, purchase_id: int) -> dict:
        """Get details of a specific purchase"""
        if not self.vault_contract:
            return {"error": "Contract not initialized"}

        try:
            result = self.vault_contract.functions.getPurchase(purchase_id).call()
            return {
                "fund": result[0],
                "bot": result[1],
                "recipient": result[2],
                "amount": result[3] / 1e6,  # Convert to USDC
                "fee": result[4] / 1e6,
                "timestamp": result[5],
                "metadata": result[6],
            }
        except Exception as e:
            return {"error": str(e)}

    def get_usdc_balance(self, address: str) -> float:
        """Get USDC balance for an address"""
        if not self.usdc_contract:
            return 0.0

        try:
            checksum_address = Web3.to_checksum_address(address)
            balance = self.usdc_contract.functions.balanceOf(checksum_address).call()
            return balance / 1e6  # Convert from 6 decimals
        except Exception as e:
            print(f"Error getting USDC balance: {e}")
            return 0.0

    def get_transaction_receipt(self, tx_hash: str) -> dict:
        """Get transaction receipt"""
        try:
            receipt = self.w3.eth.get_transaction_receipt(tx_hash)
            return {
                "status": receipt["status"],
                "block_number": receipt["blockNumber"],
                "gas_used": receipt["gasUsed"],
            }
        except Exception as e:
            return {"error": str(e)}


# Create global instance
blockchain_service = BlockchainService()
