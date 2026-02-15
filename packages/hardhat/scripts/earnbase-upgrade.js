
const { ethers, upgrades } = require("hardhat");

async function main() {
  const NewEarnBase = await ethers.getContractFactory("EarnBase");
  const earnbase = await upgrades.upgradeProxy("0xa433CEf7aB369056A9BF105Ad908D13DF5Ad8cA5", NewEarnBase);
  console.log("EarnBase upgraded");
}

main();


// npx hardhat run scripts/earnbase-upgrade.js --network celo
// Uno => proxy - 0xa433CEf7aB369056A9BF105Ad908D13DF5Ad8cA5 , implementation - 0x03bBAC9cB2cd6cFD3E965377E85af9F9db1C806B