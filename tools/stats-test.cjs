// W001 Analytics v2 客戶端測試（D049–D060）。針對 App v1.91 基底＋W001 補丁（tools/patch-w001-stats.py）新寫。
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
  const vp = o.viewport || { width: 1440, height: 900 };
  const c = await browser.newContext({ viewport: vp, screen: vp, hasTouch: !!o.touch, isMobile: !!o.touch });
  if (o.layout === '') o.layout = null;
  const ctx = { c, mode: o.mode || 'ok', reqs: [], errors: [], geo: 0 };
  await c.addInitScript(({ layout, init, dnt, gpc, edition }) => {
    try { localStorage.setItem('hk-tour', '9'); if (layout) localStorage.setItem('hk-device-layout-v146', layout); if (edition) localStorage.setItem('hk-edition-v154', edition); } catch (e) {}
    if (init) for (const k in init) try { if (!localStorage.getItem('__seeded') ) localStorage.setItem(k, typeof init[k] === 'string' ? init[k] : JSON.stringify(init[k])); } catch (e) {}
    try { localStorage.setItem('__seeded', '1'); } catch (e) {}
    if (dnt) Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true });
    if (gpc) Object.defineProperty(navigator, 'globalPrivacyControl', { value: true, configurable: true });
    window.__xp = []; { const of = window.fetch; window.fetch = function () { return of.apply(this, arguments).then(r => { try { window.__xp.push([r.status, r.headers.get('x-p')]); } catch (e) {} return r; }); }; }
    window.__vis = 'visible';
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => window.__vis });
    window.__geo = 0;
    for (const m of ['getCurrentPosition', 'watchPosition']) if (navigator.geolocation) { const orig = navigator.geolocation[m]; navigator.geolocation[m] = function () { window.__geo++; return orig.apply(this, arguments); }; }
  }, { layout: o.layout === undefined ? 'mac' : o.layout, init: o.init || null, dnt: !!o.dnt, gpc: !!o.gpc, edition: o.edition || '' });
  const p = await c.newPage(); ctx.p = p;
  p.on('pageerror', e => ctx.errors.push(e.message));
  p.on('dialog', d => { ctx.errors.push('dialog:' + d.message()); d.dismiss(); });
  if (!o.realSW) await p.route('**/sw.js', r => r.fulfill({ status: 404, body: '' }));
  await p.route(EP + '/**', async r => {
    const q = r.request(); ctx.reqs.push({ method: q.method(), url: q.url(), headers: q.headers(), body: q.postData() });
    if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });
    if (ctx.mode === 'ok') return r.fulfill({ status: 204, headers: Object.assign({ 'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': 'x-p' }, o.xp !== undefined && /\/p$/.test(q.url()) ? { "x-p": o.xp } : {}) });
    if (ctx.mode === '500') return r.fulfill({ status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    if (ctx.mode === 'abort') return r.abort('failed');
    /* hang：不回應 */
  });
  if (o.clock) await p.clock.install({ time: o.time || Date.now() });
  await p.goto(`${base}/yogacara/`);
  await p.waitForSelector('.txt');
  ctx.ls = k => p.evaluate(k => localStorage.getItem(k), k);
  ctx.state = async () => { const r = await ctx.ls('hk-anon-stat-v1'); return r && JSON.parse(r); };
  ctx.vbodies = () => ctx.reqs.filter(r => r.method === 'POST' && /\/v$/.test(r.url)).map(r => JSON.parse(r.body));
  ctx.pbodies = () => ctx.reqs.filter(r => r.method === 'POST' && /\/p$/.test(r.url)).map(r => JSON.parse(r.body));
  ctx.act = () => p.evaluate(() => document.body.dispatchEvent(new Event('pointerdown', { bubbles: true })));
  ctx.vis = async v => p.evaluate(v => { window.__vis = v; document.dispatchEvent(new Event('visibilitychange')); }, v);
  ctx.run = async (ms, active) => { for (let t = 0; t < ms; t += 10000) { if (active) await ctx.act(); await p.clock.runFor(Math.min(10000, ms - t)); } };
  ctx.bodies = () => ctx.vbodies();
  return ctx;
}
async function t(name, fn) {
  if (ONLY.length && !ONLY.some(k => name.startsWith(k))) return;
  try { await fn(); results.push([name, 'PASS']); console.log('PASS', name); }
  catch (e) { results.push([name, 'FAIL ' + e.message.split('\n')[0]]); console.log('FAIL', name, '\n   ', e.message.split('\n').slice(0, 4).join('\n    ')); }
}

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r)); port = server.address().port; base = `http://127.0.0.1:${port}`;
  browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

  const sum = x => { const a = { o: 0, s: 0, f: {}, ss: {}, r: [], nd: {}, qt: [], rp: [], kt: [], km: [], kj: {}, x: [], hv: [], raw: x.vbodies() };
    for (const b of a.raw) { a.o += b.o || 0; a.s += b.s || 0;
      for (const k in b.f || {}) a.f[k] = (a.f[k] || 0) + b.f[k];
      for (const [d, v, sec] of b.ss || []) a.ss[d + '=' + v] = (a.ss[d + '=' + v] || 0) + sec;
      for (const r of b.r || []) a.r.push(r);
      for (const [ns, rows] of b.nd || []) for (const [i, n] of rows) { (a.nd[ns] = a.nd[ns] || {})[i] = (a.nd[ns][i] || 0) + n; }
      if (b.q) { a.qt.push(...(b.q.t || [])); a.rp.push(...(b.q.rp || [])); } if (b.k) { a.kt.push(...(b.k.t || [])); a.km.push(...(b.k.m || [])); } a.x.push(...(b.x || [])); a.hv.push(...(b.hv || [])); }
    return a; };
  const flushNow = async x => { await x.vis('hidden'); await x.p.clock.runFor(200); await x.vis('visible'); await x.act(); };
  const LAYOUTS = [['mac', { width: 1440, height: 900 }, false], ['ipad', { width: 820, height: 1180 }, true], ['iphone', { width: 390, height: 844 }, true]];

  await t('T01 全新使用者在三種版面：沒有任何事件、狀態列只有 orient（預設值不上傳）', async () => {
    for (const [nm, vp, touch] of LAYOUTS) {
      const x = await boot({ clock: true, viewport: vp, touch, layout: '' }); await x.run(35000, true); await flushNow(x);
      const a = sum(x); noErr(x);
      assert.deepStrictEqual(a.f, {}, nm + ' f=' + JSON.stringify(a.f));
      const ks = Object.keys(a.ss).filter(k => !k.startsWith('orient=')); assert.deepStrictEqual(ks, [], nm + ' ss=' + JSON.stringify(a.ss));
      await x.c.close();
    }
  });
  await t('T02 payload：v=4、text/plain、無 cookie／referer／preflight、無定位、id 為 v4 UUID、/v 先於 /p', async () => {
    const x = await boot({ clock: true }); await x.run(2000, true); assert.strictEqual(x.reqs.length, 0, '3 秒前不送');
    await x.run(3000, true); const q = x.reqs[0]; assert.ok(/\/v$/.test(q.url));
    assert.ok(/text\/plain/.test(q.headers['content-type'])); assert.ok(!q.headers.cookie && !q.headers.referer);
    const b = JSON.parse(q.body); assert.strictEqual(b.v, 4); assert.strictEqual(b.t, 'f'); assert.strictEqual(b.d, 'desktop'); assert.strictEqual(b.m, 'web');
    assert.match(b.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/); assert.strictEqual(b.o, 1);
    for (const k of Object.keys(b)) assert.ok(['v', 'id', 'o', 's', 'd', 'm', 't', 'f', 'ss', 'r', 'nd', 'q', 'k', 'x', 'hv'].includes(k), k);
    assert.deepStrictEqual(await x.c.cookies(), []); assert.ok(!x.reqs.some(r => r.method === 'OPTIONS'));
    assert.strictEqual(await x.p.evaluate(() => window.__geo), 0); noErr(x); await x.c.close();
  });
  await t('T03 登錄內的點擊只算一次；未登錄操作、滑過、按鍵、捲動、輸入文字皆為零內容', async () => {
    const x = await boot({ clock: true }); await x.run(4000, true); const p = x.p;
    await p.mouse.move(300, 300); await p.mouse.move(500, 400); await p.keyboard.press('a'); await p.keyboard.press('ArrowDown'); await p.mouse.wheel(0, 400);
    await p.click('.txt', { position: { x: 5, y: 5 } }).catch(() => {});
    await x.run(5000, true); await flushNow(x); let a = sum(x);
    assert.deepStrictEqual(Object.keys(a.f).filter(k => !/^(early)/.test(k)), [], '未登錄操作不得有事件 ' + JSON.stringify(a.f));
    await p.click('#menuBtn'); await x.run(2000, true); await flushNow(x); a = sum(x);
    assert.strictEqual(a.f['menu.open.click'], 1); noErr(x); await x.c.close();
  });
  await t('T04 isTrusted：程式合成的 click 不計', async () => {
    const x = await boot({ clock: true }); await x.run(4000, true);
    await x.p.evaluate(() => { document.querySelector('#menuBtn').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await x.run(2000, true); await flushNow(x); assert.strictEqual(sum(x).f['menu.open.click'], undefined); await x.c.close();
  });
  await t('T05 搜尋：只送合格詞（CJK、≤16 字）；英文／Email／過長／含數字空白怪字不送；search.* 事件', async () => {
    const x = await boot({ clock: true }); await x.run(4000, true); const p = x.p;
    for (const term of ['空性', 'abc@example.com', '阿賴耶識阿賴耶識阿賴耶識阿賴耶識阿賴耶識']) {
      await p.click('#searchButton'); await p.fill('#searchForm input', term); await p.keyboard.press('Enter'); await x.run(3000, true);
    }
    await flushNow(x); const a = sum(x);
    const terms = a.qt.map(z => z[0]); assert.deepStrictEqual(terms, ['空性'], JSON.stringify(a.qt));
    assert.ok(a.f['search.submit'] >= 3); assert.ok(!JSON.stringify(x.vbodies()).includes('example')); noErr(x); await x.c.close();
  });
  await t('T06 科判節點：藏經版 ns=z6631f1；點科判節點產生 kepan.node_click、nd 資料；韓版 ns=h64432c', async () => {
    for (const [ed, ns] of [['', 'z6631f1'], ['hk', 'h64432c']]) {
      const x = await boot({ clock: true, edition: ed }); await x.run(4000, true);
      await x.p.locator('.rol a[data-n]').first().click({ timeout: 3000 }); await x.run(3000, true); await flushNow(x); const a = sum(x);
      assert.ok(a.f['kepan.node_click'] >= 1, JSON.stringify(a.f)); assert.deepStrictEqual(Object.keys(a.nd), [ns], JSON.stringify(a.nd)); noErr(x); await x.c.close();
    }
  });
  await t('T07 設定狀態時間只記非預設值：放大字體後 zoom 記非預設秒數，未改的不記', async () => {
    const x = await boot({ clock: true }); await x.run(4000, true); const p = x.p;
    await p.click('#menuBtn'); await p.click('#ftBtn'); await p.click('#fsUp'); await x.run(30000, true); await flushNow(x); const a = sum(x);
    const nd = Object.keys(a.ss).filter(k => !k.startsWith('orient=')); assert.ok(nd.some(k => k.startsWith('zoom.')), JSON.stringify(a.ss));
    assert.ok(!Object.keys(a.ss).some(k => k.startsWith('edition=')), '預設值不應上傳'); noErr(x); await x.c.close();
  });
  await t('T08 閱讀歸屬：r 列有版本、卷、秒數；最後一次閱讀互動 60 秒後即停止累計', async () => {
    const x = await boot({ clock: true }); await x.run(4000, true);
    await x.p.mouse.wheel(0, 100); await x.run(30000, true); await flushNow(x); const a1 = sum(x);
    assert.ok(a1.r.length >= 1 && a1.r[0][0] === 'z' && a1.r[0][3] >= 1, JSON.stringify(a1.r)); const s1 = a1.r.reduce((t, r) => t + r[4], 0); assert.ok(s1 >= 25 && s1 <= 40, 's1=' + s1);
    await x.run(200000, false); await flushNow(x); const s2 = sum(x).r.reduce((t, r) => t + r[4], 0); assert.ok(s2 - s1 <= 65, '60 秒無閱讀互動後應停止累計，增加了 ' + (s2 - s1));
    noErr(x); await x.c.close();
  });
  await t('T09 離線補送；端點故障（500／abort／hang）保留、5 分鐘後才重試', async () => {
    let x = await boot({ clock: true }); await x.run(4000, true); await x.c.setOffline(true); const n0 = x.reqs.length;
    await x.p.click('#menuBtn'); await x.run(60000, true); await flushNow(x); assert.strictEqual(x.reqs.length, n0, '離線不送 ' + JSON.stringify(x.reqs.slice(n0).map(r => r.url)));
    await x.c.setOffline(false); await x.run(310000, true); const a = sum(x); assert.strictEqual(a.f['menu.open.click'], 1); await x.c.close();
    for (const mode of ['500', 'abort', 'hang']) {
      x = await boot({ clock: true, mode }); await x.run(4000, true); const n1 = x.vbodies().length; assert.strictEqual(n1, 1);
      await x.p.click('#menuBtn'); await x.run(20000, true); await flushNow(x); assert.strictEqual(x.vbodies().length, n1, mode + ' 5 分鐘內不重試');
      x.mode = 'ok'; await x.run(400000, true); assert.ok(x.vbodies().some(b => b.f && b.f['menu.open.click']), mode + ' 恢復後補送'); noErr(x); await x.c.close();
    }
  });
  for (const [k, o] of [['DNT', { dnt: true }], ['GPC', { gpc: true }]]) await t(`T10 ${k}：不建立編號、不傳送任何請求`, async () => {
    const x = await boot({ clock: true, ...o }); await x.run(40000, true); await x.p.click('#menuBtn');
    assert.strictEqual(await x.ls('hk-anon-stat-v1'), null); assert.strictEqual(x.reqs.length, 0); await x.c.close();
  });
  await t('T11 控制 off：立即停止、刪編號、送 forget、重開仍關；basic 不送內容；full 還原', async () => {
    let x = await boot({ clock: true }); await x.run(4000, true); const id = (await x.state()).id;
    await x.p.click('#menuBtn'); await x.p.evaluate(() => window.dispatchEvent(new CustomEvent('hk-analytics-control', { detail: { mode: 'off' } })));
    await x.p.clock.runFor(500); const fg = x.reqs.filter(r => /\/forget$/.test(r.url)); assert.strictEqual(fg.length, 1); assert.strictEqual(JSON.parse(fg[0].body).id, id);
    assert.strictEqual(await x.ls('hk-anon-stat-v1'), null); const n = x.reqs.length; await x.run(400000, true); assert.strictEqual(x.reqs.length, n, 'off 不再送');
    await x.p.reload(); await x.p.waitForSelector('.txt'); await x.p.clock.runFor(10000); assert.strictEqual(await x.ls('hk-anon-stat-v1'), null);
    assert.strictEqual(x.reqs.length, n); assert.ok(!(await x.ls('hk-analytics-forget-v1')), '墓碑已清');
    await x.p.evaluate(() => window.dispatchEvent(new CustomEvent('hk-analytics-control', { detail: { mode: 'basic' } }))); await x.run(8000, true);
    await x.p.click('#menuBtn'); await x.p.evaluate(() => window.dispatchEvent(new CustomEvent('hk-analytics-control', { detail: { mode: 'basic' } }))); await x.run(30000, true); await flushNow(x);
    const bs = x.vbodies().filter(b => b.t === 'b'); assert.ok(bs.length >= 1); for (const b of bs) for (const k of Object.keys(b)) assert.ok(['v', 'id', 'o', 's', 'd', 'm', 't'].includes(k), 'basic 不得含 ' + k);
    assert.notStrictEqual((await x.state()).id, id, 'off 後重開為新編號'); noErr(x); await x.c.close();
    x = await boot({ clock: true }); await x.run(4000, true); await x.c.setOffline(true);
    await x.p.evaluate(() => window.dispatchEvent(new CustomEvent('hk-analytics-control', { detail: { mode: 'off' } }))); await x.p.clock.runFor(1000);
    assert.ok(JSON.parse(await x.ls('hk-analytics-forget-v1')).id, '離線 off：留下墓碑待補送'); assert.strictEqual(await x.ls('hk-anon-stat-v1'), null);
    await x.c.setOffline(false); await x.run(70000, true); assert.strictEqual(x.reqs.filter(r => /\/forget$/.test(r.url)).length, 1, '恢復連線後補送 forget'); assert.strictEqual(await x.ls('hk-analytics-forget-v1'), null);
    await x.c.close();
  });
  await t('T12 匿名 ID 滿 180 天輪替；未送資料留給新編號', async () => {
    const old = { id: '11111111-1111-4111-8111-111111111111', t: Date.now() - 181 * 864e5, o: 2, s: 30, a: 0 };
    const x = await boot({ clock: true, init: { 'hk-anon-stat-v1': old } }); await x.run(4000, true);
    const b = x.vbodies()[0]; assert.notStrictEqual(b.id, old.id); assert.ok(b.o >= 2); await x.c.close();
  });
  await t('T13 presence：約 30 秒一次；x-p 調整間隔、0 停止；閒置 90 秒不送；hidden 送 leave；背景不送', async () => {
    const x = await boot({ clock: true }); await x.run(4000, true); await x.p.waitForTimeout(400); assert.strictEqual(x.pbodies().length, 1);
    await x.run(62000, true); const n = x.pbodies().length; assert.ok(n >= 3 && n <= 4, 'n=' + n);
    await x.p.clock.runFor(200000); const m = x.pbodies().length; assert.ok(m - n <= 4, '閒置期間最多再送到 idle 邊界 ' + (m - n));
    await x.vis('hidden'); await x.p.clock.runFor(100); const L = x.pbodies().filter(b => b.x === 1); assert.ok(L.length >= 1);
    const k = x.pbodies().length; await x.p.clock.runFor(120000); assert.strictEqual(x.pbodies().length, k, '背景不送'); noErr(x); await x.c.close();
  });
  await t('T14 presence x-p：回 x-p:60 → 間隔約 60 秒；x-p:0 → 停止', async () => {
    let x = await boot({ clock: true, xp: '60' }); await x.run(4000, true); await x.p.waitForTimeout(400); await x.run(130000, true);
    const n = x.pbodies().length; assert.ok(n >= 2 && n <= 4, 'x-p=60 n=' + n + ' ' + JSON.stringify(await x.p.evaluate(() => window.__xp))); await x.c.close();
    x = await boot({ clock: true, xp: '0' }); await x.run(4000, true); await x.p.waitForTimeout(400); await x.run(130000, true); assert.strictEqual(x.pbodies().length, 1, 'x-p=0 只送第一次'); await x.c.close();
  });
  await t('T15 presence 關閉（presence:false）不送 /p，仍送 /v', async () => {
    const x = await boot({ clock: true, init: { 'hk-analytics-mode-v2': { m: 'full', p: false } } }); await x.run(4000, true); await x.run(70000, true); await flushNow(x);
    assert.strictEqual(x.pbodies().length, 0); assert.ok(x.vbodies().length >= 1); await x.c.close();
  });

  await browser.close(); server.close();
  const fails = results.filter(r => r[1] !== 'PASS');
  console.log('\n%d/%d 通過', results.length - fails.length, results.length); process.exit(fails.length ? 1 : 0);
})();
