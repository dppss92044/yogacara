# analytics/ — W001 匿名使用統計接收端

決定依據：`DECISIONS.md` D040–D043。**本目錄程式碼可公開；任何 secret（`PEPPER`、`ADMIN_TOKEN`）都不得進 repository**，只能用 `wrangler secret put` 設定。

## 這是什麼
- `worker/src/index.js`：Cloudflare Worker。`POST /v` 收統計（只收 `{v,id,o,s,av}`）；`GET /admin/stats` 回聚合報表（需 token）；每日排程刪除 180 天沒出現的匿名實例。
- `worker/schema.sql`：D1 資料表。「匿名實例表」沒有城市；「聚合表」沒有 ID。
- `worker/test/worker.test.mjs`：本機測試（`node --test analytics/worker/test/worker.test.mjs`，用 Node 內建 sqlite 模擬 D1）。

## 隱私重點
- 程式不讀取、不儲存、不記錄 IP 或任何請求標頭（只讀 `Origin`、`Authorization`）；沒有 `console` 輸出；`wrangler.toml` 設 `observability.enabled = false`。
- 城市由 Cloudflare 依連線在伺服器端推算（`request.cf`），瀏覽器不會被要求任何定位權限。
- 不能宣稱「完全不保存 IP」：GitHub Pages 與 Cloudflare 在基礎設施層本來就會處理 IP；我們自己的資料庫、程式與日誌不存。

## 部署（由 q 在 Mac 終端機操作）
1. 建立免費 Cloudflare 帳號。
2. `cd analytics/worker && npx wrangler login`
3. `npx wrangler d1 create yogacara-stats`，把輸出的 `database_id` 填入 `wrangler.toml`。
4. `npx wrangler d1 execute yogacara-stats --remote --file=schema.sql`
5. `npx wrangler deploy`
6. 設定 secret `PEPPER`、`ADMIN_TOKEN`（`ADMIN_TOKEN` 同時存入 macOS 鑰匙圈 `yoga-stats-admin`）。
7. 驗證：`/health`、一筆測試 POST、`/admin/stats`、無 token 應為 401；在儀表板確認 Logs 關閉、未設 Logpush。
8. 上線前清空測試資料。

## 查詢（Mac）
`analytics/cli/yoga_stats.py`：`瑜伽統計 今天｜本週｜本月｜回訪 [期間]｜地區 [期間]`（`--json`、`--date`）。token 預設從鑰匙圈 `yoga-stats-admin` 讀取。`./analytics/cli/install-mac.sh` 會在 `~/.zshrc` 加入指令（不寫 token）。測試：`python3 -m unittest discover analytics/cli`。
