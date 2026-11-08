/**
 * Upgrade EarnBaseV2 proxy on Celo.
 * Prefers Pimlico-sponsored CREATE2 deploy when the owner lacks CELO for a full deploy.
 *
 * npx hardhat run scripts/earnbase-upgrade.js --network celo
 */
require("./earnbase-upgrade-sponsored.js");
