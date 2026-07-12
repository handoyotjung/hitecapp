import { initializeApp } from "firebase/app";
import pptxgen from "pptxgenjs";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { aiGenerateRecommendation } from "./aiAssessor";
import { 
  getAuth, 
  signInWithPopup as fbSignInWithPopup, 
  signOut as fbSignOut, 
  GoogleAuthProvider as fbGoogleAuthProvider,
  onAuthStateChanged as fbOnAuthStateChanged,
  signInWithEmailAndPassword as fbSignInWithEmailAndPassword
} from "firebase/auth";
import { 
  getFirestore, 
  collection as fbCollection, 
  query as fbQuery, 
  where as fbWhere, 
  getDocs as fbGetDocs, 
  doc as fbDoc, 
  getDoc as fbGetDoc, 
  setDoc as fbSetDoc, 
  updateDoc as fbUpdateDoc, 
  onSnapshot as fbOnSnapshot, 
  addDoc as fbAddDoc,
  limit as fbLimit,
  orderBy as fbOrderBy,
  deleteDoc as fbDeleteDoc
} from "firebase/firestore";
import { 
  getStorage, 
  ref as fbRef, 
  uploadBytesResumable as fbUploadBytesResumable, 
  getDownloadURL as fbGetDownloadURL 
} from "firebase/storage";
import { 
  getFunctions, 
  httpsCallable as fbHttpsCallable 
} from "firebase/functions";

// Check if we are running in mock/demo mode because no real Firebase key is provided
export const isMockMode = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === "mock-api-key-hitecmedia";

let auth, db, storage, functions;

// Mock database storage
const mockStore = {
  whitelist_users: {
    "handoyo.tjung@gmail.com": { role: "super_admin", company_id: "co_hitec", plan: "pro", password: "adminpassword", created_at: "2025-01-01" },
    "demo@hitec.id": { role: "user", company_id: "co_hitec", plan: "starter", password: "demopassword", created_at: "2026-01-01" },
    "dummy@hitec.id": { role: "super_admin", company_id: "co_hitec", plan: "pro", password: "dummypassword", created_at: "2026-01-01" },
    "admin@hitec.id": { role: "super_admin", company_id: "co_hitec", plan: "pro", password: "adminpassword", created_at: "2026-01-01" },
    "johan@example.com": { role: "user", company_id: "co_hitec", plan: "starter", password: "userpassword", created_at: "2026-01-01" }
  },
  plan: {
    "starter": { max_daily_photos: 100, max_file_size_kb: 300 },
    "pro": { max_daily_photos: 300, max_file_size_kb: 1024 }
  },
  projects: [],
  photos: []
};

const loadMockStore = () => {
  const cached = localStorage.getItem("hitecmedia_mock_db");
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (!parsed.whitelist_users) {
        parsed.whitelist_users = { ...mockStore.whitelist_users };
      }
      if (!Array.isArray(parsed.projects)) {
        parsed.projects = [];
      }
      if (!Array.isArray(parsed.photos)) {
        parsed.photos = [];
      }
      return parsed;
    } catch (e) {
      return mockStore;
    }
  }
  return mockStore;
};

const saveMockStore = (store) => {
  localStorage.setItem("hitecmedia_mock_db", JSON.stringify(store));
};

// Serialize all store writes to prevent FileReader race conditions in parallel uploads
let _writeMutexQueue = Promise.resolve();
const withStoreMutex = (fn) => {
  _writeMutexQueue = _writeMutexQueue.then(() => fn()).catch(() => {});
  return _writeMutexQueue;
};

if (!isMockMode) {
  // Real Firebase Initialization
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };
  const firebaseApp = initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  storage = getStorage(firebaseApp);
  functions = getFunctions(firebaseApp);
} else {
  // Initialize Mock DB
  if (!localStorage.getItem("hitecmedia_mock_db")) {
    saveMockStore(mockStore);
  }
  auth = { currentUser: null };
  db = {};
  storage = {};
  functions = {};
}

// ----------------------------------------------------
// AUTH WRAPPERS
// ----------------------------------------------------
const authListeners = [];
let mockCurrentUser = null;

try {
  const savedSession = localStorage.getItem('hitecmedia_session') || sessionStorage.getItem('hitecmedia_session');
  if (savedSession) {
    mockCurrentUser = JSON.parse(savedSession);
  }
} catch (e) {
  console.error("Error reading saved session:", e);
}

export const onAuthStateChanged = (authInstance, callback) => {
  if (isMockMode) {
    authListeners.push(callback);
    // Use setTimeout so listener callback executes in next event loop tick
    setTimeout(() => {
      authInstance.currentUser = mockCurrentUser;
      callback(mockCurrentUser);
    }, 50);
    return () => {
      const idx = authListeners.indexOf(callback);
      if (idx > -1) authListeners.splice(idx, 1);
    };
  }
  return fbOnAuthStateChanged(authInstance, callback);
};

