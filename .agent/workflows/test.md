---
description: Run automated UI tests on localhost using Chrome (Puppeteer). Verifies login, project creation, photo upload, two-column editor, footer alignment, caption/comments decoupling, and textarea auto-height.
---

## Automated Test Workflow

1. **Ensure the dev server is running.** Check with `manage_task list`. If it is not running, start it in the background:
   ```
   npm.cmd run dev
   ```
   Wait ~3 seconds for `http://localhost:5173` to be ready.

2. **Run the automated Puppeteer test script** against `http://localhost:5173`:
   ```
   node .agent/scripts/verify_ui.cjs
   ```
   This will open a **visible Chrome window** and automatically:
   - Log in with mock credentials
   - Force **Desktop view mode** via localStorage
   - Fill Company / City fields and create a test project
   - Upload a test photo and wait for upload to complete
   - Verify the two-column editor opens
   - Measure left/right **footer vertical alignment** (must be ≤ 2px diff)
   - Check **COMMENTS textarea is blank** by default
   - Test that **Caption and Comments are decoupled** (changes don't cross-bind)
   - Verify **COMMENTS textarea auto-resizes** when content grows

3. **Report the results.** Read the console output and `report.json`, then present a summary table showing ✅/❌ for each check. Screenshots are saved to `.agent/test-screenshots/`.

4. **If any checks fail**, diagnose and fix the issue, then re-run `/test` to confirm.

### Notes
- The 404 errors in console are expected (dev mode has no `/api/project` endpoint) — they do **not** affect test validity.
- Script path: `.agent/scripts/verify_ui.cjs`
- Screenshots path: `.agent/test-screenshots/`
- Exit code 0 = all passed, exit code 1 = one or more failed.
