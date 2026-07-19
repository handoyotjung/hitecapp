import React from 'react';
import { Save, CheckCircle2, FileDown, Presentation, FileText } from 'lucide-react';

export default function PublishBar({ confirmCount = 0, isConfirmed = false, onExport }) {
  const isSaved = Boolean(isConfirmed);

  return (
    <footer 
      className="publish-bar-container publish-section w-full border-t border-slate-800 bg-[#020617] shrink-0 p-3 pb-safe z-50 sticky bottom-0 left-0 right-0 shadow-2xl"
      style={{ position: 'sticky', bottom: 0, backgroundColor: '#020617', zIndex: 50, flexShrink: 0 }}
    >
      {/* Arranged side-by-side in a single row */}
      <div className="grid grid-cols-4 gap-1.5 w-full">
        {/* 1. Save / Selected Button */}
        <button
          type="button"
          onClick={() => !isSaved && onExport('confirm')}
          disabled={isSaved}
          className={`px-2.5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all truncate ${
            isSaved
              ? 'bg-slate-900 border border-slate-800 text-slate-500 opacity-60 cursor-not-allowed shadow-none'
              : 'bg-[#107C41] hover:bg-[#0C5E31] text-white shadow-md shadow-[#107C41]/25 active:scale-95 cursor-pointer font-bold'
          }`}
          title={isSaved ? "Photos selected and confirmed" : "Save and confirm selected photos"}
        >
          {isSaved ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Save className="h-4 w-4 shrink-0" />}
          <span className="truncate">{isSaved ? `Selected (${confirmCount})` : (confirmCount > 0 ? `Save (${confirmCount})` : 'Save')}</span>
        </button>

        {/* 2. PDF Button (Magenta #D9008D when active, muted when Active Save) */}
        <button
          type="button"
          onClick={() => isSaved && onExport('pdf')}
          disabled={!isSaved}
          className={`px-2.5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-all truncate ${
            isSaved
              ? 'bg-white hover:bg-slate-100 text-[#F40F02] font-bold border border-transparent shadow-md shadow-white/20 active:scale-95 cursor-pointer'
              : 'bg-slate-900 border border-slate-800 text-slate-500 font-bold opacity-60 cursor-not-allowed shadow-none'
          }`}
          title={isSaved ? "Export report to PDF (.pdf)" : "Save changes before exporting"}
        >
          <FileDown className={`h-4 w-4 shrink-0 ${isSaved ? 'text-[#F40F02]' : 'text-slate-500'}`} />
          <span className="truncate">PDF</span>
        </button>

        {/* 3. PPT Button (Red #D04423 when active, muted when Active Save) */}
        <button
          type="button"
          onClick={() => isSaved && onExport('ppt')}
          disabled={!isSaved}
          className={`px-2.5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all truncate ${
            isSaved
              ? 'bg-[#D04423] hover:bg-[#B8381C] text-white shadow-md shadow-[#D04423]/25 border border-transparent active:scale-95 cursor-pointer'
              : 'bg-slate-900 border border-slate-800 text-slate-500 opacity-60 cursor-not-allowed shadow-none'
          }`}
          title={isSaved ? "Export report to Microsoft PowerPoint (.pptx)" : "Save changes before exporting"}
        >
          <Presentation className="h-4 w-4 shrink-0" />
          <span className="truncate">PPT</span>
        </button>

        {/* 4. DOC Button (Blue #185ABD when active, muted when Active Save) */}
        <button
          type="button"
          onClick={() => isSaved && onExport('word')}
          disabled={!isSaved}
          className={`px-2.5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all truncate ${
            isSaved
              ? 'bg-[#185ABD] hover:bg-[#144796] text-white shadow-md shadow-[#185ABD]/25 border border-transparent active:scale-95 cursor-pointer'
              : 'bg-slate-900 border border-slate-800 text-slate-500 opacity-60 cursor-not-allowed shadow-none'
          }`}
          title={isSaved ? "Export report to Microsoft Word (.docx)" : "Save changes before exporting"}
        >
          <FileText className="h-4 w-4 shrink-0" />
          <span className="truncate">DOC</span>
        </button>
      </div>
    </footer>
  );
}
