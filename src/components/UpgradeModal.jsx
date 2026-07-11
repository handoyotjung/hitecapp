import React from 'react';
import { X, ArrowUpCircle, Mail } from 'lucide-react';

export function UpgradeModal({ open, onClose, currentLimit }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Box */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl transition-all hover:border-indigo-500/50">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
              <ArrowUpCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">Daily Limit Reached</h2>
              <p className="mt-1 text-sm text-slate-400">
                You've reached your daily limit of {currentLimit} photos.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <h3 className="font-semibold text-indigo-400 text-sm uppercase tracking-wider">Pro Plan Benefits</h3>
            <ul className="mt-2 space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Increase daily limit to 300 photos/day
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Upload larger images (up to 1 MB per photo)
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                High priority PowerPoint & Excel report generation
              </li>
            </ul>
          </div>

          <p className="text-xs text-slate-400">
            Contact your administrator to request a plan upgrade for your company.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex flex-col gap-2">
          <a
            href="mailto:handoyo.tjung@gmail.com?subject=Upgrade%20HitecMedia%20Plan"
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 hover:shadow-indigo-500/30 transition-all active:scale-[0.98]"
          >
            <Mail className="h-4 w-4" />
            Contact Admin to Upgrade
          </a>
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-slate-800 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
