# AI HANDOFF

> 本檔是 Claude Code、GPT Work、Codex 之間切換時最重要的文件。
> **每個 AI 工作結束或即將切換時，必須更新本檔。** 規則見 `AGENTS.md` §7。
> 下方是目前的**實際狀態**；固定模板見文末「模板」。
> **目前最新整合預覽（W004第八十四輪，含W005）：** `https://raw.githack.com/dppss92044/yogacara/26f3d3d7bfa981d92de9794930a471e110e6d4e1/index.html`。程式SHA `26f3d3d7bfa981d92de9794930a471e110e6d4e1`；下方各歷史輪次網址不代表最新。

---

## 進行中：W005（卷次欄置頂與點選穩定）
### 最新位置微調（Codex，2026-10-10）
- q 預覽後追加：「點科判欄位的標題時，左邊卷次……五等份……改到2等份」「中間……標題顯示，太高了，請再下來一點」「某卷……置頂……多一點空白……空白而不是字」。同一個 W005，已先補 D108 位置微調，沿用 `work-w004-map-entry`。程式 commit `543ec08bbd8d28d7af9db83e133844b0d6354009`，已成功推送。
- 右側單擊／頁首／往上層／（分N）選取後，左欄反白標題中心改到百卷清單下方可捲動區的 30%（五等份第二格）；單欄返回卷次頁沿用此位置。直接點左欄仍保留位置；主動正文閱讀的左欄對焦保留原 50%，避免將此次明確點選要求套用到閱讀追蹤。
- 正文定位從兩行改為兩行加半行留白，即 2.5 行高度，比前一預覽稍微下移。獨立以 Range 量相鄰正文行距：46.71875px，黃底頂端距工具列 116.421875px，即 2.492 行；桌面視覺截圖已檢視（`/tmp/yogacara-position-adjust-visual-test.cjs`、`/tmp/yogacara-position-adjust-preview.png`）。承接科判真實目標 id／返回正文／清除舊書籤的前輪修正保留。
- 左欄可捲動區頂部下移 12px，將純空白放在捲動區外；卷次起點仍對齊捲動區頂部，避免前插鄰卷文字被拿來充當空白。保留最後一卷的捲動空間補償與另選卷置頂。
- 跨卷／承接測試：桌面 1440×900、iPad 直向 820×1180、手機直向 390×844，各搭配藏／韓版，6 組、138/138 通過。DOM 點擊覆蓋右側祖先頁首、根標題、桌面／平板雙擊往上層、韓版（分N）、單欄返回正文／卷次頁、卷 2 承接科判。手機雙擊依既有三頁循環驗證同節點同步；藏版當頁無（分N），3 組列為不適用。`/tmp/yogacara-position-adjust-ancestor-test.cjs`、`/tmp/yogacara-position-adjust-ancestor-test.log`；此巡檢使用 DOM 事件，非實機觸控。
- 最終程式正常標題定位：桌面 1440×900、iPad 820×1180／1180×820、手機 390×844／844×390，另桌面正文與卷次倍率 80%／140%，各搭配藏／韓版，14 組、168/168 通過；包含右側點選左欄反白中心位於可捲動區 30%、12px 空白區高度、正文下移、單擊科判停原頁、單欄返回、無 pageerror。左欄位置回歸同 14 組、84/84 通過，含水平／垂直位置保持、延遲同步、返回卷次頁與 36／100 卷置頂。三份最終功能測試合計 390 項通過。腳本／結果：`/tmp/yogacara-position-adjust-test.cjs`／`.log`、`/tmp/yogacara-title-test.cjs`、`/tmp/yogacara-position-adjust-left-regression.log`。hasTouch 模擬觸控、isMobile=false 固定 viewport，非實機。
- Analytics 最終全量完整執行（既有 W001／v1.91 基底套件）：靜態 152 features／92 rules／26 states，0 失敗；動態 56 通過／97 不適用／3 手動／3 失敗（mac／ipad／iphone #reportBtn 未收到 report.open）；控制項掃描 #versionBtn、#mapBtn 未登錄或排除，合計 4 類失敗、exit 1，與前輪已記錄結果一致。此檢查未全數通過，未改 Registry／統計客戶端／測試斷言。命令 `PLAYWRIGHT_PATH=/tmp/yogacara-registry-playwright.cjs CHROME_PATH=/usr/bin/chromium node tools/check-analytics-registry.cjs`，helper 僅使用 hk-update-notice=off 與操作 timeout 500ms、navigation／waitForSelector 30 秒（套件明定點選仍 3 秒）；結果 `/tmp/yogacara-position-adjust-registry.log`。三個先前啟動的全量檢查因後續程式修正／新需求中止，未算完整執行。中止前曾見 iPad 分頁統計事件未收到，隔離同操作基底 b0f9eec／本次 92baede 各 1/1 收到 phone.screen.catalog（`/tmp/yogacara-screen-analytics-isolation.cjs`／`.log`）；最終全量該規則通過，未為此更改程式。
- 最新固定程式預覽：`https://raw.githack.com/dppss92044/yogacara/543ec08bbd8d28d7af9db83e133844b0d6354009/index.html`。Git 推送成功；前一程式預覽的 curl 仍遭雲端 CONNECT 403，未驗證本公網網址載入。
- 未測 Safari、iPhone／iPad 實機、PWA 更新、列印或其他歷史 fixtures。未升正式版本、未改 sw.js／資料、未推 main、未開 PR、未部署正式站。暫存檔僅本次使用。

### 前輪補正：右側同步與正文標題上移（Codex，2026-10-10）
- q 本次明確要求：「點右邊科判後，左邊卷次有些不會跟著跳，修正」「點左邊卷次或是右邊科判欄位，中間的標題黃底的標籤……上面預留前文的兩排字就好」。同一個 W005，從 `7d44897` 接續，已先記錄 D108 再補充，取代前輪右側點選保留左欄位置的部分。正式發布仍由 q 另行通知。
- 程式 commit：`92baedef2f9995e2c484b1dbf396dfe5c0288528`，已推送 `work-w004-map-entry`。右側科判／頁首／雙擊往上層／（分N）明確選取時，釋放先前左欄保存位置與手動水平對焦鎖定，左欄同標題捲入可見處；直接點左欄／正文仍保留左欄水平、垂直位置。保留 W002 的節點自身卷次來源及單擊科判不換頁契約。
- 正文明確定位改為工具列下兩行正文的實際行高（含 CSS zoom／文字倍率），以可見底部及底部分頁列為界；手動閱讀的 2/6 追蹤線未改。改用 `readerHeading` 回傳的真實元素 id，避免承接標題定位到前卷原始標題或當前卷子科。單欄回正文與雙擊回正文沿用相同目標；`carryFocus` 清除舊正文書籤，避免返回時舊閱讀位置覆蓋明確選取。
- Chromium 固定 viewport／觸控模擬：桌面 1440×900、iPad 820×1180／1180×820、手機 390×844／844×390，另桌面正文與卷次倍率 80%／140%，各搭配藏／韓版，共 14 組。一般標題定位／右側單擊同步 140/140 通過（先點左欄保存位置、手動把左欄目標移出畫面、再點右側；檢查節點自身卷次、單擊科判停原頁、正文黃底標題上移、單欄返回左欄同標題可見、無 pageerror）。左欄位置回歸 84/84 通過（水平＋垂直取樣、3.5 秒延遲同步、單欄返回、36／100 卷置頂）。腳本與結果：`/tmp/yogacara-right-sync-test.cjs`、`/tmp/yogacara-right-sync-test-final.log`、`/tmp/yogacara-title-test.cjs`、`/tmp/yogacara-title-right-sync-left-final.log`；固定 viewport、isMobile=false，非實機。
- 額外檢查：桌面兩版部分可見標題點選保持位置、真實正文滾輪恢復跟隨均通過（`/tmp/yogacara-title-right-sync-edge.log`）；正文前文以 Range 測得相鄰文字行距 46.71875px，黃底頂端距工具列 93.421875px，即 1.9997 行（`/tmp/yogacara-two-lines-visual-test.cjs`、`/tmp/yogacara-two-lines-preview.png`）。
- 前輪跨卷／承接與 Analytics 未完整完成，後續位置微調的最終結果見上方；手機雙擊初輪錯把既有三頁循環當作平板的往上層，已修正測試預期，未改手機雙擊行為。中途跨卷檢查找出 iPad 承接標題返回正文被舊書籤覆蓋（63.58px 而非約 132px），已修正並隔離重跑 20/20 通過（`/tmp/yogacara-carry-position-fixed.log`）。前三次 Analytics 執行因後續定位修正及 q 新的位置要求而中止，不能算完整執行或通過。
- 新固定程式預覽：`https://raw.githack.com/dppss92044/yogacara/92baedef2f9995e2c484b1dbf396dfe5c0288528/index.html`。Git 推送成功；雲端對 raw.githack.com 的 CONNECT 仍回 403／HTTP 000，未在此環境驗證公網載入。
- 未測 Safari、iPhone／iPad 實機、PWA 更新、列印或其他歷史 fixtures。未升正式版本、未改 sw.js／資料、未推 main、未開 PR、未部署正式站。暫存測試檔僅本任務使用，不假設下次仍存在。

### 前輪補正（Codex，2026-10-10）
- q 接續回報：「但是點下去某卷的科判標題時，就又會跳轉，這部分也修正」。後續明確要求做完並提供預覽，正式發布由 q 另行通知。本次從 `bee983d` 接續同一個 W005，沿用 `work-w004-map-entry`；程式 commit `b0f9eece76d086ec101e3a6f4afc49c1b94c1e2d`。已先補 D108 決定，再改程式與規格。
- 根因實測：桌面點卷次欄標題仍水平移動約 56px；點正文標題／右側科判仍走 `focusRailCamera` 垂直置中（藏版正文例 −90px、韓版例 −121px）。單欄介面回到卷次頁亦無位置還原；2.5 秒的正文定位解鎖可能使後續程式 scroll 重新反白其他標題。
- 修正：標題點選保存卷次欄水平／垂直位置，直接定位與後續自動同步不再重新置中；返回卷次頁先還原保存位置，再填充相鄰卷與反白。卷次欄手動捲動會更新保存位置；主動正文滾輪／觸控捲動／閱讀按鍵／正文捲軸操作釋放保存狀態、恢復既有跟隨。另選卷號／重建卷次欄仍置頂並清除保存狀態。承接科判同樣保存位置並取消遲到的卷首定位。正文／科判仍依原有節點與卷次連動，保留 W002 的卷次來源規則。
- 最終程式 Chromium 固定 viewport：桌面 1440×900、iPad 820×1180／1180×820、手機 390×844／844×390；另桌面卷次倍率 80%／140%，各搭配藏／韓版，共 14 組、84/84 通過。檢查水平＋垂直連續取樣不移動、延遲 3.5 秒後再觸發程式 scroll 不改選取、單欄返回後同一標題的相對位置不變、重選 36 卷與 100 卷置頂、無 pageerror。桌面主要倍率 120%，平板／手機 100%，正文 100%；hasTouch 模擬觸控、isMobile=false 固定 viewport。`/tmp/yogacara-title-test.cjs`、`/tmp/yogacara-title-test-final.log`。初輪發現韓版直向 iPad 的延遲同步改選取，已修正再重跑，最終通過。
- 額外操作檢查：桌面與手機直向、兩版在選卷後 150ms 立即點第 2 卷標題（藏版為承接科判），24/24 通過，仍在 #j2；`/tmp/yogacara-title-carry-test.cjs`／`.log`。兩版桌面視窗下緣部分可見標題點選不移動，真實正文滾輪恢復選取與卷次欄跟隨，均通過；`/tmp/yogacara-title-edge-test.cjs`／`.log`。兩版桌面卷次／正文／右側科判標題點擊 6/6 保持兩個捲軸位置；`/tmp/yogacara-title-debug.cjs`、`/tmp/yogacara-title-fixed.log`。這些 /tmp 檔案僅本次暫存，下一任務不假設存在。
- Analytics 完整套件本輪執行（原 W001／v1.91 基底）：靜態 152 features／92 rules／26 states，0 失敗；動態 56 通過／97 不適用／3 手動／3 失敗（mac／ipad／iphone #reportBtn），控制項掃描 #versionBtn、#mapBtn 未登錄或排除，合計 4 類失敗、exit 1，與前輪初次檢查一致。未算通過、未修改統計／Registry／測試斷言。命令 `PLAYWRIGHT_PATH=/tmp/yogacara-registry-playwright.cjs CHROME_PATH=/usr/bin/chromium node tools/check-analytics-registry.cjs`；helper 設定支援的 hk-update-notice=off 偏好、操作預設 timeout 500ms、navigation／waitForSelector 30 秒，原套件點選仍為 3 秒。結果 `/tmp/yogacara-w005-followup-registry.log`。
- 本次固定程式預覽網址：`https://raw.githack.com/dppss92044/yogacara/b0f9eece76d086ec101e3a6f4afc49c1b94c1e2d/index.html`。程式與交接已成功推送 `work-w004-map-entry`，git ls-remote 確認遠端分支；此環境對新網址的 curl 仍回 CONNECT 403（HTTP 000），因此公網頁面載入未驗證，功能證據來自本機 Chromium。只推獨立預覽分支，不推 main；正式 v1.92、sw.js／資料維持原值，未開 PR、未正式部署。尚未測 Safari、iPhone／iPad 實機、PWA 更新、列印；未重新執行前輪全部 100 卷巡檢或其他歷史 fixtures（本輪針對標題定位／返回捲動，保留前輪測試歷史）。

