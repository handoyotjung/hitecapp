// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../src/components/Login';

// Mock the sessionSecurity module so we can control suppressCloudSyncWarning
vi.mock('../src/sessionSecurity', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    suppressCloudSyncWarning: true,
    apiLogin: vi.fn().mockResolvedValue({ status: 200, body: { success: true, user: { email: 'demo@hitec.id' }, token: 'mock-token' } }),
    getClientDeviceId: vi.fn().mockReturnValue('mock-device-id'),
    getClientDeviceName: vi.fn().mockReturnValue('mock-device-name')
  };
});

// Mock Firebase
vi.mock('../src/firebase', () => ({
  auth: {},
  signInWithEmailAndPassword: vi.fn().mockRejectedValue(new Error('Firebase Auth parallel login failed'))
}));

// Mock App to avoid react-konva canvas node dependencies
vi.mock('../src/App', () => ({
  SESSION_SCHEMA_VERSION: 1,
  SESSION_EXPIRY_MS: 3600000
}));

// Mock global fetch to prevent network hangs
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({})
});

import { shouldShowCloudSyncWarning } from '../src/sessionSecurity';

describe('Cloud Sync Warning Banner', () => {
  it('suppresses the warning banner when suppressCloudSyncWarning is true', async () => {
    render(<Login onLoginSuccess={() => {}} />);
    
    // Fill form and submit
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'demo@hitec.id' } });
    
    const passwordInput = document.querySelector('input[type="password"]');
    if (passwordInput) {
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
    }
    
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitBtn);
    
    // Wait for the async logic to finish. The submit button returns to "Sign In" when loading finishes.
    await waitFor(() => {
      expect(screen.queryByText(/Verifying Session/i)).toBeNull();
    }, { timeout: 4000 });
    
    // Banner should NOT be present
    const banner = screen.queryByText(/Cloud Sync Warning/i);
    expect(banner).toBeNull();
  }, 10000);

  it('correctly evaluates shouldShowCloudSyncWarning helper', () => {
    // Should be false for demo/admin accounts when there is an error
    expect(shouldShowCloudSyncWarning('demo@hitec.id', true)).toBe(false);
    expect(shouldShowCloudSyncWarning('admin@hitec.id', true)).toBe(false);
    
    // Also since our mock forces suppressCloudSyncWarning to true, it should always return false
    expect(shouldShowCloudSyncWarning('realuser@hitec.id', true)).toBe(false);
    
    // If there is no error, it should always be false
    expect(shouldShowCloudSyncWarning('realuser@hitec.id', false)).toBe(false);
  });
});
