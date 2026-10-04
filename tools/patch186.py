# v1.86
import sys, json, re
SRC, DST = sys.argv[1], sys.argv[2]
s = open(SRC, encoding='utf-8').read()
a = s.index('<style id="v185">'); b = s.index('</style>', a)
s = s[:a] + '<style id="v185">' + open('v185.css', encoding='utf-8').read() + s[b:]
m = re.search(r'var versionSummaries=(\{.*?\});', s)
SUM = json.loads(m.group(1)); SUM = dict([('1.86', "「全部重置」按鈕文字置中，按鈕移到字體設定底部正中。\n功能子頁面（內文、字體等）不再出現「導覽」列。")] + list(SUM.items()))
s = s[:m.start(1)] + json.dumps(SUM, ensure_ascii=False, separators=(',', ':')) + s[m.end(1):]
s = s.replace('"v1.85\\n最後更新：2026年10月5日\\n\\n"+versionSummaries["1.85"]', '"v1.86\\n最後更新：2026年10月5日\\n\\n"+versionSummaries["1.86"]')
assert s.count('<b id="appVer">v1.85</b>') == 1
s = s.replace('<b id="appVer">v1.85</b>', '<b id="appVer">v1.86</b>')
open(DST, 'w', encoding='utf-8').write(s); print('ok')
