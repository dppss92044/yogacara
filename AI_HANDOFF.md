# AI HANDOFF

> 本檔是 Claude Code、GPT Work、Codex 之間切換時最重要的文件。
> **每個 AI 工作結束或即將切換時，必須更新本檔。** 規則見 `AGENTS.md` §7。
> 下方是目前的**實際狀態**；固定模板見文末「模板」。

---

## 正式基底

- 正式版本：**v1.92（發布 commit 已在 PR 內，待 q merge）**；merge 前 main 仍是 v1.91。
- v1.91 App 基底 commit：`db77e11`；W001／W002 工作分支起點 `origin/main` = `e4a365f`。
- **W001、W002 已隨 v1.92 發布並封存**（W 編號不再使用；下一個可用編號 W003）。以下 W001／W002 各節是封存的歷史交接，保留供追溯。

## v1.92 發布（2026-10-06；整合分支 `claude/project-thread-7xwf2g`）

- q 於 2026-10-06 明確確認：「確認發布 v1.92，摘要照用。」（`AGENTS.md` §3.4 第 3 條）。發布 commit＝「更新至 v1.92」（最後 commit 以 `git log` 為準）；PR 到 `main`，**由 q 自行 merge，Claude 不 merge**。
- 內容：`tools/build_release.py 1.92`（meta、`sw.js` 38 檔雜湊）；`appVer` v1.92、最後更新 2026-10-06、`versionSummaries["1.92"]`（只寫 W002 科判導航修正，不提統計）。**未重新產生 `index.html`**（W002 修正保留）；`tools/stats-test.cjs` T13 等待窗口 62→75 秒（隨機抖動造成的測試不穩，非 App 行為）。
- 線上後台已由 q 完成：D1 套用 0003、Worker `a8b60481-9a90-4664-8ec5-501d32675837`、`ALLOWED_ORIGIN`＝github.io、測試資料清空（14 表；`presence_ctl` 未動）；secrets 保留。回滾：Worker `npx wrangler rollback 97074a4c-1f46-455a-8eb3-e4f933b53c97`（舊版）；App 在 GitHub revert 該 merge。D1 Time Travel 還原點與 `~/yogastats-backups/before-0003-*.sql` 在 q 的 Mac。
- 發布前測試（Chromium／Node 模擬）：Worker 32/32、CLI 17/17、`stats-test.cjs` 16/16、registry 檢查 0 失敗（65 通過／91 不適用／3 手動）、與 v1.91 UI 差異 0（電腦、iPad 橫／直、iPhone 橫／直）、SW `FILES` 38 檔雜湊一致；W002 藏版全量 0 失敗（單擊 2,552、雙擊 2,547、（分N）193、fixtures 3/3）。
- **因 q 要求快速發布而未完成的測試**：發布版 `index.html` 上的 W002 **韓版全量**導航測試被停止在約 47%（4 分片各約 225–250／504 頁，單擊約 30,187 次，0 失敗）。完整韓版全量（單擊 63,178、雙擊 63,173、（分N）4,186，0 失敗，W002 單獨分支與 2026-10-05 整合版各一次）是在尚未改版本字串的 `index.html` 上完成；發布版與其差異僅為版本／日期／摘要字串與 `sw.js`。
- **merge 後待做（q 操作，一次一階段）**：GitHub Pages 更新後，iPhone／iPad Safari 與 PWA 確認顯示 v1.92 且 Service Worker 更新成功；實機試 W002 導航（含手機與 iPad 觸控）；`瑜伽統計 今天` 確認第一筆真實統計；上線首週量測 D1 用量（D101：presence 暫不改，必要時才調 60 秒）。
- 仍未驗證：iPhone／iPad PWA、iPad、觸控導航、真實 HTTPS 下的 SW 更新、Android。

### v1.92 發布前預覽調整（q，2026-10-06 04:49；**僅預覽，q 尚未確認設計，PR #4 未 merge、未發布**）
1. 手機（`deviceLayout==="iphone"`）導覽（`runTour`）卡片由畫面下方改為水平垂直置中；iPad／電腦配置與導覽內容不變。
2. 版本更新通知：首次進入新版本時顯示「已更新至 vX.XX」＋`versionSummaries[版本]` 以換行拆成條列＋「知道了」；以 localStorage `hk-seen-version` 記錄；全新使用者（尚未看過導覽）只記錄版本不彈出；導覽進行中不彈出。
3. `versionSummaries["1.92"]` 依 q 的暫定文字改為兩行：「科判跳轉更準確，不會因為文字相似跳錯地方。／雙擊回上一層時，正文和卷次會一起對到正確位置。」（取代先前 q 已核准的單句摘要；待 q 確認）。
4. 測試：僅針對性（Chromium 模擬 iPhone／iPad／電腦；通知出現、關閉、重新載入不重複、舊版本記錄再出現、全新使用者、導覽位置、深色模式）；未重跑 W001／韓版／藏版全量；未做 Safari 實機。

