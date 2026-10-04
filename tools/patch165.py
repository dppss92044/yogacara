# v1.65（以 v1.64 為底）
import sys, json, re
SRC, DST = sys.argv[1], sys.argv[2]
s = open(SRC, encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    c = s.count(old)
    if c != n: raise SystemExit('count %d: %r' % (c, old[:90]))
    s = s.replace(old, new)
# 1) 直書科判
a = s.index('  // 長標題被拆成好幾欄：下方有空間就合回一欄'); b = s.index('  function verticalForms(t) {', a)
s = s[:a] + open('layout165.js', encoding='utf-8').read() + s[b:]
# 2) 三欄跟讀：捲動正文時一律追蹤；點空白不再停止；跳轉的保留時間最多 2.5 秒
rep("    if(deviceLayout!=='mac'||!main.contains(e.target))return;", "    return;")
rep('      if (Date.now() < spyLock || panelHold || readingTargetJuan || chartInteracting || deviceLayout==="mac"&&!readerTracking) return;',
    '      if (readingTargetJuan) { if (rtMark[0] !== readingTargetJuan) rtMark = [readingTargetJuan, Date.now()]; else if (Date.now() - rtMark[1] > 2500 && Date.now() > spyLock) readingTargetJuan = 0; }\n      if (Date.now() < spyLock || panelHold || readingTargetJuan || chartInteracting) return;')
rep("  var spyLock = 0, spyT = false;", "  var spyLock = 0, spyT = false, rtMark = [0, 0];")
# 3) 韓版只有干支
rep('function lab(i) { if (LABEL === "zj" && ZJ) return', 'function lab(i) { if (LABEL === "zj" && ZJ && EDITION === "zang") return')
# 4) 問題回報：直接開郵件
rep("panel.addEventListener('click',function(e){if(e.target.closest('.learning-settings summary')",
    "panel.addEventListener('click',function(e){if(e.target.closest('#reportBtn')){e.preventDefault();e.stopImmediatePropagation();var mv=(document.querySelector('meta[name=app-version]')||{}).content||'';location.href='mailto:dppss92044@gmail.com?subject='+encodeURIComponent('瑜伽師地論app用戶問題回報')+'&body='+encodeURIComponent('\\n\\n——\\n版本 v'+mv+'\\n'+navigator.userAgent);return;}if(e.target.closest('.learning-settings summary')")
# 5) 版本紀錄：一份文件
i = s.index('<div id="versionHistory">'); j = s.index('</div>', i)
s = s[:i] + '<div id="versionHistory"><pre class="version-doc" id="versionDoc"></pre>' + s[j:]
rep("$('versionHistory').onclick=function(e){var b=e.target.closest('[data-version]');if(b)versionPage(b.dataset.version,'history');};",
    "$('versionHistory').onclick=null;(function(){var ks=Object.keys(versionSummaries).sort(function(a,b){var x=a.split('.').map(Number),y=b.split('.').map(Number);return (y[0]-x[0])||(y[1]-x[1]);});$('versionDoc').textContent=ks.map(function(k){return 'v'+k+'\\n'+versionSummaries[k];}).join('\\n\\n');})();")
rep("$('appVer').onclick=function(){versionPage('1.64','about');};", "$('appVer').onclick=function(){showSettingsPage('history');};")
rep("if(e.key==='Enter'||e.key===' '){e.preventDefault();versionPage('1.64','about');}", "if(e.key==='Enter'||e.key===' '){e.preventDefault();showSettingsPage('history');}")
# 版本
m = re.search(r'var versionSummaries=(\{.*?\});', s)
SUM = json.loads(m.group(1))
SUM = dict([('1.65', "feat(sync): 捲動正文時三欄一律跟讀反白（點空白不再停止）\nrefactor(chart): 藏版直書科判重排：字後直接接支線、兄弟等距、支架直線置中、紙面空時放寬間距\nfix(chart): 超過 12 字平均分兩欄，續欄與首欄正文同高、欄距加寬\nfix(chart): 括號不斷欄；標題後括號小注與 (分N) 同字級、同色\nstyle(chart): 阿拉伯數字用 Times New Roman\nstyle(text): 正文欄科判標題灰色加深\nfeat(menu): 問題回報直接開郵件；版本紀錄改成單一文件（新的在上）\nremove(hk): 韓版移除章節科標，只留干支")] + list(SUM.items()))
s = s[:m.start(1)] + json.dumps(SUM, ensure_ascii=False, separators=(',', ':')) + s[m.end(1):]
rep('<b id="appVer">v1.64</b>', '<b id="appVer">v1.65</b>')
CSS = open('v165.css', encoding='utf-8').read()
k = s.rindex('</body></html>'); s = s[:k] + '<style id="v165">' + CSS + '</style>\n' + s[k:]
open(DST, 'w', encoding='utf-8').write(s)
print('ok')
