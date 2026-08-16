Run the HitecApp-Safety 10-step Puppeteer QA test and debug any failures.

## Step 1 — Run the test
```bash
cd "C:\Antigravity IDE\HitecApp\Safety" && node qa_mobile_test.cjs
```

## Step 2 — Parse results
Extract every line matching `STEP N: [PASS]` or `STEP N: [FAIL]` from the output.

## Step 3 — If all 10 steps pass
Report to Ohan:
✅ PASS (10/10) — all steps passed, no action needed.
Stop here.

## Step 4 — If any steps fail, diagnose and fix

For each failed step, apply the known fix:

**Step 7 FAIL — drag handles not found:**
- Root cause: grip handles not rendered yet when drag attempted
- Fix: in `qa_mobile_test.cjs`, increase the `waitForFunction` timeout from 8000 to 15000ms before the drag attempt
- Then re-run test

**Step 8 FAIL — Save button not found or disabled:**
- Root cause: autosave interference or isSaving branch in PublishBar
- Read `src/components/PublishBar.jsx` — check if isSaving render branch exists
- If found: remove isSaving prop, render branch, and style branch
- Build: `npm run build`
- Deploy: `firebase deploy --only hosting --project hitecapp-safety`
- Re-run test

**Step 9 FAIL — PDF/PPT/DOC disabled:**
- Root cause: isViewMode not set after Save
- Read `src/components/Dashboard.jsx` — find handleSave or PublishBar onClick
- Verify setIsViewMode(true) is called on save
- Fix if missing, build, deploy, re-run

**Step 10 FAIL — delete button not found or project still in dropdown:**
- Root cause A: Firestore rules blocking delete for demo@hitec.id
- Root cause B: handleDeleteProject not clearing localStorage cache
- Read `firestore.rules` — verify `request.auth.token.email == resource.data.created_by` branch exists
- Read `src/components/Dashboard.jsx` handleDeleteProject — verify cache-first removal
- Fix whichever is missing, deploy rules and/or hosting, re-run

**Any other step or unknown failure:**
- Do NOT attempt to fix
- Escalate to Cody with: failed step number, full error output, and which files are relevant

## Step 5 — After fix, re-run
```bash
cd "C:\Antigravity IDE\HitecApp\Safety" && node qa_mobile_test.cjs
```
Report final result to Ohan.