### v1.92 發布前預覽調整 第二輪（q，2026-10-06 05:03；**仍為預覽，q 未批准，PR #4 未 merge、未發布**）
1. 桌面版左右置換後拖曳方向相反：原因＝`index.html` 後段 `:root[data-layout=mac][data-single-pane=false] .wrap.with-panel` 的欄寬樣板蓋過 `.panes-swapped`，`--pw` 套到正文欄而非科判欄；補一條同優先級、位置在後的置換樣板。實測（1440×900）：正常、置換、再換回，往右拖 80px 欄寬各自 −80／+80／−80。iPad 橫向（均分欄、`!important`）本來就不可拖，未動。
2. 版本更新資料單一來源 `versionNotes`（[類型, 文字, 1＝重要]）：更新提醒只取重要項、「關於 → 版本內容」顯示全部；`versionSummaries[版本]` 由它自動產生。類型：新增功能／修正 Bug／操作改善。「版本紀錄」改名「版本內容」。舊版（≤1.91）沒有結構化資料，版本內容頁只列有 `versionNotes` 的版本。
3. 手機（iphone）「關於／版本內容」面板改為寬 `100vw−24px`、高＝可用高度（`--menu-height`），內部可捲動；版本細項 14px（比正文小）、版本號 18px。
4. 手機子頁「上一頁」：v1.91 把標題列壓成 30px，但返回鈕 44px，鈕底框蓋住第一列；手機非根頁面改為標題列 44px、下距 6px。電腦版有同樣重疊（back 底 99、內容頂 88），依指示未改。
5. 測試：僅針對性（Chromium 模擬）；未重跑 W001／韓版／藏版全量；未做 Safari 實機。

## W001＋W002 整合驗收（2026-10-05；整合分支 `claude/project-thread-7xwf2g`）

