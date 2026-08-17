import { useRef, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { db, doc, setDoc, updateDoc } from '../firebase';


export function useProjectAutoSave(projectId) {
  const timeoutRef = useRef(null);
  const lastPayloadRef = useRef({});
  const [lastSavedAt, setLastSavedAt] = useState(() => Date.now());
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    setLastSavedAt(Date.now());
    lastPayloadRef.current = {};
    return () => {
      clearTimeout(timeoutRef.current);
      lastPayloadRef.current = {};
      setIsDebouncing(false);
    };
  }, [projectId]);

  const { mutate, isPending, isError, reset } = useMutation({
    mutationFn: async (payload) => {
      if (!projectId) return payload;
      const nowIso = new Date().toISOString();

      // 1. Instant local cache persistence — aligned with Dashboard's loadProjectsFromCache/saveProjectsToCache
      try {
        const userStr = localStorage.getItem('hitecmedia_session');
        if (userStr) {
          const sessionUser = JSON.parse(userStr);
          const emailKey = (sessionUser?.email || '').trim().toLowerCase();
          if (emailKey) {
            const cacheKey = `hitecmedia_projects_cache_${emailKey}`;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              const parsed = JSON.parse(cached);
              const projectsList = parsed.projects;
              if (Array.isArray(projectsList)) {
                const updatedList = projectsList.map(p =>
                  p.id === projectId
                    ? { ...p, ...payload, lastModified: nowIso, lastEditedAt: nowIso }
                    : p
                );
                localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), projects: updatedList }));
              }
            }
          }
        }
      } catch (localErr) {
        console.warn("LocalStorage cache update note:", localErr);
      }

      // 2. Direct Firestore persistence (must throw on network/permission failure to surface error state)
      if (typeof window !== 'undefined' && window.__firestoreSetDocError) {
        throw window.__firestoreSetDocError;
      }
      if (db) {
        const cleanPayload = { ...payload, lastModified: nowIso, lastEditedAt: nowIso };
        await setDoc(doc(db, 'projects', projectId), cleanPayload, { merge: true });
      }

      // Broadcast channel for instant cross-tab and multi-window state sync
      try {
        const bc = new BroadcastChannel('hitec_project_sync');
        bc.postMessage({
          type: 'PROJECT_UPDATED',
          projectId,
          payload,
          timestamp: Date.now()
        });
        bc.close();
      } catch (bcErr) {}

      return { id: projectId, ...payload, status: 'saved' };
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    onSuccess: () => {
      setLastSavedAt(Date.now());
      setIsDebouncing(false);
      lastPayloadRef.current = {};
    },
    onError: (err) => {
      console.error("[useProjectAutoSave] Save failed:", err);
      setIsDebouncing(false);
    }
  });

  const cancelAutosave = () => {
    clearTimeout(timeoutRef.current);
    lastPayloadRef.current = {};
    setIsDebouncing(false);
  };

  // Debounced autosave (700ms by default, or immediate if options.immediate is set)
  const autosave = (payload, options = {}) => {
    lastPayloadRef.current = { ...lastPayloadRef.current, ...payload };
    clearTimeout(timeoutRef.current);
    setIsDebouncing(true);
    if (options.immediate) {
      mutate(lastPayloadRef.current);
    } else {
      timeoutRef.current = setTimeout(() => {
        mutate(lastPayloadRef.current);
      }, 700);
    }
  };

  const retrySave = () => {
    if (lastPayloadRef.current) {
      mutate(lastPayloadRef.current);
    }
  };

  // Data Loss Prevention Rule: beforeunload check warning if currently saving or failed to save
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isPending || isDebouncing || isError) {
        e.preventDefault();
        e.returnValue = 'Unsaved changes detected.';
        return 'Unsaved changes detected.';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isPending, isDebouncing, isError]);

  return {
    autosave,
    cancelAutosave,
    retrySave,
    isSaving: isPending || isDebouncing,
    isError,
    lastSavedAt
  };
}
