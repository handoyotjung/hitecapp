# Graph Report - Safety  (2026-08-27)

## Corpus Check
- 126 files · ~289,186 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 625 nodes · 917 edges · 95 communities (64 shown, 31 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.62)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `eefdf82f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- aiAssessor.js
- functions/main.py
- sessionSecurity.js
- devDependencies
- File & Media Libraries
- claude-zen
- useReportExporter.js
- Reasoning Proxy Server
- .mcp.json
- Progress HTML Status Board
- cody_mcp_bridge.py
- Dashboard.jsx
- db_backup_restore.cjs
- emailAlertService.js
- CODY-COMMANDS.md
- Deployment Verification Script
- verify_ui.cjs
- Session Log — 2026-08-24 (safety-260824)
- ErrorBoundary
- log_cody_activity.js
- install.sh
- verify.sh
- seedProtection.js
- AuthContext.jsx
- envSafety.js
- .agent/workflows/deploy.md
- CLAUDE.md
- start.sh
- process-logo.cjs
- process-logo.js
- diag_projects.py Execution Result
- execute_cody_directive
- dbMigrations.js
- test_excel_drawing_extents.js
- .agent/workflows/test.md
- .claude/commands/desktop.md
- .claude/commands/mobile.md
- HitecApp Safety Project
- reconstruct_projects.py
- Admin Screenshot: Loaded
- Admin Screenshot: Edit Drawer
- Admin Screenshot: New Drawer
- Admin Screenshot: Saved Row
- Diagrams Document
- Python Requirements
- HS Logo Original
- Logo Icon
- Quarantined Scripts README
- Test Screenshot: Loaded State
- Test Screenshot: After Login
- Test Screenshot: Project Created
- Test Screenshot: After Upload
- Test Screenshot: Final State
- flowchart_visualization.md
- relay_daemon.py
- HitecApp Safety Session Log — 2026-08-19 (`safety-260819.md`)
- HitecApp Safety Session Log — 2026-08-20 (`safety-260820.md`)
- generate_hitec_slides_pptx.mjs
- Frontend Slides
- Key Deliverables & Code Changes
- Executive Architecture & Billing Summary: Project `ohanid` & Vertex AI Setup

## God Nodes (most connected - your core abstractions)
1. `Dashboard()` - 28 edges
2. `setDoc()` - 13 edges
3. `scripts` - 12 edges
4. `loadMockStore()` - 12 edges
5. `doc()` - 12 edges
6. `apiLogin()` - 12 edges
7. `Login()` - 11 edges
8. `loadSessionsTable()` - 11 edges
9. `apiLogoutOtherDevices()` - 11 edges
10. `apiLogout()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `test()` --calls--> `aiFeedbackSynthesize()`  [EXTRACTED]
  test_synthesis.js → src/aiAssessor.js
- `Session Log 2026-08-14` --references--> `Progress HTML Status Board`  [EXTRACTED]
  log/safety-260814.md → public/progress.html
- `Session Log 2026-08-15` --references--> `Progress HTML Status Board`  [EXTRACTED]
  log/safety-260815.md → public/progress.html
- `initialize()` --references--> `init()`  [EXTRACTED]
  functions/main.py → fetch_feedback.py
- `Session Log 2026-08-16` --references--> `Admin Panel HTML`  [EXTRACTED]
  log/safety-260816.md → public/admin.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **QA Test Screenshots** — test_screenshot_01, test_screenshot_02, test_screenshot_04, test_screenshot_05, test_screenshot_10 [EXTRACTED 0.80]
- **AI Agent Roles in HitecApp** — cody_agent, anti_agent, ohan_user [EXTRACTED 0.90]
- **HitecApp Safety Session Logs** — log_safety_260814, log_safety_260815, log_safety_260816, log_safety-260817 [EXTRACTED 0.90]
- **HitecApp Logo Files** — public_logo_hs_original, public_logo_hs_white, public_logo_icon [EXTRACTED 1.00]
- **External Dependencies for Status Board** — tailwindcss_cdn, chartjs_cdn, firebase_sdk_cdn [INFERRED 0.75]
- **HitecApp Public Web Interfaces** — public_admin, public_progress, public_survey [INFERRED 0.80]

## Communities (95 total, 31 thin omitted)

### Community 0 - "aiAssessor.js"
Cohesion: 0.16
Nodes (18): aiFeedbackChatStep(), aiFeedbackSynthesize(), aiGrammarCheck(), DEFAULT_AI_RECOMMENDATION_RULES, extractKeywords(), generateRecommendation(), getAISuggestions(), getStoredCommentsTraining() (+10 more)

### Community 1 - "functions/main.py"
Cohesion: 0.07
Nodes (41): CallableRequest, CloudEvent, init(), fetch_feedback.py — reads user feedback from Firestore and prints a structured…, api_admin_accounts(), api_admin_sessions(), api_feedback(), cleanup_exports() (+33 more)

