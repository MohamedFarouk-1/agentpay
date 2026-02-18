// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title AgentPaymentVault
 * @notice A secure payment vault that allows crypto trading bots to automatically purchase services on behalf of funds
 * @dev Implements daily spending limits, per-transaction limits, and platform fees
 */
contract AgentPaymentVault is Ownable, ReentrancyGuard {
    /// @notice USDC token contract
    IERC20 public immutable usdc;

    /// @notice Platform fee in basis points (100 basis points = 1%)
    uint256 public platformFeeBps = 200; // 2%

    /// @notice Maximum platform fee allowed (10%)
    uint256 public constant MAX_PLATFORM_FEE_BPS = 1000;

    /// @notice Basis points divisor
    uint256 public constant BPS_DIVISOR = 10000;

    /// @notice Treasury address that receives platform fees
    address public treasury;

    /// @notice Represents a fund account in the vault
    struct FundAccount {
        uint256 balance;                    // Current USDC balance
        uint256 dailySpendingLimit;         // Maximum daily spending allowed
        uint256 perTransactionLimit;        // Maximum per-transaction spending
        uint256 todaySpent;                 // Amount spent today
        uint256 lastResetDay;               // Last day the daily limit was reset
        mapping(address => bool) authorizedBots; // Mapping of authorized bot addresses
    }

    /// @notice Represents a purchase record
    struct Purchase {
        address fund;
        address bot;
        address recipient;
        uint256 amount;
        uint256 fee;
        uint256 timestamp;
        string metadata;
    }

    /// @notice Mapping from fund address to their account
    mapping(address => FundAccount) private fundAccounts;

    /// @notice Array of all purchases for tracking history
    Purchase[] public purchases;

    /// @notice Mapping from fund address to their purchase indices
    mapping(address => uint256[]) private fundPurchaseIndices;

    // Events
    event Deposited(address indexed fund, uint256 amount, uint256 newBalance);
    event Withdrawn(address indexed fund, uint256 amount, uint256 newBalance);
    event BotAuthorized(address indexed fund, address indexed bot);
    event BotRevoked(address indexed fund, address indexed bot);
    event PurchaseExecuted(
        address indexed fund,
        address indexed bot,
        address indexed recipient,
        uint256 amount,
        uint256 fee,
        uint256 purchaseId,
        string metadata
    );
    event LimitsUpdated(address indexed fund, uint256 dailyLimit, uint256 perTransactionLimit);
    event PlatformFeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    /**
     * @notice Constructor to initialize the vault
     * @param _usdc Address of the USDC token contract
     * @param _treasury Address that will receive platform fees
     */
    constructor(address _usdc, address _treasury) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_treasury != address(0), "Invalid treasury address");

        usdc = IERC20(_usdc);
        treasury = _treasury;
    }

    /**
     * @notice Deposit USDC into the vault
     * @param amount Amount of USDC to deposit (in USDC's decimals, typically 6)
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        FundAccount storage account = fundAccounts[msg.sender];

        // Transfer USDC from sender to this contract
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        account.balance += amount;

        emit Deposited(msg.sender, amount, account.balance);
    }

    /**
     * @notice Withdraw USDC from the vault
     * @param amount Amount of USDC to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        FundAccount storage account = fundAccounts[msg.sender];
        require(amount > 0, "Amount must be greater than 0");
        require(account.balance >= amount, "Insufficient balance");

        account.balance -= amount;

        // Transfer USDC to the fund
        require(usdc.transfer(msg.sender, amount), "Transfer failed");

        emit Withdrawn(msg.sender, amount, account.balance);
    }

    /**
     * @notice Authorize a bot to make purchases on behalf of the fund
     * @param bot Address of the bot to authorize
     */
    function authorizeBot(address bot) external {
        require(bot != address(0), "Invalid bot address");

        FundAccount storage account = fundAccounts[msg.sender];
        require(!account.authorizedBots[bot], "Bot already authorized");

        account.authorizedBots[bot] = true;

        emit BotAuthorized(msg.sender, bot);
    }

    /**
     * @notice Revoke a bot's authorization
     * @param bot Address of the bot to revoke
     */
    function revokeBot(address bot) external {
        FundAccount storage account = fundAccounts[msg.sender];
        require(account.authorizedBots[bot], "Bot not authorized");

        account.authorizedBots[bot] = false;

        emit BotRevoked(msg.sender, bot);
    }

    /**
     * @notice Set spending limits for the fund
     * @param dailyLimit Maximum amount that can be spent per day
     * @param perTransactionLimit Maximum amount per transaction
     */
    function setLimits(uint256 dailyLimit, uint256 perTransactionLimit) external {
        require(perTransactionLimit <= dailyLimit || dailyLimit == 0, "Per-tx limit exceeds daily limit");

        FundAccount storage account = fundAccounts[msg.sender];
        account.dailySpendingLimit = dailyLimit;
        account.perTransactionLimit = perTransactionLimit;

        emit LimitsUpdated(msg.sender, dailyLimit, perTransactionLimit);
    }

    /**
     * @notice Execute a purchase on behalf of a fund
     * @param fund Address of the fund account
     * @param recipient Address to receive the payment
     * @param amount Amount to pay (before fees)
     * @param metadata Optional metadata about the purchase
     */
    function purchaseOnBehalf(
        address fund,
        address recipient,
        uint256 amount,
        string calldata metadata
    ) external nonReentrant returns (uint256 purchaseId) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");

        FundAccount storage account = fundAccounts[fund];

        // Check bot authorization
        require(account.authorizedBots[msg.sender], "Bot not authorized");

        // Reset daily spending if new day
        _resetDailyLimitIfNeeded(account);

        // Check per-transaction limit
        if (account.perTransactionLimit > 0) {
            require(amount <= account.perTransactionLimit, "Exceeds per-transaction limit");
        }

        // Check daily spending limit
        if (account.dailySpendingLimit > 0) {
            require(account.todaySpent + amount <= account.dailySpendingLimit, "Exceeds daily limit");
        }

        // Calculate platform fee
        uint256 fee = (amount * platformFeeBps) / BPS_DIVISOR;
        uint256 totalAmount = amount + fee;

        // Check balance
        require(account.balance >= totalAmount, "Insufficient balance");

        // Update balances
        account.balance -= totalAmount;
        account.todaySpent += amount;

        // Transfer funds
        require(usdc.transfer(recipient, amount), "Transfer to recipient failed");
        require(usdc.transfer(treasury, fee), "Fee transfer failed");

        // Record purchase
        purchaseId = purchases.length;
        purchases.push(Purchase({
            fund: fund,
            bot: msg.sender,
            recipient: recipient,
            amount: amount,
            fee: fee,
            timestamp: block.timestamp,
            metadata: metadata
        }));

        fundPurchaseIndices[fund].push(purchaseId);

        emit PurchaseExecuted(fund, msg.sender, recipient, amount, fee, purchaseId, metadata);
    }

    /**
     * @notice Update the platform fee (only owner)
     * @param newFeeBps New fee in basis points
     */
    function setPlatformFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_PLATFORM_FEE_BPS, "Fee too high");

        uint256 oldFee = platformFeeBps;
        platformFeeBps = newFeeBps;

        emit PlatformFeeUpdated(oldFee, newFeeBps);
    }

    /**
     * @notice Update the treasury address (only owner)
     * @param newTreasury New treasury address
     */
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");

        address oldTreasury = treasury;
        treasury = newTreasury;

        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @notice Get fund account details
     * @param fund Address of the fund
     * @return balance Current balance
     * @return dailySpendingLimit Daily spending limit
     * @return perTransactionLimit Per-transaction limit
     * @return todaySpent Amount spent today
     * @return lastResetDay Last reset day
     */
    function getFundAccount(address fund) external view returns (
        uint256 balance,
        uint256 dailySpendingLimit,
        uint256 perTransactionLimit,
        uint256 todaySpent,
        uint256 lastResetDay
    ) {
        FundAccount storage account = fundAccounts[fund];
        return (
            account.balance,
            account.dailySpendingLimit,
            account.perTransactionLimit,
            account.todaySpent,
            account.lastResetDay
        );
    }

    /**
     * @notice Check if a bot is authorized for a fund
     * @param fund Address of the fund
     * @param bot Address of the bot
     * @return Whether the bot is authorized
     */
    function isBotAuthorized(address fund, address bot) external view returns (bool) {
        return fundAccounts[fund].authorizedBots[bot];
    }

    /**
     * @notice Get purchase history for a fund
     * @param fund Address of the fund
     * @return Array of purchase IDs
     */
    function getFundPurchases(address fund) external view returns (uint256[] memory) {
        return fundPurchaseIndices[fund];
    }

    /**
     * @notice Get total number of purchases
     * @return Total purchase count
     */
    function getTotalPurchases() external view returns (uint256) {
        return purchases.length;
    }

    /**
     * @notice Get purchase details by ID
     * @param purchaseId ID of the purchase
     * @return Purchase details
     */
    function getPurchase(uint256 purchaseId) external view returns (Purchase memory) {
        require(purchaseId < purchases.length, "Invalid purchase ID");
        return purchases[purchaseId];
    }

    /**
     * @notice Reset daily spending limit if a new day has started
     * @param account The fund account to check
     */
    function _resetDailyLimitIfNeeded(FundAccount storage account) private {
        uint256 currentDay = block.timestamp / 1 days;

        if (currentDay > account.lastResetDay) {
            account.todaySpent = 0;
            account.lastResetDay = currentDay;
        }
    }

    /**
     * @notice Get current day number (for testing daily reset logic)
     * @return Current day since epoch
     */
    function getCurrentDay() external view returns (uint256) {
        return block.timestamp / 1 days;
    }
}
