#!/usr/bin/env python3
"""W001 Analytics v2：產生科判穩定 ID 登錄檔（D054）。

節點 ID = ns + 節點索引；ns = 版本字母（z 藏經版／h 韓版）+ 內嵌資料雜湊 dv（6 碼）。
dv = sha1(base64 酬載，去空白) 前 6 碼；tools/patch-w001-stats.py 用同一函式計算並寫進客戶端常數。
登錄檔只供 CLI 還原標題與路徑，不放進 Worker、不進 Service Worker 快取。

用法：python3 tools/make-kepan-registry.py [index.html] [data/zang.js] [輸出資料夾]
"""
import base64, gzip, hashlib, json, os, re, sys

def dv_of(b64):
    return hashlib.sha1(re.sub(r'\s', '', b64).encode('ascii')).hexdigest()[:6]

def hk_payload(index_html):
    m = re.search(r'<script type="application/octet-stream" id="dz">(.*?)</script>', index_html, re.S)
    if not m: raise SystemExit('找不到 id="dz" 資料區塊')
    return re.sub(r'\s', '', m.group(1))

def zang_payload(zang_js):
    m = re.search(r'window\.HKZANG&&window\.HKZANG\("([^"]*)"\)', zang_js)
    if not m: raise SystemExit('找不到 HKZANG 資料')
    return m.group(1)

def nodes_of(b64):
    return json.loads(gzip.decompress(base64.b64decode(b64)))['nodes']

def build(letter, b64, outdir):
    dv = dv_of(b64); nodes = nodes_of(b64)
    ns = letter + dv
    rows = [[n[0], n[3], n[4], n[5], n[6]] for n in nodes]   # 標題、層級、父節點索引、干支、卷
    path = os.path.join(outdir, 'kepan-%s.json.gz' % ns)
    data = json.dumps({'ns': ns, 'n': len(rows), 'cols': ['title', 'depth', 'parent', 'label', 'juan'], 'nodes': rows}, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    with open(path, 'wb') as f:
        f.write(gzip.compress(data, 9, mtime=0))
    return ns, len(rows), path

if __name__ == '__main__':
    index = sys.argv[1] if len(sys.argv) > 1 else 'index.html'
    zang = sys.argv[2] if len(sys.argv) > 2 else 'data/zang.js'
    outdir = sys.argv[3] if len(sys.argv) > 3 else 'analytics/registry'
    os.makedirs(outdir, exist_ok=True)
    for letter, b64 in (('h', hk_payload(open(index, encoding='utf-8', errors='replace').read())),
                        ('z', zang_payload(open(zang, encoding='utf-8').read()))):
        ns, n, path = build(letter, b64, outdir)
        print(ns, n, os.path.getsize(path), path)
