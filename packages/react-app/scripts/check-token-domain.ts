import { createThirdwebClient, getContract, readContract } from "thirdweb";
import { celo } from "thirdweb/chains";
import { resolveContractAbi } from "thirdweb/contract";
import { toFunctionSelector } from "viem";

const client = createThirdwebClient({
    clientId: "4cb67412f01cf393482e1b8e4477dbc2",
});

const token = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C"; // USDC Mainnet

async function main() {
    const contract = getContract({
        client,
        address: token,
        chain: celo,
    });

    try {
        const name = await readContract({
            contract,
            method: "function name() view returns (string)",
            params: [],
        });
        console.log("Token Name:", name);

        const version = await readContract({
            contract,
            method: "function version() view returns (string)",
            params: [],
        }).catch(() => "N/A");
        console.log("Token Version:", version);

        const nonce = await readContract({
            contract,
            method: "function nonces(address) view returns (uint256)",
            params: ["0x79fd2035F482937A9d94943E4E8092B0053E5b66"],
        }).catch(() => "nonces() failed");
        console.log("Nonce for admin:", nonce);

        const abi = await resolveContractAbi(contract).catch(() => []);
        const selectors = abi
            .filter((f: any) => f.type === "function")
            .map((f: any) => toFunctionSelector(f));

        console.log("Has permit:", selectors.includes(toFunctionSelector("function permit(address,address,uint256,uint256,uint8,bytes32,bytes32)")));
        console.log("Has transferWithAuthorization:", selectors.includes(toFunctionSelector("function transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)")));

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
