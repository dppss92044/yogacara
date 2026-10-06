// W001 Analytics v2 管理端點（Bearer；只回聚合與排行）。沒有任何能列出單一實例的節點、詞或設定組合的端點（D058）。
import { REGISTRY, FEATURES, json, shortCode, taipeiDay, periodRange, keyOf, addDays } from './common.js';
import { presenceInterval } from './ingest.js';

const num = (v, d, lo, hi) => Math.max(lo, Math.min(hi, parseInt(v, 10) || d));
const DEV = ['phone', 'tablet', 'desktop'];

export function rangeOf(url) {
  const p = url.searchParams, today = taipeiDay(Date.now());
  const from = p.get('from'), to = p.get('to'), re = /^\d{4}-\d{2}-\d{2}$/;
  if (from && re.test(from)) {
    const end = to && re.test(to) ? to : today;
    if (end < from || (new Date(end) - new Date(from)) / 86400000 > 92) return null;
    return { range: 'custom', type: 'x', key: from + '~' + end, start: from, end };
  }
  const range = p.get('range') || 'today';
  const type = { today: 'd', week: 'w', month: 'm' }[range];
  if (!type) return null;
  const date = p.get('date');
  const day = date && re.test(date) ? date : today;
  const [start, end] = periodRange(type, day);
  return { range, type, key: keyOf(type, day), start, end };
}
const withQ = (url, o) => { const u = new URL(url.href); for (const k of Object.keys(o)) u.searchParams.set(k, o[k]); return u; };
const bad = () => json({ error: 'range 須為 today、week、month，或 from（最多 92 天）' }, 400);
const devOf = url => { const d = url.searchParams.get('dev'); return DEV.includes(d) ? d : null; };
const K = env => ({ term: num(env.K_TERM, 3, 1, 50), city: num(env.K_MIN, 5, 1, 50) });
const periodOut = r => ({ type: r.type, key: r.key, start: r.start, end: r.end });
// 裝置篩選：以 instances.device 關聯（只在查詢時關聯，不寫進明細表）
const jn = (alias, dev) => dev ? ` JOIN instances i ON i.h = ${alias}.h AND i.device = '${dev}'` : '';

async function activeCount(env, r, dev) {
  const x = await env.DB.prepare(`SELECT COUNT(DISTINCT d.h) AS n, COALESCE(SUM(d.active_sec),0) AS sec, COALESCE(SUM(d.read_sec),0) AS rsec FROM instance_days d${jn('d', dev)} WHERE d.day BETWEEN ? AND ?`).bind(r.start, r.end).first();
  return { instances: x.n, active_sec: x.sec, read_sec: x.rsec };
}


// ---- 既有聚合統計（agg／agg_vol；含城市與頻率；與 v1 CLI 相容）----
async function statsCore(r, env) {
  const k = K(env).city, DB = env.DB;
  const cityRows = (await DB.prepare('SELECT city, metric, n FROM agg WHERE period_type = ? AND period_key = ?').bind(r.type, r.key).all()).results || [];
  const byCity = {};
  for (const x of cityRows) (byCity[x.city] ||= { active: 0, new: 0 })[x.metric] = x.n;
  let active = 0, fresh = 0; const cities = []; const other = { city: '其他', active: 0, new: 0 };
  for (const [city, v] of Object.entries(byCity)) {
    active += v.active; fresh += v.new;
    if (v.active < k) { other.active += v.active; other.new += v.new; } else cities.push({ city, active: v.active, new: v.new });
  }
  cities.sort((a, b) => b.active - a.active);
  if (other.active) cities.push(other);
  const vol = await DB.prepare('SELECT COALESCE(SUM(opens),0) AS opens, COALESCE(SUM(active_sec),0) AS sec FROM agg_vol WHERE day BETWEEN ? AND ?').bind(r.start, r.end).first();
  const f = await DB.prepare('SELECT COALESCE(SUM(opens_total = 1),0) AS b1, COALESCE(SUM(opens_total BETWEEN 2 AND 5),0) AS b2, COALESCE(SUM(opens_total BETWEEN 6 AND 20),0) AS b3, COALESCE(SUM(opens_total > 20),0) AS b4 FROM instances WHERE last_day BETWEEN ? AND ?').bind(r.start, r.end).first();
  const returning = Math.max(0, active - fresh);
  return { range: r.range, period: periodOut(r), k_min: k, instances: active, new: fresh, returning, returning_rate: active ? returning / active : 0,
    opens: vol.opens, active_seconds: vol.sec, avg_active_seconds_per_open: vol.opens ? Math.round(vol.sec / vol.opens) : 0,
    frequency: { '1': f.b1, '2-5': f.b2, '6-20': f.b3, '20+': f.b4 }, cities };
}
async function stats(url, env) { const r = rangeOf(url); if (!r || r.type === 'x') return json({ error: 'range 須為 today、week 或 month' }, 400); return json(await statsCore(r, env)); }