### 前輪紀錄（Codex，2026-10-09；下列水平對焦行為已由上方補正取代）
- 正式基底 v1.92（main `4b7cac1`），接續 W004 獨立預覽 `1df6008`；沿用工作／預覽分支 `work-w004-map-entry`。程式修改 commit：`9a3043fb03ad57f33a8f5a66724516a35b1bb1b7`。最新交接 HEAD 以 Git 為準。
- 使用者原始需求（附卷目次截圖）：「把左上設為預設開啟。然後點下去每一個卷的時候，下面的卷次欄位的該卷，都要在下面的卷次欄位置頂。比如點36卷……目前是還會看到35卷的後段。而點36卷的內容，卷次欄位頁面不要上下晃動。」已先記錄 D108，取代 D019 預設收起要求，再改程式；同步 PROJECT_SPEC、UI_SPEC、PROJECT_STATE、CHANGELOG。
- 桌面／平板百卷清單初始化為展開、仍可手動收起；手機獨立浮窗保持原操作。選卷包含重選目前卷都重建卷次欄並置頂；以實際畫面座標補償 CSS zoom 與前插／移除鄰卷，預填後續短卷、補足第 100 卷最後捲動空間、略過隱藏欄位填充。卷次欄點科判時只保留垂直位置，既有水平對焦、正文與科判欄連動仍保留；選卷／科判點選重設正文同步等待計時，避免重選同卷被舊計時提前解除鎖定。
- 針對性 Chromium 固定 viewport 操作檢查：桌面 1440×1000、iPad 直向 820×1180／橫向 1180×820、手機直向 390×844／橫向 844×390，另桌面卷次倍率 80%／140%，各搭配藏經版與韓版，共 14 組、126/126 項通過（初始展開、1／2／18／35／36／37／100 卷置頂、點科判期間可見欄位捲動位置不變、重選 36 卷、無 pageerror）。前五種版面卷次倍率 120%、正文 100%，觸控版面設定 hasTouch；isMobile=false 固定 viewport，未宣稱實機。手機／平板直向點卷內項目仍沿用自動切回正文，位置取樣只涵蓋卷次欄可見期間。腳本／結果 `/tmp/yogacara-volume-navigation-test.cjs`、`/tmp/yogacara-volume-navigation-test.log`。
- 桌面兩版捲到卷內較下方，再點可見項目，連續取樣 4 秒垂直位置保持不變並可重選卷置頂：4/4 通過，`/tmp/yogacara-mid-node-test.cjs`、`/tmp/yogacara-mid-node-test.log`。全部卷次初輪與最終程式重跑皆兩版 200/200 通過，`/tmp/yogacara-all-volume-test.cjs`、`/tmp/yogacara-all-volume-final.log`。
- Analytics 完整性檢查完整執行兩次（既有 W001／v1.91 基底套件）。初輪靜態 152 features／92 rules／26 states，0 失敗；動態 56 通過／97 不適用／3 手動／3 失敗（3 版面 #reportBtn），控制項掃描另有 #versionBtn／#mapBtn 未登錄或排除，合計 4 類失敗、exit 1。最終重跑靜態仍 0 失敗；套件彙總動態 55 通過／97 不適用／3 手動／4 失敗，實際 FAIL 日誌另包括 mac kepan.xref、iphone edition.entry.menu（同一規則鍵被後續紀錄覆寫，彙總數與 FAIL 行數不同），加控制項掃描合計 6 類失敗，exit 1。檢查未全數通過。未修改 Registry／統計客戶端／測試斷言。命令 `PLAYWRIGHT_PATH=/tmp/yogacara-registry-fast-playwright.cjs CHROME_PATH=/usr/bin/chromium node tools/check-analytics-registry.cjs`；helper 僅設定更新通知偏好 hk-update-notice=off、操作預設 timeout 300ms、navigation／waitForSelector 30 秒（原套件點選明定 3 秒）；結果 `/tmp/yogacara-w005-registry.log`、`/tmp/yogacara-w005-registry-final.log`。
- 最終統計套件另曾在 mac kepan.xref、iphone edition.entry.menu 沒收到事件。以同樣啟動／實際操作／模擬時鐘／flush 步驟隔離重現：kepan.xref 本次 2/2、未修改基底 2/2 收到事件；edition.entry.menu 本次 1/1、未修改基底 1/1 收到事件。無法穩定重現，不能把完整套件失敗算成通過；未為此修改無關程式。暫存腳本與結果 `/tmp/yogacara-xref-isolation.cjs`／`.log`、`/tmp/yogacara-edition-isolation.cjs`／`.log`。
- 程式 commit `9a3043f` 已成功推送到獨立分支 `work-w004-map-entry`（未推送 main）；本次固定程式 commit 網址 `https://raw.githack.com/dppss92044/yogacara/9a3043fb03ad57f33a8f5a66724516a35b1bb1b7/index.html`，避免沿用舊分支網址的快取。此雲端 egress proxy 先前對 raw.githack.com CONNECT 回 403，未在本環境驗證公網頁面載入；本機 Chromium 功能測試已完成。
- 未測 Safari、iPhone／iPad 實機、PWA 更新、列印；未執行其他歷史 fixtures 或舊版回歸套件。未升版、未改 sw.js／資料、未 push main、未開 PR、未部署正式站。

## W004 第九十七輪（Claude，2026-10-10）
- 單按 ＋／−（含注音鍵位）＝層級開合（呼叫 `step('d+'/'d-')`）；說明動畫鍵盤相關列點分「快捷鍵」列；新增景「快捷鍵總整理」「＋／− 一層一層開合」（現共 15 景，觸控裝置多雙指景）。測試：Chromium 電腦，以 key／code 模擬 −、ㄦ(Minus)、＋、ㄧ(Equal)，層數 7→6→5→6→7 正確、截圖見 `/mnt/project-files/W004/round97/`；未測真實注音輸入法、手機。

## W004 第九十六輪（Claude，2026-10-10）
- 預覽建置每次開啟都強制跳 2.0 更新視窗（`window.__fu`，僅 `appVer`<2.0 時有效；`?preview=off` 可關）。**發布 2.0 時**升 `appVer` 即自動失效，不需另改程式。測試：Chromium 電腦／手機截圖已看（`/mnt/project-files/W004/round96/`）。

## W004 第九十五輪（Claude，2026-10-10）
- 移除「？」、「說明」按鈕（原重新說明）、順序改為 說明／全部／列印／設定。q 要求：之後每次都附更新畫面截圖（見 `/mnt/project-files/W004/round95/`）。測試：Chromium 電腦，控制列順序與說明開動畫已驗證、五張截圖已看；手機窄螢幕未測。

## W004 第九十四輪（Claude，2026-10-10）
- 動畫新增「點支線回上一層」；非觸控裝置略過雙指景（`orig[]` 保留原景編號給 CSS）。測試：Chromium 電腦，景列為 13 景且無雙指景、新景截圖已看；觸控裝置的 14 景未實測（pointer:coarse）。

## W004 第九十三輪（Claude，2026-10-10）
- F／C／E 改以 `e.code` 判斷（注音輸入法也可）；移除單純 ＋／− 縮放；動畫說明改手動上一步／下一步。測試：Chromium 電腦，模擬 key＝ㄑ／Process＋code KeyF 可開合、下一步不自動跳、最後一頁「完成」關閉、無 pageerror。未測真實注音輸入法、iPad／手機／實機。

## W004 第九十二輪（Claude，2026-10-10）
- 重新導覽改常駐按鈕；動畫簡介 13 景；移除簡介→逐步導覽的銜接（`tourStep` 程式與「？」單項說明卡仍在）。測試：Chromium 電腦，按鈕在、點後開簡介、後六景截圖已看（齒輪景面板已修剪）、無 pageerror。未測 iPad／手機（右上列變寬）／實機。

## W004 第九十一輪（Claude，2026-10-10）
- 「？」說明模式多「重新導覽」鈕（`[data-a=reguide]`）→開動畫簡介；簡介加 F 開展、F 後列印兩景（7 景）。測試：Chromium 電腦，重新導覽鈕只在按？後出現、點後開簡介、兩景截圖已看；未驗證列印實際輸出，未測 iPad／手機／實機。

## W004 第九十輪（Claude，2026-10-10）
- 2.0 通知卡加寬、改成只說「新增完整展開的科判圖」＋開啟按鈕；介面「脈絡圖」全改稱「科判圖」（index.html 內已無「脈絡圖」字樣；analytics/registry.json 的 what 描述與文件仍用舊稱，未動）。測試：Chromium 電腦／手機預覽通知截圖已看，按鈕開科判圖；未測 iPad／實機。

## W004 第八十九輪（Claude，2026-10-10）
- 提示框縮小 40%、「按F開合」＋「不再顯示」、拔除列印鍵（D107 第八十八輪）。測試：Chromium 電腦，點節點出現兩鈕、按不再顯示後再點不出現、無 pageerror；「按導覽恢復」只寫入 tourStep 起點，未實測按導覽後恢復。未測 iPad／手機／實機。

## W004 第八十八輪（Claude，2026-10-10）：2.0 更新通知預覽（未發布）
- q 要求整理 1.92→2.0 功能簡介、發布後首次開啟通知（除非關閉）、特別介紹脈絡圖，並給預覽。已記 D109。`versionNotes["2.0"]`（含 `hero`、`cta` 按鈕開脈絡圖）；`appVer`／`sw.js` **未升**；預覽網址加 `?preview=update`。通知多列「操作改善」，並加 `.upd-hero` 樣式。
- 測試（Chromium 電腦 1440×900、手機 390×844）：預覽網址顯示 v2.0 通知、「開啟脈絡圖」可開脈絡圖；一般網址（版本 1.92）不顯示 2.0。未測 iPad／Safari／實機；正式發布時須用 `tools/build_release.py` 升版並確認 `hk-update-notice` 關閉者不受打擾（沿用既有邏輯，未改）。

## W004 最新第八十七輪（Claude，2026-10-10）
- Ctrl／⌘＋＋／− 縮放、簡介動畫改列點並加縮放鍵、選卷後右上「回全覽」（`.km-backall`，`volPicked`／`backAllShow`）。已記 D107 第八十七輪。閃爍：q 後來說明是「生成 HTML」檔中點（分N）跳到支脈的閃爍，已由 5 下／2.5 秒改為 2 下／3 秒（`go()` 內 `f.animate`），僅改關鍵影格與 duration，尚未在瀏覽器實測動畫。測試：Chromium 電腦，選卷出現回全覽、按後回進圖、無 pageerror；Ctrl＋＋／− 只按鍵無錯，未量測縮放倍率。未測 iPad／手機／韓藏版／實機。

## W004 最新第八十六輪（Claude，2026-10-10）
- q 要求：左下百卷展開到頁面一半；預設編排改回一般；首次進圖加手勢動畫簡介。已記入 D107 第八十六輪。純 CSS 動畫五景（拖曳、滾輪、Ctrl＋滾輪、雙指、鍵盤），`window.introOpen`，「開始導覽」接 `tourStep(0)`。
- 測試（Chromium 電腦 1440×900）：簡介自動出現、各景截圖已看、開始導覽接原導覽、卷次欄寬 720/1440、compact=0、無 pageerror。未測 iPad／手機／韓藏版逐項／實機。

## W004 最新第八十五輪（Claude，2026-10-10，預覽施工，接手 GPT 中斷）
- q 要求：百卷移到最下面、縮小、可收合成左下卷軸圖示；「回去」改回上一步；預設縮緊編排；首次進圖導覽（可略過、可不再顯示）；介面刪「直書／全覽／目前」；刪除閱讀頁所有大小按鍵。已記入 D107 第八十五輪。基底 `86a6010`（work-w004-map-entry），工作分支 `claude/project-thread-4e9on8`。只改 `index.html` 與 DECISIONS／本檔；未升版、未改 sw.js／資料。
- 實作：快照堆疊 `viewStack`（pushView 於選卷／全部／只看這個前；restoreEntry 彈出上一步，空則回進圖）；導覽加 `.km-tour-off` 勾選；舊導覽「目前」步驟改為「返回上一步」（保留索引不變）；三鍵以 CSS 隱藏（程式仍引用）；`.book-size-button`／`.font-pane-row` CSS 隱藏。
- 測試（Chromium 1440×900，兩個臨時腳本，不在 repo）：進圖導覽自動出現、略過可關、km-tour-off 時不出現；卷軸圖示收合／展開；選卷→全部→選卷→返回→返回依序回到上一步，最後回進圖；compact 預設 1；無 pageerror；inline JS 語法通過。**未測**：iPad／手機直橫、韓版、藏版逐項、Safari／實機、列印、Analytics 套件。

## W004 最新第八十四輪（Codex，2026-10-10，預覽施工）
- q 最新要求：支線點選源頭置中偏上且文字可讀；同類問號只留代表；百卷改頁頂單排圓球，取消五部分／十七地；圖面拖曳／滾動不可無盡超出；小分支正常字級可容納時直接展開，大分支才給全部／一部，全部需可讀。先追加D107第八十四輪，覆蓋前輪原倍率／正中央／主題布局規格，仍W004預覽、不正式發布。
- 已實作：支線實際父階以max(100%,目前倍率)定位到水平中央、可用圖面上部；保留模型／範圍／層數和收合。百卷36px圓球、14px字、單排可滑動／滾輪。功能類型去重問號；現有靜態置中卡及虛線保留。根據完整分支在100%的實際尺寸判定直接展開或選全部／一部；全部與一部均sc=1，可容納分支完整留在螢幕內。所有平移入口共用實際圖邊界與有限定位邊距限制，保留原入口狀態返回。
- 功能10組929/929通過（藏／韓×電腦1440×900、iPad820×1180／1180×820、手機390×844／844×390）：原生滑鼠／觸控、圓球單排尺寸／移動、卷次選擇、同類問號縮減、小分支直接／大分支全部及五層一部且100%、支線在入口／全覽／160%下選實際父階並置中偏上、hover、四方向有界平移與倍率、入口／分支返回精確狀態、返回原閱讀位置及無pageerror。`/tmp/round84-test.cjs`、`/tmp/round84-matrix-final.log`。其後僅補色彩變數沿用明暗主題與移除無效空行，未改功能。早輪矩陣919/919亦通過，但只計最後929；早輪圓球CSS層疊被舊規則覆蓋已修正，小分支另補可用圖面邊界定位。
- 邏輯直／橫、心智、括弧直／橫、樹狀及時間軸桌面兩版14組72/72（`/tmp/round84-geometries.cjs`、`.log`）：實際支線點擊、父階淡灰提示、置中偏上與可讀倍率，保留圖面範圍／層數／數量。原生滾輪／方向鍵／拖曳停在同一圖面邊界、百卷列滾輪首尾、有界捲動、小分支全部在可用區、深色主題22/22（`/tmp/round84-native.cjs`、`/tmp/round84-native-complete.log`）。此測試最初在既有0.6秒背景色過渡完成前判定色彩，後改等待實際顏色穩定；未為此改App動效。
- 4段inline JS語法及git diff --check通過。說明10組130/130通過（`/tmp/round84-help-final.cjs`、`.log`）：百卷說明與固定卡／虛線、介面必要子選單、無動畫預覽、當前節點減號與對應虛線、入口版本還原；初次簡版說明110/110亦通過。最終Analytics全量完整執行：靜態152 features／92 rules／26 states，0失敗；動態56通過／97不適用／3手動／3失敗（mac／ipad／iphone的#reportBtn未收到report.open），控制掃描#versionBtn／#mapBtn未登錄或排除，合計4類失敗、exit 1，與前輪一致，未全數通過。命令 `PLAYWRIGHT_PATH=/tmp/yogacara-registry-playwright.cjs CHROME_PATH=/usr/bin/chromium node tools/check-analytics-registry.cjs`，`/tmp/round84-registry-final.log`。既有W001／v1.91基底套件、helper同前輪；未改Registry／統計／既有測試斷言。首次全量在補明暗色彩變數時中止（exit130），不算完整。前輪原主題／原倍率規格與測試為歷史紀錄，不當作本輪驗證。
- 程式commit `26f3d3d7bfa981d92de9794930a471e110e6d4e1` 已推送並git ls-remote核對；固定預覽 `https://raw.githack.com/dppss92044/yogacara/26f3d3d7bfa981d92de9794930a471e110e6d4e1/index.html`。此雲端先前CONNECT403，本輪未驗證公網載入；已以本機Chromium功能驗證。後續只提交交接紀錄，固定程式SHA不變。
- 只修改index及現行交接／規格文件；未升正式版本、未改sw.js／資料、未push main、未開PR。Safari與實機、真正紙張／PDF列印及PWA更新尚未驗證。

