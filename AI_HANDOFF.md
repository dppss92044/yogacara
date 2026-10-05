# AI HANDOFF

> 本檔是 Claude Code、GPT Work、Codex 之間切換時最重要的文件。
> **每個 AI 工作結束或即將切換時，必須更新本檔。** 規則見 `AGENTS.md` §7。
> 下方是目前的**實際狀態**；固定模板見文末「模板」。

---

## 正式基底

- 正式版本：**v1.91**
- App 程式基底 commit：**`db77e11`**（「更新至 v1.91」；App 本體最後一次修改）
- W001 工作分支起點：`origin/main` = `e4a365f`（`db77e11` 之後只有文件變更）

## 目前工作編號

- **W001｜隱私優先的匿名使用統計系統**（2026-10-05 由 q 正式建立；階段：**P1 已部署並驗證完成；P2（Mac 查詢工具）已由 q 於 Mac 實機驗證；**P3＋P4 已實作並由 q 確認；匿名實例層級調整（D046–D048）程式已完成，等 q 在 Mac 遷移 D1／重新部署 Worker 後驗證**；q 已於 2026-10-05 裁定設計 §13 六項決定，已寫入 `DECISIONS.md` D040–D043**）
- 工作分支：`work/W001-anonymous-analytics`（因 session 指定，實際推送到 `claude/project-thread-3ws881`；內容相同，q 若要求再改名）
- 下一個可用編號：**W002**
- 下一正式版本候選：v1.92（**尚未發布、尚未升版**；W001 完成＋測試＋q 確認後才發布）
- 備註：先前有一份「首次載入／SW 快取」草案曾暫稱 W001（`/mnt/project-files/W001/W001-plan.md`），**q 從未批准或登記**；該主題若要做，將使用之後的 W 編號（W002），與本 W001 無關。

## 本輪使用者原始需求（W001，q，2026-10-05）

為《瑜伽師地論》App 建立**自己的匿名使用統計系統**。目的不是辨識真實身分，而是知道：(1) 大約多少不同「匿名使用實例」；(2) 大約位於哪個**城市**；(3) 同一實例是否回訪；(4) 每實例開啟 App 幾次；(5) 每次大約用多久；(6) 累計用多久；(7) 新／回訪比例；(8) 可依今天、本週、本月看統計。主要透過 q 自己 Mac 終端機查詢（`瑜伽統計 今天／本週／本月／回訪／地區`），不要登入 Google Analytics、Cloudflare Analytics、Plausible 等第三方網站。

隱私原則（最高優先）：A 不要求 GPS／Geolocation，不觸發位置提示；B 不取精確經緯度；C 不蒐集姓名、Email、電話、帳號等身分資料；D 不蒐集搜尋文字、筆記、反白內容、閱讀的具體佛典段落、其他輸入；E 不做裝置指紋；F 只用客戶端隨機產生的匿名實例 ID（不由 IP／UA／硬體推算，不宣稱等於一個自然人）；G 城市只作粗略統計，原始 IP 不得寫入統計資料庫、log 或任何長期資料，並須先確認部署平台是否自動產生含 IP 的 access log（有就必須說明，不得宣稱「完全不保存 IP」）；H 資料最小化，要「桃園有多少實例」而不是「匿名 A 在桃園的逐次軌跡」；I 使用時間只算合理的 active／engagement，不把背景分頁當閱讀；J 離線能力不得破壞，統計失敗不得影響閱讀、搜尋、註釋、PDF、科判等既有功能。

偏好：不用第三方 Analytics、程式與資料格式自己控制、成本 0 或極低、維護簡單、隱私優先、Mac 用 Python／Terminal 查詢、不建使用者帳號。

**本輪限制**：只做 (1) 讀規範與 v1.91 架構 (2) 依 W 流程登記 W001 (3) 檢查是否碰到待確認事項 (4–13) 完整技術設計（含資料存哪、城市如何取得且不觸發 GPS、ID 生命週期、active time、保存期限、隱私風險、預計修改檔案、對 SW／離線／首次載入影響、分階段與測試計畫）。**禁止**：修改 App 功能程式、發布、升版、改 Service Worker 行為、建立 release、merge 到 main。有架構選項先列優缺點與推薦，等 q 確認後停止。

