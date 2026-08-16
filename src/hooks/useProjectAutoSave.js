import { useRef, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { db, doc, setDoc, updateDoc } from '../firebase';


export function useProjectAutoSave(projectId) {

  const timeoutRef = useRef(null);
  const [lastSavedAt, setLastSavedAt] = useState(() => Date.now());
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    setLastSavedAt(Date.now());
    return () => {
      clearTimeout(timeoutRef.current);
      setIsDebouncing(false);
    };
  }, [projectId]);

  const { mutate, isPending, isError } = useMutation({
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

      // 2. Direct Firestore persistence (Realtime multi-device collaboration for 10 users on 1 account)
      if (db) {
        try {
          const cleanPayload = { ...payload, lastModified: nowIso, lastEditedAt: nowIso };
          await setDoc(doc(db, 'projects', projectId), cleanPayload, { merge: true });
        } catch (fsErr) {
          console.warn("Firestore autosave sync note:", fsErr);
        }
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
    onSuccess: () => {
      setLastSavedAt(Date.now());
      setIsDebouncing(false);

    },
    onError: () => {
      setIsDebouncing(false);
    }
  });

  const cancelAutosave = () => {
    clearTimeout(timeoutRef.current);
    setIsDebouncing(false);
  };

  // Debounced autosave (700ms by default, or immediate if options.immediate is set)
  const autosave = (payload, options = {}) => {
    clearTimeout(timeoutRef.current);
    setIsDebouncing(true);
    if (options.immediate) {
      mutate(payload);
    } else {
      timeoutRef.current = setTimeout(() => {
        mutate(payload);
      }, 700);
    }
  };

  // Data Loss Prevention Rule: beforeunload check warning if currently saving
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isPending || isDebouncing) {
        e.preventDefault();
        e.returnValue = 'Still saving...';
        return 'Still saving...';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isPending, isDebouncing]);

  return {
    autosave,
    cancelAutosave,
    isSaving: isPending || isDebouncing,
    isError,
    lastSavedAt
  };
}