## W004 第八十三輪紀錄（Codex，2026-10-10，預覽施工）
- q 最新明確要求：全部全覽後變返回；右下入口更右／更大，進圖後同尺寸同位置回主頁；列印移到右上四鈕；主題拔出齒輪，左上百卷下接五部分／十七地，齒輪只留卷次／介面且底框統一；只看這個在左、列印在右；取消置頂橫書淡黃標籤；分支回去精確還原進圖狀態；任何倍率點支線只定位上位標題、倍率不變，滑過淡灰且移開消失。先追加D107第八十三輪，沿用work-w004-map-entry，不正式發布。
- 完成入口48px／圖示26px、距右14px，脈絡圖在同座標保留圖示＋回主頁；全覽／返回切換。進圖後保存版本資料、模型、獨立收合陣列、圖形／字級、倍率、範圍、層數、選取與平移；返回或分支回去還原該快照，不重新建圖造成位置落差。
- 左上百卷沿用主頁十欄與可見時的實際字／按鍵尺寸；原主頁卷次欄隱藏時使用有效字級與縮放備援，避免iPad直向或手機清單高度變0。窄版百卷預設收起，五部分／十七地用可展開單欄選單。齒輪只留卷次／介面，34px／9px圓角、置左／垂直置中與主題一致。
- 取消新增的頂部橫書標籤，分支全部／一部與圖內淡黃選取保留。節點選單與右上／左上面板、回主頁鈕碰撞時自動避讓，修正手機分支「回去」被遮住。列印原功能移到右上圖示，節點列印仍全支脈且圖示在右。
- 支線命中使用現有分區索引，保留實際父階，任何倍率、範圍均可用；邏輯／心智／括弧／樹狀／時間軸支線幾何，括弧弧角採分段曲線。點線只平移上位標題到中央並選取，不重建、不改倍率／範圍／層數。滑鼠灰色帶與點擊游標、離開清除；低倍率保留淡黃定位標記。表格格線／時間軸主軸沒有實際母支脈，不偽造父階。
- 最終功能10組692/692通過（藏／韓×電腦1440×900、iPad820×1180／1180×820、手機390×844／844×390）：原生滑鼠／觸控入口與回主頁同尺寸同位置、四工具／列印移出、百卷／22主題、齒輪統一底框、選單左右順序、無置頂橫書標籤、分支全部／回去、全覽／返回精確狀態、原比例100%／全覽／160%支線點選及置中、灰色hover與離開、無意外列印、返回原閱讀位置與無pageerror。`/tmp/round83-test.cjs`、`/tmp/round83-matrix-complete.log`。
- 說明10組130/130（`/tmp/round83-help.cjs`、`/tmp/round83-help-complete.log`）：主題／十七地必要選單展開、卡片固定、虛線對應移動後位置、無示範預覽、介面子選單、還原主題選單及進圖版本。此輪在最後節點選單觸控防誤點修改前執行，說明引擎其後未改。
- 分支全部支脈列印＋移到右上普通列印18/18（桌面兩版，`/tmp/round83-print.cjs`、`/tmp/round83-print-final.log`）；全覽後進分支再按右上返回、旋轉螢幕還原入口倍率及置中8/8（手機兩版，`/tmp/round83-return.cjs`、`/tmp/round83-return.log`）。主題20/20（`/tmp/round83-themes.cjs`、`/tmp/round83-themes.log`），調整helper為左上主題／details入口。W005既有位置168/168（`/tmp/yogacara-context-reader-regression.cjs`、`/tmp/round83-reader.log`），在最後圖面選單調整前，讀者定位程式未改。
- 支線幾何58/58（桌面兩版：邏輯直／橫、心智、括弧直／橫、樹狀、時間軸，共14組，`/tmp/round83-geometries.cjs`、`/tmp/round83-geometries.log`）：原生灰色hover、點線選實際母標題，倍率／範圍／層數／節點數／分支限制不變。
- 鍵盤12/12（桌面兩版，`/tmp/round83-keyboard.cjs`、`/tmp/round83-keyboard.log`）：C收合、F進分支／回去後收合與入口狀態還原，Enter可操作節點次選單／全部／回去，觸控防誤點未封鎖鍵盤。
- 原生觸控找出真正誤點：canvas點線後出現的新節點選單可能接到該手勢合成click，意外開列印。節點選單click現在須有始於同一按鈕的pointerdown（鍵盤／程式click仍可用）；韓版手機隔離66/66及最終全矩陣均通過，沒有用更慢操作時間掩蓋產品bug。
- 初輪矩陣中止：iPad隱藏主頁清單導致複製縮放0（產品已修）；手機分支回去被工具列遮住（產品已修）；helper只取長線的整段百分比，或只掃支線其中一段，未找到放大後可見線段，改成實際畫面內截取各段並仍用原生點選；誤開列印隔離後修產品並全量重跑。中止執行不得算完整。Analytics先前執行因後續修正中止，只有最後verified執行算完整，結果如下。
- 最終Analytics完整執行：靜態152 features／92 rules／26 states，0失敗；動態56通過／97不適用／3手動／3失敗（mac／ipad／iphone的#reportBtn未收到report.open）；控制掃描#versionBtn／#mapBtn仍未登錄或排除，合計4類失敗，exit 1。`PLAYWRIGHT_PATH=/tmp/yogacara-registry-playwright.cjs CHROME_PATH=/usr/bin/chromium node tools/check-analytics-registry.cjs`；`/tmp/round83-registry-verified.log`。既有W001／v1.91基底套件，未更改registry、統計客戶端、套件斷言或歷史fixtures；未把失敗列為通過。
- 最終4段inline JS語法及git diff --check通過。程式commit `dcaa08b5cdb7c933ecbfa60cbf7b4b8d9f86ebcd` 已推送並git ls-remote核對；固定預覽 `https://raw.githack.com/dppss92044/yogacara/dcaa08b5cdb7c933ecbfa60cbf7b4b8d9f86ebcd/index.html`。此雲端前輪CONNECT403，本輪未驗證公網載入；後續只提交測試／交接文件，預覽程式SHA不變。未升版本、未改sw.js、未發布main或PR。
- 均為Chromium／hasTouch模擬，非Safari或實機；未測真正紙張／PDF列印、PWA更新。

## W004 第八十二輪紀錄（Codex，2026-10-10，預覽施工）
- q 要求移除動畫操作示範及示範預覽、縮小五部分／十七地清單並修正對齊、空白處關閉功能／說明、節點加減旁的問號、分支列印圖示預設全部支脈、只看此支的「全部／一部」，以及低倍率全圖長線點選回最近母標題。先追加 D107 第八十二輪，沿用 work-w004-map-entry；不升正式版、不改 sw.js。
- 動畫、播放／重播、示範區與自動輪播移除。說明只保留固定置中卡、短句列點、上一點／下一點與虛線，展開相應實際選單。正常列印功能本身的預覽保留，說明不開示範預覽。
- 主題面板最高寬320px，22項單欄，每項34px、文字置左且垂直置中；空白圖面／說明遮罩可關閉選單、齒輪與問號模式。問號模式才顯示當前可展開節點的減號，問號位於它上方；說明涵蓋−、＋、（分幾）及Ctrl／⌘滾輪／雙指。葉節點沒有不可用的加減問號。
- 節點列印改SVG圖示，預設所選支脈、全部層數、完整跨卷範圍。只看這個後選「全部」完整支脈或「一部」根層＋四層；以固定淡黃根標題置頂中央，圖面完整符合剩餘空間。窄螢幕根標籤避開控制列，低倍率節點小選單也避開控制列，修正手機按不到「只看這個」。切版／改範圍／回完整全圖不保留舊根標籤。
- 完整全圖低於32%時，真正點長支線會找最近命中的實際父節點並顯示五層；同距離優先較高層，甲一到各乙的共同長線回甲一。虛擬根連線不套用。範圍／樣式重建、螢幕旋轉後重新符合分支。
- Chromium 分支功能兩版×電腦／iPad直橫／手機直橫10組366/366；含原生點擊、全層／五層數量、完整跨卷範圍、根標籤置中、全圖真實長線點擊、旋轉後符合、列印全部後代與根路徑。`/tmp/round82-branch-qa.cjs`、`/tmp/round82-branch-final.log`。此執行在最後手機橫向說明控制位置修正之前，分支程式其後未改。
- 主題篩選20/20（`/tmp/round81-themes.cjs`、`/tmp/round82-themes.log`）；原生操作46/46（`/tmp/round81-native.cjs`、`/tmp/round82-native.log`）。W005既有位置回歸168/168（`/tmp/yogacara-context-reader-regression.cjs`、`/tmp/round82-reader-regression.log`），最後修正只涉及小選單／分支標籤與橫向說明位置，讀者位置程式未改。
- 最終說明／介面10組1030/1030通過（`/tmp/round82-ui-verified.cjs`、`/tmp/round82-ui-verified.log`），含22主題大小／文字對齊、實際空白關閉、相應選單展開、問號在加減上方、固定卡片／翻頁鈕／虛線、無動畫／示範預覽、瀏覽器返回及說明返回原位、無pageerror。已檢視手機直向主題、手機橫向節點導覽截圖。最終4段inline JS語法及git diff --check通過。Analytics全量結果如下；未正式發布。
- 最終Analytics完整執行：靜態152 features／92 rules／26 states，0失敗；動態55通過／97不適用／3手動／4失敗（mac／ipad／iphone的#reportBtn未收到report.open，iphone #ftBtn未收到settings.page.font）；控制掃描#versionBtn及#mapBtn仍未登錄／排除，合計5類失敗，exit 1。命令 `PLAYWRIGHT_PATH=/tmp/yogacara-registry-playwright.cjs CHROME_PATH=/usr/bin/chromium node tools/check-analytics-registry.cjs`，結果 `/tmp/round82-registry-final.log`。本輪第一次執行因橫向說明位置修正中止，只有final結果算完整；未修改registry、統計客戶端或既有套件。
- 程式commit `e404fe8fe38a25920f97c0aed1da81fdae83570b` 已推送，git ls-remote核對相同SHA。固定預覽 `https://raw.githack.com/dppss92044/yogacara/e404fe8fe38a25920f97c0aed1da81fdae83570b/index.html`；此雲端前輪CONNECT403，本輪未驗證公網載入。後續只提交檢查／交接文件，預覽程式SHA不變。
- 全量手機字體事件未捕捉後，以同390×844、hasTouch／isMobile、clock、真實點選與端點攔截隔離：上一版a6455cf與本版均1/1收到settings.page.font（`/tmp/round82-font-isolation.cjs`、`/tmp/round82-font-isolation.log`），全量失敗不因此改列通過；未更改統計程式或測試斷言。
- 均為Chromium／hasTouch／CDP模擬，未測Safari、iPhone／iPad實機、實際列印或PWA更新；既有Analytics失敗不得視為通過。兩次UI巡檢因helper空白候選只掃面板覆蓋區／連點觸發既有雙擊縮放而中止，改實際空白座標與操作間隔重跑，未放寬產品斷言。

## W004 第八十一輪紀錄（Codex，2026-10-10，預覽施工）
- q 明確要求移動邏輯圖／標號／樣式到介面，主題直接單欄顯示五大部分／十七地、移除分支入口及地的本地分／攝決擇分來源切換、刪除選單圖面加減、卷次／層數分清、說明改各功能問號。先追加 D107 第八十一輪，承接同一 W004、分支 work-w004-map-entry；不發布正式版。
- 主題清單移入主題頁籤，使用功能面板單一捲軸；來源預設本地分，既有五部分／十七地主題篩選保留。圖形／標號／樣式移到介面，全部旁圖面加減保留；卷次及層數以固定前綴標示。
- 右上問號開啟／關閉說明模式並展開功能面板。可見且可操作控制旁的小問號跟隨面板捲動與版面變化；點個別問號只開該功能的置中短句說明，展開相關頁籤／子選單，保留虛線和可暫停／重播的動畫。上一步／下一步在該功能列點內移動，完成／關閉回到問號模式。圖面拖曳／縮放與快捷鍵另有左下問號；避免跟返回鈕重疊。
- 最終 Chromium 功能：電腦1440×900、iPad820×1180／1180×820、手機390×844／844×390，各搭配藏／韓版，共10組260/260通過。檢查單欄22主題、移除來源／分支／選單縮放鍵、介面配置、卷次／層數標示、問號模式、各功能展開、卡片固定、動畫入口、關閉回問號、返回原閱讀捲動位置、無pageerror。腳本／結果 `/tmp/round81-test.cjs`、`/tmp/round81-test-complete.log`。
- 動畫／還原128/128通過（電腦／手機直向兩版及減少動態偏好；`/tmp/round81-animation.cjs`／`.log`）。改自前輪動畫測試，選單／鍵盤入口改問號，架構與列印跨功能用暫存私有導覽呼叫，沒有更改產品測試斷言；6種架構、播放暫停、縮放、雙指示範、快捷鍵、列印限範圍示範與偏好還原均檢查。此測試在最後問號位置與主題單捲軸CSS微調前完成，動畫邏輯其後未改。
- 最終原生操作46/46通過：桌面1440×390／手機橫向844×390兩版；主題面板原生滾輪／CDP觸控捲動、Ctrl滾輪／雙指縮放、切換版本保留完整層數、節點操作與普通列印開關。`/tmp/round81-native.cjs`、`/tmp/round81-native-final.log`；移除舊分支按鈕點選，改使用直接主題面板。主題篩選20/20通過（桌面兩版，本地分／攝事分／五識身相應地／無餘依地及全部還原、原位返回；`/tmp/round81-themes.cjs`／`-final.log`）。最終圖面問號位置另以手機直向26項通過、檢視置中卡截圖；`/tmp/round81-visual.cjs`、`/tmp/round81-visual-final.log`。
- 最終 Analytics 全量完整執行（既有W001／v1.91基底套件）：靜態152 features／92 rules／26 states，0失敗；動態55通過／97不適用／3手動／4失敗（mac／ipad／iphone的#reportBtn未收到report.open，及ipad #contentBtn未收到settings.page.content）；控制項掃描仍有#versionBtn及#mapBtn未登錄或排除，合計5類失敗、exit 1。此套件未全數通過。命令 `PLAYWRIGHT_PATH=/tmp/yogacara-registry-playwright.cjs CHROME_PATH=/usr/bin/chromium node tools/check-analytics-registry.cjs`；結果 `/tmp/round81-registry-complete.log`。helper同前輪，僅提示關閉與操作timeout調整，未改套件明定點選3秒或斷言。
- ipad內容設定事件隔離：相同820×1180、hasTouch／isMobile、實際點選、攔截統計端點，前輪e10e643及本次各1/1收到settings.page.content（`/tmp/round81-content-isolation.cjs`、`/tmp/round81-content-ipad.log`）。全量該失敗未重現，但仍保留全量失敗，不把隔離成功當作套件通過；未為此更改產品。第一次隔離1024×768非觸控也各成功，非套件條件，僅作輔助。
- 程式commit `a6455cfa986eb11d53eaf10784bcf4a1640ffa99`，已推送並以git ls-remote核對。固定預覽 `https://raw.githack.com/dppss92044/yogacara/a6455cfa986eb11d53eaf10784bcf4a1640ffa99/index.html`；此雲端前輪CONNECT403，本輪未再次驗證公網載入。最後HEAD以Git為準，後續僅測試／交接文件提交。
- 以上 Chromium／hasTouch／CDP 模擬，不是 Safari／iPhone／iPad 實機；未重跑 W005 168項、PWA更新、PDF實際列印或歷史 fixtures。初輪回原位檢查在首頁初始定位過程取樣有差異，改為先選卷36科判穩定後取樣，產品返回邏輯未改；原生檢查找出主題雙捲軸後修正再通過。
- 兩次 Analytics 檢查因後續圖面問號位置與主題內層捲軸修正中止；不能列為完整執行。未更改 Registry／客戶端／既有測試斷言／歷史 fixtures。