export const signInWithPopup = async (authInstance, provider) => {
  if (isMockMode) {
    mockCurrentUser = {
      uid: "mock_user_1234",
      email: "handoyo.tjung@gmail.com",
      displayName: "Handoyo Tjung",
      photoURL: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    };
    authInstance.currentUser = mockCurrentUser;
    authListeners.forEach(cb => cb(mockCurrentUser));
    return { user: mockCurrentUser };
  }
  return fbSignInWithPopup(authInstance, provider);
};

export const signInWithEmailAndPassword = async (authInstance, email, password) => {
  if (isMockMode) {
    const store = loadMockStore();
    const cleanEmail = email.trim().toLowerCase();
    let userDoc = store.whitelist_users && store.whitelist_users[cleanEmail];

    // Always enforce super_admin for handoyo.tjung@gmail.com
    if (cleanEmail === "handoyo.tjung@gmail.com") {
      if (!userDoc) {
        userDoc = { role: "super_admin", company_id: "co_hitec", plan: "pro", password: password || "adminpassword", created_at: "2025-01-01" };
      } else {
        userDoc.role = "super_admin";
        userDoc.plan = "pro";
      }
      store.whitelist_users[cleanEmail] = userDoc;
      saveMockStore(store);
    }

    // Always enforce starter plan for demo@hitec.id even if mobile device cached an older tier
    if (cleanEmail === "demo@hitec.id" && userDoc) {
      userDoc.plan = "starter";
      userDoc.role = "user";
      store.whitelist_users[cleanEmail] = userDoc;
      saveMockStore(store);
    }

    // Allow seamless access for demo/testing accounts (like demo@hitec.id, dummy@hitec.id, admin@hitec.id, or any @hitec.id email)
    const isDemoAccount = cleanEmail === "demo@hitec.id" || cleanEmail === "dummy@hitec.id" || cleanEmail === "admin@hitec.id" || cleanEmail.endsWith("@hitec.id") || cleanEmail.includes("demo") || cleanEmail.includes("dummy");
    if (isDemoAccount && !userDoc) {
      const isAdminOrDummy = cleanEmail.includes("admin") || cleanEmail.includes("dummy");
      userDoc = { role: isAdminOrDummy ? "super_admin" : "user", company_id: "co_hitec", plan: isAdminOrDummy ? "pro" : "starter", password: password || "demopassword", created_at: "2026-01-01" };
      store.whitelist_users[cleanEmail] = userDoc;
      saveMockStore(store);
    }

    if (!userDoc || (!isDemoAccount && userDoc.password !== password)) {
      throw new Error("Invalid email or password.");
    }

    if (userDoc.role === "user" && userDoc.expires_at) {
      const todayStr = new Date().toISOString().split("T")[0];
      if (todayStr > userDoc.expires_at) {
        throw new Error(`Account login expired on ${userDoc.expires_at}. Please contact your Super Admin.`);
      }
    }

    mockCurrentUser = {
      uid: "mock_user_" + Math.random().toString(36).substring(7),
      email: cleanEmail,
      displayName: cleanEmail.split('@')[0],
      photoURL: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    };
    authInstance.currentUser = mockCurrentUser;
    authListeners.forEach(cb => cb(mockCurrentUser));
    return { user: mockCurrentUser };
  }
  return fbSignInWithEmailAndPassword(authInstance, email, password);
};

export const signOut = async (authInstance) => {
  if (isMockMode) {
    mockCurrentUser = null;
    authInstance.currentUser = null;
    localStorage.removeItem('hitecmedia_session');
    sessionStorage.removeItem('hitecmedia_session');
    authListeners.forEach(cb => cb(null));
    return;
  }
  return fbSignOut(authInstance);
};

export class GoogleAuthProvider {
  constructor() {
    if (!isMockMode) {
      return new fbGoogleAuthProvider();
    }
  }
}

// ----------------------------------------------------
// FIRESTORE WRAPPERS
// ----------------------------------------------------
const dbListeners = {};

export const collection = (dbInstance, path) => {
  if (isMockMode) return { path };
  return fbCollection(dbInstance, path);
};

export const doc = (dbInstance, path, docId) => {
  if (isMockMode) {
    if (typeof path === "object" && path.path) {
      return { colPath: path.path, docId };
    }
    return { colPath: path, docId };
  }
  return fbDoc(dbInstance, path, docId);
};

export const getDoc = async (docRef) => {
  if (isMockMode) {
    const store = loadMockStore();
    const col = store[docRef.colPath] || {};
    const data = col[docRef.docId] || null;
    return {
      exists: () => data !== null,
      data: () => data
    };
  }
  return fbGetDoc(docRef);
};

