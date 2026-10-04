import sys, json, re
SRC, DST = sys.argv[1], sys.argv[2]
s = open(SRC, encoding='utf-8').read()
a = s.index('<style id="v187">'); b = s.index('</style>', a)
s = s[:a] + '<style id="v187">' + open('v187.css', encoding='utf-8').read() + s[b:]
m = re.search(r'var versionSummaries=(\{.*?\});', s)
SUM = json.loads(m.group(1)); SUM = dict([('1.88', "全部重置圖示移到字體設定右下；科標顏色的「預設」移到最右邊。")] + list(SUM.items()))
s = s[:m.start(1)] + json.dumps(SUM, ensure_ascii=False, separators=(',', ':')) + s[m.end(1):]
s = s.replace('"v1.87\\n最後更新：2026年10月5日\\n\\n"+versionSummaries["1.87"]', '"v1.88\\n最後更新：2026年10月5日\\n\\n"+versionSummaries["1.88"]')
assert s.count('<b id="appVer">v1.87</b>') == 1
s = s.replace('<b id="appVer">v1.87</b>', '<b id="appVer">v1.88</b>')
open(DST, 'w', encoding='utf-8').write(s); print('ok')
