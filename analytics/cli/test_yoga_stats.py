"""yoga_stats.py 測試（本機假伺服器；執行：python3 -m unittest discover analytics/cli）。"""
import io, json, os, sys, threading, unittest, contextlib
from http.server import BaseHTTPRequestHandler, HTTPServer
sys.path.insert(0, os.path.dirname(__file__))
import yoga_stats

DATA = {'range': 'today', 'period': {'type': 'd', 'key': '2026-10-05', 'start': '2026-10-05', 'end': '2026-10-05'}, 'k_min': 5,
        'instances': 24, 'new': 7, 'returning': 17, 'returning_rate': 17 / 24, 'opens': 63, 'active_seconds': 63 * 1080,
        'avg_active_seconds_per_open': 1080, 'frequency': {'1': 31, '2-5': 42, '6-20': 27, '20+': 8},
        'cities': [{'city': '台北', 'active': 14, 'new': 3}, {'city': '桃園', 'active': 6, 'new': 2}, {'city': '其他', 'active': 4, 'new': 2}]}
USERS = {'range': 'week', 'period': {'type': 'w', 'key': '2026-W41', 'start': '2026-10-05', 'end': '2026-10-11'}, 'total': 3, 'limit': 2,
         'instances': [{'code': 'A7F3C2', 'city': '新竹', 'device': 'phone', 'opens': 18, 'active_seconds': 14760}, {'code': 'B91C07', 'city': '花蓮', 'device': 'desktop', 'opens': 2, 'active_seconds': 2760}]}
INST = {'code': 'A7F3C2', 'city': '新竹', 'device': 'phone', 'first_day': '2026-09-01', 'last_day': '2026-10-07', 'opens_total': 40, 'active_seconds_total': 36000,
        'periods': {'today': {'start': '2026-10-07', 'end': '2026-10-07', 'opens': 7, 'active_seconds': 4980}, 'week': {'start': '2026-10-05', 'end': '2026-10-11', 'opens': 18, 'active_seconds': 14760},
                    'month': {'start': '2026-10-01', 'end': '2026-10-31', 'opens': 25, 'active_seconds': 20000}}}
SEEN = []

class H(BaseHTTPRequestHandler):
    def do_GET(self):
        SEEN.append((self.path, self.headers.get('Authorization')))
        if self.headers.get('Authorization') != 'Bearer tok':
            self.send_response(401); self.end_headers(); return
        if self.path.startswith('/admin/instances'):
            d = USERS
        elif self.path.startswith('/admin/instance?'):
            code = self.path.split('code=')[1]
            if code.upper() == 'DEADBE': self.send_response(409); self.send_header('Content-Type', 'application/json'); self.end_headers(); self.wfile.write(json.dumps({'error': '短代號對到多個實例，請多給幾碼（最多 8 碼）'}).encode()); return
            d = INST
        else:
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
        _, err = run(['今天', '--sort', 'x']); self.assertIn('--sort', err)
    def test_users(self):
        out, err = run(['使用者', '本週', '--limit', '2', '--sort', '次數']); self.assertIsNone(err)
        self.assertIn('A7F3C2｜新竹｜手機｜18 次｜246 分', out); self.assertIn('B91C07｜花蓮｜電腦｜2 次｜46 分', out)
        self.assertIn('共 3 個', out); self.assertIn('僅列出前 2 個', out)
        self.assertEqual(SEEN[-1][0], '/admin/instances?range=week&limit=2&sort=opens')
        out, _ = run(['使用者']); self.assertIn('range=today&limit=30&sort=time', SEEN[-1][0])
        run(['使用者', '本月', '--date', '2026-09-01', '--sort', '時間']); self.assertIn('range=month&date=2026-09-01&limit=30&sort=time', SEEN[-1][0])
    def test_instance(self):
        out, err = run(['實例', 'a7f3c2']); self.assertIsNone(err)
        for s in ['匿名實例 A7F3C2…', '城市：新竹（最新一次）', '裝置：手機', '首次出現：2026-09-01', '累計：開啟 40 次｜有效使用 600 分鐘', '開啟：7 次', '有效使用：83 分鐘', '開啟：18 次']:
            self.assertIn(s, out)
        self.assertEqual(SEEN[-1][0], '/admin/instance?code=a7f3c2')
        _, err = run(['實例', 'DEADBE']); self.assertIn('409', err); self.assertIn('多給幾碼', err)
        _, err = run(['實例', 'xyz']); self.assertIn('短代號', err)
        _, err = run(['實例']); self.assertIn('短代號', err)
        _, err = run(['使用者', '今天', '--sort', '亂']); self.assertIn('--sort', err)
    def test_never_prints_full_identifier(self):
        out, _ = run(['使用者', '本週']); self.assertTrue(all(len(l.split('｜')[0]) == 6 for l in out.splitlines() if '｜' in l))

if __name__ == '__main__':
    unittest.main()