## 進行中：W004（q 2026-10-06 11:19「脈絡圖」）
### 最新接續（Codex，2026-10-10，第八十輪，待預覽確認）
- q 追加原話：「刪除齒輪進去之後的導覽按鍵，重複了」及「說明可以有動畫嗎？特別是調整大小的鼠標之類的 還有快捷鍵。預覽說明，除了要有虛線之外……相對應的選單展開。逐一透過列點的說明文字，虛線對應該功能……畫面有預覽動畫。比如切換不同的心智圖模式……按下列印……」。先記錄 D107 第七十九輪補充與第八十輪，再改程式。沿用同一 W004、`work-w004-map-entry`，從 `12d2504` 接續，正式App仍v1.92；本輪程式commit `e10e6430289bae37937bf214b3933d4c9778d198` 已推送，遠端Git hash已核對。
- 齒輪移除重複導覽按鍵與舊 click 分支；只有右上「？」開啟說明。固定置中的15頁卡片（新增快捷鍵頁），固定預覽區、底部返回／關閉說明／上一步／下一步；窄高畫面只捲動說明內容。上方新增操作動畫、播放／暫停、重播；架構頁按「換架構」切換六種圖形。
- 每點文字可按、會淡黃標示；播放時每3.6秒輪播同頁說明點，逐點用金色虛線指向對應控制項並展開分支／架構／樣式／卷次／層級子選單，自動捲動讓該項可見。列印示範展開實際的限層選取預覽，紙張／PDF／HTML逐點指示；並排示範顯示正文控制項。設定與列印面板依卡片上方／側邊空間調整，保持目標可見且不被卡片遮住；SVG真正可見、目標框非零高度。
- CSS與RAF示範滑鼠拖曳、滾輪縮放、Ctrl／⌘／Shift、雙指捏合、方向鍵、＋−／F／C／E／Esc。架構使用原有 build 引擎、目前科判的少量節點，預覽及背景示範邏輯／心智／括弧／樹狀／表格／時間軸；快捷鍵頁實際輪替收合與展開的示範模型。示範暫用 private 圖面狀態，tourEnd還原模型、收合、分支、字級、樣式、倍率與座標、選單頁籤／原子選單／捲動、原並排正文與焦點，不儲存示範設定；閱讀器版本與選取不變。
- 列印增加prOpen(i,guide)的限層／當卷選取示範模式，使用原prDraw/prSvg生成實際預覽；只展示控制項，不按列印／HTML／PDF。示範prDraw不寫km-print4，Ctrl鍵不啟動列印預覽快捷操作；同頁逐點復用預覽，離開清理。prClose移除該預覽resize listener，避免重播累積；普通列印維持原預設。使用者要求減少動態時不自動播放／輪播，保留手動選點與圖形示範。
- 最終逐點矩陣：桌面1440×900、iPad直向820×1180／橫向1180×820、手機直向390×844／橫向844×390，各搭配藏／韓版，10組、5,870/5,870通過。15頁全部說明點：卡片／下一步位置完全固定、預覽不壓到文字、可見虛線與目標框、端點在畫面內／不被卡遮住、對應五類子選單及真實列印預覽展開、完成／關閉精確還原模型／倍率／字級／偏好，齒輪無重複導覽，以及頁面／說明返回、BrowserBack／Forward、原生CDP滑鼠back、Esc回原閱讀頁面與全部捲動位置，正文DOM保留／一般卷次歷史正常。`/tmp/yogacara-guide-animated-test.cjs`、`/tmp/yogacara-guide-animated-final3.log`。前一矩陣5,310亦通過，視覺檢查發現矮畫面預覽與文字接近，增加固定預覽區高度並補不重疊斷言後重跑最終矩陣。
- 動畫／還原補查：桌面與手機直向×兩版4組，再手機減少動態1組，112/112通過：實際sc隨播放改變、暫停不動、重播恢復、鼠標／雙指指示、六種model.ly依序更換、自動輪播、真實列印選取／嵌入prSvg預覽、14項模型狀態復原、km-style／km-print4／閱讀版本偏好不變，減少動態無CSS動畫／無輪播但手動點選可用。`/tmp/yogacara-guide-animation-controls.cjs`／`.log`。最終補查加上快捷鍵收合／展開、背景按C不影響暫停模型、動畫中BrowserBack精確還原閱讀器：同5組、128/128通過；`/tmp/yogacara-guide-animation-controls-final.cjs`、`/tmp/yogacara-guide-animation-controls-final.log`。最終補查讀取包含固定預覽區高度與重播修正的目前source，前一112檢查不另加計。
- 原生互動／普通列印回歸：原第七十八輪腳本、4組、46/46通過，桌面矮視窗／手機橫向×兩版，設定原生捲動、Ctrl滾輪／雙指縮放、換版全部展開、選節點／雙擊回正文、藏版分支普通列印預覽取消；`/tmp/yogacara-context-interactions.cjs`、`/tmp/yogacara-guide-animated-interactions.log`。W005讀者定位與跨版前往正文的前輪168+16項已通過，本輪未重跑該未改動的邏輯；本輪逐點矩陣仍檢查閱讀器所有位置與一般歷史返回。本輪最終功能檢查合計6,044項通過。
- 視覺檢視：桌面架構／列印、手機直向雙指示範與手機橫向列印選項，`/tmp/yogacara-animated-zang-desktop-5.png`、`/tmp/yogacara-animated-zang-desktop-12.png`、`/tmp/yogacara-animated-zang-phone-portrait-2.png`、`/tmp/yogacara-animated-zang-phone-landscape-12.png`。InlineJS四區／RegistryJSON與git diff --check通過；Analytics僅在原excluded項追加逐點按鈕，不增feature／rule／state、事件或資料維度，不改客戶端與舊測試。
- 最終Analytics全量完整執行（既有W001／v1.91基底套件）：靜態152 features／92 rules／26 states，0失敗；動態56通過／97不適用／3手動／3失敗（mac／ipad／iphone的#reportBtn未收到report.open）。控制項掃描另1類失敗：#versionBtn、#mapBtn未登錄或排除；總共4類失敗、exit1，未全數通過，與第七十七輪等已記錄問題相同。命令 `PLAYWRIGHT_PATH=/tmp/yogacara-registry-playwright.cjs CHROME_PATH=/usr/bin/chromium node tools/check-analytics-registry.cjs`，沿用既有helper的hk-update-notice=off、操作timeout500ms、navigation／waitForSelector30秒、套件明定點選3秒；未改斷言。結果 `/tmp/yogacara-guide-registry-final5.log`。此前五次因返回／SVG修正、使用者追加移除入口／動畫及最終視覺修正中止，不算完整執行，均exit130。最終檢查後未改index或Registry。
- 未測Safari、iPhone／iPad實機、PWA更新、真正瀏覽器列印／下載或其他歷史fixtures。未升版、未改sw.js／資料／正式摘要，未推main／開PR／部署正式站；正式發布等q另行指示。固定新程式預覽：`https://raw.githack.com/dppss92044/yogacara/e10e6430289bae37937bf214b3933d4c9778d198/index.html`。先前egress CONNECT403，未宣稱已驗證公網載入。

### 最新接續（Codex，2026-10-10，第七十九輪，待預覽確認）
- 本輪補充 q「刪除齒輪進去之後的導覽按鍵，重複了」：先記錄 D107 補充，再移除齒輪裡的導覽按鍵及其舊 click 分支；右上「？」是唯一說明入口。補充需求併入第八十輪完成；上輪置中／返回程式 `12d2504` 仍為已推送基底。
- q 原始需求：「說明欄位，要寫的簡單易懂。然後不要集中在左下，要在正中間……按下一步不會跑來跑去……有虛線連到對應位置，詳細說明，列點。換行。」追加：「按上一頁、滑鼠上一頁的按鍵，或是頁面中的返回，都可以回到本來的地方。」先補 D107 第七十九輪，再改程式；沿用同一 W004 與 `work-w004-map-entry`，從 `a724ae3` 接續。程式 commit `12d2504dd2170dd78f9d1412adb260aeec116608` 已推送，遠端 Git hash 已核對。
- 問號的14頁說明改固定正中央卡片，標題與3–4點短句分行列點。卡片高度、底部返回／關閉說明／上一步／下一步固定，第一頁上一步停用，最後下一步變完成。內容區可捲動；金色虛線連到對應功能並框示目標。導覽自動選對設定頁籤，調整設定面板的可見區與捲動位置，不移動說明卡；resize／orientationchange 重算連線。SVG 使用 hidden attribute 管理顯示，避免 SVGElement 的 hidden expando 不會反映 DOM 的問題。
- 上一步回前一說明頁；關閉說明／完成／Esc 恢復開啟說明前的設定頁籤與捲動位置。對話框補標題、aria-live、Tab循環與圖面快捷鍵隔離，避免導覽期間背景移動。
- 開圖增加同網址 history 項目；瀏覽器上一頁、原生滑鼠側鍵返回、齒輪返回、說明卡返回與關圖 Esc 回原閱讀位置，瀏覽器前進可重開圖。共用 popstate／hashchange 加入圖面歷史守衛，避免原 route 先重繪正文／把手機切回正文頁。保存根頁與七個既有捲動容器的位置；history.scrollRestoration 暫用 manual，返回時恢復原設定。以相對 scrollBy 恢復根頁位置，避免 scrollTo 被既有 scroll-snap 拉到卷首。刻意點節點／並排「在閱讀器開啟」則等返回歷史完成後才選目標，保留跨版前往正文。
- 導覽／歷史最終矩陣：藏／韓版×桌面1440×900、iPad直向820×1180／橫向1180×820、手機直向390×844／橫向844×390，共10組、1,480/1,480通過。每組14頁卡片與下一步座標完全固定，3–4點短句、SVG實際可見／虛線／端點在畫面內且不被卡遮住，上一步、完成、重播／關閉恢復設定，以及頁面／說明返回、瀏覽器Back／Forward、CDP原生滑鼠back、Esc精確恢復頁面與全部捲動位置，原正文DOM保留，離圖後一般卷次歷史仍正常。入口用實際 mouse.click／touchscreen.tap，避免 Playwright locator.click 的自動 scrollIntoView 先改變閱讀位置。`/tmp/yogacara-guide-test.cjs`、`/tmp/yogacara-guide-test-final2.log`。
- 原生互動回歸沿用第七十八輪測試：桌面矮視窗1440×390／手機橫向844×390×兩版，4組、46/46通過，包含設定原生滑動、Ctrl滾輪／雙指縮放、換版全層、選節點、雙擊回正文、藏版分支列印預覽取消；`/tmp/yogacara-context-interactions.cjs`、`/tmp/yogacara-guide-interactions-final.log`。並排選取新節點再「在閱讀器開啟」補查桌面／手機×兩版互換，4組、16/16通過，前往所選節點與新版且延遲後仍相同；`/tmp/yogacara-guide-new-node.cjs`／`.log`。補查初稿在換版後全圖根節點尚無正文時找標題失敗，改用既有下一卷載入第一卷再選標題，未為測試改 App。
- W005回歸沿用前輪測試：兩版×五種版面，另桌面正文與左欄倍率80%／140%，14組、168/168通過；右點科判左欄30%、12px純空白、正文2.5行定位、同頁與單欄返回。`/tmp/yogacara-context-reader-regression.cjs`、`/tmp/yogacara-guide-reader-final.log`。本輪功能檢查合計1,710項通過；不是 Safari／iPhone／iPad 實機結果。
- 檢視最終桌面、手機直／橫向說明截圖，確認置中、短句列點、固定按鈕、金色虛線；`/tmp/yogacara-guide-zang-desktop.png`、`/tmp/yogacara-guide-zang-phone-portrait.png`、`/tmp/yogacara-guide-hk-phone-landscape.png`。Inline JS四區／Registry JSON解析與git diff --check通過。Analytics只在既有純圖面 excluded 項追加逐步說明按鈕，未改 feature／rule／state、事件維度、統計客戶端或舊測試。
- 此前檢查已因追加需求中止，無完整結論；最終 Analytics 全量結果見第八十輪；命令 `PLAYWRIGHT_PATH=/tmp/yogacara-registry-playwright.cjs CHROME_PATH=/usr/bin/chromium node tools/check-analytics-registry.cjs`，helper沿用前輪timeout與更新通知設定。最終結果檔 `/tmp/yogacara-guide-registry-final3.log`。前三次全量因後續返回／SVG修正及使用者新增移除入口要求中止，exit130，不算完整執行。
- 未測 Safari、實機、PWA更新、瀏覽器真正列印或其他歷史fixtures。正式 App 仍v1.92，未改sw.js／資料／正式版本摘要、未推main、未開PR；q另行確認才可正式發布。固定程式預覽：`https://raw.githack.com/dppss92044/yogacara/12d2504dd2170dd78f9d1412adb260aeec116608/index.html`；Git推送已確認。公網預覽載入先前遭 egress proxy CONNECT403，未宣稱本環境已驗證此網址載入。

### 最新接續（Codex，2026-10-10，第七十八輪，待預覽確認）
- q 原始需求：「後面的那個脈絡圖，幫我點下去之後，會呈現在目前的分支。這分支，一樣是全部展開的圖，只不過以當前所選取的科判脈絡為正中心，並且標記淡色黃。大小100趴。字的大小約莫12。然後頁面很乾淨，只有一個齒輪的按鍵跟『全部』的按鍵。按下齒輪，就會看到現在所有的功能都打包在上面。按下全部，就會看到從甲一開始的整張展開的圖。按下全部就會看到加減的按鈕，可放大縮小畫面。然後齒輪旁邊要有一個問號，按下去就會詳細導覽說明。」
- 同一 W004、預覽分支 `work-w004-map-entry`，從 `2b3633a` 接續；程式 commit `8302fe69d7f3922b52502cfbbe5f966c4866b655` 已推送，遠端 Git hash 已核對。先在 D107 第七十八輪記錄 q 對舊三層／無預選／控制列規格的明確取代，再改程式。正式 app 仍 v1.92；正式發布等待 q 另行指示。
- 開啟全卷、全部層、無收合的圖，依閱讀器版本與 `S.cur` 置中，淡黃標記、100%、橫／直書字級均 12px；若沒有選取則取目前卷第一科判／承接科判。每次重開依最新選取重設，不保留前次全覽／並排／分支限制；移除延遲自動全覽與初次自動導覽。
- 常駐齒輪／問號／全部三鈕。既有上方控制列、底部三頁籤與五種彈出面板移入齒輪設定，功能與事件沿用；設定可捲動，滾輪／原生觸控捲動不再傳給背景圖；canvas 自己保留 touch-action:none 以處理圖面拖曳／捏合。「全部」還原全卷全層、全覽、顯示圖面加減；最低倍率降至 0.001%，完整韓版也能放入畫面，低倍率不再只畫前三層。縮放不放大功能介面；「目前」回標記科判與 100%。
- 問號 14 步手動導覽，涵蓋當前置中／全部／手勢／齒輪／分支／架構／樣式／卷次／層級／並排／目前／切版／列印／節點快捷鍵；可完成、關閉、重播。保留節點小選單與雙擊回正文。新增常駐控制項及 12px 選項為純圖面與說明操作，明確列入 Analytics excluded；未增加事件、資料維度或統計客戶端。
- 最終脈絡圖矩陣：桌面 1440×900、iPad 直向 820×1180／橫向 1180×820、手機直向 390×844／橫向 844×390，各搭配藏／韓版，10 組、830/830 通過。檢查全部節點（藏版 1,970＋虛擬根／韓版 46,769＋虛擬根）、收合數 0、正中心座標、100%、12px、canvas 淡黃像素、初始3鈕／全部後5鈕、完整圖框入畫面、加減、齒輪全部子面板、水平不溢出、並排正文、橫直書、14步導覽／重播／關閉、分支後全部還原、拖曳、返回／重選／重開／Esc、無 pageerror。腳本／結果：`/tmp/yogacara-context-test.cjs`、`/tmp/yogacara-context-test-final.log`；初輪830亦通過，補原生設定捲動後重跑最終矩陣。hasTouch、isMobile=false固定 viewport 模擬。
- 原生互動補查：桌面矮視窗 1440×390、手機橫向 844×390，各搭配藏／韓版，共4組、46/46通過。實際滾輪捲設定200px、CDP原生單指滑動捲126／131px且背景不動、Ctrl＋滾輪與雙指捏合縮放、面板換版維持全層展開、點節點選單、雙擊／雙擊觸控返回同正文科判、藏版選定分支列印預覽開啟／取消、無 pageerror。`/tmp/yogacara-context-interactions.cjs`、`/tmp/yogacara-context-interactions-final.log`；首輪測試少發一次觸控點選而失敗，修正測試為兩次點選後通過，未為此改程式。
- W005 回歸：兩版×桌面／iPad／手機五種版面，另桌面正文與左欄倍率80%／140%，14組、168/168通過；右點科判左欄30%、上方12px純空白、正文2.5行定位、同頁、單欄返回、無 pageerror。沿用前輪測試，僅暫存測試網址換本機8001，`/tmp/yogacara-context-reader-regression.cjs`／`.log`。本次功能檢查合計1,044項通過，不另重跑無關歷史套件。
- 視覺檢視：桌面藏版初始與齒輪、手機韓版直向／藏版橫向截圖；選取淡黃、置中與三鈕確認。`/tmp/yogacara-context-probe.png`、`/tmp/yogacara-context-settings.png`、`/tmp/yogacara-context-hk-phone-portrait.png`、`/tmp/yogacara-context-zang-phone-landscape.png`。Inline JS 四區語法、Registry JSON、git diff --check通過。
- Analytics 最終全量完整執行（既有 W001／v1.91 基底套件）：靜態152 features／92 rules／26 states，0失敗；動態54通過／97不適用／3手動／5失敗（mac #sourceFont 未收到 font.family.song、ipad #exAll 未收到 export.shortcut.all，另mac／ipad／iphone #reportBtn 未收到 report.open）；控制項掃描另有1類失敗，#versionBtn、#mapBtn 未登錄或排除，共6類失敗、exit1，未全數通過。最後兩個控制項與report失敗沿用前輪已記錄問題；新增兩個全量失敗分別隔離比對基底2b3633a／本次8302fe6，各1/1收到預期事件（原生鍵盤切宋體、匯出全部卷快捷），並未更改這些功能／客戶端／事件規則。隔離通過不取代全量失敗結果；原因未確認。腳本／結果：`/tmp/yogacara-context-font-isolation.cjs`／`.log`、`/tmp/yogacara-context-export-isolation.cjs`／`.log`。
- 全量命令：`PLAYWRIGHT_PATH=/tmp/yogacara-registry-playwright.cjs CHROME_PATH=/usr/bin/chromium node tools/check-analytics-registry.cjs`；helper僅使用hk-update-notice=off、操作timeout500ms、navigation／waitForSelector30秒，套件明定點選仍3秒；未修改測試斷言。`/tmp/yogacara-context-registry-final.log`。第一次啟動因補齒輪原生捲動中止，未算完整執行；最終index source保持不變。全量啟動後另補12px選項到同一排除項（不變動feature／rule／state），以同套件的完整靜態部分重檢0失敗並核對新增selector；動態套件本來不開啟脈絡圖。
- 固定程式預覽：`https://raw.githack.com/dppss92044/yogacara/8302fe69d7f3922b52502cfbbe5f966c4866b655/index.html`。遠端 Git 已驗證；先前雲端 egress proxy 對 raw.githack.com CONNECT 403，本環境未驗證公網預覽載入。
- 未測 Safari、iPhone／iPad實機、PWA更新、正式列印／PDF下載／HTML匯出完整回歸；僅列印預覽smoke。未改SW、App版本、資料或正式main；未開PR／正式部署。所有tmp測試與截圖僅本環境暫存。

