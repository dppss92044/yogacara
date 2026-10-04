# v1.81（以 v1.80 為底）
import sys, json, re
SRC, DST = sys.argv[1], sys.argv[2]
s = open(SRC, encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    c = s.count(old)
    if c != n: raise SystemExit('count %d: %r' % (c, old[:90]))
    s = s.replace(old, new)
# 導覽：只留一個（原「詳細導覽」），名稱「導覽」；首次也播這一份
rep('detailedTour.querySelector("span").textContent="詳細導覽";', 'detailedTour.querySelector("span").textContent="導覽";')
rep('function runTour(forced,detailed) {', 'function runTour(forced,detailed) { detailed = true;')
# 正文右上：一律顯示「大小」；按下去的小｜大視窗中間顯示目前比率
rep("""if(deviceLayout==='mac')b.textContent=Math.round(Z.m*100)+'%';else b.innerHTML='<span class="g">大<span class="s">小</span></span>';""",
    """b.innerHTML='<span class="g">大<span class="s">小</span></span>';""")
# 開啟速度：首頁改為「先用已下載的版本立即開啟，背景檢查新版」
t = open('rel/W/tools/sw-template.js', encoding='utf-8').read()
old = """async function networkFirstShell(request) {
  const cache = await caches.open(CACHE);
  try {"""
new = """async function networkFirstShell(request) {
  const cache = await caches.open(CACHE);
  // 已下載的本版首頁直接開啟（不再每次重新下載 7MB 的 index.html）；
  // 新版由瀏覽器檢查 sw.js 發現，安裝完成後頁面會在安全時機自動重新載入一次。
  const ready = await cache.match(scopeURL(SHELL));
  if (ready) { self.registration.update().catch(() => {}); return ready; }
  try {"""
assert t.count(old) == 1
open('sw-template181.js', 'w', encoding='utf-8').write(t.replace(old, new).replace(" *  - index.html／導覽：network-first（逾時或斷線才用快取）", " *  - index.html／導覽：本版已下載就直接開啟；尚未下載才走網路（逾時或斷線用舊快取）"))
m = re.search(r'var versionSummaries=(\{.*?\});', s)
SUM = json.loads(m.group(1)); SUM = dict([('1.81', "導覽只保留一個，名稱改為「導覽」。\n正文右上恢復「大小」標示，按下時才顯示目前比率。\n開啟加快：已下載的版本直接開啟，不再每次重新下載整個首頁；有新版時背景更新後自動切換一次。")] + list(SUM.items()))
s = s[:m.start(1)] + json.dumps(SUM, ensure_ascii=False, separators=(',', ':')) + s[m.end(1):]
s = s.replace('"v1.80\\n最後更新：2026年10月4日\\n\\n"+versionSummaries["1.80"]', '"v1.81\\n最後更新：2026年10月4日\\n\\n"+versionSummaries["1.81"]')
rep('<b id="appVer">v1.80</b>', '<b id="appVer">v1.81</b>')
CSS = open('v181.css', encoding='utf-8').read()
k = s.rindex('</body></html>'); s = s[:k] + '<style id="v181">' + CSS + '</style>\n' + s[k:]
open(DST, 'w', encoding='utf-8').write(s)
print('ok')
