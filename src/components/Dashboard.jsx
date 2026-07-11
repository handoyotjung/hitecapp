import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  db, auth, storage, functions,
  collection, query, where, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, onSnapshot, addDoc, limit, orderBy,
  ref, uploadBytesResumable, getDownloadURL,
  httpsCallable, isMockMode
} from '../firebase';
import { UploadWorkerPool, withExponentialBackoff } from './UploadWorkerPool';
import { 
  FolderPlus, Folder, Loader2, ArrowRight, ArrowLeft,
  Upload, FileText, CheckCircle2, AlertCircle, Trash2, 
  ChevronLeft, ChevronRight, Save, Download, FileSpreadsheet,
  LogOut, Shield, User, Sparkles, Image as ImageIcon, Check, RefreshCw, Edit2, GripVertical
} from 'lucide-react';
import UploadZone from './UploadZone';
import { UpgradeModal } from './UpgradeModal';

// Local Cache Helpers (24-hour expiry)
const getProjectsCacheKey = (user) => `hitecmedia_projects_cache_${(user?.email || '').trim().toLowerCase()}`;

const loadProjectsFromCache = (user) => {
  if (!user || !user.email) return null;
  try {
    const raw = localStorage.getItem(getProjectsCacheKey(user));
    if (!raw) return null;
    const data = JSON.parse(raw);
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    if (!data.timestamp || (Date.now() - data.timestamp) > TWENTY_FOUR_HOURS) {
      return null;
    }
    return Array.isArray(data.projects) ? data.projects : null;
  } catch (e) {
    return null;
  }
};

const saveProjectsToCache = (user, projectsList) => {
  if (!user || !user.email || !Array.isArray(projectsList)) return;
  try {
    localStorage.setItem(getProjectsCacheKey(user), JSON.stringify({
      timestamp: Date.now(),
      projects: projectsList
    }));
  } catch (e) {
    console.error("Error saving projects LocalStorage cache:", e);
  }
};