// ---- 總覽（stats 的延伸）----
async function overview(url, env) {
  const r = rangeOf(url); if (!r) return bad();
  const k = K(env), dev = devOf(url), DB = env.DB;
  const a = await activeCount(env, r, dev);
  const vol = await DB.prepare('SELECT COALESCE(SUM(opens),0) AS opens FROM instance_days d' + jn('d', dev) + ' WHERE d.day BETWEEN ? AND ?').bind(r.start, r.end).first();
  const fresh = await DB.prepare('SELECT COUNT(*) AS n FROM instances i WHERE first_day BETWEEN ? AND ?' + (dev ? " AND device = '" + dev + "'" : '')).bind(r.start, r.end).first();
  const devs = (await DB.prepare('SELECT COALESCE(i.device, \'?\') AS d, COUNT(DISTINCT x.h) AS n FROM instance_days x JOIN instances i ON i.h = x.h WHERE x.day BETWEEN ? AND ? GROUP BY i.device').bind(r.start, r.end).all()).results || [];
  const modes = (await DB.prepare('SELECT COALESCE(i.mode, \'?\') AS m, COUNT(DISTINCT x.h) AS n FROM instance_days x JOIN instances i ON i.h = x.h WHERE x.day BETWEEN ? AND ?' + (dev ? " AND i.device = '" + dev + "'" : '') + ' GROUP BY i.mode').bind(r.start, r.end).all()).results || [];
  const top = (await DB.prepare(`SELECT rd.juan AS juan, COUNT(DISTINCT rd.h) AS u, SUM(rd.sec) AS sec FROM instance_day_reading rd${jn('rd', dev)} WHERE rd.day BETWEEN ? AND ? GROUP BY rd.juan ORDER BY sec DESC LIMIT 5`).bind(r.start, r.end).all()).results || [];
  const feat = await DB.prepare(`SELECT COALESCE(SUM(f.n),0) AS n, COUNT(DISTINCT f.feature) AS kinds FROM instance_day_feature f${jn('f', dev)} WHERE f.day BETWEEN ? AND ?`).bind(r.start, r.end).first();
  const sd = await DB.prepare(`SELECT COALESCE(SUM(CASE WHEN f.feature = 'search.submit' THEN f.n END),0) AS s, COALESCE(SUM(CASE WHEN f.feature LIKE 'dict.lookup.%' THEN f.n END),0) AS d FROM instance_day_feature f${jn('f', dev)} WHERE f.day BETWEEN ? AND ?`).bind(r.start, r.end).first();
  const returning = Math.max(0, a.instances - fresh.n);
  const core = !dev && r.type !== 'x' ? await statsCore(r, env) : null;
  return json({ range: r.range, period: periodOut(r), k_min: k.city, dev, instances: a.instances, new: fresh.n, returning, returning_rate: a.instances ? returning / a.instances : 0,
    opens: vol.opens, active_seconds: a.active_sec, read_seconds: a.read_sec, ...(core ? { instances: core.instances, new: core.new, returning: core.returning, returning_rate: core.returning_rate, opens: core.opens, active_seconds: core.active_seconds, avg_active_seconds_per_open: core.avg_active_seconds_per_open, frequency: core.frequency, cities: core.cities } : {}), devices: devs.filter(x => x.n >= k.city || true), modes,
    top_juan: top, features_total: feat.n, features_used: feat.kinds, search_total: sd.s, dict_total: sd.d, registry_total: FEATURES.size });
}

