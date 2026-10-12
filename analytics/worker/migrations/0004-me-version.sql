-- W011 migration 0004（D155–D157）：本人旗標與 App 版本。只新增欄位，不改、不刪既有資料。
-- 尚未在線上執行；執行前須由 q 批准（AI_HANDOFF.md）。只執行一次：
--   wrangler d1 execute yogacara-stats --remote --file=migrations/0004-me-version.sql
-- ALTER TABLE ADD COLUMN 重複執行會失敗（欄位已存在），這是預期的保護。
-- 先執行 migration，再部署新版 Worker（舊 Worker 不受新欄位影響；新 Worker 若先部署會寫入失敗）。

ALTER TABLE instances ADD COLUMN me INTEGER NOT NULL DEFAULT 0;   -- 1＝本人
ALTER TABLE instances ADD COLUMN av TEXT;                          -- App 版本（最新）
ALTER TABLE instance_days ADD COLUMN av TEXT;                      -- 當天最後回報的 App 版本
