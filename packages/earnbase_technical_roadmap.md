# Unbase Agent Integration: Technical Roadmap

This document outlines the **exact technical requirements** to upgrade the Unbase platform from a human-to-human task platform into a fully functional **Agent-to-Human infrastructure** for the Celo Hackathon.

When imported into the Unbase codebase, the AI assistant will read this file, compare it against the existing smart contracts and backend routes, and generate a step-by-step implementation plan for what is missing.

---

## 🏗️ Phase 1: Smart Contract Upgrades (The Base Layer)

The Unbase smart contracts need to be upgraded to handle agent identities (ERC-8004), agent payments (x402), and decentralized delivery (IPFS/Events).

### 1. ERC-8004 Registry Integration
*   **Requirement:** The Unbase platform itself should be registered as an "Agent Service" or "Oracle" in the Celo ERC-8004 registry. 
*   **Why:** So other agents know Unbase is an official, reputable entity on the network.
*   **Checklist:**
    *   [ ] Deploy an Unbase identity contract implementing ERC-8004.
    *   [ ] Register the Unbase contract with the global Celo ERC-8004 registry.

### 2. x402 Payment Protocol Integration
*   **Requirement:** The main `TaskPublisher` contract must support `x402` payment deposits instead of standard ERC-20 `transferFrom` calls.
*   **Why:** `x402` is the standard for agentic micropayments. When an OpenClaw agent requests a task, it uses x402 to lock the USDC.
*   **Checklist:**
    *   [ ] Integrate the Thirdweb x402 SDK/contracts into the Unbase task creation flow.
    *   [ ] Write a function: `createTaskWithX402(string taskMetadataIPFS, uint256 numberOfHumans, uint256 budget)`
    *   [ ] Ensure the contract securely holds the x402 payment in escrow until humans complete the work.

### 3. IPFS Event Emitter (The Web3 Delivery)
*   **Requirement:** A mechanism to notify listening agents that their task is complete.
*   **Why:** This replaces webhooks (see `unbase_openclaw_integration.md`).
*   **Checklist:**
    *   [ ] Create an event: `event TaskCompleted(uint256 indexed taskId, address indexed requestingAgent, string resultIpfsHash);`
    *   [ ] Create a function: `function submitFinalResult(uint256 taskId, string calldata ipfsHash) external onlyOwner`
    *   *Note: `onlyOwner` assumes the Unbase backend aggregates the human results and submits the final IPFS hash to the chain to save gas.*

---

## 🖥️ Phase 2: Web2 Backend & Storage Infrastructure

The Unbase backend (Node.js/Next.js) needs to handle the off-chain heavy lifting: IPFS pinning, data aggregation, and optional webhooks.

### 1. IPFS Pinning Service
*   **Requirement:** When all humans finish a task, the backend must compile their feedback into a JSON file and upload it to decentralized storage.
*   **Checklist:**
    *   [ ] Set up an IPFS provider (Pinata, Lighthouse, or Web3.Storage).
    *   [ ] Write a utility function: `aggregateAndPinResults(taskId) -> string ipfsHash`
    *   [ ] Write a service that calls the `submitFinalResult` smart contract function with the returned Hash.

### 2. Webhook Fallback System (Optional but Recommended)
*   **Requirement:** A traditional `POST` request system for agents that provided a `callbackUrl` and aren't listening to blockchain events.
*   **Checklist:**
    *   [ ] Add a `callbackUrl` string to the database schema for `Tasks`.
    *   [ ] Write a webhook dispatcher: `function fireWebhook(callbackUrl, jsonResults)` with basic retry logic (e.g., attempt 3 times if 500 error).

### 3. "Self Protocol" Verification Guard
*   **Requirement:** Humans attempting to complete tasks on the platform must be verified.
*   **Why:** To prevent AI bots from farming the USDC rewards meant for humans. 
*   **Checklist:**
    *   [ ] Integrate the Self Protocol SDK.
    *   [ ] Add backend middleware: `requireHumanVerification(userWalletAddress)` before allowing task submission.

---

## 📦 Phase 3: The OpenClaw npm Package (Developer Experience)

The crown jewel of the hackathon submission. A standalone package developers can install into their own agent code.

### 1. `@unbase/openclaw-skill`
*   **Requirement:** Build and publish the OpenClaw skill so other developers can use Unbase with 2 lines of code.
*   **Checklist:**
    *   [ ] Initialize a new TS library package.
    *   [ ] Implement the `UnbaseSkill` class following the OpenClaw plugin architecture.
    *   [ ] Write the `requestHumanTask` tool that formats the prompt, handles the x402 payment, and returns the `taskId`.
    *   [ ] Write the blockchain event listener that wakes up the agent when `TaskCompleted` is detected.
    *   [ ] Publish to npm.

---

## 🚀 How to use this document:
When placed in the primary Unbase repository, the AI assistant will read this file, analyze the current `/contracts` and `/backend` directories, and map exactly which files need to be created or modified to check off these boxes.
