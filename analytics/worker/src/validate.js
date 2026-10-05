// W001 Analytics v2 payload 驗證（D052、D053）：結構層嚴格（多餘／缺少／型別錯誤／超過上限 → null＝400）；
// 內容層以 Registry 為準（未登錄項目丟棄，不影響同封包其他資料）。
import { DEVICES, MODES, FEATURES, STATES } from './common.js';

export const MAX_BODY = 8192;
export const MAX_OPENS = 20;
export const MAX_SECONDS = 3 * 3600;
const MAX_F = 60, MAX_SS = 40, MAX_R = 30, MAX_ND_NS = 2, MAX_ND = 40, MAX_QT = 10, MAX_QRP = 5, MAX_K = 10, MAX_X = 5, MAX_HV = 5;
const KEYS_V4 = ['v', 'id', 'o', 's', 'd', 'm', 't', 'f', 'ss', 'r', 'nd', 'q', 'k', 'x', 'hv'];
const FMTS = ['pdf', 'docx', 'html', 'md', 'txt'], PARTS = ['kp', 'text', 'px', 'cb'];

const isInt = (n, max, min = 0) => Number.isInteger(n) && n >= min && n <= max;
const isArr = (a, max) => Array.isArray(a) && a.length <= max;
const isObj = o => o && typeof o === 'object' && !Array.isArray(o);

// 搜尋詞／辭典詞隱私過濾：NFKC、去空白、長度 1–16、只收漢字與常見中文標點；含拉丁字母、@、網址、連續 6 位以上數字者丟棄。
const TERM_RE = /^[㐀-䶿一-鿿豈-﫿\u{20000}-\u{2fa1f}·・、，。：；！？「」『』（）〈〉《》〔〕\-]+$/u;
export function cleanTerm(t) {
  if (typeof t !== 'string') return null;
  const s = t.normalize('NFKC').replace(/\s+/g, '');
  const n = Array.from(s).length;
  if (n < 1 || n > 16) return null;
  if (/[A-Za-z@]|\d{6,}/.test(s) || /https?:|www\./i.test(s)) return null;
  return TERM_RE.test(s) ? s : null;
}

