# PM Memory — hitecapp-safety migration

## Team Roster & Roles
- **👑 Ohan**: Project Lead & Boss. Makes decisions, gives direction, approves architecture, plans, and deployments.
- **⚡ Spark**: Cloud Architect. Cloud infrastructure, GCP/Firebase architecture, and scaling.
- **🛡️ Anti**: Primary Orchestrator (Gemini in AntiGravity IDE). Architecture, planning, diagnostics, monitoring, and verification.
- **⚙️ Cody**: Hand / Autonomous Executor (Claude Code CLI, deepseek-v4-flash-free via zen proxy). File edits, shell commands, silent test/build, compact reporting (`CHANGE: APPLIED / BUILD: PASS / TEST: PASS`).
- **💎 Gem**: Ohan's personal VS Code coding assistant (Claude Code CLI & UI running Gemini 3.7 Flash on Google Cloud Vertex AI project `ohanid` with $300 credit). Gem collaborates with Ohan in VS Code alongside Cody and Anti.
- **📊 Dak**: Telemetry & Data Analyst.

### Team Flow:
👑 [ Ohan (Lead) ] ──► ⚡ [ Spark (Cloud Architect) ] ──► 🛡️ [ Anti (HUD) ] ⇄ ⚙️ [ Cody (CLI) ]
                   └──► 💎 [ Gem (VS Code AI) ] ────► 📊 [ Dak (Telemetry) ]


## Codebase facts

- **Two Firebase projects**: `hitecmedia-app` (legacy — ABANDONED) and `hitecapp-safety` (active — all services migrated as of 2026-08-04).
- **Production domain**: `hitecapp-safety.web.app` / `app.hitec.id` (pending DNS cutover).
- **`.env.production`**: targets `hitecapp-safety`, API key `AIzaSyATlN5wwRxufoMPQEaI4XVWapWw4q1AaF8`.
- **`.env.local`**: mock API key (`mock-api-key-hitecmedia`) → isMockMode=true in dev. PROJECT_ID is `hitecapp-safety`.
- **Mock mode**: `isMockMode = !VITE_FIREBASE_API_KEY || key === "mock-api-key-hitecmedia"` in `src/firebase.js:69`.
- **Auth flow**: Login.jsx calls `signInWithEmailAndPassword` (Firebase Auth) then `apiLogin` (localStorage mock DB). If Firebase Auth fails, app continues via localStorage session.
- **Session writes**: All Firestore REST calls go through `firestorePatch()` helper in sessionSecurity.js which calls `auth.currentUser.getIdToken()` for Bearer token. IS_MOCK_MODE guard skips all REST calls in local dev.
- **companyId mapping**: sessionSecurity.js returns `company_id` (underscore). App.jsx normalizes to `companyId` (camelCase) via `companyId: parsed.companyId || parsed.company_id || ''`. Dashboard.jsx reads `user.companyId`.
- **Project queries**: Dashboard.jsx lines 644-646 query by `company_id` (if user.companyId set) or `created_by` (email fallback).
- **Photo writes**: `company_id` on photo docs comes from `selectedProject.company_id` (not user.companyId — that was undefined).
- **Storage bucket**: `hitecapp-safety.firebasestorage.app` (us-west1). CORS configured. Storage rules deployed.
- **Cloud Functions**: ALL DEPLOYED (gen2, as Cloud Run services). `onPhotoUpload` in us-west1, all others in asia-southeast2. Blaze plan active.
- **`onPhotoUpload`**: Fires on Storage finalize, enriches photo doc with grade, assessment_grade, expires_at, lastModified, latest_status within ~40 seconds of upload.
- **Admin panel** (`public/admin.html`): Firebase config updated to `hitecapp-safety`. All 7 REST URLs updated from hitecmedia-app. TDZ bug (`currentFeedbackMode`) fixed with `var` declaration.
- **Firebase Auth accounts** (hitecapp-safety): demo@hitec.id (uid: gPbeRVGV1tamjgbMP9pCNqxvTsf1), admin@hitec.id, handoyo.tjung@gmail.com. Created/updated via `create_accounts.py` (now targets hitecapp-safety).
- **`create_accounts.py`**: Line 7 updated to `projectId: 'hitecapp-safety'`. Use this to manage Auth accounts.
- **9-Layer Architecture guardrails**: Array.isArray on whitelist_users, sw.js kill-switch, es2015 vite target, #root watchdog (4000ms), shouldShowCloudSyncWarning suppression, window.__hitecDebugAudit.

