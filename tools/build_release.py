#!/usr/bin/env python3
"""改版工具：python3 tools/build_release.py 1.55
1. 把 index.html 的 <meta name="app-version"> 設成該版本
2. 依 tools/sw-template.js 產生 sw.js：CACHE = yogacara-v<版本>，並重算所有離線檔案的 SHA-256
每次改版都要執行，否則舊快取不會換新。"""
import sys, os, re, json, hashlib, base64
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ver = sys.argv[1]
assert re.fullmatch(r'\d+(\.\d+)+', ver), '版本格式例如 1.55'
ip = os.path.join(root, 'index.html')
s = open(ip, encoding='utf-8').read()
tag = '<meta name="app-version" content="%s">' % ver
if '<meta name="app-version"' in s:
    s = re.sub(r'<meta name="app-version" content="[^"]*">', tag, s, count=1)
else:
    s = s.replace('<meta charset=utf8>', '<meta charset=utf8>' + tag, 1)
open(ip, 'w', encoding='utf-8').write(s)
files = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png']
files += sorted('data/' + f for f in os.listdir(os.path.join(root, 'data')) if not f.startswith('.'))
def h(p):
    return base64.b64encode(hashlib.sha256(open(os.path.join(root, 'index.html' if p == './' else p), 'rb').read()).digest()).decode()
F = {f: h(f) for f in files}
t = open(os.path.join(root, 'tools', 'sw-template.js'), encoding='utf-8').read()
t = t.replace("'__VERSION__'", json.dumps(ver)).replace('__FILES__', json.dumps(F, ensure_ascii=False, separators=(',', ':')))
open(os.path.join(root, 'sw.js'), 'w', encoding='utf-8').write(t)
print('版本', ver, '｜快取 yogacara-v' + ver, '｜離線檔案', len(F))