### 最新接續（Codex，2026-10-09，第七十七輪）
- 後續 q 要求「給我網址」：已依預覽需求推送獨立分支 `work-w004-map-entry`（未 push main、未開 PR、未部署正式站）。預覽程式 commit `6a4d0be`，已推送的交接 commit `f64df92`。第三方預覽網址為 `https://raw.githack.com/dppss92044/yogacara/work-w004-map-entry/index.html`；Git 讀取確認遠端分支存在，但雲端 egress proxy 對 raw.githack.com 的 CONNECT 回 403，因此無法在此環境驗證該公網網址實際載入。
- 使用者原始需求（附右下兩個圖示截圖）：「右下，這部分，幫我刪除展開，僅留下左邊。然後左邊按下去，就會全部背景展開。」
- 本次從預覽分支 `claude/kepan-map-view-36by8y` 的 `b77e82f` 接續同一個 W004；本機工作分支 `work-w004-map-entry`。程式修改 commit：`6a4d0be99a6888be98146c1213619df17ceb6c61`（交接文件提交後最新 HEAD 以 `git log -1` 為準）。
- 只移除科判欄右下 `#mapFull` 的建立與事件，保留 `#mapBtn` 的圖示與位置；點擊改用既有 `open(false)`，直接開啟全畫面、全部卷次的脈絡圖；返回鈕對齊保留的入口。已先在 DECISIONS 的第七十七輪記錄取代 D107 第十七輪雙入口設計。
- 針對性 Chromium 操作檢查：電腦 1440×900、iPad 直向 820×1180／橫向 1180×820、手機直向 390×844／橫向 844×390，各搭配藏經版與韓版，共 10/10 通過；確認只剩單一入口、點擊覆蓋整個 viewport、卷次 1–100、返回鈕位置、關閉／重開／Esc、無 pageerror。測試腳本與結果：`/tmp/yogacara-map-entry-test.cjs`、`/tmp/yogacara-map-entry-test.log`（暫存，不假設下一個任務仍存在）。
- Analytics 完整性檢查（既有 W001／v1.91 基底測試，對目前 W004 程式完整執行）：靜態 152 features／92 rules／26 states，0 失敗；動態 56 通過／97 不適用／3 手動／3 失敗（mac、ipad、iphone 的 `#reportBtn` 均未收到 `report.open`）；控制項掃描另有 1 類失敗，未登錄或排除的控制項為 `#versionBtn`、`#mapBtn`，合計 4 類失敗，exit 1。這兩個控制項在本次基底 `b77e82f` 已存在，原基底另有本次移除的 `#mapFull`；本次未改 Registry／統計客戶端／問題回報。此檢查不算通過，相關 Analytics 落差尚待另行處理。
- 完整性檢查命令：`PLAYWRIGHT_PATH=/tmp/yogacara-registry-playwright.cjs CHROME_PATH=/usr/bin/chromium node tools/check-analytics-registry.cjs`。本機 helper 只設定支援的更新通知偏好 `hk-update-notice=off`（避免舊測試被通知遮擋）、Playwright 操作 timeout 3 秒與 navigation timeout 30 秒；未修改測試或斷言。結果 `/tmp/yogacara-w004-registry-final.log`。
- 未執行舊版 fixtures 或舊歷史回歸套件。未測 Safari、iPhone／iPad 實機、PWA 更新、列印；未升正式版本、未改 sw.js、未 push、未開 PR、未部署。

- 基底 v1.92（main `4b7cac1`）。需求：到另一個介面看指定卷次或全部卷次的科判脈絡圖，滾輪縮放。工作分支 `claude/kepan-map-view-36by8y`；決定見 D107。
- 做法：`index.html` 三處——功能列表「其他」加 `.ver-menu-row.map-menu-row`（`#mapBtn`，並入 settings 群組與 hover 列表）；`#kmapCss` 樣式；主 IIFE 結尾（`.catch` 之前）一段 W004 JS（`build()` 建樹與版面、canvas 繪製只畫可見區域、wheel／pointer／pinch、`goNode` 跳轉）。**未改版本號、`sw.js`、`data/`。**
- 第二輪（q 11:39）：橫／直書素色、卷次範圍 a–b、層級、並排正文（右側自繪簡易正文，非閱讀器 `renderText`；資料取 `TXT[j-1][1]` 的 y／v／r／k 項）。`check-analytics-registry.cjs` 失敗 0。
- 第三輪（q 11:50）：卷次範圍不帶祖先；`build()` 增 `col`（收合標記）與 `focus`（只看分支）；尾端 ⊖／⊕ 標記、選取 chip、F／C／E、Shift＋滾輪。Chromium 測：收放、只看分支、marker 點擊、錯誤 0。
- 第四輪（q 12:03）：脈絡圖內可切版本（`bundleOf(ed)` 以 `loadEdition` 取另一版資料；區塊內以 NN／JLL／CRY／TXX／labx／fullx 與外層 N／JL… 區隔）；並排正文時 `onSel()` 依選取範圍內的 `h5[data-id]` 算出科判，`build(…,only)` 只畫這些節點＋祖先（`ctx` 淡色）。`go()` 在版本不同時呼叫 `switchEdition(edKey)` 後再 `goNode`——會改變閱讀器版本與 localStorage `hk-edition-v154`。Chromium 測：版本來回、選取範圍、結束選取，錯誤 0。
- 第五輪（q 12:14）：頂列精簡、底部 `.km-dock` 圖示工具列、`.km-pop` 卷次／層級面板；手機隱藏縮放鈕（雙指）。Chromium 截圖電腦、手機確認，錯誤 0。
- 第六輪（q 12:22）：修正 `mapEl` 捕獲階段 pointerdown 把 `.km-pop` 關掉導致卷次／層級選單無法操作；wheel 對調；`--kui` 以 CSS `zoom` 縮放 dock／pop／chip；`.km-fold` 收合。Chromium 測：真實滑鼠點選單後面板仍開、zoom 1.25、收起展開。
- 第七輪（q 12:25）：層級由「相對層」改「絕對層」（`NN[i][3]`），`depthStat()`／`fillDepth()` 依範圍列選項；`build()` 折疊規則改 `NN[i][3]>=depthMax`。Chromium：藏版第5卷（第3–6層）、韓版第5卷（第6–20層）、全部卷次（藏 1–8、韓 1–41）選項與標示一致，錯誤 0。
- 第八輪（q 12:27「到第幾層、第幾卷 旁邊都要有加減 可以直接按」）：功能列「卷次」「層級」兩側加 −／＋（卷次 ± ＝整段範圍平移一卷；層級 ± ＝加減顯示層），兩個浮窗內也有 ± 步進（起、迄、層級）；手機底部列不放（空間不足，浮窗內可按）。Chromium（桌面 1360、手機 390）：卷次 ±、層級 ±、浮窗起迄 ± 皆正確，錯誤 0；Safari／iPhone／iPad 實機未測。
- 第九輪（q 12:39）：①滾輪改為 上下＝滾輪、左右＝Shift＋滾輪、縮放＝Ctrl／⌘＋滾輪。②功能列新增「分支」選單：五大部分＋十七地（可選本地分／攝決擇分來源），點選後設卷次範圍為該分支並只看該分支（沿用「只看此分支」，晶片「還原全部」可回）；依節點名稱比對，4、5 地與 8、9 地在本地分合併節點時顯示其合併節點。③正文窗右上角加「科判」「正文」開關（解讀 q「可以關掉標題只有科判／章節科判可關」，待 q 確認）。④首次進入有 5 步導覽，標題列「導覽」可重看（localStorage km-tour）。Chromium（藏／韓版桌面、藏版手機 390）通過、錯誤 0；Safari／iPhone／iPad 未測。
- 第十輪（q 12:53，參考 XMind 截圖）：①切換大藏經／韓清淨版時保留卷次範圍、並排與正文窗卷次、橫直書、目前分支（依名稱重找），只換科判。②功能列新增「標題」（隱藏＝純圓點脈絡圖，游標移上顯示全名）與「樣式」面板：縮小空間緊密圖面、同層主題長度等齊、彩色分支、線條粗細（極細／細／中／粗）、線型（實／虛）、主題框（無／框線／填色）、重設；偏好存 localStorage km-style。未做：架構（向左／雙向心智圖／組織圖等）、文字字體字級、線條終點，待 q 決定。Chromium（藏／韓桌面、藏版手機 390）錯誤 0；Safari／iPhone／iPad 未測。
- 第十一輪（q 13:05）：①⊖／⊕ 收放符號只在游標移到該節點或符號上、或該節點被選取時才出現；已收起的 ⊕ 與觸控裝置（pointer:coarse）一律顯示。②第十輪的「標題＝圓點」誤解，改為「標號」：隱藏的是干支標號，內容標題保留；功能列「標號」開關，樣式面板「科判標號：無／干支／章節」。③大藏經版可在脈絡圖顯示藏版章節科判（章／節／項／目，來自 zj／makeChapterLabels；韓版無此編號，章節選項沿用干支）。④連線起點短線只畫一次。Chromium 藏版／韓版桌面、手機錯誤 0；實機未測。
- 第十二輪（q 13:12「預設直書，把下面功能列分成三部分：主題 卷次 介面」）：①脈絡圖預設直書（`vert=true`）。②功能列分三區：主題（分支、標號、樣式）、卷次（卷次±、層級±）、介面（橫／直書、並排、縮小、放大、全覽、目前），電腦三區並列並於下方標區名；手機（≤700px）改頂部「主題｜卷次｜介面」分頁，一次顯示一區。分區為本人對「三部分」的解讀，待 q 確認。Chromium 桌面 1360、iPad 820、手機 390 錯誤 0；實機未測。
- 第十三輪（q 13:19「依照你的能力 盡可能加入」，XMind 架構清單）：功能列「主題」區新增「架構」：邏輯圖（原本）、心智圖（單一主題時左右展開，多主題退回邏輯圖並提示）、括弧圖、組織圖（上下展開、橫排文字）、樹狀圖（縮排大綱）、表格圖（依層欄位、格子跨列）。`build()`／`draw()`／`hit()` 改為通用座標（tm＝0 橫／1 直書／2 組織圖；sd＝左右側；ct／cb＝橫跨範圍）。橫／直書只對邏輯圖、括弧圖有效（其他架構按鈕變灰）。**未做**：時間軸、魚骨圖、樹格圖、網格圖。Chromium（藏版桌面逐一畫面檢查六種；韓版全卷次六種無錯誤）；Safari／iPhone／iPad 未測。
- 第十四輪（q 13:19「盡可能加入」＋coordinator 補充）：補齊架構：時間軸（單一主題時主題在軸左端、其下一層為軸上節點，子項交錯排上下）、魚骨圖（主題在右端魚頭，其下一層為斜骨，子項掛在骨上）、樹格圖（巢狀方塊，面積依葉節點數，點選取最深層）、網格圖（有子項者為整列標題，葉節點排卡片格）；另加樣式「文字大小（小／中／大／特大）」「線條終點（無／圓點／箭頭）」。文字大小改 `FS_H/ROW/COL/CH` 變數，隨 `build()` 重算。Chromium：藏版第20卷「修所成地」分支逐一檢視四種新架構與字級、箭頭；韓版全部卷次切十種架構無錯誤。未做／限制：魚骨圖子項不分上下深淺只縮排；樹格圖用單純切割（非 squarified）；Safari／iPhone／iPad 未測。
- 第十五輪（q 2026-10-07 07:55，見 D107 第十五輪）：①`build()` 增 `ctx`（灰色虛線 ghost 祖先）與虛擬根 `VR`（`useBundle` 內 `NN.push(["瑜伽師地論",…])`，`go(i)` 對 `i>=VR` 不跳轉）。②`fillPage()` 補全別表（兩版 94／2016 頁全數完整；先前 15＋約 510 頁缺層）。③`#mapBtn` 改為科判欄右下動態建立的 `.chart-top.map-go`，頁碼 pill `left:88px`；功能列表的 `.map-menu-row` 已刪。④架構選單只留邏輯／心智／括弧／樹狀／表格／時間軸（`styLoad` 把 ly 3、7、8、9 改 0；相關繪製碼為死碼未刪）。⑤括弧圖圓弧重寫。⑥入口 `setRange(1,100);md=1`。⑦列印：chip「列印」→`.km-pr` 對話框→`prPages/prLayout/prSvg`→隱藏 iframe `print()`。測試（Chromium）：預設入口、虛線上層、括弧橫直書、列印 1／6／50 頁預覽圖、藏版電腦與手機、韓版載入無 JS 錯誤；**未測**：Safari／iPhone／iPad 實機列印（iOS 列印對話框行為）、實際紙本輸出、手機科判欄按鈕截圖。
- 第十六輪（q 08:28，見 D107 第十六輪）：`prLayout` 改為直／橫通用，`prSvg(…,prev)` 產生預覽與列印同一份 SVG；`.km-back2` 回正文鈕。測試 Chromium 截圖（直書、橫書、200%、寬鬆）；未測 Safari／iOS 實機列印與 PDF。
- 第十七輪（q 08:40，見 D107 第十七輪）：`emb` 嵌入模式（`#kmap.km-emb` 以 `embPos()` 貼合 `#panel` 矩形；`pick()` 嵌入時 `goNode`；`setEmb()` 每 500ms 同步卷次與 `S.cur`）；`#mapBtn`（心智圖）、`#mapFull`（展開）、`.km-back2`／`.km-exp` 以 CSS 變數對位。Chromium 截圖驗證電腦；未測 iPad／手機（手機沒有右側科判欄）／Safari。
- 第十八輪（q 08:55，見 D107 第十八輪）：列印核心改為 `prFit`（每個頂層支脈貪心選展開深度）＋`prPages`（逐行貨架排版、同頁多支脈、路徑取共同前綴、其餘支脈小字接在旁）；`draw()` 收起節點畫（分N），`hitMark` 對應加大點擊區。測試 Chromium：直書／橫書預覽、全螢幕入口；未測 Safari／iPad／實機列印。
- 第十九輪（q 10:13，見 D107 第十九輪）：`prTarget()`、`prLayout` 改父節點接續定位、預覽 IntersectionObserver 惰性繪製；`.km-dk`／`.km-open` 控制功能列顯示（僅 ≥701px）。Chromium 驗證；未測 Safari／iPad／實機。
- 第二十輪（q 10:30，見 D107 第二十輪）：`prRoots/prSpan/prScope` 做主題與卷次範圍；`prPages` 對後續支脈先以剩餘區域試排（`prFit(r,o,rw,rh)`），`pmap` 對應節點→頁碼；`prDraw` 重畫保留捲動位置。Chromium 驗證；未測 Safari／iPad／實機。圖一（勾選列在預覽中無法呈現）Chromium 無法重現，待 q 補述。
- 第二十一輪（q 10:39）：`prPages` 續頁佇列改 `q=lay.def.concat(q)`（DFS）。Chromium 驗證頁序：甲二→乙一→丙二→丁一→戊…。
- 第二十二輪（q 10:43）：`prScope` 回傳陣列（十七地含兩分）；`labAny`；`o.lcol`、`o.mx/my`。Chromium 驗證（t44）：修所成地兩頁、藍色標號、邊界16mm。Safari／實機列印未測。
- 第二十三輪（q 10:52）：`prChar` 以 canvas measureText 置中標點；`pfx()` 路徑卷次前置；`o.pn`；Chromium（t46）驗證預設值、p N、路徑順序。Safari／實機未測。
- 第二十四輪（q 10:54）：`o.lm`/`prLM` 傳給 `labAny`；t47 驗證三種模式。Safari 未測。
- 第二十五輪（q 11:06）：`prFitUI`、`o.bw/up/rng/pa/pb`、`prRun` 2-up；t49 驗證。Safari、實際列印（含2頁並排、頁範圍）未測。
- 第二十六輪（q 11:22）：`edz/edh` 切換呼叫 `setEd` 後 `prOpen(VR)`；t50 驗證。韓版全部範圍目前預覽達 400 頁上限（既有 guard），未處理。
- 第二十七輪（q 11:35）：`prEnh/prDdOpen/prSync/prSnap/prRestore`；`vcw()`；km-print3。t51 驗證加減與下拉同寬（desktop）。手機版面未測。
- 第二十八輪（q 11:45）：`prPop*`、`prPlace`、`o.pt`；t53 驗證桌面。手機未測。
- 第二十九輪（q 11:49）：`numLab/numSize`；列印 kind 3 token；canvas 與 panel（`.hz`）。t54 驗證列印與科判圖，panel 目視。
- 第三十輪（q 12:05）：`numLab` 拆數字／單位；`o.bw=false,o.up=1` 固定。t54／t52 目視。Safari、手機未測。
- 第三十一輪（q 10-08 15:28）：僅調整 prOpen 的群組順序。
- 第三十二輪（q 10-08 15:38）：`labg/labz` 開關寫入隱藏 select；`.cnt` 張數；t55 驗證。
- 第三十三輪（q 10-08 15:50）：`prSplit/prLines`、`prLayout` 多欄寬度、`prPopColor`、`prMaxLvl`、`o.pvt`；t56 驗證。畫布科判圖未換行。
- 第三十四輪（q 10-08 15:58）：`wrap` 參數貫穿 prLines/prLayout/prFit；`ln.off` 續行偏移。實測韓版 31 張頁面可排；未找到 >6 字標題的實例截圖。
- 第三十五輪（q 10-08 16:01）：`d._pz`、`pzd/pzu`；t59 驗證。
- 第三十六輪（q 10-08 16:03）：`prFit` 包裝 `prFit0`（A 不換行、B 換行擇優）；`o.h1`、`cf`。t58 驗證（藏版 9 張）。
- 第三十七輪（q 10-08 16:05）：`prFit(...,tol)`；刪除 first 區塊的 fw 比較。藏版範圍從 9 張變 8 張。
- 第三十八輪（q 10-08 16:07）：kind 4 token；pointer 拖曳。t60 驗證拖曳 scroll 位移。
- 第三十九輪（q 10-08 16:14）：`o.cf`；`prFit` 只要 A 容差內放得下就回傳 A。t58 目視。
- 第四十輪（q 10-08 16:16）：頁碼 token 移除 p。
- 測試（Chromium 模擬，非實機）：藏版本卷／全部／層級／全覽；韓版 46,769 科全展開縮放循環約 16ms／幀（rAF 上限）；電腦點節點→正文 `#j5` 定位、Esc 關閉、拖曳；手機 390×844 版面與雙指縮放（合成 pointer 事件 90%→250%）。`tools/check-analytics-registry.cjs` 另跑，結果見下方補記。
- **未測**：Safari／iPhone／iPad 實機、iPad 版面截圖、手機橫向、深色模式截圖、Mac 觸控板縮放手感、點節點後三欄同步的全面比對。

