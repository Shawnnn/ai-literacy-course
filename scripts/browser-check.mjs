import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { chromium } from 'playwright';
import { entries } from '../src/data/course.ts';

const qa = resolve('.qa');
await mkdir(qa, { recursive: true });
const port = 4322;
const base = process.env.COURSE_URL || `http://127.0.0.1:${port}`;
let server;
let browser;
let page;
const errors = [];
const report = { pages: 0, diagrams: 0, searches: [], responsive: [], interactions: [] };

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try { const response = await fetch(base); if (response.ok) return; } catch {}
    await new Promise((done) => setTimeout(done, 500));
  }
  throw new Error(`Preview unavailable: ${base}`);
}
async function ready(target = page) {
  await target.waitForFunction(() => document.documentElement.dataset.courseReady === 'true', { timeout: 30000 });
  assert.equal(await target.locator('[data-diagram-state="error"]').count(), 0, 'A course diagram failed to render');
}
async function noOverflow(label, target = page) {
  const measurement = await target.evaluate(() => ({ viewport: innerWidth, page: document.documentElement.scrollWidth }));
  assert(measurement.page <= measurement.viewport + 1, `${label} has horizontal page overflow: ${JSON.stringify(measurement)}`);
}
async function visit(path) { const response = await page.goto(`${base}${path}`); if (response) assert.equal(response.status(), 200); await ready(); }
const captureErrors = (target) => {
  target.on('pageerror', (error) => errors.push(error.message));
  target.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
};

