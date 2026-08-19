---
description: Run automated Tri-Mode UI tests (Desktop QA, Mobile QA, and Cross-Device Real-Time Sync) on localhost using Chrome (Puppeteer).
---

## Automated Test Workflow

1. **Ensure the dev server is running.** Check with `manage_task list`. If it is not running, start it in the background:
   ```
   npm.cmd run dev
   ```
   Wait ~3 seconds for `http://localhost:5173` to be ready.

2. **Run the automated Puppeteer test script** against `http://localhost:5173`:
   ```
   node .agent/scripts/verify_ui.cjs --mode=all
   ```
   *(Or target individual suites: `node .agent/scripts/verify_ui.cjs --mode=desktop`, `--mode=mobile`, or `--mode=sync`)*

   This executes:
   - **🖥️ Suite A (Desktop QA - 1440x900)**: Login, sandboxed project creation, photo upload, 2-column editor verification, footer vertical alignment ($\le 2\text{px}$), caption/comments decoupling, and multiline textarea auto-height.
   - **📱 Suite B (Mobile QA - 390x844)**: Mobile login, zero horizontal overflow check, mobile responsive card stream, header collapse toggle, and inline photo card editing.
   - **🔄 Suite C (Cross-Device Sync)**: Dual incognito contexts (Desktop + Mobile) sharing the same sandboxed account (`[QA_SANDBOX_AUTOMATION]`). Verifies real Firestore presence (fails if Mock Mode), asserts new project appears on mobile list within timeout, verifies initial caption match, edits on mobile, and asserts desktop `onSnapshot` listener receives the edit in real time without manual reload.

3. **Report the results.** Read the console output matrix and `report.json`, then present a summary table showing ✅/❌ for each checkpoint. Screenshots are saved to `.agent/test-screenshots/` (segregated into `desktop/`, `mobile/`, and `sync/`).

4. **If any checks fail**, diagnose and fix the issue, then re-run `/test` to confirm.

### Notes
- Target base URL: `http://localhost:5173`
- Script path: `.agent/scripts/verify_ui.cjs`
- Screenshots path: `.agent/test-screenshots/{desktop,mobile,sync}/`
- Report path: `.agent/test-screenshots/report.json`
- Exit code 0 = all passed, exit code 1 = one or more failed.