## 需求變更（W001，q，2026-10-05 11:04，P3＋P4 完成後）

q 明確確認新決定：增加「匿名實例層級統計」——可查每個匿名實例的短代號、城市、裝置大類（手機／平板／電腦）、每日開啟次數、每日有效使用時間、首次／最後出現日期；CLI 增加 `瑜伽統計 使用者 今天|本週|本月` 與單一實例累計查詢；告知文案須同步改寫；保存期限須重新檢討。此新決定**取代**先前的「城市不與匿名 ID 關聯」「第一版不記裝置類型」（保留歷史，見 `DECISIONS.md` D046；D040、D041 已加註「部分被 D046 取代」）。**保留**兩份原始需求，以最新為準。

- 目前狀態：q 已於 2026-10-05 確認方案並裁定細節；已記錄 D046（實例層級）、D047（新告知文案、payload v2 含 `d`、6 碼短代號與 CLI、預設開啟維持）、D048（保存期限：每日明細 60 天、實例摘要 180 天、ID 180 天輪替）；D040／D041／D044／D045 已加註「部分被取代」，原文保留。**程式已依新規格調整完成（Worker、D1 schema＋遷移檔、CLI、客戶端、測試）；D1 遷移與新版 Worker 部署已完成，待線上驗證**。
- **D1 遷移已完成（q 於 2026-10-05 在 Mac 實機回報）**：`Processed 4 queries. Executed 4 queries in 3.81ms；23 rows read, 6 rows written；Database size: 0.05 MB`，未重複執行（此為 q 的回報，我未獨立驗證遠端資料庫）。下一步：重新部署新版 Worker；尚未部署。
- **新版 Worker 已部署（q 於 2026-10-05 在 Mac 實機回報）**：Total Upload 15.47 KiB／gzip 4.91 KiB；Bindings `env.DB=yogacara-stats`、`ALLOWED_ORIGIN=https://dppss92044.github.io`、`RETENTION_DAYS=180`、`DAILY_RETENTION_DAYS=60`、`K_MIN=5`；排程 `10 19 * * *`；Version ID `1ede1d64-070b-42ef-ac8a-cf2fe19356b1`（此為 q 的回報）。**尚未做線上功能驗證**（下一步：curl 與 CLI 驗證，之後清除測試資料）。
- 部署順序（重要）：先執行 `migrations/0002-instance-level.sql`（只加欄位與新表，舊 Worker 不受影響），再 `wrangler deploy`。若先部署新 Worker 而未遷移，寫入會失敗（Worker 回 500，客戶端靜默處理）。

## 已完成

- **匿名實例層級調整（2026-10-05，D046–D048）**：Worker（嚴格允許清單 `{v,id,o,s,d}`、`instances.city/device` 只存最新、`instance_days` 每日明細、`/admin/instances`、`/admin/instance`、清理 60／180 天）；`schema.sql` 與 `migrations/0002-instance-level.sql`；CLI `使用者`／`實例`；客戶端 `v:2`＋`d`（本機分類）＋180 天輪替；告知文案改為 D047；測試與文件同步。**未改** `sw.js`、`appVer`。最終 payload：`{"v":2,"id":"<隨機匿名編號>","o":<次數>,"s":<秒>,"d":"phone|tablet|desktop"}`。

- **P3＋P4（2026-10-05，q 裁定後實作）**：`index.html` 內嵌統計客戶端＋「關於」頁「匿名使用統計」開關與告知＋導覽「關於」描述更新；補丁 `tools/patch-w001-stats.py`（來源 `tools/stats-client.js`）；測試 `tools/stats-test.cjs`；`DECISIONS.md` 新增 D044（預設開啟＋告知開關＋DNT／GPC）、D045（payload 不傳 `av`，取代 D041 該句）；`PROJECT_SPEC.md` §13、`UI_SPEC.md` 加註。**未改** `sw.js`、`appVer`（仍 v1.91）、`versionSummaries`。
- 實際 payload：`{"v":1,"id":"<隨機匿名編號>","o":<開啟次數>,"s":<有效秒數>}`。
- 注意：`index.html` 已改但 `sw.js` 的檔案雜湊仍是 v1.91 原版 → **若在發布流程之前把這份 `index.html` 連同舊 `sw.js` 部署，SW 安裝的完整性檢查會失敗**。這是預期：W001 在 q 確認發布前不得部署；發布時依 `AGENTS.md` §3.4 用 `tools/build_release.py` 重產 `sw.js`。

