# analytics/ — W001 匿名 App 分析（Analytics v2）

決定依據：`DECISIONS.md` D049–D060（取代 D040–D048 中 App 內開關、告知文案與 v2 payload 的部分）。最終規格：`/mnt/project-files/W001/W001-analytics-v2-final-spec.md`。
狀態：**施工中，未驗收，未發布**。**本目錄程式碼可公開；任何 secret（`PEPPER`、`ADMIN_TOKEN`）都不得進 repository**，只能用 `wrangler secret put` 設定。

> **App 內沒有任何統計 UI**（D059）：無開關、無告知文字、關於頁與導覽不變。告知與控制介面由 q 另行定稿；定稿前 Analytics v2 不得正式發布（見 `AI_HANDOFF.md`）。

## 目錄
| 路徑 | 內容 |
|---|---|
| `registry.json` | **唯一白名單**：features（功能 ID、模型、selector、why／privacy／retention）、rules（客戶端比對規則）、states（設定狀態維度與各版面預設值）、excluded（明確不追蹤）。客戶端、Worker、CLI 都讀它 |
| `registry/kepan-*.json.gz` | 科判節點 ID → 標題／層級／父節點／干支／卷（只給 CLI 還原名稱；不進 Worker、不進 Service Worker 快取）。由 `tools/make-kepan-registry.py` 產生；節點 ID＝版本字母＋內嵌資料雜湊 dv＋索引 |
| `worker/` | Cloudflare Worker（`src/`）、D1 schema 與 migrations、測試（`test/`） |
| `cli/yoga_stats.py` | Mac 指令 `瑜伽統計`（見下） |
| `../tools/stats-client.js` | App 客戶端原始檔；`../tools/patch-w001-stats.py` 把它與由 registry 產生的設定注入 `index.html`（`git show e4a365f:index.html > index.html && python3 tools/patch-w001-stats.py index.html index.html`） |
| `../tools/stats-test.cjs` | 客戶端 Chromium 測試（Playwright） |
| `../tools/check-analytics-registry.cjs` | Registry 完整性檢查（靜態＋三版面動態＋控制項掃描） |
| `../tools/sim-volume.mjs` | 資料量模擬（合成流量，非實測） |
| `worker/test/meter/` | 本機量測用包裝 Worker（回報 D1 的 `meta.rows_written`），**永遠不部署** |

## 蒐集什麼（與不蒐集什麼）
- 模式：`off`｜`basic`（只有開啟次數、有效秒數、裝置大類、web／pwa）｜`full`（再加以下）。presence 另有開關。控制方式：`window` 事件 `hk-analytics-control`，`detail:{mode,presence}`；鍵 `hk-analytics-mode-v2`。**正式預設與介面待 q 定稿**；目前預設（僅供開發與 P5）為 full＋presence 開。
- full：功能使用次數（Registry 內的 id）、設定狀態時間（**只記非預設值**，預設值秒數由伺服器用總有效時間推得）、閱讀歸屬（版本×來源×遮罩×卷×秒數×進入次數）、科判節點計次（穩定 ID，每次 ≤40 個）、搜尋詞與辭典詞（見下）、匯出／回報／版本詳情摘要。
- **搜尋／辭典詞**：僅 CJK 與常見標點、1–16 字（NFKC、去空白）；含拉丁字母、`@`、網址、6 位以上數字者**客戶端就不送**，Worker 再濾一次。詞與實例分離：只以 7 天的雜湊判斷「不同人數 u」，詞表 90 天，月榜（u≥5 的前 200 名）保留在 roll。注意：`u` 的單位是「人·日」（同一實例跨日重複搜尋會各計一次），解讀時別當成不重複人數。
- **永不蒐集**：筆記、反白、問題回報內容、輸入過程（逐字／逐鍵）、hover／mousemove／scroll、座標、未登錄元素的點擊、IP、User-Agent、GPS 定位、完整事件時間序列。城市只由 `request.cf` 推算（台灣白名單城市；海外只留國碼），伺服器不讀 IP／UA。
- DNT／GPC：一律停用（不建立編號、不傳送）。`off`：立即停止、丟棄未送資料、送 `/forget`、刪除本機 ID；離線時留墓碑待補送。
- 保存期限：`instance_day_*` 60 天；`instance_day_node` 40 天；`term_seen` 7 天；`recover_agg` 30 天；`term_agg` 90 天；`roll` 日資料 400 天；`instances` 180 天（客戶端 ID 每 180 天輪替）。

