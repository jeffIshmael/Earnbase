# Earnbase Agent Guide
### Human Feedback as a Service — Full Technical Reference

---

## What Is Earnbase?

Earnbase is a task-reward platform on Celo where humans complete tasks and claim USDC rewards. It has been extended to offer **Human Feedback as a Service** to AI agents.

When an AI agent needs feedback from real humans — labeling, rating, verification, text input — it uses Earnbase as the provider. The agent pays, Earnbase publishes the task to human workers, humans complete it, and the agent retrieves the results on-chain.

You are that agent. This document tells you everything you need to know.

---

## Architecture Overview

```
AI Agent (you)
    │
    ├── 1. GET QUOTE        →  Earnbase API  →  returns price + destination address
    ├── 2. PAY              →  USDC on Celo  →  wallet signature OR manual tx hash
    ├── 3. SUBMIT TASK      →  Earnbase API  →  returns taskId + agentRequestId
    ├── 4. WAIT FOR RESULTS →  blockchain event OR polling
    ├── 5. RETRIEVE RESULTS →  IPFS / Pinata Gateway
    └── 6. RATE THE SERVICE →  on-chain via ERC-8004 giveFeedback
```

This is called the **Open-Close Lifecycle**:
- **Open** = Steps 1–3 (you create and fund the task)
- **Close** = Steps 4–6 (you receive results and give feedback)

---

## Skill Installation

This skill ships as a single install. All executable code is bundled inside the skill folder — no separate npm package is required.

```bash
# Step 1: Install the skill
npx skills add earnbase/skills

# Step 2: Install dependencies (run once from the skill directory)
cd .claude/skills/agent-tasks
npm install
```

After installation, import the `EarnbaseSkill` class directly:

```typescript
import { EarnbaseSkill } from './.claude/skills/agent-tasks/scripts/index.ts';

const earnbase = new EarnbaseSkill();
// Optional config override:
const earnbase = new EarnbaseSkill({
  apiUrl: "https://earnbase.vercel.app",   // default
  rpcUrl: "https://forno.celo.org",        // default Celo RPC
  contractAddress: "0x..."                 // Earnbase contract on Celo
});
```

---

## The Open-Close Lifecycle — Step by Step

---

### STEP 1 — Get a Quote (First Trigger)

Before doing anything, call `getTaskQuote()` to find out how much to pay and where to send it.

```typescript
const quote = await earnbase.getTaskQuote({
  title: "Sentiment Analysis",
  prompt: "Read this product review and rate the sentiment from 1 (very negative) to 5 (very positive).",
  feedbackType: "rating",
  constraints: {
    participants: 10,
    rewardPerParticipant: 0.5, // USDC per human
  }
});

// quote returns:
// {
//   destinationAddress: "0xABC...",
//   priceAmount: "5.00",
//   priceCurrency: "USDC",
//   status: 402
// }
```

A `status: 402` response means **payment required** — this is expected and correct. It is not an error. Store `destinationAddress` and `priceAmount` for the next step.

#### TaskSpecs Object (used in both Quote and Submit)

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | ✅ | Short name for the task |
| `prompt` | `string` | ✅ | Full instructions shown to human workers |
| `feedbackType` | `string` | ✅ | `text_input`, `multiple_choice`, `rating`, or `file_upload` |
| `constraints.participants` | `number` | ✅ | How many humans should complete the task |
| `constraints.rewardPerParticipant` | `number` | ✅ | USDC reward per human |
| `constraints.allowedCountries` | `string[]` | ❌ | Restrict by country (ISO codes) |
| `constraints.allowedNationalities` | `string[]` | ❌ | Restrict by nationality |
| `constraints.minAge` / `maxAge` | `number` | ❌ | Age range restriction |
| `constraints.allowedGenders` | `string[]` | ❌ | `"Male"`, `"Female"`, `"Other"` |
| `options` | `string[]` | ⚠️ | Required only for `multiple_choice` type |
| `paymentTxHash` | `string` | ⚠️ | Required only for manual payment flow |

---

### STEP 2 — Pay

You have two paths depending on whether you control a wallet.

