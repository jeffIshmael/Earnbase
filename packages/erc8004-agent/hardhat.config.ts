
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.24",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            viaIR: true,
        },
    },
    networks: {
        alfajores: {
            url: "https://alfajores-forno.celo-testnet.org",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 44787,
        },
        celo: {
            url: "https://forno.celo.org",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 42220,
        },
    },
    etherscan: {
        apiKey: process.env.CELOSCAN_API_KEY ?? '',
        customChains: [
            {
                chainId: 44_787,
                network: 'alfajores',
                urls: {
                    apiURL: 'https://api-alfajores.celoscan.io/v2/api',
                    browserURL: 'https://alfajores.celoscan.io',
                },
            },
            {
                chainId: 42_220,
                network: 'celo',
                urls: {
                    apiURL: 'https://api.celoscan.io/v2/api',
                    browserURL: 'https://celoscan.io',
                },
            },
        ],
    },
};

export default config;
