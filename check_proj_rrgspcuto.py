import firebase_admin
from firebase_admin import credentials, firestore
import json

SA_KEY = "firebase-sa-safety.json"
cred = credentials.Certificate(SA_KEY)
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

doc_ref = db.collection('projects').document('proj_rrgspcuto')
doc_snap = doc_ref.get()

if doc_snap.exists:
    print("proj_rrgspcuto exists in Firestore:")
    print(json.dumps(doc_snap.to_dict(), indent=2))
else:
    print("proj_rrgspcuto does NOT exist in Firestore.")
