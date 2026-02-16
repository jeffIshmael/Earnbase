# Earnbase ERC-8004 Agent

This package contains the core contracts for the Earnbase Agent system, implementing the ERC-8004 standard for Autonomous Intelligent Agents.

## Contracts Overview

### 1. EarnbaseAgent (Identity)
The **Identity Registry** for Earnbase agents.
- **Function**: Manages the on-chain identity of agents using ERC-721 tokens.
- **Agent Wallet**: Each agent ID is linked to an operational wallet address (`agentWallet`). This wallet is authorized to sign messages and perform actions on behalf of the agent.
- **Metadata**: Stores IPFS URIs containing agent details (name, description, capabilities).

### 2. EarnbaseReputationRegistry (Reputation)
A **Hybrid Reputation System** tracking both qualitative and quantitative feedback.
- **Algorithmic Scoring**: Compatible with the EarnBase protocol. Automatically tracks scores for:
    - **Agents**: Based on successful task completions (`recordAgentAction`).
    - **Contributors**: Based on valid work submissions (`recordContribution`).
- **Qualitative Reviews**: Allows clients to leave detailed, on-chain feedback with ratings (0-100), tags, and text reviews (`giveFeedback`).

### 3. EarnbaseValidationRegistry (Validation)
Manages the verification of off-chain work.
- **Flow**:
    1. Agent or Client submits a `validationRequest` with a hash of the work.
    2. A designated Validator reviews the work off-chain.
    3. Validator submits a `validationResponse` with a score and result hash.
- **Purpose**: clearer guarantees that agent tasks were performed correctly before payment is released.

## Deployment

The contracts are upgradeable (UUPS) and deployed using ERC1967 Proxies.

### Networks
- **Celo Mainnet**: `npx hardhat run scripts/deploy.ts --network celo`
- **Alfajores Testnet**: `npx hardhat run scripts/deploy.ts --network alfajores`

## 8004scan.io Integration
To view your agent on [8004scan.io](https://www.8004scan.io/):
1. **Register**: Call `register(uri)` on the `EarnbaseAgent` contract.
2. **Metadata**: Ensure your URI points to a valid JSON file following the ERC-8004 metadata standard.
3. **Verify**: The explorer will automatically index the `Registered` events.
