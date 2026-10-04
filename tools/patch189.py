import sys, json, re
SRC, DST = sys.argv[1], sys.argv[2]
s = open(SRC, encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    c = s.count(old)
    if c != n: raise SystemExit('count %d: %r' % (c, old[:90]))
    s = s.replace(old, new)
rep('if (!(window.matchMedia && matchMedia("(max-width: 700px)").matches)) setFold(true, false);',
    '''if (!(window.matchMedia && matchMedia("(max-width: 700px)").matches)) setFold(true, false);
      var pk = 0, fine = window.matchMedia && matchMedia("(hover:hover) and (pointer:fine)").matches;
      function peek(on) { clearTimeout(pk); rt.classList.toggle("jpeek", !!on && rt.classList.contains("fold-done")); }
      if (fine) {
        rt.addEventListener("mouseenter", function () { peek(true); });
        rt.addEventListener("mouseleave", function () { clearTimeout(pk); pk = setTimeout(function () { peek(false); }, 160); });
      }
      document.addEventListener("pointerdown", function (e) { if (!rt.contains(e.target)) peek(false); }, true);
      $("juans").addEventListener("click", function () { setTimeout(function () { peek(false); }, 0); });
      window.addEventListener("blur", function () { peek(false); });
      document.addEventListener("visibilitychange", function () { if (document.hidden) peek(false); });''')
m = re.search(r'var versionSummaries=(\{.*?\});', s)
SUM = json.loads(m.group(1)); SUM = dict([('1.89', "修正百卷浮窗離開範圍、點正文或選卷後仍停留。")] + list(SUM.items()))
s = s[:m.start(1)] + json.dumps(SUM, ensure_ascii=False, separators=(',', ':')) + s[m.end(1):]
s = s.replace('"v1.88\\n最後更新：2026年10月5日\\n\\n"+versionSummaries["1.88"]', '"v1.89\\n最後更新：2026年10月5日\\n\\n"+versionSummaries["1.89"]')
rep('<b id="appVer">v1.88</b>', '<b id="appVer">v1.89</b>')
CSS = open('v189.css', encoding='utf-8').read()
k = s.rindex('</body></html>'); s = s[:k] + '<style id="v189">' + CSS + '</style>\n' + s[k:]
open(DST, 'w', encoding='utf-8').write(s); print('ok')
