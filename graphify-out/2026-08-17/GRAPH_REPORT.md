# Graph Report - Safety  (2026-08-17)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 503 nodes · 766 edges · 84 communities (55 shown, 29 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 2,020 input · 1,109 output

## Graph Freshness
- Built from commit: `8771d9d2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AI Processing & Recommendations
- API & Feedback Services
- User Authentication & Sessions
- Build & Dev Dependencies
- File & Media Libraries
- Dashboard & Firebase Operations
- Claude AI Model Config
- Reasoning Proxy Server
- GCP Project Configuration
- Cody AI Agent Tools
- Database Backup & Restore
- Email Alert Service
- Agent Commands & Docs
- Word Document Export
- HTML Admin Panels
- Deployment Verification Script
- UI Verification Script
- React Error Boundary
- Activity Logging to Firebase
- Installation Shell Script
- Verification Shell Script
- Safety Demo Seed Data
- Auth Context Provider
- Production Safety Checks
- Deploy Workflow Files
- Graphify Knowledge Tool
- Start Server Script
- PNG Logo Processor
- Logo Processing Script
- Database Schema Migration
- Excel Drawing Test
- UI Test Workflow
- Desktop QA Test
- Mobile QA Test
- Hitec Safety Project
- Project Reconstruction Script
- Screenshot: Admin Load
- Screenshot: Edit Drawer
- Screenshot: New Drawer
- Screenshot: Saved Row
- Diagrams Document
- Python Requirements Doc
- HS Logo Image
- Logo Icon File
- Quarantined Scripts README
- Screenshot: Test Loaded
- Screenshot: Test Login
- Screenshot: Test Created
- Screenshot: Test Upload
- Screenshot: Test Final

## God Nodes (most connected - your core abstractions)
1. `Dashboard()` - 30 edges
2. `apiLogin()` - 12 edges
3. `loadMockStore()` - 12 edges
4. `Login()` - 11 edges
5. `apiLogoutOtherDevices()` - 11 edges
6. `loadSessionsTable()` - 11 edges
7. `apiLogout()` - 10 edges
8. `handleExportWord()` - 9 edges
9. `loadStore()` - 9 edges
10. `saveSessionsTable()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `test()` --calls--> `aiFeedbackSynthesize()`  [EXTRACTED]
  test_synthesis.js → src/aiAssessor.js
- `Session Log 2026-08-14` --references--> `Progress Dashboard HTML`  [EXTRACTED]
  log/safety-260814.md → public/progress.html
- `Session Log 2026-08-15` --references--> `Progress Dashboard HTML`  [EXTRACTED]
  log/safety-260815.md → public/progress.html
- `Session Log 2026-08-17` --references--> `Progress Dashboard HTML`  [EXTRACTED]
  log/safety-260817.md → public/progress.html
- `Progress Dashboard HTML` --references--> `HS Logo White`  [EXTRACTED]
  public/progress.html → public/logo-hs-white.png

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **QA Test Screenshots** — test_screenshot_01, test_screenshot_02, test_screenshot_04, test_screenshot_05, test_screenshot_10 [EXTRACTED 0.80]
- **AI Agent Roles in HitecApp** — cody_agent, anti_agent, ohan_user [EXTRACTED 0.90]
- **HitecApp Safety Session Logs** — log_safety_260814, log_safety_260815, log_safety_260816, log_safety_260817 [EXTRACTED 0.90]
- **HitecApp Logo Files** — public_logo_hs_original, public_logo_hs_white, public_logo_icon [EXTRACTED 1.00]
- **HitecApp Public Web Interfaces** — public_admin, public_progress, public_survey [INFERRED 0.80]

## Communities (84 total, 29 thin omitted)

### Community 0 - "AI Processing & Recommendations"
Cohesion: 0.06
Nodes (35): aiFeedbackChatStep(), aiFeedbackSynthesize(), aiGenerateRecommendation(), aiGrammarCheck(), aiObservationAssessor(), aiTranslateAndGrammarCheck(), DEFAULT_AI_RECOMMENDATION_RULES, extractKeywords() (+27 more)

### Community 1 - "API & Feedback Services"
Cohesion: 0.07
Nodes (41): CallableRequest, CloudEvent, init(), fetch_feedback.py — reads user feedback from Firestore and prints a structured…, api_admin_accounts(), api_admin_sessions(), api_feedback(), cleanup_exports() (+33 more)

### Community 2 - "User Authentication & Sessions"
Cohesion: 0.15
Nodes (35): App(), SESSION_EXPIRY_MS, SESSION_SCHEMA_VERSION, Login(), SecurityPage(), collection(), getDoc(), onAuthStateChanged() (+27 more)

### Community 3 - "Build & Dev Dependencies"
Cohesion: 0.05
Nodes (37): autoprefixer, jsdom, devDependencies, autoprefixer, jsdom, pngjs, postcss, tailwindcss (+29 more)

### Community 4 - "File & Media Libraries"
Cohesion: 0.06
Nodes (35): docx, exceljs, file-saver, firebase, jspdf, jspdf-autotable, jszip, konva (+27 more)

