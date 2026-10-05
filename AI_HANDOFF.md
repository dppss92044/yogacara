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

- **W001｜隱私優先的匿名使用統計系統**（2026-10-05 由 q 正式建立；階段：**P1 已部署並驗證完成；P2（Mac 查詢工具）已由 q 於 Mac 實機驗證；P3 方案已提出，**等 q 確認文案與預設狀態後才實作**；q 已於 2026-10-05 裁定設計 §13 六項決定，已寫入 `DECISIONS.md` D040–D043**）
- 工作分支：`work/W001-anonymous-analytics`（因 session 指定，實際推送到 `claude/project-thread-3ws881`；內容相同，q 若要求再改名）
- 下一個可用編號：**W002**
- 下一正式版本候選：v1.92（**尚未發布、尚未升版**；W001 完成＋測試＋q 確認後才發布）
- 備註：先前有一份「首次載入／SW 快取」草案曾暫稱 W001（`/mnt/project-files/W001/W001-plan.md`），**q 從未批准或登記**；該主題若要做，將使用之後的 W 編號（W002），與本 W001 無關。

## 本輪使用者原始需求（W001，q，2026-10-05）

為《瑜伽師地論》App 建立**自己的匿名使用統計系統**。目的不是辨識真實身分，而是知道：(1) 大約多少不同「匿名使用實例」；(2) 大約位於哪個**城市**；(3) 同一實例是否回訪；(4) 每實例開啟 App 幾次；(5) 每次大約用多久；(6) 累計用多久；(7) 新／回訪比例；(8) 可依今天、本週、本月看統計。主要透過 q 自己 Mac 終端機查詢（`瑜伽統計 今天／本週／本月／回訪／地區`），不要登入 Google Analytics、Cloudflare Analytics、Plausible 等第三方網站。

隱私原則（最高優先）：A 不要求 GPS／Geolocation，不觸發位置提示；B 不取精確經緯度；C 不蒐集姓名、Email、電話、帳號等身分資料；D 不蒐集搜尋文字、筆記、反白內容、閱讀的具體佛典段落、其他輸入；E 不做裝置指紋；F 只用客戶端隨機產生的匿名實例 ID（不由 IP／UA／硬體推算，不宣稱等於一個自然人）；G 城市只作粗略統計，原始 IP 不得寫入統計資料庫、log 或任何長期資料，並須先確認部署平台是否自動產生含 IP 的 access log（有就必須說明，不得宣稱「完全不保存 IP」）；H 資料最小化，要「桃園有多少實例」而不是「匿名 A 在桃園的逐次軌跡」；I 使用時間只算合理的 active／engagement，不把背景分頁當閱讀；J 離線能力不得破壞，統計失敗不得影響閱讀、搜尋、註釋、PDF、科判等既有功能。

偏好：不用第三方 Analytics、程式與資料格式自己控制、成本 0 或極低、維護簡單、隱私優先、Mac 用 Python／Terminal 查詢、不建使用者帳號。

**本輪限制**：只做 (1) 讀規範與 v1.91 架構 (2) 依 W 流程登記 W001 (3) 檢查是否碰到待確認事項 (4–13) 完整技術設計（含資料存哪、城市如何取得且不觸發 GPS、ID 生命週期、active time、保存期限、隱私風險、預計修改檔案、對 SW／離線／首次載入影響、分階段與測試計畫）。**禁止**：修改 App 功能程式、發布、升版、改 Service Worker 行為、建立 release、merge 到 main。有架構選項先列優缺點與推薦，等 q 確認後停止。

## 已完成