### Community 2 - "sessionSecurity.js"
Cohesion: 0.17
Nodes (32): App(), SESSION_EXPIRY_MS, SESSION_SCHEMA_VERSION, Login(), SecurityPage(), onAuthStateChanged(), signOut(), queryClient (+24 more)

### Community 3 - "devDependencies"
Cohesion: 0.05
Nodes (41): autoprefixer, jsdom, devDependencies, autoprefixer, jsdom, pngjs, postcss, tailwindcss (+33 more)

### Community 4 - "File & Media Libraries"
Cohesion: 0.06
Nodes (35): docx, exceljs, file-saver, firebase, jspdf, jspdf-autotable, jszip, konva (+27 more)

### Community 5 - "claude-zen"
Cohesion: 0.14
Nodes (19): claude-zen script, ANTHROPIC_AUTH_TOKEN, ANTHROPIC_BASE_URL, ANTHROPIC_DEFAULT_HAIKU_MODEL, ANTHROPIC_DEFAULT_OPUS_MODEL, ANTHROPIC_DEFAULT_SONNET_MODEL, ANTHROPIC_MODEL, ANTHROPIC_SMALL_FAST_MODEL (+11 more)

### Community 6 - "useReportExporter.js"
Cohesion: 0.18
Nodes (16): base64ToBytes(), createLightBullet(), createLightRow(), createTwoColTable(), ensurePhotoBase64(), getBestPhotoBase64(), getImageSize(), handleExportWord() (+8 more)

### Community 7 - "Reasoning Proxy Server"
Cohesion: 0.19
Nodes (18): demandsReasoning, fail(), fillReasoningStubs(), PORT, readBody(), reasoningByKey, recallReasoning(), relayStream() (+10 more)

### Community 8 - ".mcp.json"
Cohesion: 0.14
Nodes (18): BIGQUERY_LOCATION, BIGQUERY_PROJECT, DATAPLEX_PROJECT, DATAPROC_PROJECT, DATAPROC_REGION, DRIVE_PROJECT, GOOGLE_CLOUD_PROJECT, SERVERLESS_SPARK_LOCATION (+10 more)

### Community 9 - "Progress HTML Status Board"
Cohesion: 0.15
Nodes (14): Chart.js CDN, Firebase Hosting Deployment, Firebase SDK CDN, Live HitecApp-Safety Application, HitecApp-Safety Session Log 2026-08-17, Session Log 2026-08-14, Session Log 2026-08-15, Session Log 2026-08-16 (+6 more)

### Community 10 - "cody_mcp_bridge.py"
Cohesion: 0.24
Nodes (11): assert_security_gate(), execute_cody_directive(), get_workspace_status(), tool, Validates that incoming text contains zero prohibited deployment/destructive…, Dispatches an autonomous directive directly to Cody (Claude Code CLI) in the…, Executes a terminal/build/test/git command directly in the HitecApp-Safety…, Runs Graphify AST extraction to build the codebase knowledge graph. (+3 more)

### Community 11 - "Dashboard.jsx"
Cohesion: 0.06
Nodes (56): aiGenerateRecommendation(), aiObservationAssessor(), aiTranslateAndGrammarCheck(), AnnotatedImageCanvas(), AutoSaveIndicator(), Dashboard(), getLocalTodayStr(), getProjectsCacheKey() (+48 more)

### Community 12 - "db_backup_restore.cjs"
Cohesion: 0.24
Nodes (10): ADMIN_HTML_PATH, BACKUP_DIR, BACKUP_MANIFEST, backupState(), ensureBackupDir(), fs, getTimestamp(), path (+2 more)

### Community 13 - "emailAlertService.js"
Cohesion: 0.38
Nodes (10): checkRateLimit(), EMAIL_CONFIG, getEmailAlertsLog(), saveEmailAlertsLog(), sendAccountInUseAlert(), sendAdminAlert(), sendAdminForceLogoutAlert(), sendSelfForceLogoutAlert() (+2 more)

### Community 14 - "CODY-COMMANDS.md"
Cohesion: 0.28
Nodes (6): Anti AI Agent, ATEX Standards, Cody AI Agent, fetch_feedback.py, Ohan User, update_feedback_status.py

### Community 15 - "Deployment Verification Script"
Cohesion: 0.29
Nodes (6): ADMIN_HTML_PATH, ENV_SAFETY_PATH, fs, MIGRATIONS_PATH, path, SEED_PATH

### Community 16 - "verify_ui.cjs"
Cohesion: 0.19
Nodes (14): findBtn(), fs, IMG_PATH, path, puppeteer, runCrossDeviceSyncSuite(), runDesktopSuite(), runMobileSuite() (+6 more)

