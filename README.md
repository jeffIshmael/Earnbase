<p align="center">
  <img width="120" src="https://earnbase.vercel.app/logo.png" alt="EarnBase logo" />
</p>

<p align="center"><b>EarnBase</b> — Incentivized feedback and task completion on Celo</p>

---

## Overview

**EarnBase** lets creators post tasks, collect structured feedback, and automatically reward contributors on-chain. AI evaluates responses for quality and allocates bonus rewards, making feedback loops fair, transparent, and engaging.

- **Network**: Celo (cUSD)
- **Smart Accounts**: Pimlico for gas sponsorship
- **AI Scoring**: Gemini API
- **Frontend**: Next.js + Tailwind
- **Database**: Prisma

> Originally built to support beta testing for the ChamaPay miniapp, now evolving into a general-purpose platform for high-quality crowdsourced insights and task execution.

---

## Highlights

- **Structured tasks**: Clear criteria and expectations per task
- **AI-evaluated feedback**: Higher-quality input earns more
- **Instant on-chain rewards**: Base + bonus payout in cUSD
- **Smart accounts**: Gasless reward settlement for a smooth UX
- **Public task creation**: Anyone can create tasks and invite contributors
- **Swaps**: cUSD ↔ USDC for easier off-ramps

---

## Screenshots & Media

### Video Demo
- Live Demo: [Watch on YouTube](https://youtu.be/MkSACyoYrds?si=wI57eqHpGIB6fCKO)

---

## Architecture

- `packages/hardhat`: Solidity contracts and deployment (Celo)
- `packages/react-app`: Next.js app, API routes, Prisma, and UI
- `app/api/*`: serverless endpoints for rewards, notifications, etc.
- `lib/*`: blockchain, AI, email/WhatsApp utilities
- `components/*`: UI components (Tailwind + shadcn)

Smart contract: `EarnBase.sol` — manages task registration and reward accounting.

Contract (CeloScan): `https://celoscan.io/address/0xFfcC76948C60606e7F71500AD569bE0977edC85E`

---

## Quick Start

### Prerequisites
- Node.js LTS
- pnpm or npm

### Install
```bash
pnpm install
# or
npm install
```

### Environment Variables

Create `.env` files in `packages/react-app` and set the following (as applicable):

```bash
# Blockchain / Wallet
NEXT_PUBLIC_CHAIN_ID=42220
NEXT_PUBLIC_RPC_URL=https://forno.celo.org

# Pimlico / Smart Accounts
PIMLICO_API_KEY=...

# AI (Gemini)
GEMINI_API_KEY=...

# WhatsApp (Meta)
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_TOKEN=...
WHATSAPP_BUSINESS_ACCOUNT_ID=...

# Email
RESEND_API_KEY=...
```

### Run the app
```bash
cd packages/react-app
pnpm dev
# or
npm run dev
```

Open `http://localhost:3000`.

---

## Key Flows

### Create a Task
1. Go to `Start` → `Create Task`
2. Define subtasks, criteria, base reward, and max bonus
3. Publish and share your task link

### Submit Feedback
1. Open a task and complete the subtasks
2. Submit text and any required files
3. AI scores your response → reward calculated (base + bonus)
4. Reward sent on-chain (gasless)

### Notifications
- Email and WhatsApp notifications to creators when new responses arrive
- Configured via API routes in `packages/react-app/app/api/*`

---

## Integrations

- **AI (Gemini)**: Scores feedback quality and provides short explanations
- **Smart Accounts (Pimlico)**: Gas sponsorship for creating and sending reward transactions
- **Swaps**: cUSD ↔ USDC helpers for off-ramping convenience
- **Self Protocol**: Private eligibility approval for restricted tasks
- **Divvi**: Earn slices from users’ gas fees

---

## Development

- Contracts: `packages/hardhat`
- Frontend/API: `packages/react-app`

Useful scripts:
```bash
# Hardhat (from packages/hardhat)
pnpm hardhat compile
pnpm hardhat test

# React app (from packages/react-app)
pnpm dev
pnpm build && pnpm start
```

Database is managed via Prisma (see `packages/react-app/prisma`).

---

## Roadmap

- WhatsApp two-way flows (receive replies and ingest as submissions)
- Advanced leaderboards and seasons
- More chains and stablecoins
- Richer task types and media uploads

---

## Links

- Live App: `https://earnbase.vercel.app/`
- Farcaster Miniapp: `https://farcaster.xyz/miniapps/te_I8X6QteFo/earnbase`
- Demo Video: `https://youtu.be/MkSACyoYrds?si=wI57eqHpGIB6fCKO`
- Contract: `https://celoscan.io/address/0xFfcC76948C60606e7F71500AD569bE0977edC85E`

---

## Contributing

Contributions are welcome! Open issues/PRs for features, fixes, or docs. Please keep PRs focused and include screenshots for UI changes.

---

## License

MIT

---

## Contact

Email: `jeffianmuchiri24@gmail.com`