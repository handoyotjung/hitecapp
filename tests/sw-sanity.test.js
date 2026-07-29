import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Service Worker Sanity Checks', () => {
  const swPath = path.resolve(__dirname, '../public/sw.js');
  let swContent;

  it('should exist in the public directory', () => {
    expect(fs.existsSync(swPath)).toBe(true);
    swContent = fs.readFileSync(swPath, 'utf8');
  });

  it('should explicitly unregister itself', () => {
    expect(swContent).toContain('self.registration.unregister()');
  });

  it('should NOT register a fetch event listener', () => {
    expect(swContent).not.toContain("addEventListener('fetch'");
    expect(swContent).not.toContain('addEventListener("fetch"');
    expect(swContent).not.toContain('addEventListener(`fetch`');
  });
});
