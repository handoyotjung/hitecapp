import React, { useState, useEffect } from 'react';
import { auth, db, onAuthStateChanged, signOut, doc, getDoc } from './firebase';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SecurityPage from './components/SecurityPage';
import { validateSession, getClientDeviceId, runSessionCleanupJob, apiLogout, apiLogoutOtherDevices } from './sessionSecurity';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' | 'security'
  const [forceLogoutNotice, setForceLogoutNotice] = useState(null);

  useEffect(() => {
    if (window.location.pathname.startsWith('/admin') && !window.location.pathname.includes('admin.html')) {
      window.location.replace('/admin.html#comment-logs');
      return;
    }

    // Run cleanup job on app launch
    runSessionCleanupJob();

    // Check localStorage session first
    const localSession = localStorage.getItem('hitecmedia_session');
    if (localSession) {
      try {
        const parsed = JSON.parse(localSession);
        if (parsed && parsed.email) {
          setUser(parsed);
          setLoading(false);
          return;
        }
      } catch (e) {
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

          const userDocRef = doc(db, 'whitelist_users', firebaseUser.email.toLowerCase());
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            const sessionUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: userData.role || 'user',
              companyId: userData.company_id || 'default_company'
            };
            setUser(sessionUser);
          } else {
            await signOut(auth);
            setUser(null);
            setAuthError("Contact handoyo.tjung@gmail.com for access.");
          }
        } catch (error) {
          console.error("Auth sync error:", error);
          await signOut(auth);
          setUser(null);
          setAuthError(error.message || "Failed to verify account permissions.");
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync active user session into whitelist_users for Admin Panel live monitoring
  useEffect(() => {
    if (user && user.email) {
      try {
        const cleanE = user.email.trim().toLowerCase();
        const rawStore = localStorage.getItem('hitecmedia_mock_db');
        let store = rawStore ? JSON.parse(rawStore) : {};
        if (!store.whitelist_users) store.whitelist_users = {};
        const u = store.whitelist_users[cleanE] || { role: user.role || 'user', plan: 'starter' };
        u.session_token = u.session_token || 'tok_' + Math.random().toString(36).substring(2);
        u.session_device_name = u.session_device_name || (navigator.userAgent.includes('Win') ? 'Windows PC - Chrome' : 'Assessor Device');
        u.session_ip_address = u.session_ip_address || '127.0.0.1';
        u.session_login_at = u.session_login_at || new Date().toISOString();
        store.whitelist_users[cleanE] = u;
        localStorage.setItem('hitecmedia_mock_db', JSON.stringify(store));
      } catch (e) {}
    }
  }, [user]);

  // Periodic liveness check: verify session token still valid every 30 seconds
  useEffect(() => {
    if (!user || !user.token) return;
    const interval = setInterval(async () => {
      const res = await validateSession({
        token: user.token,
        device_id: getClientDeviceId()
      });
      if (res.status === 403) {
        setForceLogoutNotice("Session terminated: Another device has logged into this account.");
        handleLogout(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLoginSuccess = (sessionData) => {
    setUser(sessionData);
    setViewMode('dashboard');
    setForceLogoutNotice(null);
  };

  const handleLogout = async (silent = false) => {
    if (silent !== true) {
      const confirmed = window.confirm("Are u sure want to logout from this device?");
      if (!confirmed) return;
    }

    try {
      if (user && user.email) {
        await apiLogoutOtherDevices({ email: user.email });
        await apiLogout({ email: user.email });
      }
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