- 範圍：只做整合與驗證。**未** PR、未 merge main、未 deploy、未升 v1.92、未改 `sw.js`／`appVer`（仍 v1.91）、未動兩個原分支。
- 來源：W001 `claude/project-thread-3ws881` @ `e97f6d6`（24 commits）；W002 `claude/kepan-nav-fix-ryczgd` @ `03b36f5`（3 commits）；兩者基底皆為 `origin/main` = `e4a365f`，彼此互不相含。順序：先 merge W001，再 merge W002（皆 `--no-ff` merge，無 rebase）。
- 衝突處理：`AI_HANDOFF.md`、`CHANGELOG.md`、`PROJECT_STATE.md`、`DECISIONS.md` 人工合併、兩邊內容全數保留（W002 章節以分隔標題並列；下一個可用 W 編號改為 W003）。D099（W001）→ D100（W002）不撞號。`index.html` 自動合併無衝突；已用 diff 核對「整合後相對 W001 的變動」＝「W002 相對 e4a365f 的變動」，W002 修正完整保留、未重新產生。
- 整合後實際測試（Chromium／Node 模擬，非實機）：W001 Worker 32/32、CLI 17/17、`tools/stats-test.cjs` 16/16、`tools/check-analytics-registry.cjs` 0 失敗（65 通過、91 不適用、3 手動）；W002 `tools/nav-contract-w002.cjs --dbl`：藏版 fixtures 3/3、單擊 2,552、雙擊 2,547、（分N）193，0 失敗；韓版（4 分片、2,017 頁）單擊 63,178、雙擊 63,173、（分N）4,186，0 失敗、頁面錯誤 0。數字與 W002 單獨分支的結果完全一致。
- **未驗證**：Safari／iPhone／iPad 實機、觸控流程、窄視窗；W001 的 Worker 線上、真實 SW 離線；統計客戶端（W001 capture 監聽 click／dblclick）與 W002 `focusNode` 在實機的互動；`ALLOWED_ORIGIN` 仍須由 q 還原為 `https://dppss92044.github.io`（見 W001 章節）。W001 資料量偏高、告知／控制 UI 待定稿等原有未決事項不變。
- 發布前提醒：`index.html` 已改但 `sw.js` 雜湊仍是 v1.91；發布須走 `tools/build_release.py`（`AGENTS.md` §3.4，需 q 確認）。W001 需先完成 migration 0003 與 Worker 部署，且 q 定稿告知／控制介面後才能發布。
- **P5 實機驗收（2026-10-06，q 實機操作並回報；整合分支 `claude/project-thread-7xwf2g` @ `0f78e0c` 的程式，驗收期間未改任何 App 功能程式）**：方式＝q 的 Mac 上跑本機 Worker＋本機 D1（`wrangler dev --local`，以 `analytics/worker/schema.sql` 建表；`migrations/` 只用於舊資料庫升級，不可用於全新本機庫），`tools/p5-serve.py` 於 `http://192.168.0.12:8000` 服務 repo、即時替換統計網址（不改檔案、不碰 `sw.js`）。**未碰線上 D1／線上 Worker 部署。**
  - **W002（Mac 電腦版人工驗收）：通過**——科判單擊、雙擊、（分N）、正文／卷次／科判同步，及先前兩個錯誤案例皆正常。
  - **W001（iPhone Safari，非加入主畫面）：通過**——本機 D1 的 `instances`（opens_total=1、city=桃園、device=phone、mode=web）、`instance_days`、`instance_day_feature`（menu／settings／phone.screen／kepan.up.btn 等）、`instance_day_reading` 均成功寫入。
  - **presence：通過**——前景約 10 秒有 1 筆（device=phone、mode=web、city=桃園）；約 35 秒後 `seen` 增加 33 秒（符合約 30 秒心跳）；鎖屏後變 0 筆（符合 hidden／pagehide 送 leave 的設計）。先前一度為空，原因是查詢時頁面已離開前景（自動鎖定），**不是 Bug**；Chromium 端對端模擬（真 Worker 程式碼＋iPhone 模擬）亦在 5 秒與 30 秒送出 `/p`。
  - **W001 與 W002 互不干擾**：整合 App 上 W002 導航在 Mac 電腦版通過、W001 統計在 iPhone 寫入；W001 的 click／dblclick 監聽未造成已觀察到的導航異常。
  - **這次 P5 沒有涵蓋（不得寫成已驗證）**：iPhone 加入主畫面的 PWA（`mode=pwa`）、iPad Safari／PWA、手機與 iPad 上的 W002 觸控導航（`singleNode`／`doubleNode`）、藏版／韓版在實機的完整走訪、真實 HTTPS 下的 Service Worker 與離線補送、真實 Cloudflare 城市判斷與線上 D1／Worker、Android。
  - **P5 狀態**：W001＝通過（範圍如上）；W002＝通過（Mac 電腦版）；整合＝通過（上述範圍）。
- **線上 Worker `ALLOWED_ORIGIN`（已恢復，2026-10-06，q 在 Cloudflare Dashboard 操作並回報）**：P5 前後曾為臨時的 `http://192.168.0.12:8000`。q 在 Dashboard（yogacara-stats → Settings → Runtime variables and secrets）把 Production 的 `ALLOWED_ORIGIN` 改回 `https://dppss92044.github.io`，並讓新值實際生效（先前一度 Dashboard 顯示新值但回應仍是舊值，之後 q 處理後生效）。**最終線上驗證（q 回報）**：GitHub Pages Origin → HTTP/2 204、`access-control-allow-origin: https://dppss92044.github.io`；LAN Origin → 204，但 `access-control-allow-origin` 仍是 `https://dppss92044.github.io`（不是 LAN），故瀏覽器會因 CORS 不匹配而阻擋 LAN 來源。注意：預檢（OPTIONS）本來就回 204；真正的 POST 在 `originOk` 失敗時才回 403，此點本次未實測。**未做任何 migration、Worker 部署、D1 變更**；線上 D1 仍只套到 0002、線上 Worker 仍是舊版程式，此事與發布前必要工作 ① 仍然成立（0003 migration 與新版 Worker 須在發布前一起處理，且 `wrangler deploy` 之後環境變數以 `wrangler.toml` 為準＝github.io）。
- 發布前剩餘工作（必要／可選）：
  - 必要：①（`ALLOWED_ORIGIN` 已恢復，見上）對遠端 D1 套用 0003 並部署新版 Worker（先對遠端 D1 套用 `migrations/0003-analytics-v2.sql`，再 `wrangler deploy`，驗證 LAN origin 回 403、github.io 回 204／`x-p`）；②q 定稿「告知／控制介面」（D059 App 內零統計 UI 與發布閘門衝突待裁定）並同意發布；③q 裁定 D099（文件與程式四項差異）；④q 決定資料量方案（每次 /v 約 87 列，免費額度約撐 260 日活）；⑤補測 PWA 與 iPad 實機（q 若要求）；⑥整理 W001＋W002 的 DECISIONS 編號與文件；⑦走 `AGENTS.md` §3.4 發布流程（`tools/build_release.py`、`appVer`、`versionSummaries`、`sw.js`、`CHANGELOG`、`MASTER_HISTORY` H156 起），需 q 明確確認。
  - 可選：iPad／PWA／HTTPS 實機補測、韓版藏版實機完整走訪、`privacy.html` 發布、presence 資料量調整（`WITHOUT ROWID`／移除 day 索引）、清理本機 `.dev.vars`／`.wrangler/`。
