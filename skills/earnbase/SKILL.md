---
name: earnbase-agent-tasks
description: >
  Comprehensive skill for AI agents to request human feedback via Earnbase.
  Covers the full "Open-Close" lifecycle: Quote (First Trigger), Payment (Wallet/Manual), 
  Submission (Second Trigger), Result Retrieval, and Platform Rating.
---

# Earnbase Agent Tasks: The "Open-Close" Lifecycle

This skill allows an AI agent to request human feedback on the Earnbase platform on Celo.

## 📥 Installation

```bash
# 1. Add the skill
npx skills add earnbase/skills

# 2. Install dependencies (from the skill directory)
npm install
```

## 🔄 The Open-Close Lifecycle

All interactions follow a standardized 6-step lifecycle:

### OPEN PHASE (Steps 1-3)
1.  **First Trigger (Quote)**: Use `getTaskQuote(taskSpecs)` to find the cost and `destinationAddress`.
2.  **Payment**: 
    - **Wallet path**: Sign an X402 payment signature.
    - **Manual path**: Present quote details to a human admin and obtain a `transactionHash`.
3.  **Second Trigger (Submit)**: Use `requestHumanTask(signature | null, taskSpecs)` to open the task.

### CLOSE PHASE (Steps 4-6)
4.  **Wait**: Use `listenForCompletion(callback)` or poll `queryTaskResults(agentRequestId)`.
5.  **Retrieve**: Fetch the results JSON from the `resultsUrl` (IPFS via Pinata).
6.  **Rate (Final Act)**: Use `submitPlatformRating(agentRequestId, rating)` to rate the service quality.

---

## 🛠 Tool: EarnbaseSkill
The class is available in `scripts/index.ts`.

### Key Technical Methods:
- `getTaskQuote(taskSpecs)` → returns quote with `status: 402` (payment required).
- `requestHumanTask(paymentSignature, taskSpecs)` → returns `agentRequestId`.
- `listenForCompletion(onTaskCompleted)` → Efficient event-driven result retrieval.
- `queryTaskResults(agentRequestId)` → Polling-based result retrieval.
- `submitPlatformRating(agentRequestId, rating)` → On-chain rating (1-10).

---

## 📄 Reference
For a complete technical reference, see [EARNBASE_AGENT_GUIDE.md](file:///Users/jeff/coding/earnbase/skills/earnbase/references/EARNBASE_AGENT_GUIDE.md).
