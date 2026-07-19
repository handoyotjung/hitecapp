import { initializeApp } from "firebase/app";
import pptxgen from "pptxgenjs";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const fixOOXMLDrawingsExt = async (buffer, extents = []) => {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const drawingFiles = Object.keys(zip.files).filter(name => /^xl\/drawings\/drawing\d+\.xml$/i.test(name));
    for (const drawingName of drawingFiles) {
      let drawingXml = await zip.file(drawingName).async("string");
      let picIndex = 0;
      drawingXml = drawingXml.replace(/<xdr:pic>[\s\S]*?<\/xdr:pic>/g, (picXml) => {
        const extObj = extents[picIndex] || { cx: 11430000, cy: 8572500 };
        picIndex++;
        return picXml.replace(/<xdr:spPr>([\s\S]*?)<a:ext\b[^>]*\/>/g, (match, before) => {
          return `<xdr:spPr>${before}<a:ext cx="${extObj.cx}" cy="${extObj.cy}"/>`;
        });
      });
      zip.file(drawingName, drawingXml);
    }
    return await zip.generateAsync({ type: "arraybuffer" });
  } catch (err) {
    console.warn("Could not post-process OOXML drawing parts:", err);
    return buffer;
  }
};
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
    "admin@hitec.id": { role: "super_admin", company_id: "co_hitec", plan: "pro", password: "demopassword", created_at: "2026-01-01" },
    "demo@hitec.id": { role: "user", company_id: "co_hitec", plan: "starter", password: "demopassword", created_at: "2026-01-01" },
    "dummy@hitec.id": { role: "user", company_id: "co_hitec", plan: "starter", password: "demopassword", created_at: "2026-01-01" }
  },
  plan: {
    "starter": { max_daily_photos: 100, max_file_size_kb: 300 },
    "pro": { max_daily_photos: 300, max_file_size_kb: 1024 }
  },
  projects: [],
  photos: [],
  feedback: []
};

