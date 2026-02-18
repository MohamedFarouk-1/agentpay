const hre = require("hardhat");

// USDC addresses for different networks
const USDC_ADDRESSES = {
  // Mainnets
  "base": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "arbitrum": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",

  // Testnets
  "base-sepolia": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  "arbitrum-sepolia": "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",

  // Local development - will deploy mock
  "localhost": null,
  "hardhat": null,
};

async function main() {
  console.log("🚀 Starting deployment...\n");

  // Get network name
  const network = hre.network.name;
  console.log(`Network: ${network}`);

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${hre.ethers.formatEther(balance)} ETH\n`);

  let usdcAddress = USDC_ADDRESSES[network];
  let mockUSDC = null;

  // Deploy MockUSDC if on local network or USDC not found
  if (!usdcAddress) {
    console.log("📝 Deploying MockUSDC...");
    const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();
    usdcAddress = await mockUSDC.getAddress();
    console.log(`✅ MockUSDC deployed to: ${usdcAddress}\n`);

    // Mint some tokens for testing
    console.log("💰 Minting 1,000,000 USDC for deployer...");
    await mockUSDC.mintDollars(deployer.address, 1000000);
    console.log("✅ Tokens minted\n");
  } else {
    console.log(`Using existing USDC at: ${usdcAddress}\n`);
  }

  // Get treasury address from environment or use deployer
  const treasury = process.env.TREASURY_ADDRESS || deployer.address;
  console.log(`Treasury address: ${treasury}\n`);

  // Deploy AgentPaymentVault
  console.log("📝 Deploying AgentPaymentVault...");
  const AgentPaymentVault = await hre.ethers.getContractFactory("AgentPaymentVault");
  const vault = await AgentPaymentVault.deploy(usdcAddress, treasury);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log(`✅ AgentPaymentVault deployed to: ${vaultAddress}\n`);

  // Print deployment summary
  console.log("=" .repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=" .repeat(60));
  console.log(`Network:               ${network}`);
  console.log(`AgentPaymentVault:     ${vaultAddress}`);
  console.log(`USDC Address:          ${usdcAddress}`);
  console.log(`Treasury:              ${treasury}`);
  console.log(`Platform Fee:          2% (200 bps)`);
  if (mockUSDC) {
    console.log(`MockUSDC (Test Only):  ${usdcAddress}`);
  }
  console.log("=" .repeat(60));
  console.log();

  // Verify contracts on block explorer if not local network
  if (network !== "hardhat" && network !== "localhost") {
    console.log("⏳ Waiting 30 seconds before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    try {
      console.log("\n🔍 Verifying contracts on block explorer...");

      // Verify AgentPaymentVault
      await hre.run("verify:verify", {
        address: vaultAddress,
        constructorArguments: [usdcAddress, treasury],
      });
      console.log("✅ AgentPaymentVault verified");

      // Verify MockUSDC if deployed
      if (mockUSDC) {
        await hre.run("verify:verify", {
          address: usdcAddress,
          constructorArguments: [],
        });
        console.log("✅ MockUSDC verified");
      }
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
      console.log("You can verify manually later using:");
      console.log(`npx hardhat verify --network ${network} ${vaultAddress} ${usdcAddress} ${treasury}`);
    }
  }

  // Save deployment info
  const deploymentInfo = {
    network,
    timestamp: new Date().toISOString(),
    contracts: {
      AgentPaymentVault: vaultAddress,
      USDC: usdcAddress,
    },
    config: {
      treasury,
      platformFeeBps: 200,
    },
  };

  const fs = require("fs");
  const deploymentsDir = "./deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    `${deploymentsDir}/${network}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`\n💾 Deployment info saved to ${deploymentsDir}/${network}.json`);

  console.log("\n✨ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