- 登記 W001（本檔、`CHANGELOG.md` Unreleased、`PROJECT_STATE.md`）。
- 設計文件：`/mnt/project-files/W001/W001-anonymous-analytics-design.md`（含選項、推薦、待 q 決定事項）。
- q 裁定（2026-10-05）：Cloudflare Worker＋D1；關於頁告知＋關閉開關（文案待 q 看過）；第一版不記藏／韓版與裝置；180 天刪除、365 天輪替；台灣約 20 城白名單＋「台灣其他」、海外只記國家、<5 併「其他」；程式放 `analytics/`、secret 不入 repo。已寫入 D040–D043。
- P1 後端：q 已於 2026-10-05 自行部署並驗證（Worker `https://yogacara-stats.dppss92044.workers.dev`；D1 `yogacara-stats` APAC；schema 已寫入；`PEPPER`／`ADMIN_TOKEN` 為 Cloudflare Secret，備份於 q 的 Mac 鑰匙圈，**未入對話或 repo**；Workers Logs／Traces 已 Disabled，未訂閱 Logpush）。q 回報的驗證：/health→ok、無 token→401、錯誤 Origin→403、合法測試資料→204、管理查詢 instances=1 且城市併入「其他」（k=5 行為符合）；測試資料已 DELETE 清空。此為 q 的回報，我未能在雲端環境獨立驗證線上服務。
- P2：`analytics/cli/yoga_stats.py`（`瑜伽統計 今天|本週|本月|回訪|地區`）與 `install-mac.sh` 已寫好，單元測試與本機 e2e 通過；q 於 2026-10-05 回報已在全新終端機視窗實機驗證：`瑜伽統計 今天|本週|本月|回訪|地區 今天` 與 `yogastats 今天` 皆正常，空資料各項為 0、城市「尚無資料」。（此為 q 的回報。）
- 檢查：W001 **沒有**碰到 `DECISIONS.md` D090–D098／`PROJECT_SPEC.md` §21 T1–T12 的待確認事項；會**新增**需 q 同意的決定（見設計文件 §13），**尚未寫入 DECISIONS.md**。
- **App 本體沒有任何修改。**

## 正在進行

- q 在 Mac：①（已完成）`git pull`；②（已完成）D1 遷移；③（已完成）重新部署 Worker；④（已完成，2026-10-05）線上驗證：/health→ok、無 token 查實例→401、錯誤 Origin→403、舊欄位 av→400、合法 payload→204；CLI `使用者 今天` 顯示 1 個測試實例（桃園｜手機｜1 次｜5 分）。鏈路 Worker→Cloudflare 城市→D1→管理端點→CLI 已通（此為 q 回報，我未獨立驗證）。⑤清除人工測試資料（進行中，僅 DELETE，不動 schema／migration／secret）。完成並回報前不得進 P5。

## 尚未完成

- q 裁定資料接收端／儲存方案與設計文件 §13 的決定事項。
- P3 客戶端（**需 q 再次確認才可開始**）；P4 關於頁告知與開關；P5 實機試跑；P6 發布——**皆尚未開始**。

## 修改檔案

- Markdown：`AI_HANDOFF.md`、`CHANGELOG.md`、`PROJECT_STATE.md`、`DECISIONS.md`（D040–D045）、`PROJECT_SPEC.md`（§13）、`UI_SPEC.md`（A2）。
- App：`index.html`（內嵌統計 `<script>`、關於頁區塊、導覽一句、少量 CSS；由 `tools/patch-w001-stats.py` 對 v1.91 的 `index.html` 套用）。
- 新增 `tools/stats-client.js`、`tools/patch-w001-stats.py`、`tools/stats-test.cjs`。
- 匿名實例層級調整另改：`analytics/worker/{src/index.js,schema.sql,wrangler.toml,test/worker.test.mjs}`、新增 `analytics/worker/migrations/0002-instance-level.sql`、`analytics/cli/{yoga_stats.py,test_yoga_stats.py}`、`analytics/README.md`，以及 `index.html`（告知文案與客戶端，已由補丁對 v1.91 原檔重新套用）。
- 新增 `analytics/`：`README.md`、`worker/src/index.js`、`worker/schema.sql`、`worker/wrangler.toml`、`worker/.gitignore`、`worker/test/worker.test.mjs`；`analytics/cli/`：`yoga_stats.py`、`test_yoga_stats.py`、`install-mac.sh`。
- **未修改**：`sw.js`、`tools/sw-template.js`、`tools/build_release.py`、`manifest.webmanifest`、`icon-*.png`、`data/`、`tools/` 其他檔、`PROJECT_SPEC.md`、`UI_SPEC.md`、`docs/history/MASTER_HISTORY.md`。