export const updateDoc = async (docRef, data) => {
  if (isMockMode) {
    const store = loadMockStore();
    if (Array.isArray(store[docRef.colPath])) {
      const idx = store[docRef.colPath].findIndex(item => item.id === docRef.docId);
      if (idx > -1) {
        store[docRef.colPath][idx] = { ...store[docRef.colPath][idx], ...data };
        saveMockStore(store);
        triggerDbListeners(docRef.colPath);
      }
    } else if (store[docRef.colPath] && store[docRef.colPath][docRef.docId]) {
      store[docRef.colPath][docRef.docId] = { ...store[docRef.colPath][docRef.docId], ...data };
      saveMockStore(store);
      triggerDbListeners(docRef.colPath);
    }
    return;
  }
  return fbUpdateDoc(docRef, data);
};

export const deleteDoc = async (docRef) => {
  if (isMockMode) {
    const store = loadMockStore();
    if (Array.isArray(store[docRef.colPath])) {
      const idx = store[docRef.colPath].findIndex(item => item.id === docRef.docId);
      if (idx > -1) {
        store[docRef.colPath].splice(idx, 1);
      }
    } else if (store[docRef.colPath] && store[docRef.colPath][docRef.docId]) {
      delete store[docRef.colPath][docRef.docId];
    }
    saveMockStore(store);
    triggerDbListeners(docRef.colPath);
    return;
  }
  return fbDeleteDoc(docRef);
};

export const setDoc = async (docRef, data, options = {}) => {
  if (isMockMode) {
    const store = loadMockStore();
    if (!store[docRef.colPath]) store[docRef.colPath] = {};

    // Prevent overwriting a completed mock status with pending
    let existingStatus = null;
    let existingBase64 = null;
    let existingUrl = null;
    if (Array.isArray(store[docRef.colPath])) {
      const existing = store[docRef.colPath].find(item => item.id === docRef.docId);
      if (existing) {
        existingStatus = existing.status;
        existingBase64 = existing.base64;
        existingUrl = existing.url;
      }
    } else {
      const existing = store[docRef.colPath][docRef.docId];
      if (existing) {
        existingStatus = existing.status;
        existingBase64 = existing.base64;
        existingUrl = existing.url;
      }
    }

    const mergedData = { ...data };
    if (data.status === 'pending' && existingStatus === 'done') {
      mergedData.status = 'done';
    }
    if (!mergedData.base64 && existingBase64) {
      mergedData.base64 = existingBase64;
    }
    if ((!mergedData.url || mergedData.url === 'mock-url') && existingUrl) {
      mergedData.url = existingUrl;
    }

    if (options.merge) {
      if (Array.isArray(store[docRef.colPath])) {
        const idx = store[docRef.colPath].findIndex(item => item.id === docRef.docId);
        if (idx > -1) {
          store[docRef.colPath][idx] = { ...store[docRef.colPath][idx], ...mergedData };
        } else {
          store[docRef.colPath].push({ id: docRef.docId, ...mergedData });
        }
      } else {
        store[docRef.colPath][docRef.docId] = { ...store[docRef.colPath][docRef.docId], ...mergedData };
      }
    } else {
      if (Array.isArray(store[docRef.colPath])) {
        const idx = store[docRef.colPath].findIndex(item => item.id === docRef.docId);
        if (idx > -1) {
          store[docRef.colPath][idx] = { id: docRef.docId, ...mergedData };
        } else {
          store[docRef.colPath].push({ id: docRef.docId, ...mergedData });
        }
      } else {
        store[docRef.colPath][docRef.docId] = mergedData;
      }
    }
    saveMockStore(store);
    triggerDbListeners(docRef.colPath);
    return;
  }
  return fbSetDoc(docRef, data, options);
};

export const addDoc = async (colRef, data) => {
  if (isMockMode) {
    const store = loadMockStore();
    const id = "mock_id_" + Math.random().toString(36).substring(7);
    if (Array.isArray(store[colRef.path])) {
      store[colRef.path].push({ id, ...data });
    } else {
      if (!store[colRef.path]) store[colRef.path] = {};
      store[colRef.path][id] = data;
    }
    saveMockStore(store);
    triggerDbListeners(colRef.path);
    return { id };
  }
  return fbAddDoc(colRef, data);
};

export const query = (colRef, ...constraints) => {
  if (isMockMode) return { colRef, constraints };
  return fbQuery(colRef, ...constraints);
};

export const where = (field, op, value) => {
  if (isMockMode) return { type: 'where', field, op, value };
  return fbWhere(field, op, value);
};

export const limit = (n) => {
  if (isMockMode) return { type: 'limit', n };
  return fbLimit(n);
};

export const orderBy = (field, dir) => {
  if (isMockMode) return { type: 'orderBy', field, dir };
  return fbOrderBy(field, dir);
};

