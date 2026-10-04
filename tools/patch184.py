# v1.84：修正 v1.83 膠囊樣式誤套到功能選單
import sys, json, re
SRC, DST = sys.argv[1], sys.argv[2]
s = open(SRC, encoding='utf-8').read()
a = s.index('<style id="v183">'); b = s.index('</style>', a)
s = s[:a] + '<style id="v183">' + open('v183.css', encoding='utf-8').read() + s[b:]
m = re.search(r'var versionSummaries=(\{.*?\});', s)
SUM = json.loads(m.group(1)); SUM = dict([('1.84', "修正功能選單按鈕被工具膠囊樣式壓縮（版本、內文、導覽、匯出等列恢復正常）。")] + list(SUM.items()))
s = s[:m.start(1)] + json.dumps(SUM, ensure_ascii=False, separators=(',', ':')) + s[m.end(1):]
s = s.replace('"v1.83\\n最後更新：2026年10月4日\\n\\n"+versionSummaries["1.83"]', '"v1.84\\n最後更新：2026年10月4日\\n\\n"+versionSummaries["1.84"]')
assert s.count('<b id="appVer">v1.83</b>') == 1
s = s.replace('<b id="appVer">v1.83</b>', '<b id="appVer">v1.84</b>')
open(DST, 'w', encoding='utf-8').write(s); print('ok')
