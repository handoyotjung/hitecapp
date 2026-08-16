import firebase_admin
from firebase_admin import credentials, firestore, storage
import json

SA_KEY = "firebase-sa-safety.json"
BUCKET_NAME = "hitecapp-safety.firebasestorage.app"

cred = credentials.Certificate(SA_KEY)
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred, {'storageBucket': BUCKET_NAME})

db = firestore.client()
bucket = storage.bucket(BUCKET_NAME)

# 1. Direct Firestore count aggregation
photo_count_query = db.collection('photos').count()
photo_count_result = photo_count_query.get()
firestore_photo_count = photo_count_result[0][0].value

project_count_query = db.collection('projects').count()
project_count_result = project_count_query.get()
firestore_project_count = project_count_result[0][0].value

# 2. Get all document IDs from Firestore 'photos' collection
photos_docs = list(db.collection('photos').stream())
photos_list = [d.id for d in photos_docs]

projects_docs = list(db.collection('projects').stream())
projects_list = [d.id for d in projects_docs]

# 3. List all blobs in GCS bucket
all_blobs = list(bucket.list_blobs())
projects_prefix_blobs = list(bucket.list_blobs(prefix="projects/"))

# Group projects_prefix_blobs
valid_photo_blobs = []
other_blobs = []
for b in projects_prefix_blobs:
    parts = b.name.split('/')
    if len(parts) >= 4 and parts[3]:
        valid_photo_blobs.append(b.name)
    else:
        other_blobs.append(b.name)

print("="*60)
print("DIRECT FIRESTORE & STORAGE COUNT REPORT")
print("="*60)
print(f"Firestore db.collection('photos').count().get(): {firestore_photo_count}")
print(f"Firestore db.collection('projects').count().get(): {firestore_project_count}")
print(f"Actual Firestore 'photos' stream document count: {len(photos_list)}")
print(f"Actual Firestore 'projects' stream document count: {len(projects_list)}")
print(f"GCS Total Blobs in Entire Bucket: {len(all_blobs)}")
print(f"GCS Blobs with prefix 'projects/': {len(projects_prefix_blobs)}")
print(f"GCS Valid Photo Blobs (path depth >= 4): {len(valid_photo_blobs)}")
print(f"GCS Other Blobs under 'projects/': {len(other_blobs)}")
print("="*60)
print("\nPROJECT DOCUMENT IDS IN FIRESTORE:")
for pid in sorted(projects_list):
    # count photos belonging to this project in firestore
    p_photos = [p for p in photos_docs if p.to_dict().get('project_id') == pid]
    print(f" - Project ID: {pid} | Photo Docs in Firestore: {len(p_photos)}")

