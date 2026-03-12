<p align="center">
  <img src="assets/logo.svg" width="180" height="180" alt="InkOS Logo">
</p>

<h1 align="center">InkOS</h1>

<p align="center">
  <strong>Multi-Agent Novel Production System</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg" alt="Node.js"></a>
  <a href="https://pnpm.io/"><img src="https://img.shields.io/badge/pnpm-%3E%3D9.0.0-orange.svg" alt="pnpm"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?logo=typescript&logoColor=white" alt="TypeScript"></a>
</p>

<p align="center">
  <a href="README.md">中文</a> | English
</p>

---

Open-source multi-agent system that autonomously writes, audits, and revises novels — with human review gates that keep you in control.

## Why InkOS?

Writing a novel with AI isn't just "prompt and paste." Long-form fiction breaks down fast: characters forget things, items appear from nowhere, the same adjectives repeat every paragraph, and plot threads silently die. InkOS treats these as engineering problems.

- **Canonical truth files** — track the real state of the world, not what the LLM hallucinates
- **Anti-information-leaking** — characters only know what they've actually witnessed
- **Resource decay** — supplies deplete and items break, no infinite backpacks
- **Vocabulary fatigue detection** — catches overused words before readers do
- **Auto-revision** — fixes math errors and continuity breaks before human review

## How It Works

InkOS runs a multi-agent pipeline for each chapter:

<p align="center">
  <img src="assets/screenshot-pipeline.png" width="800" alt="Pipeline diagram">
</p>

### Agent Roles

| Agent | Responsibility |
|-------|---------------|
| **Radar** | Scans platform trends and reader preferences to inform story direction |
| **Architect** | Plans chapter structure: outline, scene beats, pacing targets |
| **Writer** | Produces prose from the plan + current world state |
| **Continuity Auditor** | Validates the draft against three canonical truth files |
| **Reviser** | Fixes issues found by the auditor — auto-fixes critical problems, flags others for human review |

### Three Canonical Truth Files

Every book maintains three files as the single source of truth:

| File | Purpose |
|------|---------|
| `current_state.md` | World state: character locations, relationships, knowledge, emotional arcs |
| `particle_ledger.md` | Resource accounting: items, money, supplies with quantities and decay tracking |
| `pending_hooks.md` | Open plot threads: foreshadowing planted, promises to readers, unresolved conflicts |

The Continuity Auditor checks every draft against these files. If a character "remembers" something they never witnessed, or pulls a weapon they lost two chapters ago, the auditor catches it.

<p align="center">
  <img src="assets/screenshot-state.png" width="800" alt="Truth files snapshot">
</p>

## Quick Start

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- An OpenAI-compatible API key

### Install

```bash
npm i -g @actalk/inkos
```

### Configure

```bash
inkos init              # Initialize project, generates .env template
# Edit .env with your API key (any OpenAI-compatible endpoint)
```

### Create Your First Book

```bash
inkos book create       # Create a new book (interactive)
inkos write next        # Write next chapter (full agent pipeline)
inkos review            # Review the latest draft
inkos status            # Check project status
```

<p align="center">
  <img src="assets/screenshot-terminal.png" width="700" alt="Terminal screenshot">
</p>

## CLI Reference

| Command | Description |
|---------|-------------|
| `inkos init` | Initialize a new InkOS project |
| `inkos book create` | Create a new book (interactive) |
| `inkos write next` | Run the agent pipeline to produce the next chapter |
| `inkos write rewrite <n>` | Rewrite chapter N (restores state snapshot) |
| `inkos review` | Review and approve/reject the latest draft |
| `inkos review approve-all <id>` | Batch approve all pending chapters |
| `inkos status` | Show project and book status |
| `inkos export <id>` | Export book to txt/md |
| `inkos radar` | Run the Radar agent to scan platform trends |
| `inkos config` | View or update project configuration |
| `inkos doctor` | Diagnose setup issues |
| `inkos up` | Start daemon mode |
| `inkos down` | Stop the daemon |

## Key Features

### State Snapshots

Every chapter automatically creates a state snapshot. Use `inkos write rewrite <n>` to roll back and regenerate any chapter — world state, resource ledger, and plot hooks all restore to the pre-chapter state.

### Write Lock

File-based locking prevents concurrent writes to the same book.

### Daemon Mode

`inkos up` starts an autonomous loop that writes chapters on a schedule. The pipeline runs fully unattended for non-critical issues, but pauses for human review when the auditor flags problems it cannot auto-fix.

Notifications via Telegram, Feishu, or WeCom.

## Architecture

```
inkos/
├── packages/
│   ├── core/              # Agent runtime, pipeline, state management
│   │   ├── agents/        # architect, writer, continuity, reviser, radar
│   │   ├── pipeline/      # runner (write→audit→revise), scheduler (daemon)
│   │   ├── state/         # File-based state manager
│   │   ├── llm/           # OpenAI-compatible provider (streaming)
│   │   ├── notify/        # Telegram, Feishu, WeCom
│   │   ├── models/        # Zod schemas
│   │   └── prompts/       # Agent prompt templates
│   └── cli/               # Commander.js CLI
│       └── commands/      # init, book, write, review, status, export, etc.
├── templates/             # Project scaffolding templates
└── (future) studio/       # Web UI for review and editing
```

TypeScript monorepo managed with pnpm workspaces.

## Status

**Early alpha.** The core pipeline works, but expect breaking changes.

What works:
- Full agent pipeline (architect -> writer -> continuity auditor -> reviser)
- File-based state management with canonical truth files
- CLI for project init, book creation, writing, review, export
- State snapshots and chapter rewrite
- Notification dispatch (Telegram, Feishu, WeCom)
- Daemon mode with scheduler

What's planned:
- `packages/studio` — web UI for review, editing, and book management
- Plugin system for custom agents
- Multi-LLM routing (different models for different agents)
- Export to platform-specific formats

## Contributing

Contributions welcome. Open an issue or PR.

```bash
pnpm install
pnpm dev          # watch mode for all packages
pnpm test         # run tests
pnpm typecheck    # type-check without emitting
```

## License

[MIT](LICENSE)
