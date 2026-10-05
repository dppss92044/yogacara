// W001 Analytics v2：資料量模擬（本機 node:sqlite 模擬 D1；不連任何網路、不碰線上資料庫）。
// 執行：node tools/sim-volume.mjs [DAU ...]   預設 50 200 700 1000
//   本機 node:sqlite 模式（預設）：寫入列數＝SQLite changes（不含索引列）。
//   HTTP 模式：HTTP=http://localhost:8798 node tools/sim-volume.mjs 200
//     先啟動 analytics/worker/test/meter 的本機 wrangler dev（見 analytics/README.md），由包裝層回報 D1 的 meta.rows_written（含索引列）。
// 回報：每種請求平均／最大寫入列數（SQLite changes，不含索引列）、整天寫入總列數、資料庫大小、cron 結算寫入。
// 注意：這是依假設行為產生的合成流量（每人 1.3 次開啟、3 次 /v、每 30 秒心跳、平均使用 15 分鐘），不是實測流量；
//       「寫入列數」為 SQLite changes，D1 另計索引列，數字用於估量級與核對「心跳每次 ≤1 列」，不等於 D1 帳單。
import worker from '../analytics/worker/src/index.js';
import { makeEnv, req, ID, REG } from '../analytics/worker/test/helpers.mjs';

