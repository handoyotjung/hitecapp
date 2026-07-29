import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Inline HTML Shield Sanity Test', () => {
  const indexPath = path.resolve(__dirname, '../dist/index.html');
  let indexContent;

  it('should exist in the dist directory', () => {
    expect(fs.existsSync(indexPath)).toBe(true);
    indexContent = fs.readFileSync(indexPath, 'utf8');
  });

  it('should contain the global error listener in the <head>', () => {
    expect(indexContent).toContain("window.addEventListener('error'");
  });

  it('should contain the emergency reload and cache clearing logic', () => {
    expect(indexContent).toContain('localStorage.clear();sessionStorage.clear();');
  });
});
