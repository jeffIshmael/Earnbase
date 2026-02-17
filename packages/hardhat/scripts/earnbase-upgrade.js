
const { ethers, upgrades } = require("hardhat");

async function main() {
  const NewEarnBase = await ethers.getContractFactory("EarnBaseV2");
  const earnbase = await upgrades.upgradeProxy("0xaA558aC98127c78f2125c8DE83eA87e4ac843AFb", NewEarnBase);
  console.log("EarnBase upgraded");
}

main();


// npx hardhat run scripts/earnbase-upgrade.js --network celo
// Uno => proxy - 0xaA558aC98127c78f2125c8DE83eA87e4ac843AFb , implementation - 0x398ba8AAc1248bc4f5F3848d27770Dd514F8977D