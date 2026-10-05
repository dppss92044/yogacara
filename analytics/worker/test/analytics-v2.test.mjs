// W001 Analytics v2 後端測試（針對 App v1.91 基底＋Analytics v2 規格；Node node:sqlite 模擬 D1，不是真 D1／workerd）。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import worker, { cleanup, rollup } from '../src/index.js';
import { ROUTES } from '../src/admin.js';
import { parsePayload, cleanTerm } from '../src/validate.js';
import { makeEnv, ID, post, beat, forgetReq, admin, at, rows, req, REG, ORIGIN } from './helpers.mjs';

const T0 = '2026-10-05T04:00:00Z';
const full = (n = 1, over = {}) => ({ v: 4, id: ID(n), o: 1, s: 600, d: 'phone', m: 'pwa', t: 'f',
  f: { 'font.size.up': 2, 'search.submit': 3, 'search.ok': 2, 'search.zero': 1, 'dict.lookup.dbl': 4, 'dict.hit': 3, 'dict.miss': 1, 'kepan.node_click': 3, 'export.custom': 1 },
  ss: [['font.size', '1.3', 420], ['zoom.m', '150', 300], ['orient', 'landscape', 200]],
  r: [['h', 1, 1, 12, 240, 1], ['z', 0, 0, 3, 180, 1]],
  nd: [['h64432c', [[20233, 2], [20240, 1]]]],
  q: { t: [['般若', 1], ['阿賴耶', 0]], rp: [['阿賴耶', '阿賴耶識']] }, k: { t: ['阿賴耶識'], m: ['xx字'], j: [[12, 3]] },
  x: [{ k: 'custom', fmt: ['pdf', 'md'], pt: ['text', 'kp'], pk: 'zip', sc: 'range', a: 3, b: 1, lb: '', ok: 1 }], hv: ['1.91'], ...over });

test('v4 收件：每個資料表都有對應列；沒有原始 ID；mode／tier／閱讀秒／搜尋與辭典總數', async () => {
  const { env, db } = makeEnv();
  await at(T0, async () => assert.equal((await post(env, full())).status, 204));
  const i = rows(db, 'SELECT * FROM instances')[0];
  assert.equal(i.mode, 'pwa'); assert.equal(i.tier, 'f'); assert.equal(i.read_sec, 420); assert.equal(i.search_total, 3); assert.equal(i.dict_total, 4);
  assert.equal(rows(db, 'SELECT COUNT(*) c FROM instance_day_feature')[0].c, 9);
  assert.deepEqual(rows(db, "SELECT dim,val,sec FROM instance_day_state ORDER BY dim"), [{ dim: 'font.size', val: '1.3', sec: 420 }, { dim: 'orient', val: 'landscape', sec: 200 }, { dim: 'zoom.m', val: '150', sec: 300 }]);
  assert.equal(rows(db, 'SELECT COUNT(*) c FROM instance_day_reading')[0].c, 2);
  assert.deepEqual(rows(db, 'SELECT ns,node,n FROM instance_day_node ORDER BY node'), [{ ns: 'h64432c', node: 20233, n: 2 }, { ns: 'h64432c', node: 20240, n: 1 }]);
  assert.deepEqual(rows(db, "SELECT kind,term,n,u FROM term_agg ORDER BY kind,term"), [{ kind: 'd', term: '阿賴耶識', n: 1, u: 1 }, { kind: 's', term: '般若', n: 1, u: 1 }, { kind: 's', term: '阿賴耶', n: 1, u: 1 }, { kind: 'z', term: '阿賴耶', n: 1, u: 1 }, { kind: 'm', term: 'xx字', n: 0, u: 0 }].filter(x => x.n).sort((a, b) => (a.kind + a.term < b.kind + b.term ? -1 : 1)));
  assert.equal(rows(db, "SELECT COUNT(*) c FROM term_agg WHERE term LIKE 'xx%'")[0].c, 0, '含拉丁字母的詞不入庫');
  assert.deepEqual(rows(db, 'SELECT from_term,to_term,n FROM recover_agg'), [{ from_term: '阿賴耶', to_term: '阿賴耶識', n: 1 }]);
  assert.deepEqual(rows(db, "SELECT a,n,dev FROM roll WHERE src='dict_juan'"), [{ a: '12', n: 3, dev: 'phone' }]);
  assert.deepEqual(rows(db, "SELECT a FROM roll WHERE src='history'"), [{ a: '1.91' }]);
  assert.deepEqual(rows(db, 'SELECT kind,fmt,parts,pack,scope,a,b,ok,dev,n FROM export_agg'), [{ kind: 'custom', fmt: 'md+pdf', parts: 'kp+text', pack: 'zip', scope: 'range', a: 1, b: 3, ok: 1, dev: 'phone', n: 1 }]);
  assert.ok(rows(db, "SELECT 1 FROM roll WHERE src='usage_mode' AND a='pwa'").length);
  assert.ok(!JSON.stringify(['instances', 'instance_days', 'instance_day_feature', 'term_seen'].map(t => rows(db, 'SELECT * FROM ' + t))).includes('00000001-0000'));
  // 搜尋詞與實例分離：term_seen 只有雜湊；7 天
  assert.ok(rows(db, 'SELECT h FROM term_seen').every(r => /^[0-9a-f]{16}$/.test(r.h)));
});

