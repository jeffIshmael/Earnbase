<!-- TITLE -->
<p align="center">
  <img width="100px" src="https://earnbase.vercel.app/logo.png" align="center" alt="Celo" />
 <h2 align="center">Earnbase</h2>
 <p align="center">Incentivized feedback & task completion platform.</p>
</p>

**Earnbase** is a decentralized platform where users complete tasks, submit feedback, and earn on-chain rewards. It uses AI to evaluate the helpfulness and quality of each user's feedback, awarding bonus rewards based on value — not just participation.

Originally created to support the beta testing of the ChamaPay miniapp, EarnBase aims to evolve into a general-purpose tool for engaging testers, collecting actionable insights, and distributing rewards on Celo.

---

## Problem Statement


---

## Solution

EarnBase solves this by creating a gamified, AI-assisted feedback loop:
- **Task Assignment** — Users are given purposeful tasks (testing, reviews, surveys, etc.) tied to Web3 products or research initiatives.
- **Feedback Submission** — Users complete the tasks and submit written feedback or results.
- **AI Evaluation** — Feedback is scored using AI models that assess clarity, helpfulness, and depth.
- **Reward Distribution** — Every participant earns a base reward. High-quality feedback earns bonus rewards calculated based on AI scores.
- **Leaderboard & Rankings** — Users compete for top spots on the leaderboard, driving friendly competition and continuous engagement.

---

## Objectives

- Create a structured, gamified environment for crowdsourced task execution.
- Reward contributors based on effort and value, not just participation.
- Enable projects to collect high-quality, AI-filtered user insights at scale.

## Tech Stacks

- **Blockchain:** Celo
- **Smart Contracts:** Solidity
- **Stablecoin:** cUSD
- **Frontend:** Next.js, Tailwind CSS
- **Wagmi + Viem** – Web3 hooks and client management
- **Prisma:** Prisma is utilized as the ORM (Object-Relational Mapping) tool to manage database interactions. 
- **Gemini API:** Used as the LLM to rate the users feedbacks.
- **Pimlico** – Smart accounts (used for gasless reward settlement)