## 傳送協定
- `POST /v`（`text/plain`、無 preflight、`keepalive`、8 秒逾時、204）：`{v:4,id,o,s,d,m,t,f?,ss?,r?,nd?,q?,k?,x?,hv?}`。頂層 `ss`＝設定狀態時間。嚴格結構（多餘欄位 400）、內容依 Registry 過濾、上限見 D052。`t:'b'` 只收 `o,s,d,m`。v2 仍接受，v1 丟棄。
- `POST /p`：presence 心跳 `{v:1,id,d,m}`／離開 `{v:1,id,x:1}`；回 204＋標頭 `x-p`（客戶端心跳間隔秒，20–300，`0`＝停止）。只在頁面可見且 90 秒內有互動才送；WITHOUT ROWID upsert＋「距上次 ≥10 秒才寫」守衛。環境變數 `PRESENCE=on|watch|off`（`watch`＝只有 CLI 監看期間才寫 D1）。
- `POST /forget`：刪 `instances`、`instance_days`、`instance_day_*`、`term_seen`、`presence`；聚合保留；不告知是否存在。
- 管理端點（`Authorization: Bearer`，常數時間比對）：`stats overview features state reading nodes search dict export registry nav display font label notes instances instance size presence trend`。**沒有任何端點能列出單一實例的節點／詞／設定值**。
- k 門檻：地區 `K_MIN=5`；節點、詞、卷排行 `K_TERM=3`，不足者併入「其他」。

## 查詢（Mac CLI）
`analytics/cli/yoga_stats.py`：`瑜伽統計 今天｜本週｜本月｜<主題> [期間]`；主題：回訪、地區、使用者、實例、閱讀、科判、版本、註釋、搜尋、辭典、匯出、導航、顯示、字體、科標、功能（`--全部`／`--未使用`／`--類型`）、裝置、即時（`--監看`、`--timeout`）、趨勢、資料量、登錄；`--裝置`、`--最近`、`--by`、`--day`、`--json`。token 預設由鑰匙圈 `yoga-stats-admin` 讀取；`./analytics/cli/install-mac.sh` 把指令加進 `~/.zshrc`（不寫 token）。測試：`python3 -m unittest discover analytics/cli`。

## 新增功能時的 Analytics 規則（D050，不可省）
1. 判斷這個功能有沒有產品分析價值。
2. 有：先在 `registry.json` 登錄（`features`＋`rules`；`states` 若有持續狀態），填 `why`／`privacy`／`retention`，`raw` 必須為 false。
3. 選正確模型（action／toggle／choice／continuous／navigation／export／read state／flow／system），**不得一律記 click**。
4. 加必要測試：該功能的計數＋負面測試（`tools/stats-test.cjs`），並讓 `node tools/check-analytics-registry.cjs` 通過。
5. 明確不追蹤的控制項，加進 `excluded`（寫 `css` 與原因）。
6. 不因新增一般功能而重新設計核心或新增 D1 schema；只有出現**新的資料維度**才可，且須 q 批准並在 `DECISIONS.md` 立條。
每次修改 `index.html` 都要跑完整性檢查。已知限制：模擬走訪不保證涵蓋所有動態 UI（深層面板仍可能漏），所以第 1–6 步的人為判斷不能省。

## 測試
```
node --test analytics/worker/test/                          # Worker（node:sqlite 模擬 D1）
python3 -m unittest discover analytics/cli                  # CLI（假伺服器）
node tools/check-analytics-registry.cjs                     # Registry 完整性（需 Playwright＋Chromium）
node tools/stats-test.cjs                                   # 客戶端（Playwright＋Chromium）
node tools/sim-volume.mjs 50 200 700 1000                   # 資料量（本機模擬）
```
本機端到端／量測：`cd analytics/worker && wrangler dev --local --persist-to <暫存資料夾> -c test/meter/wrangler.toml`，再 `curl localhost:8787/__init` 建 schema；`HTTP=http://localhost:8787 node tools/sim-volume.mjs 200`（`--local` 用本機模擬的 D1，不碰線上資料庫）。
**這些都是 Chromium／Node 模擬，不能取代 Safari、iPhone、iPad 實機（P5）。** 實際跑了什麼、沒跑什麼，記在 `AI_HANDOFF.md`。

## 隱私重點
- 程式不讀取、不儲存、不記錄 IP 或任何請求標頭（只讀 `Origin`、`Authorization`）；沒有 `console` 輸出；`wrangler.toml` 設 `observability.enabled = false`，也不要設 Logpush。
- 不能宣稱「完全不保存 IP」：GitHub Pages 與 Cloudflare 在基礎設施層本來就會處理 IP；我們自己的資料庫、程式與日誌不存。
- 給使用者的隱私說明草稿：`PRIVACY-DRAFT.md`（**未發布**，待 q 定稿後才放上網站）。

## 部署（由 q 在 Mac 終端機操作；**需 q 逐階段同意，施工階段不做**）
Migration 與部署的順序、備份與回滾見 `AI_HANDOFF.md`（W001 條目）；步驟包含：套用 `worker/migrations/0003-analytics-v2.sql`（遠端 D1）、`wrangler deploy`、核對 Logs 關閉、驗證 `/p` 與 `x-p`、一次一個階段回報。上線前恢復正式 `ALLOWED_ORIGIN`（`https://dppss92044.github.io`），並清掉測試資料。