try {
  if (!process.env.COURSE_URL) {
    const directory = resolve('dist');
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.wasm': 'application/wasm' };
    server = createServer((request, response) => {
      try {
        const path = decodeURIComponent(new URL(request.url, 'http://course.local').pathname);
        let file = resolve(directory, `.${path}`);
        if (file !== directory && !file.startsWith(`${directory}${sep}`)) { response.writeHead(403).end(); return; }
        if (existsSync(file) && statSync(file).isDirectory()) file = resolve(file, 'index.html');
        if (!existsSync(file) || !statSync(file).isFile()) { file = resolve(directory, '404.html'); response.statusCode = 404; }
        response.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
        response.end(request.method === 'HEAD' ? undefined : readFileSync(file));
      } catch { response.writeHead(400).end(); }
    });
    await new Promise((done, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', done); });
  }
  await waitForServer();
  const channel = process.env.COURSE_BROWSER || (process.platform === 'win32' && existsSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe') ? 'msedge' : undefined);
  browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'], reducedMotion: 'reduce' });
  page = await context.newPage(); captureErrors(page);

  for (const entry of entries) {
    await visit(entry.url);
    await noOverflow(`desktop ${entry.url}`);
    const diagrams = await page.locator('[data-diagram-state="ready"] svg').count();
    report.pages++; report.diagrams += diagrams;
    if (entry.id === 'guide') await page.screenshot({ path: `${qa}/home-desktop.png` });
    if (entry.id === '09') await page.screenshot({ path: `${qa}/reader-desktop.png` });
    console.log(`PASS ${entry.url} (${diagrams} diagrams)`);
  }
  assert.equal(report.pages, 18); assert.equal(report.diagrams, 40);

  await visit('/');
  for (const [query, expected] of [['提示词', '/learn/04/'], ['知识库', '/learn/10/'], ['Token', '/learn/03/'], ['MCP', '/learn/07/']]) {
    await page.locator('[data-open-search]').click();
    await page.locator('#course-search').fill(query);
    await page.waitForFunction(() => /^找到 \d+/.test(document.getElementById('search-status').textContent));
    const links = await page.locator('.search-result').evaluateAll((elements) => elements.map((element) => element.getAttribute('href')));
    assert(links.some((link) => link.startsWith(expected)), `Search ${query} did not include ${expected}`);
    await page.locator('#course-search').press('ArrowDown');
    assert(await page.locator('.search-result').first().evaluate((element) => document.activeElement === element), 'Keyboard search navigation failed');
    await page.keyboard.press('Escape');
    assert(!(await page.locator('#search-dialog').isVisible()));
    report.searches.push({ query, results: links.length, expected });
  }
  await page.locator('[data-open-search]').click();
  await page.locator('#course-search').fill('这是一段不应存在的测试词xyz');
  await page.waitForFunction(() => document.getElementById('search-status').textContent.includes('暂时没有找到'));
  await page.keyboard.press('Escape');
  assert(!(await page.locator('#search-dialog').isVisible()), 'Escape from the focused search input should close the dialog');
  report.interactions.push('Chinese and English search, keyboard navigation, empty result');

  await visit('/learn/04/');
  const toggle = page.locator('[data-toggle-complete="04"]');
  await toggle.click(); assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
  await page.reload(); await ready(); assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('[data-progress-count]').first().innerText(), '1');
  await toggle.click(); assert.equal(await toggle.getAttribute('aria-pressed'), 'false');
  report.interactions.push('Complete, reload persistence, undo');

  const template = page.locator('.prompt-template').first();
  const expectedClipboard = (await template.locator('blockquote').innerText()).trim();
  await template.locator('[data-copy]').click();
  await page.waitForFunction(() => document.getElementById('toast').textContent.includes('已复制'));
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), expectedClipboard);
  const answers = page.locator('.lesson-content details').first();
  await answers.locator('summary').click(); assert(await answers.evaluate((element) => element.open));
  await answers.locator('summary').focus(); await page.keyboard.press('Enter'); assert(!(await answers.evaluate((element) => element.open)));
  report.interactions.push('Prompt clipboard content, answer folding by mouse and keyboard');

  const expand = page.locator('[data-diagram-expand]').first();
  await expand.click(); assert(await page.locator('#diagram-dialog').isVisible());
  assert.equal(await page.locator('.diagram-canvas svg').count(), 1);
  await page.locator('[data-zoom-in]').click(); assert.equal(await page.locator('#diagram-zoom').innerText(), '125%');
  const duplicates = await page.evaluate(() => { const ids = [...document.querySelectorAll('[id]')].map((element) => element.id); return ids.filter((id, index) => ids.indexOf(id) !== index); });
  assert.deepEqual(duplicates, [], 'Expanded diagram introduced duplicate IDs');
  await page.keyboard.press('Escape'); assert(!(await page.locator('#diagram-dialog').isVisible()));
  assert(await expand.evaluate((element) => element === document.activeElement));
  report.interactions.push('Diagram zoom, unique SVG IDs, Escape and focus restoration');

  const resumeHeading = page.locator('.lesson-content h2').nth(4);
  const resumeId = await resumeHeading.getAttribute('id');
  await resumeHeading.scrollIntoViewIfNeeded(); await page.evaluate(() => window.scrollBy(0, 110));
  const beforeY = await page.evaluate(() => window.scrollY);
  await page.waitForTimeout(950);
  await visit('/');
  assert((await page.locator('[data-continue-label]').first().innerText()).includes('第 4 章'));
  await page.locator('[data-continue]').first().click(); await ready();
  const restoredY = await page.evaluate(() => window.scrollY);
  assert(Math.abs(restoredY - beforeY) < 100, `Resume position differs: ${beforeY} -> ${restoredY}`);
  await visit(`/learn/04/#${encodeURIComponent(resumeId)}`);
  const hashTop = await page.locator(`[id="${resumeId}"]`).evaluate((element) => element.getBoundingClientRect().top);
  assert(Math.abs(hashTop - 105) < 6, `Shared anchor was overridden by saved progress: ${hashTop}`);
  report.interactions.push('Continue reading position, direct shared-anchor priority');

  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/learn/09/']) {
      await visit(path); await noOverflow(`${width}px ${path}`);
      report.responsive.push({ width, path, overflow: false });
      if (width === 390) await page.screenshot({ path: `${qa}/${path === '/' ? 'home' : 'reader'}-mobile.png` });
    }
  }
  await page.setViewportSize({ width: 390, height: 900 }); await visit('/learn/09/');
  assert(await page.locator('.table-scroll').evaluateAll((elements) => elements.some((element) => element.scrollWidth > element.clientWidth)), 'Wide tables should scroll inside their own containers');
  await page.locator('[data-open-menu]').click(); assert(await page.locator('#menu-dialog').isVisible());
  await page.keyboard.press('Escape'); assert(!(await page.locator('#menu-dialog').isVisible()));
  await page.locator('[data-open-menu]').click();
  await page.locator('#menu-dialog a[href="/learn/02/"]').click(); await ready(); assert.equal(new URL(page.url()).pathname, '/learn/02/');
  report.interactions.push('Mobile menu, Escape, chapter navigation and table scrolling');

  const blocked = await browser.newContext({ viewport: { width: 390, height: 900 } });
  await blocked.addInitScript(() => { Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('Storage blocked', 'SecurityError'); } }); });
  const blockedPage = await blocked.newPage(); captureErrors(blockedPage);
  await blockedPage.goto(`${base}/learn/01/`); await ready(blockedPage);
  assert(await blockedPage.locator('article h1').isVisible());
  await blockedPage.locator('[data-toggle-complete]').click(); assert.equal(await blockedPage.locator('[data-toggle-complete]').getAttribute('aria-pressed'), 'true');
  await blocked.close(); report.interactions.push('Reading and in-page controls with storage blocked');

  assert.deepEqual(errors, [], 'Unexpected browser errors before deliberate 404 check');
  const notFound = await page.goto(`${base}/a-page-that-does-not-exist/`); assert.equal(notFound.status(), 404); assert(await page.locator('h1').innerText().then((text) => text.includes('暂时翻不到')));
  // A deliberate 404 navigation may emit a resource error. All earlier errors
  // are retained and must be absent before checking the 404 page.
  const unexpectedErrors = errors.filter((error) => !error.includes('404 (Not Found)'));
  assert.deepEqual(unexpectedErrors, [], 'Unexpected browser errors');
  report.result = 'passed';
  await writeFile(`${qa}/browser-report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  if (page) await page.screenshot({ path: `${qa}/failure.png` }).catch(() => {});
  await writeFile(`${qa}/browser-report.json`, JSON.stringify({ ...report, result: 'failed', error: String(error), browserErrors: errors }, null, 2));
  throw error;
} finally {
  if (browser) await browser.close();
  if (server) { server.closeAllConnections(); await new Promise((done) => server.close(done)); }
}
