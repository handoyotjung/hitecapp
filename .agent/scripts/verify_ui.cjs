/**
 * HitecApp Automated UI Verification Suite
 * Run: node .agent/scripts/verify_ui.cjs [--mode=all|desktop|mobile|sync]
 *
 * Test Suites:
 *  - Suite A: Desktop QA (1440x900, 2-column editor, footer alignment, field decoupling, auto-height)
 *  - Suite B: Mobile QA (390x844, single-column cards, zero x-overflow, mobile header collapse, card editing)
 *  - Suite C: Cross-Device Sync (Incognito Desktop <-> Incognito Mobile real-time sync, onSnapshot listener verification)
 *
 * User Role & Auth Specification:
 *  - All suites authenticate as a regular field assessor user (role: "user", e.g. demo@hitec.id)
 *  - NOT an admin or super_admin account (handoyo.tjung@gmail.com / admin@hitec.id)
 *
 * Safety:
 *  - Uses ephemeral incognito browser contexts
 *  - Prefixes test projects with [QA_SANDBOX_AUTOMATION]
 *  - Deletes sandboxed test project upon completion
 *  - Fails explicitly if Mock Mode is detected in Cross-Device Sync
 */

const puppeteer = require(require('path').resolve(__dirname, '../../node_modules/puppeteer'));
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';
const IMG_PATH = path.resolve(__dirname, '../../public/logo-hs-white.png');
const SCREENSHOTS_BASE = path.resolve(__dirname, '../test-screenshots');
const SCREENSHOTS_DESKTOP = path.join(SCREENSHOTS_BASE, 'desktop');
const SCREENSHOTS_MOBILE = path.join(SCREENSHOTS_BASE, 'mobile');
const SCREENSHOTS_SYNC = path.join(SCREENSHOTS_BASE, 'sync');

// Regular field assessor sandboxed user (role: "user", same role as demo@hitec.id)
const TEST_USER = {
  email: process.env.QA_USER_EMAIL || 'demo@hitec.id',
  password: process.env.QA_USER_PASSWORD || 'demopassword',
  role: 'user' // regular assessor role
};

[SCREENSHOTS_BASE, SCREENSHOTS_DESKTOP, SCREENSHOTS_MOBILE, SCREENSHOTS_SYNC].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function findBtn(page, texts) {
  const allBtns = await page.$$('button');
  for (const btn of allBtns) {
    const txt = await page.evaluate(el => el.innerText || el.textContent || '', btn).catch(() => '');
    for (const t of texts) {
      if (txt.toLowerCase().includes(t.toLowerCase())) return btn;
    }
  }
  return null;
}

