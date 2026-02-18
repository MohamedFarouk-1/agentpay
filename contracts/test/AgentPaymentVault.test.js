const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("AgentPaymentVault", function () {
  let vault;
  let usdc;
  let owner;
  let fund1;
  let fund2;
  let bot1;
  let bot2;
  let recipient;
  let treasury;

  const USDC_DECIMALS = 6;
  const dollars = (amount) => ethers.parseUnits(amount.toString(), USDC_DECIMALS);

  beforeEach(async function () {
    // Get signers
    [owner, fund1, fund2, bot1, bot2, recipient, treasury] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();

    // Deploy AgentPaymentVault
    const AgentPaymentVault = await ethers.getContractFactory("AgentPaymentVault");
    vault = await AgentPaymentVault.deploy(await usdc.getAddress(), treasury.address);

    // Mint USDC to test accounts
    await usdc.mintDollars(fund1.address, 10000); // $10,000
    await usdc.mintDollars(fund2.address, 5000);  // $5,000
  });

  describe("Deployment", function () {
    it("Should set the correct USDC address", async function () {
      expect(await vault.usdc()).to.equal(await usdc.getAddress());
    });

    it("Should set the correct treasury address", async function () {
      expect(await vault.treasury()).to.equal(treasury.address);
    });

    it("Should set the default platform fee to 2%", async function () {
      expect(await vault.platformFeeBps()).to.equal(200);
    });

    it("Should set the owner correctly", async function () {
      expect(await vault.owner()).to.equal(owner.address);
    });

    it("Should reject zero USDC address", async function () {
      const AgentPaymentVault = await ethers.getContractFactory("AgentPaymentVault");
      await expect(
        AgentPaymentVault.deploy(ethers.ZeroAddress, treasury.address)
      ).to.be.revertedWith("Invalid USDC address");
    });

    it("Should reject zero treasury address", async function () {
      const AgentPaymentVault = await ethers.getContractFactory("AgentPaymentVault");
      await expect(
        AgentPaymentVault.deploy(await usdc.getAddress(), ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid treasury address");
    });
  });

  describe("Deposits", function () {
    it("Should allow fund to deposit USDC", async function () {
      const depositAmount = dollars(1000);

      // Approve vault to spend USDC
      await usdc.connect(fund1).approve(await vault.getAddress(), depositAmount);

      // Deposit
      await expect(vault.connect(fund1).deposit(depositAmount))
        .to.emit(vault, "Deposited")
        .withArgs(fund1.address, depositAmount, depositAmount);

      // Check balance
      const account = await vault.getFundAccount(fund1.address);
      expect(account.balance).to.equal(depositAmount);
    });

    it("Should reject zero deposit amount", async function () {
      await expect(vault.connect(fund1).deposit(0))
        .to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should reject deposit without approval", async function () {
      const depositAmount = dollars(1000);
      await expect(vault.connect(fund1).deposit(depositAmount))
        .to.be.reverted;
    });

    it("Should allow multiple deposits", async function () {
      const amount1 = dollars(1000);
      const amount2 = dollars(500);

      await usdc.connect(fund1).approve(await vault.getAddress(), amount1 + amount2);

      await vault.connect(fund1).deposit(amount1);
      await vault.connect(fund1).deposit(amount2);

      const account = await vault.getFundAccount(fund1.address);
      expect(account.balance).to.equal(amount1 + amount2);
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      // Deposit some funds first
      const depositAmount = dollars(1000);
      await usdc.connect(fund1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(fund1).deposit(depositAmount);
    });

    it("Should allow fund to withdraw USDC", async function () {
      const withdrawAmount = dollars(500);

      const balanceBefore = await usdc.balanceOf(fund1.address);

      await expect(vault.connect(fund1).withdraw(withdrawAmount))
        .to.emit(vault, "Withdrawn")
        .withArgs(fund1.address, withdrawAmount, dollars(500));

      const balanceAfter = await usdc.balanceOf(fund1.address);
      expect(balanceAfter - balanceBefore).to.equal(withdrawAmount);

      const account = await vault.getFundAccount(fund1.address);
      expect(account.balance).to.equal(dollars(500));
    });

    it("Should reject zero withdrawal amount", async function () {
      await expect(vault.connect(fund1).withdraw(0))
        .to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should reject withdrawal exceeding balance", async function () {
      await expect(vault.connect(fund1).withdraw(dollars(2000)))
        .to.be.revertedWith("Insufficient balance");
    });

    it("Should allow full withdrawal", async function () {
      await vault.connect(fund1).withdraw(dollars(1000));

      const account = await vault.getFundAccount(fund1.address);
      expect(account.balance).to.equal(0);
    });
  });

  describe("Bot Authorization", function () {
    it("Should allow fund to authorize a bot", async function () {
      await expect(vault.connect(fund1).authorizeBot(bot1.address))
        .to.emit(vault, "BotAuthorized")
        .withArgs(fund1.address, bot1.address);

      expect(await vault.isBotAuthorized(fund1.address, bot1.address)).to.be.true;
    });

    it("Should allow fund to authorize multiple bots", async function () {
      await vault.connect(fund1).authorizeBot(bot1.address);
      await vault.connect(fund1).authorizeBot(bot2.address);

      expect(await vault.isBotAuthorized(fund1.address, bot1.address)).to.be.true;
      expect(await vault.isBotAuthorized(fund1.address, bot2.address)).to.be.true;
    });

    it("Should reject authorizing zero address", async function () {
      await expect(vault.connect(fund1).authorizeBot(ethers.ZeroAddress))
        .to.be.revertedWith("Invalid bot address");
    });

    it("Should reject authorizing already authorized bot", async function () {
      await vault.connect(fund1).authorizeBot(bot1.address);
      await expect(vault.connect(fund1).authorizeBot(bot1.address))
        .to.be.revertedWith("Bot already authorized");
    });

    it("Should allow fund to revoke bot authorization", async function () {
      await vault.connect(fund1).authorizeBot(bot1.address);

      await expect(vault.connect(fund1).revokeBot(bot1.address))
        .to.emit(vault, "BotRevoked")
        .withArgs(fund1.address, bot1.address);

      expect(await vault.isBotAuthorized(fund1.address, bot1.address)).to.be.false;
    });

    it("Should reject revoking non-authorized bot", async function () {
      await expect(vault.connect(fund1).revokeBot(bot1.address))
        .to.be.revertedWith("Bot not authorized");
    });

    it("Should keep bots isolated between funds", async function () {
      await vault.connect(fund1).authorizeBot(bot1.address);

      expect(await vault.isBotAuthorized(fund1.address, bot1.address)).to.be.true;
      expect(await vault.isBotAuthorized(fund2.address, bot1.address)).to.be.false;
    });
  });

  describe("Spending Limits", function () {
    it("Should allow fund to set spending limits", async function () {
      const dailyLimit = dollars(1000);
      const perTxLimit = dollars(100);

      await expect(vault.connect(fund1).setLimits(dailyLimit, perTxLimit))
        .to.emit(vault, "LimitsUpdated")
        .withArgs(fund1.address, dailyLimit, perTxLimit);

      const account = await vault.getFundAccount(fund1.address);
      expect(account.dailySpendingLimit).to.equal(dailyLimit);
      expect(account.perTransactionLimit).to.equal(perTxLimit);
    });

    it("Should allow zero limits (unlimited)", async function () {
      await vault.connect(fund1).setLimits(0, 0);

      const account = await vault.getFundAccount(fund1.address);
      expect(account.dailySpendingLimit).to.equal(0);
      expect(account.perTransactionLimit).to.equal(0);
    });

    it("Should reject per-tx limit exceeding daily limit", async function () {
      await expect(vault.connect(fund1).setLimits(dollars(100), dollars(200)))
        .to.be.revertedWith("Per-tx limit exceeds daily limit");
    });

    it("Should allow per-tx limit equal to daily limit", async function () {
      await vault.connect(fund1).setLimits(dollars(100), dollars(100));

      const account = await vault.getFundAccount(fund1.address);
      expect(account.dailySpendingLimit).to.equal(dollars(100));
      expect(account.perTransactionLimit).to.equal(dollars(100));
    });
  });

  describe("Purchase Execution", function () {
    beforeEach(async function () {
      // Setup: deposit funds and authorize bot
      const depositAmount = dollars(1000);
      await usdc.connect(fund1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(fund1).deposit(depositAmount);
      await vault.connect(fund1).authorizeBot(bot1.address);
    });

    it("Should allow authorized bot to make purchase", async function () {
      const purchaseAmount = dollars(100);
      const expectedFee = dollars(2); // 2% of 100
      const totalCost = purchaseAmount + expectedFee;

      const recipientBalanceBefore = await usdc.balanceOf(recipient.address);
      const treasuryBalanceBefore = await usdc.balanceOf(treasury.address);

      await expect(
        vault.connect(bot1).purchaseOnBehalf(
          fund1.address,
          recipient.address,
          purchaseAmount,
          "Test purchase"
        )
      )
        .to.emit(vault, "PurchaseExecuted")
        .withArgs(
          fund1.address,
          bot1.address,
          recipient.address,
          purchaseAmount,
          expectedFee,
          0,
          "Test purchase"
        );

      // Check recipient received payment
      const recipientBalanceAfter = await usdc.balanceOf(recipient.address);
      expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(purchaseAmount);

      // Check treasury received fee
      const treasuryBalanceAfter = await usdc.balanceOf(treasury.address);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(expectedFee);

      // Check fund balance decreased
      const account = await vault.getFundAccount(fund1.address);
      expect(account.balance).to.equal(dollars(1000) - totalCost);
    });

    it("Should reject purchase from unauthorized bot", async function () {
      await expect(
        vault.connect(bot2).purchaseOnBehalf(
          fund1.address,
          recipient.address,
          dollars(100),
          "Test"
        )
      ).to.be.revertedWith("Bot not authorized");
    });

    it("Should reject purchase with zero amount", async function () {
      await expect(
        vault.connect(bot1).purchaseOnBehalf(
          fund1.address,
          recipient.address,
          0,
          "Test"
        )
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should reject purchase to zero address", async function () {
      await expect(
        vault.connect(bot1).purchaseOnBehalf(
          fund1.address,
          ethers.ZeroAddress,
          dollars(100),
          "Test"
        )
      ).to.be.revertedWith("Invalid recipient");
    });

    it("Should reject purchase exceeding balance", async function () {
      await expect(
        vault.connect(bot1).purchaseOnBehalf(
          fund1.address,
          recipient.address,
          dollars(2000),
          "Test"
        )
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should track purchase history", async function () {
      await vault.connect(bot1).purchaseOnBehalf(
        fund1.address,
        recipient.address,
        dollars(100),
        "Purchase 1"
      );

      await vault.connect(bot1).purchaseOnBehalf(
        fund1.address,
        recipient.address,
        dollars(50),
        "Purchase 2"
      );

      const purchases = await vault.getFundPurchases(fund1.address);
      expect(purchases.length).to.equal(2);

      const purchase1 = await vault.getPurchase(0);
      expect(purchase1.fund).to.equal(fund1.address);
      expect(purchase1.bot).to.equal(bot1.address);
      expect(purchase1.amount).to.equal(dollars(100));
      expect(purchase1.metadata).to.equal("Purchase 1");

      const purchase2 = await vault.getPurchase(1);
      expect(purchase2.amount).to.equal(dollars(50));
      expect(purchase2.metadata).to.equal("Purchase 2");

      expect(await vault.getTotalPurchases()).to.equal(2);
    });
  });

  describe("Per-Transaction Limits", function () {
    beforeEach(async function () {
      const depositAmount = dollars(1000);
      await usdc.connect(fund1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(fund1).deposit(depositAmount);
      await vault.connect(fund1).authorizeBot(bot1.address);
    });

    it("Should enforce per-transaction limit", async function () {
      await vault.connect(fund1).setLimits(dollars(500), dollars(100));

      await expect(
        vault.connect(bot1).purchaseOnBehalf(
          fund1.address,
          recipient.address,
          dollars(150),
          "Test"
        )
      ).to.be.revertedWith("Exceeds per-transaction limit");
    });

    it("Should allow purchase at exact per-transaction limit", async function () {
      await vault.connect(fund1).setLimits(dollars(500), dollars(100));

      await vault.connect(bot1).purchaseOnBehalf(
        fund1.address,
        recipient.address,
        dollars(100),
        "Test"
      );

      const account = await vault.getFundAccount(fund1.address);
      expect(account.todaySpent).to.equal(dollars(100));
    });

    it("Should allow multiple purchases under per-transaction limit", async function () {
      await vault.connect(fund1).setLimits(dollars(500), dollars(100));

      await vault.connect(bot1).purchaseOnBehalf(
        fund1.address,
        recipient.address,
        dollars(100),
        "Purchase 1"
      );

      await vault.connect(bot1).purchaseOnBehalf(
        fund1.address,
        recipient.address,
        dollars(100),
        "Purchase 2"
      );

      const account = await vault.getFundAccount(fund1.address);
      expect(account.todaySpent).to.equal(dollars(200));
    });
  });

  describe("Daily Spending Limits", function () {
    beforeEach(async function () {
      const depositAmount = dollars(1000);
      await usdc.connect(fund1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(fund1).deposit(depositAmount);
      await vault.connect(fund1).authorizeBot(bot1.address);
    });

    it("Should enforce daily spending limit", async function () {
      await vault.connect(fund1).setLimits(dollars(200), dollars(150));

      await vault.connect(bot1).purchaseOnBehalf(
        fund1.address,
        recipient.address,
        dollars(150),
        "Purchase 1"
      );

      // Second purchase should fail (150 + 100 > 200)
      await expect(
        vault.connect(bot1).purchaseOnBehalf(
          fund1.address,
          recipient.address,
          dollars(100),
          "Purchase 2"
        )
      ).to.be.revertedWith("Exceeds daily limit");
    });

    it("Should reset daily spending limit after a day", async function () {
      await vault.connect(fund1).setLimits(dollars(200), dollars(150));

      // First purchase
      await vault.connect(bot1).purchaseOnBehalf(
        fund1.address,
        recipient.address,
        dollars(150),
        "Day 1"
      );

      // Fast forward 1 day
      await time.increase(24 * 60 * 60);

      // Should succeed after reset
      await vault.connect(bot1).purchaseOnBehalf(
        fund1.address,
        recipient.address,
        dollars(150),
        "Day 2"
      );

      const account = await vault.getFundAccount(fund1.address);
      expect(account.todaySpent).to.equal(dollars(150));
    });

    it("Should track daily spending correctly", async function () {
      await vault.connect(fund1).setLimits(dollars(500), dollars(100));

      await vault.connect(bot1).purchaseOnBehalf(
        fund1.address,
        recipient.address,
        dollars(100),
        "Purchase 1"
      );

      await vault.connect(bot1).purchaseOnBehalf(
        fund1.address,
        recipient.address,
        dollars(100),
        "Purchase 2"
      );

      const account = await vault.getFundAccount(fund1.address);
      expect(account.todaySpent).to.equal(dollars(200));
    });

    it("Should not enforce limits when set to zero", async function () {
      await vault.connect(fund1).setLimits(0, 0);

      // Should allow large purchase
      await vault.connect(bot1).purchaseOnBehalf(
        fund1.address,
        recipient.address,
        dollars(900),
        "Large purchase"
      );

      const account = await vault.getFundAccount(fund1.address);
      expect(account.todaySpent).to.equal(dollars(900));
    });
  });

  describe("Platform Fee Management", function () {
    it("Should allow owner to update platform fee", async function () {
      await expect(vault.setPlatformFee(300))
        .to.emit(vault, "PlatformFeeUpdated")
        .withArgs(200, 300);

      expect(await vault.platformFeeBps()).to.equal(300);
    });

    it("Should reject fee exceeding maximum", async function () {
      await expect(vault.setPlatformFee(1100))
        .to.be.revertedWith("Fee too high");
    });

    it("Should reject non-owner setting fee", async function () {
      await expect(vault.connect(fund1).setPlatformFee(300))
        .to.be.reverted;
    });

    it("Should calculate fees correctly with updated rate", async function () {
      // Setup
      const depositAmount = dollars(1000);
      await usdc.connect(fund1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(fund1).deposit(depositAmount);
      await vault.connect(fund1).authorizeBot(bot1.address);

      // Update fee to 5%
      await vault.setPlatformFee(500);

      const purchaseAmount = dollars(100);
      const expectedFee = dollars(5); // 5% of 100

      const treasuryBalanceBefore = await usdc.balanceOf(treasury.address);

      await vault.connect(bot1).purchaseOnBehalf(
        fund1.address,
        recipient.address,
        purchaseAmount,
        "Test"
      );

      const treasuryBalanceAfter = await usdc.balanceOf(treasury.address);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(expectedFee);
    });
  });

  describe("Treasury Management", function () {
    it("Should allow owner to update treasury address", async function () {
      const newTreasury = fund2.address;

      await expect(vault.setTreasury(newTreasury))
        .to.emit(vault, "TreasuryUpdated")
        .withArgs(treasury.address, newTreasury);

      expect(await vault.treasury()).to.equal(newTreasury);
    });

    it("Should reject zero address as treasury", async function () {
      await expect(vault.setTreasury(ethers.ZeroAddress))
        .to.be.revertedWith("Invalid treasury address");
    });

    it("Should reject non-owner updating treasury", async function () {
      await expect(vault.connect(fund1).setTreasury(fund2.address))
        .to.be.reverted;
    });

    it("Should send fees to new treasury after update", async function () {
      // Setup
      const depositAmount = dollars(1000);
      await usdc.connect(fund1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(fund1).deposit(depositAmount);
      await vault.connect(fund1).authorizeBot(bot1.address);

      // Update treasury
      const newTreasury = fund2.address;
      await vault.setTreasury(newTreasury);

      const balanceBefore = await usdc.balanceOf(newTreasury);

      await vault.connect(bot1).purchaseOnBehalf(
        fund1.address,
        recipient.address,
        dollars(100),
        "Test"
      );

      const balanceAfter = await usdc.balanceOf(newTreasury);
      expect(balanceAfter - balanceBefore).to.equal(dollars(2)); // 2% fee
    });
  });

  describe("View Functions", function () {
    it("Should return correct fund account details", async function () {
      const depositAmount = dollars(1000);
      await usdc.connect(fund1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(fund1).deposit(depositAmount);
      await vault.connect(fund1).setLimits(dollars(500), dollars(100));

      const account = await vault.getFundAccount(fund1.address);

      expect(account.balance).to.equal(depositAmount);
      expect(account.dailySpendingLimit).to.equal(dollars(500));
      expect(account.perTransactionLimit).to.equal(dollars(100));
      expect(account.todaySpent).to.equal(0);
    });

    it("Should return correct bot authorization status", async function () {
      expect(await vault.isBotAuthorized(fund1.address, bot1.address)).to.be.false;

      await vault.connect(fund1).authorizeBot(bot1.address);

      expect(await vault.isBotAuthorized(fund1.address, bot1.address)).to.be.true;
    });

    it("Should reject invalid purchase ID", async function () {
      await expect(vault.getPurchase(999))
        .to.be.revertedWith("Invalid purchase ID");
    });

    it("Should return empty purchase array for new fund", async function () {
      const purchases = await vault.getFundPurchases(fund1.address);
      expect(purchases.length).to.equal(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle very small amounts correctly", async function () {
      // Deposit 1 USDC cent (0.01 USDC)
      const smallAmount = ethers.parseUnits("0.01", USDC_DECIMALS);
      await usdc.connect(fund1).approve(await vault.getAddress(), smallAmount);
      await vault.connect(fund1).deposit(smallAmount);

      const account = await vault.getFundAccount(fund1.address);
      expect(account.balance).to.equal(smallAmount);
    });

    it("Should handle purchases from multiple funds simultaneously", async function () {
      // Setup both funds
      const amount1 = dollars(1000);
      const amount2 = dollars(500);

      await usdc.connect(fund1).approve(await vault.getAddress(), amount1);
      await vault.connect(fund1).deposit(amount1);
      await vault.connect(fund1).authorizeBot(bot1.address);

      await usdc.connect(fund2).approve(await vault.getAddress(), amount2);
      await vault.connect(fund2).deposit(amount2);
      await vault.connect(fund2).authorizeBot(bot1.address);

      // Make purchases
      await vault.connect(bot1).purchaseOnBehalf(
        fund1.address,
        recipient.address,
        dollars(100),
        "Fund 1"
      );

      await vault.connect(bot1).purchaseOnBehalf(
        fund2.address,
        recipient.address,
        dollars(50),
        "Fund 2"
      );

      // Check balances are independent
      const account1 = await vault.getFundAccount(fund1.address);
      const account2 = await vault.getFundAccount(fund2.address);

      expect(account1.todaySpent).to.equal(dollars(100));
      expect(account2.todaySpent).to.equal(dollars(50));
    });

    it("Should handle fee calculation with no rounding errors", async function () {
      const depositAmount = dollars(1000);
      await usdc.connect(fund1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(fund1).deposit(depositAmount);
      await vault.connect(fund1).authorizeBot(bot1.address);

      // Purchase amount that would cause rounding if not handled properly
      const purchaseAmount = ethers.parseUnits("33.33", USDC_DECIMALS);
      const expectedFee = (purchaseAmount * 200n) / 10000n; // 2%

      const treasuryBalanceBefore = await usdc.balanceOf(treasury.address);

      await vault.connect(bot1).purchaseOnBehalf(
        fund1.address,
        recipient.address,
        purchaseAmount,
        "Test"
      );

      const treasuryBalanceAfter = await usdc.balanceOf(treasury.address);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(expectedFee);
    });
  });
});
