// Seed Protection & Static Account Retention Manager for HitecApp
// Guarantees static user accounts (demo@hitec.id, dummy@hitec.id, budi.santoso@safety-id.co.id)
// and their relational references remain populated across all build and deployment cycles.

import { SAFETY_DEMO_PROJECT_SEED } from '../demoSafetySeed';

export function ensureStaticAccountsExist(store) {
  if (!store || typeof store !== 'object') {
    store = {};
  }
  if (!store.whitelist_users || typeof store.whitelist_users !== 'object') {
    store.whitelist_users = {};
  }

  const staticUsers = {
    "demo@hitec.id": { role: "user", company_id: "co_hitec", plan: "starter", password: "demopassword" },
    "dummy@hitec.id": { role: "user", company_id: "co_hitec", plan: "starter", password: "demopassword" },
    "budi.santoso@safety-id.co.id": { role: "user", company_id: "safety_id", plan: "pro", password: "demopassword" },
    "admin@hitec.id": { role: "super_admin", company_id: "co_hitec", plan: "pro", password: "demopassword" },
    "handoyo.tjung@gmail.com": { role: "super_admin", company_id: "co_hitec", plan: "pro", password: "adminpassword" }
  };

  Object.keys(staticUsers).forEach(email => {
    const cleanEmail = email.toLowerCase();
    if (!store.whitelist_users[cleanEmail]) {
      store.whitelist_users[cleanEmail] = {
        ...staticUsers[email],
        created_at: new Date().toISOString()
      };
    }
  });

  return store;
}

export function ensureSafetyDemoProject(store) {
  if (!store || typeof store !== 'object') store = {};
  if (!Array.isArray(store.projects)) store.projects = [];

  const existingDemo = store.projects.find(p => p.id === SAFETY_DEMO_PROJECT_SEED.id || p.created_by === 'demo@hitec.id');
  if (!existingDemo) {
    store.projects.push(SAFETY_DEMO_PROJECT_SEED);
  }

  return store;
}
