// Environment Safety Guards & Production Protection Layer
// Prevents accidental data wiping, demo purging, or destructive operations in live production.

export function isProductionEnv() {
  if (typeof window !== 'undefined') {
    const host = window.location?.hostname || '';
    if (host.includes('app.hitec.id') || host.includes('hitec.id')) {
      return true;
    }
  }
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.NODE_ENV === 'production' || process.env.SAFETY_ENV === 'production') {
      return true;
    }
  }
  return false;
}

/**
 * Asserts that a potentially destructive operation is allowed in the current environment.
 * Throws an explicit Safety Error if executed in live production.
 */
export function assertNonProductionOperation(operationName) {
  if (isProductionEnv()) {
    const errorMsg = `[SAFETY GATE BLOCKED] Destructive operation '${operationName}' was prevented from executing in production environment.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  return true;
}

/**
 * Safe filter for demo project cleanup that ensures live user projects are never purged in production.
 */
export function safeFilterUserProjects(projects, predicate, operationName = 'Purge Inactive Drafts') {
  if (isProductionEnv()) {
    console.warn(`[SAFETY GATE] '${operationName}' skipped in production environment to preserve live user project retention.`);
    return projects;
  }
  return projects.filter(predicate);
}
