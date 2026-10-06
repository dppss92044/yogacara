// W001 後端本機測試（Node 內建 node:sqlite 模擬 D1）。執行：node --test analytics/worker/test/
import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import worker, { cityLabel, weekKey, periodRange, cleanup } from '../src/index.js';

const ORIGIN = 'https://dppss92044.github.io';
const schema = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');

function makeEnv() {
  const db = new DatabaseSync(':memory:'); db.exec(schema);
  const stmt = sql => { let args = []; const o = {
    bind: (...a) => { args = a; return o; },
    first: async () => db.prepare(sql).get(...args) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    run: async () => { db.prepare(sql).run(...args); return {}; },
    _run: () => db.prepare(sql).run(...args) }; return o; };
  const DB = { prepare: stmt, batch: async list => { db.exec('BEGIN'); try { list.forEach(s => s._run()); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; } } };
  return { env: { DB, PEPPER: 'test-pepper', ADMIN_TOKEN: 'tok-123', ALLOWED_ORIGIN: ORIGIN, K_MIN: '5', RETENTION_DAYS: '180' }, db };
}
const ID = n => String(n).padStart(8, '0') + '-0000-4000-8000-000000000000';
function post(env, body, { origin = ORIGIN, cf = { country: 'TW', city: 'Taoyuan' }, method = 'POST', raw } = {}) {
  const r = new Request('https://x.workers.dev/v', { method, headers: origin ? { Origin: origin, 'Content-Type': 'text/plain' } : {}, body: method === 'POST' ? (raw ?? JSON.stringify(body)) : undefined });
  Object.defineProperty(r, 'cf', { value: cf });
  return worker.fetch(r, env);
}
const get = (env, q, tok = 'tok-123') => worker.fetch(new Request('https://x.workers.dev/admin/stats' + q, { headers: tok ? { Authorization: 'Bearer ' + tok } : {} }), env);

test('收件：成功 204；資料庫只有短識別雜湊、最新城市與裝置大類，沒有原始 ID', async () => {
  const { env, db } = makeEnv();
  const res = await post(env, { v: 2, id: ID(1), o: 1, s: 30, d: 'phone' });
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  const inst = db.prepare('SELECT * FROM instances').all();
  assert.equal(inst.length, 1);
  assert.deepEqual(Object.keys(inst[0]).sort(), ['active_sec', 'city', 'device', 'dict_total', 'first_day', 'h', 'last_day', 'mode', 'opens_total', 'read_sec', 'search_total', 'tier']);
  assert.match(inst[0].h, /^[0-9a-f]{16}$/); assert.equal(inst[0].city, '桃園'); assert.equal(inst[0].device, 'phone');
  const days = db.prepare('SELECT * FROM instance_days').all();
  assert.equal(days.length, 1); assert.deepEqual(Object.keys(days[0]).sort(), ['active_sec', 'day', 'h', 'opens', 'read_sec'], '每日明細不得含城市或裝置');
  const dump = JSON.stringify([inst, days, db.prepare('SELECT * FROM agg').all(), db.prepare('SELECT * FROM agg_vol').all()]);
  assert.ok(!dump.includes(ID(1).slice(0, 8)), '不得存原始 ID');
  assert.ok(db.prepare("SELECT 1 FROM agg WHERE city='桃園'").get());
});

