import React from 'react';
import { MessageSquareIcon, LogOut, User as UserIcon } from 'lucide-react';
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
          {isPro ? 'Pro' : 'Starter'}
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

export default function Header() {
  const { user, usage, onOpenFeedback } = useAuth();

  const photosUsed = usage?.photosUsedToday ?? 0;
  // Dynamic limit: Read from account. Fallback 100 for user, unlimited for admin
  const photosLimit = user?.plan?.dailyPhotoLimit ?? (user?.role === 'user' ? 100 : 9999);
  const percent = photosLimit > 0 ? Math.min(100, (photosUsed / photosLimit) * 100) : 0;

  const getUsageColor = () => {
    if (percent >= 90) return 'text-red-400 bg-red-500';
    if (percent >= 70) return 'text-yellow-400 bg-yellow-500';
    return 'text-emerald-400 bg-emerald-500';
  };
  const [textColor, barColor] = getUsageColor().split(' ');

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.email?.toLowerCase() === 'handoyo.tjung@gmail.com';

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

      {/* CENTER: DYNAMIC DAILY USAGE - NOW HAS MORE SPACE */}
      <div className="flex-1 flex items-center justify-center px-4 min-w-0">
        <div className="flex items-center gap-3 w-full max-w-xl">
          <span className="text-xs text-gray-400 uppercase tracking-wider flex-shrink-0">DAILY USAGE</span>
          
          <div className="flex-1 h-1.5 bg-[#1F2937] rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${barColor}`}
              style={{ width: `${percent}%` }}
            />
          </div>

          <span className={`text-xs font-semibold flex-shrink-0 ${textColor}`}>
            {photosUsed} / {photosLimit} PHOTOS
          </span>
        </div>
      </div>

      {/* RIGHT: ACTIONS */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {!isAdmin && (
          <button 
            type="button"
            onClick={onOpenFeedback}
            title="Resets daily at 00:00 WIB"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm hover:bg-emerald-500/20 transition-colors"
          >
            <MessageSquareIcon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Give Feedback</span>
          </button>
        )}
        {isAdmin && (
          <a href="/admin.html" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:bg-[#2B2B2B] transition-colors">Admin Panel</a>
        )}
        <UserMenu />
      </div>
    </header>
  );
}