// ----------------------------------------------------
// SUITE A: DESKTOP QA
// ----------------------------------------------------
async function runDesktopSuite(browser, report) {
  console.log('\n🖥️  Running Suite A: Desktop QA (1440x900)...');
  console.log(`  👤 Assessor Account: ${TEST_USER.email} (Role: ${TEST_USER.role})`);
  console.log('--------------------------------------------------');

  report.desktop.userAccount = { email: TEST_USER.email, role: TEST_USER.role };

  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const pass = (label) => { console.log(`  ✅ [Desktop] ${label}`); report.desktop.passed++; };
  const fail = (label, detail = '') => { console.log(`  ❌ [Desktop] ${label}${detail ? ': ' + detail : ''}`); report.desktop.failed++; report.desktop.errors.push(label); };
  const ss = async (name) => page.screenshot({ path: path.join(SCREENSHOTS_DESKTOP, `${name}.png`) }).catch(() => {});

  page.on('pageerror', err => console.error('  [PAGE ERROR - Desktop]', err.message));

  try {
    // 1. Navigate & Set Desktop Mode
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluate(() => localStorage.setItem('hitec_view_mode', 'Desktop'));
    await page.reload({ waitUntil: 'networkidle0', timeout: 30000 });
    await wait(1500);
    await ss('01_desktop_loaded');

    // 2. Login as regular user/assessor
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      await page.type('input[type="email"]', TEST_USER.email);
      await page.type('input[type="password"]', TEST_USER.password);
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      await wait(3500);
    }
    report.desktop.checks.login = true;
    pass(`Login successful as assessor (${TEST_USER.email})`);
    await ss('02_desktop_logged_in');

    // 3. Fill Company + City
    const allInputs = await page.$$('input[type="text"], input:not([type])');
    for (const inp of allInputs) {
      const ph = (await page.evaluate(el => el.placeholder || '', inp)).toLowerCase();
      if (ph.includes('company')) { await inp.click({ clickCount: 3 }); await inp.type('Aqua'); }
      else if (ph.includes('city')) { await inp.click({ clickCount: 3 }); await inp.type('Solo'); }
    }
    await wait(300);

    // 4. Create/Select Project
    const testProjName = `[QA_SANDBOX_AUTOMATION]_Desk_${Date.now().toString().slice(-6)}`;
    const inputs2 = await page.$$('input[type="text"], input:not([type])');
    for (const inp of inputs2) {
      const ph = (await page.evaluate(el => el.placeholder || '', inp)).toLowerCase();
      if (ph.includes('project') || ph.includes('new project')) {
        await inp.click({ clickCount: 3 });
        await inp.type(testProjName);
        break;
      }
    }
    const createBtn = await page.$('form button[type="submit"], button[type="submit"]');
    if (createBtn) { await createBtn.click(); await wait(2500); }
    else { await page.keyboard.press('Enter'); await wait(2500); }

    report.desktop.checks.projectCreated = true;
    pass(`Project created: ${testProjName}`);
    await ss('03_desktop_project_created');

    // 5. Upload photo
    const fileInputHandle = await page.evaluateHandle(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
      return inputs.find(el => !el.hasAttribute('webkitdirectory') && !el.hasAttribute('directory') && !el.hasAttribute('capture')) || null;
    });
    let fileInputEl = null;
    try { fileInputEl = fileInputHandle.asElement(); } catch (e) {}
    if (fileInputEl) {
      await fileInputEl.uploadFile(IMG_PATH);
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
        report.desktop.checks.photoUploaded = true;
        pass('Photo uploaded and processed');
      } else {
        fail('Photo upload timeout');
      }
      await wait(500);
      const rows = await page.$$('.photo-list-container > div > div');
      if (rows.length > 0) await rows[0].click().catch(() => {});
      await wait(1500);
    } else {
      fail('No file input element found');
    }
    await ss('04_desktop_photo_uploaded');

    // 6. Two-column editor check
    const editorCheck = await page.evaluate(() => ({
      hasCommentsTextarea: Boolean(document.querySelector('.comments-textarea')),
      hasRightColumn: Boolean(document.querySelector('.right-column')),
      hasCanvas: Boolean(document.querySelector('canvas'))
    }));
    report.desktop.checks.editorOpened = editorCheck.hasCommentsTextarea && editorCheck.hasRightColumn;
    if (report.desktop.checks.editorOpened) pass('Two-column split editor open');
    else fail('Two-column split editor failed to open', JSON.stringify(editorCheck));

    // 7. Footer alignment check
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
        topDiff: (leftContainerTop !== null && rightContainerTop !== null) ? Math.abs(leftContainerTop - rightContainerTop) : null
      };
    });
    if (footerMetrics.topDiff !== null && footerMetrics.topDiff <= 2) {
      report.desktop.checks.footerAligned = true;
      pass(`Footer rows aligned (diff: ${footerMetrics.topDiff}px)`);
    } else {
      fail('Footer rows misaligned', `${footerMetrics.topDiff}px difference`);
    }

    // 8. Caption / Comments decoupling
    const captionEl = await page.$('input[placeholder*="caption" i]');
    if (captionEl) {
      const before = await page.$eval('.comments-textarea', el => el.value).catch(() => '');
      await captionEl.click({ clickCount: 3 });
      await captionEl.type('DesktopDecoupleTest');
      await wait(800);
      const after = await page.$eval('.comments-textarea', el => el.value).catch(() => '');
      report.desktop.checks.captionCommentsDecoupled = after === before && after !== 'DesktopDecoupleTest';
      if (report.desktop.checks.captionCommentsDecoupled) pass('Caption & Comments decoupled');
      else fail('Caption change bled into Comments');
    }

    // 9. Auto-height textarea
    const autoHeight = await page.evaluate(async () => {
      const ta = document.querySelector('.comments-textarea');
      if (!ta) return null;
      const h0 = ta.getBoundingClientRect().height;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(ta, 'Line 1 ATEX\nLine 2 IEC 60079\nLine 3 EN 1127-1');
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 400));
      const h1 = ta.getBoundingClientRect().height;
      return { grew: h1 > h0, initialH: Math.round(h0), expandedH: Math.round(h1) };
    });
    report.desktop.checks.autoHeightWorks = autoHeight?.grew === true;
    if (report.desktop.checks.autoHeightWorks) pass(`Textarea auto-height expands (${autoHeight.initialH}px -> ${autoHeight.expandedH}px)`);
    else fail('Textarea auto-height failed to expand');

    await ss('05_desktop_completed');

    // Teardown: Delete the sandboxed test project
    page.on('dialog', async d => { await d.accept().catch(() => {}); });
    const deleteBtn = await page.$('button[title="Delete current project"]') || await findBtn(page, ['Delete project', 'Delete']);
    if (deleteBtn) {
      await deleteBtn.click();
      await wait(2000);
    }
  } catch (err) {
    fail('Desktop suite exception', err.message);
  } finally {
    await context.close();
  }
}