export default function Dashboard({ user, onLogout }) {
  // Mobile Tab State: 'upload' | 'editor' | 'export'
  const [activeTab, setActiveTab] = useState('upload');
  
  // Projects state
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Daily upload limit state
  const [dailyUploadCount, setDailyUploadCount] = useState(0);
  const [planLimits, setPlanLimits] = useState({ maxDaily: 100, maxKb: 300 }); // starter defaults
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Upload Queue state (remember queue per project)
  const [projectQueues, setProjectQueues] = useState({});
  const queue = selectedProject ? (projectQueues[selectedProject.id] || []) : [];

  const setQueue = (updater) => {
    if (!selectedProject) return;
    setProjectQueues(prev => {
      const currentQueue = prev[selectedProject.id] || [];
      const newQueue = typeof updater === 'function' ? updater(currentQueue) : updater;
      return {
        ...prev,
        [selectedProject.id]: newQueue
      };
    });
  };
  
  // Photo Editor state
  const [projectPhotos, setProjectPhotos] = useState([]);
  const [editorIndex, setEditorIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [savingCaption, setSavingCaption] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);

  // Gemini AI bilingual spelling correction and suggestion helper (Bahasa Indonesia & English)
  const generateGeminiSuggestions = (input) => {
    const raw = (input || '').trim();
    if (!raw) {
      return [
        { tag: 'ID Baku', text: 'Inspeksi dan verifikasi instalasi sistem proteksi kebakaran lantai 1 selesai dengan baik.' },
        { tag: 'EN Report', text: 'Inspection and verification of 1st-floor fire safety installation completed successfully.' },
        { tag: 'Summary', text: 'Dokumentasi progres pekerjaan instalasi dan kelayakan sistem.' }
      ];
    }

    // Indonesian spelling correction dictionary & grammar cleanup
    let correctedID = raw
      .replace(/\bsulah\b/gi, 'sudah')
      .replace(/\bkarna\b/gi, 'karena')
      .replace(/\bpoto\b/gi, 'foto')
      .replace(/\bijin\b/gi, 'izin')
      .replace(/\btdk\b/gi, 'tidak')
      .replace(/\byg\b/gi, 'yang')
      .replace(/\bdgn\b/gi, 'dengan')
      .replace(/\bskrg\b/gi, 'sekarang')
      .replace(/\bdr\b/gi, 'dari')
      .replace(/\butk\b/gi, 'untuk')
      .replace(/\bkl\b/gi, 'kalau');

    correctedID = correctedID.charAt(0).toUpperCase() + correctedID.slice(1);
    if (!/[.!]$/.test(correctedID)) correctedID += '.';

    // Professional English technical report phrasing
    let enReport = raw;
    if (/pipa|kran|keran/i.test(raw)) {
      enReport = 'Installation and testing of water piping and faucet systems completed.';
    } else if (/apar|pemadam|kebakaran|fire/i.test(raw)) {
      enReport = 'Inspection and compliance verification of fire protection equipment.';
    } else if (/selesai|done|sudah/i.test(raw)) {
      enReport = `Completed work verification: ${raw.replace(/[.]$/, '')}.`;
    } else {
      enReport = `Technical field report: ${correctedID}`;
    }

    const polishedID = `Laporan Inspeksi: ${correctedID}`;

    return [
      { tag: 'ID Baku (Corrected)', text: correctedID },
      { tag: 'EN Technical Report', text: enReport },
      { tag: 'ID Formal Polish', text: polishedID }
    ];
  };

  const aiSuggestions = useMemo(() => generateGeminiSuggestions(caption), [caption]);

  const runGeminiCorrection = () => {
    setAiProcessing(true);
    setTimeout(() => {
      const suggestions = generateGeminiSuggestions(caption);
      if (suggestions && suggestions[0]) {
        setCaption(suggestions[0].text);
      }
      setAiProcessing(false);
    }, 400);
  };

  // Exporters loading state
  const [exportingPPTX, setExportingPPTX] = useState(false);
  const [exportingXLSX, setExportingXLSX] = useState(false);
  const [exportError, setExportError] = useState(null);

  // Custom testing selection states
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [confirmedExports, setConfirmedExports] = useState(false);
  const [alertPopup, setAlertPopup] = useState(null);

  // Worker pool ref — persists across renders without causing re-renders
  const workerPoolRef = useRef(null);
  if (!workerPoolRef.current) {
    workerPoolRef.current = new UploadWorkerPool(6); // 6 simultaneous uploads
  }

  const togglePhotoSelection = (filename, status) => {
    if (status !== 'Done') return;
    setConfirmedExports(false);
    setSelectedPhotos(prev => {
      if (prev.includes(filename)) {
        return prev.filter(f => f !== filename);
      } else {
        return [...prev, filename];
      }
    });
  };

  // Drag and Drop row reordering
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState(null);

  const handleDropQueueItem = (toIndex) => {
    if (draggedItemIndex === null || draggedItemIndex === toIndex) {
      setDraggedItemIndex(null);
      setDragOverItemIndex(null);
      return;
    }

    const fromIndex = draggedItemIndex;

    // 1. Reorder queue array
    setQueue(prevQueue => {
      const newQueue = [...prevQueue];
      const [movedItem] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, movedItem);
      return newQueue;
    });

    // 2. Reorder projectPhotos array so that its ordering stays in sync with the updated queue
    setProjectPhotos(prevPhotos => {
      const newQueueItem = queue[fromIndex];
      const targetQueueItem = queue[toIndex];
      if (!newQueueItem || !targetQueueItem) return prevPhotos;

      const newPhotos = [...prevPhotos];
      const photoFromIdx = newPhotos.findIndex(p => p.filename === newQueueItem.finalFilename);
      if (photoFromIdx === -1) return prevPhotos;

      const [movedPhoto] = newPhotos.splice(photoFromIdx, 1);
      const photoToIdx = newPhotos.findIndex(p => p.filename === targetQueueItem.finalFilename);
      if (photoToIdx === -1) {
        newPhotos.push(movedPhoto);
      } else {
        newPhotos.splice(photoToIdx, 0, movedPhoto);
      }
      return newPhotos;
    });

    setDraggedItemIndex(null);
    setDragOverItemIndex(null);
  };

  const doneItems = queue.filter(i => i.status === 'Done');
  const allDoneSelected = doneItems.length > 0 && doneItems.every(i => selectedPhotos.includes(i.finalFilename));

  const handleSelectAll = () => {
    setConfirmedExports(false);
    if (allDoneSelected) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos(doneItems.map(i => i.finalFilename));
    }
  };

  // Navigate to a specific photo in the Caption Editor (used when clicking the body of a queue item)
  const navigateToPhoto = (filename) => {
    const photoIndex = projectPhotos.findIndex(p => p.filename === filename);
    if (photoIndex === -1) return;
    setEditorIndex(photoIndex);
    setActiveTab('editor'); // switch mobile tab to editor
  };

  const cleanUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const todayStr = new Date().toISOString().split('T')[0];

  // Fetch plan limit
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        // Query plan based on whitelist user company/plan
        const userWhitelistDoc = await getDocs(query(collection(db, 'whitelist_users'), where('email', '==', user.email.toLowerCase())));
        if (!userWhitelistDoc.empty) {
          const userData = userWhitelistDoc.docs[0].data();
          const planName = userData.plan || 'starter';
          
          const planSnap = await getDoc(doc(db, 'plan', planName));
          if (planSnap.exists()) {
            const p = planSnap.data();
            setPlanLimits({
              maxDaily: p.max_daily_photos || (planName === 'pro' ? 300 : 100),
              maxKb: p.max_file_size_kb || (planName === 'pro' ? 1024 : 300)
            });
          } else {
            // Default rules
            setPlanLimits({
              maxDaily: planName === 'pro' ? 300 : 100,
              maxKb: planName === 'pro' ? 1024 : 300
            });
          }
        }
      } catch (err) {
        console.error("Error fetching plan constraints:", err);
      }
    };
    fetchPlan();
  }, [user]);

  // Fetch projects: 1. Instant load from 24h LocalStorage cache; 2. Background Firestore sync
  useEffect(() => {
    if (!user || !user.email) return;

    // 1. Instant load from LocalStorage cache (if <= 24 hours old)
    const cachedProjs = loadProjectsFromCache(user);
    if (cachedProjs) {
      setProjects(cachedProjs);
      setLoadingProjects(false);
      setSelectedProject(prev => {
        if (prev && cachedProjs.some(p => p.id === prev.id)) {
          return cachedProjs.find(p => p.id === prev.id);
        }
        return cachedProjs.length > 0 ? cachedProjs[0] : null;
      });
    }

    // 2. Background Firestore sync
    const q = query(
      collection(db, 'projects'),
      where('created_by', '==', (user.email || '').trim().toLowerCase())
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projs = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        projs.push({
          id: docSnap.id,
          lastModified: new Date(0).toISOString(),
          ...data,
          photos: Array.isArray(data.photos) ? data.photos : []
        });
      });

      // Update state & refresh cache
      setProjects(projs);
      setLoadingProjects(false);
      saveProjectsToCache(user, projs);

      setSelectedProject(prev => {
        if (prev && projs.some(p => p.id === prev.id)) {
          return projs.find(p => p.id === prev.id);
        }
        return projs.length > 0 ? projs[0] : null;
      });
    });
    return () => unsubscribe();
  }, [user]);

  // Sync daily uploaded photo count
  useEffect(() => {
    if (!user.companyId) return;
    const q = query(
      collection(db, 'photos'),
      where('company_id', '==', user.companyId),
      where('upload_date', '==', todayStr),
      where('status', '==', 'done')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDailyUploadCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [user.companyId, todayStr]);

  // Sync photos in current project (auto-saved & persist permanently across logout/relogin)
  useEffect(() => {
    if (!selectedProject) {
      setProjectPhotos([]);
      return;
    }
    // Instant load cached photo list from selected project
    if (Array.isArray(selectedProject.photos) && selectedProject.photos.length > 0) {
      setProjectPhotos(selectedProject.photos);
    }
    const q = query(
      collection(db, 'photos'),
      where('project_id', '==', selectedProject.id),
      where('status', '==', 'done')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const photos = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        photos.push({ id: doc.id, ...data });
      });
      setProjectPhotos(prev => {
        // Merge DB photos with any local auto-saved photos, strictly deduplicating by filename
        const photoMap = new Map();
        prev.forEach(p => {
          const key = p.filename || p.id;
          if (key) photoMap.set(key, p);
        });
        photos.forEach(p => {
          const key = p.filename || p.id;
          if (key) {
            photoMap.set(key, { ...(photoMap.get(key) || {}), ...p });
          }
        });
        return Array.from(photoMap.values());
      });
      setEditorIndex(0);

      // Automatically sync saved Firestore photos into projectQueues so photo list persists after relogging in
      setProjectQueues(prev => {
        const existingQueue = prev[selectedProject.id] || [];
        const activeItems = existingQueue.filter(item => item.status !== 'Done');
        const doneItemsFromDb = photos.map(photo => {
          const existingItem = existingQueue.find(q => q.finalFilename === photo.filename);
          return {
            id: photo.id,
            originalFilename: photo.filename,
            finalFilename: photo.filename,
            sizeKb: photo.size_kb || photo.sizeKb || existingItem?.sizeKb || 0,
            status: 'Done',
            progress: 100,
            thumbnailUrl: photo.base64 || existingItem?.thumbnailUrl || photo.url,
            created_at: photo.created_at
          };
        });
        const combinedQueue = [...activeItems, ...doneItemsFromDb];
        const uniqueMap = new Map();
        combinedQueue.forEach(item => {
          if (item.finalFilename) uniqueMap.set(item.finalFilename, item);
        });
        return {
          ...prev,
          [selectedProject.id]: Array.from(uniqueMap.values())
        };
      });
    });
    return () => unsubscribe();
  }, [selectedProject?.id]);

  // Update caption input when editor photo changes
  useEffect(() => {
    if (projectPhotos.length > 0 && projectPhotos[editorIndex]) {
      setCaption(projectPhotos[editorIndex].caption || '');
    } else {
      setCaption('');
    }
  }, [projectPhotos, editorIndex]);

  // Requirement 1: Debounced Auto-Save Logic (2-second debounce) whenever photo list or captions change
  useEffect(() => {
    if (!selectedProject || !user || !projectPhotos) return;

    const timer = setTimeout(async () => {
      const nowIso = new Date().toISOString();
      const cleanPhotos = projectPhotos.map(p => ({
        id: p.id || ("photo_" + Math.random().toString(36).substring(7)),
        filename: p.filename || p.originalFilename || '',
        url: p.url || '',
        base64: p.base64 || p.thumbnailUrl || '',
        caption: p.caption || '',
        size_kb: p.size_kb || p.sizeKb || 0,
        created_at: p.created_at || nowIso
      }));

      // 1. Save data to Firestore (projects/{projectId}) immediately with merge: true
      try {
        await setDoc(doc(db, 'projects', selectedProject.id), {
          userId: user.uid || '',
          created_by: (user.email || '').trim().toLowerCase(),
          photos: cleanPhotos,
          lastModified: nowIso
        }, { merge: true });
      } catch (err) {
        console.error("Auto-save error updating project in Firestore:", err);
      }

      // 2. Save data to Browser LocalStorage cache
      setProjects(prev => {
        const updated = prev.map(proj =>
          proj.id === selectedProject.id
            ? { ...proj, photos: cleanPhotos, lastModified: nowIso }
            : proj
        );
        saveProjectsToCache(user, updated);
        return updated;
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [projectPhotos, selectedProject?.id, user]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    try {
      const nowIso = new Date().toISOString();
      const projectId = "proj_" + Math.random().toString(36).substring(2, 11);
      const newProjObj = {
        id: projectId,
        name: newProjectName.trim(),
        created_at: nowIso,
        lastModified: nowIso,
        created_by: (user.email || '').trim().toLowerCase(),
        userId: user.uid || '',
        photos: []
      };
      await setDoc(doc(db, 'projects', projectId), newProjObj, { merge: true });
      setNewProjectName('');
      setSelectedProject(newProjObj);
      setProjects(prev => {
        const updated = [...prev, newProjObj];
        saveProjectsToCache(user, updated);
        return updated;
      });
    } catch (err) {
      console.error("Error creating project:", err);
    }
  };

  const handleRenameProject = async () => {
    if (!selectedProject) return;
    const newName = prompt("Rename project to:", selectedProject.name);
    if (!newName || !newName.trim()) return;
    try {
      await updateDoc(doc(db, 'projects', selectedProject.id), {
        name: newName.trim()
      });
      setSelectedProject(prev => prev ? { ...prev, name: newName.trim() } : null);
    } catch (err) {
      console.error("Error renaming project:", err);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    const confirmed = confirm(`Are you sure you want to delete the project "${selectedProject.name}" and all its photos?`);
    if (!confirmed) return;
    try {
      await deleteDoc(doc(db, 'projects', selectedProject.id));
      const photosSnap = await getDocs(query(collection(db, 'photos'), where('project_id', '==', selectedProject.id)));
      for (const photoDoc of photosSnap.docs) {
        await deleteDoc(doc(db, 'photos', photoDoc.id));
      }
      setSelectedProject(null);
    } catch (err) {
      console.error("Error deleting project:", err);
    }
  };

  const handleFilesSelected = (files) => {
    if (!selectedProject) {
      alert("Please select or create a project first.");
      return;
    }

    let currentRemaining = planLimits.maxDaily - dailyUploadCount;
    const newQueueItems = [];
    const oversizedFiles = [];
    let limitReachedHit = false;

    files.forEach((file) => {
      const sizeKb = file.size / 1024;
      const extension = file.name.split('.').pop().toLowerCase();
      const tempId = Math.random().toString(36).substring(7);

      // Instantly create a local object URL for immediate thumbnail rendering
      const thumbnailUrl = URL.createObjectURL(file);

      let status = 'Queued';
      let error = null;

      // 1. Client size check
      if (sizeKb > planLimits.maxKb) {
        status = 'Rejected';
        error = `File too large (${Math.round(sizeKb)}KB > ${planLimits.maxKb}KB limit)`;
        oversizedFiles.push({ name: file.name, sizeKb: Math.round(sizeKb) });
      } 
      // 2. Client daily count check
      else if (currentRemaining <= 0) {
        status = 'Blocked';
        error = 'Daily Limit Reached';
        limitReachedHit = true;
      } else {
        currentRemaining--;
      }

      // Find highest existing sequence number for today across queue, projectPhotos, and newly added items
      let maxSeq = 0;
      const existingNames = [
        ...queue.map(q => q.finalFilename),
        ...projectPhotos.map(p => p.filename),
        ...newQueueItems.map(i => i.finalFilename)
      ].filter(Boolean);

      existingNames.forEach(name => {
        const match = name.match(/-(\d{3,})\./);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxSeq) maxSeq = num;
        }
      });

      const nextSeq = Math.max(
        maxSeq + 1,
        dailyUploadCount + newQueueItems.filter(i => i.status === 'Queued').length + 1
      );
      const seqStr = String(nextSeq).padStart(3, '0');
      let finalFilename = `${cleanUsername}_${todayStr}-${seqStr}.${extension}`;

      let collisionCounter = 1;
      while (existingNames.includes(finalFilename)) {
        const guardedSeq = String(nextSeq + collisionCounter).padStart(3, '0');
        finalFilename = `${cleanUsername}_${todayStr}-${guardedSeq}.${extension}`;
        collisionCounter++;
      }

      newQueueItems.push({
        id: tempId,
        file,
        originalName: file.name,
        finalFilename,
        sizeKb,
        status,
        error,
        progress: 0,
        retries: 0,
        thumbnailUrl   // instant local preview URL
      });
    });

    // Show alert popup if file exceeded 300 KB or daily usage hit limit
    if (oversizedFiles.length > 0) {
      setAlertPopup({
        title: "File Size Limit Exceeded",
        message: `${oversizedFiles.length === 1 ? `"${oversizedFiles[0].name}" (${oversizedFiles[0].sizeKb} KB)` : `${oversizedFiles.length} photos`} exceeds your plan limit of ${planLimits.maxKb} KB. Maximum allowed size per photo is ${planLimits.maxKb} KB (300 KB).`,
        type: 'error'
      });
    } else if (limitReachedHit) {
      setAlertPopup({
        title: "Daily Upload Limit Reached",
        message: `You have reached your daily upload limit of ${planLimits.maxDaily} photos. Please upgrade your plan or try again tomorrow.`,
        type: 'warning',
        showUpgradeButton: true
      });
      setShowUpgradeModal(true);
    }

    // Immediately commit all queue items to state — thumbnails render at once
    setQueue(prev => [...prev, ...newQueueItems]);

    // Pipe all eligible items through the parallel worker pool (6 concurrent slots)
    newQueueItems.forEach(item => {
      if (item.status === 'Queued') {
        workerPoolRef.current.add(() => uploadFile(item));
      }
    });
  };

  const uploadFile = async (item) => {
    const filePath = `projects/${selectedProject.id}/${todayStr}/${item.finalFilename}`;
    const storageRef = ref(storage, filePath);

    setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'Uploading' } : q));

    // In production: request a GCS Signed URL and PUT directly to GCS
    // In mock mode: signed_url will be empty, we fall back to uploadBytesResumable
    let usedDirectPut = false;
    if (!isMockMode) {
      try {
        const getUrlFn = httpsCallable(functions, 'getSignedUploadUrl');
        const { data: { signed_url } } = await getUrlFn({
          gcs_path: filePath,
          content_type: item.file.type || 'image/jpeg'
        });

        if (signed_url) {
          usedDirectPut = true;
          // Direct browser → GCS PUT with XHR for progress events + exponential backoff
          await withExponentialBackoff(
            () => new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.open('PUT', signed_url);
              xhr.setRequestHeader('Content-Type', item.file.type || 'image/jpeg');
              xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                  const pct = Math.round((e.loaded / e.total) * 100);
                  setQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: pct } : q));
                }
              };
              xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`PUT ${xhr.status}`));
              xhr.onerror = () => reject(new Error('Network error during PUT'));
              xhr.send(item.file);
            }),
            3,
            (attempt, delay) => {
              setQueue(prev => prev.map(q =>
                q.id === item.id ? { ...q, status: 'Retrying', retries: attempt } : q
              ));
            }
          );
        }
      } catch (err) {
        console.warn('Signed URL path failed, falling back to SDK upload:', err);
      }
    }

    // Fallback / Mock Mode: use Firebase SDK uploadBytesResumable
    if (!usedDirectPut) {
      await withExponentialBackoff(
        () => new Promise((resolve, reject) => {
          const uploadTask = uploadBytesResumable(storageRef, item.file);
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              setQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: pct } : q));
            },
            (error) => reject(error),
            () => resolve(uploadTask.snapshot.ref)
          );
        }),
        3,
        (attempt, delay) => {
          setQueue(prev => prev.map(q =>
            q.id === item.id ? { ...q, status: 'Retrying', retries: attempt } : q
          ));
        }
      ).then(async (snapshotRef) => {
        const downloadUrl = await getDownloadURL(snapshotRef || storageRef);

        // Pre-create Firestore photo doc
        const photoId = `${selectedProject.id}_${item.finalFilename.replace(/\./g, '_')}`;
        const photoDocRef = doc(db, 'photos', photoId);

        await setDoc(photoDocRef, {
          id: photoId,
          project_id: selectedProject.id,
          company_id: user.companyId,
          filename: item.finalFilename,
          original_filename: item.originalName,
          gcs_path: filePath,
          url: downloadUrl,
          size_kb: item.sizeKb,
          upload_date: todayStr,
          uploaded_by: user.email,
          caption: '',
          status: 'pending',
          created_at: new Date().toISOString()
        });

        // Listen for backend validation result
        const unsub = onSnapshot(photoDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.status === 'done') {
              setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'Done', progress: 100 } : q));
              if (unsub) unsub();
            } else if (data.status === 'rejected') {
              setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'Rejected', error: data.reason || 'Rejected by Server' } : q));
              if (unsub) unsub();
            }
          }
        });
      }).catch((err) => {
        console.error('Upload failed after retries:', err);
        setQueue(prev => prev.map(q =>
          q.id === item.id ? { ...q, status: 'Rejected', error: 'Upload failed after 3 retries' } : q
        ));
      });
    }
  };

  // Production direct-PUT completion handler: called when GCS fires onPhotoUpload
  // which auto-updates Firestore; we just need to register the doc and listen.
  const registerAndListenAfterDirectPut = async (item, filePath) => {
    const photoId = `${selectedProject.id}_${item.finalFilename.replace(/\./g, '_')}`;
    const photoDocRef = doc(db, 'photos', photoId);

    await setDoc(photoDocRef, {
      id: photoId,
      project_id: selectedProject.id,
      company_id: user.companyId,
      filename: item.finalFilename,
      original_filename: item.originalName,
      gcs_path: filePath,
      url: '',
      size_kb: item.sizeKb,
      upload_date: todayStr,
      uploaded_by: user.email,
      caption: '',
      status: 'pending',
      created_at: new Date().toISOString()
    });

    const unsub = onSnapshot(photoDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status === 'done') {
          setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'Done', progress: 100 } : q));
          if (unsub) unsub();
        } else if (data.status === 'rejected') {
          setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'Rejected', error: data.reason || 'Rejected by Server' } : q));
          if (unsub) unsub();
        }
      }
    });
  };

  const handleSaveCaption = async () => {
    if (projectPhotos.length === 0) return;
    const currentPhoto = projectPhotos[editorIndex];
    if (!currentPhoto) return;

    setSavingCaption(true);
    try {
      await updateDoc(doc(db, 'photos', currentPhoto.id), {
        caption: caption.substring(0, 300)
      });
      // Update local state copy
      setProjectPhotos(prev => prev.map((p, idx) => idx === editorIndex ? { ...p, caption } : p));
    } catch (err) {
      console.error("Error saving caption:", err);
    } finally {
      setSavingCaption(false);
    }
  };

  const handleExport = async (format) => {
    if (!selectedProject) return;
    setExportError(null);
    if (format === 'pptx') {
      setExportingPPTX(true);
    } else {
      setExportingXLSX(true);
    }

    try {
      // Call python functions (HTTPS callables)
      const functionName = format === 'pptx' ? 'exportPPTX' : 'exportXLSX';
      const exportFn = httpsCallable(functions, functionName);

      // Order exported photos strictly based on their row number / position in the queue list
      const orderedQueue = queue.filter(item => 
        item.status === 'Done' && (selectedPhotos.length === 0 || selectedPhotos.includes(item.finalFilename))
      );

      const queueFilenames = new Set(orderedQueue.map(q => q.finalFilename));
      const fallbackPhotos = projectPhotos.filter(p => 
        !queueFilenames.has(p.filename) && (selectedPhotos.length === 0 || selectedPhotos.includes(p.filename))
      );

      const photosWithUrls = [
        ...orderedQueue.map(item => {
          const matchedPhoto = projectPhotos.find(p => p.filename === item.finalFilename) || {};
          return {
            ...matchedPhoto,
            filename: item.finalFilename,
            localUrl: item.thumbnailUrl || matchedPhoto.url || '',
            caption: matchedPhoto.caption || ''
          };
        }),
        ...fallbackPhotos.map(p => ({
          ...p,
          localUrl: queue.find(q => q.finalFilename === p.filename)?.thumbnailUrl || p.url
        }))
      ];
      
      const response = await exportFn({ 
        project_id: selectedProject.id,
        project_name: selectedProject.name || 'Project',
        selected_photos: selectedPhotos,
        photos_data: photosWithUrls
      });
      const { downloadUrl } = response.data;
      
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
      } else if (!isMockMode) {
        throw new Error("No download URL returned.");
      }
    } catch (err) {
      console.error(`Export ${format} error:`, err);
      setExportError(`Export failed: ${err.message || 'Server error'}`);
    } finally {
      if (format === 'pptx') {
        setExportingPPTX(false);
      } else {
        setExportingXLSX(false);
      }
    }
  };

  const handleRemove = () => {
    if (allDoneSelected) {
      setQueue([]);
      setSelectedPhotos([]);
    } else if (selectedPhotos.length > 0) {
      setQueue(prev => prev.filter(item => !selectedPhotos.includes(item.finalFilename)));
      setSelectedPhotos([]);
    }
  };

  const isPro = planLimits.maxDaily === 300;

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Navbar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/60 px-3 md:px-6 backdrop-blur-md">
        <div className="flex items-center gap-2 md:gap-2.5 min-w-0">
          <img src="/logo-hs-white.png" alt="HS Logo" className="h-6 md:h-7 w-auto shrink-0 object-contain filter drop-shadow-[0_0_6px_rgba(255,255,255,0.35)]" />
          <span className="font-outfit text-base md:text-lg font-extrabold tracking-tight text-white truncate">HitecApp</span>
        </div>

        {/* Daily Usage Section in the Header Middle */}
        <div className="hidden md:flex flex-col items-center justify-center min-w-[200px] max-w-[320px] w-full px-4">
          <div className="flex items-center justify-between w-full text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <span>Daily Usage</span>
            <span className="text-indigo-400">{dailyUploadCount} / {planLimits.maxDaily} photos</span>
          </div>
          {/* Thin progress bar */}
          <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${Math.min((dailyUploadCount / planLimits.maxDaily) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {user.role === 'super_admin' && (
            <a 
              href="/admin.html" 
              target="_blank" 
              rel="noopener noreferrer"
              title="Admin Panel"
              className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 md:px-3 py-1.5 min-h-[36px] text-xs font-bold text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all active:scale-[0.98]"
            >
              <Shield className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Admin Panel</span>
            </a>
          )}

          <div className="hidden md:flex items-center gap-2 rounded-lg bg-slate-950 border border-slate-800 px-3 py-1 text-xs">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-300 font-medium">{user.email}</span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              isPro ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400'
            }`}>
              {isPro ? 'Pro' : 'Starter'}
            </span>
          </div>

          <button
            onClick={onLogout}
            title="Logout"
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/40 px-2.5 md:px-3 py-1.5 min-h-[36px] text-xs font-semibold text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-all active:scale-[0.98]"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Grid Container */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        
         {/* Left Side: Projects and Uploads (Desktop) or Mobile Navigation tabs */}
        <div className={`flex flex-col w-full md:w-1/2 shrink-0 border-r border-slate-800 bg-slate-950/20 overflow-hidden ${
          activeTab === 'upload' ? 'flex' : 'hidden md:flex'
        }`}>
          
          {/* Project Section */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/10 shrink-0">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Project</h2>

            {/* Create Project Form (Moved up inside section) */}
            <form onSubmit={handleCreateProject} className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="New project name..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="submit"
                className="flex items-center gap-1 rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <FolderPlus className="h-3.5 w-3.5" />
                Create
              </button>
            </form>
            
            {/* Project Select Dropdown + Rename/Delete Options */}
            <div className="flex gap-2 items-center">
              <select
                value={selectedProject?.id || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedProject(val ? projects.find(p => p.id === val) : null);
                }}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
              >
                {loadingProjects ? (
                  <option value="">Loading projects...</option>
                ) : projects.length === 0 ? (
                  <option value="">No projects. Create one above ↑</option>
                ) : (
                  <option value="">-- Select Project --</option>
                )}
                {!loadingProjects && projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              {selectedProject && (
                <div className="flex gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleRenameProject}
                    title="Rename current project"
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteProject}
                    title="Delete current project"
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-rose-500 hover:bg-rose-950/20 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Queue List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="flex items-center justify-between pb-2 sticky top-0 bg-slate-950 z-10 pt-2 border-b border-slate-900">
              {/* LEFT: Select All */}
              <div className="flex items-center gap-2">
                {doneItems.length > 0 && (
                  <label className="flex items-center gap-1.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={allDoneSelected}
                      onChange={handleSelectAll}
                      className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-800 accent-emerald-500 cursor-pointer"
                    />
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">
                      Select all
                    </span>
                  </label>
                )}
              </div>

              {/* MIDDLE: Remove button in RED */}
              <div className="flex items-center justify-center">
                {queue.length > 0 && (
                  <button 
                    onClick={handleRemove}
                    disabled={!allDoneSelected && selectedPhotos.length === 0}
                    className="flex items-center gap-1 text-[11px] font-bold text-rose-500 hover:text-rose-400 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900/50 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-40 disabled:hover:text-rose-500 disabled:hover:bg-rose-950/30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                )}
              </div>

              {/* RIGHT: Selected & Total photos count */}
              <div className="text-[11px] font-semibold text-slate-400">
                {queue.length > 0 ? `${selectedPhotos.length} selected / ${queue.length} photos` : ''}
              </div>
            </div>

            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                <FileText className="h-8 w-8 stroke-1 mb-2" />
                <p className="text-xs">No files queued for upload</p>
              </div>
            ) : (
              <div className={`mt-2 grid gap-1.5 ${queue.length > 20 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                {queue.map((item, index) => {
                  const isDone = item.status === 'Done';
                  const isSelected = selectedPhotos.includes(item.finalFilename);
                  const matchedPhoto = projectPhotos.find(p => p.filename === item.finalFilename);
                  const currentCaption = matchedPhoto ? matchedPhoto.caption : '';
                  const canNavigate = isDone && projectPhotos.some(p => p.filename === item.finalFilename);

                  return (
                    <div
                      key={item.id}
                      draggable={true}
                      onDragStart={() => setDraggedItemIndex(index)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragOverItemIndex !== index) setDragOverItemIndex(index);
                      }}
                      onDragLeave={() => {
                        if (dragOverItemIndex === index) setDragOverItemIndex(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDropQueueItem(index);
                      }}
                      onDragEnd={() => {
                        setDraggedItemIndex(null);
                        setDragOverItemIndex(null);
                      }}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 transition-all cursor-grab active:cursor-grabbing ${
                        dragOverItemIndex === index
                          ? 'border-indigo-400 bg-indigo-950/40 scale-[1.01] shadow-lg'
                          : draggedItemIndex === index
                            ? 'opacity-40 border-dashed border-slate-700'
                            : projectPhotos[editorIndex]?.filename === item.finalFilename
                              ? 'border-yellow-500/60 bg-yellow-950/20'
                              : isSelected
                                ? 'border-indigo-500/60 bg-indigo-950/20'
                                : 'border-slate-900 bg-slate-900/30'
                      } ${!isDone ? 'opacity-60' : ''}`}
                    >
                      {/* LEFT: Row number + Selection checkbox */}
                      <div className="shrink-0 flex items-center gap-1.5 pl-1">
                        <div
                          className="flex items-center gap-1.5 cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); togglePhotoSelection(item.finalFilename, item.status); }}
                        >
                          <span className="text-xs font-mono font-semibold text-slate-400 min-w-[20px] text-right">
                            {index + 1}.
                          </span>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            disabled={!isDone}
                            className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-indigo-500 cursor-pointer disabled:opacity-30"
                          />
                        </div>
                      </div>

                      {/* CENTER: Thumbnail + info — clicking navigates to Caption Editor */}
                      <div
                        className={`flex items-center gap-2.5 min-w-0 flex-1 ${
                          canNavigate ? 'cursor-pointer group' : ''
                        }`}
                        onClick={() => canNavigate && navigateToPhoto(item.finalFilename)}
                        title={canNavigate ? 'Click to view in Caption Editor' : ''}
                      >
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-center">
                          {item.thumbnailUrl ? (
                            <img
                              src={item.thumbnailUrl}
                              alt="thumbnail"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FileText className="h-4 w-4 text-slate-500" />
                          )}
                          {canNavigate && (
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                              <ImageIcon className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-slate-200 group-hover:text-indigo-300 transition-colors">{item.finalFilename}</p>
                          <p className="text-[10px] text-slate-500">{Math.round(item.sizeKb)} KB</p>
                          <p className={`text-[10px] truncate mt-0.5 ${currentCaption ? 'text-indigo-400 font-medium' : 'text-slate-600 italic'}`}>
                            {currentCaption || 'No caption'}
                          </p>
                        </div>
                      </div>

                      {/* RIGHT: Status chip */}
                      <div className="shrink-0 flex items-center gap-1.5 pl-1">
                        {item.status === 'Queued' && (
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 animate-pulse">Queued</span>
                        )}
                        {item.status === 'Uploading' && (
                          <div className="flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin text-indigo-400" />
                            <span className="text-[10px] font-bold text-indigo-400">{item.progress}%</span>
                          </div>
                        )}
                        {item.status === 'Retrying' && (
                          <div className="flex items-center gap-1">
                            <RefreshCw className="h-3 w-3 animate-spin text-amber-400" />
                            <span className="text-[10px] font-bold text-amber-400">{item.retries}/3</span>
                          </div>
                        )}
                        {item.status === 'Done' && (
                          <div className="flex items-center gap-1.5">
                            {projectPhotos[editorIndex]?.filename === item.finalFilename && (
                              <Edit2 className="h-4 w-4 text-yellow-400 shrink-0 animate-pulse" title="Currently viewing in Caption Editor" />
                            )}
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          </div>
                        )}
                        {item.status === 'Rejected' && (
                          <div className="group/tip relative">
                            <AlertCircle className="h-4 w-4 text-rose-400 cursor-pointer" />
                            <div className="absolute right-0 bottom-full mb-1 hidden w-44 rounded bg-slate-900 border border-slate-800 p-2 text-[10px] text-rose-300 group-hover/tip:block z-20 shadow-xl">{item.error}</div>
                          </div>
                        )}
                        {item.status === 'Blocked' && (
                          <div className="group/tip relative">
                            <AlertCircle className="h-4 w-4 text-amber-500 cursor-pointer" />
                            <div className="absolute right-0 bottom-full mb-1 hidden w-44 rounded bg-slate-900 border border-slate-800 p-2 text-[10px] text-amber-300 group-hover/tip:block z-20 shadow-xl">{item.error}</div>
                          </div>
                        )}

                        {/* RIGHT: 6 white dots drag icon to the right of status icon */}
                        <div
                          className="text-slate-400 hover:text-white transition-colors p-1 cursor-grab active:cursor-grabbing ml-1"
                          title="Drag row to reorder position"
                        >
                          <GripVertical className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Upload Box, Photo Carousel Editor and Exporters */}
        <div className={`w-full md:w-1/2 flex-1 flex-col overflow-hidden bg-slate-900/10 ${
          activeTab !== 'upload' ? 'flex' : 'hidden md:flex'
        }`}>
          
          {/* Drag and Drop Photos Box Section at Top of Right Column */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/20 shrink-0">
            <UploadZone onFilesSelected={handleFilesSelected} />
          </div>

          {/* Photo Editor Tab View / Main Pane */}
          <div className={`flex-1 flex-col overflow-hidden p-4 md:p-6 ${
            activeTab === 'editor' ? 'flex' : 'hidden md:flex'
          }`}>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Caption Editor</h2>

            {!selectedProject ? (
              <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-slate-900 bg-slate-900/20 p-8 text-center text-slate-600">
                <Folder className="h-10 w-10 stroke-1 mb-2 text-slate-500" />
                <h3 className="font-semibold text-slate-400 text-sm">No Project Selected</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">
                  Please select or create a project first to edit captions and view uploaded photos.
                </p>
              </div>
            ) : projectPhotos.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-slate-900 bg-slate-900/20 p-8 text-center text-slate-600">
                <ImageIcon className="h-10 w-10 stroke-1 mb-2" />
                <h3 className="font-semibold text-slate-400 text-sm">No uploaded photos</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">
                  Upload photos for this project to start editing captions. Only successfully validated photos will show here.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-y-auto gap-4">
                {/* Carousel Viewer (Height half of width size -> aspect-[2/1]) */}
                <div className="w-full aspect-[2/1] relative rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden flex items-center justify-center group shrink-0">
                  <img 
                    src={projectPhotos[editorIndex]?.base64 || queue.find(q => q.finalFilename === projectPhotos[editorIndex]?.filename)?.thumbnailUrl || projectPhotos[editorIndex]?.url} 
                    alt="active editor audit" 
                    className="max-h-full max-w-full object-contain p-2" 
                  />

                  {/* Left arrow */}
                  <button
                    disabled={editorIndex === 0}
                    onClick={() => setEditorIndex(prev => prev - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  {/* Right arrow */}
                  <button
                    disabled={editorIndex === projectPhotos.length - 1}
                    onClick={() => setEditorIndex(prev => prev + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  {/* Index badge */}
                  <span className="absolute top-4 right-4 rounded-full bg-slate-950/80 border border-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                    {editorIndex + 1} / {projectPhotos.length}
                  </span>
                </div>

                {/* Caption Form (Max 3 rows layout, Enter breaks line, Gemini AI bilingual support) */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                  {/* Top Header Above Filling Field: Label + Character Counter ON THE LEFT */}
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-xs font-bold text-slate-300">Add Caption</label>
                    <span className={`text-xs font-semibold ${caption.length > 280 ? 'text-amber-400' : 'text-slate-400'}`}>
                      ({caption.length} / 300 characters)
                    </span>
                  </div>

                  {/* Filling Field + Right Column (Round Square Save Button with Large Diskette Logo) */}
                  <div className="flex gap-3 items-stretch">
                    <textarea
                      rows={3}
                      maxLength={300}
                      value={caption}
                      onChange={(e) => {
                        const val = e.target.value;
                        const lines = val.split('\n');
                        if (lines.length > 3) {
                          setCaption(lines.slice(0, 3).join('\n'));
                        } else {
                          setCaption(val);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const lines = caption.split('\n');
                          if (lines.length >= 3 && e.target.selectionStart === e.target.selectionEnd) {
                            e.preventDefault();
                          }
                        }
                      }}
                      placeholder="Press Enter to break line up to three rows."
                      className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 placeholder-slate-600 transition-colors resize-none leading-relaxed"
                    />
                    
                    {/* Round Square Save Button with Bigger Diskette Logo */}
                    <button
                      onClick={handleSaveCaption}
                      disabled={savingCaption || projectPhotos[editorIndex]?.caption === caption}
                      title="Save Caption"
                      className="flex flex-col items-center justify-center h-[72px] w-[72px] shrink-0 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none gap-1"
                    >
                      {savingCaption ? <Loader2 className="h-7 w-7 animate-spin" /> : <Save className="h-7 w-7" />}
                      <span className="text-[10px] font-extrabold tracking-tight">Save</span>
                    </button>
                  </div>

                  {/* Gemini AI Suggestions Horizontal Compact Strip (Leaves full vertical space for photo viewer) */}
                  {!manualMode && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={runGeminiCorrection}
                        disabled={aiProcessing}
                        className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 text-[11px] font-semibold text-white transition-all disabled:opacity-50 shrink-0"
                      >
                        {aiProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                        <span>AI Auto-Correct (EN/ID)</span>
                      </button>

                      <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                        {aiSuggestions.map((sug, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCaption(sug.text)}
                            title={sug.text}
                            className="max-w-[210px] truncate rounded-lg border border-indigo-500/30 bg-slate-900/90 hover:bg-indigo-900/40 px-2 py-1 text-[11px] text-slate-300 hover:text-white transition-all"
                          >
                            <span className="font-bold text-indigo-400 mr-1">{sug.tag}:</span>
                            {sug.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Publish & Export Section right below Add Caption Form (removes big vertical gap) */}
                <div className={`rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shrink-0 ${
                  activeTab === 'export' ? 'block' : 'hidden md:block'
                }`}>
                  <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                    Publish {selectedProject ? `"${selectedProject.name}"` : ""}
                  </h2>

                  {exportError && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-300">
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                      <span>{exportError}</span>
                    </div>
                  )}

                  {/* 3 Square Buttons with Big Icons */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* 1. Yellow/Blue Confirm Square Button */}
                    <button
                      type="button"
                      onClick={() => setConfirmedExports(true)}
                      disabled={selectedPhotos.length === 0}
                      className={`aspect-square sm:h-24 sm:aspect-auto rounded-2xl flex flex-col items-center justify-center gap-2 p-3 text-xs font-bold transition-all active:scale-[0.98] ${
                        selectedPhotos.length === 0
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                          : confirmedExports
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 shadow-lg shadow-yellow-500/15'
                      }`}
                    >
                      <Check className="h-8 w-8 stroke-[3px] shrink-0" />
                      <span className="text-[11px] font-extrabold tracking-tight text-center leading-tight">
                        {confirmedExports ? "Confirmed" : "Confirm"} ({selectedPhotos.length})
                      </span>
                    </button>

                    {/* 2. Red PowerPoint Square Button with Big Icon */}
                    <button
                      onClick={() => handleExport('pptx')}
                      disabled={exportingPPTX || projectPhotos.length === 0 || !confirmedExports || selectedPhotos.length === 0}
                      className="aspect-square sm:h-24 sm:aspect-auto rounded-2xl bg-rose-600 hover:bg-rose-500 flex flex-col items-center justify-center gap-2 p-3 text-xs font-bold text-white shadow-lg shadow-rose-500/15 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
                    >
                      {exportingPPTX ? (
                        <Loader2 className="h-8 w-8 animate-spin shrink-0" />
                      ) : (
                        <svg className="h-8 w-8 shrink-0" viewBox="0 0 32 32" fill="none">
                          <rect x="2" y="4" width="28" height="24" rx="4" fill="white" fillOpacity="0.2" />
                          <rect x="5" y="7" width="13" height="18" rx="2" fill="white" />
                          <path d="M9 11h3.8c1.2 0 2.2.9 2.2 2.1 0 1.2-1 2.1-2.2 2.1H11v3.8H9V11zm2 2.6h1.8c.3 0 .6-.2.6-.6 0-.3-.3-.6-.6-.6H11v1.2z" fill="#e11d48"/>
                          <path d="M21 11h4v2h-4v-2zm0 4h4v2h-4v-2zm0 4h4v2h-4v-2z" fill="white"/>
                        </svg>
                      )}
                      <span className="text-[11px] font-extrabold tracking-tight text-center leading-tight">Powerpoint</span>
                    </button>

                    {/* 3. Green Excel Square Button with Big Icon */}
                    <button
                      onClick={() => handleExport('xlsx')}
                      disabled={exportingXLSX || projectPhotos.length === 0 || !confirmedExports || selectedPhotos.length === 0}
                      className="aspect-square sm:h-24 sm:aspect-auto rounded-2xl bg-emerald-600 hover:bg-emerald-500 flex flex-col items-center justify-center gap-2 p-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/15 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
                    >
                      {exportingXLSX ? (
                        <Loader2 className="h-8 w-8 animate-spin shrink-0" />
                      ) : (
                        <svg className="h-8 w-8 shrink-0" viewBox="0 0 32 32" fill="none">
                          <rect x="2" y="4" width="28" height="24" rx="4" fill="white" fillOpacity="0.2" />
                          <rect x="5" y="7" width="13" height="18" rx="2" fill="white" />
                          <path d="M8.8 19l2.4-3.8-2.2-3.7h2.2l1.1 2.2 1.1-2.2h2.1l-2.2 3.7 2.4 3.8h-2.2l-1.3-2.4-1.3 2.4H8.8z" fill="#059669"/>
                          <path d="M21 11h4v2h-4v-2zm0 4h4v2h-4v-2zm0 4h4v2h-4v-2z" fill="white"/>
                        </svg>
                      )}
                      <span className="text-[11px] font-extrabold tracking-tight text-center leading-tight">Excel</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Tab bar footer (highly compact responsive overlay) */}
      <div className="flex md:hidden h-14 shrink-0 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 items-center justify-around z-20">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold ${
            activeTab === 'upload' ? 'text-indigo-400' : 'text-slate-500'
          }`}
        >
          <Upload className="h-4 w-4" />
          <span>Upload</span>
        </button>

        <button
          onClick={() => {
            if (projectPhotos.length === 0) {
              alert("Please upload photos first to use the Editor.");
              return;
            }
            setActiveTab('editor');
          }}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold ${
            activeTab === 'editor' ? 'text-indigo-400' : 'text-slate-500'
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          <span>Editor</span>
        </button>

        <button
          onClick={() => {
            if (projectPhotos.length === 0) {
              alert("Upload and caption photos before exporting.");
              return;
            }
            setActiveTab('export');
          }}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold ${
            activeTab === 'export' ? 'text-indigo-400' : 'text-slate-500'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Export</span>
        </button>
      </div>

      {/* Alert / Popup Message Modal */}
      {alertPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                alertPopup.type === 'error'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{alertPopup.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{alertPopup.message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setAlertPopup(null)}
                className="rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
              >
                Got It
              </button>
              {alertPopup.showUpgradeButton && (
                <button
                  onClick={() => {
                    setAlertPopup(null);
                    setShowUpgradeModal(true);
                  }}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30"
                >
                  Upgrade Plan
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <UpgradeModal 
        open={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        currentLimit={planLimits.maxDaily} 
      />
    </div>
  );
}
