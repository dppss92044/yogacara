// W001 Analytics v2 收件：/v（用量與功能分析）、/forget、/p（presence）。決定見 D049–D060。
// 只用 request.cf 取粗略城市；不讀取、不儲存、不記錄網路位址、User-Agent 或其他標頭；沒有任何 console 輸出。
import { cityLabel, hmacHex16, taipeiDay, weekKey, monthKey, keyOf } from './common.js';
import { MAX_BODY, parsePayload, parsePresence, parseForget } from './validate.js';

const corsOf = env => ({ 'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN, 'Vary': 'Origin' });
const originOk = (request, env) => request.headers.get('Origin') === env.ALLOWED_ORIGIN;     // 嚴格相等
const MAX_DAY_SEC = 8 * 3600;

// 單條語句寫入一個陣列（json_each），避免逐列一條語句。
const J = v => JSON.stringify(v);
const ROLL_UP = 'ON CONFLICT(src, ptype, pkey, a, b, dev) DO UPDATE SET n = n + excluded.n, sec = COALESCE(sec, 0) + COALESCE(excluded.sec, 0)';

export async function collect(request, env) {
  const cors = corsOf(env);
  if (!originOk(request, env)) return new Response(null, { status: 403 });
  const text = await request.text();
  if (text.length > MAX_BODY) return new Response(null, { status: 413, headers: cors });
  const p = parsePayload(text);
  if (!p) return new Response(null, { status: 400, headers: cors });

  const city = cityLabel(request.cf);
  const h = await hmacHex16(env.PEPPER, p.id);
  const today = taipeiDay(Date.now());
  const row = await env.DB.prepare('SELECT last_day FROM instances WHERE h = ?').bind(h).first();
  const search = p.f['search.submit'] || 0;
  const dict = Object.entries(p.f).reduce((a, [k, n]) => a + (k.startsWith('dict.lookup.') ? n : 0), 0);
  const read = p.readSec || 0;
  const DB = env.DB;

  const incAgg = (type, metric) => DB.prepare(
    'INSERT INTO agg (period_type, period_key, city, metric, n) VALUES (?, ?, ?, ?, 1) ' +
    'ON CONFLICT(period_type, period_key, city, metric) DO UPDATE SET n = n + 1').bind(type, keyOf(type, today), city, metric);
  const stmts = [];
  if (!row) {
    for (const t of ['d', 'w', 'm']) { stmts.push(incAgg(t, 'new')); stmts.push(incAgg(t, 'active')); }
    stmts.push(DB.prepare('INSERT INTO instances (h, first_day, last_day, opens_total, active_sec, city, device, mode, tier, read_sec, search_total, dict_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(h, today, today, p.o, p.s, city, p.d, p.m, p.t, read, search, dict));
  } else {
    const last = row.last_day;
    if (last !== today) stmts.push(incAgg('d', 'active'));
    if (weekKey(last) !== weekKey(today)) stmts.push(incAgg('w', 'active'));
    if (monthKey(last) !== monthKey(today)) stmts.push(incAgg('m', 'active'));
    // city、device、mode、tier 只覆寫為「最新一次」的值，不保留歷史。
    stmts.push(DB.prepare('UPDATE instances SET last_day = ?, opens_total = opens_total + ?, active_sec = active_sec + ?, city = ?, device = COALESCE(?, device), mode = COALESCE(?, mode), tier = COALESCE(?, tier), ' +
      'read_sec = read_sec + ?, search_total = search_total + ?, dict_total = dict_total + ? WHERE h = ?').bind(today, p.o, p.s, city, p.d, p.m, p.t, read, search, dict, h));
  }
  stmts.push(DB.prepare(
    'INSERT INTO instance_days (h, day, opens, active_sec, read_sec) VALUES (?, ?, ?, ?, ?) ' +
    'ON CONFLICT(h, day) DO UPDATE SET opens = opens + excluded.opens, active_sec = MIN(active_sec + excluded.active_sec, ' + MAX_DAY_SEC + '), read_sec = read_sec + excluded.read_sec').bind(h, today, p.o, p.s, read));
  stmts.push(DB.prepare(
    'INSERT INTO agg_vol (day, city, opens, active_sec) VALUES (?, ?, ?, ?) ' +
    'ON CONFLICT(day, city) DO UPDATE SET opens = opens + excluded.opens, active_sec = active_sec + excluded.active_sec').bind(today, city, p.o, p.s));

  const f = Object.keys(p.f).length;
  if (f) stmts.push(DB.prepare('INSERT INTO instance_day_feature (h, day, feature, n) SELECT ?1, ?2, key, value FROM json_each(?3) WHERE true ON CONFLICT(h, day, feature) DO UPDATE SET n = n + excluded.n').bind(h, today, J(p.f)));
  if (p.ss.length) stmts.push(DB.prepare("INSERT INTO instance_day_state (h, day, dim, val, sec) SELECT ?1, ?2, json_extract(value, '$[0]'), json_extract(value, '$[1]'), json_extract(value, '$[2]') FROM json_each(?3) WHERE true ON CONFLICT(h, day, dim, val) DO UPDATE SET sec = sec + excluded.sec").bind(h, today, J(p.ss)));
  if (p.r.length) stmts.push(DB.prepare("INSERT INTO instance_day_reading (h, day, e, src, st, juan, sec, opens) SELECT ?1, ?2, json_extract(value, '$[0]'), json_extract(value, '$[1]'), json_extract(value, '$[2]'), json_extract(value, '$[3]'), json_extract(value, '$[4]'), json_extract(value, '$[5]') FROM json_each(?3) WHERE true ON CONFLICT(h, day, e, src, st, juan) DO UPDATE SET sec = sec + excluded.sec, opens = opens + excluded.opens").bind(h, today, J(p.r)));
  if (p.nd.length) stmts.push(DB.prepare("INSERT INTO instance_day_node (h, day, ns, node, n) SELECT ?1, ?2, json_extract(value, '$[0]'), json_extract(value, '$[1]'), json_extract(value, '$[2]') FROM json_each(?3) WHERE true ON CONFLICT(h, day, ns, node) DO UPDATE SET n = n + excluded.n").bind(h, today, J(p.nd)));

  if (p.terms.length) {
    const m = new Map(); for (const [kind, term] of p.terms) { const k = kind + '\u0000' + term; m.set(k, (m.get(k) || 0) + 1); }
    const rows = [...m].map(([k, n]) => { const [kind, term] = k.split('\u0000'); return [kind, term, n]; });
    // u（當日使用實例）：先看 term_seen 是否已有此實例，再登記 term_seen（7 天，只為算 u）。
    stmts.push(DB.prepare("INSERT INTO term_agg (day, kind, term, n, u) SELECT ?1, json_extract(value, '$[0]'), json_extract(value, '$[1]'), json_extract(value, '$[2]'), " +
      "CASE WHEN EXISTS (SELECT 1 FROM term_seen s WHERE s.day = ?1 AND s.kind = json_extract(value, '$[0]') AND s.term = json_extract(value, '$[1]') AND s.h = ?2) THEN 0 ELSE 1 END " +
      "FROM json_each(?3) WHERE true ON CONFLICT(day, kind, term) DO UPDATE SET n = n + excluded.n, u = u + excluded.u").bind(today, h, J(rows)));
    stmts.push(DB.prepare("INSERT OR IGNORE INTO term_seen (day, kind, term, h) SELECT ?1, json_extract(value, '$[0]'), json_extract(value, '$[1]'), ?2 FROM json_each(?3)").bind(today, h, J(rows)));
  }
  if (p.rp.length) {
    const m = new Map(); for (const [a, b] of p.rp) { const k = a + '\u0000' + b; m.set(k, (m.get(k) || 0) + 1); }
    stmts.push(DB.prepare("INSERT INTO recover_agg (day, from_term, to_term, n) SELECT ?1, json_extract(value, '$[0]'), json_extract(value, '$[1]'), json_extract(value, '$[2]') FROM json_each(?2) WHERE true ON CONFLICT(day, from_term, to_term) DO UPDATE SET n = n + excluded.n")
      .bind(today, J([...m].map(([k, n]) => [...k.split('\u0000'), n]))));
  }
  // 無實例來源：直接累加到 roll
  const roll = [];
  for (const [juan, n] of p.dj) roll.push(['dict_juan', String(juan), p.d, n, null]);
  for (const v of p.hv) roll.push(['history', v, p.d, 1, null]);
  roll.push(['usage_dev', 'all', p.d, p.o, p.s]);
  if (p.m) roll.push(['usage_mode', p.m, p.d, p.o, p.s]);
  stmts.push(DB.prepare("INSERT INTO roll (src, ptype, pkey, a, b, dev, n, sec) SELECT json_extract(value, '$[0]'), 'd', ?1, json_extract(value, '$[1]'), '', json_extract(value, '$[2]'), json_extract(value, '$[3]'), json_extract(value, '$[4]') FROM json_each(?2) WHERE true " + ROLL_UP).bind(today, J(roll)));
  if (p.x.length) {
    const m = new Map(); for (const x of p.x) { const k = J(x); m.set(k, (m.get(k) || 0) + 1); }
    stmts.push(DB.prepare("INSERT INTO export_agg (day, kind, fmt, parts, pack, scope, a, b, label, ok, dev, n) SELECT ?1, json_extract(value, '$[0]'), json_extract(value, '$[1]'), json_extract(value, '$[2]'), json_extract(value, '$[3]'), json_extract(value, '$[4]'), json_extract(value, '$[5]'), json_extract(value, '$[6]'), json_extract(value, '$[7]'), json_extract(value, '$[8]'), ?2, json_extract(value, '$[9]') FROM json_each(?3) WHERE true ON CONFLICT(day, kind, fmt, parts, pack, scope, a, b, label, ok, dev) DO UPDATE SET n = n + excluded.n")
      .bind(today, p.d, J([...m].map(([k, n]) => [...JSON.parse(k), n]))));
  }
  await DB.batch(stmts);
  return new Response(null, { status: 204, headers: cors });
}

// ---- /forget：真實刪除該實例的所有資料（含 presence）；不告知是否存在 ----
export async function forget(request, env) {
  const cors = corsOf(env);
  if (!originOk(request, env)) return new Response(null, { status: 403 });
  const text = await request.text();
  if (text.length > 256) return new Response(null, { status: 413, headers: cors });
  const p = parseForget(text);
  if (!p) return new Response(null, { status: 400, headers: cors });
  const h = await hmacHex16(env.PEPPER, p.id);
  const del = t => env.DB.prepare('DELETE FROM ' + t + ' WHERE h = ?').bind(h);
  await env.DB.batch(['instances', 'instance_days', 'instance_day_feature', 'instance_day_state', 'instance_day_reading', 'instance_day_node', 'term_seen', 'presence'].map(del));
  return new Response(null, { status: 204, headers: cors });
}

// ---- /p：presence 心跳（D060）。只覆寫最後一次心跳，不碰 instances／instance_days／任何 instance_day_*。 ----
export const presenceInterval = env => Math.max(20, Math.min(300, parseInt(env.PRESENCE_INTERVAL || '30', 10) || 30));
export async function presence(request, env) {
  const base = { ...corsOf(env), 'Access-Control-Expose-Headers': 'x-p' };
  if (!originOk(request, env)) return new Response(null, { status: 403 });
  const text = await request.text();
  if (text.length > 256) return new Response(null, { status: 413, headers: base });
  const p = parsePresence(text);
  if (!p) return new Response(null, { status: 400, headers: base });
  const mode = env.PRESENCE === 'off' || env.PRESENCE === 'watch' ? env.PRESENCE : 'on';
  if (mode === 'off') return new Response(null, { status: 204, headers: { ...base, 'x-p': '0' } });
  const h = await hmacHex16(env.PEPPER, p.id);
  const now = Math.floor(Date.now() / 1000);
  const hdr = { ...base, 'x-p': String(presenceInterval(env)) };
  if (p.leave) { await env.DB.prepare('DELETE FROM presence WHERE h = ?').bind(h).run(); return new Response(null, { status: 204, headers: hdr }); }
  if (mode === 'watch') {
    const w = await env.DB.prepare("SELECT v FROM presence_ctl WHERE k = 'watch_until'").first();
    if (!w || w.v < now) return new Response(null, { status: 204, headers: hdr });          // 沒有人在監看：不寫 D1
  }
  await env.DB.prepare(
    'INSERT INTO presence (h, seen, city, device, mode) VALUES (?1, ?2, ?3, ?4, ?5) ' +
    'ON CONFLICT(h) DO UPDATE SET seen = excluded.seen, city = excluded.city, device = excluded.device, mode = excluded.mode WHERE excluded.seen - presence.seen >= 10')
    .bind(h, now, cityLabel(request.cf), p.d, p.m).run();
  return new Response(null, { status: 204, headers: hdr });
}
