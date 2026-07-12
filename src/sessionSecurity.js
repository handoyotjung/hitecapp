// Enterprise Single Active Session Security Service
// Prevents account sharing between assessors; enforces 1 active session per account.

import { sendAccountInUseAlert, sendSelfForceLogoutAlert, sendAdminForceLogoutAlert } from './emailAlertService';

const STORE_KEY = 'hitecmedia_mock_db';
const SESSIONS_TABLE_KEY = 'hitec_user_sessions_v1';

// Helper to get or generate unique device ID for this client
export const getClientDeviceId = () => {
  let deviceId = localStorage.getItem('hitec_session_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    localStorage.setItem('hitec_session_device_id', deviceId);
  }
  return deviceId;
};

// Helper to detect human-readable Device Name
export const getClientDeviceName = () => {
  const ua = navigator.userAgent || '';
  let os = 'Desktop PC';
  if (ua.includes('Win')) os = 'Windows PC';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux PC';
  else if (ua.includes('Android')) os = 'Android Device';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS Device';

  let browser = 'Browser';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edge')) browser = 'Edge';

  return `${os} - ${browser}`;
};

// Helper to load sessions DB table
const loadSessionsTable = () => {
  try {
    const raw = localStorage.getItem(SESSIONS_TABLE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveSessionsTable = (sessions) => {
  localStorage.setItem(SESSIONS_TABLE_KEY, JSON.stringify(sessions));
};

const loadStore = () => {
  let store = { whitelist_users: {} };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      store = JSON.parse(raw);
      if (!store.whitelist_users) store.whitelist_users = {};
    }
  } catch {
    // ignore
  }
  // Ensure handoyo.tjung@gmail.com is always super_admin
  const handoyoEmail = "handoyo.tjung@gmail.com";
  if (!store.whitelist_users[handoyoEmail] || store.whitelist_users[handoyoEmail].role !== "super_admin") {
    store.whitelist_users[handoyoEmail] = {
      ...(store.whitelist_users[handoyoEmail] || {}),
      role: "super_admin",
      company_id: "co_hitec",
      plan: "pro",
      password: store.whitelist_users[handoyoEmail]?.password || "adminpassword"
    };
  }
  return store;
};

const saveStore = (store) => {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
};

// Generate secure session token (UUID v4 format)
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// CLEANUP JOB: Run every 1 hour (also runs on demand)
// Sets users.session_token = NULL WHERE session_last_activity < NOW() - 8 HOURS
export const runSessionCleanupJob = () => {
  const store = loadStore();
  const sessions = loadSessionsTable();
  const now = Date.now();
  const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

  let storeUpdated = false;
  let sessionsUpdated = false;

  if (store.whitelist_users) {
    Object.keys(store.whitelist_users).forEach((emailKey) => {
      const u = store.whitelist_users[emailKey];
      if (u && u.session_token && u.session_last_activity) {
        const lastAct = new Date(u.session_last_activity).getTime();
        if (now - lastAct > EIGHT_HOURS_MS) {
          u.session_token = null;
          storeUpdated = true;
        }
      }
    });
  }

  sessions.forEach((s) => {
    if (s.status === 'ACTIVE' && s.last_activity) {
      const lastAct = new Date(s.last_activity).getTime();
      if (now - lastAct > EIGHT_HOURS_MS) {
        s.status = 'EXPIRED';
        s.logout_at = new Date().toISOString();
        sessionsUpdated = true;
      }
    }
  });

  if (storeUpdated) saveStore(store);
  if (sessionsUpdated) saveSessionsTable(sessions);
};

// 2. LOGIN API UPDATE: POST /api/auth/login
export const apiLogin = async ({ email, password, device_id, device_name, ip_address = '127.0.0.1' }) => {
  runSessionCleanupJob();

  if (!email || !password) {
    return { status: 400, body: { success: false, message: 'Email and password are required.' } };
  }

  const cleanEmail = email.trim().toLowerCase();
  const store = loadStore();
  let userDoc = store.whitelist_users && store.whitelist_users[cleanEmail];

  // Auto-initialize demo/test accounts if missing
  if (!userDoc && (cleanEmail.endsWith('@hitec.id') || cleanEmail.includes('demo') || cleanEmail.includes('dummy') || cleanEmail.includes('admin'))) {
    const isAdmin = cleanEmail.includes('admin') || cleanEmail.includes('dummy');
    userDoc = {
      role: isAdmin ? 'super_admin' : 'user',
      company_id: 'co_hitec',
      plan: isAdmin ? 'pro' : 'starter',
      password: password || 'demopassword',
      created_at: new Date().toISOString()
    };
    store.whitelist_users[cleanEmail] = userDoc;
    saveStore(store);
  }

  if (!userDoc || userDoc.password !== password) {
    return { status: 401, body: { success: false, message: 'Invalid email or password.' } };
  }

  const now = new Date();
  const FIVE_MINUTES_MS = 5 * 60 * 1000;

  // Check users.session_token
  if (userDoc.session_token && userDoc.session_last_activity) {
    const lastActivityTime = new Date(userDoc.session_last_activity).getTime();
    const isWithin5Min = (now.getTime() - lastActivityTime) <= FIVE_MINUTES_MS;
    const isDifferentDevice = userDoc.session_device_id && userDoc.session_device_id !== device_id;

    if (isWithin5Min && isDifferentDevice) {
      // EVENT A: Send email alert to admin@hitec.id (with 10-min rate limiting per user)
      sendAccountInUseAlert({
        user_email: cleanEmail,
        device_name: device_name || getClientDeviceName(),
        ip_address: ip_address,
        active_device_name: userDoc.session_device_name || 'Existing Device',
        active_ip: userDoc.session_ip_address || '127.0.0.1'
      });

      return {
        status: 403,
        body: {
          success: false,
          code: 'ACCOUNT_IN_USE',
          message: 'This account is currently active on another device. For security purposes, only one active session is allowed at a time.'
        }
      };
    }
  }

  // Generate new session_token = UUID
  const newToken = generateUUID();

  userDoc.session_token = newToken;
  userDoc.session_device_id = device_id;
  userDoc.session_device_name = device_name || getClientDeviceName();
  userDoc.session_ip_address = ip_address;
  userDoc.session_login_at = now.toISOString();
  userDoc.session_last_activity = now.toISOString();

  if (!store.whitelist_users) store.whitelist_users = {};
  store.whitelist_users[cleanEmail] = userDoc;
  saveStore(store);

  // Record session in user_sessions table
  const sessions = loadSessionsTable();
  const nextId = sessions.length > 0 ? Math.max(...sessions.map(s => s.id || 0)) + 1 : 1;
  sessions.push({
    id: nextId,
    user_id: cleanEmail,
    token: newToken,
    device_id: device_id,
    device_name: device_name || getClientDeviceName(),
    ip_address: ip_address,
    login_at: now.toISOString(),
    last_activity: now.toISOString(),
    logout_at: null,
    status: 'ACTIVE'
  });
  saveSessionsTable(sessions);

  // SANITIZE: Never expose password in any response
  const sanitizedUser = {
    email: cleanEmail,
    role: userDoc.role || 'user',
    plan: userDoc.plan || 'starter',
    company_id: userDoc.company_id || 'default_company',
    session_token: newToken,
    session_device_id: device_id,
    session_device_name: userDoc.session_device_name,
    session_ip_address: userDoc.session_ip_address,
    session_login_at: userDoc.session_login_at
  };

  return {
    status: 200,
    body: {
      success: true,
      token: newToken,
      user: sanitizedUser
    }
  };
};

// 3. SESSION MIDDLEWARE: validateSession(token / deviceId)
export const validateSession = async ({ token, device_id }) => {
  if (!token) {
    return { status: 401, success: false, message: 'Session expired' };
  }

  const store = loadStore();
  let foundEmail = null;
  let userDoc = null;

  if (store.whitelist_users) {
    Object.keys(store.whitelist_users).forEach((emailKey) => {
      const u = store.whitelist_users[emailKey];
      if (u && u.session_token === token) {
        foundEmail = emailKey;
        userDoc = u;
      }
    });
  }

  if (!foundEmail || !userDoc) {
    return { status: 401, success: false, message: 'Session expired' };
  }

  if (userDoc.session_device_id && userDoc.session_device_id !== device_id) {
    return { status: 403, success: false, message: 'Session terminated' };
  }

  // Update session_last_activity
  const nowStr = new Date().toISOString();
  userDoc.session_last_activity = nowStr;
  store.whitelist_users[foundEmail] = userDoc;
  saveStore(store);

  // Also update user_sessions
  const sessions = loadSessionsTable();
  const sessionEntry = sessions.find(s => s.token === token);
  if (sessionEntry) {
    sessionEntry.last_activity = nowStr;
    saveSessionsTable(sessions);
  }

  const sanitizedUser = {
    email: foundEmail,
    role: userDoc.role || 'user',
    plan: userDoc.plan || 'starter',
    company_id: userDoc.company_id || 'default_company',
    session_token: token,
    session_device_id: userDoc.session_device_id,
    session_device_name: userDoc.session_device_name,
    session_ip_address: userDoc.session_ip_address,
    session_login_at: userDoc.session_login_at
  };

  return { status: 200, success: true, user: sanitizedUser };
};

// 4. LOGOUT API: POST /api/auth/logout
export const apiLogout = async ({ token, email }) => {
  const store = loadStore();
  const sessions = loadSessionsTable();
  const nowStr = new Date().toISOString();

  if (email && store.whitelist_users && store.whitelist_users[email.toLowerCase()]) {
    store.whitelist_users[email.toLowerCase()].session_token = null;
  } else if (token && store.whitelist_users) {
    Object.keys(store.whitelist_users).forEach((emailKey) => {
      const u = store.whitelist_users[emailKey];
      if (u && u.session_token === token) {
        u.session_token = null;
      }
    });
  }
  saveStore(store);

  sessions.forEach((s) => {
    if ((token && s.token === token) || (email && s.user_id === email.toLowerCase() && s.status === 'ACTIVE')) {
      s.status = 'EXPIRED';
      s.logout_at = nowStr;
    }
  });
  saveSessionsTable(sessions);

  return { status: 200, body: { success: true, message: 'Logged out successfully.' } };
};

// 5. NEW API: POST /api/auth/logout-other-devices
export const apiLogoutOtherDevices = async ({ email, current_token }) => {
  if (!email) {
    return { status: 400, body: { success: false, message: 'User email is required.' } };
  }

  const cleanEmail = email.trim().toLowerCase();
  const store = loadStore();
  const sessions = loadSessionsTable();
  const nowStr = new Date().toISOString();

  if (store.whitelist_users && store.whitelist_users[cleanEmail]) {
    const u = store.whitelist_users[cleanEmail];
    if (!current_token || u.session_token !== current_token) {
      u.session_token = null;
    }
    saveStore(store);
  }

  sessions.forEach((s) => {
    if (s.user_id === cleanEmail && s.token !== current_token && s.status === 'ACTIVE') {
      s.status = 'FORCED_LOGOUT';
      s.logout_at = nowStr;
    }
  });
  saveSessionsTable(sessions);

  // EVENT B: Send email alert to admin@hitec.id
  sendSelfForceLogoutAlert({
    user_email: cleanEmail,
    device_name: 'Current Assessor Device',
    ip_address: '127.0.0.1'
  });

  return {
    status: 200,
    body: {
      success: true,
      message: 'All other sessions have been logged out'
    }
  };
};

// Get sessions for Profile > Security page
export const getActiveSessions = (email) => {
  if (!email) return [];
  const cleanEmail = email.trim().toLowerCase();
  const sessions = loadSessionsTable();
  return sessions.filter(s => s.user_id === cleanEmail && s.status === 'ACTIVE');
};

// Logout a specific session by token
export const apiLogoutSpecificSession = async ({ email, tokenToLogout }) => {
  const store = loadStore();
  const sessions = loadSessionsTable();
  const nowStr = new Date().toISOString();

  if (email && store.whitelist_users && store.whitelist_users[email.toLowerCase()]) {
    const u = store.whitelist_users[email.toLowerCase()];
    if (u.session_token === tokenToLogout) {
      u.session_token = null;
    }
    saveStore(store);
  }

  sessions.forEach((s) => {
    if (s.token === tokenToLogout && s.status === 'ACTIVE') {
      s.status = 'FORCED_LOGOUT';
      s.logout_at = nowStr;
    }
  });
  saveSessionsTable(sessions);

  return { status: 200, body: { success: true } };
};

// Admin Force Logout User Session (POST /api/admin/sessions/force-logout)
export const apiAdminForceLogout = async ({ admin_email = 'admin@hitec.id', target_user_email, target_token }) => {
  const store = loadStore();
  const sessions = loadSessionsTable();
  const nowStr = new Date().toISOString();
  const cleanTarget = target_user_email?.trim().toLowerCase();

  let targetDeviceName = 'Remote Device';
  let targetIp = '127.0.0.1';

  if (cleanTarget && store.whitelist_users && store.whitelist_users[cleanTarget]) {
    const u = store.whitelist_users[cleanTarget];
    targetDeviceName = u.session_device_name || targetDeviceName;
    targetIp = u.session_ip_address || targetIp;
    if (!target_token || u.session_token === target_token) {
      u.session_token = null;
    }
    saveStore(store);
  }

  sessions.forEach((s) => {
    if (s.user_id === cleanTarget && (!target_token || s.token === target_token) && s.status === 'ACTIVE') {
      s.status = 'FORCED_LOGOUT';
      s.logout_at = nowStr;
      targetDeviceName = s.device_name || targetDeviceName;
      targetIp = s.ip_address || targetIp;
    }
  });
  saveSessionsTable(sessions);

  // EVENT C: Send email alert to admin@hitec.id
  sendAdminForceLogoutAlert({
    admin_email,
    target_user_email: cleanTarget || 'unknown@user',
    device_name: targetDeviceName,
    ip_address: targetIp
  });

  return { status: 200, body: { success: true, message: 'User session terminated by admin' } };
};
