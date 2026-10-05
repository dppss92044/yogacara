# AI HANDOFF

> 本檔是 Claude Code、GPT Work、Codex 之間切換時最重要的文件。
> **每個 AI 工作結束或即將切換時，必須更新本檔。** 規則見 `AGENTS.md` §7。
> 下方是目前的**實際狀態**；固定模板見文末「模板」。

---

## 正式基底

- 正式版本：**v1.91**
- commit：**`db77e11`**（`main`）

## 目前工作編號

- **無**（目前沒有進行中的 W 工作）
- 下一個可用編號：**W001**
- 下一正式版本候選：v1.92

## 本輪使用者原始需求

- 無進行中的程式需求。
- 最近一輪（非程式）：第二階段「建立專案永久記憶與跨 AI 接力制度」——新增 `AGENTS.md`、`PROJECT_STATE.md`、`PROJECT_SPEC.md`、`UI_SPEC.md`、`DECISIONS.md`、`CHANGELOG.md`、`AI_HANDOFF.md`、`docs/history/MASTER_HISTORY.md`。

## 已完成

- 第一階段：歷史考證與版本線重建（使用者已確認）。
- 第二階段：上述 8 份文件已建立（H155）。
- **App 本體沒有任何修改。**

## 正在進行

- 無。

## 尚未完成

- 沒有進行中的程式工作。
- 文件中標為「待使用者確認」的項目尚未裁定（見 `PROJECT_SPEC.md` §21、`UI_SPEC.md` §C、`DECISIONS.md` D090–D098）。

## 修改檔案

- 本輪只新增／修改 Markdown：`AGENTS.md`、`PROJECT_STATE.md`、`PROJECT_SPEC.md`、`UI_SPEC.md`、`DECISIONS.md`、`CHANGELOG.md`、`AI_HANDOFF.md`、`docs/history/MASTER_HISTORY.md`。
- **未修改**：`index.html`、`sw.js`、`manifest.webmanifest`、`icon-*.png`、`data/`、`tools/`。

## 已知 bug

- 見 `PROJECT_STATE.md` §6（HINTS 雙擊文字不一致、hover 說明框移除原生 `title`、數字鍵未納入 SW `busy()`、韓版 998 頁未確認、辭典 API 僅 mock 驗證）。

## 測試結果

- 本輪無程式修改，無需測試。
- 既有測試結果檔僅針對 v1.61–v1.63、v1.76–v1.79 的當時版本；v1.80–v1.91 無入庫測試。詳見 `PROJECT_STATE.md` §9。

## 不得破壞的既有行為

- 見 `DECISIONS.md`（D010–D039 為不得改回去的決定）、`PROJECT_SPEC.md`（【現行】項）、`UI_SPEC.md` §A。
- 特別注意：不恢復 hover 自動辭典、書寫／筆記編輯、四種閱讀底色、25% 級距、概略導覽、全部重置置中、回上方跟隨紙面、縮圖鈕隱藏。
- 不得自行增加正式版本號；不得改歷史（見 `AGENTS.md` §3.5）。

## 下一個 AI 第一件應做的事

1. 讀完 `AGENTS.md` §1 列的七份文件。
2. 執行 `git status`、`git log -3`，確認與本檔「最後 commit」一致。
3. 等使用者提出需求；有需求時：在本檔登記 **W001**（基底 v1.91 `db77e11`、使用者原始需求），再動手。
4. 若需求觸及「待使用者確認」項目，先向使用者確認。

## 最後 commit

- 正式主線：`db77e11`（v1.91）。
- 第二階段文件：已在本機分支 `claude/fervent-heisenberg-jopwde` commit（hash 見 `git log -1`）；**尚未 push**（使用者明令本階段不要 push，等待指示）。

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
