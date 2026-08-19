# Graph Report - Safety  (2026-08-17)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 525 nodes · 810 edges · 86 communities (56 shown, 30 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.62)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `390dec26`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Dashboard.jsx
- API & Feedback Services
- sessionSecurity.js
- Build & Dev Dependencies
- File & Media Libraries
- claude-zen
- useReportExporter.js
- Reasoning Proxy Server
- GCP Project Configuration
- Progress HTML Status Board
- cody_mcp_bridge.py
- FeedbackModal.jsx
- db_backup_restore.cjs
- emailAlertService.js
- CODY-COMMANDS.md
- Deployment Verification Script
- UI Verification Script
- UploadWorkerPool
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

## God Nodes (most connected - your core abstractions)
1. `Dashboard()` - 28 edges
2. `setDoc()` - 13 edges
3. `doc()` - 12 edges
4. `apiLogin()` - 12 edges
5. `loadMockStore()` - 11 edges
6. `Login()` - 11 edges
7. `apiLogoutOtherDevices()` - 11 edges
8. `loadSessionsTable()` - 11 edges
9. `apiLogout()` - 10 edges
10. `updateDoc()` - 9 edges

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

## Communities (86 total, 30 thin omitted)

### Community 0 - "Dashboard.jsx"
Cohesion: 0.07
Nodes (60): aiGenerateRecommendation(), aiGrammarCheck(), aiObservationAssessor(), aiTranslateAndGrammarCheck(), DEFAULT_AI_RECOMMENDATION_RULES, extractKeywords(), generateRecommendation(), getAISuggestions() (+52 more)

### Community 1 - "API & Feedback Services"
Cohesion: 0.07
Nodes (41): CallableRequest, CloudEvent, init(), fetch_feedback.py — reads user feedback from Firestore and prints a structured…, api_admin_accounts(), api_admin_sessions(), api_feedback(), cleanup_exports() (+33 more)

### Community 2 - "sessionSecurity.js"
Cohesion: 0.16
Nodes (33): App(), SESSION_EXPIRY_MS, SESSION_SCHEMA_VERSION, Login(), SecurityPage(), onAuthStateChanged(), signInWithEmailAndPassword(), signOut() (+25 more)

### Community 3 - "Build & Dev Dependencies"
Cohesion: 0.05
Nodes (37): autoprefixer, jsdom, devDependencies, autoprefixer, jsdom, pngjs, postcss, tailwindcss (+29 more)

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

### Community 8 - "GCP Project Configuration"
Cohesion: 0.15
Nodes (16): BIGQUERY_LOCATION, BIGQUERY_PROJECT, DATAPLEX_PROJECT, DATAPROC_PROJECT, DATAPROC_REGION, GOOGLE_CLOUD_PROJECT, SERVERLESS_SPARK_LOCATION, SERVERLESS_SPARK_PROJECT (+8 more)

### Community 9 - "Progress HTML Status Board"
Cohesion: 0.15
Nodes (14): Chart.js CDN, Firebase Hosting Deployment, Firebase SDK CDN, Live HitecApp-Safety Application, HitecApp-Safety Session Log 2026-08-17, Session Log 2026-08-14, Session Log 2026-08-15, Session Log 2026-08-16 (+6 more)

### Community 10 - "cody_mcp_bridge.py"
Cohesion: 0.24
Nodes (11): assert_security_gate(), execute_cody_directive(), get_workspace_status(), Validates that incoming text contains zero prohibited deployment/destructive…, Dispatches an autonomous directive directly to Cody (Claude Code CLI) in the…, Executes a terminal/build/test/git command directly in the HitecApp-Safety…, Runs Graphify AST extraction to build the codebase knowledge graph., Returns the current Git status and workspace health. (+3 more)

### Community 11 - "FeedbackModal.jsx"
Cohesion: 0.27
Nodes (8): aiFeedbackChatStep(), aiFeedbackSynthesize(), translateIdToEnglishIssue(), FeedbackModal(), PhotoItem(), useSpeechToText(), test(), testHistory

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

### Community 16 - "UI Verification Script"
Cohesion: 0.29
Nodes (5): fs, IMG_PATH, path, puppeteer, SCREENSHOTS_DIR

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

## Knowledge Gaps
- **121 isolated node(s):** `DEFAULT_AI_RECOMMENDATION_RULES`, `authListeners`, `dbListeners`, `mockStore`, `_writeMutexQueue` (+116 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `File & Media Libraries` to `Build & Dev Dependencies`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `ErrorBoundary` connect `ErrorBoundary` to `sessionSecurity.js`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `DEFAULT_AI_RECOMMENDATION_RULES`, `authListeners`, `dbListeners` to the rest of the system?**
  _121 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dashboard.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06518987341772152 - nodes in this community are weakly interconnected._
- **Should `API & Feedback Services` be split into smaller, more focused modules?**
  _Cohesion score 0.06767676767676768 - nodes in this community are weakly interconnected._
- **Should `Build & Dev Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._
- **Should `File & Media Libraries` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._