import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Check, RefreshCw } from 'lucide-react';

export default function AutoSaveIndicator({ isSaving, isError, lastSavedAt, onRetry }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeDiff = Math.max(0, Math.floor((now - (lastSavedAt || now)) / 1000));
  let timeStr = `${timeDiff}s ago`;
  if (timeDiff <= 4) {
    timeStr = 'just now';
  } else if (timeDiff < 60) {
    timeStr = `${timeDiff}s ago`;
  } else {
    const mins = Math.floor(timeDiff / 60);
    timeStr = `${mins}m ago`;
  }

  return (
    <div className="text-xs flex items-center shrink-0 min-h-[24px]">
      {/* 1. Saving State */}
      {isSaving && !isError && (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold text-[11px] animate-pulse">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Saving...</span>
        </span>
      )}

      {/* 2. Error / Failed State (Persistent until save succeeds) */}
      {isError && (
        <div 
          id="autosave-error-indicator"
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[11px] font-semibold shadow-sm animate-in fade-in"
        >
          <span className="flex items-center gap-1 text-rose-400 font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>Save failed — unsaved changes</span>
          </span>
          {onRetry && (
            <button
              type="button"
              id="autosave-retry-btn"
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold transition-all active:scale-95 shadow-sm ml-1"
              title="Retry saving now"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* 3. Normal Success State */}
      {!isSaving && !isError && (
        <span className="flex items-center text-[11px]">
          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
            <Check className="w-3.5 h-3.5" /> Saved
          </span>
          <span className="text-slate-400 font-normal ml-1.5">{timeStr}</span>
        </span>
      )}
    </div>
  );
}
