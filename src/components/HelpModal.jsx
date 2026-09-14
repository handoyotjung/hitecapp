import React, { useState } from 'react';
import { X, BookOpen, ExternalLink, Download, FolderPlus, Mic, Camera, Lock, ArrowUpDown, FileText, Monitor, Smartphone } from 'lucide-react';

export function HelpModal({ open, onClose }) {
  const [activeTab, setActiveTab] = useState('mobile');

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-2xl bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-5 py-4 shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/15 p-2.5 text-emerald-400 border border-emerald-500/30">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">HitecApp User Manuals</h2>
              <p className="text-xs text-slate-400 font-medium">PT Safety Indonesia Utama · Official ATEX Guides</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Tabs: Mobile Surveyor vs Desktop Assessor */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 pt-2 shrink-0 gap-2">
          <button
            onClick={() => setActiveTab('mobile')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-xl transition-colors border-t border-x ${
              activeTab === 'mobile'
                ? 'bg-slate-900 text-emerald-400 border-slate-800 border-b-transparent'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>Mobile (Surveyor)</span>
          </button>
          <button
            onClick={() => setActiveTab('desktop')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-xl transition-colors border-t border-x ${
              activeTab === 'desktop'
                ? 'bg-slate-900 text-sky-400 border-slate-800 border-b-transparent'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Monitor className="h-4 w-4" />
            <span>Desktop (Assessor)</span>
          </button>
        </div>

        {/* Action Banners */}
        <div className="p-4 bg-slate-950/30 border-b border-slate-800 flex flex-wrap gap-2.5 shrink-0">
          {activeTab === 'mobile' ? (
            <>
              <a
                href="/manual-surveyor.html"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/40 transition-all text-center"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                <span>Web Manual</span>
              </a>
              <a
                href="/HitecApp_Safety_Mobile_Surveyor_Manual.docx"
                download
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 text-xs sm:text-sm font-bold shadow-lg shadow-blue-950/40 transition-all text-center"
              >
                <Download className="h-4 w-4 shrink-0 text-white" />
                <span>Word (.docx)</span>
              </a>
            </>
          ) : (
            <>
              <a
                href="/manual-desktop.html"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white px-3 py-2 text-xs sm:text-sm font-bold shadow-lg shadow-sky-950/40 transition-all text-center"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                <span>Desktop Web Manual</span>
              </a>
              <a
                href="/HitecApp_Safety_Desktop_Assessor_Manual.docx"
                download
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 text-xs sm:text-sm font-bold shadow-lg shadow-blue-950/40 transition-all text-center"
              >
                <Download className="h-4 w-4 shrink-0 text-white" />
                <span>Word (.docx)</span>
              </a>
            </>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-5 space-y-6 text-base text-slate-300">
          {activeTab === 'mobile' ? (
            <>
              {/* 🌟 Newbie Project Quick Start */}
              <section className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                  <FolderPlus className="h-5 w-5" />
                  <span>🌟 Newbie: Pick or Create a Project</span>
                </div>
                <p className="text-sm text-slate-300">
                  Before taking photos, you must pick or create a project. The camera buttons stay locked until a project is active.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-sm">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                    <strong className="text-sky-400 block mb-1">Option A: Pick Existing</strong>
                    <span className="text-slate-300 text-xs">Tap <em className="text-white">Select a project...</em> dropdown and choose your plant. Photos load instantly!</span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                    <strong className="text-amber-400 block mb-1">Option B: Create New</strong>
                    <span className="text-slate-300 text-xs">Type Company, City, and Project Name, then tap <em className="text-white">+ Create</em>.</span>
                  </div>
                </div>
              </section>

              {/* 1. Mobile Layout */}
              <section className="space-y-2">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs">1</span>
                  <span>Single Column & Collapse Details</span>
                </h3>
                <p className="text-base text-slate-300">
                  Everything on mobile is arranged in one column. Tap <strong className="text-emerald-400">Collapse Details ▲</strong> near the top to hide company boxes and get full screen space for your photos!
                </p>
              </section>

              {/* 2. Take Photos */}
              <section className="space-y-2">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 text-xs">2</span>
                  <span>Take Photos in the Field</span>
                </h3>
                <p className="text-base text-slate-300">
                  Tap <strong className="text-emerald-400">📷 Take Photo (Camera)</strong> to snap hazardous equipment or pick photos from your phone gallery. Photos compress automatically for fast low-signal uploads.
                </p>
              </section>

              {/* 3. Hold-to-Talk */}
              <section className="space-y-2">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs">3</span>
                  <span>Voice Dictation (Hold to Talk)</span>
                </h3>
                <p className="text-base text-slate-300">
                  Press and hold the square <strong className="text-red-400">[🎙️ Mic]</strong> button next to any photo with your thumb. Speak your observation, then release. Your caption writes itself automatically!
                </p>
              </section>
            </>
          ) : (
            <>
              {/* Desktop Assessor Guide */}
              <section className="rounded-2xl border border-sky-500/40 bg-sky-950/20 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-base">
                  <Monitor className="h-5 w-5" />
                  <span>🌟 Desktop Studio: 2-Column Overview</span>
                </div>
                <p className="text-sm text-slate-300">
                  The desktop interface divides into a Left Photo Queue (35%) and Right Carousel Studio (65%) for high-speed ATEX reviews and batch photo ingestion.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-sm">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                    <strong className="text-sky-400 block mb-1">Left Queue (35%)</strong>
                    <span className="text-slate-300 text-xs">Project selector, batch upload zone, status chips, and touch-drag reordering.</span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                    <strong className="text-emerald-400 block mb-1">Right Studio (65%)</strong>
                    <span className="text-slate-300 text-xs">High-res carousel photo viewer, 5-row caption editor, and ATEX assessor fields.</span>
                  </div>
                </div>
              </section>

              {/* 1. Batch Upload */}
              <section className="space-y-2">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 text-xs">1</span>
                  <span>Batch Upload Photos & Folders</span>
                </h3>
                <p className="text-base text-slate-300">
                  Click <strong className="text-white">Choose Files</strong> or <strong className="text-white">Upload Folder</strong> to ingest entire plant survey directories. Automatic compression retains nameplate clarity while speeding up uploads.
                </p>
              </section>

              {/* 2. ATEX Assessor Fields */}
              <section className="space-y-2">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 text-xs">2</span>
                  <span>ATEX Observations & Recommendations</span>
                </h3>
                <p className="text-base text-slate-300">
                  Record ignition risk assessments, earthing checks, and standard compliance notes (IEC 60079, EN 1127-1, NFPA) linked directly to each equipment photo.
                </p>
              </section>

              {/* 3. Export Reports */}
              <section className="space-y-2">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 text-xs">3</span>
                  <span>1-Click Multi-Format Export</span>
                </h3>
                <p className="text-base text-slate-300">
                  Generate professional Word (.docx), PowerPoint (.pptx), or PDF inspection documents from the bottom PublishBar.
                </p>
              </section>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
