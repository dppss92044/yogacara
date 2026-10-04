import sys, json
SRC, DST = sys.argv[1], sys.argv[2]
s = open(SRC, encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    c = s.count(old)
    if c != n: raise SystemExit('count %d: %r' % (c, old[:90]))
    s = s.replace(old, new)
rep('<b id="appVer">v1.74</b>', '<b id="appVer">v1.75</b>')
i = s.index("$('versionHistory').onclick=null;$('versionDoc').textContent=") + len("$('versionHistory').onclick=null;$('versionDoc').textContent=")
_, end = json.JSONDecoder().raw_decode(s[i:])
s = s[:i] + json.dumps("v1.75\n最後更新：2026年10月4日", ensure_ascii=False) + s[i + end:]
CSS = open('v175.css', encoding='utf-8').read()
k = s.rindex('</body></html>'); s = s[:k] + '<style id="v175">' + CSS + '</style>\n' + s[k:]
open(DST, 'w', encoding='utf-8').write(s)
print('ok')
