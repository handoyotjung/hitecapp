import io
import os
import datetime
from datetime import timedelta
from firebase_functions import https_fn, storage_fn, scheduler_fn
from firebase_admin import initialize_app, firestore, storage
import google.cloud.bigquery as bigquery
from pptx import Presentation
from pptx.util import Inches, Pt
from PIL import Image
import pandas as pd
import requests

# Initialize Firebase Admin SDK
firebase_app = initialize_app()
db = firestore.client()

def get_company_plan_limits(user_email):
    """Retrieve company plan limits (max_daily, max_kb) based on whitelist_users email."""
    try:
        user_ref = db.collection('whitelist_users').document(user_email.lower())
        user_snap = user_ref.get()
        if user_snap.exists:
            user_data = user_snap.to_dict()
            plan_name = user_data.get('plan', 'starter')
            
            plan_snap = db.collection('plan').document(plan_name).get()
            if plan_snap.exists:
                plan_data = plan_snap.to_dict()
                return {
                    'max_daily': plan_data.get('max_daily_photos', 300 if plan_name == 'pro' else 100),
                    'max_kb': plan_data.get('max_file_size_kb', 1024 if plan_name == 'pro' else 300)
                }
            return {
                'max_daily': 300 if plan_name == 'pro' else 100,
                'max_kb': 1024 if plan_name == 'pro' else 300
            }
    except Exception as e:
        print(f"Error checking plan limits: {e}")
    return {'max_daily': 100, 'max_kb': 300}  # Starter fallback

@https_fn.on_call()
def validateUpload(req: https_fn.CallableRequest) -> dict:
    """HTTPS Callable for client-side fast verification of files before upload."""
    if not req.auth:
        return {"error": "UNAUTHENTICATED"}
    
    data = req.data
    company_id = data.get('company_id')
    size_kb = data.get('size_kb', 0)
    
    if not company_id:
        return {"error": "MISSING_COMPANY_ID"}

    user_email = req.auth.token.get('email', '')
    limits = get_company_plan_limits(user_email)
    
    # 1. Size check
    if size_kb > limits['max_kb']:
        return {"error": "FILE_TOO_LARGE"}

    # 2. Daily count check
    today_str = datetime.date.today().isoformat()
    photos_ref = db.collection('photos')
    query_photos = photos_ref.where('company_id', '==', company_id) \
                             .where('upload_date', '==', today_str) \
                             .where('status', '==', 'done')
    
    # Perform count
    count = len(query_photos.get())
    if count >= limits['max_daily']:
        return {"error": "DAILY_LIMIT_REACHED"}
        
    return {"valid": True}

@https_fn.on_call()
def getSignedUploadUrl(req: https_fn.CallableRequest) -> dict:
    """
    Returns a short-lived GCS Signed URL for direct browser PUT upload.
    The client browser PUTs the image binary directly to GCS, bypassing
    Firebase Functions middleware entirely for maximum throughput.

    Input:  { gcs_path: str, content_type: str }
    Output: { signed_url: str }
    """
    if not req.auth:
        return {"error": "UNAUTHENTICATED"}

    data = req.data
    gcs_path = data.get('gcs_path', '')
    content_type = data.get('content_type', 'image/jpeg')

    if not gcs_path or not gcs_path.startswith('projects/'):
        return {"error": "INVALID_GCS_PATH"}

    try:
        bucket = storage.bucket()
        blob = bucket.blob(gcs_path)

        # Generate a PUT signed URL valid for 15 minutes
        signed_url = blob.generate_signed_url(
            expiration=datetime.timedelta(minutes=15),
            method='PUT',
            content_type=content_type,
            version='v4'
        )
        return {"signed_url": signed_url}
    except Exception as e:
        print(f"Error generating signed URL: {e}")
        return {"error": "SIGNED_URL_GENERATION_FAILED", "detail": str(e)}

