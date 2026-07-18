import React from 'react';
import { CheckCircle2, Presentation, FileText, Table, Check } from 'lucide-react';

export default function PublishBar({ confirmCount = 0, isConfirmed = false, onExport }) {
  const activeConfirmed = isConfirmed || confirmCount > 0;

  return (
    <div className="publish-bar-container w-full border-t border-slate-800 bg-slate-950/95 backdrop-blur shrink-0 p-3 z-20">
      <div className="grid grid-cols-2 gap-2.5 w-full">
        {/* 1. Confirm Button (Dynamic Vibrant Yellow when confirmed / active count > 0) */}
        <button
          type="button"
          onClick={() => onExport('confirm')}
          className={`px-3 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95 shadow-sm truncate ${
            activeConfirmed
              ? 'bg-[#FFD700] hover:bg-[#FBC02D] text-slate-950 border border-[#FBC02D] shadow-lg shadow-yellow-500/20 font-extrabold'
              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
          title="Confirm selected photos for report export"
        >
          {activeConfirmed ? <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-950" /> : <Check className="h-4 w-4 shrink-0" />}
          <span className="truncate">{activeConfirmed ? `Confirmed (${confirmCount})` : `Confirm (${confirmCount})`}</span>
        </button>

        {/* 2. Power Point Button (Microsoft PowerPoint Red/Orange #D04423) */}
        <button
          type="button"
          onClick={() => onExport('ppt')}
          className="bg-[#D04423] hover:bg-[#B8381C] text-white px-3 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95 shadow-md shadow-[#D04423]/25 border border-transparent truncate"
          title="Export report to Microsoft PowerPoint (.pptx)"
        >
          <Presentation className="h-4 w-4 shrink-0" />
          <span className="truncate">Power Point</span>
        </button>

        {/* 3. Word Button (Microsoft Word Blue #185ABD) */}
        <button
          type="button"
          onClick={() => onExport('word')}
          className="bg-[#185ABD] hover:bg-[#144796] text-white px-3 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95 shadow-md shadow-[#185ABD]/25 border border-transparent truncate"
          title="Export report to Microsoft Word (.docx)"
        >
          <FileText className="h-4 w-4 shrink-0" />
          <span className="truncate">Word</span>
        </button>

        {/* 4. Excel Button (Microsoft Excel Green #107C41) */}
        <button
          type="button"
          onClick={() => onExport('excel')}
          className="bg-[#107C41] hover:bg-[#0C5E31] text-white px-3 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95 shadow-md shadow-[#107C41]/25 border border-transparent truncate"
          title="Export report to Microsoft Excel (.xlsx)"
        >
          <Table className="h-4 w-4 shrink-0" />
          <span className="truncate">Excel</span>
        </button>
      </div>
    </div>
  );
}
