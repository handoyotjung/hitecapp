TICKET DOC-3b-apply: apply Claude's ready-made patch (no coding needed)

Claude already wrote, tested (28 PASS) and visually verified the DOC-3b fixes. Your job is only to apply, verify, and push.
SKILLS: none needed. /caveman for the report. Do NOT edit js/invoices.js by hand, and do NOT touch data/erp_master_data.json.

1. Download the patch into the ERP folder:
   Invoke-WebRequest -Uri "https://raw.githubusercontent.com/handoyotjung/hitecapp/claude/hopeful-pasteur-iryirf/pdf_out/DOC-3b.patch" -OutFile scratch\DOC-3b.patch
2. Apply it on top of 8c400fe (the patch's paths are relative to the ERP folder):
   - From the monorepo root: git apply --check --directory=HitecERP-dashboard HitecERP-dashboard/scratch/DOC-3b.patch
   - If the check is clean: git am --directory=HitecERP-dashboard HitecERP-dashboard/scratch/DOC-3b.patch   (keeps Claude's commit message)
   - If the check fails: STOP and paste the error. Don't hand-merge.
3. node tests/invoices/test_doc3.js  -> must print "28 PASS, 0 FAIL".
4. Bump the ?v= cache-buster to the new short hash, and commit as "chore: bump cache-buster for DOC-3b".
5. Delete scratch\DOC-3b.patch, then check that git status --short is empty.
6. bash tools/backup_push.sh doc-3-done   (the tag must exist on GitHub afterwards: git ls-remote --tags hitecerp-backup | findstr doc-3)
FINAL REPORT in one fenced block: git am output, test_doc3 result line, the 2 commit hashes, git status --short, backup_push output, and the ls-remote tag line.