const loadMockStore = () => {
  const cached = localStorage.getItem("hitecmedia_mock_db");
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      parsed.whitelist_users = parsed.whitelist_users || {};
      if (!parsed.whitelist_users["handoyo.tjung@gmail.com"]) {
        parsed.whitelist_users["handoyo.tjung@gmail.com"] = { role: "super_admin", company_id: "co_hitec", plan: "pro", password: "adminpassword", created_at: "2025-01-01" };
      }
      if (!parsed.whitelist_users["admin@hitec.id"]) {
        parsed.whitelist_users["admin@hitec.id"] = { role: "super_admin", company_id: "co_hitec", plan: "pro", password: "demopassword", created_at: "2026-01-01" };
      }
      if (!parsed.whitelist_users["demo@hitec.id"]) {
        parsed.whitelist_users["demo@hitec.id"] = { role: "user", company_id: "co_hitec", plan: "starter", password: "demopassword", created_at: "2026-01-01" };
      }
      if (!parsed.whitelist_users["dummy@hitec.id"]) {
        parsed.whitelist_users["dummy@hitec.id"] = { role: "user", company_id: "co_hitec", plan: "starter", password: "demopassword", created_at: "2026-01-01" };
      }
      if (!Array.isArray(parsed.projects)) {
        parsed.projects = [];
      }
      if (!Array.isArray(parsed.photos)) {
        parsed.photos = [];
      }
      if (!Array.isArray(parsed.feedback)) {
        parsed.feedback = [];
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

    // Allow login access for demo/testing accounts and ensure they are recorded across store.whitelist_users and sessions table
    const isDemoAccount = cleanEmail === "demo@hitec.id" || cleanEmail === "dummy@hitec.id" || cleanEmail === "admin@hitec.id" || cleanEmail.endsWith("@hitec.id");
    if (isDemoAccount && !userDoc) {
      const isAdminOrDummy = cleanEmail.includes("admin") || cleanEmail.includes("dummy");
      userDoc = { role: isAdminOrDummy ? "super_admin" : "user", company_id: "co_hitec", plan: isAdminOrDummy ? "pro" : "starter", password: password || "demopassword", created_at: "2026-01-01" };
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

    // Record session into whitelist_users and hitec_user_sessions_v1 table for system-wide active session visibility
    const newToken = 'tok_' + Math.random().toString(36).substring(2);
    const nowStr = new Date().toISOString();
    userDoc.session_token = newToken;
    userDoc.session_device_name = typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile') ? 'Assessor Mobile Device' : (typeof navigator !== 'undefined' && navigator.userAgent.includes('Win') ? 'Windows PC - Chrome' : 'Assessor Device');
    userDoc.session_ip_address = '127.0.0.1';
    userDoc.session_login_at = nowStr;
    userDoc.session_last_activity = nowStr;
    if (!store.whitelist_users) store.whitelist_users = {};
    store.whitelist_users[cleanEmail] = userDoc;
    saveMockStore(store);

    try {
      if (typeof localStorage !== 'undefined') {
        const rawSessions = localStorage.getItem('hitec_user_sessions_v1');
        let sessions = rawSessions ? JSON.parse(rawSessions) : [];
        const nextId = sessions.length > 0 ? Math.max(...sessions.map(s => s.id || 0)) + 1 : 1;
        sessions.push({
          id: nextId,
          user_id: cleanEmail,
          token: newToken,
          device_id: 'dev_' + Math.random().toString(36).substring(2, 10),
          device_name: userDoc.session_device_name,
          ip_address: userDoc.session_ip_address,
          login_at: nowStr,
          last_activity: nowStr,
          logout_at: null,
          status: 'ACTIVE'
        });
        localStorage.setItem('hitec_user_sessions_v1', JSON.stringify(sessions));
      }
    } catch (e) {}

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

// ----------------------------------------------------
// MULTI-DEVICE REAL-TIME SYNCHRONIZATION & LWW ENGINE
// ----------------------------------------------------
let realtimeSyncChannel = null;
if (typeof window !== 'undefined') {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      realtimeSyncChannel = new BroadcastChannel('hitec_realtime_sync_channel');
      realtimeSyncChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'DB_MUTATION' && event.data.colPath) {
          triggerDbListeners(event.data.colPath);
        }
      };
    }
  } catch (e) {
    console.warn("BroadcastChannel init failed:", e);
  }

  window.addEventListener('storage', (event) => {
    if (event.key === 'hitecmedia_mock_db') {
      Object.keys(dbListeners).forEach(colPath => {
        triggerDbListeners(colPath);
      });
    }
  });
}

export const broadcastDbMutation = (colPath, docId = null) => {
  triggerDbListeners(colPath);
  if (realtimeSyncChannel && typeof realtimeSyncChannel.postMessage === 'function') {
    try {
      realtimeSyncChannel.postMessage({
        type: 'DB_MUTATION',
        colPath,
        docId,
        timestamp: Date.now()
      });
    } catch (e) {}
  }
};