## 已知 bug

- 見 `PROJECT_STATE.md` §6。W001 尚未寫任何程式，無新增 bug。

## 測試結果

- P1 後端：`node --test analytics/worker/test/worker.test.mjs` 9 項全過（Node 內建 sqlite 模擬 D1；涵蓋驗證、CORS 來源、401、聚合、回訪、時區邊界、保存期限清理、城市白名單與 k<5、靜態檢查無 IP／標頭／console）。另用 `wrangler dev --local`（真 workerd＋本機 D1）手動打過 /health、POST /v、/admin/stats（含 401）皆正常；`wrangler deploy --dry-run` 設定驗證通過。**未部署、未在真實 Cloudflare 上測過**；`request.cf` 城市在本機只能用假值測，真實城市準確度須部署後觀察。- **匿名實例層級調整後（最新）**：`node --test analytics/worker/test/worker.test.mjs` 13 項全過（Node 內建 sqlite 模擬 D1：允許清單 payload、最新城市覆寫且無城市歷史、每日明細無城市／裝置、短代號 6 碼且回應不含完整 hash、409／404／400、清理 60／180 天、遷移檔與 schema.sql 欄位一致、靜態檢查無 IP／UA／console）；`python3 -m unittest discover analytics/cli` 8 項全過（`使用者`、`實例`、錯誤處理）；`node tools/stats-test.cjs` 17 組全過（新增 14 裝置分類：電腦／手機直橫／平板直橫；08 改 180 天輪替；02 payload 含 `d`；09 靜態檢查限制螢幕／觸控判斷只在 deviceClass；其餘同前）。另用 `wrangler dev --local`（真 workerd＋本機 D1）＋真實客戶端（Playwright 三種裝置）＋CLI 做了端到端：三個實例分別被分類為電腦／手機／平板，`使用者 今天`、`使用者 本週 --sort 次數`、`實例 <短代號>`、`地區 今天` 輸出正確。**只做 Chromium 模擬與本機 workerd；尚未部署新版 Worker、尚未在線上或 Safari／iPhone／iPad 實機驗證**（本機 workerd 無法提供真實 Cloudflare 城市，端到端中城市為模擬值 US）。
- P3＋P4：`node tools/stats-test.cjs`（針對 v1.91 基底＋W001 補丁新寫；Playwright 1.56／Chromium 模擬）16 組全通過：不使用定位（0 次呼叫、無權限對話、`index.html` 無 geolocation 字串）、payload 只含 v,id,o,s 且 text/plain 無 cookie／referer／preflight、有效時間規則（前景＋90 秒互動、背景不計、離開 >30 分鐘算新開啟）、離線與恢復補送、端點 500／中止／無回應時靜默且 ≥5 分鐘才重試、DNT／GPC、關閉開關流程（含重開新 ID）、365 天輪替、靜態檢查、藏版／韓版煙霧測試（載入、搜尋、關於、版本紀錄）、`sw.js` 等檔與基底無差異且仍為 v1.91、真實 Service Worker 安裝後關閉本機伺服器離線重載仍可閱讀、關於頁截圖（電腦、iPad 直／橫、手機直／橫；開／關／DNT；藏／韓）。**只做 Chromium 模擬；尚待 Safari／iPhone／iPad 實機**（原生開關外觀、`pagehide` 補送、主畫面 PWA 前後景、iOS 儲存限制）；測試只是煙霧等級，不是完整回歸套件。
- P2：`python3 -m unittest discover analytics/cli` 6 項通過（假伺服器）；另以 `wrangler dev --local` 真 workerd＋本機 D1 灌 6 筆資料，用 CLI 查「今天」與錯誤 token（回 401 訊息、結束碼 1）皆符合。**未在 macOS／zsh 實測**（本環境無 zsh，僅在 bash 驗證中文函式名可用）；**未對線上 Worker 實測**。客戶端與 App 尚無程式。
- 先前（登記階段）僅讀碼與靜態檢查（`index.html` 無 `geolocation`、無 CSP、無既有統計；既有跨站請求只有辭典 API 與 formsubmit.co 問題回報）。
- 既有測試結果檔僅針對 v1.61–v1.63、v1.76–v1.79；v1.80–v1.91 無入庫測試（見 `PROJECT_STATE.md` §9）。W001 實作階段需新建測試，計畫見設計文件 §12。

