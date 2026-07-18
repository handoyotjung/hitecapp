import React, { useState, useEffect } from 'react';
import { ShieldAlert, Lock, User as UserIcon, Eye, EyeOff, ShieldCheck, LogOut } from 'lucide-react';
import { apiLogin, apiLogoutOtherDevices, getClientDeviceId, getClientDeviceName } from '../sessionSecurity';

export default function Login({ onLoginSuccess, errorOverride }) {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('hitec_view_mode') || 'Desktop');

  // Modal State for ACCOUNT_IN_USE
  const [accountInUseModal, setAccountInUseModal] = useState(false);
  const [loggingOutOther, setLoggingOutOther] = useState(false);

  useEffect(() => {
    if (errorOverride) {
      setError(errorOverride);
    }
  }, [errorOverride]);

  const saveSession = (userData) => {
    localStorage.setItem('hitecmedia_session', JSON.stringify(userData));
    if (userData.viewMode) {
      localStorage.setItem('hitec_view_mode', userData.viewMode);
    }
  };

  const handleEmailLogin = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const deviceId = getClientDeviceId();
      const deviceName = getClientDeviceName();

      const result = await apiLogin({
        email: email.trim(),
        password,
        device_id: deviceId,
        device_name: deviceName
      });

      if (result.status === 403 && result.body && result.body.code === 'ACCOUNT_IN_USE') {
        setAccountInUseModal(true);
        setLoading(false);
        return;
      }

      if (result.status !== 200 || !result.body.success) {
        throw new Error(result.body?.message || "Invalid email or password.");
      }

      const sessionData = {
        ...result.body.user,
        uid: "user_" + email.trim().toLowerCase(),
        token: result.body.token,
        session_device_id: deviceId,
        viewMode: viewMode
      };

      saveSession(sessionData);
      onLoginSuccess(sessionData);
    } catch (err) {
      console.error(err);
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutOtherDeviceAndRetry = async () => {
    setLoggingOutOther(true);
    try {
      await apiLogoutOtherDevices({ email: email.trim() });
      setAccountInUseModal(false);
      await handleEmailLogin();
    } catch (err) {
      setError("Failed to logout other device. Please try again.");
      setAccountInUseModal(false);
    } finally {
      setLoggingOutOther(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 relative overflow-hidden font-outfit">
      {/* Sleek Black & Emerald Green theme glow effect */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-80 w-80 rounded-full bg-emerald-500/10 blur-[140px]" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-80 w-80 rounded-full bg-emerald-600/10 blur-[140px]" />

      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-emerald-500/25 bg-neutral-950/90 p-8 shadow-2xl shadow-emerald-950/30 backdrop-blur-md">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-emerald-700/20 border border-emerald-500/40 p-3.5 shadow-lg shadow-emerald-500/10 mb-2">
            <img src="/logo-hs-white.png" alt="HS Logo" className="h-full w-full object-contain filter drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white font-outfit">
            HitecApp
          </h1>
          <p className="mt-1 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            PT Safety Indonesia Utama
          </p>
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-300">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
            <div>
              <p className="font-semibold">Access Notice</p>
              <p className="mt-0.5 text-rose-200/90">{error}</p>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-5">
          <form onSubmit={handleEmailLogin} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500/70" />
                <input
                  type="email"
                  required
                  autoComplete="off"
                  placeholder=""
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900/80 pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500 transition-colors placeholder-neutral-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500/70" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder=""
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900/80 pl-10 pr-10 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500 transition-colors placeholder-neutral-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-emerald-500/20"
                />
                <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
              </label>
            </div>

            <div className="pt-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Viewing Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold cursor-pointer transition-all ${
                  viewMode === 'Desktop'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-sm shadow-emerald-500/10'
                    : 'border-neutral-800 bg-neutral-900/80 text-slate-400 hover:border-neutral-700'
                }`}>
                  <input
                    type="radio"
                    name="viewMode"
                    value="Desktop"
                    checked={viewMode === 'Desktop'}
                    onChange={() => setViewMode('Desktop')}
                    className="hidden"
                  />
                  <span>Desktop</span>
                </label>
                <label className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold cursor-pointer transition-all ${
                  viewMode === 'Mobile'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-sm shadow-emerald-500/10'
                    : 'border-neutral-800 bg-neutral-900/80 text-slate-400 hover:border-neutral-700'
                }`}>
                  <input
                    type="radio"
                    name="viewMode"
                    value="Mobile"
                    checked={viewMode === 'Mobile'}
                    onChange={() => setViewMode('Mobile')}
                    className="hidden"
                  />
                  <span>Mobile</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:from-emerald-500 hover:to-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 transition-all active:scale-[0.99]"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Verifying Session...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-neutral-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>© 2026 HITEC Solution</span>
        </div>
      </div>

      {/* ACCOUNT_IN_USE Modal */}
      {accountInUseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-neutral-950 p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-emerald-400 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <ShieldAlert className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Access Denied</h3>
                <p className="text-xs text-emerald-400/80">Active Session Found</p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-slate-300 mb-6">
              This account is currently active on another device. For security and data integrity, only one active session is permitted at a time.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setAccountInUseModal(false)}
                disabled={loggingOutOther}
                className="rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-neutral-800 transition-colors"
              >
                OK
              </button>
              <button
                type="button"
                onClick={handleLogoutOtherDeviceAndRetry}
                disabled={loggingOutOther}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20"
              >
                {loggingOutOther ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    <span>Logout Other Device</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
