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
  LogOut, Shield, ShieldAlert, User, Sparkles, Image as ImageIcon, Check, RefreshCw, Edit2, GripVertical, X, MessageSquare
} from 'lucide-react';
import UploadZone from './UploadZone';
import { UpgradeModal } from './UpgradeModal';
import { FeedbackModal } from './FeedbackModal';
import { aiGrammarCheck, aiObservationAssessor, aiGenerateRecommendation, aiTranslateAndGrammarCheck, generateRecommendation, getAISuggestions, learnComment } from '../aiAssessor';
import AnnotatedImageCanvas from './AnnotatedImageCanvas';
import { handleExportWord } from '../exportWordReport';
import PublishBar from './PublishBar';

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

export default function Dashboard({ user, onLogout, onOpenSecurity }) {
  // Mobile Tab State: 'upload' | 'editor' | 'export'
  const [activeTab, setActiveTab] = useState('upload');
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [isMobileViewport, setIsMobileViewport] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobileViewport(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileUser = isMobileViewport && user?.role === 'user';


  const handleTouchStart = (e) => {
    if (e.targetTouches && e.targetTouches[0]) {
      setTouchStartX(e.targetTouches[0].clientX);
      setTouchStartY(e.targetTouches[0].clientY);
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null || touchStartY === null || !e.changedTouches || !e.changedTouches[0]) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX - touchEndX;
    const diffY = Math.abs(touchStartY - touchEndY);

    if (Math.abs(diffX) > 50 && Math.abs(diffX) > diffY) {
      if (diffX > 0 && (activeTab === 'upload' || activeTab === 'export')) {
        setActiveTab('editor');
      } else if (diffX < 0 && activeTab === 'editor') {
        setActiveTab('upload');
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };
  
  // Projects state
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Daily upload limit state
  const [dailyUploadCount, setDailyUploadCount] = useState(0);
  const [planLimits, setPlanLimits] = useState({ maxDaily: 100, maxKb: 300 }); // starter defaults
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

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

  // Fire Safety Assessor UI State
  const [commentsText, setCommentsText] = useState('');
  const [commentsLang, setCommentsLang] = useState('ID');
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLang, setRecommendationsLang] = useState('EN');
  const [aiGrammarChecking, setAiGrammarChecking] = useState(false);
  const [aiGeneratingRec, setAiGeneratingRec] = useState(false);
  const [photoGrade, setPhotoGrade] = useState('F2 - Major');
  const [recMode, setRecMode] = useState('Auto'); // 'Auto' | 'Manual'
  const [aiAssistOn, setAiAssistOn] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiSuggestedRecText, setAiSuggestedRecText] = useState('');

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

  const geminiSuggestionsMemo = useMemo(() => generateGeminiSuggestions(caption), [caption]);

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

  const [exportingPPTX, setExportingPPTX] = useState(false);
  const [exportingXLSX, setExportingXLSX] = useState(false);
  const [exportingDOCX, setExportingDOCX] = useState(false);
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

  // Update caption & assessor inputs when editor photo changes
  useEffect(() => {
    if (projectPhotos.length > 0 && projectPhotos[editorIndex]) {
      const activePhoto = projectPhotos[editorIndex];
      const obs = activePhoto.comments_text || activePhoto.caption || '';
      const initialGrade = activePhoto.grade || 'F2 - Major';
      const initialLang = activePhoto.recommendations_lang || 'EN';
      const isManual = Boolean(activePhoto.manualOverride);
      setCommentsText(obs);
      setCommentsLang(activePhoto.comments_lang || 'ID');
      setRecommendations(Array.isArray(activePhoto.recommendations_json) ? activePhoto.recommendations_json : []);
      setRecommendationsLang(initialLang);
      setCaption(obs);
      setPhotoGrade(initialGrade);
      setRecMode(isManual ? 'Manual' : 'Auto');
      const suggestions = getAISuggestions(obs, initialGrade, activePhoto.comments_lang || 'ID') || [];
      setAiSuggestions(Array.isArray(suggestions) ? suggestions : []);
      setAiSuggestedRecText(activePhoto.aiSuggestedRec || '');
    } else {
      setCommentsText('');
      setRecommendations([]);
      setCaption('');
      setPhotoGrade('F2 - Major');
      setRecMode('Auto');
      setAiSuggestions([]);
      setAiSuggestedRecText('');
    }
  }, [projectPhotos, editorIndex]);

  // Auto-generate AI Recommendation when in Auto mode upon comment or grade changes
  useEffect(() => {
    if (projectPhotos.length === 0 || !projectPhotos[editorIndex]) return;
    const currentLang = recommendationsLang || 'EN';
    const suggestions = getAISuggestions(commentsText, photoGrade, commentsLang || 'ID') || [];
    setAiSuggestions(Array.isArray(suggestions) ? suggestions : []);

    if (recMode === 'Auto') {
      let isMounted = true;
      generateRecommendation(commentsText, photoGrade, currentLang).then(recText => {
        if (isMounted && recText !== undefined && recText !== null) {
          const lines = (typeof recText === 'string' ? recText : '').split('\n').filter(Boolean);
          setRecommendations(lines);
          setAiSuggestedRecText(recText);
        }
      }).catch(err => {
        console.error("generateRecommendation auto error:", err);
      });
      return () => { isMounted = false; };
    }
  }, [commentsText, photoGrade, recMode, recommendationsLang, commentsLang, editorIndex]);

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
        caption: p.comments_text || p.caption || '',
        comments_text: p.comments_text || p.caption || '',
        comments_lang: p.comments_lang || 'ID',
        recommendations_json: Array.isArray(p.recommendations_json) ? p.recommendations_json : [],
        recommendations_lang: p.recommendations_lang || 'ID',
        exif_date: p.exif_date || '',
        exif_gps: p.exif_gps || '',
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
        if (prev.some(p => p.id === newProjObj.id)) {
          const updated = prev.map(p => p.id === newProjObj.id ? newProjObj : p);
          saveProjectsToCache(user, updated);
          return updated;
        }
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
        oversizedFiles.push({ name: file.name, sizeKb: Math.round(sizeKb) });
        return;
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
      const activeProjectName = selectedProject?.name
        ? selectedProject.name.toLowerCase().replace(/\s+/g, '_')
        : (currentProject?.name ? currentProject.name.toLowerCase().replace(/\s+/g, '_') : 'demo');
      const seqStr = String(nextSeq).padStart(3, '0');
      let finalFilename = `${activeProjectName}_${todayStr}-${seqStr}.${extension}`;

      let collisionCounter = 1;
      while (existingNames.includes(finalFilename)) {
        const guardedSeq = String(nextSeq + collisionCounter).padStart(3, '0');
        finalFilename = `${activeProjectName}_${todayStr}-${guardedSeq}.${extension}`;
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

  const handleRefreshPhotoOrder = () => {
    if (!selectedProject) return;
    const orderedQueue = queue.filter(item => item.status === 'Done');
    setProjectPhotos(prev => {
      const prevMap = new Map();
      prev.forEach(p => {
        const key = p.filename || p.id;
        if (key) prevMap.set(key, p);
      });

      const updatedPhotos = orderedQueue.map(q => {
        const existing = prevMap.get(q.finalFilename) || {};
        return {
          ...existing,
          id: existing.id || q.id || ("photo_" + Math.random().toString(36).substring(7)),
          filename: q.finalFilename || existing.filename,
          url: existing.url || q.previewUrl || q.thumbnailUrl || '',
          base64: existing.base64 || q.thumbnailUrl || '',
          caption: existing.caption || '',
          comments_text: existing.comments_text || existing.caption || '',
          comments_lang: existing.comments_lang || 'ID',
          recommendations_json: existing.recommendations_json || [],
          recommendations_lang: existing.recommendations_lang || 'ID',
          size_kb: existing.size_kb || q.sizeKb || 0,
          created_at: existing.created_at || new Date().toISOString()
        };
      });
      return updatedPhotos;
    });
    setEditorIndex(0);
  };

  const handleAiObservationAssessor = async (targetLang = commentsLang) => {
    setAiGrammarChecking(true);
    try {
      const photoObj = projectPhotos[editorIndex] || {};
      const res = await aiObservationAssessor(photoObj, commentsText, targetLang);
      if (res && res.observations) {
        const obsText = res.observations.join('\n');
        setCommentsText(obsText);

        if (photoObj) {
          const recRes = await aiGenerateRecommendation(
            photoObj,
            obsText,
            targetLang,
            'Teknis (ATEX NFPA oriented)'
          );
          if (recRes && recRes.recommendations) {
            setRecommendations(recRes.recommendations);
          }
        }
      }
    } catch (err) {
      console.error("AI Observation Assessor error:", err);
    } finally {
      setAiGrammarChecking(false);
    }
  };

  const handleAiGrammarCheck = handleAiObservationAssessor;

  const handleLanguageSwitch = async (targetLang) => {
    setCommentsLang(targetLang);
    setRecommendationsLang(targetLang);

    setAiGrammarChecking(true);
    try {
      const photoObj = projectPhotos[editorIndex] || {};
      let updatedComments = commentsText;

      // 1. Translate and grammar-check Observation text if present, otherwise generate observation
      if (commentsText && commentsText.trim()) {
        const translatedObs = await aiTranslateAndGrammarCheck(commentsText, targetLang, 'observation');
        if (translatedObs) {
          updatedComments = translatedObs;
          setCommentsText(updatedComments);
        }
      } else {
        const res = await aiObservationAssessor(photoObj, commentsText, targetLang);
        if (res && res.observations) {
          updatedComments = res.observations.join('\n');
          setCommentsText(updatedComments);
        }
      }

      // 2. Translate and grammar-check Recommendation text if present, otherwise generate recommendations contextually
      if (recommendations && recommendations.length > 0) {
        const recText = recommendations.join('\n');
        const translatedRecsText = await aiTranslateAndGrammarCheck(recText, targetLang, 'recommendation');
        if (translatedRecsText) {
          const translatedRecsArr = translatedRecsText.split('\n').map(r => r.trim()).filter(Boolean);
          setRecommendations(translatedRecsArr);
        }
      } else if (photoObj) {
        const recRes = await aiGenerateRecommendation(
          photoObj,
          updatedComments,
          targetLang
        );
        if (recRes && recRes.recommendations) {
          setRecommendations(recRes.recommendations);
        }
      }
    } catch (err) {
      console.error("Language switch translation error:", err);
    } finally {
      setAiGrammarChecking(false);
    }
  };

  const handleGenerateRecommendation = async () => {
    if (!projectPhotos[editorIndex]) return;
    setAiGeneratingRec(true);
    try {
      const recText = await generateRecommendation(commentsText, photoGrade, recommendationsLang);
      if (recText) {
        const lines = recText.split('\n').filter(Boolean);
        setRecommendations(lines);
        setAiSuggestedRecText(recText);
        setRecMode('Auto');
      } else {
        const res = await aiGenerateRecommendation(
          projectPhotos[editorIndex],
          commentsText,
          recommendationsLang
        );
        if (res && res.recommendations) {
          setRecommendations(res.recommendations);
          setAiSuggestedRecText(res.recommendations.join('\n'));
          setRecMode('Auto');
        }
      }
    } catch (err) {
      console.error("AI Recommendation error:", err);
    } finally {
      setAiGeneratingRec(false);
    }
  };

  const handleSaveAssessment = async () => {
    if (projectPhotos.length === 0) return;
    const currentPhoto = projectPhotos[editorIndex];
    if (!currentPhoto) return;

    setSavingCaption(true);
    try {
      const updatePayload = {
        comments_text: commentsText.substring(0, 500),
        comments_lang: commentsLang,
        recommendations_json: recommendations.slice(0, 5),
        recommendations_lang: recommendationsLang,
        caption: commentsText.substring(0, 300),
        grade: photoGrade,
        manualOverride: recMode === 'Manual',
        aiSuggestedRec: aiSuggestedRecText || recommendations.join('\n')
      };

      await updateDoc(doc(db, 'photos', currentPhoto.id), updatePayload);
      await learnComment(user, selectedProject, { ...currentPhoto, ...updatePayload, komentar: commentsText, rekomendasi: recommendations.join('\n') });

      const updatedPhotos = projectPhotos.map((p, idx) => 
        idx === editorIndex ? { ...p, ...updatePayload } : p
      );
      setProjectPhotos(updatedPhotos);

      if (selectedProject) {
        setSelectedProject(prev => ({ ...prev, photos: updatedPhotos }));
        updateDoc(doc(db, 'projects', selectedProject.id), { photos: updatedPhotos }).catch(() => {});
      }
    } catch (err) {
      console.error("Error saving assessment:", err);
    } finally {
      setSavingCaption(false);
    }
  };

  const handleSaveCaption = handleSaveAssessment;

  const handleSaveAnnotatedImage = async (photo, dataURL, annotationsObj) => {
    if (!photo) return;
    const updatePayload = {
      annotatedBase64: dataURL,
      base64: dataURL,
      thumbnailUrl: dataURL,
      previewUrl: dataURL,
      url: dataURL,
      annotations: annotationsObj
    };

    setProjectPhotos(prev => prev.map(p => 
      (p.id && p.id === photo.id) || p.filename === photo.filename ? { ...p, ...updatePayload } : p
    ));

    setQueue(prev => prev.map(q => 
      (q.id && q.id === photo.id) || q.finalFilename === photo.filename || q.filename === photo.filename ? { ...q, ...updatePayload } : q
    ));

    if (selectedProject) {
      const updatedPhotos = (selectedProject.photos || []).map(p =>
        (p.id && p.id === photo.id) || p.filename === photo.filename ? { ...p, ...updatePayload } : p
      );
      setSelectedProject(prev => ({ ...prev, photos: updatedPhotos }));
      updateDoc(doc(db, 'projects', selectedProject.id), { photos: updatedPhotos }).catch(() => {});
    }

    if (photo.id) {
      try {
        await updateDoc(doc(db, 'photos', photo.id), updatePayload);
      } catch (e) {
        console.error("Error saving annotations to Firestore:", e);
      }
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
      
      // MANDATORY PRE-CONDITION: Frontend converts all image files to base64 before export call
      const urlToBase64 = async (url) => {
        if (!url) return '';
        if (url.startsWith('data:image/')) return url;
        try {
          const res = await fetch(url);
          const blob = await res.blob();
          return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve('');
            reader.readAsDataURL(blob);
          });
        } catch {
          return '';
        }
      };

      const photosWithBase64 = await Promise.all(photosWithUrls.map(async (p) => {
        const base64Str = p.annotatedBase64 || p.base64 || await urlToBase64(p.localUrl || p.url || p.thumbnailUrl);
        return {
          ...p,
          base64: base64Str,
          annotatedBase64: base64Str
        };
      }));

      const response = await exportFn({ 
        project_id: selectedProject.id,
        project_name: selectedProject.name || 'Project',
        selected_photos: selectedPhotos,
        photos_data: photosWithBase64,
        photos: photosWithBase64
      });
      const { downloadUrl, valid } = response.data || {};
      
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
      } else if (!valid && !isMockMode && downloadUrl !== "") {
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

  const onExportWordClick = async () => {
    if (!selectedProject) return;
    setExportError(null);
    setExportingDOCX(true);
    try {
      await handleExportWord(selectedProject, queue, selectedPhotos);
    } catch (err) {
      console.error("Error exporting Word report:", err);
      setExportError(`Word export failed: ${err.message || 'Error'}`);
    } finally {
      setExportingDOCX(false);
    }
  };

  const handlePublishBarExport = (key) => {
    if (key === 'confirm') {
      setConfirmedExports(true);
    } else if (key === 'ppt') {
      handleExport('pptx');
    } else if (key === 'word') {
      onExportWordClick();
    } else if (key === 'excel') {
      handleExport('xlsx');
    }
  };

  const handleRemove = async () => {

    let photosToDelete = [];
    if (allDoneSelected) {
      photosToDelete = [...projectPhotos];
    } else if (selectedPhotos.length > 0) {
      photosToDelete = projectPhotos.filter(p => 
        selectedPhotos.includes(p.filename) || selectedPhotos.includes(p.id)
      );
    }

    if (photosToDelete.length === 0) {
      if (allDoneSelected) {
        setQueue([]);
        setSelectedPhotos([]);
      } else if (selectedPhotos.length > 0) {
        setQueue(prev => prev.filter(item => !selectedPhotos.includes(item.finalFilename)));
        setSelectedPhotos([]);
      }
      return;
    }

    // 1. Delete docs from photos collection
    for (const photo of photosToDelete) {
      if (photo.id) {
        try {
          await deleteDoc(doc(db, 'photos', photo.id));
        } catch (e) {
          console.error("Error deleting photo doc:", e);
        }
      }
    }

    // 2. Update local state
    const deletedFilenames = new Set(photosToDelete.map(p => p.filename));
    const deletedIds = new Set(photosToDelete.map(p => p.id));

    const remainingPhotos = projectPhotos.filter(p => !deletedFilenames.has(p.filename) && !deletedIds.has(p.id));
    setProjectPhotos(remainingPhotos);
    setQueue(prev => prev.filter(item => !deletedFilenames.has(item.finalFilename)));
    setSelectedPhotos([]);

    // 3. Update project record so cached photos list stays permanently in sync
    if (selectedProject) {
      const updatedProject = {
        ...selectedProject,
        photos: remainingPhotos
      };
      setSelectedProject(updatedProject);
      try {
        await updateDoc(doc(db, 'projects', selectedProject.id), { photos: remainingPhotos });
      } catch (e) {}
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
            <span className="text-emerald-400">{dailyUploadCount} / {planLimits.maxDaily} photos</span>
          </div>
          {/* Thin progress bar */}
          <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${Math.min((dailyUploadCount / planLimits.maxDaily) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <button
            onClick={() => setShowFeedbackModal(true)}
            title="Give Feedback"
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 md:px-3 py-1.5 min-h-[36px] text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all active:scale-[0.98]"
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Give Feedback</span>
          </button>

          {(user.role === 'super_admin' || user.role === 'admin' || user.email?.toLowerCase() === 'handoyo.tjung@gmail.com') && (
            <a 
              href="/admin.html" 
              target="_blank" 
              rel="noopener noreferrer"
              title="Admin Panel"
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 md:px-3 py-1.5 min-h-[36px] text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all active:scale-[0.98]"
            >
              <Shield className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Admin Panel</span>
            </a>
          )}

          <div className="hidden md:flex items-center gap-2 rounded-lg bg-slate-950 border border-slate-800 px-3 py-1 text-xs">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-300 font-medium">{user.email}</span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              isPro ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
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

      {/* Main Grid Container with Swipe Track */}
      <div 
        className="flex flex-1 overflow-hidden relative w-full"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className={`w-[200vw] md:w-full h-full flex transition-transform duration-300 ease-in-out md:translate-x-0 md:transition-none ${
          activeTab !== 'upload' && activeTab !== 'export' ? '-translate-x-[100vw]' : 'translate-x-0'
        }`}>
          {/* Left Side: Projects and Uploads */}
          <div className="column-container left-column aspect-[6/19] md:aspect-auto flex flex-col justify-between w-[100vw] md:w-1/2 h-full shrink-0 border-r border-slate-800 bg-slate-950/20 overflow-hidden relative">
          <div className="upper-content-wrapper upper-column-scroll flex-1 overflow-y-auto flex flex-col min-h-0">
          
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
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors"
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
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500 transition-colors"
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

          {/* Drag and Drop Photos Box Section moved to Top Left Column */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/20 shrink-0">
            <UploadZone onFilesSelected={handleFilesSelected} />
          </div>

          {/* Queue List */}
          <div className="photo-list-container flex-1 overflow-y-auto px-4 pb-4 flex flex-col min-h-0 gap-2">
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
                {queue.filter(item => item.status !== 'Rejected').map((item, index) => {
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
                          ? 'border-emerald-400 bg-emerald-950/40 scale-[1.01] shadow-lg'
                          : draggedItemIndex === index
                            ? 'opacity-40 border-dashed border-slate-700'
                            : projectPhotos[editorIndex]?.filename === item.finalFilename
                              ? 'border-yellow-500/60 bg-yellow-950/20'
                              : isSelected
                                ? 'border-emerald-500/60 bg-emerald-950/20'
                                : 'border-slate-900 bg-slate-900/30'
                      } ${!isDone ? 'opacity-60' : ''}`}
                    >
                      {/* LEFT: Row number */}
                      <div
                        className="shrink-0 flex items-center pl-1 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePhotoSelection(item.finalFilename, item.status);
                          if (canNavigate) navigateToPhoto(item.finalFilename);
                        }}
                      >
                        <span className="text-xs font-mono font-semibold text-slate-400 min-w-[20px] text-right">
                          {index + 1}.
                        </span>
                      </div>

                      {/* CENTER: Thumbnail + info — clicking selects photo and navigates to Caption Editor */}
                      <div
                        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
                        onClick={() => {
                          togglePhotoSelection(item.finalFilename, item.status);
                          if (canNavigate) navigateToPhoto(item.finalFilename);
                        }}
                        title="Click to select and view in Caption Editor"
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
                          <p className="truncate text-xs font-medium text-slate-200 group-hover:text-emerald-300 transition-colors">{item.finalFilename}</p>
                          <p className="text-[10px] text-slate-500">{Math.round(item.sizeKb)} KB</p>
                          <p className={`text-[10px] truncate mt-0.5 ${currentCaption ? 'text-emerald-400 font-medium' : 'text-slate-600 italic'}`}>
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
                            <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
                            <span className="text-[10px] font-bold text-emerald-400">{item.progress}%</span>
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
                            {isSelected && (
                              <Check className="h-4 w-4 text-white stroke-[3] shrink-0" title="Selected" />
                            )}
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
          </div>


          {/* Right Side: Photo Carousel Editor and Exporters */}

          <div className="column-container right-column aspect-[6/19] md:aspect-auto w-[100vw] md:w-1/2 h-full shrink-0 flex flex-col overflow-hidden bg-slate-900/10">
            {/* Photo Editor Tab View / Main Pane */}
            <div className="flex-1 flex flex-col overflow-hidden p-4 md:p-6">
            {!selectedProject ? (
              <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-slate-900 bg-slate-900/20 p-8 text-center text-slate-600">
                <Folder className="h-10 w-10 stroke-1 mb-2 text-slate-500" />
                <h3 className="font-semibold text-slate-400 text-sm">No Project Selected</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">
                  Please select or create a project first to edit captions and view uploaded photos.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden gap-3 min-h-0">
                {projectPhotos.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-slate-900 bg-slate-900/20 p-8 text-center text-slate-600 min-h-0">
                    <ImageIcon className="h-10 w-10 stroke-1 mb-2" />
                    <h3 className="font-semibold text-slate-400 text-sm">No uploaded photos</h3>
                    <p className="mt-1 text-xs text-slate-500 max-w-xs">
                      Upload photos for this project to start editing captions. Only successfully validated photos will show here.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Canvas flex-[6] overflow-hidden */}
                    <div className="flex-[6] w-full relative flex flex-col group shrink-0 min-h-0 overflow-hidden items-center justify-center bg-slate-950/40 rounded-2xl border border-slate-800/80 p-1">
                      <div className="w-full h-full relative flex flex-col items-center justify-center overflow-hidden">
                        <AnnotatedImageCanvas
                          photo={projectPhotos[editorIndex]}
                          onSaveAnnotatedImage={handleSaveAnnotatedImage}
                          stageWidth={800}
                          stageHeight={450}
                        />

                        {/* Left arrow overlay */}
                        <button
                          type="button"
                          disabled={editorIndex === 0}
                          onClick={() => setEditorIndex(prev => prev - 1)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none shadow-md"
                          title="Previous photo"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>

                        {/* Right arrow overlay */}
                        <button
                          type="button"
                          disabled={editorIndex === projectPhotos.length - 1}
                          onClick={() => setEditorIndex(prev => prev + 1)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none shadow-md"
                          title="Next photo"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>

                        {/* Index badge */}
                        <span className="absolute top-4 right-4 z-10 rounded-full bg-slate-950/80 border border-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-400 pointer-events-none">
                          {editorIndex + 1} / {projectPhotos.length}
                        </span>
                      </div>
                    </div>

                    {/* Editor flex-[4] overflow-y-auto */}
                    <div className="flex-[4] flex flex-col overflow-y-auto min-h-0 gap-3 pr-1">
                      {/* GRADE SELECTOR */}
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 shadow-sm flex items-center justify-between flex-wrap gap-2 shrink-0">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldAlert className="h-4 w-4 text-emerald-400" />
                        <span>Assessment Grade:</span>
                      </label>
                      <div className="flex gap-1.5 flex-wrap">
                        {['F1 - Minor', 'F2 - Major', 'F3 - Critical'].map((g) => {
                          const active = photoGrade === g;
                          const color = g.includes('F3') ? (active ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-500/20' : 'bg-slate-950 text-rose-400 border-rose-900/40 hover:bg-rose-950/40') : g.includes('F2') ? (active ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-slate-950 text-amber-400 border-amber-900/40 hover:bg-amber-950/40') : (active ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-950 text-emerald-400 border-emerald-900/40 hover:bg-emerald-950/40');
                          return (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setPhotoGrade(g)}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${color}`}
                            >
                              {g}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* CARD A: COMMENTS / KOMENTAR */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-white uppercase tracking-wide">
                            {commentsLang === 'ID' ? 'KOMENTAR' : 'COMMENTS'}
                          </label>
                          <button
                            type="button"
                            onClick={() => setAiAssistOn(!aiAssistOn)}
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold border transition-colors flex items-center gap-1 shadow-sm ${
                              aiAssistOn ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                            title="Toggle AI Auto-Complete & Suggestion Pills"
                          >
                            <Sparkles className="h-3 w-3" />
                            <span>AI Assist: {aiAssistOn ? 'ON' : 'OFF'}</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCommentsText('')}
                            title="Clear"
                            className="flex items-center gap-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1 text-[11px] font-bold transition-colors shadow-sm"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Clear</span>
                          </button>
                        </div>
                      </div>

                      <textarea
                        rows={3}
                        value={commentsText}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n');
                          if (lines.length <= 3) {
                            setCommentsText(e.target.value);
                          } else {
                            setCommentsText(lines.slice(0, 3).join('\n'));
                          }
                        }}
                        placeholder=""
                        className="comments-textarea w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white font-medium outline-none focus:border-emerald-500 placeholder-slate-500 transition-colors resize-none h-[calc(3*1.5rem)] leading-relaxed overflow-y-auto"
                      />

                      {aiAssistOn && aiSuggestions.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-emerald-400 animate-pulse" />
                            <span>AI Suggestions (Click to insert):</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {aiSuggestions.map((pill, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => {
                                  const newLines = commentsText ? (commentsText + '\n' + pill) : pill;
                                  const splitted = newLines.split('\n').slice(0, 3).join('\n');
                                  setCommentsText(splitted);
                                }}
                                className="rounded-lg bg-slate-950 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/50 px-2.5 py-1 text-left text-xs font-medium text-slate-300 hover:text-emerald-300 transition-all max-w-full truncate"
                                title={pill}
                              >
                                + {pill}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* CARD B: ASSESSOR RECOMMENDATION - AI Fire Safety Assessor */}
                    <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/60 p-4 shadow-sm">
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-white uppercase tracking-wide">
                            {commentsLang === 'ID'
                              ? 'REKOMENDASI AI'
                              : 'AI RECOMMENDATION'}
                          </label>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border flex items-center gap-1 shadow-sm ${
                            recMode === 'Auto' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${recMode === 'Auto' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                            <span>{recMode === 'Auto' ? 'Auto' : 'Manual Override'}</span>
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setRecommendations([])}
                          title="Clear"
                          className="flex items-center gap-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1 text-[11px] font-bold transition-colors shadow-sm"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Clear</span>
                        </button>
                      </div>

                      <textarea
                        rows={3}
                        value={Array.isArray(recommendations) ? recommendations.join('\n') : (recommendations || '')}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n');
                          if (lines.length <= 3) {
                            setRecommendations(lines);
                          } else {
                            setRecommendations(lines.slice(0, 3));
                          }
                          if (recMode === 'Auto') setRecMode('Manual');
                        }}
                        placeholder=""
                        className="ai-recommendation-textarea w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white font-medium outline-none focus:border-emerald-500 placeholder-slate-500 transition-colors resize-none h-[calc(3*1.5rem)] leading-relaxed overflow-y-auto"
                      />

                      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={handleGenerateRecommendation}
                            disabled={aiGeneratingRec}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-all disabled:opacity-50 shadow-sm"
                            title="Regenerate recommendation based on current comment and grade"
                          >
                            {aiGeneratingRec ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                            <span>{commentsLang === 'ID' ? 'Regenerate' : 'Regenerate'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRecMode(prev => prev === 'Auto' ? 'Manual' : 'Auto')}
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all shadow-sm ${
                              recMode === 'Manual' ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500 hover:text-white' : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-600'
                            }`}
                            title="Toggle between Auto-fill and Manual Override mode"
                          >
                            <span>{recMode === 'Manual' ? 'Edit Manually (Active)' : 'Edit Manually'}</span>
                          </button>
                        </div>

                        {/* Unified Language Toggle Bahasa / English in the middle */}
                        <div className="flex rounded-lg border border-slate-700 bg-slate-950 p-0.5" title="Auto Translate & Grammar Check all Comments & Recommendation texts">
                          <button
                            type="button"
                            onClick={() => handleLanguageSwitch('ID')}
                            className={`px-3 py-1 text-xs font-bold rounded transition-all ${
                              commentsLang === 'ID' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Bahasa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLanguageSwitch('EN')}
                            className={`px-3 py-1 text-xs font-bold rounded transition-all ${
                              commentsLang === 'EN' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            English
                          </button>
                        </div>

                        {/* Save Caption button moved up in the same line at far right position */}
                        <button
                          onClick={handleSaveAssessment}
                          disabled={savingCaption}
                          className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {savingCaption ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          <span>{commentsLang === 'ID' ? 'Simpan Caption' : 'Save Caption'}</span>
                        </button>
                      </div>
                    </div>
                    </div>
                  </>
                )}
              </div>
            )}
            </div>
            {!isMobileUser && (
              <PublishBar
                position="relative"
                confirmCount={selectedPhotos.length}
                onExport={handlePublishBarExport}
              />
            )}
          </div>
        </div>
      </div>

      {isMobileUser && (
        <PublishBar
          position="fixed"
          confirmCount={selectedPhotos.length}
          onExport={handlePublishBarExport}
        />
      )}

      {/* Mobile Tab bar footer (highly compact responsive overlay) */}
      {!isMobileUser && (
        <div className="flex md:hidden h-14 shrink-0 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 items-center justify-around z-20">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold ${
              activeTab === 'upload' ? 'text-emerald-400' : 'text-slate-500'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>Upload</span>

        </button>

        <button
          onClick={() => setActiveTab('editor')}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold ${
            activeTab === 'editor' ? 'text-emerald-400' : 'text-slate-500'
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          <span>Editor</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold ${
            activeTab === 'export' ? 'text-emerald-400' : 'text-slate-500'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Export</span>
        </button>
      </div>
      )}

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
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/30"
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
      <FeedbackModal
        open={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        user={user}
        isPro={isPro}
        lang={commentsLang}
      />
    </div>
  );
}