- **q 的裁定（2026-10-06，D101）**：W001＋W002 一起發布為 v1.92；**App 內零統計 UI 維持（D059）**，不新增告知／開關／模式選項／彈窗，先前「關於頁極簡告知＋控制＋預設基本」提案已取消；D099 只修文件（#1、#2 依現況、#3、#4 已查程式並更新，未做實機逐項確認；#3 與 H140「只留一個導覽入口」歷史要求不一致，待 q 另決）；資料量不改 schema，上線首週量測。尚未 migration、部署、升版、merge、release。
- **取消統計 UI 後，v1.92 發布前必要步驟（依序，每項需 q 同意／操作）**：①對遠端 D1 套用 `migrations/0003-analytics-v2.sql`（先確認遠端現況、只讀）；②`wrangler deploy` 新版 Worker（`ALLOWED_ORIGIN`＝github.io；核對 secrets、Logs 關閉、`/p`、`/v`、LAN origin 的 POST 回 403）；③ q 要求開 PR → q 自行 merge；④發布動作一次完成：`tools/build_release.py 1.92`（只更新 meta 與 `sw.js`）＋手動更新 `appVer`、最後更新日、`versionSummaries`（**不得**重跑 `patch-w001-stats.py` 或用 `git show e4a365f:index.html` 重產 `index.html`，否則會覆蓋 W002）；⑤更新 `CHANGELOG`（Unreleased→v1.92）、`PROJECT_STATE`、本檔、`MASTER_HISTORY` H156 起；⑥發布後實機驗證 SW 更新、`/v`／`/p` 寫入、W002 導航；⑦ q 明確確認發布（§3.4 第 3 條）。
- 最後 commit：以 `git log` 為準（整合 merge commit 與本節文件更新 commit）。

## 目前工作編號

- **W001｜隱私優先的匿名使用統計系統**（2026-10-05 由 q 正式建立；階段：**P1 已部署並驗證完成；P2（Mac 查詢工具）已由 q 於 Mac 實機驗證；**P3＋P4 已實作並由 q 確認；匿名實例層級調整（D046–D048）程式已完成，等 q 在 Mac 遷移 D1／重新部署 Worker 後驗證**；q 已於 2026-10-05 裁定設計 §13 六項決定，已寫入 `DECISIONS.md` D040–D043**）
- 工作分支：`work/W001-anonymous-analytics`（因 session 指定，實際推送到 `claude/project-thread-3ws881`；內容相同，q 若要求再改名）
- 下一個可用編號：**W003**（W002 已被科判導航 Bug 修正使用，見下）
- 下一正式版本候選：v1.92（**尚未發布、尚未升版**；W001 完成＋測試＋q 確認後才發布）
- 備註：先前有一份「首次載入／SW 快取」草案曾暫稱 W001（`/mnt/project-files/W001/W001-plan.md`），**q 從未批准或登記**；該主題若要做，將使用之後的 W 編號（W003 起），與本 W001 無關。

## 本輪使用者原始需求（W001，q，2026-10-05）

為《瑜伽師地論》App 建立**自己的匿名使用統計系統**。目的不是辨識真實身分，而是知道：(1) 大約多少不同「匿名使用實例」；(2) 大約位於哪個**城市**；(3) 同一實例是否回訪；(4) 每實例開啟 App 幾次；(5) 每次大約用多久；(6) 累計用多久；(7) 新／回訪比例；(8) 可依今天、本週、本月看統計。主要透過 q 自己 Mac 終端機查詢（`瑜伽統計 今天／本週／本月／回訪／地區`），不要登入 Google Analytics、Cloudflare Analytics、Plausible 等第三方網站。