export const getDocs = async (queryInstance) => {
  if (isMockMode) {
    const store = loadMockStore();
    const items = getFilteredItems(store, queryInstance);
    return {
      empty: items.length === 0,
      size: items.length,
      docs: items.map(item => ({
        id: item.id,
        data: () => item
      }))
    };
  }
  return fbGetDocs(queryInstance);
};

export const onSnapshot = (refOrQuery, callback) => {
  if (isMockMode) {
    const colPath = refOrQuery.colRef ? refOrQuery.colRef.path : refOrQuery.path || refOrQuery.colPath;
    if (!dbListeners[colPath]) dbListeners[colPath] = [];
    dbListeners[colPath].push({ refOrQuery, callback });

    const emit = () => {
      // Safety check: only emit if listener is still active
      const stillActive = dbListeners[colPath] && dbListeners[colPath].some(l => l.callback === callback);
      if (!stillActive) return;

      const store = loadMockStore();
      const colData = store[colPath];
      if (refOrQuery.colRef) {
        const items = getFilteredItems(store, refOrQuery);
        callback({
          forEach: (cb) => items.forEach(item => cb({ id: item.id, data: () => item })),
          size: items.length,
          empty: items.length === 0
        });
      } else {
        if (refOrQuery.docId) {
          let docData = null;
          if (Array.isArray(colData)) {
            docData = colData.find(item => item.id === refOrQuery.docId) || colData[refOrQuery.docId] || null;
          } else if (colData && typeof colData === 'object') {
            docData = colData[refOrQuery.docId] || null;
          }
          callback({
            exists: () => docData !== null,
            data: () => docData
          });
        } else if (Array.isArray(colData)) {
          callback({
            forEach: (cb) => colData.forEach(item => cb({ id: item.id, data: () => item })),
            size: colData.length,
            empty: colData.length === 0
          });
        }
      }
    };

    // Use setTimeout so the returned unsubscribe function is bound when the callback executes
    setTimeout(emit, 0);

    return () => {
      if (dbListeners[colPath]) {
        const idx = dbListeners[colPath].findIndex(listener => listener.callback === callback);
        if (idx > -1) dbListeners[colPath].splice(idx, 1);
      }
    };
  }
  return fbOnSnapshot(refOrQuery, callback);
};

const getFilteredItems = (store, queryInstance) => {
  const colPath = queryInstance.colRef.path;
  const data = store[colPath];
  let items = [];

  if (Array.isArray(data)) {
    items = [...data];
  } else if (typeof data === 'object' && data !== null) {
    items = Object.keys(data).map(id => ({ id, email: id, ...data[id] }));
  }

  const constraints = queryInstance.constraints || [];
  constraints.forEach(c => {
    if (c.type === 'where' || c.field) {
      const field = c.field;
      const op = c.op;
      const value = c.value;
      items = items.filter(item => {
        let itemVal = item[field];
        if (field === 'created_by' && !itemVal && item.userId) itemVal = item.userId;
        if (field === 'userId' && !itemVal && item.created_by) itemVal = item.created_by;
        if (op === '==') {
          if (typeof itemVal === 'string' && typeof value === 'string') {
            return itemVal.trim().toLowerCase() === value.trim().toLowerCase();
          }
          return itemVal === value;
        }
        if (op === '>=') return itemVal >= value;
        return true;
      });
    }
  });
  return items;
};

const triggerDbListeners = (colPath) => {
  // Clone the list to prevent index mutation errors if a callback calls unsub() synchronously
  const list = [...(dbListeners[colPath] || [])];
  list.forEach(({ refOrQuery, callback }) => {
    // Only fire if the listener is still registered
    const isRegistered = dbListeners[colPath].some(l => l.callback === callback);
    if (!isRegistered) return;

    const store = loadMockStore();
    const colData = store[colPath];
    if (refOrQuery.colRef) {
      const items = getFilteredItems(store, refOrQuery);
      callback({
        forEach: (cb) => items.forEach(item => cb({ id: item.id, data: () => item })),
        size: items.length,
        empty: items.length === 0
      });
    } else {
      if (refOrQuery.docId) {
        let docData = null;
        if (Array.isArray(colData)) {
          docData = colData.find(item => item.id === refOrQuery.docId) || colData[refOrQuery.docId] || null;
        } else if (colData && typeof colData === 'object') {
          docData = colData[refOrQuery.docId] || null;
        }
        callback({
          exists: () => docData !== null,
          data: () => docData
        });
      } else if (Array.isArray(colData)) {
        callback({
          forEach: (cb) => colData.forEach(item => cb({ id: item.id, data: () => item })),
          size: colData.length,
          empty: colData.length === 0
        });
      } else if (colData && typeof colData === 'object') {
        callback({
          forEach: (cb) => Object.keys(colData).forEach(id => cb({ id, data: () => ({ id, ...colData[id] }) })),
          size: Object.keys(colData).length,
          empty: Object.keys(colData).length === 0
        });
      }
    }
  });
};

