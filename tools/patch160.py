import sys, json
SRC, DST = sys.argv[1], sys.argv[2]
s = open(SRC, encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    c = s.count(old)
    if c != n: raise SystemExit('count %d: %r' % (c, old[:90]))
    s = s.replace(old, new)
a = s.index('  // 長標題被拆成好幾欄：下方有空間就合回一欄'); b = s.index('  function verticalForms(t) {', a)
s = s[:a] + open('layout160.js', encoding='utf-8').read() + s[b:]
SUM = json.load(open('summaries159.json', encoding='utf-8'))
SUM['1.60'] = "refactor(chart): 直書科判每頁依樹狀結構重排（兩版、全部頁面）\\nfix(chart): 連接線接在第一欄（標號欄）正中，不歪、不突出\\nfix(chart): 奇數子科：中間那科與上層同一直線\\nfix(chart): 兄弟等距；放不下時逐組等距，橫排小表等距\\nfix(chart): 括號整組移到下一欄開頭，不斷在欄尾\\nfix(chart): 高度不夠才分欄；續欄從標號下方起，不留單字孤欄\\nfix(label): 章節科標不留空格，與干支同一排版".replace('\\\\n','\\n')
SUM['1.60'] = SUM['1.60'].replace('\\n', '\n')
import re
m = re.search(r'var versionSummaries=(\{.*?\});', s)
s = s[:m.start(1)] + json.dumps(SUM, ensure_ascii=False, separators=(',', ':')) + s[m.end(1):]
rep('<b id="appVer">v1.59</b>', '<b id="appVer">v1.60</b>')
rep('<div id="versionHistory"><button class="version-row" data-version="1.59">', '<div id="versionHistory"><button class="version-row" data-version="1.60"><span>v1.60</span><span>›</span></button><button class="version-row" data-version="1.59">')
rep("versionPage('1.59','about');};", "versionPage('1.60','about');};")
rep("versionPage('1.59','about');}};", "versionPage('1.60','about');}};")
open(DST, 'w', encoding='utf-8').write(s)
print('ok')
