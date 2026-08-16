import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate('firebase-sa-safety.json')
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)
db = firestore.client()

docs = list(db.collection('projects').stream())
print(f"\nTotal projects: {len(docs)}\n")
for d in docs:
    data = d.to_dict()
    print(f"  [{d.id}]  name={data.get('name','')!r}  created_by={data.get('created_by','')!r}  company_id={data.get('company_id','')!r}  userId={data.get('userId','')!r}")
