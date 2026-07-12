import React, { useState, useEffect } from 'react';
import { auth, db, onAuthStateChanged, signOut, doc, getDoc } from './firebase';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SecurityPage from './components/SecurityPage';
import { validateSession, getClientDeviceId, runSessionCleanupJob } from './sessionSecurity';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' | 'security'
  const [forceLogoutNotice, setForceLogoutNotice] = useState(null);

  useEffect(() => {
    // Run cleanup job on app launch
    runSessionCleanupJob();

    // Check localStorage session first
    const localSessionRaw = localStorage.getItem('hitecmedia_session');
    if (localSessionRaw) {
      try {
        const parsed = JSON.parse(localSessionRaw);
        if (parsed && parsed.email) {
          setUser(parsed);
          setLoading(false);
          return;
        }
      } catch {
        // ignore
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setAuthError(null);
      if (firebaseUser) {
        try {
          if (!firebaseUser.email) {
            throw new Error("Retrieve email from account failed.");
          }
          
          const docRef = doc(db, 'whitelist_users', firebaseUser.email.toLowerCase());
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            const userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: data.role || 'user',
              companyId: data.company_id || 'default_company'
            };
            setUser(userData);
          } else {
            await signOut(auth);
            setUser(null);
            setAuthError("Contact handoyo.tjung@gmail.com for access.");
          }
        } catch (err) {
          console.error("Auth sync error:", err);
          await signOut(auth);
          setUser(null);
          setAuthError(err.message || "Failed to verify account permissions.");
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Periodic Single Active Session Middleware check (AUTO FORCE LOGOUT)
  useEffect(() => {
    if (!user || !user.token) return;

    const interval = setInterval(async () => {
      const res = await validateSession({
        token: user.token,
        device_id: getClientDeviceId()
      });

      if (res.status === 403) {
        setForceLogoutNotice("Session terminated: Another device has logged into this account.");
        handleLogout();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setViewMode('dashboard');
    setForceLogoutNotice(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('hitecmedia_session');
      setUser(null);
      setViewMode('dashboard');
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-black text-slate-100 font-outfit">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-black to-black" />
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500 z-10" />
        <p className="mt-4 text-sm font-semibold tracking-wide text-slate-400 z-10 animate-pulse">
          Loading HitecApp portal...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        {forceLogoutNotice && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/90 px-4 py-3 text-sm text-rose-200 shadow-2xl backdrop-blur-md">
            <ShieldAlert className="h-4.5 w-4.5 text-rose-400" />
            <span className="font-semibold">{forceLogoutNotice}</span>
          </div>
        )}
        <Login onLoginSuccess={handleLoginSuccess} errorOverride={authError} />
      </div>
    );
  }

  if (viewMode === 'security') {
    return (
      <SecurityPage
        user={user}
        onBack={() => setViewMode('dashboard')}
        onSessionTerminated={handleLogout}
      />
    );
  }

  return (
    <Dashboard
      user={user}
      onLogout={handleLogout}
      onOpenSecurity={() => setViewMode('security')}
    />
  );
}
