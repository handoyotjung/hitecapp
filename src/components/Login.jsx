import React, { useState, useEffect } from 'react';
import { auth, db, signInWithPopup, signInWithEmailAndPassword, GoogleAuthProvider, signOut, doc, getDoc } from '../firebase';
import { LogIn, ShieldAlert, Mail, Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react';

export default function Login({ onLoginSuccess, errorOverride }) {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true); // checked by default
  const [showPassword, setShowPassword] = useState(false);
  const [useEmailLogin, setUseEmailLogin] = useState(true);

  useEffect(() => {
    if (errorOverride) {
      setError(errorOverride);
    }
  }, [errorOverride]);

  const saveSession = (userData) => {
    // Always save to localStorage so that new tabs (like target="_blank" Admin Panel) can read the session
    localStorage.setItem('hitecmedia_session', JSON.stringify(userData));
  };

  const handleGoogleLogin = async () => {
    // No-op / Removed Google login
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = result.user;

      const docRef = doc(db, 'whitelist_users', user.email.toLowerCase());
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const whitelistData = docSnap.data();
        const sessionData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: whitelistData.role || 'user',
          companyId: whitelistData.company_id || 'default_company'
        };
        saveSession(sessionData);
        onLoginSuccess(sessionData);
      } else {
        await signOut(auth);
        setError("User account details not found in whitelist.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      {/* Dynamic glow effect background */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-72 w-72 rounded-full bg-violet-500/10 blur-[120px]" />

      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-violet-600/20 border border-indigo-500/30 p-3.5 shadow-lg shadow-indigo-500/10 mb-2">
            <img src="/logo-hs-white.png" alt="HS Logo" className="h-full w-full object-contain filter drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white font-outfit">
            HitecApp
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Tool for Safety Indonesia
          </p>
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
            <div>
              <p className="font-semibold">Access Denied</p>
              <p className="mt-0.5 text-rose-200/90">{error}</p>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-5">
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-10 pr-10 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
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
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950 accent-indigo-500 cursor-pointer"
                />
                <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors select-none">Remember Me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <span>© 2026 HITEC Solution</span>
        </div>
      </div>
    </div>
  );
}
