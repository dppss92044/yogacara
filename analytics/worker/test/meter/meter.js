// 本機量測用 Worker：包住正式 src/index.js，累計 D1 回傳的 meta.rows_written，並可用 x-sim-now（秒）覆寫 Date.now（只為模擬時間）。
// 只在 wrangler dev --local 使用。路由：GET /__meter（讀取）、POST /__meter/reset、POST /__init（建立 schema）。
import worker from '../../src/index.js';
import SCHEMA from '../../schema.sql';
const M = { written: 0, read: 0, statements: 0, by: {} };
const tag = sql => { const m = /^\s*(INSERT(?: OR \w+)? INTO|UPDATE|DELETE FROM|SELECT|REPLACE INTO)\s+(?:\S+\s+)?(\w+)/i.exec(sql); return m ? (m[1].split(' ')[0] + ' ' + m[2]).toUpperCase() : 'OTHER'; };
function count(sql, meta) { const t = tag(sql); const b = M.by[t] || (M.by[t] = { n: 0, written: 0 }); b.n++; const w = (meta && meta.rows_written) || 0; b.written += w; M.written += w; M.read += (meta && meta.rows_read) || 0; M.statements++; }
function wrap(db) {
  const prep = sql => { const s = db.prepare(sql); const w = { _sql: sql, _s: s, bind: (...a) => { w._s = w._s.bind(...a); return w; }, first: (...a) => w._s.first(...a), all: async () => { const r = await w._s.all(); count(sql, r.meta); return r; }, run: async () => { const r = await w._s.run(); count(sql, r.meta); return r; }, raw: (...a) => w._s.raw(...a) }; return w; };
  return { prepare: prep, batch: async list => { const res = await db.batch(list.map(x => x._s)); res.forEach((r, i) => count(list[i]._sql, r.meta)); return res; }, exec: s => db.exec(s) };
}
export default {
  async fetch(req, env, ctx) {
    const u = new URL(req.url);
    if (u.pathname === '/__meter') return Response.json(M);
    if (u.pathname === '/__meter/reset') { M.written = M.read = M.statements = 0; M.by = {}; return new Response('ok'); }
    if (u.pathname === '/__init') { for (const s of SCHEMA.split(/;\s*\n/).map(x => x.replace(/^(\s*--[^\n]*\n)+/g, '').trim()).filter(Boolean)) await env.DB.prepare(s).run(); return new Response('ok'); }
    if (u.pathname === '/__cron') { const s = u.searchParams.get('now'); const real = Date.now; if (s) Date.now = () => Number(s) * 1000; try { await this.scheduled({ cron: u.searchParams.get('c') || '10 19 * * *' }, env, ctx); } finally { Date.now = real; } return new Response('ok'); }
    const sim = req.headers.get('x-sim-now'); const real = Date.now; if (sim) Date.now = () => Number(sim) * 1000;
    const w0 = M.written;
    try { const r = await worker.fetch(req, { ...env, DB: wrap(env.DB) }, ctx); const h = new Headers(r.headers); h.set('x-rows-written', String(M.written - w0)); return new Response(r.body, { status: r.status, headers: h }); } finally { Date.now = real; }
  },
  async scheduled(event, env, ctx) {
    let p; await worker.scheduled(event, { ...env, DB: wrap(env.DB) }, { waitUntil: x => { p = x; } }); await p;
  },
};