## 進行中：W003（q 2026-10-06 09:07「做」）
- 基底 v1.92（merge f08d811）。需求：`瑜伽統計` 要有一次看到所有主題的指令。
- 做法：`analytics/cli/yoga_stats.py` 加 `全部 [範圍]`（逐一呼叫既有主題）；`test_yoga_stats.py` 加 `test_all`。`python3 -m unittest discover analytics/cli` 18/18 通過。未改 App、未改 sw.js／版本。
- 另記後續：CodeRabbit 8 則意見（含手機「回上方」單擊 380ms 與雙擊 450ms 不一致）尚未處理。

## 正式基底

- 正式版本：**v1.92（發布 commit 已在 PR 內，待 q merge）**；merge 前 main 仍是 v1.91。
- v1.91 App 基底 commit：`db77e11`；W001／W002 工作分支起點 `origin/main` = `e4a365f`。
- **W001、W002 已隨 v1.92 發布並封存**（W 編號不再使用；下一個可用編號 W003）。以下 W001／W002 各節是封存的歷史交接，保留供追溯。

## 發布前預覽第 9 輪（q 2026-10-06 06:25；仍未發布）

- 頁碼鍵盤加「確認」鍵（單色深底、非紅；收起鍵盤並跳頁，數字仍即時跳轉）；版本內容依類型分組，標題各只出現一次。已更新 D102。僅做針對性 Chromium 測試（電腦版本內容置中、手機鍵盤置中、1,2→第12頁、確認收起），未測實機。

## 發布前預覽第 10 輪（q 06:29；仍未發布）

- 頁碼鍵盤：按數字不再跳頁，按「確認」才跳（取代 D102 即時跳轉）；更新通知留白放寬。

## 發布前預覽第 11 輪（q 06:35；仍未發布）

- 手機頁碼鍵盤移右下角（無遮罩）；手機空白處雙擊放大／還原該欄（D103，文字上雙擊＝查詞、科判標題雙擊＝回上層不受影響）。僅 Chromium 針對性測試（正文空白雙擊 1→1.5→1），未測實機，未測 iPad／電腦。

## 發布前預覽第 12 輪（q 06:37；仍未發布）

- 手機頁碼：確認改走 Enter 路徑（與原本前往相同）；點頁碼時輸入框設唯讀且字級 16px，避免 iOS 聚焦自動放大。Chromium 模擬通過（按 1、2＋確認→第 12 頁；pNum 16px、唯讀），iOS 實機自動放大是否消失**未驗證**。

## 發布前預覽第 13 輪（q 06:41；仍未發布）

- 卷次欄「(N科)」字級 12px→10px。未另做測試（僅字級）。

## 發布前預覽第 14 輪（q 06:42；仍未發布）

- 卷次欄「(N科)」字級 10px；關於「內容來源」改為分段（藏經版／韓版標題、網址獨立一行）；手機底部分頁圖示平時只顯示圖示、按下才顯示文字；科判分頁圖示改為直式心智圖支架。Chromium 手機模擬截圖確認；未測實機，iPad／電腦未動。

## 發布前預覽第 15 輪（q 06:45；仍未發布）

- 更新通知兩條條列間距收緊；更新通知與版本內容字體改新細明體（q：「以後字體都用新細明體」，範圍待 q 確認是否擴及全 App）。

## 發布前預覽第 16 輪（q 06:49；仍未發布）

- 卷次欄科數去括號、灰色、與卷名空一格、字級不變（10px）；更新通知標題改「已更新1.92」、標題與條列之間加空行。

## 發布前預覽第 17 輪（q 06:49 補充；仍未發布）

- 手機底部圖示文字改由程式在手指按住期間顯示（`.pressing`），完全放開後才消失（取代 CSS `:active`）。Chromium 滑鼠按壓模擬通過，iPhone 實機未測。

## 發布前預覽第 18 輪（q 06:50 改述；仍未發布）

- 手機底部圖示文字：按下立即出現，放開後約 0.8 秒逐漸淡出（q 改述為「放開之後才逐漸淡化消失」）。僅 CSS 過場；iPhone 實機未測。

## 發布前預覽第 19 輪（q 06:54；仍未發布）

- 卷次欄「卷第n」改「第n卷」（只改卷次欄按鈕與其 aria-label；上方卷名、換卷提示、正文標題未動，範圍待 q 確認）；手機底部圖示文字淡出 0.8s→2.4s，圖示上移 10px 並延遲到文字幾乎消失才回位，避免與文字重疊。僅 CSS 與字串；iPhone 實機未測。

## 發布前預覽第 20 輪（q 06:58；仍未發布）

- 手機底部圖示：文字改為獨立一行（預留 14px），圖示固定不再上下移動；文字淡出維持 2.4 秒。取代第 19 輪圖示上移作法。iPhone 實機未測。

## 發布前預覽第 21 輪（q 06:59；仍未發布）

- 關於頁：「版本 vX／最後更新」列合併「版本內容」列——該列整列可點（含 ›）進入版本內容，獨立的「版本內容」列隱藏（按鈕仍在 DOM，供程式觸發）。Chromium 電腦／手機模擬：點擊進入 history 頁，版本內容正常顯示。

## 發布前預覽第 22 輪（q 07:02；仍未發布）

- 功能列表「介面」列的圖示隨目前介面（電腦／平板／手機）改變（監聽 `data-layout`）；手機底部圖示加文字整塊上下置中（天 7.5px／地 6.5px）；卷次、正文、科判三個分頁圖示改為簡單圓潤線條。Chromium 電腦／iPad／iPhone 模擬確認圖示隨版本變；實機未測。

## 發布前預覽第 23 輪（q 07:06；仍未發布）

- 手機底部列改為「空／圖／字」三段各 20px（列高 60px＋邊線 1px＋安全區；`--nav-height` 同步為 61px＋安全區，內文底部留白隨之加高 9px）；匯出頁（電腦／手機）改為緊湊版：各列間距、輸入框與選項縮小，自訂匯出在手機上一屏可見。Chromium 電腦／iPhone 模擬確認；實機與 iPad 未測。

## 發布前預覽第 24 輪（q 07:11；仍未發布）

- 手機底部列縮緊為 18／18／18（列高 54px＋邊線，`--nav-height` 55px＋安全區）；文字放開後 3 秒才開始淡出（1.6 秒淡出）。
- 關於頁新增「版本更新通知」開關（預設開；localStorage `hk-update-notice`＝`off` 時不顯示更新通知，但仍記錄已看版本；`?preview=update` 仍可強制顯示）。更新通知加一行「不想收到更新通知，可在功能列表 › 關於 關閉。」Chromium iPhone 模擬：預設會顯示、關閉後不顯示且版本被記錄。這是新增功能，已記入 D104。實機未測。

## 發布前預覽第 25 輪（q 07:12 補充；仍未發布）

- 手機「回上方」：改用時間差（450ms 內再點一次）判斷雙擊，不再只靠 `click.detail`（iOS 觸控的 detail 常為 1，導致兩下也只回本卷頂）；單擊回本卷頂端、雙擊回第一卷頂端。Chromium 模擬（detail=1 的連點與觸控連點）通過；iPhone 實機未測。

## 發布前預覽第 26 輪（q 07:21；仍未發布）

- 手機底部圖示加大（26px）、無底色、目前所在頁只有圖示變黃；列高 53px（空 12／圖 26／字 14）；文字放開 3 秒後才淡出，淡出只在放開後才套用（避免載入時閃現）。
- 「版本」移出「關於」，成為功能列表「其他」裡獨立的第二層項目（齒輪圖示，點進去即版本內容；返回回到功能列表）；關於頁只剩內容來源、版本更新通知開關、問題回報。
- 更新小紅點（D105）：版本更新通知關閉、且有尚未看過的新版本時，功能鍵與「版本」項目圖示出現紅點；打開「版本」即標記已看並消失。通知開啟時行為不變（跳通知並記錄）；關閉時不再自動記錄為已看。
- 匯出圖示改為分享樣式（箭頭向上＋盒子）。Chromium 手機／電腦模擬確認；實機未測。

## 發布前預覽第 27 輪（q 07:29；仍未發布）

- 版本更新通知開關移到「版本」頁最上方（三種介面一致），分兩種：「此版本不再通知」（localStorage `hk-update-skip`＝版本號，只對該版本有效）與「永遠不再通知」（`hk-update-notice`＝`off`）；「關於」頁不再有開關。兩者任一開啟且有未看過的新版本時顯示紅點。更新通知文字改為「可在功能列表 › 版本 關閉」。（D104 修訂）
- 功能列表：「版本」與「關於」之間補分隔線；列高 38→34px、區段間距縮小；「內文」改名「註釋」（只改功能列表列名與頁面標題，匯出頁的「內文」選項未動）。
- 匯出頁再縮小（輸入框 26px、按鈕 30px、字級 11–12.5px）；「整本科判表」圖示縮為 14px 並對齊（q 說「修正圖示」，我判斷是大小／對齊問題，待 q 確認）。Chromium 電腦／手機模擬；實機未測。

## 發布前預覽第 28 輪（q 07:34；仍未發布）

- 版本列獨立成 `.ver-menu-row` 容器（不再與關於同容器）；滑鼠移到版本／其他非浮窗列時立即收掉浮窗並清除 `dl.on`（修匯出字變白）。
- 關於浮窗內「內容來源」「問題回報」列等高同樣式；`:focus-within` 不再讓關於浮窗殘留。
- 實測（Chromium 電腦/手機模擬）：面板上下左右內距皆 10px、列高 34/36px。僅目視檢查 about、dl 浮窗；其他浮窗未逐一目視。iPhone/iPad 實機未測。

## 發布前預覽第 29 輪（q 07:41；仍未發布）

