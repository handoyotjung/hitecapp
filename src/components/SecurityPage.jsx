import React, { useState, useEffect } from 'react';
import { ShieldCheck, Laptop, Globe, Clock, LogOut, ArrowLeft, ShieldAlert } from 'lucide-react';
import { getActiveSessions, getClientDeviceId, getClientDeviceName, apiLogoutSpecificSession, apiLogoutOtherDevices } from '../sessionSecurity';

export default function SecurityPage({ user, onBack, onSessionTerminated }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const currentDeviceId = getClientDeviceId();

  const reloadSessions = () => {
    if (user && user.email) {
      const allActive = getActiveSessions(user.email);
      setSessions(allActive);
    }
  };

  useEffect(() => {
    reloadSessions();
  }, [user]);

  const thisSession = sessions.find(s => s.device_id === currentDeviceId) || {
    device_name: user.session_device_name || getClientDeviceName(),
    ip_address: user.session_ip_address || '127.0.0.1',
    login_at: user.session_login_at || new Date().toISOString()
  };

  const otherSessions = sessions.filter(s => s.device_id !== currentDeviceId);

  const handleLogoutRow = async (token) => {
    setLoading(true);
    try {
      await apiLogoutSpecificSession({ email: user.email, tokenToLogout: token });
      reloadSessions();
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAllOthers = async () => {
    setLoading(true);
    try {
      await apiLogoutOtherDevices({ email: user.email, current_token: user.session_token });
      reloadSessions();
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (iso) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 p-4 md:p-8 font-outfit">
      <div className="max-w-4xl mx-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </button>
            <div className="h-4 w-[1px] bg-neutral-800" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h1 className="text-xl font-bold text-white">Enterprise Security & Sessions</h1>
            </div>
          </div>
          <span className="text-xs text-emerald-400 font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            Single Active Session Enforced
          </span>
        </div>

        {/* Section 1: This Device */}
        <div className="rounded-2xl border border-emerald-500/30 bg-neutral-950 p-6 mb-8 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Laptop className="h-4.5 w-4.5 text-emerald-400" />
              <span>This Device</span>
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Active Now
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Device Name</p>
              <p className="font-semibold text-white">{thisSession.device_name || getClientDeviceName()}</p>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">IP Address / Location</p>
              <p className="font-semibold text-white flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-emerald-400" />
                <span>{thisSession.ip_address || '127.0.0.1'}</span>
              </p>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Login Time</p>
              <p className="font-semibold text-white flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                <span>{formatTime(thisSession.login_at)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Other Active Sessions */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-bold text-white">Other Active Sessions</h2>
              <p className="text-xs text-neutral-400 mt-0.5">Manage and terminate other logged-in devices across assessors</p>
            </div>

            <button
              onClick={handleLogoutAllOthers}
              disabled={loading || otherSessions.length === 0}
              className="flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:pointer-events-none px-4 py-2 text-xs font-bold text-white transition-all shadow-lg shadow-rose-600/20"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout All Other Devices</span>
            </button>
          </div>

          {otherSessions.length === 0 ? (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-8 text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-emerald-400 mb-2" />
              <p className="text-sm font-semibold text-white">No other active sessions</p>
              <p className="text-xs text-neutral-400 mt-1">This is the only device currently logged into your account.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-neutral-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-900 text-xs font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
                  <tr>
                    <th className="p-3.5">Device</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">Login Time</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {otherSessions.map((session) => (
                    <tr key={session.token} className="hover:bg-neutral-900/50 transition-colors">
                      <td className="p-3.5 font-semibold text-white flex items-center gap-2">
                        <Laptop className="h-4 w-4 text-neutral-400" />
                        <span>{session.device_name || 'Assessor Device'}</span>
                      </td>
                      <td className="p-3.5 text-neutral-300">
                        {session.ip_address || '127.0.0.1'}
                      </td>
                      <td className="p-3.5 text-neutral-400">
                        {formatTime(session.login_at)}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleLogoutRow(session.token)}
                          disabled={loading}
                          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
                        >
                          Logout
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
