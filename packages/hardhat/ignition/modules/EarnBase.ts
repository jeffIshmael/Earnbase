import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const EarnBase = buildModule("EarnBase", (m) => {
  
  // Deploy the MiniPay contract with the specified parameters
  const earnbase = m.contract("EarnBase");

  return { earnbase };
});

export default EarnBase;

