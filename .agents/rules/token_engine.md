# Autonomous Token Engine (7-Skill Global Protocol)

Activated globally across all workspaces, sessions, and agents (Anti, Cody, Gem, Spark, Dak). Always-on background execution to protect GCP quota and prevent token waste.

---

### 1. 🪨 Caveman — Prose Compression (-70% Prose Tokens)
- **Zero Filler**: Strip greetings, conversational filler, polite preambles, and redundant narration.
- **Ultra-Compact Reporting**: Use dense structured points, key metrics, and direct status codes.
- **Direct Clarity**: Deliver diagnoses and directives concisely without conversational loops.

### 2. ✂️ Ponytail — Code Minimalism (-54% Code Tokens)
- **Stdlib & Native First**: Enforce native browser/platform APIs and standard libraries over heavy dependencies.
- **Zero Boilerplate**: Eliminate redundant wrappers, boilerplate boilerplate, and dead declarations.
- **Shortest Working Diffs**: High-precision surgical diffs over mass file rewrites.

### 3. 🔇 RTK — Runtime Noise Filter
- **Compact CLI Execution**: Run commands with quiet/compact/silent flags (`--quiet`, `-q`, `--silent`, `--reporter=compact`).
- **Output Sanitization**: Filter verbose build logs, large stack traces, and noise before context injection.
- **Compact Handshake**: Cody reports `CHANGE: APPLIED / BUILD: PASS / TEST: PASS`.

### 4. 🗜️ Headroom — Payload Compression
- **Payload Stripping**: Compress bulky JSON dumps and tool output buffers before injection.
- **Targeted Fields**: Extract only required keys; discard unused schemas and duplicate data.

### 5. 🕸️ Graphify — Knowledge Graph First
- **AST / Graph Lookup**: Query AST knowledge graphs (`graphify-out/` or symbol maps) on codebase questions/refactors instead of reading raw files.
- **Targeted Symbol Resolution**: Inspect definitions and call hierarchies directly.

### 6. 🛡️ Token Audit — Memory & Cache Guard
- **Strict Size Threshold**: Keep all context, scratchpad, and memory files strictly under 5k tokens.
- **High Cache Hit Rate (>90%)**: Maintain stable system instruction prefixes across turns for optimal prompt caching.
- **Context Pruning**: Evict obsolete historical scratchpads and duplicate summaries.

### 7. 🔥 Codeburn — Cost & Quota Telemetry
- **Continuous Monitoring**: Track background token spend, model efficiency, and execution costs to protect GCP quota.
- **Ghost Agent Elimination**: Terminate idle, zombie, or redundant background tasks immediately.
- **Workload Tiering**: Offload execution to low-cost/free tier pipelines (Cody via zen proxy, Flash models).