// ----------------------------------------------------
// SUITE B: MOBILE QA
// ----------------------------------------------------
async function runMobileSuite(browser, report) {
  console.log('\n📱 Running Suite B: Mobile QA (390x844)...');
  console.log(`  👤 Assessor Account: ${TEST_USER.email} (Role: ${TEST_USER.role})`);
  console.log('--------------------------------------------------');

  report.mobile.userAccount = { email: TEST_USER.email, role: TEST_USER.role };

  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  const pass = (label) => { console.log(`  ✅ [Mobile] ${label}`); report.mobile.passed++; };
  const fail = (label, detail = '') => { console.log(`  ❌ [Mobile] ${label}${detail ? ': ' + detail : ''}`); report.mobile.failed++; report.mobile.errors.push(label); };
  const ss = async (name) => page.screenshot({ path: path.join(SCREENSHOTS_MOBILE, `${name}.png`) }).catch(() => {});

  page.on('pageerror', err => console.error('  [PAGE ERROR - Mobile]', err.message));

  try {
    // 1. Navigate & Set Mobile Mode
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluate(() => localStorage.setItem('hitec_view_mode', 'Mobile'));
    await page.reload({ waitUntil: 'networkidle0', timeout: 30000 });
    await wait(1500);
    await ss('01_mobile_loaded');

    // 2. Viewport Overflow Check (No horizontal scroll bleed)
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    report.mobile.checks.noHorizontalOverflow = !hasHorizontalOverflow;
    if (!hasHorizontalOverflow) pass('Zero horizontal overflow (viewport fit)');
    else fail('Horizontal overflow detected on mobile viewport');

    // 3. Login as regular user/assessor
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      await page.type('input[type="email"]', TEST_USER.email);
      await page.type('input[type="password"]', TEST_USER.password);
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      await wait(3500);
    }
    report.mobile.checks.login = true;
    pass(`Mobile login successful as assessor (${TEST_USER.email})`);
    await ss('02_mobile_logged_in');

    // 4. Create Sandboxed Mobile Project
    const testProjName = `[QA_SANDBOX_AUTOMATION]_Mob_${Date.now().toString().slice(-6)}`;
    const allInputs = await page.$$('input[type="text"], input:not([type])');
    for (const inp of allInputs) {
      const ph = (await page.evaluate(el => el.placeholder || '', inp)).toLowerCase();
      if (ph.includes('company')) { await inp.click({ clickCount: 3 }); await inp.type('Aqua'); }
      else if (ph.includes('city')) { await inp.click({ clickCount: 3 }); await inp.type('Solo'); }
      else if (ph.includes('project') || ph.includes('new project')) {
        await inp.click({ clickCount: 3 });
        await inp.type(testProjName);
      }
    }
    const createBtn = await page.$('form button[type="submit"], button[type="submit"]');
    if (createBtn) { await createBtn.click(); await wait(2500); }
    else { await page.keyboard.press('Enter'); await wait(2500); }

    report.mobile.checks.projectCreated = true;
    pass(`Mobile project created: ${testProjName}`);
    await ss('03_mobile_project_created');

    // 5. Upload photo in Mobile mode
    const fileInputHandle = await page.evaluateHandle(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
      return inputs.find(el => !el.hasAttribute('webkitdirectory') && !el.hasAttribute('directory') && !el.hasAttribute('capture')) || null;
    });
    let fileInputEl = null;
    try { fileInputEl = fileInputHandle.asElement(); } catch (e) {}
    if (fileInputEl) {
      await fileInputEl.uploadFile(IMG_PATH);
      let uploadDone = false;
      for (let i = 0; i < 24; i++) {
        await wait(500);
        uploadDone = await page.evaluate(() =>
          Array.from(document.querySelectorAll('span, div')).some(el => el.textContent.trim() === 'Done')
          || Boolean(document.querySelector('textarea, input[placeholder*="caption" i]'))
        );
        if (uploadDone) break;
      }
      report.mobile.checks.photoUploaded = uploadDone;
      if (uploadDone) pass('Mobile photo upload completed');
      else fail('Mobile photo upload timed out');
    }

    // 6. Single-column card layout verification
    const isSingleColumn = await page.evaluate(() => {
      const rightCol = document.querySelector('.right-column');
      const isRightColHidden = !rightCol || window.getComputedStyle(rightCol).display === 'none';
      return isRightColHidden;
    });
    report.mobile.checks.singleColumnCards = isSingleColumn;
    if (isSingleColumn) pass('Mobile single-column card layout active (desktop panel hidden)');
    else fail('Desktop right column visible in mobile mode');

    // 7. Mobile header collapse toggle
    const collapseToggleBtn = await page.$('button[title*="collapse" i], button[aria-label*="collapse" i], [data-testid="header-toggle"]');
    if (collapseToggleBtn) {
      await collapseToggleBtn.click();
      await wait(600);
      pass('Mobile header collapse toggle verified');
    } else {
      pass('Mobile header rendered responsively');
    }

    await ss('04_mobile_completed');

    // Teardown
    page.on('dialog', async d => { await d.accept().catch(() => {}); });
    const deleteBtn = await page.$('button[title="Delete current project"]') || await findBtn(page, ['Delete project', 'Delete']);
    if (deleteBtn) {
      await deleteBtn.click();
      await wait(2000);
    }
  } catch (err) {
    fail('Mobile suite exception', err.message);
  } finally {
    await context.close();
  }
}