// ----------------------------------------------------
// STORAGE WRAPPERS
// ----------------------------------------------------
export const ref = (storageInstance, path) => {
  if (isMockMode) return { path };
  return fbRef(storageInstance, path);
};

export const uploadBytesResumable = (storageRef, file) => {
  if (isMockMode) {
    let progress = 0;
    const task = {
      snapshot: {
        ref: storageRef
      },
      on: (event, progressCb, errorCb, completeCb) => {
        const run = () => {
          progress += 20;
          if (progress <= 100) {
            progressCb({
              bytesTransferred: progress,
              totalBytes: 100
            });
            if (progress === 100) {
              setTimeout(() => {
                const parts = storageRef.path.split('/');
                const project_id = parts[1];
                const date_str = parts[2];
                const filename = parts[3];
                const photoId = `${project_id}_${filename.replace(/\./g, '_')}`;
                const sizeKb = file.size / 1024;

                // Read file to Base64, then serialize the store write through mutex
                // to prevent parallel FileReader callbacks overwriting each other
                const reader = new FileReader();
                reader.onloadend = () => {
                  const base64data = reader.result;
                  withStoreMutex(() => new Promise(resolve => {
                    const store = loadMockStore();

                    let status = 'done';
                    let reason = null;
                    if (sizeKb > 1024) { status = 'rejected'; reason = 'FILE_TOO_LARGE'; }

                    if (Array.isArray(store.photos)) {
                      const idx = store.photos.findIndex(p => p.id === photoId);
                      const blobUrl = URL.createObjectURL(file);
                      if (idx > -1) {
                        store.photos[idx] = {
                          ...store.photos[idx],
                          status,
                          reason,
                          url: blobUrl,
                          base64: base64data
                        };
                      } else {
                        store.photos.push({
                          id: photoId,
                          project_id,
                          company_id: 'co_hitec',
                          filename,
                          original_filename: file.name,
                          gcs_path: storageRef.path,
                          url: blobUrl,
                          base64: base64data,
                          size_kb: sizeKb,
                          upload_date: date_str,
                          uploaded_by: "handoyo.tjung@gmail.com",
                          caption: '',
                          status,
                          reason,
                          created_at: new Date().toISOString()
                        });
                      }
                    }

                    saveMockStore(store);
                    triggerDbListeners('photos');
                    completeCb();
                    resolve();
                  }));
                };
                reader.readAsDataURL(file);
              }, 150);
            } else {
              setTimeout(run, 80);
            }
          }
        };
        setTimeout(run, 80);
      }
    };
    return task;
  }
  return fbUploadBytesResumable(storageRef, file);
};

export const getDownloadURL = async (storageRef) => {
  if (isMockMode) {
    const store = loadMockStore();
    if (Array.isArray(store.photos)) {
      const photo = store.photos.find(p => p.gcs_path === storageRef.path);
      if (photo) return photo.url;
    }
    return "mock-url";
  }
  return fbGetDownloadURL(storageRef);
};

