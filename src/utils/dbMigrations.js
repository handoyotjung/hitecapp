// Database Migration & Schema Versioning Engine for HitecApp
// Ensures non-destructive, additive migrations on local store and persistent schemas.

export const CURRENT_SCHEMA_VERSION = 2;

/**
 * Runs additive database migrations on store objects.
 * Rule: NEVER drop or purge existing user projects, photos, or whitelist entries.
 */
export function runDatabaseMigrations(store) {
  if (!store || typeof store !== 'object') {
    store = {};
  }

  const currentVer = store.schema_version || 1;

  // Migration V1 -> V2: Add missing fields if not present (Additive schema updates)
  if (currentVer < 2) {
    // 1. Ensure projects array exists & add retention/company properties if missing
    if (Array.isArray(store.projects)) {
      store.projects.forEach(p => {
        if (!p.company_id) p.company_id = 'co_hitec';
        if (!p.retention_days) p.retention_days = 7;
        if (!Array.isArray(p.photos)) p.photos = [];
      });
    } else {
      store.projects = [];
    }

    // 2. Ensure report_downloads collection exists
    if (!Array.isArray(store.report_downloads)) {
      store.report_downloads = [];
    }

    // 3. Ensure whitelist_users structure exists and contains required default accounts
    if (!store.whitelist_users || typeof store.whitelist_users !== 'object') {
      store.whitelist_users = {};
    }

    // Additive migration: Ensure static accounts exist without overwriting custom passwords
    const requiredStaticAccounts = {
      "demo@hitec.id": { role: "user", company_id: "co_hitec", plan: "starter", password: "demopassword" },
      "dummy@hitec.id": { role: "user", company_id: "co_hitec", plan: "starter", password: "demopassword" },
      "budi.santoso@safety-id.co.id": { role: "user", company_id: "safety_id", plan: "pro", password: "demopassword" },
      "admin@hitec.id": { role: "super_admin", company_id: "co_hitec", plan: "pro", password: "demopassword" },
      "handoyo.tjung@gmail.com": { role: "super_admin", company_id: "co_hitec", plan: "pro", password: "adminpassword" }
    };

    Object.keys(requiredStaticAccounts).forEach(email => {
      const cleanEmail = email.toLowerCase();
      if (!store.whitelist_users[cleanEmail]) {
        store.whitelist_users[cleanEmail] = {
          ...requiredStaticAccounts[email],
          created_at: new Date().toISOString()
        };
      }
    });

    // 4. Update schema version mark
    store.schema_version = CURRENT_SCHEMA_VERSION;
  }

  return store;
}
