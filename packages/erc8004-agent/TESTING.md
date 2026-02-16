# Gasless x402 Testing Guide

## Overview
The new gasless x402 implementation uses **EIP-2612 permits** to enable agents to submit tasks without needing CELO for gas.

## Architecture

```
External Agent → Signs Permit (off-chain) → API → Server Settles (pays gas) → Task Published
```

## Prerequisites

### 1. Environment Variables

Create `.env.local` in `packages/react-app`:

```bash
# Server wallet that facilitates payments (pays gas)
SERVER_WALLET_PRIVATE_KEY=0x...

# Recipient wallet (receives payments)
NEXT_PUBLIC_EARNBASE_AGENT_WALLET=0x...

# USDC contract address (Celo Mainnet)
NEXT_PUBLIC_USDC_ADDRESS=0xcebA9300f2b948710d2653dD7B07f33A8B32118C
```

### 2. Fund Server Wallet

The server wallet needs CELO to pay gas for settlements:

```bash
# Minimum recommended: 0.1 CELO
# Each settlement costs ~0.001 CELO
```

## Testing Flow

### Step 1: Start Dev Server

```bash
cd packages/react-app
npm run dev
```

### Step 2: Expose with ngrok (for external testing)

```bash
ngrok http 3000
```

Update the `API_URL` in the test script with your ngrok URL.

### Step 3: Run Test Script

```bash
cd packages/erc8004-agent

# Set agent private key
export AGENT_PRIVATE_KEY=0x...
export EARNBASE_AGENT_WALLET=0x...

# Run test
npx ts-node scripts/test_agent_submission.ts
```

## What the Test Does

1. **Gets Nonce**: Calls `/api/x402/nonce?address=0x...`
2. **Signs Permit**: Creates EIP-2612 signature (off-chain, no gas)
3. **Submits Task**: POSTs to `/api/agent/tasks` with permit
4. **Server Settles**: Earnbase server calls `permit()` + `transferFrom()`
5. **Task Published**: Task appears in database

## Expected Output

```
🤖 Testing Gasless x402 Payment Flow...

Agent Address: 0x1234...
📡 Fetching nonce...
Current nonce: 0
Payment amount: 1.0 USDC (1000000 wei)
Deadline: 2026-02-09T00:20:00.000Z

✍️  Signing permit (no gas required)...
Signature: 0xabcd1234...

📤 Submitting task to API...

✅ Success! Task created with ID: 123
🎉 Payment was settled by the server (you didn't pay any gas!)
```

## API Endpoints

### GET `/api/x402/nonce`

Get current permit nonce for an address.

**Query Parameters:**
- `address`: Wallet address

**Response:**
```json
{
  "nonce": "0"
}
```

### POST `/api/agent/tasks`

Submit a task with gasless payment.

**Request Body:**
```json
{
  "agentAddress": "0x...",
  "paymentProof": {
    "signature": {
      "owner": "0x...",
      "spender": "0x...",
      "value": "1000000",
      "deadline": 1234567890,
      "v": 27,
      "r": "0x...",
      "s": "0x..."
    },
    "resource": "/api/agent/tasks",
    "timestamp": 1234567890
  },
  "title": "Task Title",
  "description": "Task Description",
  "maxParticipants": 10,
  "baseReward": "0.80",
  "maxBonusReward": "0.10",
  "aiCriteria": "Quality criteria",
  "subtasks": [
    {
      "title": "Question 1",
      "type": "TEXT_INPUT",
      "required": true
    }
  ]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "taskId": 123
}
```

**Error Responses:**
- `400`: Missing required fields or invalid signature
- `500`: Settlement failed or internal error

## Security Features

✅ **Signature Validation**: Validates permit structure and expiry
✅ **Amount Verification**: Ensures payment matches expected cost
✅ **Recipient Check**: Confirms payment goes to correct wallet
✅ **Deadline Enforcement**: Rejects expired permits
✅ **Timestamp Check**: Prevents replay attacks (5-minute window)

## Troubleshooting

### "Payment validation failed: Insufficient payment amount"
- Check that the payment amount matches the calculated cost
- Cost = (baseReward + maxBonusReward) * maxParticipants * 1.1

### "Payment settlement failed"
- Ensure `SERVER_WALLET_PRIVATE_KEY` is set correctly
- Verify server wallet has CELO for gas
- Check that agent has USDC balance

### "Payment signature expired"
- Increase the deadline in the test script
- Default is 10 minutes, increase if needed

### "Agent identity verification failed"
- Ensure agent is registered on-chain
- Check that agent has `human-feedback` capability

## Cost Analysis

**Agent Costs:**
- USDC payment: Task price (e.g., $1.00)
- Gas: **$0.00** (gasless!)

**Server Costs:**
- Gas per settlement: ~$0.001 CELO
- Total: ~$0.001 per task

**Savings:**
- Agents save 100% of gas costs
- Better UX for external agents
- True gasless experience ✅
