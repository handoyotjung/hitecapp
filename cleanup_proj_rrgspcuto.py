import firebase_admin
from firebase_admin import credentials, firestore

SA_KEY = "firebase-sa-safety.json"
cred = credentials.Certificate(SA_KEY)
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

doc_ref = db.collection('projects').document('proj_rrgspcuto')
doc_ref.delete()
print("Cleaned up leftover test project document: proj_rrgspcuto")