test('驗證：錯誤來源／格式／大小／方法', async () => {
  const { env, db } = makeEnv();
  assert.equal((await post(env, { v: 2, id: ID(1), o: 1, s: 1, d: 'phone' }, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await post(env, { v: 2, id: ID(1), o: 1, s: 1, d: 'phone' }, { origin: null })).status, 403);
  for (const bad of [{ v: 3, id: ID(1), o: 1, s: 1, d: 'phone' }, { v: 2, id: 'abc', o: 1, s: 1, d: 'phone' }, { v: 2, id: ID(1), o: 99, s: 1, d: 'phone' },
    { v: 2, id: ID(1), o: 1, s: 99999, d: 'phone' }, { v: 2, id: ID(1), o: 0, s: 0, d: 'phone' }, { v: 2, id: ID(1), o: 1.5, s: 1, d: 'phone' },
    { v: 2, id: ID(1), o: 1, s: 1 }, { v: 2, id: ID(1), o: 1, s: 1, d: 'iphone' }, { v: 2, id: ID(1), o: 1, s: 1, d: 'phone', av: '1.91' },
    { v: 1, id: ID(1), o: 1, s: 1, d: 'phone' }, { v: 1, id: ID(1), o: 1, s: 1, av: '1.91' }, { v: 4, id: ID(1), o: 1, s: 1, d: 'phone', av: '1' }, { v: 4, id: ID(1), o: 1, s: 1 }, { v: 2, id: ID(1), o: 1, s: 1, d: 'phone', ua: 'x' }, [1, 2]]) {
    assert.equal((await post(env, bad)).status, 400, JSON.stringify(bad));
  }
  assert.equal((await post(env, null, { raw: 'x'.repeat(9000) })).status, 413);
  assert.equal((await post(env, null, { raw: 'not json' })).status, 400);
  assert.equal((await post(env, null, { method: 'GET' })).status, 405);
  assert.equal(db.prepare('SELECT COUNT(*) c FROM instances').get().c, 0);
  const opt = await worker.fetch(new Request('https://x/v', { method: 'OPTIONS' }), env);
  assert.equal(opt.status, 204);
});

test('管理端點：無／錯 token 為 401；非法 range 為 400', async () => {
  const { env } = makeEnv();
  assert.equal((await get(env, '', null)).status, 401);
  assert.equal((await get(env, '', 'wrong')).status, 401);
  assert.equal((await get(env, '?range=bogus')).status, 400);
  assert.equal((await get(env, '?range=today')).status, 200);
  assert.equal((await worker.fetch(new Request('https://x/admin/stats'), { ...env, ADMIN_TOKEN: undefined })).status, 401);
});

test('聚合：同日重複只計一次實例、量值累加；回訪率；k<5 併「其他」；頻率分桶', async () => {
  const { env } = makeEnv();
  for (let i = 1; i <= 6; i++) await post(env, { v: 2, id: ID(i), o: 1, s: 60, d: 'phone' });                       // 桃園 6 個
  await post(env, { v: 2, id: ID(1), o: 2, s: 120, d: 'phone' });                                                    // 同日再來
  await post(env, { v: 2, id: ID(50), o: 1, s: 600, d: 'desktop' }, { cf: { country: 'TW', city: 'Taipei' } });       // 台北 1（<5）
  await post(env, { v: 2, id: ID(51), o: 1, s: 0, d: 'tablet' }, { cf: { country: 'JP', city: 'Tokyo' } });          // 海外只記國家
  const j = await (await get(env, '?range=today')).json();
  assert.equal(j.instances, 8); assert.equal(j.new, 8); assert.equal(j.returning, 0);
  assert.equal(j.opens, 6 + 2 + 1 + 1); assert.equal(j.active_seconds, 360 + 120 + 600);
  assert.equal(j.avg_active_seconds_per_open, Math.round(1080 / 10));
  assert.deepEqual(j.cities.map(c => c.city), ['桃園', '其他']);
  assert.equal(j.cities[1].active, 2);
  assert.ok(!JSON.stringify(j).includes('JP') && !JSON.stringify(j).includes('台北'), '小地區不得單獨出現');
  assert.deepEqual(j.frequency, { '1': 7, '2-5': 1, '6-20': 0, '20+': 0 });
  assert.equal((await (await get(env, '?range=week')).json()).instances, 8);
  assert.equal((await (await get(env, '?range=month')).json()).instances, 8);
});

test('回訪：跨日回來算 active 不算 new；跨週／跨月邏輯', async () => {
  const { env, db } = makeEnv();
  const realNow = Date.now;
  try {
    Date.now = () => Date.parse('2026-10-05T04:00:00Z');           // 台北 10/05（週一）
    await post(env, { v: 2, id: ID(1), o: 1, s: 10, d: 'phone' });
    Date.now = () => Date.parse('2026-10-06T04:00:00Z');           // 同週隔日
    await post(env, { v: 2, id: ID(1), o: 1, s: 10, d: 'phone' });
    let w = await (await get(env, '?range=week')).json();
    assert.equal(w.instances, 1); assert.equal(w.new, 1); assert.equal(w.returning, 0);
    let d = await (await get(env, '?range=today')).json();
    assert.equal(d.instances, 1); assert.equal(d.new, 0); assert.equal(d.returning, 1); assert.equal(d.returning_rate, 1);
    Date.now = () => Date.parse('2026-11-02T04:00:00Z');           // 下個月
    await post(env, { v: 2, id: ID(1), o: 1, s: 10, d: 'phone' });
    const m = await (await get(env, '?range=month')).json();
    assert.equal(m.instances, 1); assert.equal(m.new, 0); assert.equal(m.returning, 1);
    assert.equal(db.prepare("SELECT n FROM agg WHERE period_type='m' AND period_key='2026-10' AND metric='active'").get().n, 1);
  } finally { Date.now = realNow; }
});

test('時區邊界：UTC 16:00 起算台北隔日', async () => {
  const { env, db } = makeEnv(); const realNow = Date.now;
  try {
    Date.now = () => Date.parse('2026-10-05T15:59:00Z'); await post(env, { v: 2, id: ID(1), o: 1, s: 1, d: 'phone' });
    Date.now = () => Date.parse('2026-10-05T16:01:00Z'); await post(env, { v: 2, id: ID(1), o: 1, s: 1, d: 'phone' });
    assert.equal(db.prepare('SELECT last_day FROM instances').get().last_day, '2026-10-06');
  } finally { Date.now = realNow; }
});

test('清理：超過保存期限的實例被刪，聚合保留', async () => {
  const { env, db } = makeEnv(); const realNow = Date.now;
  try {
    Date.now = () => Date.parse('2026-01-01T04:00:00Z'); await post(env, { v: 2, id: ID(1), o: 1, s: 1, d: 'phone' });
    Date.now = () => Date.parse('2026-10-05T04:00:00Z'); await post(env, { v: 2, id: ID(2), o: 1, s: 1, d: 'phone' });
    await cleanup(env);
    assert.equal(db.prepare('SELECT COUNT(*) c FROM instances').get().c, 1);
    assert.ok(db.prepare('SELECT COUNT(*) c FROM agg').get().c > 0);
    assert.equal(db.prepare("SELECT COUNT(*) c FROM agg WHERE period_key='2026-01-01'").get().c, 2);
  } finally { Date.now = realNow; }
});

test('城市標籤與週／月區間', () => {
  assert.equal(cityLabel({ country: 'TW', city: 'Taoyuan District' }), '桃園');
  assert.equal(cityLabel({ country: 'TW', city: 'Zhongli District' }), '桃園');
  assert.equal(cityLabel({ country: 'TW', city: 'Unknownville', region: 'New Taipei City' }), '新北');
  assert.equal(cityLabel({ country: 'TW', city: 'Unknownville' }), '台灣其他');
  assert.equal(cityLabel({ country: 'JP', city: 'Tokyo' }), 'JP');
  assert.equal(cityLabel({}), '未知'); assert.equal(cityLabel(undefined), '未知');
  assert.equal(weekKey('2026-10-05'), '2026-W41'); assert.equal(weekKey('2026-01-01'), '2026-W01'); assert.equal(weekKey('2027-01-01'), '2026-W53');
  assert.deepEqual(periodRange('w', '2026-10-07'), ['2026-10-05', '2026-10-11']);
  assert.deepEqual(periodRange('m', '2026-02-10'), ['2026-02-01', '2026-02-28']);
});

test('最新城市覆寫、不留城市歷史；v2／v4 混用；每日明細累加', async () => {
  const { env, db } = makeEnv(); const realNow = Date.now;
  try {
    Date.now = () => Date.parse('2026-10-05T04:00:00Z');
    await post(env, { v: 2, id: ID(1), o: 1, s: 60, d: 'tablet' }, { cf: { country: 'TW', city: 'Hsinchu' } });
    Date.now = () => Date.parse('2026-10-06T04:00:00Z');
    await post(env, { v: 2, id: ID(1), o: 2, s: 120, d: 'tablet' }, { cf: { country: 'TW', city: 'Hualien' } });
    await post(env, { v: 4, id: ID(1), o: 1, s: 30, d: 'tablet', m: 'web' }, { cf: { country: 'TW', city: 'Hualien' } });
    const i = db.prepare('SELECT * FROM instances').get();
    assert.equal(i.city, '花蓮'); assert.equal(i.device, 'tablet'); assert.equal(i.opens_total, 4); assert.equal(i.active_sec, 210);
    assert.equal(db.prepare('SELECT COUNT(*) c FROM instances').get().c, 1);
    const days = db.prepare('SELECT day, opens, active_sec FROM instance_days ORDER BY day').all().map(r => ({ ...r }));
    assert.deepEqual(days, [{ day: '2026-10-05', opens: 1, active_sec: 60 }, { day: '2026-10-06', opens: 3, active_sec: 150 }]);
    assert.ok(!JSON.stringify(db.prepare('SELECT * FROM instance_days').all()).includes('新竹'), '不得保留舊城市');
  } finally { Date.now = realNow; }
});

test('管理端點：實例清單只回 6 碼短代號；排序、limit、期間；詳情；ambiguous／404／格式', async () => {
  const { env, db } = makeEnv(); const realNow = Date.now;
  try {
    Date.now = () => Date.parse('2026-10-05T04:00:00Z');           // 週一
    await post(env, { v: 2, id: ID(1), o: 7, s: 4980, d: 'phone' }, { cf: { country: 'TW', city: 'Hsinchu' } });
    await post(env, { v: 2, id: ID(2), o: 2, s: 2760, d: 'desktop' }, { cf: { country: 'TW', city: 'Hualien' } });
    await post(env, { v: 2, id: ID(3), o: 1, s: 720, d: 'tablet' }, { cf: { country: 'TW', city: 'Hsinchu' } });
    Date.now = () => Date.parse('2026-10-07T04:00:00Z');
    await post(env, { v: 2, id: ID(1), o: 11, s: 9780, d: 'phone' }, { cf: { country: 'TW', city: 'Hsinchu' } });
    const g = q => worker.fetch(new Request('https://x.workers.dev/admin/instances' + q, { headers: { Authorization: 'Bearer tok-123' } }), env);
    let j = await (await g('?range=today')).json();
    assert.equal(j.total, 1); assert.equal(j.instances[0].opens, 11); assert.equal(j.instances[0].device, 'phone');
    j = await (await g('?range=week')).json();
    assert.equal(j.total, 3); assert.deepEqual(j.instances.map(x => x.opens), [18, 2, 1]);
    for (const x of j.instances) { assert.match(x.code, /^[0-9A-F]{6}$/); assert.deepEqual(Object.keys(x).sort(), ['active_seconds', 'city', 'code', 'device', 'dict_total', 'first_day', 'last_day', 'mode', 'opens', 'read_seconds', 'search_total'].sort()); }
    const hs = db.prepare('SELECT h FROM instances').all().map(r => r.h);
    assert.ok(!JSON.stringify(j).toLowerCase().includes(hs[0]), '回應不得含完整 hash');
    j = await (await g('?range=week&sort=opens&limit=2')).json(); assert.equal(j.instances.length, 2); assert.equal(j.total, 3);
    assert.equal((await g('?range=bogus')).status, 400);
    assert.equal((await worker.fetch(new Request('https://x.workers.dev/admin/instances'), env)).status, 401);
    const code = j.instances[0].code;
    const d1 = await worker.fetch(new Request('https://x.workers.dev/admin/instance?code=' + code, { headers: { Authorization: 'Bearer tok-123' } }), env);
    assert.equal(d1.status, 200); const d = await d1.json();
    assert.equal(d.code, code); assert.equal(d.city, '新竹'); assert.equal(d.device, 'phone'); assert.equal(d.opens_total, 18); assert.equal(d.active_seconds_total, 14760);
    assert.equal(d.periods.today.opens, 11); assert.equal(d.periods.week.opens, 18); assert.equal(d.first_day, '2026-10-05'); assert.equal(d.last_day, '2026-10-07');
    assert.ok(!JSON.stringify(d).toLowerCase().includes(hs[0]));
    const H = async q => worker.fetch(new Request('https://x.workers.dev/admin/instance?code=' + q, { headers: { Authorization: 'Bearer tok-123' } }), env);
    assert.equal((await H('ZZZZZZ')).status, 400); assert.equal((await H('abc')).status, 400); assert.equal((await H('000000')).status, 404);
    db.prepare("INSERT INTO instances (h, first_day, last_day, opens_total, active_sec, city, device) VALUES (?, '2026-10-01', '2026-10-01', 1, 1, '台北', 'desktop')").run(hs[0].slice(0, 6) + 'ffffffffff');
    assert.equal((await H(code)).status, 409); assert.equal((await H(hs[0].slice(0, 8))).status, 200);
  } finally { Date.now = realNow; }
});

test('清理：每日明細 60 天、實例摘要 180 天；聚合保留', async () => {
  const { env, db } = makeEnv(); const realNow = Date.now;
  try {
    Date.now = () => Date.parse('2026-06-01T04:00:00Z'); await post(env, { v: 2, id: ID(1), o: 1, s: 1, d: 'phone' });
    Date.now = () => Date.parse('2026-08-10T04:00:00Z'); await post(env, { v: 2, id: ID(1), o: 1, s: 1, d: 'phone' });
    Date.now = () => Date.parse('2026-10-05T04:00:00Z'); await post(env, { v: 2, id: ID(2), o: 1, s: 1, d: 'phone' });
    await cleanup(env);
    assert.deepEqual(db.prepare('SELECT day FROM instance_days ORDER BY day').all().map(r => r.day), ['2026-08-10', '2026-10-05'], '60 天前的每日明細應刪除（8/10 距 10/5 為 56 天，保留）');
    assert.equal(db.prepare('SELECT COUNT(*) c FROM instances').get().c, 2);
    Date.now = () => Date.parse('2027-05-01T04:00:00Z'); await cleanup(env);
    assert.equal(db.prepare('SELECT COUNT(*) c FROM instances').get().c, 0, '最後出現超過 180 天的實例應刪除');
    assert.equal(db.prepare('SELECT COUNT(*) c FROM instance_days').get().c, 0);
    assert.ok(db.prepare('SELECT COUNT(*) c FROM agg').get().c > 0);
  } finally { Date.now = realNow; }
});

test('靜態檢查：程式不讀取網路位址／轉發標頭／User-Agent，不輸出日誌，不含經緯度；每日明細表沒有城市或裝置欄位', () => {
  const src = readdirSync(new URL('../src/', import.meta.url)).map(f => readFileSync(new URL('../src/' + f, import.meta.url), 'utf8')).join('\n').replace(/\/\/.*$/gm, '');
  for (const re of [/connecting-ip/i, /x-forwarded/i, /x-real-ip/i, /\bconsole\./, /latitude|longitude/i, /user-agent/i, /request\.headers\.get\((?!'Origin'|'Authorization')/, /\bsetItem|\blocalStorage/])
    assert.ok(!re.test(src), String(re));
  const sql = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8').replace(/--.*$/gm, '');
  const days = sql.slice(sql.indexOf('CREATE TABLE IF NOT EXISTS instance_days'), sql.indexOf('CREATE INDEX IF NOT EXISTS instance_days_day'));
  assert.ok(!/city|device|\bip\b/i.test(days), '每日明細不得有城市、裝置或 IP');
  assert.ok(!/\bip\b|user_?agent|lat|lon/i.test(sql), '資料表不得有 IP、UA、經緯度欄位');
});

test('遷移檔：舊資料庫套用 0002、0003 後與 schema.sql 欄位一致（所有資料表）', () => {
  const old = new DatabaseSync(':memory:');
  old.exec("CREATE TABLE instances (h TEXT PRIMARY KEY, first_day TEXT NOT NULL, last_day TEXT NOT NULL, opens_total INTEGER NOT NULL DEFAULT 0, active_sec INTEGER NOT NULL DEFAULT 0)");
  old.exec(readFileSync(new URL('../migrations/0002-instance-level.sql', import.meta.url), 'utf8'));
  const fresh = new DatabaseSync(':memory:'); fresh.exec(schema);
  const cols = (d, t) => d.prepare(`PRAGMA table_info(${t})`).all().map(c => c.name).sort();
  old.exec("CREATE TABLE agg (period_type TEXT NOT NULL, period_key TEXT NOT NULL, city TEXT NOT NULL, metric TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (period_type, period_key, city, metric)); CREATE TABLE agg_vol (day TEXT NOT NULL, city TEXT NOT NULL, opens INTEGER NOT NULL DEFAULT 0, active_sec INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, city))");
  old.exec(readFileSync(new URL('../migrations/0003-analytics-v2.sql', import.meta.url), 'utf8'));
  const tables = d => d.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(r => r.name);
  for (const t of tables(fresh)) assert.deepEqual(cols(old, t), cols(fresh, t), t);
});
