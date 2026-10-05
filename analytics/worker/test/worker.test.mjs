// W001 後端本機測試（Node 內建 node:sqlite 模擬 D1）。執行：node --test analytics/worker/test/
import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
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

test('收件：成功 204，且資料庫沒有城市與 ID 的對應、沒有原始 ID', async () => {
  const { env, db } = makeEnv();
  const res = await post(env, { v: 1, id: ID(1), o: 1, s: 30, av: '1.91' });
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  const inst = db.prepare('SELECT * FROM instances').all();
  assert.equal(inst.length, 1);
  assert.deepEqual(Object.keys(inst[0]).sort(), ['active_sec', 'first_day', 'h', 'last_day', 'opens_total']);
  assert.match(inst[0].h, /^[0-9a-f]{16}$/);
  const dump = JSON.stringify([db.prepare('SELECT * FROM instances').all(), db.prepare('SELECT * FROM agg').all(), db.prepare('SELECT * FROM agg_vol').all()]);
  assert.ok(!dump.includes(ID(1).slice(0, 8)), '不得存原始 ID');
  assert.ok(db.prepare("SELECT 1 FROM agg WHERE city='桃園'").get());
});

test('驗證：錯誤來源／格式／大小／方法', async () => {
  const { env, db } = makeEnv();
  assert.equal((await post(env, { v: 1, id: ID(1), o: 1, s: 1 }, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await post(env, { v: 1, id: ID(1), o: 1, s: 1 }, { origin: null })).status, 403);
  for (const bad of [{ v: 2, id: ID(1), o: 1, s: 1 }, { v: 1, id: 'abc', o: 1, s: 1 }, { v: 1, id: ID(1), o: 99, s: 1 }, { v: 1, id: ID(1), o: 1, s: 99999 },
    { v: 1, id: ID(1), o: 0, s: 0 }, { v: 1, id: ID(1), o: 1.5, s: 1 }, { v: 1, id: ID(1), o: 1, s: 1, av: '<script>' }]) {
    assert.equal((await post(env, bad)).status, 400, JSON.stringify(bad));
  }
  assert.equal((await post(env, null, { raw: 'x'.repeat(600) })).status, 413);
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
  for (let i = 1; i <= 6; i++) await post(env, { v: 1, id: ID(i), o: 1, s: 60 });                       // 桃園 6 個
  await post(env, { v: 1, id: ID(1), o: 2, s: 120 });                                                    // 同日再來
  await post(env, { v: 1, id: ID(50), o: 1, s: 600 }, { cf: { country: 'TW', city: 'Taipei' } });       // 台北 1（<5）
  await post(env, { v: 1, id: ID(51), o: 1, s: 0 }, { cf: { country: 'JP', city: 'Tokyo' } });          // 海外只記國家
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
    await post(env, { v: 1, id: ID(1), o: 1, s: 10 });
    Date.now = () => Date.parse('2026-10-06T04:00:00Z');           // 同週隔日
    await post(env, { v: 1, id: ID(1), o: 1, s: 10 });
    let w = await (await get(env, '?range=week')).json();
    assert.equal(w.instances, 1); assert.equal(w.new, 1); assert.equal(w.returning, 0);
    let d = await (await get(env, '?range=today')).json();
    assert.equal(d.instances, 1); assert.equal(d.new, 0); assert.equal(d.returning, 1); assert.equal(d.returning_rate, 1);
    Date.now = () => Date.parse('2026-11-02T04:00:00Z');           // 下個月
    await post(env, { v: 1, id: ID(1), o: 1, s: 10 });
    const m = await (await get(env, '?range=month')).json();
    assert.equal(m.instances, 1); assert.equal(m.new, 0); assert.equal(m.returning, 1);
    assert.equal(db.prepare("SELECT n FROM agg WHERE period_type='m' AND period_key='2026-10' AND metric='active'").get().n, 1);
  } finally { Date.now = realNow; }
});

test('時區邊界：UTC 16:00 起算台北隔日', async () => {
  const { env, db } = makeEnv(); const realNow = Date.now;
  try {
    Date.now = () => Date.parse('2026-10-05T15:59:00Z'); await post(env, { v: 1, id: ID(1), o: 1, s: 1 });
    Date.now = () => Date.parse('2026-10-05T16:01:00Z'); await post(env, { v: 1, id: ID(1), o: 1, s: 1 });
    assert.equal(db.prepare('SELECT last_day FROM instances').get().last_day, '2026-10-06');
  } finally { Date.now = realNow; }
});

test('清理：超過保存期限的實例被刪，聚合保留', async () => {
  const { env, db } = makeEnv(); const realNow = Date.now;
  try {
    Date.now = () => Date.parse('2026-01-01T04:00:00Z'); await post(env, { v: 1, id: ID(1), o: 1, s: 1 });
    Date.now = () => Date.parse('2026-10-05T04:00:00Z'); await post(env, { v: 1, id: ID(2), o: 1, s: 1 });
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

test('靜態檢查：程式不讀取網路位址／轉發標頭，不輸出日誌，不含經緯度欄位', () => {
  const src = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8').replace(/\/\/.*$/gm, '');
  for (const re of [/connecting-ip/i, /x-forwarded/i, /x-real-ip/i, /\bconsole\./, /latitude|longitude/i, /user-agent/i, /request\.headers\.get\((?!'Origin'|'Authorization')/])
    assert.ok(!re.test(src), String(re));
  const sql = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8').replace(/--.*$/gm, '');
  assert.ok(!/\bip\b|city/i.test(sql.split('CREATE TABLE IF NOT EXISTS agg ')[0]), '實例表不得有城市或 IP');
});