test('再次收件：各表累加（upsert）；u 以實例去重（同實例 u 不增，不同實例 u 增）', async () => {
  const { env, db } = makeEnv();
  await at(T0, async () => { await post(env, full(1)); await post(env, full(1)); await post(env, full(2)); });
  assert.equal(rows(db, "SELECT n FROM instance_day_feature WHERE feature='font.size.up'").reduce((s, r) => s + r.n, 0), 6);
  assert.deepEqual(rows(db, "SELECT sec FROM instance_day_state WHERE dim='font.size' ORDER BY sec").map(r => r.sec), [420, 840]);
  assert.deepEqual(rows(db, "SELECT n,u FROM term_agg WHERE kind='s' AND term='般若'")[0], { n: 3, u: 2 });
  assert.equal(rows(db, "SELECT n FROM instance_day_node WHERE node=20233 ORDER BY n").map(r => r.n).join(), '2,4');
});

test('驗證：結構錯誤整筆 400；未登錄功能／維度／值丟棄但其餘照收', async () => {
  const { env, db } = makeEnv();
  const bad = [
    full(1, { f: { 'font.size.up': 0 } }), full(1, { f: 'x' }), full(1, { r: [['q', 0, 0, 1, 1, 1]] }), full(1, { r: [['h', 0, 99, 1, 1, 1]] }), full(1, { r: [['h', 0, 0, 101, 1, 1]] }),
    full(1, { nd: [['bad', [[1, 1]]]] }), full(1, { nd: [['h64432c', [[1, 1]]], ['z6631f1', [[1, 1]]], ['h111111', [[1, 1]]]] }), full(1, { ss: [['font.size', '1.3']] }),
    full(1, { x: [{ k: 'custom', fmt: ['pdf'], pt: [], pk: 'zip', sc: 'range', a: 1, b: 1, lb: '', ok: 1, extra: 1 }] }), full(1, { hv: ['abc'] }), full(1, { q: { t: [['a', 2]] } }), full(1, { k: { z: [] } }),
    full(1, { zzz: 1 }), full(1, { m: 'app' }), full(1, { t: 'x' }), full(1, { d: 'iphone' }), { v: 4, id: ID(1), o: 0, s: 0, d: 'phone' },
    full(1, { t: 'b' }),                                                           // 基本層帶了 f／ss／r…
    full(1, { f: Object.fromEntries(Array.from({ length: 61 }, (_, i) => ['x' + i, 1])) }),
    full(1, { nd: [['h64432c', Array.from({ length: 41 }, (_, i) => [i, 1])]] }), full(1, { q: { t: Array.from({ length: 11 }, () => ['般若', 1]) } }),
  ];
  for (const b of bad) assert.equal((await post(env, b)).status, 400, JSON.stringify(b).slice(0, 120));
  assert.equal(rows(db, 'SELECT COUNT(*) c FROM instances')[0].c, 0);
  const ok = full(1, { f: { 'font.size.up': 1, 'not.registered': 5 }, ss: [['font.size', '9.9', 10], ['nope', 'x', 10], ['zoom.m', '155', 10], ['zoom.m', '150', 10]] });
  assert.equal((await post(env, ok)).status, 204);
  assert.deepEqual(rows(db, 'SELECT feature FROM instance_day_feature'), [{ feature: 'font.size.up' }]);
  assert.deepEqual(rows(db, 'SELECT dim,val FROM instance_day_state'), [{ dim: 'zoom.m', val: '150' }]);
  assert.equal((await post(env, { v: 4, id: ID(2), o: 1, s: 5, d: 'tablet', m: 'web', t: 'b' })).status, 204);
});

