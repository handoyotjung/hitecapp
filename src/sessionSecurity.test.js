import { describe, it, expect, beforeEach } from 'vitest';
import { getSanitizedMockDB } from './sessionSecurity';

describe('sessionSecurity - loadStore hydration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should default cleanly when localStorage is null', () => {
    const store = getSanitizedMockDB();
    expect(store).toEqual({ whitelist_users: {} });
  });

  it('should default cleanly when localStorage is "null" string', () => {
    localStorage.setItem('hitecmedia_mock_db', 'null');
    const store = getSanitizedMockDB();
    expect(store).toEqual({ whitelist_users: {} });
  });

  it('should default cleanly when localStorage is "undefined" string', () => {
    localStorage.setItem('hitecmedia_mock_db', 'undefined');
    const store = getSanitizedMockDB();
    expect(store).toEqual({ whitelist_users: {} });
  });

  it('should default cleanly when JSON is corrupted', () => {
    localStorage.setItem('hitecmedia_mock_db', '{ corrupted_json: true');
    const store = getSanitizedMockDB();
    expect(store).toEqual({ whitelist_users: {} });
  });

  it('should preserve whitelist_users as object keyed by email', () => {
    const data = {
      whitelist_users: {
        "demo@hitec.id": { role: "user", company_id: "co_hitec" },
        "admin@hitec.id": { role: "admin", company_id: "co_hitec" }
      }
    };
    localStorage.setItem('hitecmedia_mock_db', JSON.stringify(data));
    const store = getSanitizedMockDB();
    expect(typeof store.whitelist_users).toBe('object');
    expect(Array.isArray(store.whitelist_users)).toBe(false);
    expect(Object.keys(store.whitelist_users).length).toBe(2);
    expect(store.whitelist_users["demo@hitec.id"].role).toBe("user");
    expect(store.whitelist_users["admin@hitec.id"].role).toBe("admin");
  });

  it('should coerce array whitelist_users to empty object fallback', () => {
    const data = {
      whitelist_users: [
        { role: "user", company_id: "co_hitec" }
      ]
    };
    localStorage.setItem('hitecmedia_mock_db', JSON.stringify(data));
    const store = getSanitizedMockDB();
    expect(typeof store.whitelist_users).toBe('object');
    expect(Array.isArray(store.whitelist_users)).toBe(false);
  });
});
