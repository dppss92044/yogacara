// W001 Analytics v2：Registry 完整性檢查（針對 App v1.91 基底＋W001 補丁）。
// 執行：node tools/check-analytics-registry.cjs   （需 Playwright 與 Chromium；僅 Chromium 模擬，不能取代實機）
// 1. 靜態：id 唯一；規則的 emit 都在登錄內；special 規則的處理函式存在於客戶端；客戶端使用的 id 都在登錄內。
// 2. 動態：在電腦／iPad／手機三種版面，對每條 fixed／pressed／checked／attr／value 規則，
//    找出可看見的畫面（必要時先開選單與設定頁），真的操作一次，確認客戶端送出對應的事件 id；
//    看不到元素的規則列為「該版面不適用」，不算通過也不算失敗。special 規則由 tools/stats-test.cjs 另外驗證。
const fs = require('fs'), http = require('http'), path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const root = path.resolve(__dirname, '..'), EP = 'https://yogacara-stats.dppss92044.workers.dev';
const reg = JSON.parse(fs.readFileSync(path.join(root, 'analytics/registry.json'), 'utf8'));
const js = fs.readFileSync(path.join(root, 'tools/stats-client.js'), 'utf8');
let bad = 0; const fail = m => { bad++; console.log('FAIL', m); };

