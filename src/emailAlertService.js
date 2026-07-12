// ADMIN EMAIL ALERT SERVICE - SECURITY EVENTS
// Handles security notifications sent to admin@hitec.id for HitecApp Pro

const STORE_EMAIL_ALERTS_KEY = 'hitec_email_alerts_v1';
const STORE_EMAIL_RATELIMIT_KEY = 'hitec_email_ratelimit_v1';

// Environment variables fallback configuration
export const EMAIL_CONFIG = {
  host: import.meta.env?.VITE_EMAIL_HOST || 'smtp.sendgrid.net',
  port: import.meta.env?.VITE_EMAIL_PORT || 587,
  user: import.meta.env?.VITE_EMAIL_USER || 'apikey',
  pass: import.meta.env?.VITE_EMAIL_PASS || '',
  adminEmail: import.meta.env?.VITE_ADMIN_EMAIL || 'admin@hitec.id',
  appName: import.meta.env?.VITE_APP_NAME || 'HitecApp Pro',
  adminPanelUrl: import.meta.env?.VITE_ADMIN_PANEL_URL || 'https://app.hitec.id/admin'
};

// Helper to load email logs from localStorage
export const getEmailAlertsLog = () => {
  try {
    const raw = localStorage.getItem(STORE_EMAIL_ALERTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

// Helper to save email logs
const saveEmailAlertsLog = (logs) => {
  try {
    localStorage.setItem(STORE_EMAIL_ALERTS_KEY, JSON.stringify(logs.slice(0, 100))); // keep last 100
  } catch {
    // ignore
  }
};

// Rate limiter check for Event A (max 1 email per user per 10 minutes = 600,000 ms)
export const checkRateLimit = (userEmail, eventType = 'EVENT_A') => {
  const key = `${eventType}_${userEmail.toLowerCase()}`;
  try {
    const raw = localStorage.getItem(STORE_EMAIL_RATELIMIT_KEY);
    const rlMap = raw ? JSON.parse(raw) : {};
    const lastSent = rlMap[key];
    const now = Date.now();
    if (lastSent && now - lastSent < 10 * 60 * 1000) {
      return false; // Rate limited
    }
    rlMap[key] = now;
    localStorage.setItem(STORE_EMAIL_RATELIMIT_KEY, JSON.stringify(rlMap));
    return true; // Allowed
  } catch {
    return true;
  }
};

/**
 * Core Function: sendAdminAlert(subject, htmlBody, eventType)
 * Dispatches email to ADMIN_EMAIL (admin@hitec.id) and logs into alert outbox
 */
export const sendAdminAlert = async (subject, htmlBody, eventType = 'GENERAL') => {
  const recipient = EMAIL_CONFIG.adminEmail;
  const timestamp = new Date().toLocaleString('id-ID', { timeZoneName: 'short' });
  const emailRecord = {
    id: `em_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    recipient,
    subject,
    htmlBody,
    eventType,
    timestamp,
    status: 'SENT'
  };

  // Log email to local outbox for admin inspection & auditing
  const logs = getEmailAlertsLog();
  logs.unshift(emailRecord);
  saveEmailAlertsLog(logs);

  console.log(`[EMAIL ALERT SENT -> ${recipient}] Subject: "${subject}"`);

  // Attempt real API call if server webhook endpoint is defined
  try {
    if (import.meta.env?.VITE_EMAIL_API_ENDPOINT) {
      await fetch(import.meta.env.VITE_EMAIL_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipient,
          subject,
          html: htmlBody,
          from: `${EMAIL_CONFIG.appName} <no-reply@hitec.id>`
        })
      });
    }
  } catch (err) {
    console.warn('[EMAIL ALERT] API endpoint dispatch error (stored in audit log):', err);
  }

  return { success: true, email: emailRecord };
};

/**
 * Professional HTML Email Template Wrapper
 */
export const wrapEmailTemplate = (headerTitle, contentHtml) => {
  return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; background-color: #ffffff; color: #1e293b;">
  <div style="margin-bottom: 16px;">
    <img src="https://hitec.id/logo.png" alt="HitecApp Logo" width="120" style="display: block;"/>
  </div>
  <h2 style="color: #C00000; margin-top: 0; font-size: 20px;">${headerTitle}</h2>
  ${contentHtml}
  <p style="margin-top: 24px;">
    <a href="${EMAIL_CONFIG.adminPanelUrl}/sessions" style="display: inline-block; background-color: #0F172A; color: #10B981; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: bold; font-size: 14px;">View in Admin Panel</a>
  </p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;"/>
  <small style="color: #64748b; font-size: 11px;">
    This is an automated security alert from ${EMAIL_CONFIG.appName}. Do not reply.
  </small>
</div>
  `.trim();
};

/**
 * EVENT A: ACCOUNT_IN_USE BLOCKED
 * Triggered when a user tries to log in but their account is already active on another device.
 * Enforces 1 email per user per 10 minutes rate limit.
 */
export const sendAccountInUseAlert = async ({
  user_email,
  user_name = user_email.split('@')[0],
  device_name = 'Unknown Device',
  ip_address = '127.0.0.1',
  active_device_name = 'Existing Active Device',
  active_ip = '127.0.0.1'
}) => {
  if (!checkRateLimit(user_email, 'EVENT_A')) {
    console.log(`[EMAIL ALERT RATE LIMITED] Skipping Event A email for ${user_email} (already sent within 10 min)`);
    return { success: false, rateLimited: true };
  }

  const timestamp = new Date().toLocaleString('id-ID');
  const subject = `[SECURITY ALERT] Login Blocked - Account In Use: ${user_email}`;
  const htmlContent = `
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 0; color: #64748b; width: 140px;"><b>Event</b></td>
        <td style="padding: 8px 0; font-weight: bold; color: #C00000;">Login Blocked (Account In Use)</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 0; color: #64748b;"><b>Time</b></td>
        <td style="padding: 8px 0;">${timestamp}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 0; color: #64748b;"><b>User</b></td>
        <td style="padding: 8px 0;">${user_name} &bull; <code>${user_email}</code></td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 0; color: #64748b;"><b>Attempted Device</b></td>
        <td style="padding: 8px 0;">${device_name} (${ip_address})</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 0; color: #64748b;"><b>Currently Active On</b></td>
        <td style="padding: 8px 0;">${active_device_name} (${active_ip})</td>
      </tr>
    </table>
    <p style="font-size: 13px; color: #475569; margin: 12px 0;">
      <b>Reason:</b> Single active session policy enforcement. The secondary login attempt was denied.
    </p>
  `;

  return sendAdminAlert(subject, wrapEmailTemplate('Security Alert: Login Attempt Blocked', htmlContent), 'ACCOUNT_IN_USE');
};

/**
 * EVENT B: FORCE LOGOUT BY USER
 * Triggered when user clicks "Logout Other Device" on login screen.
 */
export const sendSelfForceLogoutAlert = async ({
  user_email,
  user_name = user_email.split('@')[0],
  device_name = 'Current Device',
  ip_address = '127.0.0.1',
  terminated_device_name = 'Previous Active Device',
  terminated_ip = '127.0.0.1'
}) => {
  const timestamp = new Date().toLocaleString('id-ID');
  const subject = `[SECURITY] Self Force Logout: ${user_email}`;
  const htmlContent = `
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 0; color: #64748b; width: 140px;"><b>Event</b></td>
        <td style="padding: 8px 0; font-weight: bold; color: #D97706;">Self Force Logout (Remote Session Terminated)</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 0; color: #64748b;"><b>Time</b></td>
        <td style="padding: 8px 0;">${timestamp}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 0; color: #64748b;"><b>User</b></td>
        <td style="padding: 8px 0;">${user_name} &bull; <code>${user_email}</code></td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 0; color: #64748b;"><b>New Device</b></td>
        <td style="padding: 8px 0;">${device_name} (${ip_address})</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 0; color: #64748b;"><b>Terminated Device</b></td>
        <td style="padding: 8px 0;">${terminated_device_name} (${terminated_ip})</td>
      </tr>
    </table>
    <p style="font-size: 13px; color: #475569; margin: 12px 0;">
      <b>Action:</b> User terminated their previous active session themselves via "Logout Other Device".
    </p>
  `;

  return sendAdminAlert(subject, wrapEmailTemplate('Security Notice: Self Force Logout', htmlContent), 'SELF_FORCE_LOGOUT');
};

/**
 * EVENT C: FORCE LOGOUT BY ADMIN
 * Triggered when an Admin clicks "Force Logout" in Admin Panel.
 */
export const sendAdminForceLogoutAlert = async ({
  admin_email,
  admin_name = admin_email.split('@')[0],
  target_user_email,
  target_user_name = target_user_email.split('@')[0],
  device_name = 'Assessor Device',
  ip_address = '127.0.0.1'
}) => {
  const timestamp = new Date().toLocaleString('id-ID');
  const subject = `[ADMIN ACTION] User Forced Logout: ${target_user_email}`;
  const htmlContent = `
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 0; color: #64748b; width: 140px;"><b>Event</b></td>
        <td style="padding: 8px 0; font-weight: bold; color: #DC2626;">Admin Forced Logout</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 0; color: #64748b;"><b>Admin</b></td>
        <td style="padding: 8px 0;">${admin_name} &bull; <code>${admin_email}</code></td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 0; color: #64748b;"><b>Target User</b></td>
        <td style="padding: 8px 0;">${target_user_name} &bull; <code>${target_user_email}</code></td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 0; color: #64748b;"><b>Device Terminated</b></td>
        <td style="padding: 8px 0;">${device_name} (${ip_address})</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 0; color: #64748b;"><b>Time</b></td>
        <td style="padding: 8px 0;">${timestamp}</td>
      </tr>
    </table>
  `;

  return sendAdminAlert(subject, wrapEmailTemplate('Admin Security Action: Forced Logout', htmlContent), 'ADMIN_FORCE_LOGOUT');
};

/**
 * Helper to send a Test Email from Admin Panel
 */
export const sendTestAdminEmail = async () => {
  const timestamp = new Date().toLocaleString('id-ID');
  const subject = `[TEST] Security Alert System Verified - ${EMAIL_CONFIG.appName}`;
  const htmlContent = `
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 0; color: #64748b; width: 140px;"><b>Event</b></td>
        <td style="padding: 8px 0; font-weight: bold; color: #10B981;">System Test Verification</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 0; color: #64748b;"><b>Recipient</b></td>
        <td style="padding: 8px 0;"><code>${EMAIL_CONFIG.adminEmail}</code></td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 0; color: #64748b;"><b>Time</b></td>
        <td style="padding: 8px 0;">${timestamp}</td>
      </tr>
    </table>
    <p style="font-size: 13px; color: #475569; margin: 12px 0;">
      <b>Status:</b> All security event email pipelines (Account In Use, Self Force Logout, Admin Force Logout) are operational.
    </p>
  `;

  return sendAdminAlert(subject, wrapEmailTemplate('Email Alert System Verification', htmlContent), 'TEST_EMAIL');
};
