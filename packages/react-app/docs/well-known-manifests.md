# Well-Known Agent Manifests

Guide for maintaining Earnbase agent discovery files:

- `public/.well-known/agent-card.json` — ERC-8004 / A2A agent card
- `public/.well-known/mcp.json` — MCP discovery manifest
- `schemas/feedbackRequest.schema.json` — canonical request payload schema
- `schemas/feedbackResult.schema.json` — canonical result payload schema

These files describe the same product from two angles. Keep them consistent with each other and with the live API routes under `app/api/agent/`.

---

## File roles

| File | Audience | Purpose |
|------|----------|---------|
| `agent-card.json` | ERC-8004 registries, A2A clients, 8004scan | Identity, capabilities, payment model, skills |
| `mcp.json` | MCP-aware agents | Tool names, input schemas, prompts, examples |
| `schemas/*.schema.json` | Validators, integrators | Source of truth for request/result shapes |

Cross-reference in `erc8004-agent/agent-registration.json`:

```json
{
  "services": [
    { "name": "A2A", "endpoint": "https://earnbase.vercel.app/.well-known/agent-card.json", "version": "0.3.0" },
    { "name": "MCP", "endpoint": "https://earnbase.vercel.app/.well-known/mcp.json", "version": "2026-02-19" }
  ]
}
```

When you change `protocolVersion` in `agent-card.json` or `version` in `mcp.json`, update the matching `services[].version` in `agent-registration.json`.

---

## Project constants

Use these values everywhere (agent card, MCP auth block, examples, schemas):

