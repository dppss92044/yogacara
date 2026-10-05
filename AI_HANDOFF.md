# AI HANDOFF

> 本檔是 Claude Code、GPT Work、Codex 之間切換時最重要的文件。
> **每個 AI 工作結束或即將切換時，必須更新本檔。** 規則見 `AGENTS.md` §7。
> 下方是目前的**實際狀態**；固定模板見文末「模板」。

---

## 正式基底

- 正式版本：**v1.91**
- App 程式基底 commit：**`db77e11`**（「更新至 v1.91」；App 本體最後一次修改）

## 目前工作編號

- **W002｜科判導航／同步 Bug 修正**（q，2026-10-05；與 W001 平行，**獨立分支**，不得混入 W001）
- 工作分支：`claude/kepan-nav-fix-ryczgd`（基底 `origin/main` = `e4a365f`；App 程式基底仍是 v1.91 `db77e11`）
- 狀態：**修正與測試已完成，等待 q 驗收／裁定；尚未發布、未升版、未開 PR、未 merge、未 deploy**
- W001（匿名使用統計）在另一分支 `claude/project-thread-3ws881` 施工，**不在 main**；本分支不含 W001 任何內容。下一個可用編號：**W003**。
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
- 測試：`tools/nav-contract-w002.cjs` ＋ `tools/fixtures/w002-nav-cases.json`；結果見下。
- 契約文件：`docs/nav-contract.md`。

## 正在進行

- 無。

## 尚未完成

- 實機驗證（Safari／iPhone／iPad）：**未做**。
- 手機／iPad 的 `singleNode`／`doubleNode`（雙擊＝切換畫面）只修了卷次來源（`PJ` 已不再影響結果），其觸控流程**未在實機或觸控模擬下逐項測**。
- 發布：未做；`sw.js` 的檔案雜湊與 `appVer` 都**未動**（發布時用 `tools/build_release.py`）。

## 修改檔案

- `index.html`（`focusNode`、`#pzoom` dblclick；兩處，另加註解）
- 新增：`tools/nav-contract-w002.cjs`、`tools/fixtures/w002-nav-cases.json`、`docs/nav-contract.md`
- 文件：`AI_HANDOFF.md`、`CHANGELOG.md`（Unreleased）、`PROJECT_STATE.md`
- **未動**：`AGENTS.md`、`sw.js`、`manifest.webmanifest`、`icon-*.png`、`data/`、既有 `tools/*-results.json`、歷史說明檔。

## 已知 bug

- 見 `PROJECT_STATE.md` §6（與本 W 無關者不處理）。
- 韓版／藏版的「（分N）」「雙擊上一層」現行設計沿用；`PROJECT_SPEC.md` §5 寫「點兩下＝往上一層」，q 這次描述為「進入該標題的子分支；或依目前位置／既有設計進行相應的母／子分支導航」→ **以既有設計（往上一層）實作，如 q 要的是雙擊進子枝幹請告知**（見本檔「待 q 裁定」）。

## 待 q 裁定

1. 雙擊標題的方向：現行（SPEC §5、程式）＝往上一層（母枝幹）；q 的描述同時提到「進入子分支」。本 W 維持現行，只補上正文／卷次同步。
2. `.head` 路徑標題單擊：現行＝選取該祖先節點並同步正文／卷次（停在原頁）；雙擊＝科判欄換到它在母枝幹中的位置並同步。

## 測試結果

見 `CHANGELOG.md`「Unreleased／W002」與 `docs/nav-contract.md`。這是 Chromium（Playwright）模擬，不能取代實機。修前（v1.91 基底）藏版全量單擊 944／2,552 次失敗；修後藏版全量 0 失敗（細節見回報）。

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
3. 向 q 取得驗收結果；若要發布，與 W001 的發布順序一起裁定（§3.4 三條件）。

## 最後 commit

- App 正式版本 v1.91 的基底：`db77e11`。
- 第二階段文件：PR #1 已 merge（merge commit `c022988`），8 份永久文件已進入 `main`；其後 PR #2 merge（`f4734fc`）校正本檔狀態。**本次現況校正前的 repository main HEAD = `f4734fc`**（此為校正前快照，非永久的「目前 main HEAD」）。
- `f4734fc` 相較 `db77e11` 多出的 commit（`c022988`、`f4734fc`）屬文件／流程文件變更，**不代表 App 本體升版**；App 正式版本仍為 **v1.91**（`appVer`／`sw.js` `VERSION` 未動），App 程式基底仍為 `db77e11`。
- 目前沒有進行中的 W；下一個可用編號仍為 **W001**。
- 2026-10-05：本檔狀態校正（文件現況校正，非 W 工作，不增加版本號）。校正目的：區分「App v1.91 程式基底 commit `db77e11`」與「repository main HEAD」，並註明本次校正前 main HEAD 為 `f4734fc`，避免再把 App 程式基底誤寫成 repository main HEAD。同步校正 `PROJECT_STATE.md` §1；不建立 W、不新增 MASTER_HISTORY H 編號、不升版。

## 是否已正式發布

- 無進行中的工作，無待發布項目。

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