隱私原則（最高優先）：A 不要求 GPS／Geolocation，不觸發位置提示；B 不取精確經緯度；C 不蒐集姓名、Email、電話、帳號等身分資料；D 不蒐集搜尋文字、筆記、反白內容、閱讀的具體佛典段落、其他輸入；E 不做裝置指紋；F 只用客戶端隨機產生的匿名實例 ID（不由 IP／UA／硬體推算，不宣稱等於一個自然人）；G 城市只作粗略統計，原始 IP 不得寫入統計資料庫、log 或任何長期資料，並須先確認部署平台是否自動產生含 IP 的 access log（有就必須說明，不得宣稱「完全不保存 IP」）；H 資料最小化，要「桃園有多少實例」而不是「匿名 A 在桃園的逐次軌跡」；I 使用時間只算合理的 active／engagement，不把背景分頁當閱讀；J 離線能力不得破壞，統計失敗不得影響閱讀、搜尋、註釋、PDF、科判等既有功能。

偏好：不用第三方 Analytics、程式與資料格式自己控制、成本 0 或極低、維護簡單、隱私優先、Mac 用 Python／Terminal 查詢、不建使用者帳號。

**本輪限制**：只做 (1) 讀規範與 v1.91 架構 (2) 依 W 流程登記 W001 (3) 檢查是否碰到待確認事項 (4–13) 完整技術設計（含資料存哪、城市如何取得且不觸發 GPS、ID 生命週期、active time、保存期限、隱私風險、預計修改檔案、對 SW／離線／首次載入影響、分階段與測試計畫）。**禁止**：修改 App 功能程式、發布、升版、改 Service Worker 行為、建立 release、merge 到 main。有架構選項先列優缺點與推薦，等 q 確認後停止。

## Analytics v2 施工（W001，q「批准施工。」2026-10-05）

- 範圍變更：W001 由匿名使用統計擴大為「匿名 App Analytics／產品分析」，依最終規格 `/mnt/project-files/W001/W001-analytics-v2-final-spec.md`（含第 14 節 presence）施工；決定見 `DECISIONS.md` D049–D060（D040–D048 已標註部分被取代，原文保留）；文件與程式四項差異記為 D099（未裁定）。
- **App 內不得有任何統計 UI**（D059）：舊的關於頁區塊、導覽文字、CSS 將自補丁移除；`index.html` 以 `git show e4a365f:index.html` ＋新補丁重新產生。
- 施工中；步驟：①DECISIONS／文件 ②Registry 與工具 ③Worker ④CLI ⑤客戶端與補丁 ⑥重新產生 index.html ⑦整合、資料量模擬、文件 ⑧回報。目前進度以下方 commit 紀錄與 `git log` 為準。
- 仍禁止：對線上 D1 執行 migration、部署、發布、合併 main、升版（維持 v1.91）、改 `sw.js`、開 PR、繼續 P5；發布閘門：告知／控制介面由 q 定稿前不得正式發布 Analytics v2。
- 線上現況（q 回報）：D1 為舊 v2 實例層級 schema（空資料）；Worker 的 `ALLOWED_ORIGIN` 暫為 `http://192.168.0.12:8000`，P5 結束後須以 `wrangler deploy` 還原為 `https://dppss92044.github.io`。
- 測試只針對 v1.91 基底＋W001 補丁；Chromium 模擬不能取代 Safari／iPhone／iPad 實機（實機屬後續 P5）。實際跑過與未跑的項目於各階段完成後填寫於此。

