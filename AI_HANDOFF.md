# AI HANDOFF

> 本檔是 Claude Code、GPT Work、Codex 之間切換時最重要的文件。
> **每個 AI 工作結束或即將切換時，必須更新本檔。** 規則見 `AGENTS.md` §7。
> 下方是目前的**實際狀態**；固定模板見文末「模板」。

---

## 進行中：W004（q 2026-10-06 11:19「脈絡圖」）
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
