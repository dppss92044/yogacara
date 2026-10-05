// W001 Analytics v2 測試共用：以 Node 內建 node:sqlite 模擬 D1（含 batch 結果與 changes 計數）。
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from '../src/index.js';

export const ORIGIN = 'https://dppss92044.github.io';
export const schema = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
export const REG = JSON.parse(readFileSync(new URL('../../registry.json', import.meta.url), 'utf8'));

export function makeEnv(extra = {}) {
  const db = new DatabaseSync(':memory:'); db.exec(schema);
  const stats = { changes: 0, statements: 0 };
  const isSel = sql => /^\s*SELECT/i.test(sql);
  const stmt = sql => { let args = []; const o = {
    bind: (...a) => { args = a; return o; },
    first: async () => db.prepare(sql).get(...args) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    run: async () => { const r = db.prepare(sql).run(...args); stats.changes += Number(r.changes); stats.statements++; return { meta: { rows_written: Number(r.changes) } }; },
    _run: () => { stats.statements++; if (isSel(sql)) return { results: db.prepare(sql).all(...args) }; const r = db.prepare(sql).run(...args); stats.changes += Number(r.changes); return { results: [], meta: { rows_written: Number(r.changes) } }; } }; return o; };
  const DB = { prepare: stmt, batch: async list => { db.exec('BEGIN'); try { const out = list.map(s => s._run()); db.exec('COMMIT'); return out; } catch (e) { db.exec('ROLLBACK'); throw e; } } };
  return { env: { DB, PEPPER: 'test-pepper', ADMIN_TOKEN: 'tok-123', ALLOWED_ORIGIN: ORIGIN, K_MIN: '5', K_TERM: '3', RETENTION_DAYS: '180', ...extra }, db, stats };
}
export const ID = n => String(n).padStart(8, '0') + '-0000-4000-8000-000000000000';
export function req(path, { body, raw, method = 'POST', origin = ORIGIN, cf = { country: 'TW', city: 'Taoyuan' }, headers = {} } = {}) {
  const r = new Request('https://x.workers.dev' + path, { method, headers: { ...(origin ? { Origin: origin } : {}), 'Content-Type': 'text/plain', ...headers }, body: method === 'POST' ? (raw ?? JSON.stringify(body)) : undefined });
  Object.defineProperty(r, 'cf', { value: cf });
  return r;
}
export const post = (env, body, o = {}) => worker.fetch(req('/v', { body, ...o }), env);
export const beat = (env, body, o = {}) => worker.fetch(req('/p', { body, ...o }), env);
export const forgetReq = (env, body, o = {}) => worker.fetch(req('/forget', { body, ...o }), env);
export const admin = async (env, path, tok = 'tok-123') => { const r = await worker.fetch(new Request('https://x.workers.dev' + path, { headers: tok ? { Authorization: 'Bearer ' + tok } : {} }), env); return r.status === 200 ? r.json() : r; };
export const at = async (iso, fn) => { const real = Date.now; Date.now = () => Date.parse(iso); try { return await fn(); } finally { Date.now = real; } };
export const rows = (db, sql, ...a) => db.prepare(sql).all(...a).map(r => ({ ...r }));