// ---- 功能 ----
async function features(url, env) {
  const r = rangeOf(url); if (!r) return bad();
  const p = url.searchParams, dev = devOf(url), DB = env.DB;
  const all = p.get('all') === '1', unused = p.get('unused') === '1', type = p.get('type'), prefix = p.get('prefix');
  const rows = (await DB.prepare(
    `SELECT feature, SUM(tot) AS n, COUNT(*) AS u, SUM(tot >= 2) AS rep, SUM(days >= 2) AS rep_days FROM (` +
    `SELECT f.feature AS feature, f.h AS h, SUM(f.n) AS tot, COUNT(DISTINCT f.day) AS days FROM instance_day_feature f${jn('f', dev)} WHERE f.day BETWEEN ? AND ? GROUP BY f.feature, f.h) GROUP BY feature`).bind(r.start, r.end).all()).results || [];
  const used = new Map(rows.map(x => [x.feature, x]));
  const a = await activeCount(env, r, dev);
  const out = [];
  for (const [id, f] of FEATURES) {
    if (type && f.model !== type) continue;
    if (prefix && !id.startsWith(prefix)) continue;
    const x = used.get(id);
    if (!x && !all && !unused) continue;
    if (x && unused) continue;
    out.push({ id, name: f.name, model: f.model, devices: f.devices, verify: f.verify || null, n: x ? x.n : 0, u: x ? x.u : 0, rep: x ? x.rep : 0, rep_days: x ? x.rep_days : 0 });
  }
  out.sort((x, y) => y.u - x.u || y.n - x.n || (x.id < y.id ? -1 : 1));
  const total = [...FEATURES.values()].length;
  return json({ range: r.range, period: periodOut(r), dev, instances: a.instances, registry_total: total, used_total: rows.filter(x => FEATURES.has(x.feature)).length, features: out });
}

// ---- 狀態維度 ----
const READ_DIMS = {   // 由閱讀聯合列推得（遮罩位元 1 披尋記開、2 常柏開、4 科判隱藏、8 辭典關）
  edition: { expr: 'e', def: 'z' }, px: { bit: 1, on: 'on', def: 'off' }, cb: { bit: 2, on: 'on', def: 'off' }, kp: { bit: 4, on: 'hide', def: 'show' }, dict: { bit: 8, on: 'off', def: 'on' },
};
async function state(url, env) {
  const r = rangeOf(url); if (!r) return bad();
  const dev = devOf(url), DB = env.DB;
  const want = (url.searchParams.get('dims') || url.searchParams.get('dim') || '').split(',').filter(Boolean);
  const dims = REGISTRY.states.filter(s => !want.length || want.includes(s.dim));
  const a = await activeCount(env, r, dev);
  const rows = (await DB.prepare(`SELECT s.dim AS dim, s.val AS val, SUM(s.sec) AS sec, COUNT(DISTINCT s.h) AS u FROM instance_day_state s${jn('s', dev)} WHERE s.day BETWEEN ? AND ? GROUP BY s.dim, s.val`).bind(r.start, r.end).all()).results || [];
  const rd = (await DB.prepare(`SELECT rd.e AS e, rd.st AS st, rd.h AS h, SUM(rd.sec) AS sec FROM instance_day_reading rd${jn('rd', dev)} WHERE rd.day BETWEEN ? AND ? GROUP BY rd.e, rd.st, rd.h`).bind(r.start, r.end).all()).results || [];
  const out = [];
  for (const d of dims) {
    if (d.via === 'r') {
      const spec = READ_DIMS[d.dim], by = new Map(), people = new Map(); let total = 0;
      for (const x of rd) {
        total += x.sec;
        const v = spec.expr ? x.e : ((x.st & spec.bit) ? spec.on : spec.def);
        by.set(v, (by.get(v) || 0) + x.sec); (people.get(v) || people.set(v, new Set()).get(v)).add(x.h);
      }
      out.push({ dim: d.dim, name: d.name, basis: 'reading', default: d.default, total_sec: total, values: d.values.map(v => ({ val: v, sec: by.get(v) || 0, u: people.has(v) ? people.get(v).size : 0 })) });
      continue;
    }
    const mine = rows.filter(x => x.dim === d.dim); let non = 0;
    for (const x of mine) non += x.sec;
    const vals = mine.map(x => ({ val: x.val, sec: x.sec, u: x.u })).sort((p, q) => q.sec - p.sec);
    out.push({ dim: d.dim, name: d.name, basis: 'active', default: d.default, default_sec: d.default === null ? null : Math.max(0, a.active_sec - non), total_sec: a.active_sec, values: vals });
  }
  return json({ range: r.range, period: periodOut(r), dev, instances: a.instances, active_seconds: a.active_sec, dims: out });
}