| Constant | Value |
|----------|-------|
| Base URL | `https://earnbase.vercel.app` |
| USDC (Celo mainnet) | `0xcebA9300f2b948710d2653dD7B07f33A8B32118C` |
| Chain | `celo` |
| Chain ID | `42220` |
| Payment header | `X-PAYMENT` (also accepts `PAYMENT-SIGNATURE` or body `paymentTxHash`) |
| Auth scheme | `x402` |
| Minimum reward per participant | `0.01` USDC |
| Platform fee | 1% of `(participants × rewardPerParticipant)` |
| Pricing formula | `(participants × rewardPerParticipant) + 1% platform fee` |
| Agent avatar | `https://earnbase.vercel.app/agent-avatar.png` |
| ERC-8004 identity registry | `eip155:42220:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| Agent ID | `130` |

Source of truth for chain/token constants: `blockchain/constants.ts`.

---

## Live API mapping (MCP tools → HTTP)

MCP tools are implemented as REST routes. When adding or changing a tool, update both `mcp.json` and the route.

| MCP tool | Method | Route | Notes |
|----------|--------|-------|-------|
| `submit_feedback_request` | `POST` | `/api/agent/submit` | Requires x402 payment. Returns `{ taskId, agentRequestId, status, explorerUrl }`. |
| `get_feedback_status` | `GET` | `/api/agent/status/{requestId}` | `requestId` = `agentRequestId` from submit. |
| `get_feedback_results` | `GET` | `/api/agent/results?requestId={id}` | Preferred when task is completed and results are on IPFS. |
| `get_feedback_results` | `GET` | `/api/agent/results/{requestId}` | Alternate route; returns aggregated counts, not IPFS payload. |

Implementation files:

- `app/api/agent/submit/route.ts`
- `app/api/agent/status/[requestId]/route.ts`
- `app/api/agent/results/route.ts`
- `app/api/agent/results/[requestId]/route.ts`

---

## Schema sync rules

### Source of truth

1. Edit canonical schemas in `schemas/`.
2. Mirror tool `inputSchema` in `mcp.json` from `feedbackRequest.schema.json` (with MCP-friendly `description` fields).
3. Ensure `mcp.json` `resources[]` URIs point at publicly served schema URLs.
4. Serve schemas at `/schemas/*.schema.json` (copy or symlink from `schemas/` into `public/schemas/` — Next.js only serves files under `public/`).

### `feedbackRequest.schema.json`

Required top-level fields: `title`, `description`, `constraints`, `subtasks`.

Optional: `callbackUrl` (webhook for results — in schema but not yet wired in submit route).

**`constraints`** (required: `participants`, `rewardPerParticipant`):

| Field | Type | Notes |
|-------|------|-------|
| `participants` | integer ≥ 1 | Number of human contributors |
| `rewardPerParticipant` | string | USDC amount, min `"0.01"` |
| `countryRestriction` | boolean | Enable country filter |
| `countries` | string[] | ISO 3166-1 alpha-3 (e.g. `KEN`, `USA`) |
| `ageRestriction` | boolean | Enable age filter |
| `minAge`, `maxAge` | integer | Used when age restriction enabled |
| `genderRestriction` | boolean | Enable gender filter |
| `gender` | `"M"` \| `"F"` | Used when gender restriction enabled |

**`subtasks[]`**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `prompt` | string | yes | Question shown to contributors |
| `type` | enum | yes | See subtask types below |
| `required` | boolean | no | Defaults to `true` in submit route |
| `order` | integer | no | Defaults to array index + 1 |
| `options` | string[] | for choice types | Required for `MULTIPLE_CHOICE`, `CHOICE_SELECTION` |
| `fileTypes` | string[] | for uploads | e.g. `["image/png", "application/pdf"]` |

**Subtask types** (must match Prisma/UI — `CreateTask/page.tsx`, `FormGenerator.tsx`):

| Schema value | Agent-card skill alias | UI meaning |
|--------------|------------------------|------------|
| `MULTIPLE_CHOICE` | `multiple_choice` | Select one or more from options |
| `CHOICE_SELECTION` | `single_choice` | Single choice from options |
| `TEXT_INPUT` | `free_text` | Free text response |
| `FILE_UPLOAD` | `file_upload` | File upload |
| `RATING` | `rating` | Numeric rating scale |

Do not introduce new enum values without updating the Prisma model, UI, and submit route mapping.

### `feedbackResult.schema.json`

Status enum: `processing`, `completed`, `cancelled`.

Required: `status`, `requestId`.

Optional: `taskId`, `ipfsHash`, `resultsUrl`, `summary`, `createdAt`.

**Status route** (`/api/agent/status/{id}`) returns:

```json
{
  "status": "processing | completed | cancelled",
  "requestId": "...",
  "summary": { "participants", "maxParticipants", "completionRate" },
  "createdAt": "ISO-8601"
}
```

**Results route** (`/api/agent/results?requestId=`) returns when completed:

```json
{
  "status": "completed",
  "requestId": "...",
  "taskId": 123,
  "ipfsHash": "...",
  "resultsUrl": "https://gateway.pinata.cloud/ipfs/..."
}
```

Align `feedbackResult.schema.json` with these response shapes when they change.

---

## Writing `agent-card.json`

ERC-8004 A2A agent card served at `/.well-known/agent-card.json`. CORS is enabled in `next.config.js`.

### Required structure

```json
{
  "name": "Earnbase Human Feedback Agent",
  "description": "...",
  "url": "https://earnbase.vercel.app",
  "version": "1.0.0",
  "protocolVersion": "0.3.0",
  "provider": { "name": "Earnbase", "url": "https://earnbase.vercel.app" },
  "iconUrl": "https://earnbase.vercel.app/agent-avatar.png",
  "capabilities": {
    "streaming": false,
    "pushNotifications": false,
    "stateTransitionHistory": true,
    "humanInTheLoop": true
  },
  "defaultInputModes": ["application/json"],
  "defaultOutputModes": ["application/json"],
  "authentication": { "schemes": ["x402"], "x402": { ... } },
  "payments": { "x402": { ... } },
  "tee": { ... },
  "skills": [ ... ]
}
```

### Field guidance

- **`description`**: One paragraph on HFaaS — human feedback for AI agents, gasless USDC, no infra to manage.
- **`capabilities.humanInTheLoop`**: Must stay `true`; this is the product.
- **`authentication.x402`**: Match chain, token, header, and enforcement text with `mcp.json` `auth` and submit route behavior (402 before task creation).
- **`payments.x402`**: Document pricing model, formula, minimum, and fee semantics. Must match submit route math in `app/api/agent/submit/route.ts`.
- **`tee`**: Currently self-declared on Vercel. Update only if attestation infrastructure changes.
- **`skills[]`**: Marketing-level capability groups, not 1:1 with MCP tools. Each skill needs stable `id` (snake_case), `name`, `description`, and `tags`. Map `inputTypes` to subtask enum aliases where relevant.

### Skills inventory (current)

| id | Purpose |
|----|---------|
| `human_feedback_collection` | Core multi-subtask feedback with constraints |
| `content_evaluation` | Moderation / safety / quality review |
| `data_labeling` | Annotation and classification |
| `feedback_audit` | Proofs, counts, on-chain references |

Add a skill when exposing a genuinely new capability class, not for every new API endpoint.

---

## Writing `mcp.json`

MCP discovery manifest at `/.well-known/mcp.json`. Optimized for agent clients that read tool definitions without running an MCP server process.

### Top-level fields

```json
{
  "name": "Earnbase Human Feedback Agent",
  "version": "YYYY-MM-DD",
  "description": "...",
  "auth": { ... },
  "tools": [ ... ],
  "prompts": [ ... ],
  "resources": [ ... ],
  "examples": [ ... ],
  "integration": { "note": "..." }
}
```

- **`version`**: Use date stamp (`2026-02-19`) or semver; bump when tools/schemas change.
- **`description`**: Shorter and more operational than agent-card description. Mention typical latency (“hours”).
- **`auth`**: Flat x402 block — must match agent-card `authentication.x402` constants.
- **`integration.note`**: One-line cost formula reminder.

### Tools

Each tool:

```json
{
  "name": "snake_case_name",
  "description": "What it does, payment behavior, what it returns",
  "inputSchema": { /* JSON Schema object */ }
}
```

Rules:

1. **`submit_feedback_request.inputSchema`** must stay in sync with `schemas/feedbackRequest.schema.json`. Add MCP `description` strings; keep types and enums identical.
2. **`get_feedback_status`** and **`get_feedback_results`** take `{ "requestId": string }`. Document that `requestId` is the `agentRequestId` returned from submit (not always numeric `taskId`).
3. Do not add tools without a corresponding `app/api/agent/` route.
4. Tool names use `snake_case`.

### Prompts

Short trigger phrases agents can match to capabilities. Keep aligned with agent-card skills:

| name | Maps to |
|------|---------|
| `human_feedback` | General feedback |
| `content_moderation` | Safety review |
| `rlhf_collection` | Preference data |
| `data_labeling` | Annotation |

### Resources

Point at publicly served schema URLs:

```json
{
  "uri": "https://earnbase.vercel.app/schemas/feedbackRequest.schema.json",
  "name": "Feedback Request Schema"
}
```

Update URIs if base URL or filenames change.

### Examples

Each example:

```json
{
  "prompt": "Natural language use case",
  "tool": "submit_feedback_request",
  "input": { /* valid request body */ }
}
```

Examples must validate against `feedbackRequest.schema.json`. Use realistic `constraints` and at least one `subtask`. Include one example per major use case (preference, moderation, RLHF).

---

## Consistency checklist

Before merging changes, verify:

- [ ] `name` matches across `agent-card.json`, `mcp.json`, and `agent-registration.json`
- [ ] x402 constants identical in agent-card `authentication`, agent-card `payments`, and mcp `auth`
- [ ] Pricing formula and 0.01 USDC minimum documented in all three places
- [ ] Subtask type enums match `schemas/`, `mcp.json` tools, and UI
- [ ] MCP tool `inputSchema` matches `feedbackRequest.schema.json`
- [ ] `feedbackResult.schema.json` matches status/results API responses
- [ ] Schema files copied to `public/schemas/` if served statically
- [ ] `mcp.json` `version` and agent-card `protocolVersion` updated in `agent-registration.json` services
- [ ] Examples in `mcp.json` use only fields the submit route accepts
- [ ] New API fields added to schema first, then MCP, then route validation (see TODO in submit route for AJV)

---

## Common change workflows

### Add a new subtask type

1. Add enum to `schemas/feedbackRequest.schema.json`
2. Update Prisma/UI (`CreateTask`, `FormGenerator`)
3. Update submit route subtask mapping
4. Sync `mcp.json` `submit_feedback_request.inputSchema`
5. Add alias to relevant agent-card skill `inputTypes`
6. Bump `mcp.json` version

### Add a new MCP tool

1. Implement route under `app/api/agent/`
2. Add tool entry to `mcp.json` with `inputSchema`
3. Add example if non-obvious
4. Document mapping in this file
5. Bump `mcp.json` version

### Change payment or chain config

1. Update `blockchain/constants.ts` and env vars
2. Update agent-card `authentication` + `payments`
3. Update mcp `auth`
4. Update `integration.note` and pricing examples
5. Re-register or update on-chain metadata if needed (`erc8004-agent/scripts/`)

### Change request/response shape

1. Edit `schemas/*.schema.json`
2. Update API route(s)
3. Sync `mcp.json` tool schemas and examples
4. Copy schemas to `public/schemas/`
5. Bump `mcp.json` version

---

## Validation notes

- Submit route currently does basic required-field checks only (`app/api/agent/submit/route.ts`). Full AJV validation against `feedbackRequest.schema.json` is planned.
- Until AJV is wired, treat the schema files as the contract integrators expect.
- Payment enforcement: invalid or missing payment → HTTP 402 with x402 body from Thirdweb facilitator.
- `rewardPerParticipant` < 0.01 → HTTP 400.

---

## Deployment

Files under `public/.well-known/` are static assets deployed with the Next.js app. After edits:

1. Confirm JSON is valid (no trailing commas).
2. Confirm CORS headers apply (`next.config.js` → `/.well-known/:path*`).
3. Smoke-test:
   - `GET /.well-known/agent-card.json`
   - `GET /.well-known/mcp.json`
   - `GET /schemas/feedbackRequest.schema.json`
   - `GET /schemas/feedbackResult.schema.json`

---

## Related files

| Path | Role |
|------|------|
| `erc8004-agent/agent-registration.json` | On-chain ERC-8004 registration metadata |
| `blockchain/constants.ts` | Chain, token, contract addresses |
| `lib/x402-testing.ts` | Example client calling `/api/agent/submit` |
| `core/taskIngestion.ts` | Internal agent task ingestion (ERC-8004 + x402) |
| `next.config.js` | CORS for `.well-known` paths |
