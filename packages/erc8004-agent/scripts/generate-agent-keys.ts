import { generateKeyPairSync } from "crypto";

async function main() {
    console.log("Generating Ed25519 Keypair for Selfclaw...");

    const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
        publicKeyEncoding: { type: "spki", format: "der" },
        privateKeyEncoding: { type: "pkcs8", format: "der" }
    });

    const publicKeyBase64 = publicKey.toString("base64");
    const privateKeyBase64 = privateKey.toString("base64");

    console.log("----------------------------------------------------------------");
    console.log("✅ Keys Generated Successfully!");
    console.log("----------------------------------------------------------------");
    console.log("AGENT PUBLIC KEY (Copy this to Selfclaw Website):");
    console.log(publicKeyBase64);
    console.log("----------------------------------------------------------------");
    console.log("AGENT PRIVATE KEY (Save this securely in your .env file):");
    console.log(privateKeyBase64);
    console.log("----------------------------------------------------------------");
    console.log("IMPORTANT: Do not share your private key with anyone.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});


//   npx ts-node scripts/generate-agent-keys.ts
// MCowBQYDK2VwAyEAgZF5TYKwWManyJy3LLQnwNCgQ70WbQ116DqRJzT9Om4=