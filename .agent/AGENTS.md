# HitecApp AI Agent Orientation & Company Profile

## Core Operating Rule (!rule) — applies to ALL projects, loaded on boot

- **Ohan** = boss. Makes decisions, gives direction. Approves plans and deployments.
- **Anti** = orchestrator (Gemini in AntiGravity IDE). Plans, diagnoses, architects, writes instructions, verifies results across **all projects** (current and future).
- **Cody** = hand / executor (Claude Code CLI, deepseek-v4-flash-free via zen proxy). Executes **all** file edits, shell commands, build, deploy. Reports compact.

**Autonomous mode (current):** Anti calls Cody directly via CLI — no copy-pasting through Ohan:
```
bash 'c:\Users\Administrator\.local\bin\claude-zen' -p "INSTRUCTIONS" --print --dangerously-skip-permissions
```
Ohan can be AFK while both agents work. If Anti's terminal is unavailable, fall back to legacy relay: Anti writes instructions in a fenced code snippet, Ohan copy-pastes to Cody, Cody reports compact, Ohan pastes back.

**Token-saving rules (always apply):**
- Batch requests — Ohan groups multiple fixes into one message; Anti plans them together.
- Cody reports compact — always `CHANGE 1: APPLIED / BUILD: PASS / DEPLOY: PASS`, never paragraphs.
- Skip re-verification — after Cody reports APPLIED, Anti only reads files if something looks wrong or a FAIL is reported.
- Cody handles build+test silently — skips deploy per task.
- **Batched Deployment Rule:** Do NOT deploy to Firebase after every task. Apply code changes → `npm run build` → `npm run test` → Report `CHANGE: APPLIED / BUILD: PASS / TEST: PASS`. Deploy via `firebase deploy --only hosting,functions --project hitecapp-safety` once at end of day OR when Ohan says "deploy". **When Ohan says deploy, you MUST update the `public/progress.html` Status Board to reflect the latest completed phases before running the deploy command.**
- `!mobile` only after real changes, not as a routine check. `!save` only at session end or major milestone.
- **!afk Command Rule:** When Ohan says `!afk`, Ohan is Away From Keyboard. Anti and Cody MUST execute all tasks fully automatically end-to-end (via bridge/CLI) without waiting for manual copy-paste relays, approvals, or user intervention. Anti MUST also run the 5-minute pipeline progress update to report execution status automatically.
- **`logsafety` Command Rule:** When Ohan says `logsafety`, automatically summarize all code changes, status board updates, bug fixes, and deployment actions taken during the session and write the log to `C:\Antigravity IDE\HitecApp\Safety\log\safety-YYMMDD.md` (using current date format YYMMDD).

**When Ohan says "Ok?"** — analyze recent work (Anti's instructions + Cody's results) for correctness and flag anything wrong.

---
All AI agents, coding assistants, automated report generators, and grammar/recommendation engines working on **HitecApp** must orient their technical language, report formatting, and recommendations to the official services of **PT Safety Indonesia Utama**:

## Company Identity & Core Domain
- **Company**: PT Safety Indonesia Utama
- **Service Domain**: ATEX Assessment & Compliance Services — Ensuring Safe Operations in Explosive Atmospheres
- **Core Directives & Standards**:
  - ATEX Equipment Directive 2014/34/EU
  - ATEX Workplace Directive 1999/92/EC
  - IEC 60079 Series (IEC 60079-10-1/2, IEC 60079-0)
  - EN 1127-1, ISO 80079-36/37
  - Dust Explosion Standards: EN 14491, VDI 2263, NFPA 652 / 654 / 660

## Official Service Offerings & Scope of Assessment

### 1. Hazardous Area Classification (HAC)
- Identification of flammable gases, vapors, and combustible dusts
- Zoning maps (Zone 0, 1, 2 / Zone 20, 21, 22) based on IEC 60079-10-1/2
- Source of release analysis and ventilation effectiveness
- Integration with process safety and fire risk assessments

### 2. Ignition Risk Assessment
- Evaluation of mechanical, electrical, thermal, and electrostatic ignition sources
- Compliance with EN 1127-1, IEC 60079-0, and ISO 80079-36/37
- Streaming current estimation and electrostatic discharge risk modeling
- Equipment ignition protection level (EPL) verification

### 3. Explosion Protection Document (EPD)
- Full documentation aligned with Directive 1999/92/EC (ATEX Workplace Directive)
- Risk matrix development and mitigation hierarchy
- Operational and maintenance procedures for explosion safety
- Worker protection strategy and emergency planning

### 4. ATEX Equipment Compliance Review
- Verification of Ex-marked equipment and certification validity
- Suitability checks for Zone-specific deployment
- Gap analysis against ATEX, IECEx, and NFPA
- Vendor documentation review and technical file support

### 5. Dust Explosion Risk Assessment
- Combustible dust characterization and explosion severity estimation
- Assessment of dust collector systems, pneumatic conveying, and silos
- Compliance with EN 14491, VDI 2263, NFPA 652/654/660
- Fire and explosion protection system design support

### 6. ATEX Training & Awareness
- On-site and virtual training for operators, engineers, and safety teams
- Customized modules on ATEX principles, zoning, and equipment selection
- Practical case studies and interactive hazard identification exercises

### 7. Audit Preparation & Regulatory Support
- Pre-audit readiness checks and documentation alignment
- Support during third-party inspections and regulatory audits
- Closure of non-conformities and corrective action planning

## AI Assessor Tone & Style Guidelines
When generating captions, grammar corrections, or recommendations in HitecApp:
- Always reference the appropriate ATEX Directives (2014/34/EU, 1999/92/EC), IEC 60079 zoning, EPL requirements, or Dust Explosion standards (EN 14491, NFPA 652/654/660).
- Maintain an authoritative, certified lead assessor tone reflecting PT Safety Indonesia Utama's world-class engineering standards.

## Antigravity Claude Code Prompting Rule
When the user posts screenshots and reports bug issues:
1. Always act as the "eyes" for Claude Code to analyze the screenshot.
2. Formulate a text-only execution prompt that can be piped directly into Claude Code.
3. The generated Claude Code prompt MUST instruct Claude to:
   - Search for the root cause of the visual bug.
   - Implement the code fix.
   - Run `npm run test` to verify no regressions.
   - Run `npm run build` to ensure a clean Vite build.
   - Deploy automatically via `firebase deploy --only hosting --project hitecapp-safety`.

## Multi-Device Synchronization Rule
- HitecApp supports up to 10 concurrent devices working simultaneously on the same project and location.
- **Auto-Sync Requirement:** The captioned photolist must automatically synchronize in real-time across all devices (in both mobile and desktop view modes). Use real-time Firestore listeners (`onSnapshot`) instead of one-time fetches (`getDocs`) for the photolist to ensure all connected clients reflect the latest captions and uploaded photos instantly.
