# QUARANTINED COPY — DO NOT RUN AGAINST PRODUCTION
import firebase_admin
from firebase_admin import credentials, firestore
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--sa', default='firebase-sa-safety.json')
parser.add_argument('--dry-run', action='store_true', help='Print what would be deleted without deleting')
parser.add_argument('--email', default='demo@hitec.id')
parser.add_argument('--name-contains', default='', help='Only delete projects whose name contains this string')
args = parser.parse_args()

cred = credentials.Certificate(args.sa)
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)
db = firestore.client()

# Find projects created by the target email
projects_ref = db.collection('projects')
query = projects_ref.where('created_by', '==', args.email.lower())
docs = list(query.stream())

to_delete = []
for d in docs:
    data = d.to_dict()
    name = data.get('name', '')
    if args.name_contains and args.name_contains.lower() not in name.lower():
        continue
    to_delete.append((d.id, name))

print(f"\nFound {len(to_delete)} project(s) for {args.email}" +
      (f" matching '{args.name_contains}'" if args.name_contains else "") + ":\n")
for pid, name in to_delete:
    print(f"  [{pid}] {name}")

if not to_delete:
    print("Nothing to delete.")
    exit(0)

if args.dry_run:
    print("\n-- DRY RUN: nothing deleted --")
    exit(0)

confirm = input(f"\nDelete all {len(to_delete)} project(s) and their photos? (yes/no): ").strip().lower()
if confirm != 'yes':
    print("Aborted.")
    exit(0)

deleted_projects = 0
deleted_photos = 0

for pid, name in to_delete:
    # Delete photos belonging to this project
    photos = list(db.collection('photos').where('project_id', '==', pid).stream())
    for ph in photos:
        ph.reference.delete()
        deleted_photos += 1
    # Delete the project
    db.collection('projects').document(pid).delete()
    deleted_projects += 1
    print(f"  Deleted project [{pid}] '{name}' + {len(photos)} photo(s)")

print(f"\nDone. Deleted {deleted_projects} project(s), {deleted_photos} photo(s).")