export const updateDoc = async (docRef, data) => {
  if (isMockMode) {
    const store = loadMockStore();
    const lwwTime = data._lww_timestamp || Date.now();
    const mergedPayload = { ...data, _lww_timestamp: lwwTime, updated_at: new Date().toISOString() };

    if (Array.isArray(store[docRef.colPath])) {
      const idx = store[docRef.colPath].findIndex(item => item.id === docRef.docId);
      if (idx > -1) {
        const existing = store[docRef.colPath][idx];
        // Last-Write-Wins (LWW) conflict check: prevent stale data from overwriting newer updates
        if (!existing._lww_timestamp || lwwTime >= existing._lww_timestamp) {
          store[docRef.colPath][idx] = { ...existing, ...mergedPayload };
          saveMockStore(store);
          broadcastDbMutation(docRef.colPath, docRef.docId);
        }
      }
    } else if (store[docRef.colPath] && store[docRef.colPath][docRef.docId]) {
      const existing = store[docRef.colPath][docRef.docId];
      if (!existing._lww_timestamp || lwwTime >= existing._lww_timestamp) {
        store[docRef.colPath][docRef.docId] = { ...existing, ...mergedPayload };
        saveMockStore(store);
        broadcastDbMutation(docRef.colPath, docRef.docId);
      }
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
    broadcastDbMutation(docRef.colPath, docRef.docId);
    return;
  }
  return fbDeleteDoc(docRef);
};

export const setDoc = async (docRef, data, options = {}) => {
  if (isMockMode) {
    const store = loadMockStore();
    if (!store[docRef.colPath]) store[docRef.colPath] = {};

    let existingStatus = null;
    let existingBase64 = null;
    let existingUrl = null;
    let existingLww = 0;
    if (Array.isArray(store[docRef.colPath])) {
      const existing = store[docRef.colPath].find(item => item.id === docRef.docId);
      if (existing) {
        existingStatus = existing.status;
        existingBase64 = existing.base64;
        existingUrl = existing.url;
        existingLww = existing._lww_timestamp || 0;
      }
    } else {
      const existing = store[docRef.colPath][docRef.docId];
      if (existing) {
        existingStatus = existing.status;
        existingBase64 = existing.base64;
        existingUrl = existing.url;
        existingLww = existing._lww_timestamp || 0;
      }
    }

    const lwwTime = data._lww_timestamp || Date.now();
    // LWW verification
    if (existingLww > 0 && lwwTime < existingLww && !options.force) {
      return;
    }

    const mergedData = { ...data, _lww_timestamp: lwwTime, updated_at: new Date().toISOString() };
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
    broadcastDbMutation(docRef.colPath, docRef.docId);
    return;
  }
  return fbSetDoc(docRef, data, options);
};

export const addDoc = async (colRef, data) => {
  if (isMockMode) {
    const store = loadMockStore();
    const id = "mock_id_" + Math.random().toString(36).substring(7);
    const lwwTime = data._lww_timestamp || Date.now();
    const docData = { id, _lww_timestamp: lwwTime, updated_at: new Date().toISOString(), ...data };
    if (Array.isArray(store[colRef.path])) {
      store[colRef.path].push(docData);
    } else {
      if (!store[colRef.path]) store[colRef.path] = {};
      store[colRef.path][id] = docData;
    }
    saveMockStore(store);
    broadcastDbMutation(colRef.path, id);
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
  const nowMs = Date.now();
  items = items.filter(item => !item.expires_at || new Date(item.expires_at).getTime() >= nowMs);

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
  if (isMockMode || name === 'exportXLSX' || name === 'exportPPTX') {
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

        const getImageSizePx = async (imgSrc) => {
          if (!imgSrc) return { width: 1200, height: 900 };
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              resolve({
                width: Math.max(1, img.naturalWidth || 1200),
                height: Math.max(1, img.naturalHeight || 900)
              });
            };
            img.onerror = () => {
              resolve({ width: 1200, height: 900 });
            };
            img.src = imgSrc;
          });
        };

        const formattedGenTime = `${dd}-${mm}-20${yy} ${hh}:${min}`;

        for (let idx = 0; idx < photosToExport.length; idx++) {
          const photo = photosToExport[idx];
          const slide = pptx.addSlide();

          let recs = photo.recommendations_json || photo.recommendations;
          if (typeof recs === 'string') {
            recs = recs.split('\n').map(r => r.trim()).filter(Boolean);
          }
          if (!Array.isArray(recs) || recs.length === 0) {
            recs = ["No specific recommendation noted."];
          }

          // 1. Green header bar with label PT. Safety Indonesia Utama
          slide.addShape(pptx.ShapeType.rect, {
            x: 0, y: 0, w: SLIDE_W, h: 0.55,
            fill: { color: "059669" }
          });
          slide.addText("PT. Safety Indonesia Utama", {
            x: 0.5, y: 0.08, w: 5.5, h: 0.4,
            fontName: "Arial", fontSize: 16, bold: true, color: "FFFFFF"
          });
          slide.addText(`Project: ${rawProjectName}`, {
            x: 6.0, y: 0.1, w: 3.5, h: 0.35,
            fontName: "Arial", fontSize: 12, bold: true, color: "E0EEFF", align: "right"
          });

          // 4. Image with original ratio (no stretching)
          const isMobileMode = data.view_mode === 'Mobile';
          const rawImgSrc = isMobileMode
            ? (photo.base64 || (photo.localUrl ? await toBase64(photo.localUrl) : null))
            : (photo.annotatedBase64 || photo.base64 || (photo.localUrl ? await toBase64(photo.localUrl) : null));
          if (rawImgSrc) {
            const dims = await getImageSizePx(rawImgSrc);
            const boxW = isMobileMode ? 9.0 : 4.3;
            const boxH = 4.25;
            const imgRatio = dims.width / dims.height;
            const boxRatio = boxW / boxH;
            let drawW = boxW;
            let drawH = boxW / imgRatio;
            if (imgRatio < boxRatio) {
              drawH = boxH;
              drawW = boxH * imgRatio;
            }
            if (drawH > boxH) {
              drawH = boxH;
              drawW = drawH * imgRatio;
            }
            const drawX = 0.4 + (boxW - drawW) / 2;
            const drawY = 0.75 + (boxH - drawH) / 2;

            slide.addImage({
              data: rawImgSrc,
              x: drawX, y: drawY, w: drawW, h: drawH
            });
          }

          if (!isMobileMode) {
            // Right 55%: Metadata & Findings
            const obsText = photo.comments_text || photo.caption || "No visual defects observed.";
            const obsLines = obsText
              .split('\n')
              .map(l => l.trim())
              .filter(l => l !== '')
              .slice(0, 5);

            // 3. Remove all text after date DD-MM-YYYY
            const dateStr = photo.exif_date || `${dd}-${mm}-20${yy}`;
            slide.addText(`Date : ${dateStr}`, {
              x: 4.9, y: 0.75, w: 4.7, h: 0.3,
              fontName: "Arial", fontSize: 10, bold: true, color: "555555"
            });

            slide.addText("COMMENTS / KOMENTAR", {
              x: 4.9, y: 1.15, w: 4.7, h: 0.3,
              fontName: "Arial", fontSize: 13, bold: true, color: "C00000"
            });

            // 2. Do not add unnecessary bullet numbering (clean runs without trailing \n)
            const obsRuns = obsLines.map(l => ({
              text: l.replace(/^[\d+•\.\)\-\s]+/, '').trim(),
              options: { bullet: true, breakLine: true, fontSize: 11, color: "333333" }
            }));
            slide.addText(obsRuns, {
              x: 4.9, y: 1.45, w: 4.7, h: 1.4,
              fontName: "Arial", valign: "top"
            });

            slide.addText("ASSESSOR RECOMMENDATION / REKOMENDASI", {
              x: 4.9, y: 2.9, w: 4.7, h: 0.3,
              fontName: "Arial", fontSize: 13, bold: true, color: "1F4E79"
            });

            const recRuns = recs
              .map(r => (typeof r === 'string' ? r.trim() : ''))
              .filter(r => r !== '')
              .slice(0, 5)
              .map(r => {
                const isCrit = r.includes("[CRITICAL]");
                const isMaj = r.includes("[MAJOR]");
                return {
                  text: r.replace(/^[\d+•\.\)\-\s]+/, '').trim(),
                  options: {
                    bullet: true,
                    breakLine: true,
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
          }

          // Footer
          slide.addText(`Page ${idx + 1} of ${photosToExport.length}  |  Generated: ${formattedGenTime}`, {
            x: 0.5, y: 5.25, w: 9.0, h: 0.25,
            fontName: "Arial", fontSize: 9, color: "777777", align: "center"
          });
        }

        await pptx.writeFile({ fileName: data.export_filename || `FSA_Report_${exportFileName}.pptx` });
        return { data: { downloadUrl: "" } };
      }

      if (name === 'exportPDF' || name === 'exportXLSX') {
        const photosToExport = data.photos_data || data.photos || [];
        const rawProjectName = data.project_name || data.project_id || "Project";
        await handleExportPDF({
          name: rawProjectName,
          export_filename: data.export_filename,
          view_mode: data.view_mode || 'Desktop',
          photos: photosToExport.map(photo => {
            let risk = "COMPLIANT";
            const recs = photo.recommendations_json || photo.recommendations || [];
            const recText = Array.isArray(recs) ? recs.join('\n') : String(recs);
            if (recText.includes("[CRITICAL]")) risk = "CRITICAL";
            else if (recText.includes("[MAJOR]")) risk = "MAJOR";
            else if (recText.includes("[MINOR]")) risk = "MINOR";

            return {
              base64: photo.annotatedBase64 || photo.base64 || '',
              date: photo.date || photo.exif_date || "N/A",
              location: photo.location || photo.exif_gps || "Location Recorded",
              filename: photo.filename || "IMG.jpg",
              caption: photo.caption || photo.comments || photo.comments_text || "",
              comments: photo.comments || photo.comments_text || photo.caption || "No visual defects observed.",
              recommendation: photo.recommendation || recText || "No specific recommendation noted.",
              risk
            };
          })
        }, data.export_filename);
        return { data: { valid: true, downloadUrl: "" } };
      }
      return { data: { valid: true } };
    };
  }
  return fbHttpsCallable(functionsInstance, name);
};

