---
description: Commit and push all changes to trigger a Cloudflare Pages deployment
---

1. Run `node .agent/scripts/db_backup_restore.cjs backup` to snapshot state before deployment.
2. Run `git status` to see what changed.
3. Run `git add .` to stage all changes.
4. Run `git commit -m "..."` with a clear, specific message summarizing what changed.
// turbo
5. Run `git push origin main`.
6. Run `node .agent/scripts/verify_deployment.cjs` to audit database connectivity, static account retention, and auth endpoint stability.
7. Confirm the push and audit succeeded, and remind me that Cloudflare Pages will automatically build and deploy this to app.hitec.id within 1–3 minutes.