### Analytics v2 施工進度與測試結果（2026-10-05；步驟 ①–⑦ 完成，等 q 驗收，尚未做步驟 ⑧ 之後的 Mac 遷移／部署）
- commit：995188d（文件）→ a860c51（Registry＋Worker）→ 4dd1274（CLI）→ e27df2a（客戶端、補丁、index.html、測試）→ b25a693（完整性檢查、模擬、README、隱私草稿、規格文件）→ 之後的 commit 以 `git log` 為準。基底 e4a365f（App v1.91，`appVer` 未改；`sw.js`、`data/`、`manifest`、`icon-*`、`AGENTS.md` 未動）。`index.html` 以 `git show e4a365f:index.html > index.html && python3 tools/patch-w001-stats.py index.html index.html` 產生。
- **實際跑過（針對 v1.91 基底＋本補丁）**：Worker 32 個單元測試（node:sqlite 模擬 D1）全過；CLI 17 個測試（假伺服器）全過；`tools/stats-test.cjs` T01–T15（Chromium：預設值在 mac／iPad／iPhone 三種版面零事件、payload 形狀、負面測試、isTrusted、搜尋詞過濾、科判 ns、狀態秒數、閱讀歸屬、離線補送與端點故障、DNT／GPC、off＋forget＋離線墓碑補送、basic、ID 輪替、presence 計時／x-p／leave／背景、presence 關閉）16/16 通過；`tools/check-analytics-registry.cjs`：靜態 0 失敗；控制項掃描 0 個未登錄控制項（含補上的 5 條排除與 1 條規則）；動態走訪 65 通過、0 失敗、91 項因該版面看不到元素列為「不適用」、3 項（原生色彩選擇器）手動。
- **本機 D1 實測**（wrangler dev --local，workerd 的本機 D1；用 `analytics/worker/test/meter` 包裝層統計 `meta.rows_written`）：presence 新增 1 列、30 秒後更新 1 列、10 秒內重複 0 列、leave 1 列 → **每次心跳 ≤1 列，與估計相符**。
- **資料量模擬（合成流量，非實測）**：50 日活每日約 15k 列、200 日活約 58k＋cron 約 17k、700 日活約 204k＋cron 約 20k（D1 計入索引列）。**每次 /v 平均約 87 列（最大約 136）**，高於規格 14.7 的估計（約 50 列／次、總計約 41k／143k／205k 的 200／700／1000 日活），主因是 `instance_day_feature`／`node`／`state` 新增列各寫表、主鍵索引與 day 索引三列；200 日活每日總寫入約為估計的 1.8 倍，免費額度（10 萬列／日）約撐到 260 日活，而非估計的 480。未改任何需求；可能的減量方案（待 q 決定）：改 `WITHOUT ROWID`（日期在前）或移除 `day` 次要索引、降低 flush 次數。節點查詢、presence 以外的寫入量為假設流量，實際以上線後量測為準。
- **未跑／不能代表**：真實 Safari、iPhone、iPad 實機（P5）；真實線上 D1／Worker（只在本機 workerd 與 node:sqlite 驗證，未對線上 D1 執行任何 migration 或部署）；真實 Service Worker 離線情境（temp 副本測試**未做**）；辭典預覽、匯出面板完整流程、導覽步驟的端對端點擊（登錄規則靜態＋部分動態驗證，`dict.*`／`export.*`／`guide.*` 的細節未逐項 Chromium 走訪）；iPad 橫向、手機橫向、韓版與藏版介面只在 T06（版本切換）與預設值測試涵蓋，未做完整逐版面走訪；`VERIFY_PENDING` 的 selector（`nav.juan_open.header`、`kepan.longpress_parent`、`layout.mode.auto`、`dict.lookup.long`、`dict.close.esc`、`dict.close.outside`）尚未在實機確認。
- 已知注意：term_agg 的 `u` 單位是「人·日」；客戶端詞過濾與 Worker 過濾相同；`orient` 為持續記錄的情境維度。
- 部署程序（待 q 同意後**一次一個階段**）：①備份目前 D1（空資料，可略）②對遠端 D1 套用 `migrations/0003-analytics-v2.sql` ③`wrangler deploy`（`ALLOWED_ORIGIN` 還原為 `https://dppss92044.github.io`）④驗證 `/p` 與 `x-p`、管理端點 ⑤才合併與發布（發布前需 q 定稿告知／控制介面並同意）。回滾：舊 Worker 版本可回復；0003 只加表與欄位。
- 尚未完成（後續，不在本階段）：恢復線上 `ALLOWED_ORIGIN`、P5 實機驗證、告知／控制介面與 `privacy.html`（草稿 `analytics/PRIVACY-DRAFT.md` 未發布）。

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

- **W002｜科判導航／同步 Bug 修正**（q，2026-10-05；與 W001 平行，**獨立分支**，不得混入 W001）
- 工作分支：`claude/kepan-nav-fix-ryczgd`（基底 `origin/main` = `e4a365f`；App 程式基底仍是 v1.91 `db77e11`）
- 狀態：**修正與測試已完成、雙擊方向已由 q 裁定（D100）；W002 可進入後續整合階段（整合＝與 W001 合併、實機驗收、發布裁定，皆由 q 決定）；尚未發布、未升版、未開 PR、未 merge、未 deploy**
- （W002 原分支不含 W001；整合分支已並存兩者，見上方「W001＋W002 整合驗收」。）
- 下一正式版本候選：v1.92（W001、W002 誰先發布誰用；發布需 `AGENTS.md` §3.4 三條件）。

## 本輪使用者原始需求（W002，q，2026-10-05 15:12）

