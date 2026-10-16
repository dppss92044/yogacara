# yogacara

## 開發與版本規範

- 自本次候選v2.3.0起，全面使用Semantic Versioning：`vMAJOR.MINOR.PATCH`。破壞性變更升主版、相容新功能升次版、相容修正升修訂版。舊2.2等歷史版號保留，不新增兩段版號。
- 顯示、文件與Git標籤使用`vX.Y.Z`；meta、Service Worker及資料鍵使用`X.Y.Z`。資產索引工具只接受三段版號。
- 所有修改只做靜態語法檢查；跳過自動編譯及UI／E2E，不將靜態通過視為功能驗收。
- 先在工作分支提供預覽；使用者說「合併發布」才合併main／正式發布。
- 本次更新涉及統計版本欄位：App、Worker與CLI均相容歷史兩段及新三段格式。正式發布時須先同步部署Worker相容修改；本次僅預覽，尚未部署。
- 詳細規則見[AGENTS.md](AGENTS.md)與[.cursorrules](.cursorrules)。