### Community 17 - "Session Log — 2026-08-24 (safety-260824)"
Cohesion: 0.18
Nodes (10): 1. Objectives & Business Goals, 2. Key Changes & Delivered Files, 3. Features & Functional Specifications, 4. Verification & Status, `C:\Antigravity IDE\HitecApp\HitecSolution\`, ➕ Collapsible 3-Section Modal Form, 📄 Export & Sync Capabilities, 📊 KPI Cards & Analytics (+2 more)

### Community 19 - "log_cody_activity.js"
Cohesion: 0.40
Nodes (3): app, db, firebaseConfig

### Community 20 - "install.sh"
Cohesion: 0.70
Nodes (4): die(), ok(), say(), install.sh script

### Community 21 - "verify.sh"
Cohesion: 0.70
Nodes (4): info(), no(), ok(), verify.sh script

### Community 24 - "envSafety.js"
Cohesion: 0.83
Nodes (3): assertNonProductionOperation(), isProductionEnv(), safeFilterUserProjects()

### Community 30 - "diag_projects.py Execution Result"
Cohesion: 0.33
Nodes (5): Context, diag_projects.py Execution Result, Mock Store Contents (client-side), Script Behavior, Why 0 projects?

### Community 31 - "execute_cody_directive"
Cohesion: 0.40
Nodes (5): execute_cody_directive(), get_control_plane_status(), tool, Returns the operational status of the universal control plane., Dispatches a directive directly to Cody (Claude Code CLI) on the workspace.

### Community 88 - "relay_daemon.py"
Cohesion: 0.19
Nodes (12): execute_directive(), get_status(), handle_event(), tool, MCP Relay Bridge Daemon Listens to the Cloud Run FastMCP SSE endpoint and…, Handle an incoming MCP event from Spark., Execute a received directive in the local workspace., Get the operational status of the relay bridge. (+4 more)

### Community 89 - "HitecApp Safety Session Log — 2026-08-19 (`safety-260819.md`)"
Cohesion: 0.22
Nodes (8): 1. Executive Summary, 2. Key Code & Architecture Changes, 3. Build & Deployment Verification, 4. Next Planned Objectives, A. Tri-Mode Automated QA Suite (`.agent/scripts/verify_ui.cjs`), B. In-App User Guide Modal (`src/components/HelpModal.jsx`), C. Status Board & Pipeline Sync (`public/progress.html`), HitecApp Safety Session Log — 2026-08-19 (`safety-260819.md`)

### Community 90 - "HitecApp Safety Session Log — 2026-08-20 (`safety-260820.md`)"
Cohesion: 0.22
Nodes (8): 1. Executive Summary, 2. Key Code & Architecture Changes, 3. Build & Deployment Verification, 4. Next Planned Objectives, A. Tri-Mode Automated QA Suite (`.agent/scripts/verify_ui.cjs`), B. In-App User Guide Modal (`src/components/HelpModal.jsx`), C. Status Board & Pipeline Sync (`public/progress.html`), HitecApp Safety Session Log — 2026-08-20 (`safety-260820.md`)

### Community 91 - "generate_hitec_slides_pptx.mjs"
Cohesion: 0.29
Nodes (6): C, __dirname, __filename, pres, publicPath, targetProfilePath

### Community 93 - "Key Deliverables & Code Changes"
Cohesion: 0.20
Nodes (9): 1. Editable Microsoft Word Manual (`.docx`), 2. Standalone Interactive Mobile Web Guide (`public/manual-surveyor.html`), 4. Desktop Assessor Manual (`.docx` & Web Guide), 5. In-App User Guide Modal (`src/components/HelpModal.jsx`), 6. Production Hotfix: Upload Photo Disappearance Bug (Live Client Blocker), Deployment & Verification, HitecApp Safety — Session Log (2026-08-27), Key Deliverables & Code Changes (+1 more)

### Community 94 - "Executive Architecture & Billing Summary: Project `ohanid` & Vertex AI Setup"
Cohesion: 0.22
Nodes (8): 1. Project Separation & Architecture Mapping, 2. Configuration Record for `ohanid`, 3. Financial & Promotional Credit Analysis, 4. Implemented Production Setup: Gemini 3.7 Flash on VS Code Claude Code UI, Clean Team & Billing Matrix, Credit Status, Critical Billing Distinction: 1st-Party vs 3rd-Party Marketplace, Executive Architecture & Billing Summary: Project `ohanid` & Vertex AI Setup

## Knowledge Gaps
- **173 isolated node(s):** `fs`, `path`, `BACKUP_DIR`, `BACKUP_MANIFEST`, `STORE_PATH` (+168 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **31 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `File & Media Libraries` to `devDependencies`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `ErrorBoundary` connect `ErrorBoundary` to `sessionSecurity.js`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `fs`, `path`, `BACKUP_DIR` to the rest of the system?**
  _173 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `functions/main.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06767676767676768 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.047619047619047616 - nodes in this community are weakly interconnected._
- **Should `File & Media Libraries` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `claude-zen` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._