「緊急核心 Bug 修正」：科判欄位 ↔ 正文欄位 ↔ 卷次 的導航與同步。重點：
1. 點科判標題會跳到文字相同或相似、但屬於他處的正文。案例1：藏版科判第2頁點「甲一、本地分」→ 錯跳第11頁「本地分」，應跳卷一「甲一、本地分」→「乙一、五識身相應地」處。案例2：藏版科判第4頁點「乙二、意地」→ 錯跳到後面「丙二」，應從「乙二、意地」起、含「丙一、意地五相」。要找共同根因、檢查所有版本與所有同類節點、建自動化 regression test、兩案例入 fixtures。
2. 單擊／雙擊不一致 → 統一：單擊＝正文＋卷次同步，科判不得自行進入下一層；雙擊才做母／子枝幹導航；點「（分N）」才進子枝幹。
3. 最右側直書路徑／支架標題：單擊、雙擊依同一規則，科判欄自己導航時正文與卷次必須同步。
4. 建立導航契約並全量巡檢（A 定位正確、B 卷次一致、C 單擊、D 雙擊、E （分N）、F 三欄同步）。
5. 限制：只修導航／同步；不改 UI、不動無關功能、不改 AGENTS.md、不升版、不 release、不 merge main、不 deploy、不干擾 W001；可在獨立分支修改 `index.html`。

## 已完成

- 根因（見 `docs/nav-contract.md`）：科判欄點節點時卷次取自 `PJ[頁]`（該頁多數節點所屬卷）而非節點自己的卷 `N[i][6]`；`nodeJuan()`／`localNode()` 的「後代在該卷就當成此節點在該卷」備援因此把祖先節點帶去錯的卷；`pageInJuan()` 又改寫被點的頁；雙擊只動科判欄、沒同步正文與卷次。
- 修正：`index.html` `focusNode()`（新增 `panelsync` 來源、科判欄來源改用節點自己的卷、帶頁碼就停在該頁）與 `#pzoom` 的 `dblclick`（換位後同步正文與卷次）。共約 20 行；未改 CSS、DOM 結構、UI、文案。
- 測試：`tools/nav-contract-w002.cjs` ＋ `tools/fixtures/w002-nav-cases.json`；藏版、韓版全量 0 失敗（見「測試結果」）。
- 契約文件：`docs/nav-contract.md`。

## 正在進行

- q 在 Mac：①（已完成）`git pull`；②（已完成）D1 遷移；③（已完成）重新部署 Worker；④（已完成，2026-10-05）線上驗證：/health→ok、無 token 查實例→401、錯誤 Origin→403、舊欄位 av→400、合法 payload→204；CLI `使用者 今天` 顯示 1 個測試實例（桃園｜手機｜1 次｜5 分）。鏈路 Worker→Cloudflare 城市→D1→管理端點→CLI 已通（此為 q 回報，我未獨立驗證）。⑤（已完成，2026-10-05）清除人工測試資料：q 回報 DELETE 四表 Executed 4 commands，再查 instances／instance_days／agg／agg_vol 皆為 0。目前線上 D1＝新 schema、空資料；Worker 為新版（Version 1ede1d64）。完成並回報前不得進 P5。

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

### ▼ 以下為 W002 的同名章節內容（整合時並列保留，原樣來自 claude/kepan-nav-fix-ryczgd）

- 實機驗證（Safari／iPhone／iPad）：**未做**。
- 手機／iPad 的 `singleNode`／`doubleNode`（雙擊＝切換畫面）只修了卷次來源（`PJ` 已不再影響結果），其觸控流程**未在實機或觸控模擬下逐項測**。
- 發布：未做；`sw.js` 的檔案雜湊與 `appVer` 都**未動**（發布時用 `tools/build_release.py`）。

## 修改檔案

- `index.html`（`focusNode`、`#pzoom` dblclick；兩處，另加註解）
- 新增：`tools/nav-contract-w002.cjs`、`tools/fixtures/w002-nav-cases.json`、`docs/nav-contract.md`；`DECISIONS.md` 新增 D100
- 文件：`AI_HANDOFF.md`、`CHANGELOG.md`（Unreleased）、`PROJECT_STATE.md`
- **未動**：`AGENTS.md`、`sw.js`、`manifest.webmanifest`、`icon-*.png`、`data/`、既有 `tools/*-results.json`、歷史說明檔。

## 已知 bug

- 見 `PROJECT_STATE.md` §6（與本 W 無關者不處理）。
- 韓版／藏版的「（分N）」「雙擊上一層」現行設計沿用；`PROJECT_SPEC.md` §5 寫「點兩下＝往上一層」，q 這次描述為「進入該標題的子分支；或依目前位置／既有設計進行相應的母／子分支導航」→ q 已於 2026-10-05 18:44 裁定維持現行（雙擊＝往上一層），見本檔「q 的裁定」與 D100。

## q 的裁定（已完成）

