// W002 科判導航契約 regression / 全量巡檢
// 針對：App v1.91（基底 db77e11）＋ W002 修正。藏版 zang（1,970 節點）、韓版 hk（46,769 節點）。
// 用法：node tools/nav-contract-w002.cjs [--ed zang|hk|both] [--shard i/n] [--step k] [--dbl] [--out file.json]
//   --step k   只抽樣每 k 個可點元素做「單擊」檢查（預設 1 = 全量）
//   --dbl      另做雙擊／（分N）契約巡檢（預設只做 fixtures + 單擊全量；--dbl 時雙擊也依 --step 抽樣）
// 注意：這是 Chromium 模擬，不能取代 Safari／iPhone／iPad 實機（AGENTS.md §9）。
const fs = require('fs'), http = require('http'), path = require('path');
let playwright;
for (const m of ['playwright', '/opt/node-tools/node_modules/playwright', '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright']) { try { playwright = require(m); break; } catch (e) {} }
if (!playwright) { console.error('找不到 playwright'); process.exit(2); }
const { chromium } = playwright;
const root = path.resolve(__dirname, '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : (process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true); };
const EDS = arg('ed', 'both') === 'both' ? ['zang', 'hk'] : [arg('ed')];
const [shI, shN] = String(arg('shard', '0/1')).split('/').map(Number);
const STEP = +arg('step', 1) || 1, DBL = !!arg('dbl', false), OUT = arg('out', null);

function serve() {
  const server = http.createServer((req, res) => {
    let f = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\//, '') || 'index.html');
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(root, 'index.html');
    res.setHeader('Content-Type', f.endsWith('.html') ? 'text/html; charset=utf8' : f.endsWith('.js') ? 'application/javascript' : 'application/octet-stream');
    let s = fs.readFileSync(f);
    if (f.endsWith('index.html')) {
      s = s.toString(); const i = s.indexOf('\n})();\n</script>');
      s = s.slice(0, i) + '\nwindow.__g={S:()=>S,N:()=>N,APPEAR:()=>APPEAR,OWN:()=>OWN,PAGES:()=>PAGES,TXT:()=>TXT,JU:()=>JU,CARRY:()=>CARRY,cn,fillPage,buildPanel,get EDITION(){return EDITION},switchEdition};' + s.slice(i);
    }
    res.end(s);
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(server)));
}

// ---- 以下函式在瀏覽器內執行 ----
function inPage() {
  const g = window.__g, $ = id => document.getElementById(id);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const raf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const state = () => {
    const S = g.S(), N = g.N();
    const textOn = [...document.querySelectorAll('#article .kn.on')].map(e => ({ id: +e.dataset.kn, juan: +(e.closest('.reading-volume') || {}).dataset?.juan }));
    const panelOn = new Set([...document.querySelectorAll('#pzoom .nd.on,#pzoom .head span.on')].map(e => +e.dataset.id));
    const railCur = [...document.querySelectorAll('#rinner a.cur')].map(e => +e.dataset.n);
    const label = ($('readerVolumeTitle') || {}).textContent || '';
    return { cur: S.cur, juan: S.juan, railJuan: S.railJuan, ppage: S.ppage, textOn, panelOn: [...panelOn], railCur, label };
  };
  // 契約 A/B/F：dest = 預期被標示的節點 id；回傳違反的條目
  const checkSync = (dest, st, why) => {
    const N = g.N(), bad = [], j = N[dest][6];
    if (st.cur !== dest) bad.push(why + ' 科判 S.cur=' + st.cur + ' ≠ ' + dest);
    if (st.juan !== j) bad.push(why + ' 卷次 S.juan=' + st.juan + ' ≠ 節點所屬卷 ' + j);
    if (st.label !== '卷第' + g.cn(j)) bad.push(why + ' 卷次標示「' + st.label + '」≠ 卷第' + g.cn(j));
    const mine = st.textOn.filter(x => x.id === dest);
    if (!mine.length) bad.push(why + ' 正文沒有標示節點 ' + dest + '（實際 ' + JSON.stringify(st.textOn) + '）');
    else if (!mine.some(x => x.juan === j)) bad.push(why + ' 正文標示的 ' + dest + ' 不在卷 ' + j + '（實際卷 ' + mine.map(x => x.juan) + '）');
    if (st.textOn.some(x => x.id !== dest)) bad.push(why + ' 正文另有其他標示 ' + JSON.stringify(st.textOn.filter(x => x.id !== dest)));
    if (st.panelOn.some(x => x !== dest)) bad.push(why + ' 科判欄另有其他標示 ' + JSON.stringify(st.panelOn));
    if (!st.panelOn.length) bad.push(why + ' 科判欄沒有標示');
    return bad;
  };
  const visible = el => { if (!el) return false; const r = el.getBoundingClientRect(); return r.height > 0 && r.bottom > 0 && r.top < innerHeight; };
  const targets = (p) => {
    const el = $('pp' + p); if (!el.firstChild) g.fillPage(el, p);
    return [...el.querySelectorAll('.nd.tt[data-id], .head span[data-id]')].filter(e => +e.dataset.id >= 0);
  };
  const click = el => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }));
  const dbl = el => { click(el); click(el); el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, detail: 2 })); };

  window.__t = {
    state, checkSync, wait, raf, visible, targets, click, dbl,
    // 單擊全量：每個可點元素（科判節點 .nd.tt、右側直書路徑 .head span）
    async singleSweep(pages, step, vis) {
      g.buildPanel(); const N = g.N(); const fails = []; let n = 0, seen = 0, hit = new Set(), visN = 0;
      for (const p of pages) {
        const els = targets(p);
        for (let k = 0; k < els.length; k++) {
          seen++; if (seen % step) continue;
          const el = $('pp' + p) && targets(p)[k]; if (!el) continue;
          const id = +el.dataset.id, isHead = !!el.closest('.head'), kind = isHead ? 'head' : el.classList.contains('rt') ? 'rt' : 'tt';
          click(el); n++; hit.add(id);
          const st = state(), why = `[單擊 ${kind} p${p} id${id} ${N[id][5]}${N[id][0]}]`;
          let bad = checkSync(id, st, why);
          if (st.ppage !== p) bad.push(why + ' 單擊後科判欄換頁：' + p + ' → ' + st.ppage);
          if (!bad.length && vis && (n % vis === 0)) {
            await raf(); visN++;
            const h = (document.querySelector('#article .kn.on')); if (!visible(h)) bad.push(why + ' 正文標題不在可見區');
            const pe = document.querySelector('#pp' + p + ' [data-id="' + id + '"]'); if (pe && !visible(pe)) bad.push(why + ' 科判欄標示不在可見區');
          }
          bad.forEach(b => fails.push(b));
        }
      }
      return { clicks: n, distinctNodes: hit.size, visChecked: visN, fails };
    },
    // 雙擊契約：雙擊後科判欄標示的節點＝依既有設計的「上一層」，且正文／卷次同步
    async dblSweep(pages, step) {
      g.buildPanel(); const N = g.N(); const fails = []; let n = 0, seen = 0, tops = 0;
      for (const p of pages) {
        const els = targets(p);
        for (let k = 0; k < els.length; k++) {
          seen++; if (seen % step) continue;
          const el = $('pp' + p) && targets(p)[k]; if (!el) continue;
          const id = +el.dataset.id, isHead = !!el.closest('.head'), isRt = el.classList.contains('rt');
          const why = `[雙擊 ${isHead ? 'head' : isRt ? 'rt' : 'tt'} p${p} id${id} ${N[id][5]}${N[id][0]}]`;
          const par = N[id][4];
          let dest; if (isHead || isRt) dest = id; else { if (par < 0) { tops++; continue; } dest = par; }
          dbl(el); n++;
          const st = state(); const bad = checkSync(dest, st, why);
          bad.forEach(b => fails.push(b));
        }
      }
      return { dblclicks: n, skippedTopLevel: tops, fails };
    },
    // （分N）入口：依 goSub 規則，標示 g（有自己的一頁）或 g 的第一個子科
    async goSweep(pages, step) {
      g.buildPanel(); const N = g.N(), OWN = g.OWN(), AP = g.APPEAR(); const fails = []; let n = 0, seen = 0;
      for (const p of pages) {
        const el0 = $('pp' + p); if (!el0.firstChild) g.fillPage(el0, p);
        const gos = [...el0.querySelectorAll('[data-go]')];
        for (let k = 0; k < gos.length; k++) {
          seen++; if (seen % step) continue;
          const el = $('pp' + p).querySelectorAll('[data-go]')[k]; if (!el) continue;
          const gid = +el.dataset.go; const why = `[（分N） p${p} go${gid} ${N[gid][5]}${N[gid][0]}]`;
          let dest, destPage;
          if (OWN[gid]) { dest = gid; destPage = OWN[gid]; } else { let c = gid + 1; for (; c < N.length; c++) if (N[c][4] === gid) break; if (c >= N.length) { fails.push(why + ' 找不到子科'); continue; } dest = c; destPage = AP[c]; }
          click(el); n++;
          await raf();
          const st = state(); const bad = checkSync(dest, st, why);
          if (st.ppage !== destPage) bad.push(why + ' 科判欄應進入第 ' + destPage + ' 頁，實際 ' + st.ppage);
          bad.forEach(b => fails.push(b));
        }
      }
      return { goClicks: n, fails };
    },
  };
  return true;
}

