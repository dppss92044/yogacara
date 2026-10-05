-- W001 匿名使用統計：D1 資料表（DECISIONS D040、D046–D048）
-- 全新安裝用本檔；已部署的舊資料庫請依序用 migrations/0002-instance-level.sql、0003-analytics-v2.sql。
-- 沒有任何欄位存 IP、User-Agent、經緯度、時間戳（只到「日」）、頁面或內容。

-- 匿名實例摘要。h = HMAC-SHA256(pepper, 客戶端隨機 ID) 的前 16 個十六進位字元。
-- city、device 只存「最新一次」的值（不建立每日城市歷史或移動軌跡）。
CREATE TABLE IF NOT EXISTS instances (
  h           TEXT PRIMARY KEY,
  first_day   TEXT NOT NULL,              -- 'YYYY-MM-DD'（Asia/Taipei）
  last_day    TEXT NOT NULL,
  opens_total INTEGER NOT NULL DEFAULT 0,
  active_sec  INTEGER NOT NULL DEFAULT 0,
  city        TEXT,                       -- 白名單中文名；海外為 2 碼國家代碼；未知為 '未知'
  device      TEXT,                       -- 'phone' | 'tablet' | 'desktop' | NULL（舊版客戶端）
  mode        TEXT,                       -- 'web'|'pwa'（最新；Analytics v2）
  tier        TEXT,                       -- 'b'|'f'（最新）
  read_sec    INTEGER NOT NULL DEFAULT 0,
  search_total INTEGER NOT NULL DEFAULT 0,
  dict_total  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS instances_last_day ON instances(last_day);

-- 每日明細：只有開啟次數與有效秒數；沒有城市、沒有裝置。保留 60 天。
CREATE TABLE IF NOT EXISTS instance_days (
  h          TEXT NOT NULL,
  day        TEXT NOT NULL,               -- 'YYYY-MM-DD'（Asia/Taipei）
  opens      INTEGER NOT NULL DEFAULT 0,
  active_sec INTEGER NOT NULL DEFAULT 0,
  read_sec   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (h, day)
);
CREATE INDEX IF NOT EXISTS instance_days_day ON instance_days(day);

-- 整體實例數聚合：沒有 ID，長期保存。
--   metric 'active'：該期間內第一次出現的實例；'new'：全新實例（首次出現於該期間）
CREATE TABLE IF NOT EXISTS agg (
  period_type TEXT NOT NULL,              -- 'd' 日 / 'w' 週（ISO，週一起算） / 'm' 月
  period_key  TEXT NOT NULL,              -- '2026-10-05' / '2026-W41' / '2026-10'
  city        TEXT NOT NULL,
  metric      TEXT NOT NULL,
  n           INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (period_type, period_key, city, metric)
);

-- 整體量值聚合：開啟次數、有效秒數。沒有 ID，長期保存。
CREATE TABLE IF NOT EXISTS agg_vol (
  day        TEXT NOT NULL,
  city       TEXT NOT NULL,
  opens      INTEGER NOT NULL DEFAULT 0,
  active_sec INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, city)
);

-- ===== Analytics v2（D049–D060；與 migrations/0003-analytics-v2.sql 相同的新表）=====
CREATE TABLE IF NOT EXISTS instance_day_feature (
  h TEXT NOT NULL, day TEXT NOT NULL, feature TEXT NOT NULL, n INTEGER NOT NULL,
  PRIMARY KEY (h, day, feature));
CREATE INDEX IF NOT EXISTS idf_day ON instance_day_feature(day);
CREATE TABLE IF NOT EXISTS instance_day_state (
  h TEXT NOT NULL, day TEXT NOT NULL, dim TEXT NOT NULL, val TEXT NOT NULL, sec INTEGER NOT NULL,
  PRIMARY KEY (h, day, dim, val));
CREATE INDEX IF NOT EXISTS ids_day ON instance_day_state(day);
CREATE TABLE IF NOT EXISTS instance_day_reading (
  h TEXT NOT NULL, day TEXT NOT NULL, e TEXT NOT NULL, src INTEGER NOT NULL, st INTEGER NOT NULL, juan INTEGER NOT NULL,
  sec INTEGER NOT NULL, opens INTEGER NOT NULL,
  PRIMARY KEY (h, day, e, src, st, juan));
CREATE INDEX IF NOT EXISTS idr_day ON instance_day_reading(day);
CREATE TABLE IF NOT EXISTS instance_day_node (
  h TEXT NOT NULL, day TEXT NOT NULL, ns TEXT NOT NULL, node INTEGER NOT NULL, n INTEGER NOT NULL,
  PRIMARY KEY (h, day, ns, node));
CREATE INDEX IF NOT EXISTS idn_day ON instance_day_node(day);

CREATE TABLE IF NOT EXISTS roll (
  src TEXT NOT NULL, ptype TEXT NOT NULL, pkey TEXT NOT NULL,
  a TEXT NOT NULL, b TEXT NOT NULL DEFAULT '', dev TEXT NOT NULL DEFAULT '',
  n INTEGER NOT NULL DEFAULT 0, u INTEGER, rep INTEGER, rep_days INTEGER, sec INTEGER,
  PRIMARY KEY (src, ptype, pkey, a, b, dev));

CREATE TABLE IF NOT EXISTS export_agg (
  day TEXT NOT NULL, kind TEXT NOT NULL, fmt TEXT NOT NULL, parts TEXT NOT NULL, pack TEXT NOT NULL,
  scope TEXT NOT NULL, a INTEGER NOT NULL, b INTEGER NOT NULL, label TEXT NOT NULL, ok INTEGER NOT NULL, dev TEXT NOT NULL, n INTEGER NOT NULL,
  PRIMARY KEY (day, kind, fmt, parts, pack, scope, a, b, label, ok, dev));

CREATE TABLE IF NOT EXISTS term_agg (day TEXT NOT NULL, kind TEXT NOT NULL, term TEXT NOT NULL, n INTEGER NOT NULL, u INTEGER NOT NULL,
  PRIMARY KEY (day, kind, term));
CREATE TABLE IF NOT EXISTS term_seen (day TEXT NOT NULL, kind TEXT NOT NULL, term TEXT NOT NULL, h TEXT NOT NULL,
  PRIMARY KEY (day, kind, term, h));
CREATE TABLE IF NOT EXISTS recover_agg (day TEXT NOT NULL, from_term TEXT NOT NULL, to_term TEXT NOT NULL, n INTEGER NOT NULL,
  PRIMARY KEY (day, from_term, to_term));

CREATE TABLE IF NOT EXISTS presence (
  h TEXT PRIMARY KEY, seen INTEGER NOT NULL,
  city TEXT, device TEXT, mode TEXT
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS presence_ctl (k TEXT PRIMARY KEY, v INTEGER NOT NULL) WITHOUT ROWID;