#### Path A: Autonomous Wallet (Preferred)

You have access to a wallet and can sign transactions directly.

```typescript
// Sign the X402 payment and submit in one call
const task = await earnbase.requestHumanTask(paymentSignature, taskSpecs);
```

Where `paymentSignature` is your X402-compliant signed payment payload authorising the USDC transfer to `destinationAddress`.

#### Path B: Manual Payment (Human Admin Required)

You do not control a wallet. Present payment details to a human administrator.

```
Please send exactly {quote.priceAmount} {quote.priceCurrency}
to address: {quote.destinationAddress}
on the Celo network.

Once sent, provide the transaction hash to proceed.
```

Once the human provides the `transactionHash`:

```typescript
const task = await earnbase.requestHumanTask(null, {
  ...taskSpecs,
  paymentTxHash: transactionHash  // replaces the payment signature
});
```

---

### STEP 3 — Submit the Task (Second Trigger)

`requestHumanTask()` is the official task submission. It opens the task on Earnbase and makes it visible to human workers.

```typescript
const task = await earnbase.requestHumanTask(paymentSignature, taskSpecs);

// task returns:
// {
//   taskId: 42,
//   agentRequestId: "req_abc123xyz",
//   status: "processing"
// }
```

**Store `agentRequestId` immediately.** You will need it to retrieve results and submit your platform rating.

---

### STEP 4 — Wait for Results

You have two options for knowing when results are ready.

#### Option A: Event Listener (Efficient — Preferred)

Register a listener and let the blockchain notify you. Your agent sleeps until the event fires.

```typescript
const unwatch = earnbase.listenForCompletion((log) => {
  console.log("Task completed:", log);
  console.log("Results CID:", log.args.resultsCID);
  console.log("Participants:", log.args.participants);
  console.log("Completion Rate:", log.args.completionRate);

  // Stop listening once received
  unwatch();

  // Proceed to Step 5
  retrieveAndProcessResults(log.args.resultsCID);
});
```

The `FeedbackRequestCompleted` event emits:

| Field | Type | Description |
|---|---|---|
| `requestId` | `bytes32` | Indexed — your task identifier |
| `resultsCID` | `string` | IPFS CID of the results JSON |
| `merkleRoot` | `bytes32` | Merkle root for result verification |
| `participants` | `uint256` | Number of humans who completed the task |
| `completionRate` | `uint256` | Percentage of assigned humans who finished |
| `avgLatencySeconds` | `uint256` | Average time humans took to complete |

#### Option B: Polling (Fallback)

If you cannot maintain a long-running listener, poll at intervals instead.

```typescript
async function waitForResults(agentRequestId: string) {
  while (true) {
    const result = await earnbase.queryTaskResults(agentRequestId);

    if (result.status === 'completed') {
      console.log("Results ready at:", result.resultsUrl);
      return result;
    }

    // Wait 30 seconds before polling again
    await new Promise(resolve => setTimeout(resolve, 30_000));
  }
}
```

`queryTaskResults()` returns:

| Field | Type | Description |
|---|---|---|
| `status` | `string` | `"processing"` or `"completed"` |
| `message` | `string` | Optional status message |
| `progress` | `string` | Optional progress indicator |
| `ipfsHash` | `string` | Raw IPFS CID when completed |
| `resultsUrl` | `string` | Pinata Gateway URL to the results JSON |

---

### STEP 5 — Retrieve and Use Results

Once you have the `resultsUrl` (from event or polling), fetch the results JSON from IPFS.

```typescript
const response = await fetch(result.resultsUrl);
const results = await response.json();

// results is an array of human responses:
// [
//   { participantId: "p1", response: "4", submittedAt: 1234567890 },
//   { participantId: "p2", response: "5", submittedAt: 1234567891 },
//   ...
// ]
```

Process as needed for your use case (aggregate ratings, parse text, classify labels, etc.).

---

### STEP 6 — Rate the Platform (Close the Loop)

After receiving results, rate Earnbase's service quality. This is submitted on-chain via ERC-8004 and uses `tag2: "agent-feedback"` to identify it as an agent-originated rating.

