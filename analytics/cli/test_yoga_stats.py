"""yoga_stats.py 測試（Analytics v2；本機假伺服器回放由真正 Worker 程式碼產生的固定回應；
執行：python3 -m unittest discover analytics/cli）。僅測試 CLI；Worker 另有 node 測試。"""
import contextlib, io, json, os, sys, threading, unittest, urllib.parse
from http.server import BaseHTTPRequestHandler, HTTPServer
sys.path.insert(0, os.path.dirname(__file__))
import yoga_stats

FX = json.load(open(os.path.join(os.path.dirname(__file__), 'fixtures', 'canned.json'), encoding='utf-8'))
SEEN = []
# 概況（W011）：Worker 測試已驗證端點本身，這裡只回放同形狀的合成回應
FX['engaged'] = {'range': 'week', 'period': {'start': '2026-10-06', 'end': '2026-10-12'}, 'dev': None, 'min_seconds': 30,
                 'me': {'instances': 2, 'engaged': 2, 'active_seconds': 5400, 'engaged_seconds': 5400, 'read_seconds': 3600, 'opens': 9, 'new': 0},
                 'other': {'instances': 11, 'engaged': 6, 'active_seconds': 7200, 'engaged_seconds': 7000, 'read_seconds': 4000, 'opens': 40, 'new': 3},
                 'days': [{'day': '2026-10-12', 'me': False, 'instances': 4, 'engaged': 2, 'active_seconds': 900}, {'day': '2026-10-12', 'me': True, 'instances': 1, 'engaged': 1, 'active_seconds': 1800}],
                 'versions': [{'av': '2.2', 'me': False, 'instances': 3, 'engaged': 2, 'active_seconds': 800, 'read_seconds': 500}, {'av': None, 'me': False, 'instances': 8, 'engaged': 4, 'active_seconds': 6400, 'read_seconds': 3500}]}


class H(BaseHTTPRequestHandler):
    def do_GET(self):
        u = urllib.parse.urlparse(self.path); q = dict(urllib.parse.parse_qsl(u.query)); SEEN.append((u.path, q, self.headers.get('Authorization')))
        if self.headers.get('Authorization') != 'Bearer tok':
            self.send_response(401); self.end_headers(); return
        p = u.path
        if p == '/admin/instance' and q.get('code', '').upper() == 'DEADBE':
            self.send_response(409); self.send_header('Content-Type', 'application/json'); self.end_headers(); self.wfile.write(json.dumps({'error': '短代號對到多個實例，請多給幾碼（最多 8 碼）'}).encode()); return
        key = {'/admin/overview': 'overview', '/admin/instances': 'instances', '/admin/instance': 'instance', '/admin/nodes': 'nodes', '/admin/notes': 'notes', '/admin/nav': 'nav',
               '/admin/display': 'display', '/admin/font': 'font', '/admin/label': 'label', '/admin/search': 'search', '/admin/dict': 'dict', '/admin/export': 'export',
               '/admin/trend': 'trend', '/admin/size': 'size', '/admin/registry': 'registry', '/admin/presence': 'presence', '/admin/engaged': 'engaged'}.get(p)
        if p == '/admin/reading':
            key = 'reading_edition' if q.get('by') == 'edition' else 'reading'
        elif p == '/admin/features':
            key = 'features_kepan' if q.get('prefix') == 'kepan.' else 'features_edition' if q.get('prefix') == 'edition.' else 'features_unused' if q.get('unused') else 'features_all' if q.get('all') else 'features'
        if key is None:
            self.send_response(404); self.end_headers(); return
        b = json.dumps(FX[key]).encode(); self.send_response(200); self.send_header('Content-Type', 'application/json'); self.end_headers(); self.wfile.write(b)

    def log_message(self, *a): pass


SRV = None


def setUpModule():
    global SRV
    HTTPServer.address_string = lambda self: '127.0.0.1'
    SRV = HTTPServer(('127.0.0.1', 0), H); threading.Thread(target=SRV.serve_forever, daemon=True).start()
    os.environ['YOGA_STATS_URL'] = 'http://127.0.0.1:%d' % SRV.server_port


def tearDownModule():
    SRV.shutdown(); SRV.server_close()


def run(args, token='tok', **kw):
    os.environ['YOGA_STATS_TOKEN'] = token
    buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(buf):
            yoga_stats.main(args, **kw)
        return buf.getvalue(), None
    except SystemExit as e:
        return buf.getvalue(), str(e.code)


