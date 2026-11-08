const { ethers } = require("hardhat");

const PROXY_ADDRESS = "0x9Ce99d57348f85c8Ad00593FaAF4E8CD77dd3008";
const USDC_ADDRESS = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Withdrawing as:", owner.address);

  const usdc = await ethers.getContractAt(
    ["function balanceOf(address) view returns (uint256)"],
    USDC_ADDRESS
  );
  const earnbase = await ethers.getContractAt("EarnBaseV2", PROXY_ADDRESS);

  const balance = await usdc.balanceOf(PROXY_ADDRESS);
  console.log("Contract USDC balance:", ethers.formatUnits(balance, 6));

  if (balance === 0n) {
    console.log("Nothing to withdraw");
    return;
  }

  const tx = await earnbase.withdrawUSDC(balance, owner.address);
  console.log("Tx:", tx.hash);
  await tx.wait();

  const after = await usdc.balanceOf(PROXY_ADDRESS);
  const ownerBal = await usdc.balanceOf(owner.address);
  console.log("Contract USDC after:", ethers.formatUnits(after, 6));
  console.log("Owner USDC after:", ethers.formatUnits(ownerBal, 6));
  console.log(`https://celoscan.io/tx/${tx.hash}`);
}

main();
