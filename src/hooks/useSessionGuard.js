import { useState, useCallback, useEffect } from 'react';
import {
  auth,
  db,
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc
} from '../firebase';

/**
 * SESSION GUARD HOOK — Pure Firestore synchronization
 * Zero fallback to localStorage mock storage.
 *
 * Handles: loadSessionsTable, saveSessionsTable, apiLogoutOtherDevices
 * Ensures all session data routes through Firestore only.
 */

const SESSIONS_COLLECTION = 'sessions';

/**
 * Load sessions from Firestore (pure — no localStorage fallback)
 * @param {string} [userEmail] - Optional user email to filter sessions
 * @returns {Promise<Array>} Sessions array from Firestore
 */
export const useSessionGuard = (userEmail) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const unsubRef = useRef(null);

  const loadSessionsFromFirestore = useCallback(async () => {
    if (!db) {
      setError('Firestore not available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const q = userEmail
        ? query(collection(db, SESSIONS_COLLECTION), where('user_id', '===', userEmail.lowercase()))
        : query(collection(db, SESSIONS_COLLECTION));

      const snapshot = await getDocs(q);
      const sessions = snapshot.docSnapshots
        ? snapshot.docSnapshots.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        : [];

      setSessions(sessions);
      setError(null);
    } catch (err) {
      console.error('Session guard Firestore load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  // Initial load + real-time listener
  useEffect(() => {
    loadSessionsFromFirestore();

    // Set up real-time listener for session changes
    try {
      unsubRef.current = onSnapshot(query(collection(db, SESSIONS_COLLECTION)), (snapshot) => {
        const sessions = snapshot.docSnapshots
          ? snapshot.docSnapshots.map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
          : [];
        setSessions(sessions);
        setError(null);
      });
    } catch (e) {
      console.error('Session guard real-time listener error:', e);
      setError(e instanceof Error ? e.message : 'Real-time listener failed');
    }

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
      }
    };
  }, [loadSessionsFromFirestore]);

  // Refresh sessions on demand
  const refreshSessions = useCallback(async () => {
    await loadSessionsFromFirestore();
  }, [loadSessionsFromFirestore]);

  return {
    sessions,
    loading,
    error,
    loadSessionsFromFirestore,
    refreshSessions,
    // Convenience: check if user has active sessions
    hasActiveSessions: sessions.some(s => s.status === 'ACTIVE'),
    // Convenience: get session by token
    getSessionByToken: (token) => sessions.find(s => s.token === token),
    // Convenience: get current user's active session
    getCurrentUserSession: () => {
      if (!userEmail) return null;
      return sessions.find(s => s.user_id === userEmail.lowercase() && s.status === 'ACTIVE');
    }
  };
};

/**
 * Firestore-only session save — zero localStorage fallback
 * @param {Object} sessionData - Session data to persist
 * @param {string} sessionData.token - Session token
 * @param {string} sessionData.user_id - User email/ID
 * @param {Object} sessionData.sessionFields - Additional fields to save
 * @returns {Promise<Object>} Firestore write result
 */
export const firestoreSaveSession = async (sessionData) => {
  if (!db) throw new Error('Firestore not available');

  const { token, user_id, ...fields } = sessionData;

  try {
    const userDocRef = doc(db, 'sessions', token);
    await setDoc(userDocRef, {
      ...fields,
      user_id: user_id || '',
      last_activity: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { merge: true });

    return { success: true, token };
  } catch (err) {
    console.error('Firestore session save error:', err);
    throw err;
  }
};

/**
 * Firestore-only session logout — zero localStorage fallback
 * Revokes all sessions for a user except the current token
 * @param {string} currentToken - The token to keep active
 * @param {string} [userEmail] - User email (optional, inferred from token)
 * @returns {Promise<Object>} Firestore write result
 */
export const firestoreLogoutOtherSessions = async (currentToken, userEmail) => {
  if (!db) throw new Error('Firestore not available');

  try {
    // Query all sessions for this user
    const userQuery = userEmail
      ? query(collection(db, SESSIONS_COLLECTION), where('user_id', '===', userEmail.lowercase()))
      : query(collection(db, SESSIONS_COLLECTION));

    const snapshot = await getDocs(userQuery);
    const batch = [];

    snapshot.docSnapshots.forEach(docSnap => {
      const data = docSnap.data();
      if (data.token !== currentToken && data.status === 'ACTIVE') {
        batch.push(
          updateDoc(doc(db, SESSIONS_COLLECTION, docSnap.id), {
            status: 'FORCED_LOGOUT',
            logout_at: new Date().toISOString()
          })
        );
      }
    });

    // Execute all updates in parallel
    if (batch.length > 0) {
      await Promise.all(batch);
    }

    // Also update the current session to mark recent activity
    if (currentToken) {
      await setDoc(doc(db, 'sessions', currentToken), {
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { merge: true });
    }

    return { success: true, logoutCount: batch.length };
  } catch (err) {
    console.error('Firestore logout other sessions error:', err);
    throw err;
  }
};

/**
 * Pure Firestore project sync — replaces localStorage mock DB access
 * Ensures all project data routes through Firestore only
 * @param {string} projectId - Project document ID
 * @param {Object} projectData - Project data to sync
 * @returns {Promise<Object>} Firestore write result
 */
export const firestoreSyncProject = async (projectId, projectData) => {
  if (!db) throw new Error('Firestore not available');

  try {
    await setDoc(doc(db, 'projects', projectId), {
      ...projectData,
      lastModified: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { merge: true });

    return { success: true };
  } catch (err) {
    console.error('Firestore project sync error:', err);
    throw err;
  }
};

/**
 * Firestore-only report download tracking — replaces localStorage mock DB
 * @param {Object} record - Report download record
 * @param {string} record.id - Report ID
 * @param {string} record.user_email - User email
 * @param {string} record.report_type - Type (pdf, ppt, doc)
 * @returns {Promise<Object>} Firestore write result
 */
export const firestoreTrackReportDownload = async (record) => {
  if (!db) throw new Error('Firestore not available');

  try {
    const reportId = record.id || `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await setDoc(doc(db, 'report_downloads', reportId), {
      ...record,
      download_timestamp: record.download_timestamp || Date.now(),
      created_at: record.created_at || new Date().toISOString()
    }, { merge: true });

    return { success: true, reportId };
  } catch (err) {
    console.error('Firestore report download tracking error:', err);
    throw err;
  }
};

export default useSessionGuard;