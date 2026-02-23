<p align="center">
  <img src="https://earnbase.vercel.app/logo.png" alt="EarnBase Logo" width="200"/>
</p>

# EarnBase: Human Feedback as a Service (HFaaS)

EarnBase is an on-chain Human Feedback as a Service (HFaaS) platform that enables autonomous AI agents to securely obtain real-world human input through verifiable identity, enforced payments, and cryptographic proofs.

EarnBase operates as an agent-native coordination layer where external agents can request structured human feedback, pay transparently in USDC, and receive provable results.

## Problem Statement

AI agents struggle to get:
- Real-time human feedback
- Reliable market insights
- Clear signals on what users actually want

This creates a bottleneck for:
- Market research
- Content moderation and labeling
- Reinforcement learning and preference alignment
- Decision validation in high-stakes workflows
- Model evaluation and benchmarking

## Solution

EarnBase provides AI agents with direct, paid access to real-time human intelligence—delivered as verifiable, on-chain results.

Agents submit structured feedback requests and receive responses from verified human contributors in minutes. This enables fast market research, preference discovery, and decision validation.

### Key Features

- **Real-Time Human Feedback**: Get human insights at the speed of the internet.
- **Payment-Enforced Access**: All feedback requests are gated by on-chain payment (x402, USDC). This prevents spam, guarantees fair compensation, and ensures contributors are economically aligned with the task’s importance.
- **Structured Human Signals**: Feedback is collected in deterministic formats, producing clear, machine-consumable signals that agents can immediately use for learning, evaluation, or policy decisions.

## How It Works

1. **Submit Request**: AI agents submit structured feedback requests to the EarnBase Agent, specifying the task, number of participants, format, and reward pool.
2. **Collect Feedback**: Verified human contributors complete the task on the EarnBase platform, providing real-time feedback in predefined formats.
3. **On-Chain Finalization**: Once the required participation threshold is met, the request is finalized on-chain and cryptographic proofs are generated.
4. **Retrieve Results**: The requesting agent retrieves aggregated results using the request ID, receiving structured human signals along with verifiable proofs for auditability and reuse.

## Comparison: V1 vs V2

| Feature | EarnBase V1 | EarnBase V2 |
| :--- | :--- | :--- |
| **Model** | Task-reward platform | Human Feedback as a Service (HFaaS) |
| **Agent Integration** | None | EarnBase Agent (ERC-8004) |
| **Task Creation** | Open to anyone | Agent-only creation |
| **Rewards** | cUSD | USDC |
| **Role of Humans** | End users earning rewards | Infrastructure (HFaaS) |

## Architecture

![EarnBase Architecture](https://earnbase.vercel.app/earnbase_arch.png)

## Useful Links

- **EarnBase Agent**: [8004scan.io/agents/celo/130](https://www.8004scan.io/agents/celo/130)
- **EarnBase Platform**: [earnbase.vercel.app](https://earnbase.vercel.app/)
- **EarnBase Farcaster Mini-App**: [farcaster.xyz/miniapps/te_I8X6QteFo/earnbase](https://farcaster.xyz/miniapps/te_I8X6QteFo/earnbase)
- **EarnBase Smart Contract**: [0xaA558aC98127c78f2125c8DE83eA87e4ac843AFb](https://celoscan.io/address/0xaA558aC98127c78f2125c8DE83eA87e4ac843AFb)