## Upload flow (production)

1. `uploadFile()` calls `getSignedUploadUrl` Cloud Function → gets signed URL
2. XHR PUT to signed URL with progress events
3. On success: `registerAndListenAfterDirectPut(item, filePath)` is called
4. That writes Firestore photo doc (`status: 'pending'`) + sets up onSnapshot listener
5. `onPhotoUpload` Cloud Function fires (~40s), updates doc to `status: 'done'`
6. onSnapshot fires, UI marks item Done, queue clears

SDK fallback path (if signed URL fails):
1. `uploadBytesResumable` SDK upload
2. On success: `setDoc` writes photo doc with `status: 'done'` directly
3. onSnapshot fires immediately, UI marks Done

## Recurring bug patterns

### Pattern: "Upload hangs at 0% / stuck forever"
- **Why it happens**: Missing function call after upload, or `company_id: undefined` in setDoc crashing the write.
- **Correct fix**: Ensure `registerAndListenAfterDirectPut` is called after XHR PUT. Use `selectedProject.company_id` not `user.companyId` for photo docs.

### Pattern: "Variable not defined" ReferenceError in async paths
- **Why it happens**: Wrong variable name in scope, or `const` arrow before declaration (TDZ).
- **Correct fix**: Rename to correct in-scope variable, or convert to hoisted `function`.

### Pattern: Cross-project Firebase configuration mismatch
- **Why it happens**: Migration from hitecmedia-app to hitecapp-safety left hardcoded references.
- **Correct fix**: Grep entire repo for old project references. As of 2026-08-04 all known occurrences are fixed.
- **Remaining risk**: Any file not yet audited may still reference the old project.

### Pattern: Firestore REST 403 with ?key= in URL
- **Why it happens**: Bearer token not passed — falls back to API-key auth which lacks request.auth.
- **Correct fix**: Use `firestorePatch()` helper which gets fresh token from auth.currentUser.

### Pattern: camelCase vs snake_case field name mismatch
- **Why it happens**: sessionSecurity.js uses snake_case (company_id), React components use camelCase (companyId).
- **Correct fix**: Normalize in App.jsx setUser() call. Do NOT rename the field in sessionSecurity.js or Firestore.

## Executioner behavior log

### Tendency: Implement before diagnosing
- Frequently collapses "diagnose → report → wait → implement" into a single turn.

### Tendency: Forward-claim "verified" without full evidence
- Test suite exercises mock-mode only, not real Firebase integration.

### Tendency: Not flagging security implications
- Does not spontaneously call out security-sensitive path changes.

### Positive: Correct blast-radius grep
- When explicitly asked, provides accurate grep results.

### Positive: Accurate verbatim reporting
- Console output, network intercepts, and curl responses are reliable when asked for verbatim.

## Decisions & deferred items

- **2026-08-04**: `userId` field in project documents never matches real Firebase auth UID. Mitigated by `isWhitelisted()` fallback in Firestore rules. Decision pending: fix the field or remove it from rules.
- **2026-08-04**: `addDoc is not defined` in Login.jsx:63 — caught by inner try/catch, non-blocking. Deferred.
- **2026-08-04**: Existing project documents have `company_id: "hitec"` instead of `"co_hitec"`. New documents will be correct. Old data not backfilled. Decision pending.
- **2026-08-04**: DNS cutover from app.hitec.id → hitecapp-safety not yet done. Requires Counsel authorization.
- **2026-08-04**: firebase-sa.json belongs to deleted project (hitecmedia-app). Need new SA key for hitecapp-safety for Admin SDK operations. Use `create_accounts.py` with ADC for now.
