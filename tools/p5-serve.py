#!/usr/bin/env python3
"""W001+W002 實機驗收（P5）用的臨時靜態伺服器。**只供本機測試，不是發布工具。**
- 服務 repo 目前的檔案；回應 index.html 時，即時把統計接收端網址換成 --worker（不寫檔、不改 repo 內任何檔案）。
- 不修改 sw.js、不部署；iOS 在 http 區網位址上不會註冊 Service Worker（預期）。
用法：python3 tools/p5-serve.py --worker http://<Mac區網IP>:8787 [--port 8000]
"""
import argparse, http.server, os, socketserver, sys
ap = argparse.ArgumentParser()
ap.add_argument('--worker', required=True, help='本機 Worker 網址，例 http://192.168.0.12:8787')
ap.add_argument('--port', type=int, default=8000)
a = ap.parse_args()
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OLD = 'https://yogacara-stats.dppss92044.workers.dev'
NEW = a.worker.rstrip('/')

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *x, **k): super().__init__(*x, directory=ROOT, **k)
    def end_headers(s):
        s.send_header('Cache-Control', 'no-store'); super().end_headers()
    def do_GET(s):
        p = s.path.split('?')[0]
        if p in ('/', '/index.html'):
            b = open(os.path.join(ROOT, 'index.html'), 'rb').read()
            n = b.count(OLD.encode())
            b = b.replace(OLD.encode(), NEW.encode())
            s.send_response(200); s.send_header('Content-Type', 'text/html; charset=utf-8')
            s.send_header('Content-Length', str(len(b))); s.end_headers(); s.wfile.write(b)
            sys.stderr.write('[p5] index.html served, endpoint replaced x%d -> %s\n' % (n, NEW)); return
        super().do_GET()

class S(socketserver.ThreadingTCPServer): allow_reuse_address = True
print('serving %s on 0.0.0.0:%d ; stats endpoint -> %s' % (ROOT, a.port, NEW))
S(('0.0.0.0', a.port), H).serve_forever()