1. **雙擊標題的方向（q，2026-10-05 18:44）**：維持現行規格——雙擊＝往上一層／母枝幹；進入子枝幹仍由（分N）負責。已記錄為 `DECISIONS.md` D100 與 `docs/nav-contract.md`。
2. `.head` 路徑標題：單擊＝選取該祖先節點並同步正文／卷次（停在原頁）；雙擊＝科判欄換到它在母枝幹中的位置並同步。屬同一契約，q 未另有異議。

## 測試結果

測試針對 **v1.91 基底＋W002**（`tools/nav-contract-w002.cjs`、`tools/fixtures/w002-nav-cases.json`）；Chromium（Playwright）模擬，**不能取代 Safari／iPhone／iPad 實機**。視窗 1440×900（電腦版面）。

- fixtures 3 個（案例1、案例2、案例2b）：通過。
- 藏版全量：單擊 2,552 次（1,970 節點全覆蓋）、雙擊 2,547 次、（分N）193 次，0 失敗。
- 韓版全量（4 分片、2,017 頁）：單擊 63,178 次（46,769 節點全覆蓋）、雙擊 63,173 次、（分N）4,186 次，0 失敗；頁面錯誤 0。
- 修前基底（v1.91）同一套測試：藏版單擊 944／2,552 次失敗（258 次卷次錯、169 次科判欄換頁、其餘為正文標示不符）、雙擊 7,573 筆不同步、fixtures 3 個全失敗。韓版修前**未跑**。
- 測試過程的誤報（腳本問題，已修正並重跑確認，非 App 錯誤）：（分N）檢查曾用「頁碼標籤」與「第一個同 id 元素是否可見」，同一節點同頁常畫兩次（母枝幹＋本頁 ◎ 根標題），改為「任一份在科判欄可見區即可」；無子科的旁注小字（`data-go` 指向葉節點）改為預期標示該節點本身。
- **沒有測**：Safari／iPhone／iPad 實機；觸控流程（手機／iPad 的 `singleNode`／`doubleNode`、雙擊切換畫面）；窄視窗（手機／iPad 直向）版面；深色模式；列印／PDF 匯出；左欄卷次科判清單（rail）的點擊（只驗證 `railFocus` 標示集合）。
- 共用邏輯影響檢查（AGENTS.md §5）：改動只在 `focusNode()` 與電腦科判欄 `dblclick`；電腦（模擬）、藏版、韓版已測；iPad／手機／藏版韓版的觸控路徑經由同一個 `focusNode()`，**程式上**不再受 `PJ` 影響，但**未實測**。

## 不得破壞的既有行為

- `DECISIONS.md` D010–D039、`PROJECT_SPEC.md` §4–§5（點標題停在原頁、標題留在畫面、跳轉目標置中、點兩下＝往上一層、點「(分N)」進下一層）、D036（選中標題必須在可見處）。
- 不改 UI（間距／顏色／文案／動畫）。

## 與 W001 的合併風險

- `index.html`：W001 在 `<script id="v191js">` 之後**附加一大段**（約 4756 行起），W002 改 1458–1500 行一帶；hunk 不重疊，git 三方合併預期可自動完成。但 W001 的 `index.html` 是「以 `git show e4a365f:index.html` 為底重新產生」——**不得用重新產生的方式覆蓋掉 W002 的改動**；合併時用 git merge，再跑 `tools/nav-contract-w002.cjs` 確認。
- `AI_HANDOFF.md`、`CHANGELOG.md`、`PROJECT_STATE.md`：兩個 W 都改同一批行（目前工作編號、Unreleased）→ **幾乎必然有文字衝突**，需人工合併成「W001＋W002 並存」。
- 行為面：W001 的統計客戶端以 capture 監聽 `click`／`dblclick`；W002 在 `dblclick` 內多呼叫 `focusNode`，不新增 DOM 事件。

## 下一個 AI 第一件應做的事

1. 讀完 `AGENTS.md` §1 的七份文件與 `docs/nav-contract.md`。
2. `git log`／`git status` 核對本檔「最後 commit」。
3. 與 W001 的整合順序、實機驗收、發布，皆待 q 指示（§3.4 三條件）；不得自行合併或升版。

## 最後 commit

- W002 工作分支 `claude/kepan-nav-fix-ryczgd`：修正 commit `c333106`；其後有「測試腳本修正」commit（以 `git log` 為準）。基底 `origin/main` = `e4a365f`；App 程式基底 v1.91 = `db77e11`。
- 與 W001（分支 `claude/project-thread-3ws881`）在原分支互不相含；整合結果見「W001＋W002 整合驗收」。

## 是否已正式發布

- **否**。W002 尚未滿足 `AGENTS.md` §3.4（完成＋測試＋q 確認）。`appVer`、`sw.js` 的 `VERSION` 都未動。

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