export function parsePayload(text) {
  let j; try { j = JSON.parse(text); } catch (_) { return null; }
  if (!isObj(j)) return null;
  if (j.v === 1) return null;                                                       // v1 移除
  if (j.v !== 2 && j.v !== 4) return null;
  const allowed = j.v === 2 ? ['v', 'id', 'o', 's', 'd'] : KEYS_V4;
  if (Object.keys(j).some(k => !allowed.includes(k))) return null;                  // 嚴格允許清單
  if (typeof j.id !== 'string' || !/^[0-9a-fA-F-]{32,36}$/.test(j.id)) return null;
  if (!isInt(j.o, MAX_OPENS) || !isInt(j.s, MAX_SECONDS)) return null;
  if (!DEVICES.includes(j.d)) return null;
  const p = { v: j.v, id: j.id.toLowerCase(), o: j.o, s: j.s, d: j.d, m: null, t: null, f: {}, ss: [], r: [], nd: [], terms: [], rp: [], dj: [], x: [], hv: [] };
  if (j.v === 2) return (p.o === 0 && p.s === 0) ? null : p;

  if (j.m !== undefined) { if (!MODES.includes(j.m)) return null; p.m = j.m; }
  if (j.t !== undefined) { if (j.t !== 'b' && j.t !== 'f') return null; p.t = j.t; }
  if (p.t === 'b' && ['f', 'ss', 'r', 'nd', 'q', 'k', 'x', 'hv'].some(k => j[k] !== undefined)) return null;   // 基本層只含 o、s、d、m

  if (j.f !== undefined) {
    if (!isObj(j.f) || Object.keys(j.f).length > MAX_F) return null;
    for (const [k, n] of Object.entries(j.f)) {
      if (!isInt(n, 100000, 1)) return null;
      if (FEATURES.has(k)) p.f[k] = n;                                              // 未登錄丟棄
    }
  }
  if (j.ss !== undefined) {
    if (!isArr(j.ss, MAX_SS)) return null;
    for (const row of j.ss) {
      if (!Array.isArray(row) || row.length !== 3 || typeof row[0] !== 'string' || typeof row[1] !== 'string' || !isInt(row[2], MAX_SECONDS, 1)) return null;
      const vals = STATES.get(row[0]);
      if (vals && vals.has(row[1])) p.ss.push([row[0], row[1], row[2]]);
    }
  }
  let readSec = 0;
  if (j.r !== undefined) {
    if (!isArr(j.r, MAX_R)) return null;
    for (const row of j.r) {
      if (!Array.isArray(row) || row.length !== 6) return null;
      const [e, src, st, juan, sec, opens] = row;
      if (e !== 'z' && e !== 'h') return null;
      if (!isInt(src, 1) || !isInt(st, 15) || !isInt(juan, 100, 1) || !isInt(sec, MAX_SECONDS) || !isInt(opens, 50)) return null;
      readSec += sec; p.r.push([e, src, st, juan, sec, opens]);
    }
  }
  p.readSec = Math.min(readSec, p.s);
  if (j.nd !== undefined) {
    if (!isArr(j.nd, MAX_ND_NS)) return null;
    let total = 0;
    for (const ent of j.nd) {
      if (!Array.isArray(ent) || ent.length !== 2 || typeof ent[0] !== 'string' || !/^[zh][0-9a-f]{6}$/.test(ent[0]) || !Array.isArray(ent[1])) return null;
      for (const nn of ent[1]) {
        if (!Array.isArray(nn) || nn.length !== 2 || !isInt(nn[0], 99999) || !isInt(nn[1], 200, 1)) return null;
        if (++total > MAX_ND) return null;
        p.nd.push([ent[0], nn[0], nn[1]]);
      }
    }
  }
  if (j.q !== undefined) {
    if (!isObj(j.q) || Object.keys(j.q).some(k => k !== 't' && k !== 'rp')) return null;
    if (j.q.t !== undefined) {
      if (!isArr(j.q.t, MAX_QT)) return null;
      for (const row of j.q.t) {
        if (!Array.isArray(row) || row.length !== 2 || !isInt(row[1], 1)) return null;
        const t = cleanTerm(row[0]); if (t) { p.terms.push(['s', t]); if (row[1] === 0) p.terms.push(['z', t]); }
      }
    }
    if (j.q.rp !== undefined) {
      if (!isArr(j.q.rp, MAX_QRP)) return null;
      for (const row of j.q.rp) {
        if (!Array.isArray(row) || row.length !== 2) return null;
        const a = cleanTerm(row[0]), b = cleanTerm(row[1]); if (a && b) p.rp.push([a, b]);
      }
    }
  }
  if (j.k !== undefined) {
    if (!isObj(j.k) || Object.keys(j.k).some(k => k !== 't' && k !== 'm' && k !== 'j')) return null;
    for (const [key, kind] of [['t', 'd'], ['m', 'm']]) {
      if (j.k[key] === undefined) continue;
      if (!isArr(j.k[key], MAX_K)) return null;
      for (const t of j.k[key]) { if (typeof t !== 'string') return null; const c = cleanTerm(t); if (c) p.terms.push([kind, c]); }
    }
    if (j.k.j !== undefined) {
      if (!isArr(j.k.j, MAX_K)) return null;
      for (const row of j.k.j) { if (!Array.isArray(row) || row.length !== 2 || !isInt(row[0], 100, 1) || !isInt(row[1], 1000, 1)) return null; p.dj.push([row[0], row[1]]); }
    }
  }
  if (j.x !== undefined) {
    if (!isArr(j.x, MAX_X)) return null;
    for (const x of j.x) {
      if (!isObj(x) || Object.keys(x).some(k => !['k', 'fmt', 'pt', 'pk', 'sc', 'a', 'b', 'lb', 'ok'].includes(k))) return null;
      if (!['custom', 'one', 'kepan'].includes(x.k) || !Array.isArray(x.fmt) || !Array.isArray(x.pt)) return null;
      if (x.fmt.length > 5 || x.pt.length > 4 || x.fmt.some(f => !FMTS.includes(f)) || x.pt.some(f => !PARTS.includes(f) && f !== 'gz' && f !== 'zj')) return null;
      if (!['', 'zip', 'sep'].includes(x.pk) || !['all', 'this', 'range'].includes(x.sc) || !isInt(x.a, 200, 1) || !isInt(x.b, 200, 1) || !['', 'gz', 'zj'].includes(x.lb) || !isInt(x.ok, 1)) return null;
      p.x.push([x.k, [...new Set(x.fmt)].sort().join('+'), [...new Set(x.pt)].sort().join('+'), x.pk, x.sc, Math.min(x.a, x.b), Math.max(x.a, x.b), x.lb, x.ok]);
    }
  }
  if (j.hv !== undefined) {
    if (!isArr(j.hv, MAX_HV)) return null;
    for (const v of j.hv) { if (typeof v !== 'string' || !/^\d{1,2}\.\d{1,3}$/.test(v)) return null; p.hv.push(v); }
  }
  const content = Object.keys(p.f).length || p.ss.length || p.r.length || p.nd.length || p.terms.length || p.rp.length || p.dj.length || p.x.length || p.hv.length;
  if (p.o === 0 && p.s === 0 && !content) return null;
  return p;
}

// 心跳 payload（D060）：{"v":1,"id","d","m"} 或離開 {"v":1,"id","x":1}；沒有任何內容欄位。
export function parsePresence(text) {
  let j; try { j = JSON.parse(text); } catch (_) { return null; }
  if (!isObj(j) || j.v !== 1 || typeof j.id !== 'string' || !/^[0-9a-fA-F-]{32,36}$/.test(j.id)) return null;
  const id = j.id.toLowerCase();
  if (j.x !== undefined) return (Object.keys(j).length === 3 && j.x === 1) ? { id, leave: true } : null;
  if (Object.keys(j).some(k => !['v', 'id', 'd', 'm'].includes(k)) || !DEVICES.includes(j.d) || !MODES.includes(j.m)) return null;
  return { id, d: j.d, m: j.m };
}

export function parseForget(text) {
  let j; try { j = JSON.parse(text); } catch (_) { return null; }
  if (!isObj(j) || Object.keys(j).length !== 1 || typeof j.id !== 'string' || !/^[0-9a-fA-F-]{32,36}$/.test(j.id)) return null;
  return { id: j.id.toLowerCase() };
}
