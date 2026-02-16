# Earnbase Contract Documentation

This document explains the functionality of the three core Earnbase contracts.

## 1. EarnbaseAgent (Identity Registry)

This contract manages the on-chain identity of the Earnbase agent and adheres to the ERC-721 standard for agent identity (using token IDs).

### Core Functions

- **`register()`**:
    - Registers a new agent identity.
    - Assigns a unique `agentId`.
    - Sets the `agentWallet` to the caller's address.
    - Mints an ERC-721 token to the caller representing ownership of the agent identity.

- **`register(string memory agentURI)`**:
    - Same as `register()`, but also sets the metadata URI (e.g., pointing to an IPFS JSON file with agent details).

- **`setAgentURI(uint256 agentId, string calldata newURI)`**:
    - Updates the metadata URI for an existing agent.
    - Only callable by the agent owner.

- **`getAgentWallet(uint256 agentId)`**:
    - Returns the verified wallet address associated with the agent. This wallet is used for signing messages or receiving payments.

- **`setAgentWallet(...)`**:
    - Sets or updates the operational wallet for the agent.
    - Requires a signature from the new wallet to prove ownership (preventing setting invalid wallets).
    - Can only be called by the agent owner.

- **`unsetAgentWallet(uint256 agentId)`**:
    - Removes the associated wallet from the agent identity.

- **`isAuthorizedOrOwner(address spender, uint256 agentId)`**:
    - Helper to check if an address is either the owner of the agent or an approved operator (standard ERC-721 permissions).

## 2. EarnbaseReputationRegistry

This contract tracks reputation feedback for agents, allowing clients to leave on-chain reviews and ratings.

### Core Functions

- **`giveFeedback(...)`**:
    - Allows a client to leave feedback for an agent.
    - Parameters include `agentId`, `value` (rating), `tag1`/`tag2` (categories), and metadata URIs.
    - Prevents self-feedback (agent owners cannot rate themselves).

- **`revokeFeedback(uint256 agentId, uint64 feedbackIndex)`**:
    - Allows a client to revoke their previous feedback if needed.

- **`appendResponse(...)`**:
    - Allows an agent (or anyone) to respond to a specific piece of feedback.
    - Used for clarifications or disputes.

- **`getSummary(...)`**:
    - Calculates the aggregated reputation score for an agent based on filters (specific clients, tags).
    - Returns the count of reviews and the average score.

- **`readFeedback(...)` / `readAllFeedback(...)`**:
    - Retrieves specific feedback entries or bulk-reads feedback for analysis.

## 3. EarnbaseValidationRegistry

This contract allows validators (trusted entities or other agents) to cryptographically validate specific tasks or claims made by an agent.

### Core Functions

- **`validationRequest(...)`**:
    - Initiated by the agent owner.
    - Requests a specific validator to verify a claim (referenced by `requestHash`).

- **`validationResponse(...)`**:
    - Called by the validator to submit their result.
    - Includes a `response` score (0-100), a URI for details, and a tag.

- **`getValidationStatus(bytes32 requestHash)`**:
    - Returns the current status of a validation request (pending, completed, result).

- **`getSummary(...)`**:
    - Aggregates validation results for an agent.
    - Computes metrics like the average validation score from specific validators.
