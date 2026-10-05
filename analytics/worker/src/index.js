// W001 匿名使用統計接收端（Cloudflare Worker + D1）。決定見 DECISIONS.md D040–D048。
// 原則：只收 {v,id,o,s,d}（允許清單，其他欄位一律拒絕）；城市由伺服器端依 request.cf 取得，
// 只存「最新一次」的粗略城市；裝置只存大類（phone／tablet／desktop），由客戶端分類；
// 不讀取、不儲存、不記錄任何網路位址、User-Agent、其他標頭或請求內容；不使用任何日誌輸出。

const TZ_OFFSET_MS = 8 * 3600 * 1000;           // Asia/Taipei，無日光節約
const MAX_BODY = 512;
const MAX_OPENS = 20;
const MAX_SECONDS = 3 * 3600;
const DEVICES = ['phone', 'tablet', 'desktop'];

// 台灣城市白名單（key 為 request.cf 的英文名稱，已小寫並去掉 city/county/district 字尾）。
const TW = {
  'taipei': '台北', 'new taipei': '新北', 'taoyuan': '桃園', 'hsinchu': '新竹', 'miaoli': '苗栗',
  'taichung': '台中', 'changhua': '彰化', 'nantou': '南投', 'yunlin': '雲林', 'chiayi': '嘉義',
  'tainan': '台南', 'kaohsiung': '高雄', 'pingtung': '屏東', 'yilan': '宜蘭', 'hualien': '花蓮',
  'taitung': '台東', 'keelung': '基隆', 'penghu': '澎湖', 'kinmen': '金門', 'lienchiang': '連江', 'matsu': '連江',
};
// 常見行政區 → 所屬城市（只補常見者；其餘落到 region，再不然「台灣其他」）。
const TW_DISTRICT = {
  'zhongli': '桃園', 'pingzhen': '桃園', 'bade': '桃園', 'daxi': '桃園', 'dayuan': '桃園', 'guishan': '桃園', 'luzhu': '桃園',
  'banqiao': '新北', 'sanchong': '新北', 'zhonghe': '新北', 'yonghe': '新北', 'xinzhuang': '新北', 'xindian': '新北',
  'tucheng': '新北', 'luzhou': '新北', 'xizhi': '新北', 'tamsui': '新北', 'danshui': '新北', 'shulin': '新北', 'linkou': '新北', 'sanxia': '新北',
  'zhubei': '新竹', 'fengyuan': '台中', 'dali': '台中', 'fengshan': '高雄', 'gangshan': '高雄',
};
const OTHER_TW = '台灣其他';
const UNKNOWN = '未知';

function norm(name) {
  return String(name || '').toLowerCase().replace(/\b(city|county|district|municipality)\b/g, '').replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
}

export function cityLabel(cf) {
  const country = cf && typeof cf.country === 'string' ? cf.country.toUpperCase() : '';
  if (country === 'TW') {
    for (const raw of [cf.city, cf.region]) {
      const k = norm(raw);
      if (TW[k]) return TW[k];
      if (TW_DISTRICT[k]) return TW_DISTRICT[k];
    }
    return OTHER_TW;
  }
  return /^[A-Z]{2}$/.test(country) ? country : UNKNOWN;     // 海外只記國家
}

