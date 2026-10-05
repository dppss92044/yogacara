-- W001 Analytics v2 migration 0003（D049–D060）。只新增欄位與資料表，不改、不刪既有資料。
-- 尚未在線上執行；執行前須由 q 批准（AI_HANDOFF.md）。只執行一次：
--   wrangler d1 execute yogacara-stats --remote --file=migrations/0003-analytics-v2.sql
-- ALTER TABLE ADD COLUMN 重複執行會失敗（欄位已存在），這是預期的保護。

ALTER TABLE instances ADD COLUMN mode TEXT;                                -- 'web'|'pwa'（最新）
ALTER TABLE instances ADD COLUMN tier TEXT;                                -- 'b'|'f'（最新）
ALTER TABLE instances ADD COLUMN read_sec INTEGER NOT NULL DEFAULT 0;
ALTER TABLE instances ADD COLUMN search_total INTEGER NOT NULL DEFAULT 0;
ALTER TABLE instances ADD COLUMN dict_total INTEGER NOT NULL DEFAULT 0;
ALTER TABLE instance_days ADD COLUMN read_sec INTEGER NOT NULL DEFAULT 0;

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
