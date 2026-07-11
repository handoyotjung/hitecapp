import { initializeApp } from "firebase/app";
import pptxgen from "pptxgenjs";
import * as XLSX from "xlsx";
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

      // Compute filename: project name_todays date(YYMMDD)
      const d = new Date();
      const yy = String(d.getFullYear()).slice(-2);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yymmdd = `${yy}${mm}${dd}`;
      const rawProjectName = data.project_name || data.project_id || "Project";
      const sanitizedProjectName = rawProjectName.replace(/[\\/:*?"<>|]/g, '_').trim();
      const exportFileName = `${sanitizedProjectName}_${yymmdd}`;

      if (name === 'exportPPTX') {
        // Slide dimensions in inches (16:9 widescreen)
        const SLIDE_W = 10;
        const SLIDE_H = 5.625;
        const IMG_MAX_W = 9.0;
        const IMG_MAX_H = 4.6;

        // Generate real client-side PowerPoint presentation
        const pptx = new pptxgen();
        pptx.defineLayout({ name: 'custom', width: SLIDE_W, height: SLIDE_H });
        pptx.layout = 'custom';

        // Convert blob URL to base64 via fetch for pptxgenjs
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

        // Measure natural image dimensions from a blob URL
        const getNaturalSize = (blobUrl) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
            img.onerror = () => resolve({ w: 0, h: 0 });
            img.src = blobUrl;
          });

        for (const photo of photosToExport) {
          const slide = pptx.addSlide();

          // Try to embed photo: use base64 or fetch from localUrl
          const imgSrc = photo.base64 || (photo.localUrl ? await toBase64(photo.localUrl) : null);
          let fitW = IMG_MAX_W;
          let fitH = IMG_MAX_H;
          let imgY = 0.25;

          if (imgSrc) {
            const { w: natW, h: natH } = photo.localUrl
              ? await getNaturalSize(photo.localUrl)
              : { w: 0, h: 0 };

            if (natW > 0 && natH > 0) {
              const imgAspect = natW / natH;
              const areaAspect = IMG_MAX_W / IMG_MAX_H;
              if (imgAspect > areaAspect) {
                fitW = IMG_MAX_W;
                fitH = IMG_MAX_W / imgAspect;
              } else {
                fitH = IMG_MAX_H;
                fitW = IMG_MAX_H * imgAspect;
              }
            }

            // Vertically balance photo + caption block so there is no big gap
            const gap = 0.15;
            const captionH = 0.45;
            const totalBlockH = fitH + gap + captionH;
            imgY = Math.max(0.2, (SLIDE_H - totalBlockH) / 2);
            const imgX = (SLIDE_W - fitW) / 2;

            slide.addImage({ data: imgSrc, x: imgX, y: imgY, w: fitW, h: fitH });
          }

          // Place caption directly below the photo with minimal gap
          const captionY = imgSrc ? imgY + fitH + 0.15 : SLIDE_H / 2;
          slide.addText(photo.caption || "No Caption", {
            x: 0.5,
            y: captionY,
            w: 9.0,
            h: 0.45,
            fontName: "Arial",
            fontSize: 14,
            align: "center",
            color: "333333"
          });
        }

        // Trigger local file download using project name_YYMMDD
        await pptx.writeFile({ fileName: `${exportFileName}.pptx` });
        return { data: { downloadUrl: "" } };
      }
      
      if (name === 'exportXLSX') {
        // Generate real client-side Excel spreadsheet
        const excelRows = photosToExport.map((photo, index) => ({
          "No": index + 1,
          "Photo Filename": photo.filename,
          "Caption": photo.caption || ""
        }));

        if (excelRows.length === 0) {
          excelRows.push({ "No": "", "Photo Filename": "No data selected", "Caption": "" });
        }

        const worksheet = XLSX.utils.json_to_sheet(excelRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Photos Report");

        // Trigger local file download using project name_YYMMDD
        XLSX.writeFile(workbook, `${exportFileName}.xlsx`);
        return { data: { downloadUrl: "" } };
      }

      return { data: { valid: true } };
    };
  }
  return fbHttpsCallable(functionsInstance, name);
};

export { auth, db, storage, functions };
export default isMockMode;
