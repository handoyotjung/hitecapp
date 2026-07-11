import React, { useState, useEffect } from 'react';
import { auth, db, onAuthStateChanged, signOut, doc, getDoc } from './firebase';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setAuthError(null);
      if (firebaseUser) {
        try {
          if (!firebaseUser.email) {
            throw new Error("Retrieve email from account failed.");
          }
          
          // Check whitelist
          const docRef = doc(db, 'whitelist_users', firebaseUser.email.toLowerCase());
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: data.role || 'user',
              companyId: data.company_id || 'default_company'
            });
          } else {
            // Force sign out if not in whitelist
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

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-slate-950 to-slate-950" />
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 z-10" />
        <p className="mt-4 text-sm font-semibold tracking-wide text-slate-400 z-10 animate-pulse">
          Loading HitecMedia portal...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} errorOverride={authError} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}
