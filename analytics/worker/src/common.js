// W001 Analytics v2 共用：常數、城市標籤、時間、雜湊、Registry 索引。決定見 DECISIONS.md D049–D060。
import REG from '../../registry.json' with { type: 'json' };

export const TZ_OFFSET_MS = 8 * 3600 * 1000;           // Asia/Taipei，無日光節約
export const DEVICES = ['phone', 'tablet', 'desktop'];
export const MODES = ['web', 'pwa'];

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
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow + 3);
  const y = d.getUTCFullYear();
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const w = 1 + Math.round(((d - jan4) / 86400000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
  return y + '-W' + String(w).padStart(2, '0');
}
export function addDays(day, n) { const d = new Date(day + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
export function periodRange(type, day) {
  if (type === 'd') return [day, day];
  if (type === 'w') { const dow = (new Date(day + 'T00:00:00Z').getUTCDay() + 6) % 7; const s = addDays(day, -dow); return [s, addDays(s, 6)]; }
  const s = day.slice(0, 7) + '-01'; const d = new Date(s + 'T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + 1); d.setUTCDate(0);
  return [s, d.toISOString().slice(0, 10)];
}
export const keyOf = (type, day) => type === 'd' ? day : type === 'w' ? weekKey(day) : monthKey(day);

// ---- 雜湊與比較 ----
export async function hmacHex16(secret, id) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(id)));
  return Array.from(sig.slice(0, 8), b => b.toString(16).padStart(2, '0')).join('');
}
export async function sameSecret(a, b) {       // 常數時間比較（比較雜湊）
  const h = async s => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
  const [x, y] = [await h(a), await h(b)];
  let r = 0; for (let i = 0; i < x.length; i++) r |= x[i] ^ y[i];
  return r === 0;
}
export const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
export const shortCode = h => h.slice(0, 6).toUpperCase();

// ---- Registry 索引（單一來源 analytics/registry.json；Worker 只用 id、型、狀態維度）----
export const FEATURES = new Map(REG.features.filter(f => f.status === 'active').map(f => [f.id, f]));
export const STATES = new Map(REG.states.filter(s => s.via === 's').map(s => [s.dim, new Set(s.values)]));
export const REGISTRY = REG;
