import { describe, it, expect, beforeEach } from 'vitest';
import { getSanitizedMockDB } from './sessionSecurity';

describe('sessionSecurity - loadStore hydration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should default cleanly when localStorage is null', () => {
    const store = getSanitizedMockDB();
    expect(store).toEqual({ whitelist_users: [] });
  });

  it('should default cleanly when localStorage is "null" string', () => {
    localStorage.setItem('hitecmedia_mock_db', 'null');
    const store = getSanitizedMockDB();
    expect(store).toEqual({ whitelist_users: [] });
  });

  it('should default cleanly when localStorage is "undefined" string', () => {
    localStorage.setItem('hitecmedia_mock_db', 'undefined');
    const store = getSanitizedMockDB();
    expect(store).toEqual({ whitelist_users: [] });
  });

  it('should default cleanly when JSON is corrupted', () => {
    localStorage.setItem('hitecmedia_mock_db', '{ corrupted_json: true');
    const store = getSanitizedMockDB();
    expect(store).toEqual({ whitelist_users: [] });
  });

  it('should transform plain object whitelist_users to an array', () => {
    const legacyData = {
      whitelist_users: {
        "demo@hitec.id": { role: "user", company_id: "co_hitec" },
        "admin@hitec.id": { role: "admin", company_id: "co_hitec" }
      }
    };
    localStorage.setItem('hitecmedia_mock_db', JSON.stringify(legacyData));
    const store = getSanitizedMockDB();
    expect(Array.isArray(store.whitelist_users)).toBe(true);
    expect(store.whitelist_users.length).toBe(2);
    expect(store.whitelist_users[0].role).toBe("user");
    expect(store.whitelist_users[1].role).toBe("admin");
  });

  it('should preserve whitelist_users if it is already an array', () => {
    const validData = {
      whitelist_users: [
        { role: "user", company_id: "co_hitec" }
      ]
    };
    localStorage.setItem('hitecmedia_mock_db', JSON.stringify(validData));
    const store = getSanitizedMockDB();
    expect(Array.isArray(store.whitelist_users)).toBe(true);
    expect(store.whitelist_users.length).toBe(1);
    expect(store.whitelist_users[0].role).toBe("user");
  });
});