```typescript
await earnbase.submitPlatformRating(agentRequestId, {
  "result-accuracy": 9,       // Were the human responses accurate?
  "response-time": 8,         // How fast were results delivered?
  "human-quality": 9,         // Quality of human worker responses
  "task-completion-rate": 10, // Did all assigned participants complete?
  "overall-service": 9        // Overall Earnbase platform experience
});
```

All rating fields accept a value from **1 (poor) to 10 (excellent)**.

---

## Feedback Tag Reference (ERC-8004)

All feedback submitted to the reputation registry uses the `giveFeedback` function. The `tag2` field identifies the **source** of the feedback:

| Who is submitting | `tag1` (dynamic) | `tag2` (constant) |
|---|---|---|
| **Human user** on Earnbase UI | `task-clarity`, `reward-fairness`, `platform-experience`, `payment-speed`, `instructions-quality`, `overall` | `"human-feedback"` |
| **AI agent** after receiving results | `result-accuracy`, `response-time`, `human-quality`, `task-completion-rate`, `overall-service` | `"agent-feedback"` |

Never use `"agent-feedback"` for human UI submissions or vice versa. This distinction is how the platform separates and weights the two feedback streams.

---

## Complete Example: End-to-End Flow

```typescript
import { EarnbaseSkill } from './.claude/skills/agent-tasks/scripts/index.ts';

const earnbase = new EarnbaseSkill();

const taskSpecs = {
  title: "Product Review Sentiment",
  prompt: "Rate the sentiment of this review from 1 (very negative) to 5 (very positive): 'This product exceeded my expectations!'",
  feedbackType: "rating" as const,
  constraints: {
    participants: 5,
    rewardPerParticipant: 0.5,
  }
};

async function runFeedbackRequest() {
  // 1. Get quote
  const quote = await earnbase.getTaskQuote(taskSpecs);
  console.log(`Cost: ${quote.priceAmount} ${quote.priceCurrency}`);
  console.log(`Pay to: ${quote.destinationAddress}`);

  // 2 + 3. Pay and submit (autonomous wallet path)
  const task = await earnbase.requestHumanTask(myPaymentSignature, taskSpecs);
  console.log(`Task opened. ID: ${task.agentRequestId}`);

  // 4. Listen for completion
  const unwatch = earnbase.listenForCompletion(async (log) => {
    unwatch();

    // 5. Fetch results
    const results = await earnbase.queryTaskResults(task.agentRequestId);
    const data = await fetch(results.resultsUrl).then(r => r.json());
    console.log("Human responses:", data);

    // 6. Rate the platform
    await earnbase.submitPlatformRating(task.agentRequestId, {
      "result-accuracy": 9,
      "response-time": 8,
      "human-quality": 9,
      "task-completion-rate": 10,
      "overall-service": 9
    });

    console.log("Loop closed. Feedback submitted on-chain.");
  });
}

runFeedbackRequest();
```

---

## Error Handling

| Error | Cause | Fix |
|---|---|---|
| `402 Payment Required` | Expected from `getTaskQuote` — not a real error | Read `payTo` and `price` from response |
| `Task Request Failed (400)` | Malformed `taskSpecs` | Check required fields, ensure `options` is set for `multiple_choice` |
| `Task Request Failed (401)` | Invalid or missing payment signature | Re-sign the X402 payload or use manual `paymentTxHash` |
| `Earnbase Query Failed (404)` | `agentRequestId` not found | Confirm the task was submitted successfully in Step 3 |
| Event never fires | Contract address misconfigured | Verify `contractAddress` in `EarnbaseSkill` constructor |

---

## Network Details

| Property | Value |
|---|---|
| Blockchain | Celo Mainnet |
| Default RPC | `https://forno.celo.org` |
| Payment token | USDC |
| Feedback standard | ERC-8004 |
| Results storage | IPFS via Pinata |
| API base | `https://earnbase.vercel.app` |

---

*This document is the single source of truth for agent interactions with Earnbase. Keep it alongside your `SKILL.md` in the `agent-tasks/` skill folder.*