// ---- 時間（一律用伺服器時鐘，Asia/Taipei）----
export function taipeiDay(ms) { return new Date(ms + TZ_OFFSET_MS).toISOString().slice(0, 10); }
export function monthKey(day) { return day.slice(0, 7); }
export function weekKey(day) {                 // ISO 週（週一起算）
  const d = new Date(day + 'T00:00:00Z');
  const dow = (d.getUTCDay() + 6) % 7;         // 週一=0
  d.setUTCDate(d.getUTCDate() - dow + 3);      // 該週週四
  const y = d.getUTCFullYear();
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const w = 1 + Math.round(((d - jan4) / 86400000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
  return y + '-W' + String(w).padStart(2, '0');
}
function addDays(day, n) { const d = new Date(day + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
export function periodRange(type, day) {
  if (type === 'd') return [day, day];
  if (type === 'w') { const dow = (new Date(day + 'T00:00:00Z').getUTCDay() + 6) % 7; const s = addDays(day, -dow); return [s, addDays(s, 6)]; }
  const s = day.slice(0, 7) + '-01'; const d = new Date(s + 'T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + 1); d.setUTCDate(0);
  return [s, d.toISOString().slice(0, 10)];
}
const keyOf = (type, day) => type === 'd' ? day : type === 'w' ? weekKey(day) : monthKey(day);

// ---- 工具 ----
async function hmacHex16(secret, id) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(id)));
  return Array.from(sig.slice(0, 8), b => b.toString(16).padStart(2, '0')).join('');
}
async function sameSecret(a, b) {              // 常數時間比較（比較雜湊）
  const h = async s => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
  const [x, y] = [await h(a), await h(b)];
  let r = 0; for (let i = 0; i < x.length; i++) r |= x[i] ^ y[i];
  return r === 0;
}
const isInt = (n, max) => Number.isInteger(n) && n >= 0 && n <= max;

function parsePayload(text) {
  let j; try { j = JSON.parse(text); } catch (_) { return null; }
  if (!j || typeof j !== 'object' || Array.isArray(j)) return null;
  const allowed = j.v === 2 ? ['v', 'id', 'o', 's', 'd'] : j.v === 1 ? ['v', 'id', 'o', 's'] : null;
  if (!allowed || Object.keys(j).some(k => !allowed.includes(k))) return null;      // 嚴格允許清單
  if (typeof j.id !== 'string' || !/^[0-9a-fA-F-]{32,36}$/.test(j.id)) return null;
  if (!isInt(j.o, MAX_OPENS) || !isInt(j.s, MAX_SECONDS) || (j.o === 0 && j.s === 0)) return null;
  if (j.v === 2 && !DEVICES.includes(j.d)) return null;
  return { id: j.id.toLowerCase(), o: j.o, s: j.s, d: j.v === 2 ? j.d : null };
}

// ---- 收件 ----
async function collect(request, env) {
  const cors = { 'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN, 'Vary': 'Origin' };
  if (request.headers.get('Origin') !== env.ALLOWED_ORIGIN) return new Response(null, { status: 403 });
  const text = await request.text();
  if (text.length > MAX_BODY) return new Response(null, { status: 413, headers: cors });
  const p = parsePayload(text);
  if (!p) return new Response(null, { status: 400, headers: cors });

  const city = cityLabel(request.cf);
  const h = await hmacHex16(env.PEPPER, p.id);
  const today = taipeiDay(Date.now());
  const row = await env.DB.prepare('SELECT last_day FROM instances WHERE h = ?').bind(h).first();

  const incAgg = (type, metric) => env.DB.prepare(
    'INSERT INTO agg (period_type, period_key, city, metric, n) VALUES (?, ?, ?, ?, 1) ' +
    'ON CONFLICT(period_type, period_key, city, metric) DO UPDATE SET n = n + 1').bind(type, keyOf(type, today), city, metric);
  const stmts = [];
  if (!row) {
    for (const t of ['d', 'w', 'm']) { stmts.push(incAgg(t, 'new')); stmts.push(incAgg(t, 'active')); }
    stmts.push(env.DB.prepare('INSERT INTO instances (h, first_day, last_day, opens_total, active_sec, city, device) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(h, today, today, p.o, p.s, city, p.d));
  } else {
    const last = row.last_day;
    if (last !== today) stmts.push(incAgg('d', 'active'));
    if (weekKey(last) !== weekKey(today)) stmts.push(incAgg('w', 'active'));
    if (monthKey(last) !== monthKey(today)) stmts.push(incAgg('m', 'active'));
    // city、device 只覆寫為「最新一次」的值，不保留歷史。
    stmts.push(env.DB.prepare('UPDATE instances SET last_day = ?, opens_total = opens_total + ?, active_sec = active_sec + ?, city = ?, device = COALESCE(?, device) WHERE h = ?').bind(today, p.o, p.s, city, p.d, h));
  }
  stmts.push(env.DB.prepare(
    'INSERT INTO instance_days (h, day, opens, active_sec) VALUES (?, ?, ?, ?) ' +
    'ON CONFLICT(h, day) DO UPDATE SET opens = opens + excluded.opens, active_sec = active_sec + excluded.active_sec').bind(h, today, p.o, p.s));
  stmts.push(env.DB.prepare(
    'INSERT INTO agg_vol (day, city, opens, active_sec) VALUES (?, ?, ?, ?) ' +
    'ON CONFLICT(day, city) DO UPDATE SET opens = opens + excluded.opens, active_sec = active_sec + excluded.active_sec').bind(today, city, p.o, p.s));
  await env.DB.batch(stmts);
  return new Response(null, { status: 204, headers: cors });
}

// ---- 查詢（管理端點；只回聚合，不列個別實例，也沒有任何 ID 與城市的對應）----
async function stats(url, env) {
  const range = url.searchParams.get('range') || 'today';
  const type = { today: 'd', week: 'w', month: 'm' }[range];
  if (!type) return json({ error: 'range 須為 today、week 或 month' }, 400);
  const date = url.searchParams.get('date');
  const day = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : taipeiDay(Date.now());
  const key = keyOf(type, day), [start, end] = periodRange(type, day);
  const k = parseInt(env.K_MIN || '5', 10);

  const cityRows = (await env.DB.prepare(
    'SELECT city, metric, n FROM agg WHERE period_type = ? AND period_key = ?').bind(type, key).all()).results || [];
  const byCity = {};
  for (const r of cityRows) (byCity[r.city] ||= { active: 0, new: 0 })[r.metric] = r.n;
  let active = 0, fresh = 0; const cities = []; let other = { city: '其他', active: 0, new: 0 };
  for (const [city, v] of Object.entries(byCity)) {
    active += v.active; fresh += v.new;
    if (v.active < k) { other.active += v.active; other.new += v.new; } else cities.push({ city, active: v.active, new: v.new });
  }
  cities.sort((a, b) => b.active - a.active);
  if (other.active) cities.push(other);

  const vol = await env.DB.prepare(
    'SELECT COALESCE(SUM(opens),0) AS opens, COALESCE(SUM(active_sec),0) AS sec FROM agg_vol WHERE day BETWEEN ? AND ?').bind(start, end).first();
  const f = await env.DB.prepare(
    'SELECT COALESCE(SUM(opens_total = 1),0) AS b1, COALESCE(SUM(opens_total BETWEEN 2 AND 5),0) AS b2, ' +
    'COALESCE(SUM(opens_total BETWEEN 6 AND 20),0) AS b3, COALESCE(SUM(opens_total > 20),0) AS b4 ' +
    'FROM instances WHERE last_day BETWEEN ? AND ?').bind(start, end).first();
  const returning = Math.max(0, active - fresh);
  return json({
    range, period: { type, key, start, end }, k_min: k,
    instances: active, new: fresh, returning, returning_rate: active ? returning / active : 0,
    opens: vol.opens, active_seconds: vol.sec, avg_active_seconds_per_open: vol.opens ? Math.round(vol.sec / vol.opens) : 0,
    frequency: { '1': f.b1, '2-5': f.b2, '6-20': f.b3, '20+': f.b4 },
    cities,
  });
}
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

// ---- 匿名實例查詢（管理端點）：只回 6 碼短代號，不回完整 hash；沒有任何 IP／UA／內容 ----
const shortCode = h => h.slice(0, 6).toUpperCase();
function rangeOf(url) {
  const range = url.searchParams.get('range') || 'today';
  const type = { today: 'd', week: 'w', month: 'm' }[range];
  if (!type) return null;
  const date = url.searchParams.get('date');
  const day = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : taipeiDay(Date.now());
  const [start, end] = periodRange(type, day);
  return { range, type, key: keyOf(type, day), start, end };
}
async function instances(url, env) {
  const r = rangeOf(url); if (!r) return json({ error: 'range 須為 today、week 或 month' }, 400);
  const limit = Math.max(1, Math.min(200, parseInt(url.searchParams.get('limit') || '30', 10) || 30));
  const order = url.searchParams.get('sort') === 'opens' ? 'opens DESC, sec DESC' : 'sec DESC, opens DESC';
  const total = await env.DB.prepare('SELECT COUNT(DISTINCT h) AS n FROM instance_days WHERE day BETWEEN ? AND ?').bind(r.start, r.end).first();
  const rows = (await env.DB.prepare(
    'SELECT d.h AS h, i.city AS city, i.device AS device, SUM(d.opens) AS opens, SUM(d.active_sec) AS sec ' +
    'FROM instance_days d JOIN instances i ON i.h = d.h WHERE d.day BETWEEN ? AND ? GROUP BY d.h ORDER BY ' + order + ' LIMIT ?').bind(r.start, r.end, limit).all()).results || [];
  return json({
    range: r.range, period: { type: r.type, key: r.key, start: r.start, end: r.end }, total: total ? total.n : 0, limit,
    instances: rows.map(x => ({ code: shortCode(x.h), city: x.city || '未知', device: x.device || null, opens: x.opens, active_seconds: x.sec })),
  });
}
async function instanceDetail(url, env) {
  const code = url.searchParams.get('code') || '';
  if (!/^[0-9a-fA-F]{4,8}$/.test(code)) return json({ error: '短代號須為 4 到 8 碼十六進位' }, 400);
  const rows = (await env.DB.prepare('SELECT h, city, device, first_day, last_day, opens_total, active_sec FROM instances WHERE h LIKE ? LIMIT 6')
    .bind(code.toLowerCase() + '%').all()).results || [];
  if (rows.length === 0) return json({ error: '找不到這個短代號' }, 404);
  if (rows.length > 1) return json({ error: '短代號對到多個實例，請多給幾碼（最多 8 碼）', ambiguous: rows.length }, 409);
  const i = rows[0], today = taipeiDay(Date.now()), periods = {};
  for (const [name, type] of [['today', 'd'], ['week', 'w'], ['month', 'm']]) {
    const [start, end] = periodRange(type, today);
    const v = await env.DB.prepare('SELECT COALESCE(SUM(opens),0) AS opens, COALESCE(SUM(active_sec),0) AS sec FROM instance_days WHERE h = ? AND day BETWEEN ? AND ?').bind(i.h, start, end).first();
    periods[name] = { start, end, opens: v.opens, active_seconds: v.sec };
  }
  return json({ code: shortCode(i.h), city: i.city || '未知', device: i.device || null, first_day: i.first_day, last_day: i.last_day,
    opens_total: i.opens_total, active_seconds_total: i.active_sec, periods });
}

// ---- 清理 ----
export async function cleanup(env) {
  const now = Date.now();
  const cutoffDays = taipeiDay(now - parseInt(env.DAILY_RETENTION_DAYS || '60', 10) * 86400000);
  const cutoffInst = taipeiDay(now - parseInt(env.RETENTION_DAYS || '180', 10) * 86400000);
  await env.DB.prepare('DELETE FROM instance_days WHERE day < ?').bind(cutoffDays).run();
  await env.DB.prepare('DELETE FROM instance_days WHERE h IN (SELECT h FROM instances WHERE last_day < ?)').bind(cutoffInst).run();
  await env.DB.prepare('DELETE FROM instances WHERE last_day < ?').bind(cutoffInst).run();
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (url.pathname === '/health') return new Response('ok');
      if (url.pathname === '/v') {
        if (request.method === 'OPTIONS') {
          return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' } });
        }
        if (request.method !== 'POST') return new Response(null, { status: 405 });
        return await collect(request, env);
      }
      if (url.pathname === '/admin/stats') {
        if (request.method !== 'GET') return new Response(null, { status: 405 });
        const auth = request.headers.get('Authorization') || '';
        if (!env.ADMIN_TOKEN || !auth.startsWith('Bearer ') || !(await sameSecret(auth.slice(7), env.ADMIN_TOKEN))) return new Response(null, { status: 401 });
        return await stats(url, env);
      }
      if (url.pathname === '/admin/instances' || url.pathname === '/admin/instance') {
        if (request.method !== 'GET') return new Response(null, { status: 405 });
        const auth = request.headers.get('Authorization') || '';
        if (!env.ADMIN_TOKEN || !auth.startsWith('Bearer ') || !(await sameSecret(auth.slice(7), env.ADMIN_TOKEN))) return new Response(null, { status: 401 });
        return url.pathname === '/admin/instances' ? await instances(url, env) : await instanceDetail(url, env);
      }
      return new Response(null, { status: 404 });
    } catch (_) {
      return new Response(null, { status: 500 });
    }
  },
  async scheduled(_event, env, ctx) { ctx.waitUntil(cleanup(env)); },
};