@storage_fn.on_object_finalized()
def onPhotoUpload(event: storage_fn.StorageEvent) -> None:
    """Authoritative trigger checking uploads inside GCS projects/ paths."""
    path = event.data.name
    if not path.startswith('projects/'):
        return

    # Parse projects/{project_id}/{date}/{filename}
    parts = path.split('/')
    if len(parts) < 4:
        return
        
    project_id = parts[1]
    date_str = parts[2]
    filename = parts[3]

    # Clean extension & name
    extension = filename.split('.')[-1].lower() if '.' in filename else ''
    allowed_types = ['jpeg', 'jpg', 'png', 'gif']
    mime_type = event.data.content_type or ''

    # Get corresponding photo doc from Firestore
    photo_id = f"{project_id}_{filename.replace('.', '_')}"
    photo_ref = db.collection('photos').document(photo_id)
    photo_snap = photo_ref.get()

    photo_data = {}
    if photo_snap.exists:
        photo_data = photo_snap.to_dict()
    
    company_id = photo_data.get('company_id', 'default_company')
    uploaded_by = photo_data.get('uploaded_by', '')

    # Fetch limits
    limits = get_company_plan_limits(uploaded_by)

    rejection_reason = None

    # Check 1: Extension/MIME check
    if extension not in allowed_types or not mime_type.startswith('image/'):
        rejection_reason = "UNSUPPORTED_FILE_TYPE"
    
    # Check 2: Size check (event.data.size is in bytes)
    size_kb = event.data.size / 1024
    if not rejection_reason and size_kb > limits['max_kb']:
        rejection_reason = "FILE_TOO_LARGE"

    # Check 3: Daily count check
    if not rejection_reason:
        photos_ref = db.collection('photos')
        query_photos = photos_ref.where('company_id', '==', company_id) \
                                 .where('upload_date', '==', date_str) \
                                 .where('status', '==', 'done')
        
        count = len(query_photos.get())
        if count >= limits['max_daily']:
            rejection_reason = "DAILY_LIMIT_REACHED"

    # Handle rejection vs success
    bucket = storage.bucket(event.data.bucket)
    if rejection_reason:
        # Delete invalid file from Storage
        try:
            blob = bucket.blob(path)
            blob.delete()
        except Exception as e:
            print(f"Error deleting invalid storage object: {e}")

        # Update or create Firestore doc as rejected
        photo_ref.set({
            'id': photo_id,
            'project_id': project_id,
            'company_id': company_id,
            'filename': filename,
            'status': 'rejected',
            'reason': rejection_reason,
            'upload_date': date_str,
            'uploaded_by': uploaded_by,
            'updated_at': datetime.datetime.utcnow().isoformat()
        }, merge=True)
    else:
        # Update Firestore doc as done
        photo_ref.set({
            'status': 'done',
            'size_kb': size_kb,
            'updated_at': datetime.datetime.utcnow().isoformat()
        }, merge=True)

@https_fn.on_call()
def exportPPTX(req: https_fn.CallableRequest) -> dict:
    """Generates PowerPoint presentation with photos and captions. Returns 24-hr GCS Signed URL."""
    if not req.auth:
        return {"error": "UNAUTHENTICATED"}

    data = req.data
    project_id = data.get('project_id')
    if not project_id:
        return {"error": "MISSING_PROJECT_ID"}

    # Query all completed photos in this project
    photos_ref = db.collection('photos')
    query_photos = photos_ref.where('project_id', '==', project_id).where('status', '==', 'done').get()
    
    # Initialize Presentation
    prs = Presentation()
    prs.slide_width = Inches(10)
    prs.slide_height = Inches(5.625) # 16:9 layout
    
    bucket = storage.bucket()

    for photo_doc in query_photos:
        p_data = photo_doc.to_dict()
        gcs_path = p_data.get('gcs_path')
        caption = p_data.get('caption', '')

        # Download photo to memory buffer
        try:
            blob = bucket.blob(gcs_path)
            img_bytes = blob.download_as_bytes()
            img_stream = io.BytesIO(img_bytes)

            # Open image with Pillow to determine original aspect ratio
            img = Image.open(img_stream)
            img_w, img_h = img.size
            img_aspect = img_w / img_h

            # Max box limits (90% slide size)
            max_w = Inches(9.0)
            max_h = Inches(4.5)
            max_aspect = 9.0 / 4.5

            if img_aspect > max_aspect:
                # Width limited
                fit_w = max_w
                fit_h = max_w / img_aspect
            else:
                # Height limited
                fit_h = max_h
                fit_w = max_h * img_aspect

            # Centering coordinates
            left = (prs.slide_width - fit_w) / 2
            top = (prs.slide_height - fit_h - Inches(0.5)) / 2 # Leave space at bottom for text
            if top < Inches(0.2):
                top = Inches(0.2)

            # Add blank slide
            slide = prs.slides.add_slide(prs.slide_layouts[6])
            
            # Place image
            img_stream.seek(0)
            slide.shapes.add_picture(img_stream, left, top, width=fit_w, height=fit_h)

            # Add caption text box
            txBox = slide.shapes.add_textbox(Inches(0.5), prs.slide_height - Inches(0.6), Inches(9.0), Inches(0.4))
            tf = txBox.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.text = caption if caption else "No Caption"
            p.font.name = 'Arial'
            p.font.size = Pt(14)
            p.alignment = 1 # Center align
        except Exception as e:
            print(f"Skipping image {gcs_path} due to error: {e}")

    # Save PowerPoint to GCS Exports folder
    pptx_io = io.BytesIO()
    prs.save(pptx_io)
    pptx_io.seek(0)

    export_path = f"exports/{project_id}_report.pptx"
    export_blob = bucket.blob(export_path)
    export_blob.upload_from_file(pptx_io, content_type='application/vnd.openxmlformats-officedocument.presentationml.presentation')

    # Generate 24-hr GCS Signed URL
    signed_url = export_blob.generate_signed_url(
        expiration=datetime.timedelta(hours=24),
        method='GET'
    )

    return {"downloadUrl": signed_url}

