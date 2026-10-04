# v1.83
import sys, json, re
SRC, DST = sys.argv[1], sys.argv[2]
s = open(SRC, encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    c = s.count(old)
    if c != n: raise SystemExit('count %d: %r' % (c, old[:90]))
    s = s.replace(old, new)
# 收起卷次時，縮圖鈕直接放進 ⋯ ⇆ 的膠囊，三個等寬
rep("  function railOpenGuard(){", """  function railOpenGuard(){
    var ra=document.querySelector('.reader-actions'),ro=$('railOpen');
    if(ra&&ro){var into=!phoneMode()&&!ro.hidden;if(into&&ro.parentElement!==ra)ra.insertBefore(ro,ra.firstChild);else if(!into&&ro.parentElement===ra)document.body.appendChild(ro);}
    railOpenGuard2();}
  function railOpenGuard2(){""")
m = re.search(r'var versionSummaries=(\{.*?\});', s)
SUM = json.loads(m.group(1)); SUM = dict([('1.83', "收起卷次後，縮圖鈕併入左上膠囊，三個按鈕等寬。\n所有工具膠囊（大小、搜尋、縮圖、科標、⋯⇆、小｜大）統一全圓角。")] + list(SUM.items()))
s = s[:m.start(1)] + json.dumps(SUM, ensure_ascii=False, separators=(',', ':')) + s[m.end(1):]
s = s.replace('"v1.82\\n最後更新：2026年10月4日\\n\\n"+versionSummaries["1.82"]', '"v1.83\\n最後更新：2026年10月4日\\n\\n"+versionSummaries["1.83"]')
rep('<b id="appVer">v1.82</b>', '<b id="appVer">v1.83</b>')
CSS = open('v183.css', encoding='utf-8').read()
k = s.rindex('</body></html>'); s = s[:k] + '<style id="v183">' + CSS + '</style>\n' + s[k:]
open(DST, 'w', encoding='utf-8').write(s)
print('ok')