### Community 5 - "Dashboard & Firebase Operations"
Cohesion: 0.12
Nodes (31): Dashboard(), getLocalTodayStr(), addDoc(), authListeners, broadcastDbMutation(), dbListeners, deleteDoc(), doc() (+23 more)

### Community 6 - "Claude AI Model Config"
Cohesion: 0.14
Nodes (19): claude-zen script, ANTHROPIC_AUTH_TOKEN, ANTHROPIC_BASE_URL, ANTHROPIC_DEFAULT_HAIKU_MODEL, ANTHROPIC_DEFAULT_OPUS_MODEL, ANTHROPIC_DEFAULT_SONNET_MODEL, ANTHROPIC_MODEL, ANTHROPIC_SMALL_FAST_MODEL (+11 more)

### Community 7 - "Reasoning Proxy Server"
Cohesion: 0.19
Nodes (18): demandsReasoning, fail(), fillReasoningStubs(), PORT, readBody(), reasoningByKey, recallReasoning(), relayStream() (+10 more)

### Community 8 - "GCP Project Configuration"
Cohesion: 0.15
Nodes (16): BIGQUERY_LOCATION, BIGQUERY_PROJECT, DATAPLEX_PROJECT, DATAPROC_PROJECT, DATAPROC_REGION, GOOGLE_CLOUD_PROJECT, SERVERLESS_SPARK_LOCATION, SERVERLESS_SPARK_PROJECT (+8 more)

### Community 9 - "Cody AI Agent Tools"
Cohesion: 0.24
Nodes (11): assert_security_gate(), execute_cody_directive(), get_workspace_status(), Validates that incoming text contains zero prohibited deployment/destructive…, Dispatches an autonomous directive directly to Cody (Claude Code CLI) in the…, Executes a terminal/build/test/git command directly in the HitecApp-Safety…, Runs Graphify AST extraction to build the codebase knowledge graph., Returns the current Git status and workspace health. (+3 more)

### Community 10 - "Database Backup & Restore"
Cohesion: 0.24
Nodes (10): ADMIN_HTML_PATH, BACKUP_DIR, BACKUP_MANIFEST, backupState(), ensureBackupDir(), fs, getTimestamp(), path (+2 more)

### Community 11 - "Email Alert Service"
Cohesion: 0.38
Nodes (10): checkRateLimit(), EMAIL_CONFIG, getEmailAlertsLog(), saveEmailAlertsLog(), sendAccountInUseAlert(), sendAdminAlert(), sendAdminForceLogoutAlert(), sendSelfForceLogoutAlert() (+2 more)

### Community 12 - "Agent Commands & Docs"
Cohesion: 0.28
Nodes (6): Anti AI Agent, ATEX Standards, Cody AI Agent, fetch_feedback.py, Ohan User, update_feedback_status.py

### Community 13 - "Word Document Export"
Cohesion: 0.42
Nodes (8): base64ToBytes(), createLightBullet(), createLightRow(), createTwoColTable(), ensurePhotoBase64(), getBestPhotoBase64(), getImageSize(), handleExportWord()

### Community 14 - "HTML Admin Panels"
Cohesion: 0.32
Nodes (8): Session Log 2026-08-14, Session Log 2026-08-15, Session Log 2026-08-16, Session Log 2026-08-17, Admin Panel HTML, HS Logo White, Progress Dashboard HTML, Survey HTML

### Community 15 - "Deployment Verification Script"
Cohesion: 0.29
Nodes (6): ADMIN_HTML_PATH, ENV_SAFETY_PATH, fs, MIGRATIONS_PATH, path, SEED_PATH

### Community 16 - "UI Verification Script"
Cohesion: 0.29
Nodes (5): fs, IMG_PATH, path, puppeteer, SCREENSHOTS_DIR

### Community 18 - "Activity Logging to Firebase"
Cohesion: 0.40
Nodes (3): app, db, firebaseConfig

### Community 19 - "Installation Shell Script"
Cohesion: 0.70
Nodes (4): die(), ok(), say(), install.sh script

### Community 20 - "Verification Shell Script"
Cohesion: 0.70
Nodes (4): info(), no(), ok(), verify.sh script

### Community 23 - "Production Safety Checks"
Cohesion: 0.83
Nodes (3): assertNonProductionOperation(), isProductionEnv(), safeFilterUserProjects()

## Knowledge Gaps
- **117 isolated node(s):** `DEFAULT_AI_RECOMMENDATION_RULES`, `testHistory`, `ADMIN_HTML_PATH`, `BACKUP_DIR`, `BACKUP_MANIFEST` (+112 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `File & Media Libraries` to `Build & Dev Dependencies`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `ErrorBoundary` connect `React Error Boundary` to `User Authentication & Sessions`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `DEFAULT_AI_RECOMMENDATION_RULES`, `testHistory`, `ADMIN_HTML_PATH` to the rest of the system?**
  _117 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AI Processing & Recommendations` be split into smaller, more focused modules?**
  _Cohesion score 0.06312098188194039 - nodes in this community are weakly interconnected._
- **Should `API & Feedback Services` be split into smaller, more focused modules?**
  _Cohesion score 0.06767676767676768 - nodes in this community are weakly interconnected._
- **Should `Build & Dev Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._
- **Should `File & Media Libraries` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._