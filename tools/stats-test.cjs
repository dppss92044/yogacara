// W001 匿名使用統計客戶端測試。針對 App v1.91 基底＋W001 補丁（tools/patch-w001-stats.py）新寫。
// 執行：node tools/stats-test.cjs   （需 Playwright 與 Chromium；僅 Chromium 模擬，不能取代 Safari／iPhone／iPad 實機）
const fs = require('fs'), http = require('http'), path = require('path'), assert = require('assert'), { execSync } = require('child_process');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const root = path.resolve(__dirname, '..'); let serveRoot = root; const EP = 'https://yogacara-stats.dppss92044.workers.dev';
const SHOTS = process.env.SHOTS_DIR || '';
const results = [];
const noErr = x => assert.ok(x.errors.length === 0, '頁面錯誤：' + x.errors.join(' | '));
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
const handler = (req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]).replace(/^\/yogacara\//, '').replace(/^\//, '');
  let f = path.join(serveRoot, u || 'index.html');
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(serveRoot, 'index.html');
  res.setHeader('Content-Type', f.endsWith('.html') ? 'text/html; charset=utf8' : f.endsWith('.js') ? 'application/javascript' : f.endsWith('.json') || f.endsWith('.webmanifest') ? 'application/json' : 'application/octet-stream');
  res.end(fs.readFileSync(f));
};
let server = http.createServer(handler);
let browser, base, port;
async function boot(o = {}) {
  const c = await browser.newContext({ viewport: o.viewport || { width: 1440, height: 900 }, hasTouch: !!o.touch, isMobile: !!o.touch });
  const ctx = { c, mode: o.mode || 'ok', reqs: [], errors: [], geo: 0 };
  await c.addInitScript(({ layout, init, dnt, gpc, edition }) => {
    try { localStorage.setItem('hk-tour', '9'); localStorage.setItem('hk-device-layout-v146', layout); if (edition) localStorage.setItem('hk-edition-v154', edition); } catch (e) {}
    if (init) for (const k in init) try { if (!localStorage.getItem('__seeded') ) localStorage.setItem(k, typeof init[k] === 'string' ? init[k] : JSON.stringify(init[k])); } catch (e) {}
    try { localStorage.setItem('__seeded', '1'); } catch (e) {}
    if (dnt) Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true });
    if (gpc) Object.defineProperty(navigator, 'globalPrivacyControl', { value: true, configurable: true });
    window.__vis = 'visible';
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => window.__vis });
    window.__geo = 0;
    for (const m of ['getCurrentPosition', 'watchPosition']) if (navigator.geolocation) { const orig = navigator.geolocation[m]; navigator.geolocation[m] = function () { window.__geo++; return orig.apply(this, arguments); }; }
  }, { layout: o.layout || 'mac', init: o.init || null, dnt: !!o.dnt, gpc: !!o.gpc, edition: o.edition || '' });
  const p = await c.newPage(); ctx.p = p;
  p.on('pageerror', e => ctx.errors.push(e.message));
  p.on('dialog', d => { ctx.errors.push('dialog:' + d.message()); d.dismiss(); });
  if (!o.realSW) await p.route('**/sw.js', r => r.fulfill({ status: 404, body: '' }));
  await p.route(EP + '/**', async r => {
    const q = r.request(); ctx.reqs.push({ method: q.method(), url: q.url(), headers: q.headers(), body: q.postData() });
    if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });
    if (ctx.mode === 'ok') return r.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
    if (ctx.mode === '500') return r.fulfill({ status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    if (ctx.mode === 'abort') return r.abort('failed');
    /* hang：不回應 */
  });
  if (o.clock) await p.clock.install({ time: o.time || Date.now() });
  await p.goto(`${base}/yogacara/`);
  await p.waitForSelector('.txt');
  ctx.ls = k => p.evaluate(k => localStorage.getItem(k), k);
  ctx.state = async () => { const r = await ctx.ls('hk-anon-stat-v1'); return r && JSON.parse(r); };
  ctx.act = () => p.evaluate(() => document.body.dispatchEvent(new Event('pointerdown', { bubbles: true })));
  ctx.vis = async v => p.evaluate(v => { window.__vis = v; document.dispatchEvent(new Event('visibilitychange')); }, v);
  ctx.run = async (ms, active) => { for (let t = 0; t < ms; t += 10000) { if (active) await ctx.act(); await p.clock.runFor(Math.min(10000, ms - t)); } };
  ctx.bodies = () => ctx.reqs.filter(r => r.method === 'POST').map(r => JSON.parse(r.body));
  return ctx;
}
async function t(name, fn) {
  if (ONLY.length && !ONLY.some(k => name.startsWith(k))) return;
  try { await fn(); results.push([name, 'PASS']); console.log('PASS', name); }
  catch (e) { results.push([name, 'FAIL ' + e.message.split('\n')[0]]); console.log('FAIL', name, '\n   ', e.message.split('\n').slice(0, 4).join('\n    ')); }
}
const openAbout = async p => { await p.click('#menuBtn'); await p.waitForTimeout(200); await p.click('#aboutBtn'); await p.waitForTimeout(300); };

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r)); port = server.address().port; base = `http://127.0.0.1:${port}`;
  browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

  await t('01 不使用定位：index.html 無 geolocation 字串、執行中 0 次呼叫、無權限對話', async () => {
    assert.strictEqual(fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes('geolocation'), false);
    const x = await boot({ clock: true }); await x.run(20000, true);
    assert.strictEqual(await x.p.evaluate(() => window.__geo), 0); noErr(x); await x.c.close();
  });
  await t('02 payload 只有 v,id,o,s；text/plain；無 cookie／referer；無 preflight；首次約 3 秒後送出 o=1', async () => {
    const x = await boot({ clock: true }); await x.run(2000, true); assert.strictEqual(x.reqs.length, 0, '3 秒前不得送出');
    await x.run(3000, true);
    assert.strictEqual(x.reqs.length, 1); const q = x.reqs[0];
    assert.strictEqual(q.method, 'POST'); assert.ok(/text\/plain/.test(q.headers['content-type']));
    assert.ok(!q.headers.cookie && !q.headers.referer, JSON.stringify(q.headers));
    const b = JSON.parse(q.body); assert.deepStrictEqual(Object.keys(b), ['v', 'id', 'o', 's']);
    assert.strictEqual(b.v, 1); assert.match(b.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/); assert.strictEqual(b.o, 1); assert.ok(b.s >= 0 && b.s <= 5);
    assert.deepStrictEqual(await x.c.cookies(), []); assert.ok(!x.reqs.some(r => r.method === 'OPTIONS'));
    await x.c.close();
  });
  await t('03 有效時間：前景＋近期互動才累計；90 秒無互動停止；背景不累計；離開 30 分鐘以上再回來算新一次開啟', async () => {
    const x = await boot({ clock: true }); await x.run(4000, true);
    await x.run(50000, true); await x.vis('hidden'); await x.p.clock.runFor(100);
    let b = x.bodies(); const s1 = b[b.length - 1].s; assert.ok(s1 >= 45 && s1 <= 60, 's1=' + s1);
    await x.vis('visible'); await x.act(); await x.p.clock.runFor(300000 + 1000);          // 再等超過重試間隔（不影響成功情況）
    await x.act(); await x.p.clock.runFor(200000);                                         // 200 秒完全無互動
    await x.vis('hidden'); await x.p.clock.runFor(100); b = x.bodies(); const s2 = b[b.length - 1].s;
    assert.ok(s2 <= 100 && s2 >= 60, '無互動只應計約 90 秒內，s2=' + s2);
    const n = x.bodies().length; await x.p.clock.runFor(120000); assert.strictEqual(x.bodies().length, n, '背景不應再有傳送');
    await x.p.clock.runFor(31 * 60000); await x.vis('visible'); await x.p.clock.runFor(4000);
    b = x.bodies(); assert.strictEqual(b[b.length - 1].o, 1, '離開 >30 分鐘回來應算新一次開啟');
    await x.vis('hidden'); await x.vis('visible'); await x.p.clock.runFor(4000);
    assert.ok(x.bodies().filter(z => z.o === 1).length === 2, '30 分鐘內來回不算新開啟');
    await x.c.close();
  });
  await t('04 離線：不送、計數留本機；恢復連線後補送，成功才歸零', async () => {
    const x = await boot({ clock: true }); await x.run(4000, true);
    await x.c.setOffline(true); const n0 = x.reqs.length;
    await x.run(60000, true); await x.vis('hidden'); await x.p.clock.runFor(100); await x.vis('visible');
    assert.strictEqual(x.reqs.length, n0, '離線不得送出'); assert.ok((await x.state()).s >= 50, '離線計數應保留');
    await x.c.setOffline(false); await x.run(310000, true);
    assert.ok(x.reqs.length > n0, '恢復連線應補送'); const sent = x.bodies().reduce((a, z) => a + z.s, 0); assert.ok(sent >= 50);
    await x.p.clock.runFor(1000); assert.ok((await x.state()).s < 400, '成功後應扣除（歸零或只剩新累計）');
    noErr(x); await x.c.close();
  });
  for (const mode of ['500', 'abort', 'hang']) await t(`05 端點故障（${mode}）：無錯誤、計數保留、至少 5 分鐘後才重試、恢復後補送`, async () => {
    const x = await boot({ clock: true, mode }); await x.run(4000, true); const n1 = x.reqs.length; assert.strictEqual(n1, 1);
    await x.run(20000, true); await x.vis('hidden'); await x.p.clock.runFor(100); await x.vis('visible');
    assert.strictEqual(x.reqs.length, n1, '5 分鐘內不得重試');
    const st = await x.state(); assert.ok(st.o >= 1 && st.s >= 10, '失敗後計數應保留 ' + JSON.stringify(st));
    x.mode = 'ok'; await x.run(400000, true);
    assert.ok(x.reqs.length > n1); assert.ok(x.bodies().some(z => z.o >= 1));
    noErr(x); await x.c.close();
  });
  for (const [k, o] of [['DNT', { dnt: true }], ['GPC', { gpc: true }]]) await t(`06 ${k}：不產生編號、不傳送，開關顯示為關且不可切換並有說明`, async () => {
    const x = await boot({ clock: true, ...o }); await x.run(30000, true);
    assert.strictEqual(await x.ls('hk-anon-stat-v1'), null); assert.strictEqual(x.reqs.length, 0);
    await openAbout(x.p);
    assert.strictEqual(await x.p.locator('#optStats').isChecked(), false); assert.strictEqual(await x.p.locator('#optStats').isDisabled(), true);
    assert.strictEqual(await x.p.locator('#statsMsg').textContent(), '偵測到瀏覽器的「不追蹤」設定，匿名使用統計已自動停用。'); await x.c.close();
  });
  await t('07 關閉開關：立即停止、丟棄未送、刪編號、保留已關閉；重開仍關閉；再開得新編號', async () => {
    const x = await boot({ clock: true }); await x.run(4000, true); await x.run(30000, true);
    const id1 = (await x.state()).id; await openAbout(x.p);
    assert.strictEqual(await x.p.locator('#optStats').isChecked(), true); assert.strictEqual(await x.p.locator('#statsMsg').textContent(), '');
    const n = x.reqs.length; await x.p.locator('label.stats').click();
    assert.strictEqual(await x.p.locator('#optStats').isChecked(), false);
    assert.strictEqual(await x.p.locator('#statsMsg').textContent(), '已關閉：不再傳送任何統計，本機的匿名編號也已刪除。');
    assert.strictEqual(await x.ls('hk-anon-stat-v1'), null); assert.strictEqual(await x.ls('hk-stats-off-v1'), '1');
    await x.run(400000, true); await x.vis('hidden'); await x.p.clock.runFor(100); assert.strictEqual(x.reqs.length, n, '關閉後不得再送任何請求（含未送資料）');
    await x.vis('visible'); await x.p.reload(); await x.p.waitForSelector('.txt'); await x.p.clock.runFor(10000);
    assert.strictEqual(await x.ls('hk-anon-stat-v1'), null); assert.strictEqual(x.reqs.length, n);
    await openAbout(x.p); assert.strictEqual(await x.p.locator('#optStats').isChecked(), false);
    await x.p.locator('label.stats').click(); assert.strictEqual(await x.ls('hk-stats-off-v1'), null);
    await x.p.clock.runFor(4000); const id2 = (await x.state()).id; assert.ok(id2 && id2 !== id1, '重新開啟應產生新編號');
    assert.ok(x.reqs.length > n); noErr(x); await x.c.close();
  });
  await t('08 365 天輪替：超過 365 天換新編號，未滿則沿用', async () => {
    const T = Date.parse('2026-10-05T04:00:00Z'), mk = (age, id) => ({ 'hk-anon-stat-v1': JSON.stringify({ id, t: T - age * 864e5, o: 0, s: 0 }) });
    const idA = '11111111-1111-4111-8111-111111111111';
    let x = await boot({ clock: true, time: T, init: mk(366, idA) }); await x.run(4000, true); assert.notStrictEqual((await x.state()).id, idA); await x.c.close();
    x = await boot({ clock: true, time: T, init: mk(10, idA) }); await x.run(4000, true); assert.strictEqual((await x.state()).id, idA); await x.c.close();
  });
  await t('09 靜態檢查：客戶端不碰 cookie／IndexedDB／sendBeacon／UA／螢幕／語言／時區／定位；只用兩個 localStorage 鍵', async () => {
    const js = fs.readFileSync(path.join(__dirname, 'stats-client.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const re of [/document\.cookie/, /indexedDB/, /sendBeacon/, /userAgent/, /\bscreen\./, /navigator\.language/, /Intl\./, /getTimezoneOffset/, /geolocation/, /Math\.random/, /location\.(href|pathname|search)/, /document\.referrer/])
      assert.ok(!re.test(js), String(re));
    assert.deepStrictEqual([...new Set((js.match(/'hk-[a-z0-9-]+'/g) || []))].sort(), ["'hk-anon-stat-v1'", "'hk-stats-off-v1'"]);
  });
  await t('10 既有功能煙霧測試（端點故障時）：藏版／韓版載入、搜尋、關於頁、版本紀錄、問題回報頁、無頁面錯誤', async () => {
    for (const edition of ['', 'hk']) {
      const x = await boot({ clock: false, mode: '500', edition }); await x.p.waitForTimeout(4500);
      assert.ok((await x.p.locator('.txt p').count()) > 0, '正文應顯示');
      await x.p.click('#searchButton'); await x.p.fill('#q', '菩薩'); await x.p.keyboard.press('Enter'); await x.p.waitForTimeout(800);
      await openAbout(x.p); assert.ok(await x.p.locator('#optStats').isVisible());
      await x.p.click('#versionHistoryBtn'); await x.p.waitForTimeout(300); assert.ok(await x.p.locator('#versionDoc').isVisible());
      noErr(x); await x.c.close();
    }
  });
  await t('11 sw.js、sw-template.js、build_release.py、data/、manifest 與 v1.91 基底相同；appVer 仍為 v1.91；SW VERSION 仍為 1.91', async () => {
    const d = execSync('git diff e4a365f --stat -- sw.js tools/sw-template.js tools/build_release.py data manifest.webmanifest icon-192.png icon-512.png', { cwd: root }).toString().trim();
    assert.strictEqual(d, '');
    const h = fs.readFileSync(path.join(root, 'index.html'), 'utf8'); assert.ok(h.includes('<b id="appVer">v1.91</b>') && h.includes('<meta name="app-version" content="1.91">'));
    assert.ok(fs.readFileSync(path.join(root, 'sw.js'), 'utf8').includes('const VERSION = "1.91"'));
  });
  await t('12 真實 Service Worker：安裝完成後離線重新載入，App 仍可用，統計不送也不報錯', async () => {
    // 補丁後的 index.html 雜湊與目前 sw.js 不同（未發布前不重產 sw.js），所以在暫存目錄用既有 build_release.py（版本仍為 1.91）重產 sw.js 來測。
    const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'swroot-'));
    for (const f of ['index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png']) fs.copyFileSync(path.join(root, f), path.join(tmp, f));
    fs.symlinkSync(path.join(root, 'data'), path.join(tmp, 'data')); fs.mkdirSync(path.join(tmp, 'tools'));
    for (const f of ['build_release.py', 'sw-template.js']) fs.copyFileSync(path.join(root, 'tools', f), path.join(tmp, 'tools', f));
    execSync('python3 tools/build_release.py 1.91', { cwd: tmp }); serveRoot = tmp;
    const x = await boot({ clock: false, realSW: true, mode: 'ok' });
    await x.p.waitForFunction(async () => { const r = await navigator.serviceWorker.getRegistration(); return !!(r && r.active); }, null, { timeout: 120000 });
    await x.p.waitForTimeout(1500); await x.p.reload(); await x.p.waitForSelector('.txt');
    await x.p.waitForFunction(async () => (await caches.keys()).length > 0 && (await (await caches.open((await caches.keys())[0])).keys()).length >= 30, null, { timeout: 120000 });
    // 真正離線：關掉本機伺服器（Playwright 的 setOffline 連 Service Worker 供應的頁面導覽也會擋掉，不能代表真實離線）
    x.mode = 'abort'; server.close(); server.closeAllConnections(); const n = x.reqs.length;
    try {
      await x.p.reload(); await x.p.waitForSelector('.txt', { timeout: 20000 });
      await x.p.waitForTimeout(5000); assert.ok((await x.p.locator('.txt p').count()) > 0, '離線仍可閱讀');
      await x.p.evaluate(() => { window.__vis = 'visible'; });
      noErr(x); await x.c.close();
    } finally { serveRoot = root; server = http.createServer(handler); await new Promise(r => server.listen(port, '127.0.0.1', r)); }
  });
  if (SHOTS) await t('13 關於頁截圖（電腦、iPad 直／橫、手機直／橫；開／關／DNT；藏版／韓版）', async () => {
    fs.mkdirSync(SHOTS, { recursive: true });
    const cfgs = [['desktop', { width: 1440, height: 900 }, 'mac', false], ['ipad-portrait', { width: 820, height: 1180 }, 'ipad', true], ['ipad-landscape', { width: 1180, height: 820 }, 'ipad', true], ['phone-portrait', { width: 390, height: 844 }, 'iphone', true], ['phone-landscape', { width: 844, height: 390 }, 'iphone', true]];
    for (const [nm, vp, layout, touch] of cfgs) for (const [state, o] of [['on', {}], ['dnt', { dnt: true }]]) {
      const x = await boot({ viewport: vp, layout, touch, clock: false, ...o }); await x.p.waitForTimeout(500);
      try { await openAbout(x.p); } catch (e) { await x.p.tap('#menuBtn'); await x.p.waitForTimeout(300); await x.p.tap('#aboutBtn'); await x.p.waitForTimeout(300); }
      await x.p.locator('.stats-grp').scrollIntoViewIfNeeded(); await x.p.waitForTimeout(300);
      await x.p.screenshot({ path: path.join(SHOTS, `about-${nm}-${state}.png`) }); await x.c.close();
    }
    for (const [nm, edition] of [['zang', ''], ['han','hk']]) {
      const x = await boot({ edition, clock: false }); await x.p.waitForTimeout(500); await openAbout(x.p); await x.p.locator('label.stats').click(); await x.p.waitForTimeout(300);
      await x.p.screenshot({ path: path.join(SHOTS, `about-desktop-off-${nm}.png`) }); await x.c.close();
    }
  });

  await browser.close(); server.close();
  const fails = results.filter(r => r[1] !== 'PASS');
  console.log(`\n${results.length - fails.length}/${results.length} 通過`); process.exit(fails.length ? 1 : 0);
})();
