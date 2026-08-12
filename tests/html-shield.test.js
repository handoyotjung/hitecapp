import { describe, beforeAll, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Inline HTML Shield Sanity Test', () => {
  const indexPath = path.resolve(__dirname, '../dist/index.html');
  let indexContent;

  beforeAll(() => {
    indexContent = fs.readFileSync(indexPath, 'utf8');
  });

  it('should contain the full error-shield bundle in the built index.html', () => {
    expect(indexContent).toContain("window.addEventListener('error'");
    expect(indexContent).toContain('window.__hitecEmergencyReset');
    expect(indexContent).toContain('__hitec_watchdog_fired');
    expect(indexContent).toContain('4000');
    expect(indexContent).toContain('root.children.length === 0');
  });
});