// ---- 閱讀 ----
async function reading(url, env) {
  const r = rangeOf(url); if (!r) return bad();
  const dev = devOf(url), by = url.searchParams.get('by') || 'juan', sort = url.searchParams.get('sort') || 'sec', DB = env.DB, k = K(env);
  const a = await activeCount(env, r, dev);
  if (by === 'juan') {
    const rows = (await DB.prepare(`SELECT juan, SUM(sec) AS sec, SUM(opens) AS opens, COUNT(*) AS u, SUM(days >= 2) AS rep FROM (SELECT rd.juan AS juan, rd.h AS h, SUM(rd.sec) AS sec, SUM(rd.opens) AS opens, COUNT(DISTINCT rd.day) AS days FROM instance_day_reading rd${jn('rd', dev)} WHERE rd.day BETWEEN ? AND ? GROUP BY rd.juan, rd.h) GROUP BY juan`).bind(r.start, r.end).all()).results || [];
    const shown = rows.filter(x => x.u >= k.term), hidden = rows.filter(x => x.u < k.term);
    const seen = new Set(rows.map(x => x.juan)), zero = []; for (let j = 1; j <= 100; j++) if (!seen.has(j)) zero.push(j);
    const key = { users: 'u', opens: 'opens', sec: 'sec', avg: 'avg' }[sort] || 'sec';
    const list = shown.map(x => ({ juan: x.juan, u: x.u, opens: x.opens, sec: x.sec, avg: x.u ? Math.round(x.sec / x.u) : 0, rep: x.rep })).sort((p, q) => q[key] - p[key] || p.juan - q.juan);
    return json({ range: r.range, period: periodOut(r), dev, by, instances: a.instances, k: k.term, juans: list, other: { juans: hidden.length, u: hidden.reduce((s, x) => s + x.u, 0), sec: hidden.reduce((s, x) => s + x.sec, 0) }, zero_juans: zero });
  }
  if (by === 'edition') {
    const rows = (await DB.prepare(`SELECT rd.e AS e, rd.src AS src, SUM(rd.sec) AS sec, SUM(rd.opens) AS opens, COUNT(DISTINCT rd.h) AS u FROM instance_day_reading rd${jn('rd', dev)} WHERE rd.day BETWEEN ? AND ? GROUP BY rd.e, rd.src`).bind(r.start, r.end).all()).results || [];
    const both = await DB.prepare(`SELECT COUNT(*) AS n FROM (SELECT rd.h FROM instance_day_reading rd${jn('rd', dev)} WHERE rd.day BETWEEN ? AND ? GROUP BY rd.h HAVING COUNT(DISTINCT rd.e) = 2)`).bind(r.start, r.end).first();
    const ei = (await DB.prepare(`SELECT rd.e AS e, COUNT(DISTINCT rd.h) AS u FROM instance_day_reading rd${jn('rd', dev)} WHERE rd.day BETWEEN ? AND ? GROUP BY rd.e`).bind(r.start, r.end).all()).results || [];
    return json({ range: r.range, period: periodOut(r), dev, by, instances: a.instances, editions: ei, rows, both_instances: both.n });
  }
  if (by === 'state') {
    const rows = (await DB.prepare(`SELECT rd.e AS e, rd.st AS st, SUM(rd.sec) AS sec, COUNT(DISTINCT rd.h) AS u FROM instance_day_reading rd${jn('rd', dev)} WHERE rd.day BETWEEN ? AND ? GROUP BY rd.e, rd.st`).bind(r.start, r.end).all()).results || [];
    return json({ range: r.range, period: periodOut(r), dev, by, instances: a.instances, rows });
  }
  return json({ error: 'by 須為 juan、edition、state' }, 400);
}