export const handleExportPDF = async (project, customFilename = null) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const isMobileMode = project.view_mode === 'Mobile';
  
  const now = new Date();
  const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, "");
  const pName = (project.name || "Project").replace(/[\\/:*?"<>|]/g, "_").trim();
  const filename = customFilename || project.export_filename || `FSA_Report_A4_${pName}_${yyyymmdd}.pdf`;
  const headerTitle = filename.replace(/\.pdf$/i, "").replace(/_/g, " ");

  // Header Banner
  doc.setFillColor(31, 41, 55); // slate-800
  doc.rect(0, 0, 210, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(headerTitle, 14, 12);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Project: ${project.name || "Project"}${isMobileMode ? " (Mobile Mode - Raw Photos)" : ""}`, 14, 20);

  const photos = project.photos || [];
  const tableData = photos.map((photo, idx) => {
    if (isMobileMode) {
      const captionText = photo.caption || photo.comments || photo.comments_text || photo.filename || "";
      return [idx + 1, captionText];
    }
    return [
      idx + 1,
      photo.filename || "IMG.jpg",
      photo.comments || "No visual defects observed.",
      photo.recommendation || "No specific recommendation noted.",
      photo.risk || "COMPLIANT"
    ];
  });

  const headRow = isMobileMode
    ? []
    : [["No.", "Photo Filename", "Observation / Comments", "Recommendation", "Risk Level"]];

  const colStyles = isMobileMode
    ? { 0: { cellWidth: 15 }, 1: { cellWidth: 165 } }
    : {
        0: { cellWidth: 10 },
        1: { cellWidth: 38 },
        2: { cellWidth: 58 },
        3: { cellWidth: 55 },
        4: { cellWidth: 21 }
      };

  autoTable(doc, {
    startY: isMobileMode ? 28 : 32,
    showHead: isMobileMode ? false : 'everyPage',
    head: headRow,
    body: tableData.length > 0 ? tableData : [isMobileMode ? ["-", "No data found"] : ["-", "No data found", "No completed photos recorded.", "-", "-"]],
    headStyles: { fillColor: [31, 41, 55], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak', valign: 'top' },
    columnStyles: colStyles,
    alternateRowStyles: { fillColor: [249, 250, 251] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1 && photos[data.row.index]) {
        const photo = photos[data.row.index];
        const base64Str = isMobileMode ? (photo.base64 || photo.annotatedBase64 || '') : (photo.annotatedBase64 || photo.base64 || '');
        if (base64Str && base64Str.startsWith('data:image/')) {
          data.cell.styles.minCellHeight = isMobileMode ? 115 : 28;
          data.cell.styles.valign = 'bottom';
          if (isMobileMode) {
            data.cell.styles.halign = 'center';
          }
        }
      }
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 1 && photos[data.row.index]) {
        const photo = photos[data.row.index];
        const base64Str = isMobileMode ? (photo.base64 || photo.annotatedBase64 || '') : (photo.annotatedBase64 || photo.base64 || '');
        if (base64Str && base64Str.startsWith('data:image/')) {
          try {
            let imgRatio = 1.333;
            try {
              const props = doc.getImageProperties(base64Str);
              if (props && props.width && props.height && props.height > 0) {
                imgRatio = props.width / props.height;
              }
            } catch (err) {
              // fallback
            }

            const availW = data.cell.width - 4;
            const bottomSpace = isMobileMode ? 14.24 : 6;
            const availH = Math.max(16, data.cell.height - bottomSpace);

            let imgW = availW;
            let imgH = availW / imgRatio;
            if (imgH > availH) {
              imgH = availH;
              imgW = availH * imgRatio;
            }

            const x = data.cell.x + (data.cell.width - imgW) / 2;
            const y = data.cell.y + 2;
            doc.addImage(base64Str, 'JPEG', x, y, imgW, imgH);
          } catch (e) {
            console.error('Error drawing inline table image inside PDF:', e);
          }
        }
      }
    }
  });

  doc.save(filename);
  return { valid: true };
};

export const handleExportExcel = async (project) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "HitecApp Fire Safety Assessor";
  workbook.created = new Date();

  const ws = workbook.addWorksheet("Inspection Report", {
    pageSetup: {
      paperSize: 9, // A4
      orientation: "portrait",
      margins: { top: 0.39, bottom: 0.39, left: 0.39, right: 0.39 },
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    },
    views: [{ showGridLines: false }],
    headerFooter: {} // Remove header and footer
  });

  // Fixed Column Widths: A:4, B:4, C:4, D:4, E:4, F:45, G:10, H:10, I:10, J:10
  const widths = [4, 4, 4, 4, 4, 45, 10, 10, 10, 10];
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  const photos = project.photos || [];
  let riskCounts = { CRITICAL: 0, MAJOR: 0, MINOR: 0, COMPLIANT: 0 };

  for (let idx = 0; idx < photos.length; idx++) {
    const photo = photos[idx];
    const currentRow = idx * 28 + 1;

    let riskLevel = (photo.risk || "COMPLIANT").toUpperCase();
    let fillArgb = "FF00B050";
    let fontColor = "FFFFFFFF";
    if (riskLevel.includes("CRITICAL")) {
      riskLevel = "CRITICAL"; fillArgb = "FFFF0000"; fontColor = "FFFFFFFF"; riskCounts.CRITICAL++;
    } else if (riskLevel.includes("MAJOR")) {
      riskLevel = "MAJOR"; fillArgb = "FFFFA500"; fontColor = "FF000000"; riskCounts.MAJOR++;
    } else if (riskLevel.includes("MINOR")) {
      riskLevel = "MINOR"; fillArgb = "FFFFFF00"; fontColor = "FF000000"; riskCounts.MINOR++;
    } else {
      riskLevel = "COMPLIANT"; riskCounts.COMPLIANT++;
    }

    // Rows 1-2: Header
    ws.mergeCells(`A${currentRow}:J${currentRow + 1}`);
    const hdrCell = ws.getCell(`A${currentRow}`);
    hdrCell.value = `INSPECTION FINDING # ${idx + 1}`;
    hdrCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
    hdrCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E79" } };
    hdrCell.alignment = { vertical: "middle", horizontal: "center" };

    // Rows 3-4: Metadata
    const dateStr = photo.date || "N/A";
    const locStr = photo.location || "Location Recorded";

    ws.getCell(`A${currentRow + 2}`).value = "Date";
    ws.getCell(`A${currentRow + 2}`).font = { name: "Arial", size: 10, bold: true };
    ws.mergeCells(`B${currentRow + 2}:D${currentRow + 2}`);
    ws.getCell(`B${currentRow + 2}`).value = dateStr;

    ws.getCell(`A${currentRow + 3}`).value = "Location";
    ws.getCell(`A${currentRow + 3}`).font = { name: "Arial", size: 10, bold: true };
    ws.mergeCells(`B${currentRow + 3}:D${currentRow + 3}`);
    ws.getCell(`B${currentRow + 3}`).value = locStr;

    // Rows 5-24: 2 Column Layout (set row heights to 15)
    for (let r = currentRow + 4; r <= currentRow + 23; r++) {
      ws.getRow(r).height = 15;
    }

    // Left Col A-E: Insert Image synchronously
    const rawBase64 = photo.annotatedBase64 || photo.base64 || "";
    const base64Parts = rawBase64.split(",");
    const pureBase64 = base64Parts.length > 1 ? base64Parts[1] : rawBase64;
    if (pureBase64) {
      try {
        const imageId = workbook.addImage({
          base64: pureBase64,
          extension: "jpeg"
        });
        ws.addImage(imageId, {
          tl: { col: 0, row: currentRow + 3 },
          ext: { width: 300, height: 225 },
          editAs: "oneCell"
        });
      } catch (e) {
        console.warn("Skipping image insertion:", e);
      }
    }

    // Right Col F-J: Text
    const obsCell = ws.getCell(`F${currentRow + 4}`);
    obsCell.value = "COMMENTS / KOMENTAR";
    obsCell.font = { name: "Arial", size: 10, bold: true };
    obsCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE7E6E6" } };

    ws.mergeCells(`F${currentRow + 5}:J${currentRow + 9}`);
    const commentsCell = ws.getCell(`F${currentRow + 5}`);
    commentsCell.value = photo.comments || "No visual defects observed.";
    commentsCell.alignment = { wrapText: true, vertical: "top" };

    const recHdr = ws.getCell(`F${currentRow + 10}`);
    recHdr.value = "ASSESSOR RECOMMENDATION";
    recHdr.font = { name: "Arial", size: 10, bold: true };
    recHdr.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF2CC" } };

    ws.mergeCells(`F${currentRow + 11}:J${currentRow + 19}`);
    const recCell = ws.getCell(`F${currentRow + 11}`);
    recCell.value = photo.recommendation || "No specific recommendation noted.";
    recCell.font = { name: "Arial", size: 10, italic: true };
    recCell.alignment = { wrapText: true, vertical: "top" };

    // Rows 25-26: Risk
    ws.getCell(`A${currentRow + 24}`).value = "Risk Level:";
    ws.getCell(`A${currentRow + 24}`).font = { name: "Arial", size: 10, bold: true };

    const riskCell = ws.getCell(`B${currentRow + 24}`);
    riskCell.value = riskLevel;
    riskCell.font = { name: "Arial", size: 10, bold: true, color: { argb: fontColor } };
    riskCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillArgb } };

    // Rows 27-28: Spacer
    ws.mergeCells(`A${currentRow + 26}:J${currentRow + 27}`);
    ws.getCell(`A${currentRow + 26}`).border = {
      bottom: { style: "double", color: { argb: "FF333333" } }
    };

    // Page Break: After every 2 photos
    if ((idx + 1) % 2 === 0 && idx < photos.length - 1) {
      ws.getRow(currentRow + 27).addPageBreak();
    }
  }

  // WORKSHEET 2: SUMMARY
  const sumWs = workbook.addWorksheet("Summary");
  sumWs.getCell("A1").value = "PROJECT SUMMARY";
  sumWs.getCell("A1").font = { name: "Arial", size: 18, bold: true };

  sumWs.getCell("A3").value = "Total Findings";
  sumWs.getCell("B3").value = photos.length;

  sumWs.getCell("A4").value = "Critical";
  sumWs.getCell("B4").value = riskCounts.CRITICAL;
  sumWs.getCell("B4").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF0000" } };
  sumWs.getCell("B4").font = { color: { argb: "FFFFFFFF" }, bold: true };

  sumWs.getCell("A5").value = "Major";
  sumWs.getCell("B5").value = riskCounts.MAJOR;
  sumWs.getCell("B5").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFA500" } };

  sumWs.getCell("A6").value = "Minor";
  sumWs.getCell("B6").value = riskCounts.MINOR;
  sumWs.getCell("B6").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };

  sumWs.getCell("A7").value = "Compliant";
  sumWs.getCell("B7").value = riskCounts.COMPLIANT;
  sumWs.getCell("B7").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00B050" } };
  sumWs.getCell("B7").font = { color: { argb: "FFFFFFFF" }, bold: true };

  // ONLY 1 AWAIT AT THE END FOR writeBuffer
  const buffer = await workbook.xlsx.writeBuffer();
  const now = new Date();
  const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, "");
  const pName = (project.name || "Project").replace(/[\\/:*?"<>|]/g, "_").trim();
  const filename = customFilename || project.export_filename || `FSA_Report_A4_${pName}_${yyyymmdd}.xlsx`;
  saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
  return { valid: true };
};

export { auth, db, storage, functions };
export default isMockMode;
