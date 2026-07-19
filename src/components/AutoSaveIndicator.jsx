import React, { useState, useEffect } from 'react';

export default function AutoSaveIndicator({ isSaving, isError, lastSavedAt }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeDiff = Math.max(0, Math.floor((now - (lastSavedAt || now)) / 1000));
  let timeStr = `${timeDiff} seconds ago`;
  if (timeDiff === 1) {
    timeStr = '1 second ago';
  } else if (timeDiff === 0) {
    timeStr = 'just now';
  } else if (timeDiff >= 60) {
    const mins = Math.floor(timeDiff / 60);
    timeStr = `${mins} minute${mins > 1 ? 's' : ''} ago`;
  }

  return (
    <div className="text-xs ml-2 flex items-center shrink-0">
      {isSaving && <span className="text-yellow-400 font-semibold flex items-center gap-1">Saving...</span>}
      {!isSaving && !isError && (
        <span className="flex items-center">
          <span className="text-emerald-400 font-semibold">✓ Saved</span>
          <span className="text-slate-400 font-normal ml-1.5">: {timeStr}</span>
        </span>
      )}
      {isError && <span className="text-red-400 font-semibold flex items-center gap-1">! Retry</span>}
    </div>
  );
}