// ---- 科判節點排行（只有排行；u<K_TERM 併入其他；沒有實例）----
async function nodes(url, env) {
  const r = rangeOf(url); if (!r) return bad();
  const dev = devOf(url), sort = url.searchParams.get('sort') || 'users', limit = num(url.searchParams.get('limit'), 20, 1, 100), k = K(env);
  const key = { users: 'u', count: 'n', rep: 'rep' }[sort] || 'u';
  const rows = (await env.DB.prepare(`SELECT ns, node, SUM(tot) AS n, COUNT(*) AS u, SUM(tot >= 2) AS rep, SUM(days >= 2) AS rep_days FROM (SELECT x.ns AS ns, x.node AS node, x.h AS h, SUM(x.n) AS tot, COUNT(DISTINCT x.day) AS days FROM instance_day_node x${jn('x', dev)} WHERE x.day BETWEEN ? AND ? GROUP BY x.ns, x.node, x.h) GROUP BY ns, node`).bind(r.start, r.end).all()).results || [];
  const shown = rows.filter(x => x.u >= k.term).sort((p, q) => q[key] - p[key] || q.n - p.n).slice(0, limit), hidden = rows.filter(x => x.u < k.term);
  return json({ range: r.range, period: periodOut(r), dev, k: k.term, nodes: shown, other: { nodes: hidden.length, n: hidden.reduce((s, x) => s + x.n, 0) } });
}

async function termRank(env, r, kind, k, limit) {
  const rows = (await env.DB.prepare('SELECT term, SUM(n) AS n, SUM(u) AS u FROM term_agg WHERE kind = ? AND day BETWEEN ? AND ? GROUP BY term').bind(kind, r.start, r.end).all()).results || [];
  const shown = rows.filter(x => x.u >= k).sort((a, b) => b.u - a.u || b.n - a.n).slice(0, limit), hidden = rows.filter(x => x.u < k);
  return { terms: shown, other: { terms: hidden.length, n: hidden.reduce((s, x) => s + x.n, 0) } };
}
async function search(url, env) {
  const r = rangeOf(url); if (!r) return bad();
  const k = K(env), limit = num(url.searchParams.get('limit'), 15, 1, 100);
  const f = await features(withQ(url, { prefix: 'search.', all: '1' }), env).then(x => x.json());
  const all = await termRank(env, r, 's', k.term, limit), zero = await termRank(env, r, 'z', k.term, limit);
  const rp = ((await env.DB.prepare('SELECT from_term, to_term, SUM(n) AS n FROM recover_agg WHERE day BETWEEN ? AND ? GROUP BY from_term, to_term HAVING SUM(n) >= ? ORDER BY n DESC LIMIT ?').bind(r.start, r.end, k.term, limit).all()).results) || [];
  return json({ range: r.range, period: periodOut(r), k: k.term, features: f.features, terms: all.terms, terms_other: all.other, zero_terms: zero.terms, zero_other: zero.other, recovered: rp, note: 'u 為各日使用實例之和（人日），不是期間內不重複人數' });
}
async function dict(url, env) {
  const r = rangeOf(url); if (!r) return bad();
  const k = K(env), limit = num(url.searchParams.get('limit'), 15, 1, 100);
  const f = await features(withQ(url, { prefix: 'dict.', all: '1' }), env).then(x => x.json());
  const hit = await termRank(env, r, 'd', k.term, limit), miss = await termRank(env, r, 'm', k.term, limit);
  const jr = (await env.DB.prepare("SELECT CAST(a AS INTEGER) AS juan, SUM(n) AS n FROM roll WHERE src = 'dict_juan' AND ptype = 'd' AND pkey BETWEEN ? AND ? GROUP BY a ORDER BY n DESC LIMIT 10").bind(r.start, r.end).all()).results || [];
  return json({ range: r.range, period: periodOut(r), k: k.term, features: f.features, hit: hit.terms, hit_other: hit.other, miss: miss.terms, miss_other: miss.other, juans: jr, note: 'u 為各日使用實例之和（人日）；未命中含查詢失敗' });
}