(async () => {
  const server = await serve();
  const b = await chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const report = { base: 'v1.91 db77e11 + W002', step: STEP, shard: `${shI}/${shN}`, results: [] };
  let exit = 0;
  try {
    for (const ed of EDS) {
      const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }), p = await ctx.newPage(), errors = [];
      p.on('pageerror', e => errors.push(e.message));
      await p.addInitScript(e => { localStorage.setItem('hk-tour', '7'); localStorage.setItem('hk-edition-v154', e); }, ed);
      await p.route('**/sw.js', r => r.fulfill({ status: 404, body: '' }));
      await p.goto(`http://127.0.0.1:${server.address().port}/`); await p.waitForSelector('.txt', { timeout: 120000 });
      await p.waitForTimeout(1500);
      await p.evaluate(inPage);
      const total = await p.evaluate(() => __g.PAGES().length), N = await p.evaluate(() => __g.N().length);
      const all = []; for (let q = 2; q <= total + 1; q++) all.push(q);
      const pages = all.filter((_, i) => i % shN === shI);
      const R = { edition: ed, nodes: N, sheets: total, shardSheets: pages.length };
      // fixtures（只在 zang 與 shard 0 執行）
      if (ed === 'zang' && shI === 0) {
        const fx = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/w002-nav-cases.json'), 'utf8')).cases; R.fixtures = [];
        for (const c of fx) {
          const r = await p.evaluate(async c => {
            const t = __t, g = __g, N = g.N(); const f = [];
            if (N[c.id][0] !== c.title || N[c.id][5] !== c.label || N[c.id][3] !== c.depth) f.push('fixture 與資料不符：' + JSON.stringify(N[c.id].slice(0, 6)));
            document.getElementById('pp' + c.panelPage) || g.buildPanel();
            const el = t.targets(c.panelPage).find(e => +e.dataset.id === c.id && !e.closest('.head')); if (!el) return ['第' + c.panelPage + '頁找不到節點'];
            t.click(el); await t.raf(); await t.wait(300);
            const st = t.state(); f.push(...t.checkSync(c.id, st, '[' + c.name + ']'));
            if (st.ppage !== c.panelPage) f.push('單擊後科判欄換頁 ' + st.ppage);
            if (st.juan !== c.expectJuan) f.push('卷次應為 ' + c.expectJuan + '，實際 ' + st.juan);
            const heads = [...document.querySelectorAll('#volume-' + st.juan + ' .txt .kn[data-kn]')].map(e => +e.dataset.kn), at = heads.indexOf(c.expectHeadingIdInText);
            if (at < 0) f.push('卷 ' + st.juan + ' 正文沒有該標題');
            else if (c.expectNextHeadingIds && !c.expectNextHeadingIds.includes(heads[at + 1])) f.push('正文標題順序不符：下一個應為 ' + c.expectNextHeadingIds + '，實際 ' + heads[at + 1]);
            const on = document.querySelector('#article .kn.on'); if (on && c.mustNotLandOn && c.mustNotLandOn.includes(+on.dataset.kn)) f.push('落在不該落的節點');
            if (!t.visible(on)) f.push('正文標題不在可見區');
            return f;
          }, c);
          R.fixtures.push({ name: c.name, pass: !r.length, fails: r });
        }
      }
      R.single = await p.evaluate(async ([pg, st, v]) => __t.singleSweep(pg, st, v), [pages, STEP, ed === 'zang' ? 7 : 997]);
      if (DBL) {
        R.double = await p.evaluate(async ([pg, st]) => __t.dblSweep(pg, st), [pages, STEP]);
        R.go = await p.evaluate(async ([pg, st]) => __t.goSweep(pg, st), [pages, Math.max(1, Math.floor(STEP / 3))]);
      }
      R.pageErrors = errors;
      const nf = (R.fixtures || []).filter(x => !x.pass).length + R.single.fails.length + (R.double ? R.double.fails.length : 0) + (R.go ? R.go.fails.length : 0) + errors.length;
      R.failCount = nf; if (nf) exit = 1;
      const brief = Object.assign({}, R, { single: Object.assign({}, R.single, { fails: R.single.fails.length, sample: R.single.fails.slice(0, 15) }), double: R.double && Object.assign({}, R.double, { fails: R.double.fails.length, sample: R.double.fails.slice(0, 15) }), go: R.go && Object.assign({}, R.go, { fails: R.go.fails.length, sample: R.go.fails.slice(0, 15) }) });
      console.log(JSON.stringify(brief, null, 1)); report.results.push(R);
      await ctx.close();
    }
  } finally { await b.close(); server.close(); }
  if (OUT) fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
  process.exit(exit);
})().catch(e => { console.error(e); process.exit(2); });
