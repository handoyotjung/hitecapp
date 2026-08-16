Review latest user feedback and propose fixes.

## Step 1 — Fetch latest feedback
```bash
cd "C:\Antigravity IDE\HitecApp\Safety" && python fetch_feedback.py
```

## Step 2 — Fetch last 10 days history
Run a Python one-liner to query ALL feedback from the last 10 days (deduplicated):
```bash
cd "C:\Antigravity IDE\HitecApp\Safety" && python -c "
import json
from datetime import datetime, timezone, timedelta
from firebase_admin import firestore, initialize_app, credentials
try:
    cred = credentials.Certificate('C:/Antigravity IDE/HitecApp/Safety/firebase-sa-safety.json')
    initialize_app(cred)
except ValueError:
    pass
db = firestore.client()
now = datetime.now(timezone.utc)
start = now - timedelta(days=10)
docs = db.collection('feedback').where('timestamp', '>=', start.isoformat()).order_by('timestamp').stream()
results = []
seen = set()
for doc in docs:
    data = doc.to_dict()
    key = (data.get('timestamp',''), data.get('userEmail',''))
    if key in seen:
        continue
    seen.add(key)
    data['id'] = doc.id
    results.append(data)
print(json.dumps({'count': len(results), 'period': f'{start.strftime(\"%Y-%m-%d\")} to {now.strftime(\"%Y-%m-%d\")}', 'feedback': results}, indent=2, ensure_ascii=False, default=str))
"
```

## Step 3 — Present summary

Format results as a summary table (deduplicated):

**Feedback History — Last 10 Days**

**Total**: X submissions (Y unique after dedup)
**User(s)**: list unique emails and plan tiers
**Date range**: YYYY-MM-DD to YYYY-MM-DD

| # | Time | Severity | Summary | Action Taken |
|---|------|----------|---------|--------------|
| 1 | HH:MM | OK/HIGH/MED | one-line description | None needed / FIXED / Feature request noted |

**Observations:**
- Note any duplicates, patterns, or recurring issues
- Note any feature requests mentioned but not flagged as issues
- Note which bugs have been fixed and which are still open

## Step 4 — For HIGH/MEDIUM issues not yet fixed

Investigate each unfixed issue:
1. Identify the relevant component/screen
2. Search the codebase for the root cause
3. Propose a fix with an Anti prompt (in a fenced code snippet)

## Step 5 — Report

End with a clear summary:
- How many issues found vs fixed
- Any feature requests to consider for backlog
- Any patterns (same user, same screen, recurring problems)
