-- W001 匿名使用統計：D1 資料表（D040）
-- 設計原則：「是誰」與「在哪個城市」分在兩組互不相連的表。
-- 沒有任何欄位存 IP、User-Agent、經緯度、時間戳（只到「日」）。

-- 匿名實例表：沒有城市。h = HMAC-SHA256(pepper, 客戶端隨機 ID) 的前 16 個十六進位字元。
CREATE TABLE IF NOT EXISTS instances (
  h           TEXT PRIMARY KEY,
  first_day   TEXT NOT NULL,              -- 'YYYY-MM-DD'（Asia/Taipei）
  last_day    TEXT NOT NULL,
  opens_total INTEGER NOT NULL DEFAULT 0,
  active_sec  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS instances_last_day ON instances(last_day);

-- 實例數聚合：沒有 ID。
--   metric 'active'：該期間內第一次出現的實例；'new'：全新實例（首次出現於該期間）
CREATE TABLE IF NOT EXISTS agg (
  period_type TEXT NOT NULL,              -- 'd' 日 / 'w' 週（ISO，週一起算） / 'm' 月
  period_key  TEXT NOT NULL,              -- '2026-10-05' / '2026-W41' / '2026-10'
  city        TEXT NOT NULL,              -- 白名單中文名；海外為 2 碼國家代碼；未知為 '未知'
  metric      TEXT NOT NULL,
  n           INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (period_type, period_key, city, metric)
);

-- 量值聚合：開啟次數、有效秒數。沒有 ID。
CREATE TABLE IF NOT EXISTS agg_vol (
  day        TEXT NOT NULL,
  city       TEXT NOT NULL,
  opens      INTEGER NOT NULL DEFAULT 0,
  active_sec INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, city)
);
