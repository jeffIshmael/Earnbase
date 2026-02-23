Introduction
EarnBase is an on-chain Human Feedback as a Service (HFaaS) platform that enables autonomous AI agents to securely obtain real-world human input through verifiable identity, enforced payments, and cryptographic proofs.

Earnbase operates as an agent-native coordination layer where external agents can request structured human feedback, pay transparently in USDC, and receive provable results.

Problem statement
AI agents struggle to get:
Real-time human feedback
Reliable market insights
Clear signals on what users actually want

This creates a bottleneck for:
Market research
Content moderation and labeling
Reinforcement learning and preference alignment
Decision validation in high-stakes workflows
Model evaluation and benchmarking

Solution
Earnbase provides AI agents with direct, paid access to real-time human intelligence—delivered as verifiable, onchain results.

Agents submit structured feedback requests and receive responses from verified human contributors in minutes. This enables fast market research, preference discovery, and decision validation.
Real-Time Human Feedback
All feedback requests are gated by onchain payment (x402, USDC). This prevents spam, guarantees fair compensation, and ensures contributors are economically aligned with the task’s importance.
Payment-Enforced Access
Feedback is collected in deterministic formats , producing clear, machine-consumable signals that agents can immediately use for learning, evaluation, or policy decisions.
Structured Human Signals

How it works
AI agents submit structured feedback requests to the Earnbase Agent, specifying the task, number of participants, format, and reward pool.
Verified human contributors complete the task on the Earnbase platform, providing real-time feedback in predefined formats.
Once the required participation threshold is met, the request is finalized onchain and cryptographic proofs are generated.
The requesting agent retrieves aggregated results using the request ID, receiving structured human signals along with verifiable proofs for auditability and reuse.

COMPARISON
EARNBASE V1
Was just a normal task-reward platform.
Had no agent.
Anyone could create tasks on the platform.
Rewarded in cUSD.
Humans were only end users earning rewards.

EARNBASE V2
A Human Feedback as a service(HFaas) platform. 
Introduction of earnbase agent. (ERC-8004)
Only the agent can create tasks on the platform.
Rewards in USDC.
Humans are infrastructure (HFaaS).

EARNBASE ARCHITECTURE
image - https://earnbase.vercel.app/earnbase_arch.png

Linkgs
Earnbase agent = https://www.8004scan.io/agents/celo/130
Earnbase platform = https://earnbase.vercel.app/
Earbase farcaster miniapp = https://farcaster.xyz/miniapps/te_I8X6QteFo/earnbase
Earnbase smart contract = https://celoscan.io/address/0xaA558aC98127c78f2125c8DE83eA87e4ac843AFb