@https_fn.on_call()
def exportXLSX(req: https_fn.CallableRequest) -> dict:
    """Queries BigQuery table and creates Excel report of photos. Returns 24-hr GCS Signed URL."""
    if not req.auth:
        return {"error": "UNAUTHENTICATED"}

    data = req.data
    project_id = data.get('project_id')
    if not project_id:
        return {"error": "MISSING_PROJECT_ID"}

    rows = []
    
    # 1. Try querying BigQuery first (as requested)
    try:
        bq_client = bigquery.Client()
        # Query photos from mediaflow.photos (populated by Firebase BigQuery Sync Extension)
        # We look up photos synced from Firestore for this project_id
        query_str = """
            SELECT 
              JSON_VALUE(data, '$.filename') as filename,
              JSON_VALUE(data, '$.caption') as caption
            FROM `mediaflow.photos_raw_latest` 
            WHERE JSON_VALUE(data, '$.project_id') = @project_id
        """
        job_config = bigquery.QueryJobConfiguration(
            query_parameters=[
                bigquery.ScalarQueryParameter("project_id", "STRING", project_id)
            ]
        )
        query_job = bq_client.query(query_str, job_config=job_config)
        results = query_job.result()
        
        for r in results:
            rows.append({
                'Photo Filename': r.filename,
                'Caption': r.caption or ''
            })
    except Exception as bq_err:
        print(f"BigQuery query failed, falling back to Firestore: {bq_err}")
        # 2. Fallback to Firestore (fail-safe for local emulator or unconfigured BQ setup)
        photos_ref = db.collection('photos')
        query_photos = photos_ref.where('project_id', '==', project_id).where('status', '==', 'done').get()
        for doc_snap in query_photos:
            p_data = doc_snap.to_dict()
            rows.append({
                'Photo Filename': p_data.get('filename'),
                'Caption': p_data.get('caption', '')
            })

    # Build spreadsheet rows
    df_rows = []
    for idx, r in enumerate(rows, 1):
        df_rows.append({
            'No': idx,
            'Photo Filename': r['Photo Filename'],
            'Caption': r['Caption']
        })

    if not df_rows:
        df_rows = [{'No': '', 'Photo Filename': 'No data found', 'Caption': ''}]

    df = pd.DataFrame(df_rows)

    # Save to Excel bytes buffer using openpyxl engine
    excel_io = io.BytesIO()
    with pd.ExcelWriter(excel_io, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Photos Report')
    excel_io.seek(0)

    bucket = storage.bucket()
    export_path = f"exports/{project_id}_report.xlsx"
    export_blob = bucket.blob(export_path)
    export_blob.upload_from_file(excel_io, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

    # Generate 24-hr GCS Signed URL
    signed_url = export_blob.generate_signed_url(
        expiration=datetime.timedelta(hours=24),
        method='GET'
    )

    return {"downloadUrl": signed_url}

@scheduler_fn.on_schedule(schedule="every 24 hours")
def cleanup_exports(event: scheduler_fn.ScheduledEvent) -> None:
    """Cloud Scheduler job deleting export blobs older than 24 hours."""
    bucket = storage.bucket()
    blobs = bucket.list_blobs(prefix="exports/")
    
    now = datetime.datetime.now(datetime.timezone.utc)
    expiration_limit = timedelta(hours=24)

    for blob in blobs:
        # Ignore prefix folder itself
        if blob.name == "exports/":
            continue
            
        time_created = blob.time_created
        if now - time_created > expiration_limit:
            try:
                blob.delete()
                print(f"Deleted expired export blob: {blob.name}")
            except Exception as e:
                print(f"Failed to delete expired export blob {blob.name}: {e}")
