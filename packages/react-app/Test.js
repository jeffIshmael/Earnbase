// Setup: npm install alchemy-sdk
import { Alchemy, Network } from "alchemy-sdk";

const config = {
  apiKey: "hd5MlsSQS65YgUIWjahElYvCxjFf2Lhc",
  network: Network.ETH_MAINNET,
};
const alchemy = new Alchemy(config);

alchemy.core.resolveName("papajams.eth").then(console.log);


// 0x55A5705453Ee82c742274154136Fce8149597058 - papa