# Registering Earnbase Skills on skills.sh

This document explains how to publish Earnbase skills so they can be installed by anyone using:

```bash
npx skills add earnbase-dev/skills
```

---

## What Is a Skill?

A skill is a folder containing a `SKILL.md` file (plus optional scripts, references, and assets) that gives an AI agent — like Claude — specific, reusable instructions for a domain or workflow. Skills are registered on [skills.sh](https://skills.sh), an open registry that works with 30+ AI agents including Claude Code, Cursor, and Windsurf.

---

## Folder Structure

Each skill lives as a subfolder inside the `earnbase/skills` GitHub repo:

```
earnbase/skills/               ← GitHub repo root
├── feedback/                  ← one skill
│   ├── SKILL.md               ← required
│   ├── scripts/               ← optional: executable code
│   ├── references/            ← optional: docs loaded into context
│   └── assets/                ← optional: templates, fonts, etc.
├── task-rewards/              ← another skill
│   └── SKILL.md
└── ...
```

---

## Step 1 — Write the SKILL.md

Every skill requires a `SKILL.md` with a YAML frontmatter block at the top.

```markdown
---
name: earnbase-feedback
description: >
  Handles on-chain human feedback submission for the Earnbase platform.
  Use this skill when working with the ERC-8004 giveFeedback contract,
  distinguishing between human-feedback and agent-feedback tag flows,
  or building any feedback UI on the Earnbase task reward system.
---

# Earnbase Feedback Skill

Your detailed instructions go here...
```

### Frontmatter Fields

| Field | Required | Notes |
|---|---|---|
| `name` | ✅ | Unique skill identifier |
| `description` | ✅ | **This is the triggering mechanism** — the AI reads only this to decide whether to load the skill |
| `compatibility` | ❌ | List required tools or dependencies (rarely needed) |

### Writing a Good Description

The description is the **only thing the AI sees** before deciding to load the skill. Make it specific and mention the exact contexts that should trigger it:

```yaml
# ❌ Too vague
description: Handles feedback on Earnbase.

# ✅ Specific and trigger-friendly
description: >
  Handles on-chain human feedback for the Earnbase platform using the
  ERC-8004 giveFeedback contract. Use this skill whenever working on
  feedback submission, the reputation registry, human-feedback vs
  agent-feedback tag differentiation, or Earnbase task rating UI.
```

---

## Step 2 — Push to GitHub

Create a **public** GitHub repository at:

```
github.com/earnbase/skills
```

All skills are subfolders inside this single repo. The repo name becomes the installable namespace.

```bash
git init
git add .
git commit -m "feat: add earnbase feedback skill"
git remote add origin https://github.com/earnbase/skills.git
git push -u origin main
```

---

## Step 3 — Register on skills.sh

1. Go to [skills.sh](https://skills.sh)
2. Submit your GitHub repo (`earnbase/skills`) for listing
3. Once approved, the skill is publicly installable

---

## Step 4 — Install & Test

Test locally before submitting:

```bash
# Install from local path
npx skills add ./feedback

# Install from GitHub after publishing
npx skills add earnbase/skills

# Install a specific skill from the repo
npx skills add earnbase/skills --skill earnbase-feedback

# List all installed skills
npx skills list
```

The CLI automatically detects which AI agent is being used and places the skill in the correct directory:

| Agent | Install Location |
|---|---|
| Claude Code | `.claude/skills/` |
| Cursor | `.cursor/skills/` |
| Windsurf | `.windsurf/skills/` |

---

## Earnbase Skill Tag Conventions

When writing skills for the Earnbase feedback system, always use the correct `tag2` values to differentiate feedback sources on-chain:

| Feedback Source | `tag1` (dynamic) | `tag2` (constant) |
|---|---|---|
| Human user | `task-clarity`, `reward-fairness`, `platform-experience`, `payment-speed`, `instructions-quality`, `overall` | `"human-feedback"` |
| AI agent | `result-accuracy`, `response-time`, `human-quality`, `task-completion-rate`, `overall-service` | `"agent-feedback"` |

---

## Skill Loading Hierarchy

Skills use a three-level loading system — only what is needed is loaded into context:

1. **Metadata** (`name` + `description`) — always in context, ~100 words
2. **SKILL.md body** — loaded when the skill is triggered, keep under 500 lines
3. **Bundled resources** (`scripts/`, `references/`, `assets/`) — loaded only when explicitly referenced in instructions

---

## Quick Checklist

- [ ] `SKILL.md` exists with valid YAML frontmatter (`name` + `description`)
- [ ] Description clearly lists when the skill should trigger
- [ ] Repo is public at `github.com/earnbase/skills`
- [ ] Skill tested locally with `npx skills add ./skill-folder`
- [ ] Repo submitted to [skills.sh](https://skills.sh) registry

---

*For questions about the skills.sh registry, visit [skills.sh](https://skills.sh). For Earnbase-specific skill conventions, refer to the tag differentiation table above.*