const DAUS = process.argv.slice(2).map(Number).filter(Boolean); if (!DAUS.length) DAUS.push(50, 200, 700, 1000);
let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32; const pick = a => a[Math.floor(rnd() * a.length)];
const ACTIVE = REG.features.filter(f => f.status === 'active' && f.model !== 'S').map(f => f.id).filter(i => !/\{/.test(i));
const TERMS = ['空性', '阿賴耶識', '般若', '真如', '菩薩', '三昧', '無我', '解脫', '涅槃', '緣起', '種子', '末那識', '有情', '法界', '正見', '禪定', '慈悲', '因果', '業', '煩惱'];
const DIMS = REG.states.filter(s => s.via === 's' && s.dim !== 'orient');
const HTTP = process.env.HTTP || ''; const realNow = Date.now; let vt = Date.parse('2026-10-06T02:00:00Z') / 1000; Date.now = () => vt * 1000;

function vBody(i, first) {
  const f = {}; for (let k = 0, n = 8 + Math.floor(rnd() * 14); k < n; k++) f[pick(ACTIVE)] = 1 + Math.floor(rnd() * 4);
  const ss = [['orient', rnd() < .6 ? 'landscape' : 'portrait', 300 + Math.floor(rnd() * 600)]];
  for (let k = 0; k < 3; k++) { const d = pick(DIMS); ss.push([d.dim, pick(d.values), 60 + Math.floor(rnd() * 600)]); }
  const r = [['z', 0, 0, 1 + Math.floor(rnd() * 100), 60 + Math.floor(rnd() * 500), 1]]; if (rnd() < .5) r.push(['z', 0, 0, 1 + Math.floor(rnd() * 100), 30 + Math.floor(rnd() * 200), 1]);
  const nodes = []; for (let k = 0, n = 3 + Math.floor(rnd() * 8); k < n; k++) nodes.push([Math.floor(rnd() * 2400), 1 + Math.floor(rnd() * 3)]);
  const b = { v: 4, id: ID(i), o: first ? 1 : 0, s: 120 + Math.floor(rnd() * 700), d: ['phone', 'tablet', 'desktop'][i % 3], m: i % 4 ? 'web' : 'pwa', t: 'f', f, ss, r, nd: [['z6631f1', nodes]], q: { t: [[pick(TERMS), 1], [pick(TERMS), rnd() < .8 ? 1 : 0]] } };
  if (rnd() < .5) b.k = { t: [pick(TERMS)], j: [[1 + Math.floor(rnd() * 100), 1]] };
  return b;
}
const stat = () => ({ n: 0, sum: 0, max: 0 }); const add = (s, v) => { s.n++; s.sum += v; if (v > s.max) s.max = v; };
const cfs = ['Taoyuan', 'Taipei', 'Tainan', 'Kaohsiung', 'Taichung', 'Hsinchu'];
async function send(env, stats, path, body, cf, t) {
  if (HTTP) { const r = await fetch(HTTP + path, { method: 'POST', body: JSON.stringify(body), headers: { Origin: 'https://dppss92044.github.io', 'Content-Type': 'text/plain', 'x-sim-now': String(t) } }); return { status: r.status, rows: Number(r.headers.get('x-rows-written')) }; }
  const c0 = stats.changes; const r = await worker.fetch(req(path, { body, cf }), env); return { status: r.status, rows: stats.changes - c0 };
}
async function day(env, stats, dau, dayIdx, dst) {
  const base = Date.parse('2026-10-0' + (6 + dayIdx) + 'T01:00:00Z') / 1000;
  const inst = []; for (let i = 0; i < dau; i++) inst.push({ i: dayIdx === 0 || rnd() < .75 ? i : dau + dayIdx * 10000 + i, start: base + Math.floor(rnd() * 14 * 3600), minutes: 4 + Math.floor(rnd() * 22) });
  const evs = [];
  for (const x of inst) {
    const cf = { country: 'TW', city: cfs[x.i % cfs.length] };
    const flushes = [0, ...Array.from({ length: 2 }, () => Math.floor(rnd() * x.minutes))].sort((a, b) => a - b);
    flushes.forEach((m, k) => evs.push([x.start + m * 60 + 3, 'v', x, cf, k === 0]));
    for (let t = 3; t < x.minutes * 60; t += 30) evs.push([x.start + t, 'p', x, cf]);
    evs.push([x.start + x.minutes * 60, 'x', x, cf]);
  }
  evs.sort((a, b) => a[0] - b[0]);
  for (const [t, kind, x, cf, first] of evs) {
    vt = t;
    const bodies = { v: () => vBody(x.i, first), p: () => ({ v: 1, id: ID(x.i), d: ['phone', 'tablet', 'desktop'][x.i % 3], m: 'web' }), x: () => ({ v: 1, id: ID(x.i), x: 1 }) };
    const path = kind === 'v' ? '/v' : '/p', body = bodies[kind]();
    const w = await send(env, stats, path, body, cf, t); if (w.status !== 204) throw new Error(kind + ' ' + w.status);
    add(dst[kind], w.rows);
  }
}
const size = db => { const r = db.prepare('PRAGMA page_count').get(), s = db.prepare('PRAGMA page_size').get(); return Number(r.page_count) * Number(s.page_size); };
const fmt = s => s.n ? `n=${s.n} 平均=${(s.sum / s.n).toFixed(2)} 最大=${s.max} 合計=${s.sum}` : 'n=0';
console.log('合成流量（非實測）。寫入列數＝SQLite changes（不含索引列）。\n');
for (const dau of DAUS) {
  const { env, db, stats } = makeEnv(); const t0 = realNow();
  if (HTTP) { await fetch(HTTP + '/__meter/reset', { method: 'POST' }); }
  for (let d = 0; d < (Number(process.env.DAYS) || 3); d++) {
    const dst = { v: stat(), p: stat(), x: stat() }, c0 = stats.changes;
    await day(env, stats, dau, d, dst);
    const cr0 = stats.changes; vt = Date.parse('2026-10-0' + (6 + d) + 'T19:10:00Z') / 1000; let cron, total;
    if (HTTP) { const m0 = (await (await fetch(HTTP + '/__meter')).json()).written; await fetch(HTTP + '/__cron?c=' + encodeURIComponent('10 19 * * *') + '&now=' + vt); const m1 = (await (await fetch(HTTP + '/__meter')).json()).written; cron = m1 - m0; total = dst.v.sum + dst.p.sum + dst.x.sum; }
    else { let pr; await worker.scheduled({ cron: '10 19 * * *' }, env, { waitUntil: x => { pr = x; } }); await pr; cron = stats.changes - cr0; total = stats.changes - c0 - cron; }
    console.log(`DAU ${dau} 第${d + 1}天  /v ${fmt(dst.v)}｜/p ${fmt(dst.p)}｜leave ${fmt(dst.x)}`);
    console.log(`      當日請求寫入合計 ${total}（心跳 ${dst.p.sum + dst.x.sum}）｜cron 結算寫入 ${cron}｜DB ${HTTP ? '（HTTP 模式不量）' : (size(db) / 1024).toFixed(0) + ' KB'}`);
    if (dst.p.max > 1) console.log('  !! 單次心跳寫入超過 1 列：', dst.p.max);
  }
  console.log(`      耗時 ${((realNow() - t0) / 1000).toFixed(1)} 秒\n`);
}
Date.now = realNow;