async function exports(url, env) {
  const r = rangeOf(url); if (!r) return bad();
  const f = await features(withQ(url, { prefix: 'export.', all: '1' }), env).then(x => x.json());
  const rows = (await env.DB.prepare('SELECT kind, fmt, parts, pack, scope, a, b, label, ok, SUM(n) AS n FROM export_agg WHERE day BETWEEN ? AND ? GROUP BY kind, fmt, parts, pack, scope, a, b, label, ok').bind(r.start, r.end).all()).results || [];
  const juan = new Array(101).fill(0), page = new Array(201).fill(0), grp = { kind: {}, fmt: {}, pack: {}, parts: {}, label: {} };
  for (const x of rows) {
    const add = (g, k, n) => { grp[g][k] = (grp[g][k] || 0) + n; };
    add('kind', x.kind, x.n); add('pack', x.pack || '-', x.n); add('parts', x.parts || '-', x.n); if (x.label) add('label', x.label, x.n);
    for (const f1 of (x.fmt ? x.fmt.split('+') : ['-'])) add('fmt', f1, x.n);
    const lo = x.scope === 'all' ? 1 : x.a, hi = x.scope === 'all' ? (x.kind === 'kepan' ? 96 : 100) : x.b;
    const tgt = x.kind === 'kepan' ? page : juan; for (let i = lo; i <= Math.min(hi, tgt.length - 1); i++) tgt[i] += x.n;
  }
  const top = arr => arr.map((n, i) => [i, n]).filter(x => x[1] > 0 && x[0] > 0).sort((p, q) => q[1] - p[1]).slice(0, 10).map(([i, n]) => ({ i, n }));
  return json({ range: r.range, period: periodOut(r), features: f.features, total: rows.reduce((s, x) => s + x.n, 0), failed: rows.filter(x => !x.ok).reduce((s, x) => s + x.n, 0), groups: grp, top_juans: top(juan), top_pages: top(page) });
}

async function bundle(url, env, prefixes, dims) {
  const r = rangeOf(url); if (!r) return bad();
  const fs = [];
  for (const pre of prefixes) { const j = await features(withQ(url, { prefix: pre, all: '1' }), env).then(x => x.json()); fs.push(...j.features); }
  const u = withQ(url, { dims: dims.join(',') });
  const st = dims.length ? await state(u, env).then(x => x.json()) : { dims: [] };
  return json({ range: r.range, period: periodOut(r), features: fs, dims: st.dims, instances: st.instances });
}

async function registry(_url, env) {
  const by = {}, verify = [];
  for (const f of REGISTRY.features) { by[f.model] = (by[f.model] || 0) + 1; if (f.verify) verify.push(f.id); }
  return json({ version: REGISTRY.version, features: REGISTRY.features.length, active: FEATURES.size, by_model: by, states: REGISTRY.states.length, excluded: REGISTRY.excluded.length, rules: REGISTRY.rules.length, verify_pending: verify });
}

