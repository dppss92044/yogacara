"""yoga_stats.py 測試（本機假伺服器；執行：python3 -m unittest discover analytics/cli）。"""
import io, json, os, sys, threading, unittest, contextlib
from http.server import BaseHTTPRequestHandler, HTTPServer
sys.path.insert(0, os.path.dirname(__file__))
import yoga_stats

DATA = {'range': 'today', 'period': {'type': 'd', 'key': '2026-10-05', 'start': '2026-10-05', 'end': '2026-10-05'}, 'k_min': 5,
        'instances': 24, 'new': 7, 'returning': 17, 'returning_rate': 17 / 24, 'opens': 63, 'active_seconds': 63 * 1080,
        'avg_active_seconds_per_open': 1080, 'frequency': {'1': 31, '2-5': 42, '6-20': 27, '20+': 8},
        'cities': [{'city': '台北', 'active': 14, 'new': 3}, {'city': '桃園', 'active': 6, 'new': 2}, {'city': '其他', 'active': 4, 'new': 2}]}
SEEN = []

class H(BaseHTTPRequestHandler):
    def do_GET(self):
        SEEN.append((self.path, self.headers.get('Authorization')))
        if self.headers.get('Authorization') != 'Bearer tok':
            self.send_response(401); self.end_headers(); return
        d = dict(DATA); d['range'] = self.path.split('range=')[1].split('&')[0]
        b = json.dumps(d).encode(); self.send_response(200); self.send_header('Content-Type', 'application/json'); self.end_headers(); self.wfile.write(b)
    def log_message(self, *a): pass

def run(args, token='tok'):
    srv = HTTPServer(('127.0.0.1', 0), H); threading.Thread(target=srv.serve_forever, daemon=True).start()
    os.environ['YOGA_STATS_URL'] = 'http://127.0.0.1:%d' % srv.server_port
    os.environ['YOGA_STATS_TOKEN'] = token
    buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(buf):
            yoga_stats.main(args)
        return buf.getvalue(), None
    except SystemExit as e:
        return buf.getvalue(), str(e.code)
    finally:
        srv.shutdown(); srv.server_close()

class T(unittest.TestCase):
    def test_summary(self):
        out, err = run(['今天']); self.assertIsNone(err)
        for s in ['匿名使用實例：24', '新實例：7', '回訪實例：17', '回訪率：71%', 'App 開啟：63 次', '18 分鐘', '1 次', '20 次以上', '台北', '其他']:
            self.assertIn(s, out)
        self.assertEqual(SEEN[-1], ('/admin/stats?range=today', 'Bearer tok'))
    def test_week_month_aliases(self):
        run(['本週']); self.assertIn('range=week', SEEN[-1][0])
        run(['本月', '--date', '2026-09-01']); self.assertIn('range=month&date=2026-09-01', SEEN[-1][0])
    def test_returning_regions_default_month(self):
        out, _ = run(['回訪']); self.assertIn('range=month', SEEN[-1][0]); self.assertIn('回訪率', out); self.assertNotIn('城市（', out)
        out, _ = run(['地區', '今天']); self.assertIn('range=today', SEEN[-1][0]); self.assertIn('城市（', out); self.assertNotIn('回訪率', out)
    def test_json(self):
        out, _ = run(['今天', '--json']); self.assertEqual(json.loads(out)['instances'], 24)
    def test_errors(self):
        _, err = run(['今天'], token='bad'); self.assertIn('401', err)
        _, err = run(['亂寫']); self.assertIn('不認得', err)
        _, err = run(['回訪', '明年']); self.assertIn('期間', err)
        _, err = run(['今天', '--date', 'abc']); self.assertIn('--date', err)
    def test_no_individual_listing(self):
        src = open(yoga_stats.__file__, encoding='utf-8').read()
        self.assertNotIn('/admin/instances', src)

if __name__ == '__main__':
    unittest.main()
