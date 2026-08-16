import React, { useState, useRef, useEffect } from 'react';
import { MessageSquareIcon, LogOut, User as UserIcon, ChevronDown, BookOpen, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function UserMenu() {
  const { user, onLogout } = useAuth();
  const isPro = user?.plan?.dailyPhotoLimit > 100 || user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <div className="flex items-center gap-2">
      <div className="hidden md:flex items-center gap-2 rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs">
        <UserIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <span className="text-slate-300 font-medium truncate max-w-[140px]">{user?.email || 'user@hitec.id'}</span>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
          isPro ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
        }`}>
          {isPro ? 'Pro' : 'Basic'}
        </span>
      </div>

      <button
        type="button"
        onClick={onLogout}
        title="Logout"
        className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/40 px-2.5 md:px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-all active:scale-[0.98]"
      >
        <LogOut className="w-4 h-4 shrink-0" />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </div>
  );
}

export default function Header({ isSaving, isError }) {
  const { user, usage, onOpenFeedback, onOpenHelp } = useAuth();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const reportsUsed = usage?.reportsUsedMonthly ?? usage?.reportsUsedToday ?? usage?.photosUsedToday ?? 0;
  // Dynamic monthly limit: Read from account. Fallback 300 for user, 9999 for admin
  const reportsLimit = user?.plan?.monthlyReportLimit ?? user?.plan?.dailyReportLimit ?? (user?.role === 'user' ? 300 : 9999);
  const percent = reportsLimit > 0 ? Math.min(100, (reportsUsed / reportsLimit) * 100) : 0;

  // Determine bar color based on usage percentage
  let barColor = 'bg-emerald-500';
  let textColor = 'text-slate-300';
  if (percent >= 100) {
    barColor = 'bg-red-500';
    textColor = 'text-red-400 font-bold';
  } else if (percent >= 80) {
    barColor = 'bg-yellow-500';
    textColor = 'text-yellow-400 font-semibold';
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-[#2B2B2B] bg-[#0F172A]">
      
      {/* LEFT: ICON ONLY - "HITECAPP" TEXT REMOVED */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <img 
          src="/logo-icon.png" 
          alt="H" 
          className="w-7 h-7 object-contain"
          onError={(e) => { e.target.src = '/logo-hs-white.png'; }}
        /> 
      </div>

      {/* CENTER: DYNAMIC MONTHLY USAGE FOR USERS / UNLIMITED FOR ADMINS */}
      <div className="flex-1 flex items-center justify-center px-2 sm:px-4 min-w-0">
        {!isAdmin ? (
          <div className="flex items-center gap-2 sm:gap-3 w-full max-w-xl">
            <span className="text-xs text-gray-400 uppercase tracking-wider flex-shrink-0 hidden md:inline">MONTHLY USAGE</span>

            <div className="flex-1 h-1.5 bg-[#1F2937] rounded-full overflow-hidden min-w-[60px]">
              <div
                className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                style={{ width: `${percent}%` }}
              />
            </div>

            <span className={`text-[10px] sm:text-xs font-semibold flex-shrink-0 whitespace-nowrap ${textColor}`}>
              {reportsUsed} / {reportsLimit} REPORTS
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">UNLIMITED ADMIN ACCESS</span>
          </div>
        )}
      </div>

      {/* RIGHT: ACTIONS */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {!isAdmin && (
          <div className="relative" ref={dropRef}>
            <button
              type="button"
              onClick={() => setDropOpen(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm hover:bg-emerald-500/20 transition-colors"
            >
              <MessageSquareIcon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Help</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropOpen && (
              <div className="absolute right-0 mt-1.5 w-40 sm:w-48 rounded-xl border border-slate-700 bg-slate-900 shadow-xl z-50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => { setDropOpen(false); onOpenFeedback(); }}
                  className="flex items-center gap-2 sm:gap-2.5 w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">Send Feedback</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setDropOpen(false); onOpenHelp(); }}
                  className="flex items-center gap-2 sm:gap-2.5 w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">User Guide</span>
                </button>
              </div>
            )}
          </div>
        )}
        {isAdmin && (
          <a href="/admin.html" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:bg-[#2B2B2B] transition-colors">Admin Panel</a>
        )}
        <UserMenu />
      </div>
    </header>
  );
}