// ---- 實例（短代號）----
async function instances(url, env) {
  const r = rangeOf(url); if (!r) return bad();
  const limit = num(url.searchParams.get('limit'), 30, 1, 200);
  const order = url.searchParams.get('sort') === 'opens' ? 'opens DESC, sec DESC' : 'sec DESC, opens DESC';
  const total = await env.DB.prepare('SELECT COUNT(DISTINCT h) AS n FROM instance_days WHERE day BETWEEN ? AND ?').bind(r.start, r.end).first();
  const rows = (await env.DB.prepare(
    'SELECT d.h AS h, i.city AS city, i.device AS device, i.mode AS mode, i.first_day AS first_day, i.last_day AS last_day, i.search_total AS stot, i.dict_total AS dtot, SUM(d.opens) AS opens, SUM(d.active_sec) AS sec, SUM(d.read_sec) AS rsec ' +
    'FROM instance_days d JOIN instances i ON i.h = d.h WHERE d.day BETWEEN ? AND ? GROUP BY d.h ORDER BY ' + order + ' LIMIT ?').bind(r.start, r.end, limit).all()).results || [];
  return json({ range: r.range, period: periodOut(r), total: total ? total.n : 0, limit,
    instances: rows.map(x => ({ code: shortCode(x.h), city: x.city || '未知', device: x.device || null, mode: x.mode || null, first_day: x.first_day, last_day: x.last_day, opens: x.opens, active_seconds: x.sec, read_seconds: x.rsec, search_total: x.stot, dict_total: x.dtot })) });
}
async function instanceDetail(url, env) {
  const code = url.searchParams.get('code') || '';
  if (!/^[0-9a-fA-F]{4,8}$/.test(code)) return json({ error: '短代號須為 4 到 8 碼十六進位' }, 400);
  const rows = (await env.DB.prepare('SELECT * FROM instances WHERE h LIKE ? LIMIT 6').bind(code.toLowerCase() + '%').all()).results || [];
  if (rows.length === 0) return json({ error: '找不到這個短代號' }, 404);
  if (rows.length > 1) return json({ error: '短代號對到多個實例，請多給幾碼（最多 8 碼）', ambiguous: rows.length }, 409);
  const i = rows[0], today = taipeiDay(Date.now()), periods = {};
  for (const [name, type] of [['today', 'd'], ['week', 'w'], ['month', 'm']]) {
    const [start, end] = periodRange(type, today);
    const v = await env.DB.prepare('SELECT COALESCE(SUM(opens),0) AS opens, COALESCE(SUM(active_sec),0) AS sec, COALESCE(SUM(read_sec),0) AS rsec FROM instance_days WHERE h = ? AND day BETWEEN ? AND ?').bind(i.h, start, end).first();
    periods[name] = { start, end, opens: v.opens, active_seconds: v.sec, read_seconds: v.rsec };
  }
  const out = { code: shortCode(i.h), city: i.city || '未知', device: i.device || null, mode: i.mode || null, first_day: i.first_day, last_day: i.last_day,
    opens_total: i.opens_total, active_seconds_total: i.active_sec, read_seconds_total: i.read_sec, search_total: i.search_total, dict_total: i.dict_total, periods };
  const dre = /^\d{4}-\d{2}-\d{2}$/, day = url.searchParams.get('day');
  if (day) {
    if (!dre.test(day)) return json({ error: 'day 格式須為 YYYY-MM-DD' }, 400);
    const reading = (await env.DB.prepare('SELECT e, juan, SUM(sec) AS sec, SUM(opens) AS opens FROM instance_day_reading WHERE h = ? AND day = ? GROUP BY e, juan ORDER BY sec DESC').bind(i.h, day).all()).results || [];
    const feats = (await env.DB.prepare('SELECT feature, n FROM instance_day_feature WHERE h = ? AND day = ? ORDER BY n DESC').bind(i.h, day).all()).results || [];
    const nd = await env.DB.prepare('SELECT COUNT(*) AS kinds, COALESCE(MAX(n),0) AS max_n FROM instance_day_node WHERE h = ? AND day = ?').bind(i.h, day).first();
    const tot = await env.DB.prepare('SELECT opens, active_sec, read_sec FROM instance_days WHERE h = ? AND day = ?').bind(i.h, day).first();
    // 只有次數與統計；不回傳搜尋詞、辭典詞、節點清單、設定組合（D058）
    const cnt = k => feats.filter(f => f.feature === k).reduce((s, f) => s + f.n, 0);
    out.day = { day, opens: tot ? tot.opens : 0, active_seconds: tot ? tot.active_sec : 0, read_seconds: tot ? tot.read_sec : 0, reading, features: feats,
      search: { submit: cnt('search.submit'), ok: cnt('search.ok'), zero: cnt('search.zero') }, dict: { lookup: feats.filter(f => f.feature.startsWith('dict.lookup.')).reduce((s, f) => s + f.n, 0), miss: cnt('dict.miss') },
      nodes: { distinct: nd ? nd.kinds : 0, max_repeat: nd ? nd.max_n : 0 } };
  }
  return json(out);
}

async function size(_url, env) {
  const tables = ['instances', 'instance_days', 'instance_day_feature', 'instance_day_state', 'instance_day_reading', 'instance_day_node', 'roll', 'export_agg', 'term_agg', 'term_seen', 'recover_agg', 'presence', 'agg', 'agg_vol'];
  const stmts = tables.map(t => env.DB.prepare('SELECT COUNT(*) AS n FROM ' + t));
  const res = await env.DB.batch(stmts);
  const rows = tables.map((t, i) => ({ table: t, rows: ((res[i].results || res[i])[0] || {}).n || 0 }));
  const bytes = { instance_day_feature: 60, instance_day_state: 70, instance_day_reading: 70, instance_day_node: 60, instance_days: 50, instances: 120, roll: 90, export_agg: 110, term_agg: 60, term_seen: 60, recover_agg: 60, presence: 50, agg: 60, agg_vol: 40 };
  return json({ tables: rows, estimated_bytes: rows.reduce((s, x) => s + x.rows * (bytes[x.table] || 60), 0), note: '估計值（每列平均位元組 × 列數），含索引會更大；D1 儀表板的容量為準' });
}