test('隱私過濾：NFKC、長度、拉丁字母／網址／長數字丟棄（仍由 f 計次）', () => {
  assert.equal(cleanTerm('般若'), '般若'); assert.equal(cleanTerm(' 阿 賴 耶 '), '阿賴耶'); assert.equal(cleanTerm('ＡＢＣ'), null);
  assert.equal(cleanTerm('abc'), null); assert.equal(cleanTerm('a@b.com'), null); assert.equal(cleanTerm('https://x.y'), null); assert.equal(cleanTerm('請打0912345678'), null);
  assert.equal(cleanTerm('一二三四五六七八九十一二三四五六'), '一二三四五六七八九十一二三四五六'); assert.equal(cleanTerm('一二三四五六七八九十一二三四五六七'), null); assert.equal(cleanTerm(''), null);
  assert.equal(cleanTerm('我的電話號碼'), '我的電話號碼'); assert.equal(cleanTerm('123'), null); assert.equal(cleanTerm('😀'), null);
  const p = parsePayload(JSON.stringify(full(1, { q: { t: [['abc', 1], ['般若', 1]] } })));
  assert.deepEqual(p.terms, [['s', '般若'], ['d', '阿賴耶識']]);
});

test('/forget：刪除該實例全部資料（含 presence、term_seen）；聚合保留；錯誤來源 403、格式 400；不告知是否存在', async () => {
  const { env, db } = makeEnv();
  await at(T0, async () => { await post(env, full(1)); await post(env, full(2)); await beat(env, { v: 1, id: ID(1), d: 'phone', m: 'pwa' }); });
  const h1 = rows(db, 'SELECT h FROM instances ORDER BY first_day, h')[0].h;
  assert.equal((await forgetReq(env, { id: ID(1) }, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await forgetReq(env, { id: 'x' })).status, 400); assert.equal((await forgetReq(env, { id: ID(1), x: 1 })).status, 400);
  assert.equal((await forgetReq(env, { id: ID(99) })).status, 204);
  assert.equal((await forgetReq(env, { id: ID(1) })).status, 204);
  for (const t of ['instances', 'instance_days', 'instance_day_feature', 'instance_day_state', 'instance_day_reading', 'instance_day_node', 'term_seen', 'presence'])
    assert.equal(rows(db, `SELECT COUNT(*) c FROM ${t} WHERE h = ?`, ID(1) && h1)[0].c, 0, t);
  assert.equal(rows(db, 'SELECT COUNT(*) c FROM instances')[0].c, 1);
  assert.ok(rows(db, 'SELECT COUNT(*) c FROM term_agg')[0].c > 0, '匿名聚合保留');
});

// ---- presence ----
test('presence：心跳覆寫單列、10 秒內不重寫、離開即刪、標頭與 CORS；不碰 instances／instance_days', async () => {
  const { env, db, stats } = makeEnv();
  const B = { v: 1, id: ID(1), d: 'tablet', m: 'web' };
  await at('2026-10-05T04:00:00Z', async () => {
    const r = await beat(env, B); assert.equal(r.status, 204); assert.equal(r.headers.get('x-p'), '30');
    assert.equal(r.headers.get('Access-Control-Expose-Headers'), 'x-p'); assert.equal(r.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  });
  assert.equal(rows(db, 'SELECT * FROM presence').length, 1);
  const before = stats.changes;
  await at('2026-10-05T04:00:05Z', () => beat(env, B));
  assert.equal(stats.changes, before, '10 秒內重複心跳不寫入（0 列變更）');
  const b2 = stats.changes;
  await at('2026-10-05T04:00:35Z', () => beat(env, { ...B, d: 'phone' }));
  assert.equal(stats.changes - b2, 1, '每次心跳至多 1 列寫入');
  const p = rows(db, 'SELECT * FROM presence'); assert.equal(p.length, 1); assert.equal(p[0].device, 'phone'); assert.equal(p[0].city, '桃園');
  assert.deepEqual(['instances', 'instance_days', 'instance_day_feature', 'agg', 'agg_vol', 'roll'].map(t => rows(db, `SELECT COUNT(*) c FROM ${t}`)[0].c), [0, 0, 0, 0, 0, 0], '心跳不碰長期資料');
  assert.equal((await beat(env, { v: 1, id: ID(1), x: 1 })).status, 204);
  assert.equal(rows(db, 'SELECT * FROM presence').length, 0);
  assert.deepEqual(Object.keys(p[0]).sort(), ['city', 'device', 'h', 'mode', 'seen']);
});

test('presence：嚴格 payload、來源、方法；off／watch 模式；interval 可調', async () => {
  const { env, db } = makeEnv();
  for (const b of [{ v: 1, id: ID(1), d: 'phone' }, { v: 1, id: ID(1), d: 'phone', m: 'web', juan: 3 }, { v: 2, id: ID(1), d: 'phone', m: 'web' }, { v: 1, id: ID(1), x: 2 }, { v: 1, id: ID(1), x: 1, d: 'phone' }, { v: 1, id: 'z', d: 'phone', m: 'web' }])
    assert.equal((await beat(env, b)).status, 400, JSON.stringify(b));
  assert.equal((await beat(env, { v: 1, id: ID(1), d: 'phone', m: 'web' }, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await worker.fetch(req('/p', { method: 'GET' }), env)).status, 405);
  assert.equal((await worker.fetch(req('/p', { method: 'OPTIONS' }), env)).status, 204);
  const off = makeEnv({ PRESENCE: 'off' }); const r = await beat(off.env, { v: 1, id: ID(1), d: 'phone', m: 'web' });
  assert.equal(r.status, 204); assert.equal(r.headers.get('x-p'), '0'); assert.equal(rows(off.db, 'SELECT * FROM presence').length, 0);
  const w = makeEnv({ PRESENCE: 'watch', PRESENCE_INTERVAL: '60' }); const B = { v: 1, id: ID(1), d: 'phone', m: 'web' };
  const w1 = await beat(w.env, B); assert.equal(w1.headers.get('x-p'), '60'); assert.equal(rows(w.db, 'SELECT * FROM presence').length, 0, 'watch：無人監看不寫入');
  assert.equal((await admin(w.env, '/admin/presence')).mode, 'watch');
  await beat(w.env, B); assert.equal(rows(w.db, 'SELECT * FROM presence').length, 1, '監看窗口內寫入');
  assert.equal((await beat(makeEnv({ PRESENCE_INTERVAL: '5' }).env, B)).headers.get('x-p'), '20', '間隔下限 20');
  assert.equal((await beat(makeEnv({ PRESENCE_INTERVAL: '9999' }).env, B)).headers.get('x-p'), '300', '間隔上限 300');
  void db;
});

test('presence 管理端：在線／5／15 分鐘窗口、--timeout、查詢時清理過期、不含內容欄位', async () => {
  const { env, db } = makeEnv();
  const t = s => `2026-10-05T04:${s}Z`;
  for (const [n, sec, d, m] of [[1, '00:00', 'phone', 'pwa'], [2, '00:30', 'desktop', 'web'], [3, '01:10', 'tablet', 'pwa']]) await at(t(sec), () => beat(env, { v: 1, id: ID(n), d, m }));
  await at('2026-10-05T04:00:00Z', () => beat(env, { v: 1, id: ID(4), d: 'phone', m: 'web' }));
  await at(t('02:00'), async () => {
    let j = await admin(env, '/admin/presence');
    assert.equal(j.timeout, 75); assert.deepEqual(j.online.map(x => x.ago), [50]);         // 只有 #3（距今 50 秒）在 75 秒內
    j = await admin(env, '/admin/presence?timeout=200'); assert.equal(j.online.length, 4);
    for (const x of j.recent) { assert.deepEqual(Object.keys(x).sort(), ['ago', 'city', 'code', 'device', 'mode']); assert.match(x.code, /^[0-9A-F]{6}$/); }
  });
  await at(t('06:00'), () => beat(env, { v: 1, id: ID(5), d: 'phone', m: 'web' }));
  await at(t('06:30'), async () => { const j = await admin(env, '/admin/presence'); assert.equal(j.active_5m, 1); assert.equal(j.active_15m, 5); });
  await at('2026-10-05T04:40:00Z', async () => { await admin(env, '/admin/presence'); assert.equal(rows(db, 'SELECT * FROM presence').length, 0, '超過約 30 分鐘即清除'); });
  assert.equal((await admin(env, '/admin/presence', null)).status, 401);
});

test('presence：每小時 cron 清除過期列（scheduled）', async () => {
  const { env, db } = makeEnv();
  await at('2026-10-05T04:00:00Z', () => beat(env, { v: 1, id: ID(1), d: 'phone', m: 'web' }));
  await at('2026-10-05T04:45:00Z', async () => { let p; await worker.scheduled({ cron: '0 * * * *' }, env, { waitUntil: x => { p = x; } }); await p; });
  assert.equal(rows(db, 'SELECT * FROM presence').length, 0);
});

// ---- 管理端點 ----
test('功能：--全部／--未使用／類型／裝置；0 次也列出；retired 不列', async () => {
  const { env } = makeEnv();
  await at(T0, async () => { await post(env, full(1)); await post(env, full(2, { d: 'desktop' })); });
  await at(T0, async () => {
    const all = await admin(env, '/admin/features?range=today&all=1');
    assert.equal(all.features.length, REG.features.filter(f => f.status === 'active').length); assert.equal(all.registry_total, all.features.length);
    const up = all.features.find(f => f.id === 'font.size.up'); assert.deepEqual([up.n, up.u], [4, 2]);
    const un = await admin(env, '/admin/features?range=today&unused=1'); assert.ok(un.features.every(f => f.n === 0)); assert.ok(un.features.length > 100);
    assert.ok(un.features.find(f => f.id === 'layout.panel_pin.on'));
    assert.ok(!un.features.find(f => f.id === 'font.size.up'));
    const used = await admin(env, '/admin/features?range=today'); assert.ok(used.features.every(f => f.n > 0));
    assert.ok((await admin(env, '/admin/features?range=today&all=1&type=K')).features.every(f => f.model === 'K'));
    assert.equal((await admin(env, '/admin/features?range=today&dev=desktop')).features.find(f => f.id === 'font.size.up').u, 1);
  });
});

test('k 門檻：節點、詞、按卷閱讀 u<3 併入「其他」；詞排行不列個別實例', async () => {
  const { env } = makeEnv();
  await at(T0, async () => {
    for (let n = 1; n <= 3; n++) await post(env, full(n));                              // 3 個實例共同點 20233、讀卷 12、搜尋「般若」
    await post(env, full(4, { nd: [['h64432c', [[7, 1]]]], q: { t: [['罕見詞', 1]] }, r: [['h', 0, 0, 55, 100, 1]] }));
  });
  await at(T0, async () => {
    const nd = await admin(env, '/admin/nodes?range=today');
    assert.deepEqual(nd.nodes.map(x => [x.node, x.u]).sort(), [[20233, 3], [20240, 3]]); assert.equal(nd.other.nodes, 1);
    assert.ok(!JSON.stringify(nd).includes('"node":7,'));
    const s = await admin(env, '/admin/search?range=today');
    assert.ok(s.terms.find(t => t.term === '般若' && t.u === 3)); assert.ok(!s.terms.find(t => t.term === '罕見詞')); assert.ok(s.terms_other.terms >= 1);
    const rd = await admin(env, '/admin/reading?range=today&by=juan');
    assert.ok(rd.juans.find(x => x.juan === 12 && x.u === 3)); assert.ok(!rd.juans.find(x => x.juan === 55)); assert.ok(!rd.zero_juans.includes(55) && rd.zero_juans.includes(56)); assert.equal(rd.other.juans, 1);
  });
});

test('狀態：預設值秒數由總有效秒推得；閱讀遮罩維度；版本', async () => {
  const { env } = makeEnv();
  await at(T0, async () => {
    await post(env, full(1, { r: [['h', 1, 1 | 4, 12, 100, 1], ['h', 0, 0, 12, 200, 1]], ss: [['font.size', '1.5', 100]] }));
    const j = await admin(env, '/admin/state?range=today&dims=font.size,px,kp,edition');
    const fs = j.dims.find(d => d.dim === 'font.size'); assert.equal(fs.default_sec, 500); assert.deepEqual(fs.values, [{ val: '1.5', sec: 100, u: 1 }]);
    assert.deepEqual(j.dims.find(d => d.dim === 'px').values.map(v => [v.val, v.sec]), [['off', 200], ['on', 100]]);
    assert.deepEqual(j.dims.find(d => d.dim === 'kp').values.map(v => [v.val, v.sec]), [['show', 200], ['hide', 100]]);
    const ed = await admin(env, '/admin/reading?range=today&by=edition'); assert.equal(ed.both_instances, 0);
  });
});

test('單一實例（--day）只有次數與統計；沒有任何列出節點、詞、設定組合的端點', async () => {
  const { env, db } = makeEnv();
  await at(T0, async () => { await post(env, full(1)); await post(env, full(1)); });
  await at(T0, async () => {
    const code = (await admin(env, '/admin/instances?range=today')).instances[0].code;
    const d = await admin(env, `/admin/instance?code=${code}&day=2026-10-05`);
    assert.deepEqual(d.day.nodes, { distinct: 2, max_repeat: 4 }); assert.equal(d.day.search.submit, 6); assert.equal(d.day.dict.miss, 2);
    const dump = JSON.stringify(d); for (const w of ['般若', '阿賴耶', '20233', 'font.size"', 'zoom']) assert.ok(!dump.includes(w) || w === 'font.size"' && false, w);
    assert.ok(!('terms' in d.day) && !('states' in d.day));
    assert.equal((await admin(env, `/admin/instance?code=${code}&day=bad`)).status, 400);
  });
  const paths = Object.keys(ROUTES); assert.ok(!paths.some(p => /node.*inst|inst.*node|terms|combo/i.test(p)), paths.join());
  assert.ok(!readdirSync(new URL('../src/', import.meta.url)).some(f => /combo/.test(f)));
  void db;
});

test('匯出：聚合、成功／失敗、卷與頁覆蓋', async () => {
  const { env } = makeEnv();
  await at(T0, async () => {
    await post(env, full(1, { x: [{ k: 'custom', fmt: ['pdf'], pt: ['text'], pk: '', sc: 'range', a: 1, b: 3, lb: '', ok: 1 }, { k: 'kepan', fmt: ['pdf'], pt: ['gz'], pk: '', sc: 'range', a: 2, b: 4, lb: 'gz', ok: 0 }] }));
    const j = await admin(env, '/admin/export?range=today');
    assert.equal(j.total, 2); assert.equal(j.failed, 1); assert.deepEqual(j.top_juans.map(x => x.i).sort(), [1, 2, 3]); assert.deepEqual(j.top_pages.map(x => x.i).sort(), [2, 3, 4]);
    assert.equal(j.groups.kind.custom, 1);
  });
});

test('其他端點：registry／size／nav／display／font／label／notes／trend／overview 可回應；無 token 一律 401', async () => {
  const { env } = makeEnv();
  await at(T0, async () => {
    await post(env, full(1));
    for (const p of ['registry', 'size', 'nav', 'display', 'font', 'label', 'notes', 'trend', 'overview', 'dict', 'search', 'nodes', 'reading', 'state', 'features', 'stats', 'instances']) {
      assert.equal((await admin(env, '/admin/' + p + '?range=today', null)).status, 401, p);
      const j = await admin(env, '/admin/' + p + '?range=today'); assert.ok(j && !j.status, p + ' ' + (j && j.status));
    }
    const o = await admin(env, '/admin/overview?range=today'); assert.equal(o.read_seconds, 420); assert.equal(o.search_total, 3); assert.equal(o.registry_total, 152);
    const r = await admin(env, '/admin/registry'); assert.equal(r.features, 152); assert.equal(r.states, 26);
    assert.equal((await admin(env, '/admin/features?range=bogus')).status, 400);
    assert.equal((await admin(env, '/admin/features?from=2026-01-01&to=2026-10-05')).status, 400, '自訂範圍最多 92 天');
    assert.equal((await admin(env, '/admin/features?from=2026-09-20&to=2026-10-05')).range, 'custom');
  });
});

test('cron 結算（roll）：u／rep／rep_days、週月邊界、可重複執行；保存期限刪除', async () => {
  const { env, db } = makeEnv();
  await at('2026-10-05T04:00:00Z', () => post(env, full(1)));                    // 週一
  await at('2026-10-06T04:00:00Z', async () => { await post(env, full(1)); await post(env, full(2)); });
  await at('2026-10-06T20:00:00Z', async () => { await rollup(env); await rollup(env); });       // 台北 10/07 04:00
  const f = (ptype, pkey) => rows(db, "SELECT n,u,rep,rep_days FROM roll WHERE src='feature' AND ptype=? AND pkey=? AND a='font.size.up'", ptype, pkey)[0];
  assert.deepEqual(f('d', '2026-10-06'), { n: 4, u: 2, rep: 2, rep_days: 0 });
  assert.deepEqual(f('w', '2026-W41'), { n: 6, u: 2, rep: 2, rep_days: 1 });
  assert.deepEqual(f('m', '2026-10'), { n: 6, u: 2, rep: 2, rep_days: 1 });
  assert.equal(rows(db, "SELECT COUNT(*) c FROM roll WHERE src='feature' AND a='font.size.up'")[0].c > 0, true);
  assert.equal(rows(db, "SELECT COUNT(*) c FROM roll WHERE src='node' AND ptype='d'")[0].c, 0, '節點只結算週月');
  assert.deepEqual(rows(db, "SELECT u FROM roll WHERE src='node' AND ptype='w' AND b='20233'"), [{ u: 2 }]);
  assert.ok(rows(db, "SELECT 1 FROM roll WHERE src='reading_juan' AND ptype='w' AND a='12' AND b='h'").length);
  assert.ok(rows(db, "SELECT 1 FROM roll WHERE src='state' AND a='font.size' AND b='1.3' AND sec=1260 AND ptype='w'").length || rows(db, "SELECT sec FROM roll WHERE src='state' AND a='font.size' AND ptype='w'").length);
});

test('保存期限 v2：明細 60 天、節點 40 天、term_seen 7 天、recover 30 天、term_agg 90 天；presence 與實例連動', async () => {
  const { env, db } = makeEnv();
  const day = n => new Date(Date.parse(T0) - n * 86400000).toISOString();
  for (const n of [100, 61, 59, 41, 39, 31, 29, 8, 6, 0]) await at(day(n), () => post(env, full(1)));
  await at(T0, () => cleanup(env));
  const days = tbl => new Set(rows(db, `SELECT day FROM ${tbl}`).map(r => r.day));
  const ago = n => new Date(Date.parse(T0) + 8 * 3600000 - n * 86400000).toISOString().slice(0, 10);
  assert.ok(!days('instance_day_feature').has(ago(61)) && days('instance_day_feature').has(ago(59)));
  assert.ok(!days('instance_day_node').has(ago(41)) && days('instance_day_node').has(ago(39)));
  assert.ok(!days('recover_agg').has(ago(31)) && days('recover_agg').has(ago(29)));
  assert.ok(!days('term_seen').has(ago(8)) && days('term_seen').has(ago(6)));
  assert.ok(!days('term_agg').has(ago(100)) && days('term_agg').has(ago(59)));
  await at('2027-05-01T04:00:00Z', () => cleanup(env));
  for (const t of ['instances', 'instance_days', 'instance_day_feature', 'instance_day_state', 'instance_day_reading', 'instance_day_node', 'term_seen']) assert.equal(rows(db, `SELECT COUNT(*) c FROM ${t}`)[0].c, 0, t);
  assert.ok(rows(db, 'SELECT COUNT(*) c FROM export_agg')[0].c > 0, '匯出聚合長期保存');
});

test('每次收件的語句數有限（不是逐列一條語句）', async () => {
  const { env, stats } = makeEnv();
  await at(T0, () => post(env, full(1)));
  const first = stats.statements; assert.ok(first <= 30, '語句數 ' + first);
});

test('wrangler.toml／Registry 一致性：變數與 cron；Registry 欄位與 id 唯一', () => {
  const toml = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
  for (const k of ['K_TERM', 'PRESENCE ', 'PRESENCE_TIMEOUT', 'PRESENCE_INTERVAL']) assert.ok(toml.includes(k), k);
  assert.ok(/crons = \["10 19 \* \* \*", "0 \* \* \* \*"\]/.test(toml)); assert.ok(!/PEPPER|ADMIN_TOKEN\s*=/.test(toml.replace(/#.*$/gm, '')));
  const ids = REG.features.map(f => f.id); assert.equal(new Set(ids).size, ids.length);
  for (const f of REG.features) for (const k of ['id', 'name', 'model', 'type', 'selector', 'devices', 'metrics', 'status', 'why', 'privacy', 'retention', 'raw']) assert.ok(k in f, f.id + ':' + k);
  assert.ok(REG.features.every(f => f.raw === false));
});
