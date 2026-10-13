# 以數珠為喻 — 《狂密與真密》導覽

純靜態網站（SVG＋原生 JS，無建置步驟）。入口：`index.html`。

- 內容資料：`data/content.js`（目次、名相、珠位配置、部件說明；補充正文只改此檔）
- 視覺與互動：`app.js`、`style.css`
- 驗證：`NODE_PATH=$(npm root -g) node tools/verify.cjs file://$PWD/index.html <截圖資料夾>`（針對本版寫的 Playwright 腳本）

尚待補：各章節、目、頁碼；各輯分界（僅第七、第九章跨輯已知）；名相與單章的細部對應；正文、解說、出處。
