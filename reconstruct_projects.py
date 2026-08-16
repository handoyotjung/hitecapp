"""
reconstruct_projects.py — Reconstructs missing Firestore project and photo documents
from intact Cloud Storage blobs in hitecapp-safety.firebasestorage.app.
Adheres strictly to ATEX compliance rules: status="pending_review", grade="unclassified".
"""

import sys
import os
import json
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore, storage

SA_KEY = "firebase-sa-safety.json"
BUCKET_NAME = "hitecapp-safety.firebasestorage.app"
PROJECT_ID = "hitecapp-safety"

if not os.path.exists(SA_KEY):
    print(f"ERROR: Service account key {SA_KEY} not found.")
    sys.exit(1)

cred = credentials.Certificate(SA_KEY)
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred, {'storageBucket': BUCKET_NAME})

db = firestore.client()
bucket = storage.bucket(BUCKET_NAME)

print(f"Connecting to Cloud Storage bucket: {BUCKET_NAME}...")
blobs = list(bucket.list_blobs(prefix="projects/"))

print(f"Total blobs found under 'projects/': {len(blobs)}")

# Group blobs by project_id
projects_map = {}

for blob in blobs:
    parts = blob.name.split('/')
    if len(parts) < 4:
        # Ignore top-level folder marker or non-photo files
        continue
    
    proj_id = parts[1]
    date_str = parts[2]
    filename = parts[3]
    
    if not filename:
        continue
        
    if proj_id not in projects_map:
        projects_map[proj_id] = []
        
    projects_map[proj_id].append({
        'blob_name': blob.name,
        'date_str': date_str,
        'filename': filename,
        'time_created': blob.time_created,
        'updated': blob.updated,
        'size': blob.size,
        'content_type': blob.content_type
    })

print(f"\nDiscovered {len(projects_map)} unique project folder(s) in Cloud Storage.\n")

results = []
total_projects_created = 0
total_photos_created = 0

for proj_id, photo_items in sorted(projects_map.items()):
    print(f"--- Processing Project: [{proj_id}] ({len(photo_items)} photo(s)) ---")
    
    # Sort photo items by time_created
    photo_items.sort(key=lambda x: x['time_created'] or datetime.min)
    oldest_time = photo_items[0]['time_created'] if photo_items else datetime.utcnow()
    newest_time = photo_items[-1]['updated'] or photo_items[-1]['time_created'] if photo_items else datetime.utcnow()
    
    # Check if project doc exists
    proj_ref = db.collection('projects').document(proj_id)
    proj_snap = proj_ref.get()
    
    proj_doc_created = False
    if not proj_snap.exists:
        proj_data = {
            "id": proj_id,
            "name": f"Reconstructed Project ({proj_id})",
            "company_id": "co_hitec",
            "created_by": "demo@hitec.id",
            "created_at": oldest_time.isoformat() if hasattr(oldest_time, 'isoformat') else str(oldest_time),
            "updated_at": newest_time.isoformat() if hasattr(newest_time, 'isoformat') else str(newest_time),
            "status": "reconstructed",
            "photos": []
        }
        proj_ref.set(proj_data)
        proj_doc_created = True
        total_projects_created += 1
        print(f"  [+] Created Firestore Project doc: {proj_id}")
    else:
        print(f"  [i] Project doc already exists: {proj_id}")
    
    created_photo_ids = []
    
    for item in photo_items:
        clean_fn = item['filename'].replace('.', '_').replace('/', '_')
        photo_id = f"{proj_id}_{clean_fn}"
        encoded_blob_name = item['blob_name'].replace('/', '%2F')
        url = f"https://firebasestorage.googleapis.com/v0/b/{BUCKET_NAME}/o/{encoded_blob_name}?alt=media"
        
        photo_ref = db.collection('photos').document(photo_id)
        photo_data = {
            "id": photo_id,
            "project_id": proj_id,
            "company_id": "co_hitec",
            "filename": item['filename'],
            "url": url,
            "uploaded_by": "demo@hitec.id",
            "upload_date": item['date_str'],
            "status": "pending_review",
            "created_at": item['time_created'].isoformat() if hasattr(item['time_created'], 'isoformat') else str(item['time_created']),
            "caption": "",
            "grade": "unclassified",
            "rekomendasi": "[AUTO-RECONSTRUCTED] Pending lead assessor manual review."
        }
        photo_ref.set(photo_data, merge=True)
        created_photo_ids.append(photo_id)
        total_photos_created += 1
        
    print(f"  [+] Reconstructed {len(created_photo_ids)} photo doc(s) for project [{proj_id}]")
    
    results.append({
        "project_id": proj_id,
        "project_created": proj_doc_created,
        "photo_count": len(created_photo_ids),
        "photo_ids": created_photo_ids
    })

print("\n" + "="*70)
print(f"RECONSTRUCTION COMPLETE: {total_projects_created} Projects Created/Updated, {total_photos_created} Photos Reconstructed")
print("="*70)
print(json.dumps(results, indent=2))