class T(unittest.TestCase):
    def test_engaged(self):
        SEEN.clear()
        out, err = run(['概況', '--本人', '--門檻', '60', '--by', '版本'])
        self.assertIsNone(err); q = SEEN[-1][1]; self.assertEqual(SEEN[-1][0], '/admin/engaged')
        self.assertEqual((q.get('min'), q.get('by'), q.get('range')), ('60', 'version', 'week')); self.assertNotIn('who', q)
        for w in ('實際使用', '本人', '其他人', 'v2.2', '未知'):
            self.assertIn(w, out)
        out, err = run(['概況', '本月', '--by', '日']); self.assertIsNone(err); self.assertIn('2026-10-12', out); self.assertEqual(SEEN[-1][1]['range'], 'month')
        out, err = run(['概況', '--本人', '--其他']); self.assertIsNotNone(err)
        out, err = run(['概況', '--門檻', '0']); self.assertIsNotNone(err)

    def test_version_command(self):
        SEEN.clear(); out, err = run(['2.2']); self.assertIsNone(err)
        self.assertEqual((SEEN[-1][0], SEEN[-1][1].get('av'), SEEN[-1][1].get('range')), ('/admin/engaged', '2.2', 'month')); self.assertIn('實際使用', out)
        SEEN.clear(); out, err = run(['v2.1', '本週']); self.assertIsNone(err); self.assertEqual((SEEN[-1][1].get('av'), SEEN[-1][1].get('range')), ('2.1', 'week'))

    def test_dashboard(self):
        import urllib.request, urllib.error
        got = {}; ev = threading.Event()
        def ready(srv, url):
            got['srv'], got['url'] = srv, url; ev.set()
        os.environ['YOGA_STATS_TOKEN'] = 'tok'
        th = threading.Thread(target=yoga_stats.serve_dashboard, kwargs={'port': 0, 'open_browser': False, 'ready': ready}, daemon=True); th.start()
        self.assertTrue(ev.wait(5)); url = got['url']; base = url.split('?')[0]; key = url.split('k=')[1]
        def get(path, hdr=None, host=None):
            r = urllib.request.Request(base.rstrip('/') + path, headers=dict(hdr or {}, **({'Host': host} if host else {})))
            try:
                with urllib.request.urlopen(r, timeout=5) as x:
                    return x.status, x.read()
            except urllib.error.HTTPError as e:
                return e.code, e.read()
        try:
            self.assertEqual(get('/')[0], 403)                         # 沒有密鑰
            st, body = get('/?k=' + key); self.assertEqual(st, 200); self.assertIn('瑜伽統計後台'.encode(), body)
            self.assertNotIn(b'tok', body)                              # token 不在網頁裡
            self.assertEqual(get('/api/engaged?range=week')[0], 403)   # 沒有 X-K
            self.assertEqual(get('/api/registry', {'X-K': key})[0], 403)  # 不在白名單
            self.assertEqual(get('/api/engaged', {'X-K': key}, host='evil.example')[0], 403)   # DNS rebinding
            SEEN.clear(); st, body = get('/api/engaged?range=week&min=30', {'X-K': key}); self.assertEqual(st, 200)
            self.assertEqual(json.loads(body)['me']['engaged'], 2); self.assertEqual(SEEN[-1][0], '/admin/engaged'); self.assertEqual(SEEN[-1][2], 'Bearer tok')
        finally:
            got['srv'].shutdown(); th.join(5)

    def test_who_filter_passed(self):
        SEEN.clear(); out, err = run(['功能', '本週', '--其他']); self.assertIsNone(err); self.assertEqual(SEEN[-1][1].get('who'), 'other')
        SEEN.clear(); out, err = run(['本週', '--本人']); self.assertIsNone(err); self.assertEqual(SEEN[-1][1].get('who'), 'me')

    def test_summary_and_aliases(self):
        out, err = run(['今天']); self.assertIsNone(err)
        for s in ['匿名使用實例：6', '回訪率', '有效閱讀時間合計', '熱門卷', '搜尋：', '辭典查詢', '功能使用', '使用頻率', '城市']:
            self.assertIn(s, out)
        self.assertEqual(SEEN[-1][:2], ('/admin/overview', {'range': 'today'}))
        run(['本週']); self.assertEqual(SEEN[-1][1]['range'], 'week')
        run(['本月', '--date', '2026-09-01']); self.assertEqual(SEEN[-1][1], {'range': 'month', 'date': '2026-09-01'})
        run(['今天', '--裝置', '手機']); self.assertEqual(SEEN[-1][1]['dev'], 'phone')
        run(['今天', '--from', '2026-09-20', '--to', '2026-10-05']); self.assertNotIn('range', SEEN[-1][1]); self.assertEqual(SEEN[-1][1]['from'], '2026-09-20')

    def test_all(self):
        out, err = run(['全部']); self.assertIsNone(err)
        for s in ['總覽：今天', '總覽：本週', '總覽：本月', '使用者', '閱讀', '科判', '功能', '趨勢', '資料量', '登錄', '即時']:
            self.assertIn(s, out)
        out, err = run(['全部', '今天']); self.assertIsNone(err); self.assertNotIn('總覽：本週', out)
        self.assertIsNotNone(run(['全部', '--json'])[1])
        self.assertIsNotNone(run(['全部', '明年'])[1])

    def test_returning_regions(self):
        out, _ = run(['回訪']); self.assertEqual(SEEN[-1][1]['range'], 'month'); self.assertIn('回訪率', out); self.assertNotIn('城市（', out)
        out, _ = run(['地區', '今天']); self.assertIn('城市（', out); self.assertNotIn('回訪率', out)

    def test_json_passthrough(self):
        out, _ = run(['今天', '--json']); self.assertEqual(json.loads(out)['instances'], 6)

    def test_errors(self):
        _, err = run(['今天'], token='bad'); self.assertIn('401', err)
        _, err = run(['亂寫']); self.assertIn('不認得', err)
        _, err = run(['回訪', '明年']); self.assertIn('範圍', err)
        _, err = run(['今天', '--date', 'abc']); self.assertIn('--date', err)
        _, err = run(['使用者', '--sort', 'x']); self.assertIn('--sort', err)
        _, err = run(['今天', '--裝置', '冰箱']); self.assertIn('--裝置', err)
        _, err = run(['功能', '--類型', 'zzz']); self.assertIn('--類型', err)
        _, err = run(['即時', '--timeout', '5']); self.assertIn('--timeout', err)
        _, err = run(['趨勢', '14']); self.assertIn('7 或 30', err)

    def test_users(self):
        out, err = run(['使用者', '本週', '--limit', '2', '--sort', '次數']); self.assertIsNone(err)
        self.assertEqual(SEEN[-1][:2], ('/admin/instances', {'range': 'week', 'limit': '2', 'sort': 'opens'}))
        lines = [l for l in out.splitlines() if '｜' in l and l.count('｜') > 5]
        self.assertTrue(lines and all(len(l.split('｜')[0]) == 6 for l in lines))
        for s in ['閱讀', '搜尋', '辭典', 'PWA', '手機', '共 ']:
            self.assertIn(s, out)
        run(['使用者']); self.assertEqual(SEEN[-1][1]['range'], 'today')

    def test_instance(self):
        out, err = run(['實例', 'a7f3c2', '--day', '2026-10-05']); self.assertIsNone(err)
        self.assertEqual(SEEN[-1][:2], ('/admin/instance', {'code': 'a7f3c2', 'day': '2026-10-05'}))
        for s in ['匿名實例', '當日摘要', '科判：點過', '單一節點最多重複', '本工具不顯示此實例的搜尋詞']:
            self.assertIn(s, out)
        for forbidden in ['般若', '阿賴耶', '20233']:
            self.assertNotIn(forbidden, out)
        _, err = run(['實例', 'DEADBE']); self.assertIn('409', err); self.assertIn('多給幾碼', err)
        _, err = run(['實例', 'xyz']); self.assertIn('短代號', err)
        _, err = run(['實例']); self.assertIn('短代號', err)
        _, err = run(['實例', 'a7f3c2', '--day', 'x']); self.assertIn('--day', err)

    def test_no_forbidden_features(self):
        ap = yoga_stats.build_parser(); opts = {o for a in ap._actions for o in a.option_strings}
        for bad in ('--nodes', '--settings', '--terms', '--combo'):
            self.assertNotIn(bad, opts)
        out, err = run(['實例', 'a7f3c2', '--nodes']); self.assertIsNotNone(err)
        with open(os.path.join(os.path.dirname(__file__), 'yoga_stats.py'), encoding='utf-8') as fh:
            src = fh.read().split('"""', 2)[2]
        for ep in ('/admin/instance_nodes', '/admin/instance_terms', '/admin/settings'):
            self.assertNotIn(ep, src)

    def test_reading(self):
        out, _ = run(['閱讀', '今天', '--sort', '人數']); self.assertIn('有效閱讀人數', out); self.assertIn('卷12', out); self.assertIn('無人閱讀的卷', out); self.assertIn('1–2', out)
        self.assertEqual(SEEN[-1][1]['by'], 'juan'); self.assertEqual(SEEN[-1][1]['sort'], 'users')
        out, _ = run(['閱讀', '--by', 'edition']); self.assertEqual(SEEN[-1][1]['by'], 'edition')

    def test_nodes_with_registry(self):
        out, _ = run(['科判']); self.assertIn('節點排行', out); self.assertIn('其他：', out); self.assertIn('入口與一層操作', out)
        self.assertIn('卷', out)       # 以登錄檔還原的標題（若 analytics/registry 存在）或 ns#idx
        self.assertIn('kepan.node_click', out)

    def test_edition_notes_search_dict_export(self):
        out, _ = run(['版本']); self.assertIn('藏經版', out); self.assertIn('韓版', out); self.assertIn('同時使用兩版', out); self.assertIn('edition.select.h', out)
        out, _ = run(['註釋']); self.assertIn('註釋', out); self.assertIn('披尋記', out)
        out, _ = run(['搜尋']); self.assertIn('搜尋次數', out); self.assertIn('熱門搜尋詞', out); self.assertIn('般若', out); self.assertIn('熱門零結果詞', out); self.assertIn('阿賴耶 → 阿賴耶識', out)
        out, _ = run(['辭典']); self.assertIn('熱門詞條', out); self.assertIn('常見未命中', out); self.assertIn('卷12', out)
        out, _ = run(['匯出']); self.assertIn('匯出摘要', out); self.assertIn('最常涵蓋的卷', out); self.assertIn('pdf', out)

    def test_bundles(self):
        for topic, key in (('導航', '導航'), ('顯示', '顯示'), ('字體', '字體'), ('科標', '科標')):
            out, err = run([topic, '本月']); self.assertIsNone(err); self.assertIn(key, out); self.assertIn('功能使用', out)
        out, _ = run(['字體']); self.assertIn('font.size', out); self.assertIn('預設值', out)

    def test_features_all_unused_type(self):
        out, _ = run(['功能']); self.assertIn('使用實例', out); self.assertIn('font.size.up', out); self.assertIn('Registry 152 項', out)
        self.assertEqual(SEEN[-1][1].get('all'), None)
        out, _ = run(['功能', '--全部']); self.assertEqual(SEEN[-1][1]['all'], '1'); self.assertIn('layout.panel_pin.on', out); self.assertIn('0 次', out)
        out, _ = run(['功能', '--未使用', '本月']); self.assertEqual(SEEN[-1][1]['unused'], '1'); self.assertNotIn('font.size.up ', out); self.assertIn('本期間 0 次', out)
        out, _ = run(['功能', '--類型', 'toggle']); self.assertEqual(SEEN[-1][1]['type'], 'T')
        run(['功能', '--類型', 'K']); self.assertEqual(SEEN[-1][1]['type'], 'K')

    def test_devices(self):
        out, _ = run(['裝置']); self.assertIn('手機', out); self.assertIn('平板', out); self.assertIn('電腦', out)
        self.assertEqual({s[1].get('dev') for s in SEEN[-3:]}, {'phone', 'tablet', 'desktop'})

    def test_presence(self):
        out, _ = run(['即時']); self.assertIn('目前在線', out); self.assertIn('最近 5 分鐘活躍', out); self.assertIn('在線＝最近有送心跳', out)
        for forbidden in ['卷', '科判', '搜尋詞']:
            self.assertNotIn(forbidden, out.split('在線＝')[0])
        out, _ = run(['即時', '--timeout', '120', '--最近']); self.assertEqual(SEEN[-1][1]['timeout'], '120')
        out, _ = run(['即時', '--json']); self.assertIn('online', json.loads(out))

    def test_presence_watch_loop(self):
        n = {'k': 0}
        def sleeper(s):
            self.assertEqual(s, 5); n['k'] += 1
            if n['k'] >= 3: raise KeyboardInterrupt
        out, err = run(['即時', '--監看'], sleep=sleeper); self.assertIsNone(err); self.assertEqual(n['k'], 3); self.assertEqual(out.count('即時使用狀況'), 3)

    def test_trend_size_registry(self):
        out, _ = run(['趨勢']); self.assertIn('最近 7 天', out); self.assertEqual(SEEN[-1][1]['days'], '7')
        run(['趨勢', '30']); self.assertEqual(SEEN[-1][1]['days'], '30')
        out, _ = run(['資料量']); self.assertIn('instance_day_feature', out); self.assertIn('估計大小', out)
        out, _ = run(['登錄']); self.assertIn('Registry v', out); self.assertIn('待以實際', out) if FX['registry']['verify_pending'] else None

    def test_all_topics_json(self):
        for t in ['使用者', '閱讀', '科判', '版本', '註釋', '搜尋', '辭典', '匯出', '導航', '顯示', '字體', '科標', '功能', '裝置', '即時', '趨勢', '資料量', '登錄']:
            out, err = run([t, '--json']); self.assertIsNone(err, t); json.loads(out)


if __name__ == '__main__':
    unittest.main()
