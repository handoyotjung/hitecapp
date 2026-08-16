# ⚠️ QUARANTINED: DANGEROUS PRODUCTION-TARGETING SCRIPTS

> **DO NOT EXECUTE ANY SCRIPT IN THIS DIRECTORY AGAINST PRODUCTION.**

## Quarantined Files
1. `cleanup_test_projects_PROD_UNSAFE.py` (formerly `cleanup_test_projects.py`):
   - Targets Firestore `projects` and `photos` collections via `firebase-sa-safety.json`.
   - Deletes all project documents matching `created_by == 'demo@hitec.id'` and all child photos.
2. `qa_mobile_test_PROD_UNSAFE.cjs` (formerly `qa_mobile_test.cjs`):
   - Launches Puppeteer against live production `https://hitecapp-safety.web.app`.
   - Logs in as `demo@hitec.id`, uploads real photos, and executes Step 10: "Delete Diagnostic Test project" via UI button on production.
3. `qa_desktop_test_PROD_UNSAFE.cjs` (formerly `qa_desktop_test.cjs`):
   - Launches Puppeteer against live production `https://hitecapp-safety.web.app`.
   - Logs in as `demo@hitec.id`, uploads real photos, and executes Step 11: "Delete Desktop QA Test project" via UI button on production.

## Action Plan for Future Execution
These scripts must remain dormant until a dedicated staging/test Firebase project (e.g. `hitecapp-safety-test`) or a local Firebase Emulator suite is configured and verified. Under no circumstances should these scripts be run against `hitecapp-safety`.