- 登記 W001（本檔、`CHANGELOG.md` Unreleased、`PROJECT_STATE.md`）。
- 設計文件：`/mnt/project-files/W001/W001-anonymous-analytics-design.md`（含選項、推薦、待 q 決定事項）。
- q 裁定（2026-10-05）：Cloudflare Worker＋D1；關於頁告知＋關閉開關（文案待 q 看過）；第一版不記藏／韓版與裝置；180 天刪除、365 天輪替；台灣約 20 城白名單＋「台灣其他」、海外只記國家、<5 併「其他」；程式放 `analytics/`、secret 不入 repo。已寫入 D040–D043。
- P1 後端：q 已於 2026-10-05 自行部署並驗證（Worker `https://yogacara-stats.dppss92044.workers.dev`；D1 `yogacara-stats` APAC；schema 已寫入；`PEPPER`／`ADMIN_TOKEN` 為 Cloudflare Secret，備份於 q 的 Mac 鑰匙圈，**未入對話或 repo**；Workers Logs／Traces 已 Disabled，未訂閱 Logpush）。q 回報的驗證：/health→ok、無 token→401、錯誤 Origin→403、合法測試資料→204、管理查詢 instances=1 且城市併入「其他」（k=5 行為符合）；測試資料已 DELETE 清空。此為 q 的回報，我未能在雲端環境獨立驗證線上服務。
- P2：`analytics/cli/yoga_stats.py`（`瑜伽統計 今天|本週|本月|回訪|地區`）與 `install-mac.sh` 已寫好，單元測試與本機 e2e 通過；q 於 2026-10-05 回報已在全新終端機視窗實機驗證：`瑜伽統計 今天|本週|本月|回訪|地區 今天` 與 `yogastats 今天` 皆正常，空資料各項為 0、城市「尚無資料」。（此為 q 的回報。）
- 檢查：W001 **沒有**碰到 `DECISIONS.md` D090–D098／`PROJECT_SPEC.md` §21 T1–T12 的待確認事項；會**新增**需 q 同意的決定（見設計文件 §13），**尚未寫入 DECISIONS.md**。
- **App 本體沒有任何修改。**

## 正在進行

- P3：等 q 確認 `/mnt/project-files/W001/W001-P3-proposal.md` 的文案、開關位置與預設狀態（D044 待寫）；確認前不得修改 `index.html`。

## 尚未完成

- q 裁定資料接收端／儲存方案與設計文件 §13 的決定事項。
- P3 客戶端（**需 q 再次確認才可開始**）；P4 關於頁告知與開關；P5 實機試跑；P6 發布——**皆尚未開始**。

## 修改檔案

- Markdown：`AI_HANDOFF.md`、`CHANGELOG.md`、`PROJECT_STATE.md`、`DECISIONS.md`（新增 D040–D043）。
- 新增 `analytics/`：`README.md`、`worker/src/index.js`、`worker/schema.sql`、`worker/wrangler.toml`、`worker/.gitignore`、`worker/test/worker.test.mjs`；`analytics/cli/`：`yoga_stats.py`、`test_yoga_stats.py`、`install-mac.sh`。
- **未修改**：`index.html`、`sw.js`、`tools/sw-template.js`、`tools/build_release.py`、`manifest.webmanifest`、`icon-*.png`、`data/`、`tools/` 其他檔、`PROJECT_SPEC.md`、`UI_SPEC.md`、`docs/history/MASTER_HISTORY.md`。

## 已知 bug

- 見 `PROJECT_STATE.md` §6。W001 尚未寫任何程式，無新增 bug。

## 測試結果

- P1 後端：`node --test analytics/worker/test/worker.test.mjs` 9 項全過（Node 內建 sqlite 模擬 D1；涵蓋驗證、CORS 來源、401、聚合、回訪、時區邊界、保存期限清理、城市白名單與 k<5、靜態檢查無 IP／標頭／console）。另用 `wrangler dev --local`（真 workerd＋本機 D1）手動打過 /health、POST /v、/admin/stats（含 401）皆正常；`wrangler deploy --dry-run` 設定驗證通過。**未部署、未在真實 Cloudflare 上測過**；`request.cf` 城市在本機只能用假值測，真實城市準確度須部署後觀察。- P2：`python3 -m unittest discover analytics/cli` 6 項通過（假伺服器）；另以 `wrangler dev --local` 真 workerd＋本機 D1 灌 6 筆資料，用 CLI 查「今天」與錯誤 token（回 401 訊息、結束碼 1）皆符合。**未在 macOS／zsh 實測**（本環境無 zsh，僅在 bash 驗證中文函式名可用）；**未對線上 Worker 實測**。客戶端與 App 尚無程式。
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
