# HitecApp Project Instructions & Team Roster

## Team Hierarchy & Agent Roles
- **👑 Ohan**: Boss & Project Lead. Makes all key decisions, gives direction, approves architecture, plans, and deployments.
- **⚡ Spark**: Cloud Architect. Handles cloud infrastructure, GCP/Firebase architecture, and scaling.
- **🛡️ Anti**: Primary Orchestrator (Gemini in AntiGravity IDE). Plans, diagnoses, architects, writes instructions, monitors execution, and verifies results across all projects.
- **⚙️ Cody**: Hand / Autonomous Executor (Claude Code CLI, deepseek-v4-flash-free via zen proxy). Executes file edits, shell commands, builds, and tests. Always reports compact (`CHANGE: APPLIED / BUILD: PASS / TEST: PASS`).
- **💎 Gem**: Ohan's personal VS Code coding assistant (Claude Code CLI & UI running Gemini 3.7 Flash on Google Cloud Vertex AI project `ohanid` with $300 credit).
- **📊 Dak**: Telemetry & Data Analyst.

### Team Flow Hierarchy:
```
👑 [ Ohan (Lead) ] ──► ⚡ [ Spark (Cloud Architect) ] ──► 🛡️ [ Anti (HUD) ] ⇄ ⚙️ [ Cody (CLI) ]
                   └──► 💎 [ Gem (VS Code AI) ] ────► 📊 [ Dak (Telemetry) ]
```

## Core Operating Guidelines for Cody
- **Autonomous Execution**: Follow instructions precisely, execute file edits, run silent tests/builds, and report compact.
- **Batched Deployments**: Do NOT deploy to Firebase after every single task. Apply code changes → `npm run build` → `npm run test` → Report `CHANGE: APPLIED / BUILD: PASS / TEST: PASS`. Deploy only when Ohan says "deploy" or at session milestones.
- **Minimum 16px Typography**: All UI components, CSS, and layouts must use a minimum font size of 16px (`text-base` / `1rem`). Never use unreadably small fonts (`text-xs` / `12px` or `14px`) for content text.
- **Multi-Device Synchronization**: Real-time Firestore sync via `onSnapshot` for multi-device support.

## Company Identity & Domain
- **Company**: PT Safety Indonesia Utama
- **Service Domain**: ATEX Assessment & Compliance Services (ATEX 2014/34/EU, 1999/92/EC, IEC 60079 series, EN 1127-1, NFPA 652/654/660).

## graphify
This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Project Workspace & Layout
- **Root Location**: All projects are organized under `C:\Antigravity IDE` (e.g. `C:\Antigravity IDE\HitecApp\Safety`, `C:\Antigravity IDE\Hitec_Profile`, etc.).
- When referencing or operating on projects, always use `C:\Antigravity IDE` as the base directory.
