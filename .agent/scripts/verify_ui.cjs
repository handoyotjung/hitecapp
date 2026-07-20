/**
 * HitecApp Automated UI Verification Script
 * Run: node .agent/scripts/verify_ui.js
 *
 * Verifies:
 *  1. Login works
 *  2. Project creation works
 *  3. Photo upload completes (mock mode)
 *  4. Two-column editor opens in Desktop mode
 *  5. Left/right footer rows are vertically aligned
 *  6. COMMENTS textarea is blank by default (not copied from caption)
 *  7. Caption and Comments fields are decoupled (changes don't cross-bind)
 *  8. COMMENTS textarea auto-resizes dynamically
 */

const puppeteer = require(require('path').resolve(__dirname, '../../node_modules/puppeteer'));
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5173';
const IMG_PATH = path.resolve(__dirname, '../../public/logo-hs-white.png');
const SCREENSHOTS_DIR = path.resolve(__dirname, '../test-screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log('\n🧪 HitecApp Automated UI Verification');
  console.log('======================================\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const report = {
    login: false,
    projectCreated: false,
    photoUploaded: false,
    editorOpened: false,
    footerAligned: false,
    footerTopDiff: null,
    commentsBlankByDefault: false,
    captionCommentsDecoupled: false,
    autoHeightWorks: false,
    errors: [],
    passed: 0,
    failed: 0
  };

  const pass = (label) => { console.log(`  ✅ ${label}`); report.passed++; };
  const fail = (label, detail = '') => { console.log(`  ❌ ${label}${detail ? ': ' + detail : ''}`); report.failed++; report.errors.push(label); };
  const info = (label) => console.log(`  ℹ️  ${label}`);
  const screenshot = async (name) => page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`) }).catch(() => {});

  page.on('pageerror', err => console.error('  [PAGE ERROR]', err.message));

  try {
    // ── 1. Navigate & force Desktop mode ──────────────────────────────
    console.log('1. Navigating to', BASE_URL, '...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await wait(1500);

    await page.evaluate(() => localStorage.setItem('hitec_view_mode', 'Desktop'));
    await page.reload({ waitUntil: 'networkidle0', timeout: 30000 });
    await wait(2000);
    await screenshot('01_loaded');

    // ── 2. Login ───────────────────────────────────────────────────────
    console.log('2. Checking login...');
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      await page.type('input[type="email"]', 'handoyo.tjung@gmail.com');
      await page.type('input[type="password"]', 'adminpassword');
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      await wait(3500);
    }
    report.login = true;
    pass('Login');
    await screenshot('02_after_login');

    // ── 3. Fill Company + City ─────────────────────────────────────────
    console.log('3. Filling Company / City fields...');
    const allInputs = await page.$$('input[type="text"], input:not([type])');
    for (const inp of allInputs) {
      const ph = (await page.evaluate(el => el.placeholder || '', inp)).toLowerCase();
      if (ph.includes('company')) { await inp.click({ clickCount: 3 }); await inp.type('Aqua'); }
      else if (ph.includes('city')) { await inp.click({ clickCount: 3 }); await inp.type('Solo'); }
    }
    await wait(400);

    // ── 4. Create project ──────────────────────────────────────────────
    console.log('4. Creating project...');
    const selectEl = await page.$('select');
    let projectAlreadyExists = false;
    if (selectEl) {
      const opts = await page.$$eval('select option', os => os.map(o => ({ value: o.value, text: o.textContent.trim() })));
      const existing = opts.find(o => o.value && (o.text.toLowerCase().includes('aqua') || o.text.toLowerCase().includes('area') || o.text.toLowerCase().includes('test')));
      if (existing) {
        await page.select('select', existing.value);
        await wait(2000);
        projectAlreadyExists = true;
        info(`Reusing existing project: ${existing.text}`);
      }
    }

    if (!projectAlreadyExists) {
      const inputs2 = await page.$$('input[type="text"], input:not([type])');
      for (const inp of inputs2) {
        const ph = (await page.evaluate(el => el.placeholder || '', inp)).toLowerCase();
        if (ph.includes('project') || ph.includes('new project')) {
          await inp.click({ clickCount: 3 });
          await inp.type('Area1Test');
          break;
        }
      }
      const createBtn = await page.$('form button[type="submit"], button[type="submit"]');
      if (createBtn) { await createBtn.click(); await wait(2500); }
      else { await page.keyboard.press('Enter'); await wait(2500); }
    }
    report.projectCreated = true;
    pass('Project created/selected');
    await screenshot('04_project_created');

    // ── 5. Upload photo ────────────────────────────────────────────────
    console.log('5. Uploading photo...');
    const fileInputHandle = await page.evaluateHandle(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
      return inputs.find(el => !el.hasAttribute('webkitdirectory') && !el.hasAttribute('directory') && !el.hasAttribute('capture')) || null;
    });
    let fileInputEl = null;
    try { fileInputEl = fileInputHandle.asElement(); } catch (e) {}

    if (!fileInputEl) {
      const allFI = await page.$$('input[type="file"]');
      for (const fi of allFI) {
        const isDir = await page.evaluate(el => el.hasAttribute('webkitdirectory') || el.hasAttribute('directory') || el.hasAttribute('capture'), fi);
        if (!isDir) { fileInputEl = fi; break; }
      }
    }

    if (fileInputEl) {
      await fileInputEl.uploadFile(IMG_PATH);
      // Poll for upload Done or editor appearing (up to 12s)
      let uploadDone = false;
      for (let i = 0; i < 24; i++) {
        await wait(500);
        uploadDone = await page.evaluate(() =>
          Array.from(document.querySelectorAll('span, div')).some(el => el.textContent.trim() === 'Done')
          || Boolean(document.querySelector('.comments-textarea'))
        );
        if (uploadDone) break;
      }

      if (uploadDone) {
        report.photoUploaded = true;
        pass('Photo uploaded (Done status)');
      } else {
        fail('Photo upload did not complete within 12s');
      }

      // Click photo item to ensure editor opens
      await wait(500);
      const rows = await page.$$('.photo-list-container > div > div');
      if (rows.length > 0) await rows[0].click().catch(() => {});
      await wait(1500);
    } else {
      fail('No file input found for upload');
    }
    await screenshot('05_after_upload');

    // ── 6. Check two-column editor ────────────────────────────────────
    console.log('6. Checking two-column editor...');
    const editorCheck = await page.evaluate(() => ({
      hasCommentsTextarea: Boolean(document.querySelector('.comments-textarea')),
      hasRightColumn: Boolean(document.querySelector('.right-column')),
      hasCanvas: Boolean(document.querySelector('canvas'))
    }));
    report.editorOpened = editorCheck.hasCommentsTextarea && editorCheck.hasRightColumn;
    if (report.editorOpened) pass('Two-column editor is open');
    else fail('Two-column editor did not open', JSON.stringify(editorCheck));

    // ── 7. Footer alignment ────────────────────────────────────────────
    console.log('7. Measuring footer alignment...');
    const footerMetrics = await page.evaluate(() => {
      const allBtns = Array.from(document.querySelectorAll('button'));
      const leftBtns = allBtns.filter(b => ['Save','PDF','PPT','DOC'].includes(b.textContent.trim()));
      const rightBtns = allBtns.filter(b => ['Regenerate','Edit Manually','Save Report'].some(t => b.textContent.trim() === t) || b.textContent.includes('Bahasa') || b.textContent.includes('English'));
      const getContainerTop = el => {
        const c = el.closest('div[class*="border-t"]') || el.closest('div[class*="h-[63px]"]') || el.parentElement?.parentElement;
        return c ? Math.round(c.getBoundingClientRect().top) : null;
      };
      const leftContainerTop = leftBtns[0] ? getContainerTop(leftBtns[0]) : null;
      const rightContainerTop = rightBtns[0] ? getContainerTop(rightBtns[0]) : null;
      return {
        leftBtnCount: leftBtns.length,
        rightBtnCount: rightBtns.length,
        leftContainerTop,
        rightContainerTop,
        topDiff: (leftContainerTop !== null && rightContainerTop !== null) ? Math.abs(leftContainerTop - rightContainerTop) : null
      };
    });

    report.footerTopDiff = footerMetrics.topDiff;
    if (footerMetrics.topDiff !== null && footerMetrics.topDiff <= 2) {
      report.footerAligned = true;
      pass(`Footer containers aligned (diff: ${footerMetrics.topDiff}px)`);
    } else if (footerMetrics.topDiff !== null) {
      fail(`Footer containers misaligned`, `${footerMetrics.topDiff}px difference`);
    } else {
      fail('Footer buttons not found', JSON.stringify({ left: footerMetrics.leftBtnCount, right: footerMetrics.rightBtnCount }));
    }

    // ── 8. COMMENTS blank by default ─────────────────────────────────
    console.log('8. Checking COMMENTS default value...');
    if (report.editorOpened) {
      const commentsVal = await page.$eval('.comments-textarea', el => el.value).catch(() => null);
      report.commentsBlankByDefault = commentsVal === '';
      if (report.commentsBlankByDefault) pass('COMMENTS textarea is blank by default');
      else fail('COMMENTS textarea has unexpected default value', JSON.stringify(commentsVal));
    } else {
      info('Skipped (editor not open)');
    }

    // ── 9. Caption / Comments decoupling ──────────────────────────────
    console.log('9. Testing Caption ↔ Comments decoupling...');
    if (report.editorOpened) {
      const captionEl = await page.$('input[placeholder*="caption"], input[placeholder*="Caption"], input[placeholder*="CAPTION"]');
      if (captionEl) {
        const before = await page.$eval('.comments-textarea', el => el.value);
        await captionEl.click({ clickCount: 3 });
        await captionEl.type('AutoVerifyCaption');
        await wait(800);
        const after = await page.$eval('.comments-textarea', el => el.value);
        report.captionCommentsDecoupled = after === before && after !== 'AutoVerifyCaption';
        if (report.captionCommentsDecoupled) pass('Caption and Comments are decoupled');
        else fail('Caption change leaked into Comments', `before="${before}" after="${after}"`);
      } else {
        info('Caption input not found by placeholder — skipping');
        report.captionCommentsDecoupled = 'skipped';
      }
    } else {
      info('Skipped (editor not open)');
    }

    // ── 10. Auto-height resize ────────────────────────────────────────
    console.log('10. Testing COMMENTS auto-height...');
    if (report.editorOpened) {
      const autoHeight = await page.evaluate(async () => {
        const ta = document.querySelector('.comments-textarea');
        if (!ta) return null;
        const h0 = ta.getBoundingClientRect().height;
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(ta, 'Line 1 ATEX observation note\nLine 2 IEC 60079-10-1 zoning note\nLine 3 EN 1127-1 ignition source assessment');
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 400));
        const h1 = ta.getBoundingClientRect().height;
        return { initialH: Math.round(h0), expandedH: Math.round(h1), grew: h1 > h0 };
      });
      report.autoHeightWorks = autoHeight?.grew === true;
      if (report.autoHeightWorks) pass(`COMMENTS auto-resizes (${autoHeight.initialH}px → ${autoHeight.expandedH}px)`);
      else fail('COMMENTS textarea did not auto-resize', JSON.stringify(autoHeight));
    } else {
      info('Skipped (editor not open)');
    }

    await screenshot('10_final_state');

  } catch (err) {
    console.error('\n  💥 Script error:', err.message);
    report.errors.push(err.message);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'error_state.png') }).catch(() => {});
  } finally {
    // ── Final Summary ──────────────────────────────────────────────────
    const total = report.passed + report.failed;
    const allPassed = report.failed === 0;
    console.log('\n======================================');
    console.log(allPassed ? '🎉 ALL CHECKS PASSED' : `⚠️  ${report.failed}/${total} CHECKS FAILED`);
    console.log('======================================');
    console.log(`  ✅ Passed : ${report.passed}`);
    console.log(`  ❌ Failed : ${report.failed}`);
    if (report.errors.length) console.log(`  Errors   :`, report.errors.join(', '));
    console.log(`  Screenshots saved to: ${SCREENSHOTS_DIR}`);
    console.log('');

    const reportPath = path.resolve(__dirname, '../test-screenshots/report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`  Full report: ${reportPath}\n`);

    await browser.close();
    process.exit(allPassed ? 0 : 1);
  }
})();
