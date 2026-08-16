Run the HitecApp-Safety 11-step Puppeteer QA test in Desktop mode and debug any failures.

## Step 1 — Run the test
```bash
cd "C:\Antigravity IDE\HitecApp\Safety" && node qa_desktop_test.cjs
```

## Step 2 — Parse results
Extract every line matching `STEP N: [PASS]` or `STEP N: [FAIL]` from the output.

## Step 3 — If all 11 steps pass
Report to Ohan:
✅ PASS (11/11) — all desktop steps passed, no action needed.
Stop here.

## Step 4 — If any steps fail, diagnose and fix

**Step 1 FAIL — Desktop radio not found:**
- Check login page for Desktop/Mobile toggle selector
- Read `src/components/Header.jsx` or login component for the radio input value
- Fix selector in `qa_desktop_test.cjs`

**Step 5 FAIL — Desktop layout not detected:**
- Root cause: app may be rendering mobile layout at 1440px width
- Read `src/components/Dashboard.jsx` — check responsive breakpoint logic for desktop view
- Verify `isDesktop` or `viewMode === 'desktop'` conditional renders the sidebar/two-panel layout
- Fix layout rendering, build, deploy

**Step 7 FAIL — AI Assessor fields not visible:**
- Root cause: observation/recommendation fields may be hidden or collapsed in desktop mode
- Read `src/components/Dashboard.jsx` or `src/components/PhotoItem.jsx`
- Check if assessor fields are gated behind a toggle or collapsed by default on desktop
- Fix visibility, build, deploy

**Step 10 FAIL — PDF/PPT/DOC disabled:**
- Root cause: isViewMode not set after Save, or PublishBar not rendering in desktop layout
- Read `src/components/PublishBar.jsx` — verify it renders in desktop mode
- Verify `setIsViewMode(true)` is called on save
- Fix if missing, build, deploy, re-run

**Step 11 FAIL — Delete button not found:**
- Same fix as mobile Step 10 — check Firestore rules and handleDeleteProject cache removal
- Read `firestore.rules` and `src/components/Dashboard.jsx` handleDeleteProject

**Any other failure:**
- Do NOT attempt to fix
- Escalate to Cody with: failed step number, full error output, relevant files

## Step 5 — After fix, re-run
```bash
cd "C:\Antigravity IDE\HitecApp\Safety" && node qa_desktop_test.cjs
```
Report final result to Ohan.
