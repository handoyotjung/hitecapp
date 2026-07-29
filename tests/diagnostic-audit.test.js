import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { registerDebugAudit } from '../src/sessionSecurity';

describe('Diagnostic Audit Utility', () => {
  beforeEach(() => {
    // Clear globals
    delete window.__hitecDebugAudit;
    localStorage.clear();
    
    // Mock document structure
    document.documentElement.setAttribute('data-demo-mode', 'true');
    
    // Mock service worker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { controller: {} },
      configurable: true
    });
  });

  afterEach(() => {
    delete window.__hitecDebugAudit;
    document.documentElement.removeAttribute('data-demo-mode');
    vi.restoreAllMocks();
  });

  it('registers the audit function on window', () => {
    registerDebugAudit();
    expect(typeof window.__hitecDebugAudit).toBe('function');
  });

  it('returns a valid JSON schema report with correct values', () => {
    // Set up a valid mock DB structure to test whitelistIsArray
    localStorage.setItem('hitecmedia_mock_db', JSON.stringify({
      whitelist_users: ['demo@hitec.id']
    }));

    registerDebugAudit();
    
    // Spy on console.table to verify it's called
    const consoleSpy = vi.spyOn(console, 'table').mockImplementation(() => {});

    const report = window.__hitecDebugAudit();

    // Verify console.table was called with the report
    expect(consoleSpy).toHaveBeenCalledWith(report);

    // Verify report structure
    expect(report).toHaveProperty('timestamp');
    expect(report.storageSchema).toEqual({
      status: 'OK',
      whitelistIsArray: true
    });
    expect(report.demoMode).toEqual({
      suppressionFlagActive: true,
      domAttributePresent: true
    });
    expect(report.serviceWorker).toEqual({
      controller: true,
      killSwitchActive: true
    });
  });

  it('handles corrupted JSON gracefully', () => {
    localStorage.setItem('hitecmedia_mock_db', 'INVALID_JSON{');

    registerDebugAudit();
    
    // Silence console
    vi.spyOn(console, 'table').mockImplementation(() => {});

    const report = window.__hitecDebugAudit();
    expect(report.storageSchema.status).toBe('CORRUPTED_JSON');
    expect(report.storageSchema.whitelistIsArray).toBe(false);
  });
});
