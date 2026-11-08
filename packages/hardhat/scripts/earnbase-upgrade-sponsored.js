/**
 * 1) Deploy EarnBaseV2 implementation via Pimlico-sponsored CREATE2
 * 2) Owner upgrades the proxy (cheap upgradeToAndCall)
 * 3) Verify implementation on Celoscan
 *
 * npx hardhat run scripts/earnbase-upgrade-sponsored.js --network celo
 */
const { ethers, upgrades, run } = require("hardhat");
const { createSmartAccountClient } = require("permissionless");
const { toSafeSmartAccount } = require("permissionless/accounts");
const { createPimlicoClient } = require("permissionless/clients/pimlico");
const {
  createPublicClient,
  http,
  concat,
  keccak256,
  toHex,
  getContractAddress,
  pad,
} = require("viem");
const { entryPoint07Address } = require("viem/account-abstraction");
const { privateKeyToAccount } = require("viem/accounts");
const { celo } = require("viem/chains");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../react-app/.env") });
dotenv.config();

const PROXY_ADDRESS = "0x9Ce99d57348f85c8Ad00593FaAF4E8CD77dd3008";
const CREATE2_DEPLOYER = "0x4e59b44847b379578588920cA78FbF26c0B4956C";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Owner/signer:", deployer.address);

  const NewEarnBase = await ethers.getContractFactory("EarnBaseV2");
  console.log("Validating upgrade safety...");
  await upgrades.validateUpgrade(PROXY_ADDRESS, NewEarnBase);

  const deployTx = await NewEarnBase.getDeployTransaction();
  const bytecode = deployTx.data;
  if (!bytecode || bytecode === "0x") throw new Error("Empty bytecode");

  const salt = keccak256(toHex("EarnBaseV2-withdrawUSDC-v1"));
  const predicted = getContractAddress({
    bytecode,
    from: CREATE2_DEPLOYER,
    opcode: "CREATE2",
    salt,
  });
  console.log("Predicted implementation:", predicted);

  const publicClient = createPublicClient({ chain: celo, transport: http() });
  const existing = await publicClient.getCode({ address: predicted });

  if (existing && existing !== "0x") {
    console.log("Implementation already deployed at predicted address");
  } else {
    const apiKey = process.env.PIMLICO_API_KEY;
    const agentPk = process.env.AGENT_PRIVATE_KEY;
    if (!apiKey) throw new Error("PIMLICO_API_KEY not set");
    if (!agentPk) throw new Error("AGENT_PRIVATE_KEY not set");

    const pimlicoUrl = `https://api.pimlico.io/v2/42220/rpc?apikey=${apiKey}`;
    const pimlicoClient = createPimlicoClient({
      transport: http(pimlicoUrl),
      entryPoint: { address: entryPoint07Address, version: "0.7" },
    });

    const owner = privateKeyToAccount(agentPk);
    const safeSmartAccount = await toSafeSmartAccount({
      client: publicClient,
      owners: [owner],
      entryPoint: { address: entryPoint07Address, version: "0.7" },
      version: "1.4.1",
    });

    const smartAccountClient = createSmartAccountClient({
      account: safeSmartAccount,
      chain: celo,
      bundlerTransport: http(pimlicoUrl),
      paymaster: pimlicoClient,
      userOperation: {
        estimateFeesPerGas: async () => (await pimlicoClient.getUserOperationGasPrice()).fast,
      },
    });

    console.log("Deploying via smart wallet:", safeSmartAccount.address);
    // Arachnid deployer: calldata = salt (32 bytes) || initCode
    const deployData = concat([pad(salt, { size: 32 }), bytecode]);

    const hash = await smartAccountClient.sendTransaction({
      to: CREATE2_DEPLOYER,
      data: deployData,
      value: 0n,
    });
    console.log("Deploy tx:", hash);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log("Deploy status:", receipt.status);
    if (receipt.status !== "success") throw new Error("CREATE2 deploy failed");

    const code = await publicClient.getCode({ address: predicted });
    if (!code || code === "0x") throw new Error(`No code at predicted address ${predicted}`);
    console.log("Implementation deployed:", predicted);
  }

  // Upgrade proxy from owner — cheap call
  const proxy = await ethers.getContractAt("EarnBaseV2", PROXY_ADDRESS);
  const currentImpl = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);
  console.log("Current implementation:", currentImpl);

  if (currentImpl.toLowerCase() === predicted.toLowerCase()) {
    console.log("Proxy already pointing at new implementation");
  } else {
    console.log("Calling upgradeToAndCall...");
    const tx = await proxy.upgradeToAndCall(predicted, "0x");
    console.log("Upgrade tx:", tx.hash);
    await tx.wait();
    console.log("Upgrade confirmed");
  }

  const liveImpl = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);
  console.log("Live implementation:", liveImpl);

  // Smoke-check new selector exists
  const withdrawUSDC = proxy.interface.getFunction("withdrawUSDC");
  console.log("withdrawUSDC selector:", withdrawUSDC.selector);

  console.log("Waiting 20s before verification...");
  await new Promise((r) => setTimeout(r, 20_000));

  try {
    await run("verify:verify", {
      address: liveImpl,
      constructorArguments: [],
    });
    console.log("Implementation verified on Celoscan");
  } catch (error) {
    if (error.message?.includes("Already Verified") || error.message?.includes("already verified")) {
      console.log("Implementation already verified");
    } else {
      console.error("Verification failed:", error.message);
      throw error;
    }
  }
}

main();
