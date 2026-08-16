# diag_projects.py Execution Result

**Total projects: 0**

## Context

The `diag_projects.py` script connects to Firebase Firestore using the service account `firebase-sa-safety.json` (project: `hitecapp-safety`) and lists all documents in the `projects` collection.

## Why 0 projects?

| Factor | Explanation |
|--------|-------------|
| **Mock mode** | App runs without `VITE_FIREBASE_API_KEY`, defaulting to client-side mock storage |
| **LocalStorage** | Projects exist in `localStorage` key `hitecmedia_mock_db`, not remote Firestore |
| **Seed flow** | Demo projects are seeded via `src/utils/dbMigrations.js` / `src/utils/seedProtection.js` on app init |
| **Remote Firebase** | The service account targets project `hitecapp-safety`, but queries the live backend which has no projects |

## Mock Store Contents (client-side)

The mock DB (`hitecmedia_mock_db`) typically contains:
- `whitelist_users`: `demo@hitec.id`, `admin@hitec.id`, `handoyo.tjung@gmail.com`
- `plan`: starter/pro configurations with max_file_size_kb limits
- `projects`: seeded demo projects (e.g., `proj_safety_demo_001` "ATEX Inspection Demo - Safety ID Plant 1")
- `photos`, `feedback`: additional collections

## Script Behavior

The script successfully executed and confirmed 0 projects exist in the remote Firestore database. This is the expected state for a mock-mode application where project management occurs through the app's initialization pipeline rather than direct Firestore operations.