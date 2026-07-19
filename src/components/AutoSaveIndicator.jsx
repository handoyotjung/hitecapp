import React from 'react';

export default function AutoSaveIndicator({ isSaving, isError }) {
  return (
    <div className="text-xs ml-2 flex items-center shrink-0">
      {isSaving && <span className="text-yellow-400 font-semibold flex items-center gap-1">Saving...</span>}
      {!isSaving && !isError && <span className="text-emerald-400 font-semibold flex items-center gap-1">✓ Saved</span>}
      {isError && <span className="text-red-400 font-semibold flex items-center gap-1">! Retry</span>}
    </div>
  );
}
