"""
fetch_feedback.py — reads user feedback from Firestore and prints a structured report.
Usage: python fetch_feedback.py [--limit N] [--json]
"""
import json
import sys
import argparse
from datetime import datetime

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except ImportError:
    print("ERROR: firebase-admin not installed. Run: pip install firebase-admin")
    sys.exit(1)

def init(sa_key):
    if not firebase_admin._apps:
        cred = credentials.Certificate(sa_key)
        firebase_admin.initialize_app(cred)
    return firestore.client()

def fetch(db, limit):
    docs = (
        db.collection("feedback")
        .order_by("created_at", direction=firestore.Query.DESCENDING)
        .limit(limit)
        .stream()
    )
    return [{"_doc_id": d.id, **d.to_dict()} for d in docs]

def print_report(entries):
    print(f"\n{'='*60}")
    print(f"  HITECAPP FEEDBACK — {len(entries)} entries (newest first)")
    print(f"{'='*60}\n")
    for i, e in enumerate(entries, 1):
        ts = e.get("created_at", e.get("timestamp", "unknown"))
        try:
            ts = datetime.fromisoformat(ts.replace("Z", "+00:00")).strftime("%Y-%m-%d %H:%M")
        except Exception:
            pass
        print(f"[{i}] {ts}  |  {e.get('userEmail','?')}  |  {e.get('planTier','?')}")
        print(f"    TITLE   : {e.get('title','—')}")
        print(f"    SUMMARY : {e.get('summary','—')}")
        issues = e.get("issues", [])
        if issues:
            print(f"    ISSUES  :")
            for iss in issues:
                print(f"      • {iss}")
        reqs = e.get("feature_requests", [])
        if reqs:
            print(f"    REQUESTS:")
            for r in reqs:
                print(f"      • {r}")
        note = e.get("satisfaction_note", "")
        if note:
            print(f"    SENTIMENT: {note}")
        print()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=20, help="Max entries to fetch (default 20)")
    parser.add_argument("--json", action="store_true", help="Print raw JSON instead of formatted report")
    parser.add_argument("--sa", default="firebase-sa-safety.json", help="Path to service account JSON (default: firebase-sa-safety.json)")
    args = parser.parse_args()

    db = init(args.sa)
    entries = fetch(db, args.limit)

    if args.json:
        print(json.dumps(entries, indent=2, default=str))
    else:
        print_report(entries)
