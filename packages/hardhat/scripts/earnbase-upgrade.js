
const { ethers, upgrades } = require("hardhat");

async function main() {
  const NewEarnBase = await ethers.getContractFactory("EarnBase");
  const earnbase = await upgrades.upgradeProxy("0x1D8e969F4b2faA645695749d93EdBa3B5bB8b842", NewEarnBase);
  console.log("EarnBase upgraded");
}

main();


// npx hardhat run scripts/earnbase-upgrade.js --network celo
// Uno => proxy - 0x1D8e969F4b2faA645695749d93EdBa3B5bB8b842 , implementation - 0x398ba8AAc1248bc4f5F3848d27770Dd514F8977D