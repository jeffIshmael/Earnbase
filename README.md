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

- Create a structured environment for crowdsourced task execution.
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
- **Self Protocal** - To confirm user datails without revealing private data.

---

## Implemented Features
- **Task Submission** – Testers can easily submit feedback through a streamlined interface.
- **Smart Contract** - A smartcontract is deployed to manage the tasks and the rewarding. [earnbase smartcontract](https://celoscan.io/address/0xFfcC76948C60606e7F71500AD569bE0977edC85E)
- **AI-Powered Evaluation** – Feedback is automatically analyzed and rated by AI based on its quality and relevance.
- **Bonus Rewards System** – Users earn additional rewards based on the AI-generated quality score of their feedback.
- **Gas Sponsorship via Pimlico** – Pimlico is integrated to cover gas fees for the agent that records onchain reward allocations.
- **Onchain Claiming** – Users can seamlessly claim their earned rewards directly to their wallets.
- **Stablecoin swapping** – Users can seamlessly swap their cUSD to USDC. This is to cater for those users who would want to send their rewards to centralised exchanges (CEXs). 

- **🛠 Public Task Creation** - Earnbase is now open to public. Anyone can now:
    - Create tasks
    - Define specific expectations and requirements (which will help guide the AI evaluation)
    - Invite participants and contributors globally

- **Self Protocal Integration** - We have integrated self protocal to approve any restrictions a ctreator has without revealing private information. e.g A task that is focused on a certain age-bracket, gender e.t.c

---

## Upcoming Features

- **Whatsapp Integration**
- Integrate whatsapp as a mode of receiving feedback. A creator receives a feedback to their whatsapp, no need of coming back to the platform.

---


### Getting Started

- Watch our video demo [Live Demo](https://youtu.be/20BtY3GY8nU)
- Try out our platform in our [live link](https://earnbase.vercel.app/)
- Try as a miniapp on farcaster [farcaster Link](https://farcaster.xyz/miniapps/te_I8X6QteFo/earnbase)

---

## Contact

<a href="jeffianmuchiri24@gmail.com">@Earnbase devs </a>