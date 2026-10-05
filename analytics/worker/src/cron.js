// W001 Analytics v2 排程：每日結算 roll、依保存期限清理、詞彙月榜修剪；每小時清除過期 presence。
import { taipeiDay, periodRange, keyOf, addDays } from './common.js';

const BATCH = 20;     // 每批語句數（D1 batch 為單一子請求；分批只為保守，不依賴未驗證的上限）
const UP = 'ON CONFLICT(src, ptype, pkey, a, b, dev) DO UPDATE SET n = excluded.n, u = excluded.u, rep = excluded.rep, rep_days = excluded.rep_days, sec = excluded.sec';

// 由有實例來源的明細表結算 roll（一條 INSERT…SELECT…GROUP BY；覆寫式，可重複執行）。
function rollStmt(DB, src, table, a, b, n, sec, ptype, key, start, end) {
  return DB.prepare(
    `INSERT INTO roll (src, ptype, pkey, a, b, dev, n, u, rep, rep_days, sec) ` +
    `SELECT ?1, ?2, ?3, a, b, dev, SUM(tot), COUNT(*), SUM(tot >= 2), SUM(days >= 2), SUM(secs) FROM (` +
    `SELECT ${a} AS a, ${b} AS b, COALESCE(i.device, '') AS dev, t.h AS h, SUM(${n}) AS tot, SUM(${sec}) AS secs, COUNT(DISTINCT t.day) AS days ` +
    `FROM ${table} t LEFT JOIN instances i ON i.h = t.h WHERE t.day BETWEEN ?4 AND ?5 GROUP BY a, b, dev, t.h) WHERE 1 GROUP BY a, b, dev ${UP}`).bind(src, ptype, key, start, end);
}
const SOURCES = [
  ['feature', 'instance_day_feature', 't.feature', "''", 't.n', '0', 'dwm'],
  ['state', 'instance_day_state', 't.dim', 't.val', '0', 't.sec', 'dwm'],
  ['reading_juan', 'instance_day_reading', 'CAST(t.juan AS TEXT)', 't.e', 't.opens', 't.sec', 'dwm'],
  ['reading_mix', 'instance_day_reading', 't.e', "CAST(t.src * 100 + t.st AS TEXT)", 't.opens', 't.sec', 'dwm'],
  ['node', 'instance_day_node', 't.ns', 'CAST(t.node AS TEXT)', 't.n', '0', 'wm'],      // 節點只結算週、月（日粒度不需要）
];

export async function rollup(env, now = Date.now()) {
  const today = taipeiDay(now), days = [addDays(today, -2), addDays(today, -1), today];
  const done = new Set(), stmts = [];
  for (const d of days) for (const type of ['d', 'w', 'm']) {
    const key = keyOf(type, d); if (done.has(type + key)) continue; done.add(type + key);
    const [start, end] = periodRange(type, d);
    for (const [src, table, a, b, n, sec, types] of SOURCES) if (types.includes(type)) stmts.push(rollStmt(env.DB, src, table, a, b, n, sec, type, key, start, end));
  }
  // 詞彙月榜：上個月與本月各取前 200 且 u≥5（term_agg 保留 90 天，上個月一定還在）
  for (const mday of [addDays(today, -31), today]) {
    const [s, e] = periodRange('m', mday), key = keyOf('m', mday);
    stmts.push(env.DB.prepare(
      "INSERT OR REPLACE INTO roll (src, ptype, pkey, a, b, dev, n, u) SELECT 'term_m', 'm', ?1, kind, term, '', SUM(n), SUM(u) FROM term_agg WHERE day BETWEEN ?2 AND ?3 GROUP BY kind, term HAVING SUM(u) >= 5 ORDER BY SUM(u) DESC LIMIT 200").bind(key, s, e));
  }
  for (let i = 0; i < stmts.length; i += BATCH) await env.DB.batch(stmts.slice(i, i + BATCH));
  return stmts.length;
}

export async function cleanup(env, now = Date.now()) {
  const cut = n => taipeiDay(now - n * 86400000);
  const d60 = cut(parseInt(env.DAILY_RETENTION_DAYS || '60', 10)), inst = cut(parseInt(env.RETENTION_DAYS || '180', 10));
  const DB = env.DB, del = (sql, ...b) => DB.prepare(sql).bind(...b);
  const stmts = [
    del('DELETE FROM instance_days WHERE day < ?', d60), del('DELETE FROM instance_day_feature WHERE day < ?', d60),
    del('DELETE FROM instance_day_state WHERE day < ?', d60), del('DELETE FROM instance_day_reading WHERE day < ?', d60),
    del('DELETE FROM instance_day_node WHERE day < ?', cut(40)), del('DELETE FROM term_seen WHERE day < ?', cut(7)),
    del('DELETE FROM recover_agg WHERE day < ?', cut(30)), del('DELETE FROM term_agg WHERE day < ?', cut(90)),
    del("DELETE FROM roll WHERE ptype = 'd' AND pkey < ?", cut(400)),
    del('DELETE FROM presence WHERE seen < ?', Math.floor(now / 1000) - 1800),
  ];
  for (const t of ['instance_days', 'instance_day_feature', 'instance_day_state', 'instance_day_reading', 'instance_day_node', 'term_seen'])
    stmts.push(del(`DELETE FROM ${t} WHERE h IN (SELECT h FROM instances WHERE last_day < ?)`, inst));
  stmts.push(del('DELETE FROM presence WHERE h IN (SELECT h FROM instances WHERE last_day < ?)', inst), del('DELETE FROM instances WHERE last_day < ?', inst));
  for (let i = 0; i < stmts.length; i += BATCH) await DB.batch(stmts.slice(i, i + BATCH));
}

export async function purgePresence(env, now = Date.now()) {
  await env.DB.prepare('DELETE FROM presence WHERE seen < ?').bind(Math.floor(now / 1000) - 1800).run();
}
