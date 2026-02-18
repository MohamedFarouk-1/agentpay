// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @notice Mock USDC token for testing purposes
 * @dev Mimics the real USDC token with 6 decimals
 */
contract MockUSDC is ERC20, Ownable {
    uint8 private constant DECIMALS = 6;

    /**
     * @notice Constructor to initialize the mock USDC token
     */
    constructor() ERC20("Mock USDC", "USDC") {}

    /**
     * @notice Returns the number of decimals (6, like real USDC)
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @notice Mint tokens to an address
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint (in token units with decimals)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Helper function to mint a specific dollar amount
     * @dev Converts dollar amount to token units (multiplies by 10^6)
     * @param to Address to mint tokens to
     * @param dollarAmount Amount in dollars (e.g., 1000 for $1000)
     */
    function mintDollars(address to, uint256 dollarAmount) external onlyOwner {
        uint256 amount = dollarAmount * (10 ** DECIMALS);
        _mint(to, amount);
    }

    /**
     * @notice Public mint function for testing (allows anyone to mint)
     * @dev Only use in test environments!
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function publicMint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Public mint function for dollar amounts (allows anyone to mint)
     * @dev Only use in test environments!
     * @param to Address to mint tokens to
     * @param dollarAmount Amount in dollars
     */
    function publicMintDollars(address to, uint256 dollarAmount) external {
        uint256 amount = dollarAmount * (10 ** DECIMALS);
        _mint(to, amount);
    }
}
