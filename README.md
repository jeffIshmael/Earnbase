<!-- TITLE -->
<p align="center">
  <img width="100px" src="https://earnbase.vercel.app/logo.png" align="center" alt="Celo" />
 <h2 align="center">Earnbase</h2>
 <p align="center">Incentivized feedback & task completion platform.</p>
</p>

**Earnbase** is a decentralized platform where users complete tasks, submit feedback, and earn on-chain rewards. It uses AI to evaluate the helpfulness and quality of each user's feedback, awarding bonus rewards based on value — not just participation.

Originally created to support the beta testing of the ChamaPay miniapp, EarnBase aims to evolve into a general-purpose tool for engaging users, collecting actionable insights, and distributing rewards on Celo.

---

## Problem Statement

Across Web3 and beyond, quality feedback and contributions are essential for progress — yet they’re often unstructured, overlooked, or under-rewarded. Whether it's for improving digital products, conducting research, or gathering community insights, getting meaningful input is difficult, and contributors rarely feel their voices truly matter.
Key challenges:

 - How do we fairly recognize and reward people for thoughtful input?
 - Can we create fun, engaging, and transparent feedback loops?
 - How can teams or researchers avoid sorting through low-effort or spammy submissions?
EarnBase was built to solve these — not just for developers, but for anyone seeking high-quality, incentivized feedback.


---

## Solution

EarnBase solves this by creating a gamified, AI-assisted feedback loop:
- **Task Assignment** — Users find purposeful tasks (testing, reviews, surveys, etc.).
- **Feedback Submission** — Users complete the tasks and submit written feedback or results.
- **AI Evaluation** — Feedback is scored using AI models that assess clarity, helpfulness, and depth.
- **Reward Distribution** — Every participant earns a base reward. High-quality feedback earns bonus rewards calculated based on AI scores.
- **Leaderboard & Rankings** — Users compete for top spots on the leaderboard, driving friendly competition and continuous engagement.

---

## Objectives

- Create a structured, gamified environment for crowdsourced task execution.
- Reward contributors based on effort and value, not just participation.
- Enable projects to collect high-quality, AI-filtered user insights at scale.

---

## Tech Stacks

- **Blockchain:** Celo
- **Smart Contracts:** Solidity
- **Stablecoin:** cUSD
- **Frontend:** Next.js, Tailwind CSS
- **Wagmi + Viem** – Web3 hooks and client management
- **Prisma:** Prisma is utilized as the ORM (Object-Relational Mapping) tool to manage database interactions. 
- **Gemini API:** Used as the LLM to rate the users feedbacks.
- **Pimlico** – Smart accounts (used for gasless reward settlement)
- **Divvi integration** - To earn slices from the user's gas fees.

---

## Architecture

---

## Implemented Features
- **Task Submission** – Testers can easily submit feedback through a streamlined interface.
- **AI-Powered Evaluation** – Feedback is automatically analyzed and rated by AI based on its quality and relevance.
- **Bonus Rewards System** – Users earn additional rewards based on the AI-generated quality score of their feedback.
- **Gas Sponsorship via Pimlico** – Pimlico is integrated to cover gas fees for the agent that records onchain reward allocations.
- **Onchain Claiming** – Users can seamlessly claim their earned rewards directly to their wallets.

---

## Upcoming Features

**🛠 Cross-Chain Swapping**

Allow users to seamlessly convert their earned cUSD into USDC on the Base network — ideal for Farcaster, where USDC is widely used.

**🛠 Public Task Creation**

Earnbase will be opened up to everyone. Anyone will be able to:
 - Create tasks
 - Define specific expectations and requirements (which will help guide the AI evaluation)
 - Invite participants and contributors globally

---

## Use Case: ChamaPay Beta Test
EarnBase was initially launched to support the beta testing of ChamaPay, a circular savings dApp built on Celo. 
Through EarnBase:
 - 10+ testers completed structured tasks
 - Feedback was collected, rated, and rewarded
 - Users claimed their rewards directly to their wallets.

---

### Getting Started

- Watch our video demo [Live Demo](https://youtu.be/QWdLC_tvImo?si=T2chg5htx1sYIYg5)
- Try out our platform in our [live link](https://earnbase.vercel.app/)
- Try as a miniapp on farcaster [farcaster Link](https://farcaster.xyz/miniapps/te_I8X6QteFo/earnbase)

---

## Contact

<a href="jeffianmuchiri24@gmail.com">@Earnbase devs </a>