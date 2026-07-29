import { expect, test } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

test('HTML should not have crossorigin on CSS links but preserve it on JS scripts', () => {
  const htmlPath = path.resolve(__dirname, '../dist/index.html');
  
  if (!fs.existsSync(htmlPath)) {
    console.warn('dist/index.html not found. Please run build before testing.');
    return;
  }

  const html = fs.readFileSync(htmlPath, 'utf-8');

  // Find all <link> and <script> tags
  const linkTags = html.match(/<link[^>]+>/gi) || [];
  const scriptTags = html.match(/<script[^>]+>/gi) || [];

  // Check CSS links for crossorigin
  const cssLinks = linkTags.filter(tag => tag.includes('rel="stylesheet"'));
  for (const tag of cssLinks) {
    expect(tag).not.toMatch(/crossorigin/i);
  }

  // Check JS scripts (type="module") for crossorigin
  const moduleScripts = scriptTags.filter(tag => tag.includes('type="module"'));
  for (const tag of moduleScripts) {
    expect(tag).toMatch(/crossorigin/i);
  }
});