// ---- 即時在線（D060）。以伺服器時間計算；查詢時順手清理過期列；watch 模式續期監看窗口。----
async function presenceNow(url, env) {
  const timeout = num(url.searchParams.get('timeout'), parseInt(env.PRESENCE_TIMEOUT || '75', 10) || 75, 30, 300);
  const now = Math.floor(Date.now() / 1000);
  const mode = env.PRESENCE === 'off' || env.PRESENCE === 'watch' ? env.PRESENCE : 'on';
  if (mode === 'watch') await env.DB.prepare("INSERT INTO presence_ctl (k, v) VALUES ('watch_until', ?1) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind(now + 120).run();
  await env.DB.prepare('DELETE FROM presence WHERE seen < ?').bind(now - 1800).run();
  const rows = (await env.DB.prepare('SELECT h, seen, city, device, mode FROM presence ORDER BY seen DESC').all()).results || [];
  const today = (await env.DB.prepare('SELECT COUNT(DISTINCT h) AS n FROM instance_days WHERE day = ?').bind(taipeiDay(Date.now())).first()).n;
  const ago = x => now - x.seen;
  return json({ server_time: new Date(now * 1000).toISOString(), timeout, mode, interval: presenceInterval(env), online: rows.filter(x => ago(x) <= timeout).map(x => ({ code: shortCode(x.h), device: x.device, mode: x.mode, city: x.city, ago: ago(x) })),
    active_5m: rows.filter(x => ago(x) <= 300).length, active_15m: rows.filter(x => ago(x) <= 900).length, recent: rows.filter(x => ago(x) <= 900).map(x => ({ code: shortCode(x.h), device: x.device, mode: x.mode, city: x.city, ago: ago(x) })),
    today_used: today, note: '在線＝最近有送心跳且在前景互動；5／15 分鐘活躍只涵蓋有送心跳的實例，與長期統計不可混用' });
}

// ---- 趨勢：agg（實例）與 agg_vol（量值）----
async function trend(url, env) {
  const days = num(url.searchParams.get('days'), 7, 7, 30), end = taipeiDay(Date.now()), start = addDays(end, -(days - 1));
  const act = (await env.DB.prepare("SELECT period_key AS day, SUM(n) AS n FROM agg WHERE period_type = 'd' AND metric = 'active' AND period_key BETWEEN ? AND ? GROUP BY period_key").bind(start, end).all()).results || [];
  const nw = (await env.DB.prepare("SELECT period_key AS day, SUM(n) AS n FROM agg WHERE period_type = 'd' AND metric = 'new' AND period_key BETWEEN ? AND ? GROUP BY period_key").bind(start, end).all()).results || [];
  const vol = (await env.DB.prepare('SELECT day, SUM(opens) AS opens, SUM(active_sec) AS sec FROM agg_vol WHERE day BETWEEN ? AND ? GROUP BY day').bind(start, end).all()).results || [];
  const rows = []; for (let i = 0; i < days; i++) { const d = addDays(start, i); rows.push({ day: d, active: (act.find(x => x.day === d) || {}).n || 0, new: (nw.find(x => x.day === d) || {}).n || 0, opens: (vol.find(x => x.day === d) || {}).opens || 0, sec: (vol.find(x => x.day === d) || {}).sec || 0 }); }
  return json({ days, rows });
}

export const ROUTES = {
  '/admin/stats': stats, '/admin/overview': overview, '/admin/features': features, '/admin/state': state, '/admin/reading': reading, '/admin/nodes': nodes,
  '/admin/search': search, '/admin/dict': dict, '/admin/export': exports, '/admin/registry': registry,
  '/admin/nav': (u, e) => bundle(u, e, ['nav.', 'phone.', 'view.', 'kepan.', 'layout.pane_resize'], ['phone.screen', 'view.tab']),
  '/admin/display': (u, e) => bundle(u, e, ['nav.rail', 'nav.panel', 'layout.', 'menu.'], ['rail.visible', 'panel.visible', 'bar.visible', 'layout.mode', 'layout.swap', 'layout.panel_pin', 'layout.rail_pin', 'layout.pane', 'jfold', 'orient']),
  '/admin/font': (u, e) => bundle(u, e, ['font.', 'zoom.', 'early.'], ['font.family', 'font.weight', 'font.size', 'font.line', 'kepan.color', 'zoom.r', 'zoom.m', 'zoom.p']),
  '/admin/label': (u, e) => bundle(u, e, ['label.'], ['label']),
  '/admin/notes': (u, e) => bundle(u, e, ['content.', 'search.opt_'], ['px', 'cb', 'kp', 'dict']),
  '/admin/instances': instances, '/admin/instance': instanceDetail, '/admin/size': size, '/admin/presence': presenceNow, '/admin/trend': trend,
};