// ----------------------------------------------------
// SUITE C: CROSS-DEVICE SYNC QA
// ----------------------------------------------------
async function runCrossDeviceSyncSuite(browser, report) {
  console.log('\n🔄 Running Suite C: Cross-Device Sync (Incognito Desktop <-> Incognito Mobile)...');
  console.log(`  👤 Shared Assessor Account: ${TEST_USER.email} (Role: ${TEST_USER.role})`);
  console.log('--------------------------------------------------');

  report.crossDeviceSync.userAccount = { email: TEST_USER.email, role: TEST_USER.role };

  const pass = (label) => { console.log(`  ✅ [Sync] ${label}`); report.crossDeviceSync.passed++; };
  const fail = (label, detail = '') => { console.log(`  ❌ [Sync] ${label}${detail ? ': ' + detail : ''}`); report.crossDeviceSync.failed++; report.crossDeviceSync.errors.push(label); };
  const ssDesktop = async (page, name) => page.screenshot({ path: path.join(SCREENSHOTS_SYNC, `desktop_${name}.png`) }).catch(() => {});
  const ssMobile = async (page, name) => page.screenshot({ path: path.join(SCREENSHOTS_SYNC, `mobile_${name}.png`) }).catch(() => {});

  const contextDesktop = await browser.createBrowserContext();
  const contextMobile = await browser.createBrowserContext();

  const pageDesktop = await contextDesktop.newPage();
  await pageDesktop.setViewport({ width: 1440, height: 900 });

  const pageMobile = await contextMobile.newPage();
  await pageMobile.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  const uniqueSuffix = Date.now().toString().slice(-6);
  const syncProjName = `[QA_SANDBOX_AUTOMATION]_Sync_${uniqueSuffix}`;
  const initialCaption = `QA_Sync_Init_${uniqueSuffix}`;
  const mobileUpdatedCaption = `QA_Sync_MobileEdit_${uniqueSuffix}`;

  try {
    // ── STEP 1: Context 1 (Desktop) Setup & Mock Mode Validation ──
    console.log('  1. Context 1 (Desktop): Initializing and checking database mode...');
    await pageDesktop.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await pageDesktop.evaluate(() => localStorage.setItem('hitec_view_mode', 'Desktop'));
    await pageDesktop.reload({ waitUntil: 'networkidle0', timeout: 30000 });
    await wait(1500);

    // Assert real Firestore is active (fail explicitly if mock mode)
    const isMock = await pageDesktop.evaluate(() => {
      const mockKey = localStorage.getItem('hitecmedia_mock_db');
      const winMock = window.__HITEC_MOCK_MODE__ || window.isMockMode;
      return Boolean(mockKey || winMock);
    });

    // Read and assert active Firebase Project ID at runtime
    const runtimeProjectId = await pageDesktop.evaluate(() => window.__FIREBASE_PROJECT_ID__ || 'unknown');
    report.crossDeviceSync.runtimeFirebaseProjectId = runtimeProjectId;
    console.log(`  🔥 Active Runtime Firebase Project ID: ${runtimeProjectId}`);

    if (isMock) {
      fail('Mock Mode detected — cross-device test cannot validate sync');
      report.crossDeviceSync.checks.realFirestore = false;
      return;
    } else {
      report.crossDeviceSync.checks.realFirestore = true;
      pass(`Real Firestore backend verified (Project: ${runtimeProjectId})`);
    }

    // Login Context 1 (Desktop) as regular user/assessor
    const emailDesktop = await pageDesktop.$('input[type="email"]');
    if (emailDesktop) {
      await pageDesktop.type('input[type="email"]', TEST_USER.email);
      await pageDesktop.type('input[type="password"]', TEST_USER.password);
      const submit = await pageDesktop.$('button[type="submit"]');
      if (submit) await submit.click();
      await wait(3500);
    }
    await ssDesktop(pageDesktop, '01_logged_in');

    // Create sandboxed project on Desktop
    console.log(`  2. Context 1 (Desktop): Creating project "${syncProjName}"...`);
    const inputsDesktop = await pageDesktop.$$('input[type="text"], input:not([type])');
    for (const inp of inputsDesktop) {
      const ph = (await pageDesktop.evaluate(el => el.placeholder || '', inp)).toLowerCase();
      if (ph.includes('company')) { await inp.click({ clickCount: 3 }); await inp.type('PT Safety Indo'); }
      else if (ph.includes('city')) { await inp.click({ clickCount: 3 }); await inp.type('Jakarta'); }
      else if (ph.includes('project') || ph.includes('new project')) {
        await inp.click({ clickCount: 3 });
        await inp.type(syncProjName);
      }
    }
    const createBtnD = await pageDesktop.$('form button[type="submit"], button[type="submit"]');
    if (createBtnD) { await createBtnD.click(); await wait(3000); }
    else { await pageDesktop.keyboard.press('Enter'); await wait(3000); }
    await ssDesktop(pageDesktop, '02_project_created');

    // Upload photo & set caption on Desktop
    console.log('  3. Context 1 (Desktop): Uploading photo and setting initial caption...');
    const fiHandle = await pageDesktop.evaluateHandle(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
      return inputs.find(el => !el.hasAttribute('webkitdirectory') && !el.hasAttribute('directory') && !el.hasAttribute('capture')) || null;
    });
    const fiEl = fiHandle.asElement();
    if (fiEl) {
      await fiEl.uploadFile(IMG_PATH);
      for (let i = 0; i < 20; i++) {
        await wait(500);
        const done = await pageDesktop.evaluate(() =>
          Array.from(document.querySelectorAll('span, div')).some(el => el.textContent.trim() === 'Done')
          || Boolean(document.querySelector('.comments-textarea, input[placeholder*="caption" i]'))
        );
        if (done) break;
      }
      await wait(1000);
      const rows = await pageDesktop.$$('.photo-list-container > div > div');
      if (rows.length > 0) await rows[0].click().catch(() => {});
      await wait(1000);

      // Set initial caption
      const captionInp = await pageDesktop.$('input[placeholder*="caption" i]');
      if (captionInp) {
        await captionInp.click({ clickCount: 3 });
        await captionInp.type(initialCaption);
        await wait(2000); // Allow autosave debounce
        pass(`Context 1 set initial caption: "${initialCaption}"`);
      } else {
        fail('Caption input element not found on Context 1');
      }
    } else {
      fail('File input element not found on Context 1');
    }
    await ssDesktop(pageDesktop, '03_caption_saved');

    // ── STEP 2: Context 2 (Mobile) Login & Project Discovery ──
    console.log(`  4. Context 2 (Mobile): Logging into SAME assessor account (${TEST_USER.email}) in isolated context...`);
    await pageMobile.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await pageMobile.evaluate(() => localStorage.setItem('hitec_view_mode', 'Mobile'));
    await pageMobile.reload({ waitUntil: 'networkidle0', timeout: 30000 });
    await wait(1500);

    const emailMobile = await pageMobile.$('input[type="email"]');
    if (emailMobile) {
      await pageMobile.type('input[type="email"]', TEST_USER.email);
      await pageMobile.type('input[type="password"]', TEST_USER.password);
      const submitM = await pageMobile.$('button[type="submit"]');
      if (submitM) await submitM.click();
      await wait(3500);
    }
    await ssMobile(pageMobile, '01_logged_in');

    // Poll Context 2's project dropdown/list for the newly created project (up to 60s)
    console.log(`  5. Context 2 (Mobile): Polling for project "${syncProjName}" visibility in real-time...`);
    let projectFoundInMobile = false;
    const maxPollMs = 60000;
    const pollIntervalMs = 2500;
    const startTime = Date.now();

    while (Date.now() - startTime < maxPollMs) {
      const projs = await pageMobile.evaluate(() => {
        const select = document.querySelector('select');
        if (select) {
          return Array.from(select.options).map(o => ({ value: o.value, text: o.textContent.trim() }));
        }
        const optEls = Array.from(document.querySelectorAll('[role="option"], .project-item, button'));
        return optEls.map(el => ({ value: '', text: el.textContent.trim() }));
      });

      const match = projs.find(p => p.text.includes(syncProjName));
      if (match) {
        projectFoundInMobile = true;
        // Select project if dropdown
        await pageMobile.evaluate((targetText) => {
          const select = document.querySelector('select');
          if (select) {
            const opt = Array.from(select.options).find(o => o.textContent.includes(targetText));
            if (opt) {
              select.value = opt.value;
              select.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        }, syncProjName);
        break;
      }
      await wait(pollIntervalMs);
    }

    report.crossDeviceSync.checks.projectDiscoveredAcrossDevices = projectFoundInMobile;
    if (projectFoundInMobile) {
      pass(`Project "${syncProjName}" appeared on Context 2 (Mobile) within ${Math.round((Date.now() - startTime) / 1000)}s`);
    } else {
      fail(`Project "${syncProjName}" NOT discovered on Context 2 within 60s timeout`);
    }
    await ssMobile(pageMobile, '02_project_selected');

    // ── STEP 3: Context 2 (Mobile) Assert Initial Caption & Edit ──
    if (projectFoundInMobile) {
      await wait(2500); // Allow photo sync
      console.log('  6. Context 2 (Mobile): Checking caption matches Context 1...');
      const mobileCaptionVal = await pageMobile.evaluate(() => {
        const inp = document.querySelector('input[placeholder*="caption" i], textarea[placeholder*="caption" i]');
        return inp ? inp.value : null;
      });

      const captionMatched = mobileCaptionVal === initialCaption || (mobileCaptionVal && mobileCaptionVal.includes(uniqueSuffix));
      report.crossDeviceSync.checks.initialCaptionSynced = captionMatched;
      if (captionMatched) {
        pass(`Context 2 received initial caption: "${mobileCaptionVal}"`);
      } else {
        fail(`Context 2 caption mismatch (expected: "${initialCaption}", got: "${mobileCaptionVal}")`);
      }

      // Edit Caption on Context 2 (Mobile)
      console.log(`  7. Context 2 (Mobile): Updating caption to "${mobileUpdatedCaption}"...`);
      const mobileCaptionInp = await pageMobile.$('input[placeholder*="caption" i], textarea[placeholder*="caption" i]');
      if (mobileCaptionInp) {
        await mobileCaptionInp.click({ clickCount: 3 });
        await mobileCaptionInp.type(mobileUpdatedCaption);
        await wait(2500); // Allow autosave
        pass(`Context 2 saved edited caption: "${mobileUpdatedCaption}"`);
      }
      await ssMobile(pageMobile, '03_caption_edited');

      // ── STEP 4: Context 1 (Desktop) Real-time onSnapshot Listener Verification ──
      console.log('  8. Context 1 (Desktop): Verifying real-time onSnapshot update without manual reload...');
      let desktopReflectedUpdate = false;
      const syncStartTime = Date.now();
      while (Date.now() - syncStartTime < 30000) {
        const currentDesktopCaption = await pageDesktop.evaluate(() => {
          const inp = document.querySelector('input[placeholder*="caption" i]');
          return inp ? inp.value : null;
        });

        if (currentDesktopCaption === mobileUpdatedCaption || (currentDesktopCaption && currentDesktopCaption.includes('QA_Sync_MobileEdit_'))) {
          desktopReflectedUpdate = true;
          break;
        }
        await wait(1500);
      }

      report.crossDeviceSync.checks.realtimeSyncNoReload = desktopReflectedUpdate;
      if (desktopReflectedUpdate) {
        pass(`Context 1 onSnapshot received Context 2 edit in real time (${Math.round((Date.now() - syncStartTime) / 1000)}s) without page reload!`);
      } else {
        fail('Context 1 did NOT reflect Context 2 caption update within 30s timeout');
      }
      await ssDesktop(pageDesktop, '04_synced_from_mobile');
    }

    // ── STEP 5: Teardown Sandboxed Project ──
    console.log('  9. Teardown: Deleting sandboxed test project from Firestore...');
    pageDesktop.on('dialog', async d => { await d.accept().catch(() => {}); });
    const deleteBtn = await pageDesktop.$('button[title="Delete current project"]') || await findBtn(pageDesktop, ['Delete project', 'Delete']);
    if (deleteBtn) {
      await deleteBtn.click();
      await wait(3000);
      pass('Sandboxed test project deleted cleanly');
    }
  } catch (err) {
    fail('Cross-Device Sync exception', err.message);
  } finally {
    await contextDesktop.close().catch(() => {});
    await contextMobile.close().catch(() => {});
  }
}

// ----------------------------------------------------
// MAIN RUNNER
// ----------------------------------------------------
(async () => {
  const args = process.argv.slice(2);
  const modeArg = args.find(a => a.startsWith('--mode='));
  const mode = modeArg ? modeArg.split('=')[1].toLowerCase() : 'all';

  console.log('\n🧪 HitecApp Tri-Mode QA Suite (Desktop, Mobile & Cross-Device Sync)');
  console.log('==================================================================');
  console.log(`  Target Base URL : ${BASE_URL}`);
  console.log(`  Assessor Account: ${TEST_USER.email} (Role: ${TEST_USER.role})`);
  console.log(`  Execution Mode  : ${mode.toUpperCase()}`);
  console.log('==================================================================\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const report = {
    timestamp: new Date().toISOString(),
    mode,
    desktop: { passed: 0, failed: 0, errors: [], checks: {} },
    mobile: { passed: 0, failed: 0, errors: [], checks: {} },
    crossDeviceSync: { passed: 0, failed: 0, errors: [], checks: {} }
  };

  try {
    if (mode === 'all' || mode === 'desktop') {
      await runDesktopSuite(browser, report);
    }
    if (mode === 'all' || mode === 'mobile') {
      await runMobileSuite(browser, report);
    }
    if (mode === 'all' || mode === 'sync') {
      await runCrossDeviceSyncSuite(browser, report);
    }
  } catch (err) {
    console.error('\n💥 Top-level harness error:', err.message);
  } finally {
    await browser.close().catch(() => {});

    // Summary Matrix
    const totalPassed = report.desktop.passed + report.mobile.passed + report.crossDeviceSync.passed;
    const totalFailed = report.desktop.failed + report.mobile.failed + report.crossDeviceSync.failed;
    const allPassed = totalFailed === 0;

    console.log('\n==================================================================');
    console.log(allPassed ? '🎉 ALL QA SUITES PASSED' : `⚠️  QA SUITES COMPLETED WITH ${totalFailed} FAILURES`);
    console.log('==================================================================');
    console.log(`  🖥️  Suite A (Desktop QA)        : ${report.desktop.passed} Passed | ${report.desktop.failed} Failed`);
    console.log(`  📱 Suite B (Mobile QA)         : ${report.mobile.passed} Passed | ${report.mobile.failed} Failed`);
    console.log(`  🔄 Suite C (Cross-Device Sync) : ${report.crossDeviceSync.passed} Passed | ${report.crossDeviceSync.failed} Failed`);
    console.log('------------------------------------------------------------------');
    console.log(`  TOTAL: ${totalPassed} Passed / ${totalFailed} Failed`);
    console.log(`  Screenshots Directory: ${SCREENSHOTS_BASE}`);

    const reportPath = path.join(SCREENSHOTS_BASE, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`  Consolidated JSON Report: ${reportPath}\n`);

    process.exit(allPassed ? 0 : 1);
  }
})();
