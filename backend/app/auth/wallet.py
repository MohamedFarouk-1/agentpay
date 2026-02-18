"""
Wallet authentication - verify wallet signatures for authentication
"""
from eth_account.messages import encode_defunct
from web3 import Web3
from datetime import datetime, timedelta
from typing import Optional


class WalletAuth:
    """Wallet signature verification for authentication"""

    def __init__(self):
        self.w3 = Web3()

    def create_message(self, wallet_address: str, nonce: str) -> str:
        """
        Create a message for the user to sign
        This prevents replay attacks by including a nonce and timestamp
        """
        timestamp = datetime.utcnow().isoformat()
        return f"Sign this message to authenticate with Agent Payment Platform\n\nWallet: {wallet_address}\nNonce: {nonce}\nTimestamp: {timestamp}"

    def verify_signature(self, message: str, signature: str, expected_address: str) -> bool:
        """
        Verify that a signature matches the expected address
        Returns True if signature is valid, False otherwise
        """
        try:
            # Encode the message
            encoded_message = encode_defunct(text=message)

            # Recover the address from the signature
            recovered_address = self.w3.eth.account.recover_message(
                encoded_message,
                signature=signature
            )

            # Compare addresses (case-insensitive)
            return recovered_address.lower() == expected_address.lower()

        except Exception as e:
            print(f"Error verifying signature: {e}")
            return False

    def extract_wallet_from_signature(self, message: str, signature: str) -> Optional[str]:
        """
        Extract the wallet address from a signature
        Returns the address if valid, None otherwise
        """
        try:
            encoded_message = encode_defunct(text=message)
            recovered_address = self.w3.eth.account.recover_message(
                encoded_message,
                signature=signature
            )
            return recovered_address
        except Exception as e:
            print(f"Error extracting wallet: {e}")
            return None

    def is_valid_address(self, address: str) -> bool:
        """Check if an Ethereum address is valid"""
        try:
            return Web3.is_address(address)
        except Exception:
            return False

    def to_checksum_address(self, address: str) -> str:
        """Convert address to checksum format"""
        return Web3.to_checksum_address(address)


# Create global instance
wallet_auth = WalletAuth()