- q 回報滑到版本仍跳出關於浮窗、匯出短暫變白：以 Chromium 連續取樣（匯出／關於／字體→版本，多種停留時間）目前版本未重現，疑為 q 當時跑的是舊版或 SW 快取；請 q 確認第 4 行 hash 並重新整理。
- 全面查浮窗內距：內容浮窗下內距多 10px（已修 13/13）、關於浮窗「內容來源」與「問題回報」同高同樣式（42px、右側箭頭）、匯出卡片標題貼頂（改 padding-top 4px，標題離頂 12–14px）、字體浮窗底部按鈕列左右下內距對齊 13px。版本、介面、註釋導覽主面板已查，無需改。
- 已看 iPhone、iPad 根面板與 iPhone 匯出頁截圖；手機/iPad 的「關於」「內容」頁僅截圖未逐項量測；實機未測。

## 發布前預覽第 30 輪（q 07:50；仍未發布）

- q 第二次回報「滑到版本會跳出關於浮窗、匯出短暫變白」。本環境沒有 WebKit（無法下載），只能用 Chromium；因此改成不依賴 mouseenter/mouseleave 順序：記錄滑鼠所在列（`under`），延遲開啟浮窗的計時器觸發時若滑鼠已不在該列就不開；版本列的 mouseenter／mouseover／mousemove 任一事件都會清掉計時器並收起浮窗。
- 測試（Chromium）：連續取樣、事件順序模擬（只送版本 mouseover、進入匯出/關於 20ms 後切到版本）皆無浮窗與 `dl.on`。Safari/WebKit 未實測，須 q 在 Mac Safari 確認。

## 發布前預覽第 31 輪（q 07:52；仍未發布）

- 找到的真實缺口：`clear()` 開頭 `if(!cur)return`，只清「滑鼠懸浮」開的浮窗；由點擊／回上一頁留下的匯出列 `.on`（黃底白字）、關於／字體展開狀態不會被清。新增 `hardClear()`（無條件收起 dlPop、`.dl.on`、ft、about），用於：滑到版本列或導覽列、回到根面板。
- 延續上一輪：以滑鼠所在列（`under`）為準，延遲計時器觸發時若已離開就不開。
- Chromium 逐格取樣與事件模擬皆無殘留；曾在 Chromium 以原樣步驟「只滑過版本」未能重現閃白，Safari/WebKit 無法在此環境測試，須 q 實機回報。

## 發布前預覽第 32 輪（q 07:59；仍未發布）

- q 發現前兩輪「沒修好」其實是 Mac 上 8000 埠被舊伺服器佔用（Address already in use），看到的是舊版；停掉舊伺服器後 hover bug 消失（q 回報「有了」）。
- 新需求：滑到「版本」要有預覽浮窗。新增 `.verpop`（與關於浮窗同款，300px），內容為目前版本的更新內容（取自 `versionNotes`），底部提示「點一下，查看全部版本與更新通知設定」；點擊仍進版本頁。版本列併入 `rows` 的 hover 機制（`data-hover=version`），僅在 hover 裝置顯示；手機/iPad 觸控不顯示。
- 測試（Chromium 電腦）：停版本→浮窗、滑進浮窗保持、→關於、→匯出皆正確切換，點版本進 history 頁。Safari、實機未測。

## 發布前預覽第 33 輪（q 08:06；仍未發布）

- 版本頁兩個開關（此版本／永遠）合併為單一「更新通知」開關（預設開；`hk-update-notice`，關閉存 `off`）。關閉後不再跳更新通知，但有新版時「版本」旁與功能鈕仍顯示紅點，進入版本頁後消失。移除 `hk-update-skip`。
- 同一個開關也放進滑到「版本」的預覽浮窗（版本頁與浮窗兩個開關同步）。
- 測試（Chromium 電腦）：預設開＋舊版→跳通知；關＋舊版→不跳、兩處紅點；關＋已看→無紅點；浮窗內點開關可切換並同步，浮窗不消失。手機/iPad 版本頁僅此開關，未另截圖。

## 發布前預覽第 34 輪（q 08:08；仍未發布）

- 關於「內容來源」：標題「藏經版」→「大藏經版」、「韓版」→「韓清淨版」；「原文網址：」→「網址：」，顯示完整網址（https://…）；僅電腦懸浮的關於浮窗加寬到 560px 並不斷行（手機/iPad 的關於頁維持原本自動換行）。內文未改。
- 測試（Chromium 電腦，藏經版與韓清淨版兩種啟動狀態）：兩個完整網址皆單行、未截斷。手機/iPad 未改動故未重測。

## 發布前預覽第 35 輪（q 08:13；仍未發布）

- 關於浮窗寬度改回 300px、網址恢復自動換行（文字內容維持：大藏經版／韓清淨版、「網址：」、完整 https 網址）。
- 紅點改為獨立判斷：`hk-tour` 且 `hk-ver-opened`≠目前版本即顯示（不論更新通知開關）；只有點「版本」才清除（新 key `hk-ver-opened`，新用戶首次載入即記為已看，不顯示）。「知道了」不會清紅點。
- 更新內容字級縮小：浮窗 11.5px、版本內容頁 13px。
- 取消「點版本進去的獨立頁」：電腦（hover 裝置）點版本只清紅點並顯示預覽浮窗；手機/iPad 無 hover，仍進版本頁（內含更新通知開關），待 q 確認是否也要取消。
- 測試（Chromium 電腦、iPhone 13 模擬）：老用戶紅點在「知道了」與重新整理後仍在，點版本後消失；新用戶無紅點；手機點版本進 history 頁。

## 發布前預覽第 36 輪（q 08:18；仍未發布）

- 紅點縮小：直徑 9px→5px（面積約 1/4）、外圈 1.5px→1px，位置微調貼齊圖示右上角。

## 發布前預覽第 37 輪（q 08:19；仍未發布）

- 更新通知開關：開啟色改黃（`--c`/#d9a62e，與其他開關相同），尺寸改 34×20 同其他開關；版本頁與預覽浮窗皆同。
- 預覽浮窗的更新內容放進白底圓角框（`.vp-card`），字級再小一級（內文 10.5px、小標 10px）；版本內容頁內文 12px。

## 發布前預覽第 38 輪（q 08:22；仍未發布）

- q 完全看不到紅點。原因：先前的紅點還要求 `hk-tour`，且全新（或無痕）瀏覽器第一次載入會被當新用戶而記為已看。改為：預覽網址帶 `?preview=update` 時一律不當新用戶、顯示紅點；其他情況只要 `hk-ver-opened`≠目前版本就顯示（不再要求 `hk-tour`）；全新且沒有任何舊記錄的一般網址才不顯示。點版本才清除。
- 測試（Chromium）：全新＋一般網址無紅點；全新＋?preview=update 有紅點、點版本後消失；只有 hk-tour、只有 hk-seen-version 皆有紅點。

## 發布前預覽第 39 輪（coordinator 補充；仍未發布）

- `?preview=update` 的紅點改為忽略 `hk-ver-opened`：每次載入都顯示，直到該次載入中點過「版本」才消失（已點過版本的瀏覽器也能重看紅點）。一般網址仍以 `hk-ver-opened` 判斷。
- 測試（Chromium）：已點過版本＋?preview=update 有紅點，點後消失；已點過版本＋一般網址無紅點。

## 發布前預覽第 40 輪（q 08:25；仍未發布）

- 手機底部三欄：目前所在那一欄（`aria-current=page`）的文字永久顯示，其餘不顯示；按住時該欄即時顯示；取消原本放開後 3 秒淡出（`.fading` 不再有動畫、不再讓文字殘留）。
- 測試（Chromium iPhone 13 模擬）：點卷次/科判/正文後，被點那欄文字不透明度 1 並於 7 秒後仍為 1，其餘 0。「搜尋」是動作鍵不是畫面，沒有「目前所在」狀態，只在按住時顯示文字。實機未測。

## 發布前預覽第 41 輪（q 08:28；仍未發布）

- 功能鈕（⋯）紅點移到圖示圓圈上右上 1 點鐘方向（圓心 16,15、半徑 7.2 → 紅點左上角 17,6）；`#menuBtn` 設 `position:relative` 以此定位。電腦、iPhone、iPad 三種介面按鈕尺寸相同，座標相同。「版本」列的紅點未改。

## 發布前預覽第 42 輪（q 08:31；仍未發布）

- 版本內容改兩層：第一層只放「重點」（`versionNotes` 中 important 的新增功能／修正 Bug；若無則退為全部），有一個「詳情」按鈕，按下才展開全部（含操作改善）；按鈕變「收起」。電腦預覽浮窗與手機/iPad 版本頁皆同（版本頁新增 `#vBrief`，`#versionHistory.expanded` 才顯示完整版本紀錄）。
- 手機版本頁高度由固定高度改為依內容（`height:auto` + max-height），第一層不再有大片空白。
- 測試（Chromium）：iPhone 13 第一層 281px 高、詳情後 579px；iPad 第一層 267px、詳情後 538px；電腦浮窗內按詳情可展開/收起。實機未測。

## 發布前預覽第 43 輪（q 08:33；仍未發布）

- 紅點規則更正：點過「版本」後，同一版本不再出現，只有下次更新（版本號改變）才會再出現。取消先前「?preview=update 每次載入都顯示紅點」的特例（改為與一般網址相同，以 `hk-ver-opened` 為準）。為了預覽時可重看，新增測試用參數 `?resetdot`（清除 `hk-ver-opened`），例如 `/?preview=update&resetdot`；不影響正式使用。
- 測試（Chromium）：更新後第一次有紅點→點版本後消失→同版本再開（含 ?preview=update）不再出現→加 &resetdot 才重現。

## 發布前預覽第 44 輪（q 08:38；仍未發布）

- 更新通知視窗：新增「此版本不再顯示」勾選（預設不勾，`hk-notice-hide`＝版本號）；勾了並按「知道了」後，該版本不再跳出；沒勾則下次載入仍會跳出（取代原本「顯示一次就記住」）。`?preview=update` 仍強制顯示。
- 底下兩行說明合併為一行「詳情：功能列表 › 版本」；原「不想收到，可在…關閉」已移除（永遠關閉仍在版本頁的「更新通知」開關）。
- 測試（Chromium 電腦）：預設未勾；未勾按知道了→重開仍跳；勾了→重開不跳；勾了但 ?preview=update 仍跳。

### 第 47 輪（q 08:52「現」：功能列表與浮窗跟著正文大小縮放，見 D106）
- 限 0.6–1.6 倍；手機 1 倍。Chromium 電腦測 0.6／1／1.6／2 倍，浮窗不出畫面。未測 Safari／iPad／手機實機。

### 第 46 輪（q 08:50：新增功能簡介縮短為「新增「版本」，更新後有小紅點，可查看更新內容。」）
- 僅字串變更，重建 sw.js。

### 第 45 輪（q 08:48 確認「加」）
- versionNotes 把「更新後第一次開啟…」改為重點項「新增「版本」：更新後會有小紅點，可在功能列表查看更新內容，也能關閉更新通知。」；重建 sw.js。未跑瀏覽器測試（僅字串資料變更）。
- 後續（W003 候選，合併後處理）：CodeRabbit 8 則意見，含手機「回上方」單擊延遲 380ms 與雙擊判定 450ms 不一致。

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
4. 手機子頁「上一頁」：v1.91 把標題列壓成 30px，但返回鈕 44px，鈕底框蓋住第一列；手機非根頁面改為標題列 44px、下距 6px。電腦／iPad 有同樣重疊，q 05:55 回報後（第三輪補充）改為所有版面一起修（非根頁面標題列 44px、下距 6px；mac／iPad 橫直／iPhone 實測內容頂 ≥ 上一頁鈕底）。
5. 測試：僅針對性（Chromium 模擬）；未重跑 W001／韓版／藏版全量；未做 Safari 實機。

### v1.92 發布前預覽調整 第三輪（q，2026-10-06 05:42；**仍為預覽，未批准、未 merge、未發布**）
1. 拖曳：q 回報置換後仍反向。本機各寬度（1024–1920、iPad 停靠）重現不到，但改為不依賴 `panes-swapped`／rail 保留寬度的算法——拖曳開始時記錄科判欄寬與「科判欄是否在分隔線左側」（用實際位置判斷），新寬度＝起始寬度±滑鼠位移；橡皮筋方向同步修正。測試（Chromium）：正常／置換／換回，往右拖 80px 各自 +80／+80／−80（分隔線跟著滑鼠）。iPad 橫向浮動卷次模式為左右均分（`!important` 1fr 1fr）：置換與拖曳本來就不生效，v1.91 亦同，未動。
2. 手機「關於」恢復原本大小（僅沿用 v1.92 上一頁遮擋修正造成的標題列高度差）；只有「版本內容」放大到可用高度，且鎖住底層頁面不捲動（`html.vc-lock`，僅 iphone 且選單開啟時），文字在面板內上下捲。
3. 預覽輔助：網址加 `?preview=update` 可強制顯示版本更新提醒（不寫入已讀記錄）。屬程式一部分，發布前由 q 決定保留或移除。
### v1.92 發布前預覽調整 第四輪（q，2026-10-06 06:02；**仍為預覽，未批准、未 merge、未發布**）
更新提醒改版：標題「已更新至 vX.XX」＋「本次更新摘要」＋分組條列（新增功能／修正 Bug，黑點）＋次要說明＋「知道了」（主要）、「導覽」「略過」（次要；導覽＝關閉並開始導覽，略過＝關閉；三者都記錄已讀）；字體縮小、桌面為預設樣式、手機自動縮窄。`?preview=update` 時不自動啟動首次導覽。v1.92 重要項新增「新增功能：更新後第一次開啟會顯示這次更新的重點」。
### v1.92 發布前預覽調整 第五輪（q，2026-10-06 06:05；**仍為預覽，未批准、未 merge、未發布**）
更新提醒簡化（q：太雜）：移除「本次更新摘要」副標與「略過」；v1.92 暫時只留「修正 Bug」兩條（「新增功能：更新提醒」改為非重要項，只出現在版本內容）；按鈕＝「知道了」（記錄此版已讀）＋「導覽」「不再顯示」（後者寫入 `hk-update-notice=off`，之後任何版本都不再自動彈出；`?preview=update` 仍可強制預覽）。
### v1.92 發布前預覽調整 第六輪（q，2026-10-06 06:10；**仍為預覽，未批准、未 merge、未發布**）
更新提醒只留「知道了」，移除「導覽」「不再顯示」（q：介面太雜）。新舊使用者的區別改由邏輯處理：全新使用者（沒有 `hk-tour`）→ 自動導覽、靜默記錄版本、不彈更新提醒；看過導覽的舊使用者 → 該版本第一次開啟彈更新提醒，按「知道了」記錄 `hk-seen-version`，同版不再出現。更新提醒文字縮短為兩句。
### v1.92 發布前預覽調整 第七輪（q，2026-10-06 06:13；**仍為預覽，未批准、未 merge、未發布**）
卷次欄：「本卷 N 科」改為半形括號「(N科)」，緊貼卷名右側同一行、字級 12px（原 13px）；「本卷承接前卷科判」同步改為「(承接前卷科判)」。僅 CSS（`.rhead`／`.rsub` 改 inline-block）與 `railHTML` 字串，不動 DOM 結構。實測桌面、手機同行。
### v1.92 發布前預覽調整 第八輪（q，2026-10-06 06:18；**仍為預覽，未批准、未 merge、未發布**；見 D102）
1. 「版本內容」：電腦／iPad 改為置中獨立視窗（寬 ≤560、最高 78vh、外圍淡暗），文字單色；手機維持面板。
2. 頁碼鍵盤（三版）：移除紅色「前往」鍵，按數字直接跳轉；手機版鍵盤置中並顯示「輸入值 / 總頁數」。
3. 說明提示：停用自製 hover 浮窗與首次講解卡，改為補齊原生 `title`；稽核電腦版主畫面與選單各頁，所有可見可點項目皆有 `title`。
4. 測試（Chromium 模擬，針對性）：版本內容視窗置中、手機鍵盤置中且連按 1、2 跳到第 12 頁、無講解卡／無自製浮窗、各選單頁 title 稽核、更新提醒仍正常。未做 Safari 實機、未重跑全量。
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

