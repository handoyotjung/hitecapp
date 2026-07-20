import { useRef, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Helper to queue failed PATCH requests to localStorage for retry on reconnect
function queueOfflineSave(projectId, payload) {
  try {
    const rawQueue = localStorage.getItem('hitec_offline_queue');
    const queue = rawQueue ? JSON.parse(rawQueue) : [];
    queue.push({
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      projectId,
      payload,
      timestamp: Date.now()
    });
    localStorage.setItem('hitec_offline_queue', JSON.stringify(queue));
  } catch (err) {
    console.error("Failed to queue offline save:", err);
  }
}

export function useProjectAutoSave(projectId) {
  const queryClient = useQueryClient();
  const timeoutRef = useRef(null);
  const minVisualTimerRef = useRef(null);
  const [lastSavedAt, setLastSavedAt] = useState(() => Date.now());
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [isVisualSaving, setIsVisualSaving] = useState(false);

  useEffect(() => {
    setLastSavedAt(Date.now());
  }, [projectId]);

  const { mutate, isPending, isError } = useMutation({
    mutationFn: async (payload) => {
      if (!projectId) return payload;
      const nowIso = new Date().toISOString();

      // Ensure Saving... shows visually for at least 400ms so user clearly notices the save action
      setIsVisualSaving(true);
      clearTimeout(minVisualTimerRef.current);

      // 1. Instant local cache persistence (Optimistic UI & Offline prevention)
      try {
        const userStr = localStorage.getItem('hitecmedia_session');
        if (userStr) {
          const user = JSON.parse(userStr);
          const cacheKey = `hitec_projs_cache_${user?.email || 'default'}`;
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const { list } = JSON.parse(cached);
            if (Array.isArray(list)) {
              const updatedList = list.map(p => 
                p.id === projectId 
                  ? { ...p, ...payload, lastModified: nowIso, lastEditedAt: nowIso } 
                  : p
              );
              localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), list: updatedList }));
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

      // 3. API endpoint PATCH check (`/api/project/[id]`) with offline queue fallback
      try {
        const res = await fetch(`/api/project/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          throw new Error(`PATCH /api/project/${projectId} returned status ${res.status}`);
        }
        return await res.json();
      } catch (apiErr) {
        // If API PATCH fails (offline or static cloudflare environment), queue for reconnect retry
        queueOfflineSave(projectId, payload);
      }

      return { id: projectId, ...payload, status: 'saved' };
    },
    onSuccess: () => {
      setLastSavedAt(Date.now());
      setIsDebouncing(false);
      // Keep visual saving for at least 400ms for clear user confirmation
      minVisualTimerRef.current = setTimeout(() => {
        setIsVisualSaving(false);
      }, 400);
      if (projectId) {
        queryClient.invalidateQueries(['project', projectId]);
      }
    },
    onError: () => {
      setIsDebouncing(false);
      setIsVisualSaving(false);
    }
  });

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
      if (isPending || isDebouncing || isVisualSaving) {
        e.preventDefault();
        e.returnValue = 'Still saving...';
        return 'Still saving...';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isPending, isDebouncing, isVisualSaving]);

  // Offline Queue recovery: Flush queue on network reconnect
  useEffect(() => {
    const flushOfflineQueue = async () => {
      if (!navigator.onLine) return;
      try {
        const rawQueue = localStorage.getItem('hitec_offline_queue');
        if (!rawQueue) return;
        const queue = JSON.parse(rawQueue);
        if (!Array.isArray(queue) || queue.length === 0) return;

        const remainingQueue = [];
        for (const item of queue) {
          try {
            const res = await fetch(`/api/project/${item.projectId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.payload)
            });
            if (!res.ok) remainingQueue.push(item);
          } catch (retryErr) {
            remainingQueue.push(item);
          }
        }
        localStorage.setItem('hitec_offline_queue', JSON.stringify(remainingQueue));
      } catch (e) {
        console.error("Error flushing offline queue:", e);
      }
    };

    window.addEventListener('online', flushOfflineQueue);
    flushOfflineQueue(); // Run once when hook mounts
    return () => window.removeEventListener('online', flushOfflineQueue);
  }, []);

  // Realtime Sync for 10 users: Poll every 10s so other users see changes without manual refresh
  useEffect(() => {
    if (!projectId) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries(['project', projectId]);
    }, 10000);
    return () => clearInterval(interval);
  }, [projectId, queryClient]);

  return {
    autosave,
    isSaving: isPending || isDebouncing || isVisualSaving,
    isError,
    lastSavedAt
  };
}
