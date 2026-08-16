import firebase_admin
from firebase_admin import credentials, firestore, storage

SA_KEY = "firebase-sa-safety.json"
BUCKET_NAME = "hitecapp-safety.firebasestorage.app"

cred = credentials.Certificate(SA_KEY)
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred, {'storageBucket': BUCKET_NAME})

db = firestore.client()
bucket = storage.bucket(BUCKET_NAME)

blobs = list(bucket.list_blobs(prefix="projects/"))
photos_docs = {d.id: d.to_dict() for d in db.collection('photos').stream()}

unmatched_blobs = []
for b in blobs:
    parts = b.name.split('/')
    if len(parts) >= 4 and parts[3]:
        proj_id = parts[1]
        filename = parts[3]
        clean_fn = filename.replace('.', '_').replace('/', '_')
        photo_id = f"{proj_id}_{clean_fn}"
        if photo_id not in photos_docs:
            unmatched_blobs.append({'blob': b.name, 'expected_id': photo_id})

print("Unmatched GCS blobs:", len(unmatched_blobs))
for u in unmatched_blobs:
    print(u)