- W004 第四十一輪：標號顏色「其他色」改為 Word 式色盤（黑、紅、灰、咖啡、藍、三原色紅黃藍，各 5 階深淺，方塊），選單文字「更多顏色…」；僅 Chromium 桌面測過。
- W004 第四十二輪：上下邊界預設 1.5 cm（左右 2.54 cm，儲存鍵改 km-print4）；畫布科判圖（直書邏輯圖／括弧圖）標題超過 7 字或有標點時比照列印換行（往左、續行自標題第 2 字起、連線落在第一欄）；順手修 `[data-s=d+]` 無效選擇器（改加引號）；僅 Chromium 桌面測過，橫書畫布與其他圖形版式未換行。
- W004 第四十三輪：列印路徑每一層母支脈後加它本身所在頁碼（半形空白＋純數字，含「瑜伽師地論」），隨「頁面」開關；頁碼取該科判第一次出現的頁。僅 Chromium 桌面測過。
- W004 第四十四輪：路徑頁碼格式改為「名稱(p1)」：無空格、半形括號（直書時括號轉成上下）。
- W004 第四十五輪：直書路徑的頁碼「(pN)」整組不拆開：開括號、橫排「pN」（頁碼多位數時縮小字級以不超出欄寬）、閉括號，上下三格；折行時整組一起移到下一欄。
- W004 第四十六輪：列印預設為大藏經版（目前若是韓清淨版，按列印時先切回大藏經版再開對話框）、科判標號預設「干支」開啟（不再跟著目前介面）；仍可在對話框內切換。
- W004 第四十七輪：直書路徑頁碼的上下括號與「pN」貼近（括號格 0.8、數字格 0.9 字高）；pN 不再縮小，多位數（如 p47）與 p1 同字級。
- W004 第四十八輪：(1) 單一支脈的子科判太多、橫向放不下時，不再整塊縮小字體，改成「第二排、第三排」往下排（連線用最右側一條縱線接各排）；排到頁面放不下時，剩下的子科判自成區塊移到後面頁（字體大小維持一致）。(2) 路徑改靠紙張邊緣（約 0.55 倍邊界、至多 40px）。僅 Chromium 桌面測過。
- W004 第四十九輪：(1) 「第二排」只用在整頁寬度的第一個區塊，剩餘空間放不下的區塊改換下一頁；(2) 純單線串連、只剩延續的區塊（例如丙二—丁五—戊一）不再獨立成頁，直接從下一個有分支的科判開始，路徑仍帶上這些母支脈；(3) 區塊放不下時往後最多 12 個區塊內找放得下的先排進來，減少半空頁；(4) 子科判太多排不下的剩餘部分，改以「無頭」區塊呈現：保留支線與匯流線、不重複母標題，路徑末尾帶母支脈名與頁碼；不再一句一句孤立成區塊。僅 Chromium 桌面測過（乙十三聲聞地），使用者截圖那幾頁尚未逐一對照。
- W004 第五十輪：(1) 標題換行門檻由 7 字改為「超過 10 字才換行」（列印與畫布科判圖共用，其餘一律垂下）；(2) 同一排有 2 個以上區塊時，區塊在頁面寬度內均勻分開（含兩側留白），單一區塊仍置中。使用者截圖第 16 頁（韓／藏版預設、其紙張尺寸）在本機頁序不同（本機預設 84 張），僅以第 17 頁驗證。
- W004 第五十一輪：列印每個區塊（支脈）頭上多一行小字灰色「來源標題＋頁數」（母支脈的干支標號＋標題，頁數為母支脈所在頁；最多 10 字，超過加「…」；無頭區塊則為其母支脈本身；最上層為「瑜伽師地論」），隨「路徑」「頁面」開關；每頁右側源頭路徑原本即有，未改。預設張數因此增加（本機 84→108）。僅 Chromium 桌面測過。
- W004 第五十二輪：(1) 列印視窗開著時，Cmd／Ctrl＋滾輪（含觸控板雙指縮放）與 Cmd／Ctrl＋「＋」「－」「0」改為縮放預覽（25–300%），不再縮放整個瀏覽器；(2) 同一排內來源（母支脈）相同的區塊，來源標題與頁數只寫一次，用淡灰色直角虛線接到各區塊；(3) 母支脈就在同一頁時，該區塊頭上不寫來源。僅 Chromium 桌面測過。
- W004 第五十三輪：(1) 列印第 1 張新增總表「瑜伽師地論＋甲一～甲五」（只列第一層、標示各自分頁頁碼），之後依序接各甲；(2) 共用來源的虛線只合併「相鄰」的同源區塊，避免與中間其他區塊的來源字重疊；(3) 同一頁面依階層排高低：該頁最高階層（如丙）區塊頂在最上，丁次之、戊再次之（每低一階向下錯開約 3.4 倍路徑字高；超出頁面時縮小錯開量）。僅 Chromium 桌面測過，本機預設張數 105→111。
- W004 第五十四輪：(1) 區塊頭上的灰色來源標籤，只要母支脈「本頁已畫出」（含較晚在同頁畫出的情形以頁內已排入者為準）就不寫；(2) 右側路徑改為從甲一路寫到「本頁最上位階區塊的母支脈」（只取本頁最高階層的區塊求共同路徑，不再被較低階區塊的不同母支脈截短）。僅 Chromium 桌面測過。
- W004 第五十五輪：同頁支脈高低改以「根標題位置」為準（來源標籤高度另外補償，乙一定在丁、戊之上）；同頁不同列、同來源的支脈以淡灰直角虛線經左／右邊緣連到同一個來源標籤（只在該側不會穿過其他標籤時連，否則維持各自標示）。僅 Chromium 模擬檢查；未測 Safari／手機／實際列印。
- W004 第五十六輪：列印視窗新增「生成 HTML」：依目前範圍與設定，把各頁科判圖（SVG）包成單一獨立 .html 在新分頁開啟（彈窗被擋時改為下載），內含縮放、符合寬度、跳頁；可直接另存。僅 Chromium 模擬檢查；未測 Safari／手機。
- W004 第五十七輪：同列、母支脈相同的灰色來源標籤（如丙一、丙二同屬乙），以淡灰虛線在標籤上方連成一條；上方空間夠時另寫共同母支脈的標題與頁碼。僅 Chromium 模擬檢查；未測 Safari／手機。
- W004 第五十八輪：「生成 HTML」輸出中，節點下的頁碼、來源標籤與母支脈頁碼、右側路徑的 pN 可點擊跳到該頁；底色改淡灰（#ececec）。僅 Chromium 模擬檢查；未測 Safari／手機。
- W004 第五十九輪：母支脈在同一頁時，來源標題仍不寫，但改用淡灰虛線（直角、自動繞開文字）從母節點下方連到該支脈頂端。僅 Chromium 模擬檢查；多條線擠在同一通道時虛線會疊在一起；未測 Safari／手機。
- W004 第六十輪：「生成 HTML」中，節點的「(分N)」與其下頁碼改為連到該節點接續的支脈區塊（含同一頁內），點擊後捲到該區塊並閃動；其餘 pN 仍跳到頁面。僅 Chromium 模擬檢查；未測 Safari／手機。
- W004 第六十一輪：同頁母支脈的處理改為：同一列、同層級且無標題的區塊，頂端以淡灰虛線依序串成ㄇ字形（自動繞開文字），不再連到上一層級的母節點。僅 Chromium 模擬檢查；未測 Safari／手機。
- W004 第六十二輪：隱藏母節點的接續區塊，層級改以「實際看得到的第一個節點」自身層級計算，避免同為己的兩區塊因母節點層級不同而高低不一。我的預設規格掃描未重現該情況，僅依程式邏輯推定；Chromium 模擬；未測 Safari／手機。
- W004 第六十三輪：「生成 HTML」：來源標籤文字與其淡灰虛線、母支脈標籤、右側路徑的每一個標題都可點擊跳到對應頁；跳轉會寫入瀏覽器歷史，滑鼠上一頁／下一頁可回到跳轉前後的位置。僅 Chromium 模擬檢查（含上一頁、下一頁）；未測 Safari／手機。
- W004 第六十四輪：同頁同一列、同層級的區塊，標題高度改為統一計算（以實際可見第一個節點為準，受頁面高度限制時整組一起上移，且深層不會高於淺層）；用字級 12pt（共 81 張）重現第 47 頁並確認修正，另掃描 預設／12／14／16 pt、層數 3 共 5 種設定，同層級標題高低不一與層級顛倒皆為 0。僅 Chromium 模擬檢查；未測 Safari／手機。
- W004 第六十五輪：「生成 HTML」跳轉到支脈區塊後，只閃該區塊淡灰色來源標題（共用標題時閃共用的那一個；沒有標題則閃根標題），不再整塊閃。僅 Chromium 模擬檢查；未測 Safari／手機。
- W004 第六十六輪：列印排版改為嚴格依科判順序（取消「放不下時拿後面小塊補空位」）；並加上「已排過的節點不重複排版」的防呆，避免嚴格順序下的無限重複。實測頁數：預設（14pt）127→158 張，12pt 81→78 張，16pt 195→224 張；同列同層級標題高低不一與層級顛倒掃描為 0。僅 Chromium 模擬；未測 Safari／手機。
- W004 第六十七輪：「生成 HTML」點灰色來源標籤／其虛線／母支脈標籤／右側路徑標題，改為捲到該來源節點本身並閃動該節點；所有閃動拉長為 3.6 秒、閃三次（較慢）。僅 Chromium 模擬檢查；未測 Safari／手機。
- W004 第六十八輪：修正隱藏母節點的接續區塊（無來源標籤時）版面高度算成 NaN，導致整塊縮成一個點、只剩左上角殘影的問題（共 78 頁設定第 6 頁）。掃描 10/12/14/16pt 及預設，NaN 皆為 0；仍有少數極高的區塊因無法再切而被縮小到約 57–67%（原有行為）。僅 Chromium 模擬；未測 Safari／手機。
- W004 第六十九輪：「生成 HTML」中，「(分N)」的連結改為對應到該節點底下最先出現的區塊（含被合併略過的單線鏈、如甲二的接續區塊），全數 316 處註記皆可點；另補 SVG 文字的透明點擊範圍，閃動時整排灰色標題字一起閃（原本只閃第一個字）。僅 Chromium 模擬；未測 Safari／手機。
- W004 第七十輪：「生成 HTML」點「(分N)」改為整串下位階（該節點底下所有接續區塊）一起閃；點上位階灰色標題／虛線／路徑則只閃該來源節點。閃動 3.6 秒。僅 Chromium 模擬；未測 Safari／手機。
- W004 第七十一輪：(1) 閃動改為 2.5 秒閃 5 次；(2) 排版放不下層級落差空間時，改用不留落差空間再試一次（預設 158→144 張、12pt 78→72 張、16pt 224→201 張，層級高低掃描仍為 0）；(3) 加入排版防卡死保護：超過 1.5 秒改為不裝填、超過 5 秒中止（修正在 16pt 以上或橫書時按字體大小當機；已確認前一版在 16pt 會卡死）。橫書預設字級開啟仍需約 8 秒。僅 Chromium 模擬；未測 Safari／手機。
- W004 第七十二輪：依 q 選擇「少換頁」：接近滿頁高、放不下的區塊，改為不預留標題高低（干支階層）空間以減少頁數；此類頁面標題高低可能不齊。取代先前「標題照干支高低」中物理上放不下的情形。
- W004 第七十三輪：脈絡圖（邏輯圖、括弧圖）直書標題不再超過十字就拆成多欄，一律單欄完整垂下；列印版面的分欄不變。
- W004 第七十四輪：脈絡圖（全螢幕）一進去預設：全部卷次、三層、寬鬆距離、顯示科標；不再依閱讀位置預選黃底，點選才出現；資料跟著目前的藏版／韓版。
- W004 第七十五輪：脈絡圖點選節點後的小選單改黏在黃底框右上角（隨平移縮放跟著走）、圓角加大；選單不再顯示主題名稱，只留「列印」「只看這個」，取消「展開」「展開全部層」；按「只看這個」後再出現第二層「全部展開」「一部分」才跳轉。
- W004 第七十六輪：脈絡圖選單中「還原全部」按鈕字樣改為「回去」。

### W004 第九十七輪（按鍵依文字寬度）
- 修改：index.html 末尾追加 CSS（.upd-ok/.upd-cta、設定面板 km-row/km-grp/km-sec 不撐寬）。
- 測試：桌面 Chromium 與手機尺寸截圖（/mnt/project-files/W004/round98/）。未測：真機、Safari、iPad、實際列印。

### W004 第九十八輪
- index.html：新增 branchStep()；移除 C/E 鍵；說明頁的「快捷鍵：」項目改在同頁「快捷鍵」小標題下。
- 測試：桌面 Chromium（5 次按鍵後可見節點數 1971→1928→1850→1928→1971，整體層級不變）、說明動畫截圖 /mnt/project-files/W004/round99/。未測：真實注音輸入法、觸控、Safari、iPad。

### W004 第九十九輪
- index.html：說明動畫 tree SVG 改直式；.ki-stage 去框、間距縮小（檔尾 CSS）。
- 測試：桌面 Chromium 截圖 /mnt/project-files/W004/round100/。未測：手機／iPad／Safari。

### W004 第一〇〇輪
- 說明動畫示意圖節點文字改為實際干支與標題（直書 SVG text）；舞台高度 200。
- 測試：桌面 Chromium 截圖；干支／標題層級關係是依畫面截圖判讀，未逐筆對 data/ 核對。未測手機／Safari。

### W004 第一〇一輪
- index.html：說明動畫新增最後一頁（可點列點＋示意鍵盤，.kbd/.kk/.kitem），移除舊的中段總整理頁。
- 測試：桌面 Chromium 截圖 /mnt/project-files/W004/round101/（點選 Ctrl／⌘＋＋／−、F 皆確認黃標）。未測觸控、手機、Safari。

### W004 第一〇二輪
- index.html：scenes 文案改寫；示意圖改回無文字直式並縮小；舞台高度 120。
- 測試：桌面 Chromium 全新環境（已略過主頁導覽）首次開科判圖會自動跳出說明；截圖 /mnt/project-files/W004/round102/。注意：全新使用者會先看到主頁導覽，需先關閉才點得到科判圖。未測手機／Safari。

### W004 第一〇三輪
- index.html：說明動畫新增 sub 子步驟（subsOf/show(i,sb)）與每頁共用鍵盤 .ki-kb；上一步／下一步先走同頁子步驟。
- 測試：桌面 Chromium 逐頁點「下一步」，確認有快捷鍵的頁（滾輪、縮放、F、列印、＋／−）會多一步並標黃對應鍵；截圖 /mnt/project-files/W004/round103/。未測手機／Safari。

### W004 第一〇四輪
- index.html 檔尾 CSS：.ki-wheel 黃色。測試：桌面 Chromium 截圖 round104。未測手機／Safari。

### W004 第一〇五輪
- index.html：kbEl 依 subsOf 顯示；最後一頁 subs=列點數。測試：桌面 Chromium 逐步點下一步，無快捷鍵頁 .ki-kb hidden，最後一頁六步依序標黃。未測手機／Safari。

### W004 第一〇六輪
- index.html：合併滾輪上下移＋縮放大小為「滾輪移動與縮放」。測試：桌面 Chromium 逐頁；截圖 round106。未測手機／Safari。
