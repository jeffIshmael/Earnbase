const { ethers, upgrades } = require("hardhat");

async function main() {
  const EarnBase = await ethers.getContractFactory("EarnBase");
  const earnbase = await upgrades.deployProxy(EarnBase);
  await earnbase.waitForDeployment();
  console.log("EarnBase contract deployed to:", await earnbase.getAddress());
}

// Error handling
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