// ----------------------------------------------------
// FUNCTIONS WRAPPERS
// ----------------------------------------------------
export const httpsCallable = (functionsInstance, name) => {
  if (isMockMode) {
    return async (data) => {
      console.log(`Mock Callable: ${name}`, data);
      const project_id = data.project_id;

      // Mock: getSignedUploadUrl returns empty signed_url so the client falls back
      // to the standard uploadBytesResumable path (unchanged in mock mode)
      if (name === 'getSignedUploadUrl') {
        return { data: { signed_url: '' } };
      }

      // Prefer client-provided photos_data (includes localUrl blob URLs)
      let photosToExport = data.photos_data || [];

      // Compute filename: project name_todays date(YYMMDD)_HHMM
      const d = new Date();
      const yy = String(d.getFullYear()).slice(-2);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      const yymmdd_hhmm = `${yy}${mm}${dd}_${hh}${min}`;
      const rawProjectName = data.project_name || data.project_id || "Project";
      const sanitizedProjectName = rawProjectName.replace(/[\\/:*?"<>|]/g, '_').trim();
      const exportFileName = `${sanitizedProjectName}_${yymmdd_hhmm}`;

      if (name === 'exportPPTX') {
        const SLIDE_W = 10;
        const SLIDE_H = 5.625;
        const pptx = new pptxgen();
        pptx.defineLayout({ name: 'custom', width: SLIDE_W, height: SLIDE_H });
        pptx.layout = 'custom';

        const toBase64 = async (blobUrl) => {
          try {
            const resp = await fetch(blobUrl);
            const blob = await resp.blob();
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } catch {
            return null;
          }
        };

        const formattedGenTime = `${dd}-${mm}-20${yy} ${hh}:${min}`;

        for (let idx = 0; idx < photosToExport.length; idx++) {
          const photo = photosToExport[idx];
          const slide = pptx.addSlide();

          // Ensure recommendations exist (auto-generate 1x if empty)
          let recs = photo.recommendations_json;
          if (!Array.isArray(recs) || recs.length === 0) {
            const aiRes = await aiGenerateRecommendation(photo, photo.comments_text || photo.caption, photo.recommendations_lang || 'ID');
            recs = aiRes.recommendations;
          }

          // Header bar
          slide.addShape(pptx.ShapeType.rect, {
            x: 0, y: 0, w: SLIDE_W, h: 0.55,
            fill: { color: "1F4E79" }
          });
          slide.addText("FIRE SAFETY INSPECTION REPORT", {
            x: 0.5, y: 0.08, w: 5.5, h: 0.4,
            fontName: "Arial", fontSize: 16, bold: true, color: "FFFFFF"
          });
          slide.addText(`Project: ${rawProjectName}`, {
            x: 6.0, y: 0.1, w: 3.5, h: 0.35,
            fontName: "Arial", fontSize: 12, bold: true, color: "E0EEFF", align: "right"
          });

          // Left 45%: Image with border
          const imgSrc = photo.base64 || (photo.localUrl ? await toBase64(photo.localUrl) : null);
          if (imgSrc) {
            slide.addImage({
              data: imgSrc,
              x: 0.4, y: 0.75, w: 4.3, h: 4.25,
              sizing: { type: "contain", w: 4.3, h: 4.25 }
            });
          }

          // Right 55%: Metadata & Findings
          const obsText = photo.comments_text || photo.caption || "No visual defects observed.";
          const obsLines = obsText.split('\n').filter(Boolean).slice(0, 5);
          const dateStr = photo.exif_date || `${dd}-${mm}-20${yy}`;
          const gpsStr = photo.exif_gps || "Location Recorded";

          slide.addText(`Date : ${dateStr}   |   Location: ${gpsStr}`, {
            x: 4.9, y: 0.75, w: 4.7, h: 0.3,
            fontName: "Arial", fontSize: 10, bold: true, color: "555555"
          });

          slide.addText("OBSERVATION / OBSERVASI", {
            x: 4.9, y: 1.15, w: 4.7, h: 0.3,
            fontName: "Arial", fontSize: 13, bold: true, color: "C00000"
          });

          const obsRuns = obsLines.map(l => ({
            text: l.replace(/^\d+[\.\)\-]\s*/, '') + '\n',
            options: { bullet: true, fontSize: 11, color: "333333" }
          }));
          slide.addText(obsRuns, {
            x: 4.9, y: 1.45, w: 4.7, h: 1.4,
            fontName: "Arial", valign: "top"
          });

          slide.addText("ASSESSOR RECOMMENDATION / REKOMENDASI", {
            x: 4.9, y: 2.9, w: 4.7, h: 0.3,
            fontName: "Arial", fontSize: 13, bold: true, color: "1F4E79"
          });

          const recRuns = recs.slice(0, 5).map(r => {
            const isCrit = r.includes("[CRITICAL]");
            const isMaj = r.includes("[MAJOR]");
            return {
              text: r.replace(/^\d+[\.\)\-]\s*/, '') + '\n',
              options: {
                bullet: true,
                fontSize: 11,
                bold: isCrit,
                color: isCrit ? "C00000" : isMaj ? "ED7D31" : "1F4E79"
              }
            };
          });
          slide.addText(recRuns, {
            x: 4.9, y: 3.2, w: 4.7, h: 1.8,
            fontName: "Arial", valign: "top"
          });

          // Footer
          slide.addText(`Page ${idx + 1} of ${photosToExport.length}  |  Generated: ${formattedGenTime}`, {
            x: 0.5, y: 5.25, w: 9.0, h: 0.25,
            fontName: "Arial", fontSize: 9, color: "777777", align: "center"
          });
        }

        await pptx.writeFile({ fileName: `FSA_Report_${exportFileName}.pptx` });
        return { data: { downloadUrl: "" } };
      }

      if (name === 'exportXLSX') {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "HitecApp Fire Safety Assessor";
        workbook.created = new Date();

        const totalFindings = photosToExport.length || 1;
        const lastRow = totalFindings * 22;

        const ws = workbook.addWorksheet("Inspection Report", {
          pageSetup: {
            paperSize: 9, // A4 (210mm x 297mm)
            orientation: "portrait",
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: totalFindings,
            printArea: `A1:J${lastRow}`,
            margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 }
          },
          views: [{ showGridLines: false }]
        });

        ws.pageSetup.paperSize = 9;
        ws.pageSetup.orientation = "portrait";
        ws.pageSetup.fitToPage = true;
        ws.pageSetup.fitToWidth = 1;
        ws.pageSetup.fitToHeight = totalFindings;
        ws.pageSetup.printArea = `A1:J${lastRow}`;

        ws.headerFooter.oddHeader = `&C&BFIRE SAFETY INSPECTION REPORT - ${rawProjectName}`;
        ws.headerFooter.oddFooter = `&CPage &P of &N`;

        // Column widths: A-E = 10, F-J = 15
        for (let c = 1; c <= 5; c++) ws.getColumn(c).width = 10;
        for (let c = 6; c <= 10; c++) ws.getColumn(c).width = 15;

        let riskCounts = { CRITICAL: 0, MAJOR: 0, MINOR: 0, COMPLIANT: 0 };

        const toBase64String = async (blobUrl) => {
          try {
            const resp = await fetch(blobUrl);
            const blob = await resp.blob();
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const res = reader.result;
                resolve(typeof res === 'string' ? res.split(',')[1] : null);
              };
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } catch {
            return null;
          }
        };

        const fitPhotoToCanvas = (base64Str, targetW = 1200, targetH = 900) => {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = targetW;
              canvas.height = targetH;
              const ctx = canvas.getContext('2d');
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, targetW, targetH);

              const imgRatio = img.naturalWidth / img.naturalHeight;
              const boxRatio = targetW / targetH;
              let drawW = targetW;
              let drawH = targetW / imgRatio;

              if (imgRatio < boxRatio) {
                drawH = targetH;
                drawW = targetH * imgRatio;
              } else {
                drawW = targetW;
                drawH = targetW / imgRatio;
                if (drawH > targetH) {
                  drawH = targetH;
                  drawW = targetH * imgRatio;
                }
              }

              const offsetX = (targetW - drawW) / 2;
              const offsetY = (targetH - drawH) / 2;

              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

              ctx.strokeStyle = '#CBD5E1';
              ctx.lineWidth = 3;
              ctx.strokeRect(offsetX, offsetY, drawW, drawH);

              const resultBase64 = canvas.toDataURL('image/png').split(',')[1];
              resolve(resultBase64);
            };
            img.onerror = () => resolve(base64Str);
            img.src = `data:image/png;base64,${base64Str}`;
          });
        };

        for (let idx = 0; idx < photosToExport.length; idx++) {
          const photo = photosToExport[idx];
          const startRow = idx * 22 + 1;

          // Ensure recommendations exist
          let recs = photo.recommendations_json;
          if (!Array.isArray(recs) || recs.length === 0) {
            const aiRes = await aiGenerateRecommendation(photo, photo.comments_text || photo.caption, photo.recommendations_lang || 'ID');
            recs = aiRes.recommendations;
          }

          // Determine highest risk
          let highestRisk = "COMPLIANT";
          let riskColor = "548235";
          let refClause = "NFPA 10 / SNI 03-3985-2000";

          for (const r of recs) {
            if (r.includes("[CRITICAL]")) { highestRisk = "CRITICAL"; riskColor = "C00000"; riskCounts.CRITICAL++; break; }
            else if (r.includes("[MAJOR]")) { highestRisk = "MAJOR"; riskColor = "ED7D31"; riskCounts.MAJOR++; }
            else if (r.includes("[MINOR]")) { if (highestRisk !== "MAJOR") { highestRisk = "MINOR"; riskColor = "D29000"; } riskCounts.MINOR++; }
            else { riskCounts.COMPLIANT++; }
            const refMatch = r.match(/Ref:\s*(.+)$/i);
            if (refMatch) refClause = refMatch[1].trim();
          }

          // Row 1-2: HEADER BLOCK
          ws.mergeCells(`A${startRow}:J${startRow + 1}`);
          const hdrCell = ws.getCell(`A${startRow}`);
          hdrCell.value = `INSPECTION FINDING #${idx + 1}`;
          hdrCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
          hdrCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E79" } };
          hdrCell.alignment = { vertical: "middle", horizontal: "center" };

          // Row 3-4: META INFO
          ws.getCell(`A${startRow + 2}`).value = "Date :";
          ws.getCell(`A${startRow + 2}`).font = { name: "Arial", size: 10, bold: true };
          ws.mergeCells(`B${startRow + 2}:D${startRow + 2}`);
          ws.getCell(`B${startRow + 2}`).value = photo.exif_date || `${dd}-${mm}-20${yy}`;

          ws.getCell(`E${startRow + 2}`).value = "Location :";
          ws.getCell(`E${startRow + 2}`).font = { name: "Arial", size: 10, bold: true };
          ws.mergeCells(`F${startRow + 2}:J${startRow + 2}`);
          ws.getCell(`F${startRow + 2}`).value = photo.exif_gps || "-";

          ws.getCell(`A${startRow + 3}`).value = "Filename :";
          ws.getCell(`A${startRow + 3}`).font = { name: "Arial", size: 10, bold: true };
          ws.mergeCells(`B${startRow + 3}:J${startRow + 3}`);
          const fnCell = ws.getCell(`B${startRow + 3}`);
          fnCell.value = photo.filename || `photo_${idx + 1}.png`;
          fnCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "FF555555" } };

          // Row 5-18: IMAGE & TEXT CONTENT
          // Insert Image in Col A-E (Rows startRow+3 to startRow+17 in 0-indexed)
          let base64Data = photo.base64 ? photo.base64.split(',').pop() : (photo.localUrl ? await toBase64String(photo.localUrl) : null);
          if (base64Data) {
            try {
              const fittedBase64 = await fitPhotoToCanvas(base64Data, 1200, 900);
              const imageId = workbook.addImage({
                base64: fittedBase64,
                extension: 'png'
              });
              ws.addImage(imageId, {
                tl: { col: 0, row: startRow + 3 },
                br: { col: 5, row: startRow + 17 },
                editAs: 'oneCell'
              });
            } catch (e) {
              console.warn("Could not attach image to Excel block", e);
            }
          }

          // Col F-J: Text Content
          const obsCell = ws.getCell(`F${startRow + 4}`);
          obsCell.value = "OBSERVATION / OBSERVASI";
          obsCell.font = { name: "Arial", size: 12, bold: true, color: { argb: "FFC00000" } };

          const obsText = photo.comments_text || photo.caption || "No defects noted.";
          const obsLines = obsText.split('\n').filter(Boolean).slice(0, 5);
          obsLines.forEach((line, lIdx) => {
            ws.mergeCells(`F${startRow + 5 + lIdx}:J${startRow + 5 + lIdx}`);
            const cell = ws.getCell(`F${startRow + 5 + lIdx}`);
            cell.value = `• ${line.replace(/^\d+[\.\)\-]\s*/, '')}`;
            cell.font = { name: "Arial", size: 10 };
            cell.alignment = { wrapText: true };
          });

          const recCell = ws.getCell(`F${startRow + 11}`);
          recCell.value = "ASSESSOR RECOMMENDATION / REKOMENDASI";
          recCell.font = { name: "Arial", size: 12, bold: true, color: { argb: "FF1F4E79" } };

          recs.slice(0, 5).forEach((line, lIdx) => {
            ws.mergeCells(`F${startRow + 12 + lIdx}:J${startRow + 12 + lIdx}`);
            const cell = ws.getCell(`F${startRow + 12 + lIdx}`);
            cell.value = `• ${line.replace(/^\d+[\.\)\-]\s*/, '')}`;
            const isCrit = line.includes("[CRITICAL]");
            cell.font = {
              name: "Arial",
              size: 10,
              bold: isCrit,
              color: { argb: isCrit ? "FFC00000" : "FF1F4E79" }
            };
            cell.alignment = { wrapText: true };
          });

          // Row 19-20: RISK SUMMARY
          ws.mergeCells(`A${startRow + 18}:J${startRow + 19}`);
          const riskCell = ws.getCell(`A${startRow + 18}`);
          riskCell.value = `Risk Level: [${highestRisk}]  |  Ref Clause: ${refClause}`;
          riskCell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
          riskCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${riskColor}` } };
          riskCell.alignment = { vertical: "middle", horizontal: "center" };

          // Clean page break after every single INSPECTION FINDING block
          ws.getRow(startRow + 20).addPageBreak();
        }

        // SHEET 2: SUMMARY DASHBOARD
        const sumWs = workbook.addWorksheet("SUMMARY DASHBOARD", {
          pageSetup: {
            paperSize: 9, // A4
            orientation: "portrait",
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 1,
            printArea: "A1:B8"
          },
          views: [{ showGridLines: true }]
        });
        sumWs.getColumn(1).width = 30;
        sumWs.getColumn(2).width = 20;

        sumWs.getCell("A1").value = "FIRE SAFETY INSPECTION SUMMARY";
        sumWs.getCell("A1").font = { name: "Arial", size: 16, bold: true, color: { argb: "FF1F4E79" } };

        const summaryData = [
          ["Total Photos Assessed", photosToExport.length],
          ["Total CRITICAL Findings", riskCounts.CRITICAL],
          ["Total MAJOR Findings", riskCounts.MAJOR],
          ["Total MINOR Findings", riskCounts.MINOR],
          ["Total COMPLIANT Items", riskCounts.COMPLIANT]
        ];

        summaryData.forEach((row, rIdx) => {
          const rowNum = rIdx + 3;
          sumWs.getCell(`A${rowNum}`).value = row[0];
          sumWs.getCell(`A${rowNum}`).font = { name: "Arial", size: 11, bold: true };
          sumWs.getCell(`B${rowNum}`).value = row[1];
          sumWs.getCell(`B${rowNum}`).font = { name: "Arial", size: 11 };
        });

        // Write buffer and download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `FSA_Report_A4_${exportFileName}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return { data: { downloadUrl: "" } };
      }

      return { data: { valid: true } };
    };
  }
  return fbHttpsCallable(functionsInstance, name);
};

export { auth, db, storage, functions };
export default isMockMode;