// ---- 靜態 ----
const ids = reg.features.map(f => f.id), idset = new Set(ids);
if (ids.length !== idset.size) fail('feature id 重複');
const fns = new Set([...js.matchAll(/FN\.(\w+)\s*=/g)].map(m => m[1]).concat([...js.matchAll(/function (\w+)\(/g)].map(m => m[1])));
for (const r of reg.rules) {
  for (const e of [].concat(r.emit || [])) if (!e.includes('{') && !idset.has(e)) fail('規則 emit 不在登錄：' + e);
  if (r.kind === 'special' && r.fn && !fns.has(r.fn)) fail('客戶端缺少處理函式：' + r.fn);
}
for (const f of reg.features) for (const fn of f.fn || []) if (!fns.has(fn)) fail('feature ' + f.id + ' 的 fn 不存在：' + fn);
const clientIds = [...js.matchAll(/'((?:nav|layout|view|phone|kepan|label|edition|content|font|zoom|settings|menu|search|dict|export|report|guide|about|history|app|early)\.[a-z_0-9.]+[a-z0-9])'/g)].map(m => m[1]);
const dimNames = new Set(reg.states.map(s => s.dim));
for (const c of new Set(clientIds)) if (!idset.has(c) && !dimNames.has(c)) fail('客戶端使用的 id 不在登錄：' + c);
for (const s of reg.states) if (!js.includes("'" + s.dim + "'") && !js.includes("s['" + s.dim + "']") && s.via === 's') fail('狀態維度客戶端未讀取：' + s.dim);
console.log('靜態檢查完成：features', ids.length, 'rules', reg.rules.length, 'states', reg.states.length, '，失敗', bad);

// ---- 動態 ----
const server = http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]).replace(/^\/yogacara\//, '').replace(/^\//, ''), f = path.join(root, u || 'index.html');
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(root, 'index.html');
  res.setHeader('Content-Type', f.endsWith('.html') ? 'text/html; charset=utf8' : f.endsWith('.js') ? 'application/javascript' : f.endsWith('.json') || f.endsWith('.webmanifest') ? 'application/json' : 'application/octet-stream'); res.end(fs.readFileSync(f));
});
const LAYOUTS = [['mac', { width: 1440, height: 900 }, false], ['ipad', { width: 820, height: 1180 }, true], ['iphone', { width: 390, height: 844 }, true]];
const PAGES = ['#editionBtn', '#labelBtn', '#contentBtn', '.learning-settings > summary', '#ftBtn', '#dlBtn', '#aboutBtn'];
const CHAINS = [[], ['#menuBtn'], ...PAGES.map(p => ['#menuBtn', p])];
const SKIP_SEL = new Set(['-', 'window', 'document', 'html']);
const testable = reg.rules.filter(r => r.kind !== 'special' && !SKIP_SEL.has(r.sel) && r.emit);
const manual = new Set(['#chartTitleColor']);   // 原生色彩選擇器無法用自動化操作
let browser, base;
async function open(layout, vp, touch, chain) {
  const c = await browser.newContext({ viewport: vp, screen: vp, hasTouch: touch, isMobile: touch });
  await c.addInitScript(() => { try { localStorage.setItem('hk-tour', '9'); } catch (e) {} });
  const p = await c.newPage(); const reqs = [];
  p.on('pageerror', e => reqs.errors = (reqs.errors || []).concat(e.message));
  await p.route('**/sw.js', r => r.fulfill({ status: 404, body: '' }));
  await p.route(EP + '/**', r => { const q = r.request(); if (q.method() === 'POST' && /\/v$/.test(q.url())) reqs.push(JSON.parse(q.postData())); r.fulfill({ status: q.method() === 'OPTIONS' ? 204 : 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } }); });
  await p.clock.install({ time: Date.now() });
  await p.goto(base + '/yogacara/?layout=' + layout); await p.waitForSelector('.txt');
  await p.evaluate(() => document.body.dispatchEvent(new Event('pointerdown', { bubbles: true })));
  await p.clock.runFor(4000);
  for (const s of chain) { const l = p.locator(s).first(); if (!(await l.isVisible())) return { c, p, reqs, ok: false }; await p.waitForTimeout(450); await l.click({ timeout: 3000, force: true }); await p.clock.runFor(300); await p.waitForTimeout(450); }
  return { c, p, reqs, ok: true };
}
const tag = (r) => r.sel + ' [' + r.on + ']';
// ---- 控制項掃描（D050）：每個可操作控制項必須對上某條規則的 selector，或在 excluded 的 css 內 ----
const INTERACTIVE = 'button,input,select,textarea,summary,a[href],[role=button],[role=tab],[role=switch],[role=radio],[data-act],[data-go],[data-page],[data-screen],[data-layout-choice],[tabindex]:not([tabindex="-1"])';
const RULE_SELS = reg.rules.filter(r => r.sel && !SKIP_SEL.has(r.sel)).map(r => r.sel);
const EXCL_SELS = reg.excluded.map(e => e.css).filter(Boolean);
const SCAN_STATES = [
  [], ['#menuBtn'], ...PAGES.map(p => ['#menuBtn', p]),
  ['#menuBtn', '#dlBtn', '#dlGo'], ['#menuBtn', '#versionHistoryBtn'], ['#menuBtn', '#reportBtn'], ['#tourBtn'], ['#menuBtn', '#tourBtn'],
  ['#searchButton'], ['#railOpen'], ['#panelOpen'], ['#menuBtn', '#aboutBtn', '.about-source > summary'], ['#menuBtn', '#aboutBtn', '#versionHistoryBtn'],
];
async function scanOne(nm, vp, touch, chain, extra) {
  const x = await open(nm, vp, touch, chain); if (!x.ok) { await x.c.close(); return null; }
  if (extra) await extra(x);
  const bad = await x.p.evaluate(({ INTERACTIVE, RULE_SELS, EXCL_SELS }) => {
    const out = [], vis = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
    const m = (e, sels) => sels.some(s => { try { return !!e.closest(s); } catch (_) { return false; } });
    for (const e of document.querySelectorAll(INTERACTIVE)) {
      if (!vis(e) || m(e, RULE_SELS) || m(e, EXCL_SELS)) continue;
      if (e.closest('[hidden],[inert]')) continue;
      const a = e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 3).join('.') : '') + [...e.attributes].filter(t => /^data-/.test(t.name)).slice(0, 2).map(t => '[' + t.name + ']').join('') + (e.getAttribute('aria-label') ? '〔' + e.getAttribute('aria-label').slice(0, 14) + '〕' : (e.textContent || '').trim() ? '〔' + e.textContent.trim().slice(0, 10) + '〕' : '');
      out.push(a);
    }
    return out;
  }, { INTERACTIVE, RULE_SELS, EXCL_SELS });
  await x.c.close(); return bad;
}
async function scanAll() {
  const found = {};
  for (const [nm, vp, touch] of LAYOUTS) for (const chain of SCAN_STATES) {
    const r = await scanOne(nm, vp, touch, chain); if (!r) continue;
    for (const a of r) (found[a] = found[a] || new Set()).add(nm);
  }
  // 搜尋結果、辭典預覽（需要內容）
  for (const [nm, vp, touch] of LAYOUTS) {
    const r = await scanOne(nm, vp, touch, ['#searchButton'], async x => { const q = x.p.locator('#q').first(); if (await q.isVisible().catch(() => false)) { await q.fill('空性'); await x.p.keyboard.press('Enter'); await x.p.waitForTimeout(1500); await x.p.clock.runFor(1000); } });
    if (r) for (const a of r) (found[a] = found[a] || new Set()).add(nm);
  }
  return found;
}
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r)); base = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const cover = {}; let pass = 0;
  for (const [nm, vp, touch] of LAYOUTS) {
    // 1) 掃描：每個畫面鏈中哪些規則可看見
    const where = new Map();
    for (const chain of CHAINS) {
      const x = await open(nm, vp, touch, chain); if (!x.ok) { await x.c.close(); continue; }
      for (const r of testable) if (!where.has(r) && !manual.has(r.sel) && await x.p.locator(r.sel).first().evaluate(e => { const b = e.getBoundingClientRect(); if (b.width <= 0 || b.height <= 0) return false; const t = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return !!t && (t === e || e.contains(t) || t.contains(e)); }, null, { timeout: 300 }).catch(() => false)) where.set(r, chain);
      await x.c.close();
    }
    for (const r of testable) {
      const key = tag(r); (cover[key] = cover[key] || {});
      if (manual.has(r.sel)) { cover[key][nm] = '手動'; continue; }
      const chain = where.get(r); if (!chain) { cover[key][nm] = '不適用'; continue; }
      const x = await open(nm, vp, touch, chain); const l = x.p.locator(r.sel).first(); let expect = [], note = '';
      try {
        if (r.kind === 'attr') { const all = x.p.locator(r.sel); const cnt = await all.count(); let tgt = l; for (let i = 0; i < cnt; i++) { const e = all.nth(i); if (await e.isVisible().catch(() => false) && !(await e.getAttribute('aria-current')) && (await e.getAttribute('aria-checked')) !== 'true' && (await e.getAttribute('aria-pressed')) !== 'true') { tgt = e; break; } } const v = await tgt.getAttribute(r.attr); await tgt.click({ timeout: 3000, force: true }); expect = [r.map ? r.map[v] : r.emit.replace('{v}', v)]; }
        else if (r.kind === 'value') { const opts = await l.evaluate(e => [...e.options].map(o => o.value)); const cur = await l.inputValue(); const v = opts.find(o => o !== cur) || opts[0]; await l.focus(); const i0 = opts.indexOf(cur); const dir = opts.indexOf(v) > i0 ? 'ArrowDown' : 'ArrowUp'; for (let k = 0; k < Math.abs(opts.indexOf(v) - i0); k++) await x.p.keyboard.press(dir); expect = [r.emit.replace('{v}', v)]; }
        else if (r.kind === 'checked' || r.kind === 'pressed') { await x.p.waitForTimeout(250); await l.click({ timeout: 3000, force: true }); expect = r.emit; }
        else if (r.on === 'dblclick') { await x.p.waitForTimeout(250); await l.dblclick({ timeout: 3000, force: true }); expect = [].concat(r.emit); }
        else { await x.p.waitForTimeout(250); await l.click({ timeout: 3000, force: true }); expect = [].concat(r.emit); }
        await x.p.clock.runFor(2500);         await x.p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
        await x.p.clock.runFor(300);
        const got = new Set(); for (const b of x.reqs) for (const k in b.f || {}) got.add(k);
        if (r.kind === 'attr' && r.emit && r.emit.includes('{v}') && !expect.some(e => got.has(e))) note = '（此屬性值可能就是目前值，已略過重複點選）';
        if (expect.some(e => got.has(e))) { cover[key][nm] = '通過'; pass++; } else { cover[key][nm] = '失敗'; fail(nm + ' ' + key + ' 預期 ' + JSON.stringify(expect) + ' 實際 ' + JSON.stringify([...got]) + note); }
      } catch (e) { cover[key][nm] = '失敗'; fail(nm + ' ' + key + ' ' + e.message.split('\n')[0]); }
      await x.c.close();
    }
  }
  if (process.env.SCAN !== '0') {
    const found = await scanAll(), keys = Object.keys(found);
    console.log('\n未對上任何規則或排除清單的控制項：' + keys.length);
    for (const k of keys) { console.log('  ' + k.padEnd(70) + [...found[k]].join(',')); }
    if (keys.length) bad++;
  }
  console.log('\n規則 × 版面（通過／不適用／手動／失敗）');
  const cnt = {}; for (const k in cover) for (const l in cover[k]) cnt[cover[k][l]] = (cnt[cover[k][l]] || 0) + 1;
  for (const k in cover) console.log(k.padEnd(60), LAYOUTS.map(([n]) => n + ':' + (cover[k][n] || '-')).join(' '));
  console.log('\n合計', JSON.stringify(cnt), '失敗', bad);
  await browser.close(); server.close(); process.exit(bad ? 1 : 0);
})();
