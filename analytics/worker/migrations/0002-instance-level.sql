-- W001：從「實例表不含城市」的舊模型升級到匿名實例層級（D046–D048）。
-- 只能對舊資料庫執行一次（ALTER TABLE ADD COLUMN 重複執行會報錯）。全新安裝請用 schema.sql。
ALTER TABLE instances ADD COLUMN city   TEXT;
ALTER TABLE instances ADD COLUMN device TEXT;
CREATE TABLE IF NOT EXISTS instance_days (
  h          TEXT NOT NULL,
  day        TEXT NOT NULL,
  opens      INTEGER NOT NULL DEFAULT 0,
  active_sec INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (h, day)
);
CREATE INDEX IF NOT EXISTS instance_days_day ON instance_days(day);