## 不得破壞的既有行為

- `DECISIONS.md` D032：不得改回 network-first 抓大檔；SW fetch 內不得呼叫 `registration.update()`。
- 離線可讀、偏好只存 localStorage、`sw.js` activate 不碰 localStorage／IndexedDB。
- D005／AGENTS §4：最小修改、不擅自改 UI（關於頁加告知或開關屬 UI 變更，須 q 同意）。
- 統計永遠是非核心、可失敗的附加功能；不得影響閱讀、搜尋、註釋、PDF、科判。
- 不得自行增加正式版本號；不得改歷史（`AGENTS.md` §3.5）。

## 下一個 AI 第一件應做的事

1. 讀完 `AGENTS.md` §1 七份文件與設計文件 `/mnt/project-files/W001/W001-anonymous-analytics-design.md`。
2. `git status`、`git log -3`，確認與下方「最後 commit」一致。
3. 看 q 對設計文件 §13 的裁定；**未裁定前不寫程式**。裁定後先把決定寫入 `DECISIONS.md`（新條目），再依階段 P1 開始。

## 最後 commit

- 見下方「W001 commit 紀錄」。

### W001 commit 紀錄

- 起點：`origin/main` `e4a365f`。
- 登記 commit：`6176d73`（分支 `claude/project-thread-3ws881`，等同 `work/W001-anonymous-analytics`）
- P1 後端 commit：`ebb5276`（之後的 commit 以 `git log` 為準）
- P3＋P4 commit：`ca45c74`（之後的 commit 以 `git log` 為準）
- 匿名實例層級調整 commit：`3a4ac55`（之後的 commit 以 `git log` 為準）
- D1 已由 q 建立（yogacara-stats，APAC）；`database_id` 已寫入 `wrangler.toml`（非 secret）。尚未建表、尚未部署、secret 尚未設定。

## 是否已正式發布

- 否。W001 尚在第一階段（登記＋設計）；未發布、未升版（`appVer`／`sw.js` `VERSION` 仍為 v1.91）。

---

## 模板（有新 W 工作時複製上方結構，依序填寫；以下為固定欄位）

```
# AI HANDOFF

## 正式基底
（版本、commit）

## 目前工作編號
（W00x；若同時多項，各自一段）

## 本輪使用者原始需求
（逐字或忠實摘要；多輪需求依時間列出，註明哪一輪）

## 已完成
（已寫完且自測過的項目）

## 正在進行
（做到一半的項目、做到哪一步）

## 尚未完成
（還沒開始或被擱置的項目）

## 修改檔案
（逐檔列出；未動的重要檔案也註明）

## 已知 bug
（含尚未重現的疑慮）

## 測試結果
（實際跑了什麼、結果、沒跑什麼；裝置×版本矩陣；是否只有模擬）

## 不得破壞的既有行為
（本 W 觸及範圍內，DECISIONS／SPEC 中必須保留的項目）

## 下一個 AI 第一件應做的事
（具體可執行的第一步）

## 最後 commit
（hash、分支名；未 commit 的修改要先 commit 到工作分支）

## 是否已正式發布
（否／是＋版本與 commit；發布需符合 AGENTS.md §3.4 三條件）
```

### 填寫提醒

- 同一個 W 換 AI 時，**不改 W 編號、不升正式版本**。
- 填寫「本輪使用者原始需求」時，若與先前紀錄有矛盾，**保留兩者並標明**，由使用者裁定。
- 發布後：把本檔重置為「目前工作編號：無」，並在 `CHANGELOG.md`、`PROJECT_STATE.md`、`MASTER_HISTORY.md`（H156 起）登錄。
