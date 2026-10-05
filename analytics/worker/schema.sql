-- W001 匿名使用統計：D1 資料表（DECISIONS D040、D046–D048）
-- 全新安裝用本檔；已部署的舊資料庫請改用 migrations/0002-instance-level.sql。
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
  device      TEXT                        -- 'phone' | 'tablet' | 'desktop' | NULL（舊版客戶端）
);
CREATE INDEX IF NOT EXISTS instances_last_day ON instances(last_day);

-- 每日明細：只有開啟次數與有效秒數；沒有城市、沒有裝置。保留 60 天。
CREATE TABLE IF NOT EXISTS instance_days (
  h          TEXT NOT NULL,
  day        TEXT NOT NULL,               -- 'YYYY-MM-DD'（Asia/Taipei）
  opens      INTEGER NOT NULL DEFAULT 0,
  active_sec INTEGER NOT NULL DEFAULT 0,
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
