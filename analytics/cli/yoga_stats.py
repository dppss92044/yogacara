#!/usr/bin/env python3
"""瑜伽統計：查詢《瑜伽師地論》匿名 App 分析（W001 Analytics v2，DECISIONS D040–D060）。

用法：瑜伽統計 <主題> [範圍] [旗標]
  今天｜本週｜本月            總覽
  使用者 [範圍]               匿名實例列表（短代號、城市、裝置、模式、次數、時間…）
  實例 <短代號> [--day 日期]   單一實例的累計與當日摘要（只有次數與統計；沒有詞、節點、設定組合）
  閱讀｜科判｜版本｜註釋｜搜尋｜辭典｜匯出｜導航｜顯示｜字體｜科標 [範圍]
  功能 [範圍] [--全部｜--未使用｜--類型 型]   功能使用（--全部 含 0 次；--未使用 只列 0 次）
  裝置 [範圍]                 功能與狀態的手機／平板／電腦分布
  即時 [--timeout 秒] [--監看] [--最近]   目前在線（心跳）
  回訪｜地區 [範圍]｜趨勢 [7|30]｜資料量｜登錄
  共用旗標：--date 日期  --from 日期 --to 日期  --裝置 手機|平板|電腦  --limit N  --sort …  --json

刻意不提供（D058）：實例 --nodes、依設定組合搜尋或辨識實例、列出某實例的搜尋／辭典詞。
只用 Python 標準函式庫。匿名實例只顯示 6 碼短代號；伺服器不回傳完整識別碼。

設定（皆不得寫進 repository）：
  YOGA_STATS_URL    接收端網址（預設為公開的 Worker 網址）
  YOGA_STATS_TOKEN  管理 token；未設定時從 macOS 鑰匙圈讀取（服務名 yoga-stats-admin）
"""
import argparse, gzip, json, os, subprocess, sys, time, unicodedata, urllib.error, urllib.parse, urllib.request

DEFAULT_URL = 'https://yogacara-stats.dppss92044.workers.dev'
KEYCHAIN_SERVICE = 'yoga-stats-admin'
RANGES = {'今天': 'today', '今日': 'today', 'today': 'today', '本週': 'week', '本周': 'week', 'week': 'week', '本月': 'month', 'month': 'month'}
RANGE_LABEL = {'today': '今日', 'week': '本週', 'month': '本月', 'custom': '指定期間'}
TOPICS = {'回訪': 'returning', '地區': 'regions', '地区': 'regions', '使用者': 'users', '實例': 'instance', '实例': 'instance', '閱讀': 'reading', '阅读': 'reading',
          '科判': 'nodes', '版本': 'edition', '註釋': 'notes', '注釋': 'notes', '搜尋': 'search', '辭典': 'dict', '匯出': 'export', '導航': 'nav', '顯示': 'display',
          '字體': 'font', '科標': 'label', '功能': 'features', '裝置': 'devices', '即時': 'presence', '趨勢': 'trend', '資料量': 'size', '登錄': 'registry'}
DEVICE = {'phone': '手機', 'tablet': '平板', 'desktop': '電腦'}
DEV_IN = {'手機': 'phone', '平板': 'tablet', '電腦': 'desktop', 'phone': 'phone', 'tablet': 'tablet', 'desktop': 'desktop'}
MODE = {'web': '網頁', 'pwa': 'PWA'}
SORT = {'時間': 'time', 'time': 'time', '次數': 'opens', 'opens': 'opens'}
MODEL = {'action': 'A', 'toggle': 'T', 'choice': 'C', 'continuous': 'K', 'navigation': 'N', 'export': 'X', 'flow': 'F', 'system': 'S',
         '動作': 'A', '開關': 'T', '選項': 'C', '連續值': 'K', '導航': 'N', '匯出': 'X', '流程': 'F', '系統': 'S'}
MODEL_NAME = {'A': '動作', 'T': '開關', 'C': '選項', 'K': '連續值', 'N': '導航', 'X': '匯出', 'F': '流程', 'S': '系統'}
OTHER_REGISTRY = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'registry')


def get_token():
    tok = os.environ.get('YOGA_STATS_TOKEN')
    if tok:
        return tok.strip()
    try:
        out = subprocess.run(['security', 'find-generic-password', '-s', KEYCHAIN_SERVICE, '-w'], capture_output=True, text=True, timeout=30)
        if out.returncode == 0 and out.stdout.strip():
            return out.stdout.strip()
    except (OSError, subprocess.SubprocessError):
        pass
    sys.exit('找不到管理 token。請在 macOS 鑰匙圈建立服務名「%s」的項目，或設定環境變數 YOGA_STATS_TOKEN。' % KEYCHAIN_SERVICE)


def call(path, params=None):
    base = os.environ.get('YOGA_STATS_URL', DEFAULT_URL).rstrip('/')
    q = urllib.parse.urlencode([(k, v) for k, v in (params or {}).items() if v not in (None, '')])
    req = urllib.request.Request(base + path + ('?' + q if q else ''), headers={'Authorization': 'Bearer ' + get_token(), 'User-Agent': 'yoga-stats-cli/2.0'})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        hint = {401: 'token 不正確（或 Worker 未設定 ADMIN_TOKEN）', 403: '被拒絕（可能是 Cloudflare 防護規則）', 400: '參數不正確', 404: '網址不正確或找不到',
                409: '短代號對到多個實例，請多給幾碼（最多 8 碼）', 500: '伺服器錯誤'}.get(e.code, '')
        try:
            msg = json.load(e).get('error')
        except Exception:
            msg = None
        sys.exit('查詢失敗：HTTP %d %s' % (e.code, msg or hint))
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        sys.exit('無法連線到統計伺服器：%s' % getattr(e, 'reason', e))


# ---- 格式 ----
def wid(s):
    return sum(2 if unicodedata.east_asian_width(c) in 'WF' else 1 for c in str(s))


def pad(s, n, right=False):
    s = str(s); gap = max(0, n - wid(s))
    return (' ' * gap + s) if right else (s + ' ' * gap)


def table(rows, head, right=()):
    cols = list(zip(*([head] + rows))) if rows else [[h] for h in head]
    ws = [max(wid(c) for c in col) for col in cols]
    def line(r):
        return '  '.join(pad(c, ws[i], i in right) for i, c in enumerate(r)).rstrip()
    return [line(head)] + [line(r) for r in rows]


def dur(sec):
    sec = int(sec or 0)
    if sec < 60:
        return '%d 秒' % sec
    m = sec / 60.0
    return ('%d 分鐘' % round(m)) if m >= 10 else ('%.1f 分鐘' % m)


def total_dur(sec):
    return dur(sec) if sec < 3600 else '%.1f 小時' % (sec / 3600.0)


def pct(a, b):
    return '%d%%' % round(100.0 * a / b) if b else '—'


def span(p):
    return p['start'] if p['start'] == p['end'] else '%s～%s' % (p['start'], p['end'])


def head(d):
    return '%s（%s）' % (RANGE_LABEL.get(d.get('range'), d.get('range')), span(d['period']))


def title(d, name=None):
    out = ['《瑜伽師地論》匿名 App 分析', '']
    out.append(('%s｜%s' % (name, head(d))) if name else head(d))
    if d.get('dev'):
        out.append('裝置：%s' % DEVICE[d['dev']])
    return out


def emit(a, d, text):
    print(json.dumps(d, ensure_ascii=False, indent=2) if a.json else text)


# ---- 科判登錄檔（還原節點標題；只在 Mac 本機讀取 analytics/registry/*.json.gz）----
_KP = {}


def kepan_title(ns, idx):
    if ns not in _KP:
        path = os.path.join(OTHER_REGISTRY, 'kepan-%s.json.gz' % ns)
        try:
            with gzip.open(path, 'rt', encoding='utf-8') as f:
                _KP[ns] = json.load(f)
        except (OSError, ValueError):
            _KP[ns] = None
    reg = _KP[ns]
    if not reg or idx >= len(reg['nodes']):
        return '%s#%d（登錄檔不含此版本）' % (ns, idx)
    parts, i, guard = [], idx, 0
    while i is not None and i >= 0 and guard < 4:
        n = reg['nodes'][i]; parts.append(n[0] or '（無標題）'); i = n[2]; guard += 1
    n0 = reg['nodes'][idx]
    return '%s #%d 卷%s %s%s' % ('藏' if ns[0] == 'z' else '韓', idx, n0[4], '／'.join(reversed(parts)), '')


# ---- 各主題輸出 ----
def render_summary(d, kind='summary'):
    out = ['《瑜伽師地論》匿名 App 分析', '', head(d)]
    if d.get('dev'):
        out.append('裝置：%s' % DEVICE[d['dev']])
    if kind in ('summary', 'returning'):
        out += ['匿名使用實例：%d' % d['instances'], '新實例：%d' % d['new'], '回訪實例：%d' % d['returning'], '回訪率：%d%%' % round(d['returning_rate'] * 100)]
    else:
        out.append('匿名使用實例：%d' % d['instances'])
    if kind == 'summary':
        out += ['App 開啟：%d 次' % d['opens'], '有效使用時間合計：%s' % total_dur(d['active_seconds']), '有效閱讀時間合計：%s' % total_dur(d.get('read_seconds', 0))]
        if d.get('avg_active_seconds_per_open') is not None:
            out.append('平均有效使用時間：%s（每次開啟）' % dur(d['avg_active_seconds_per_open']))
        if d.get('devices'):
            out.append('裝置：' + '、'.join('%s %d' % (DEVICE.get(x['d'], '未知'), x['n']) for x in d['devices']))
        if d.get('modes'):
            out.append('模式：' + '、'.join('%s %d' % (MODE.get(x['m'], '未知'), x['n']) for x in d['modes']))
        if d.get('top_juan'):
            out.append('熱門卷（有效閱讀時間）：' + '、'.join('卷%d（%d 人 %s）' % (x['juan'], x['u'], dur(x['sec'])) for x in d['top_juan']))
        out += ['搜尋：%d 次｜辭典查詢：%d 次｜功能使用：%d 次（%d／%d 種）' % (d.get('search_total', 0), d.get('dict_total', 0), d.get('features_total', 0), d.get('features_used', 0), d.get('registry_total', 0))]
    if kind in ('summary', 'returning') and d.get('frequency'):
        f = d['frequency']
        out += ['', '使用頻率（期間內活躍實例的累計開啟次數）：'] + ['  %s：%d' % (n, f[k]) for k, n in (('1', '1 次'), ('2-5', '2–5 次'), ('6-20', '6–20 次'), ('20+', '20 次以上'))]
    if kind in ('summary', 'regions') and d.get('cities') is not None:
        out += ['', '城市（匿名使用實例數）：'] + (['  %s：%d' % (c['city'], c['active']) for c in d['cities']] or ['  （尚無資料）'])
    out += ['', '註：「匿名使用實例」不等於自然人；換瀏覽器／裝置／清除網站資料會算成新實例。',
            '    城市由網路連線粗略推算，可能不準；少於 %d 個實例的地區併入「其他」。' % d['k_min']]
    return '\n'.join(out)


def mins(sec):
    return int(round((sec or 0) / 60.0))


def render_users(d):
    out = ['《瑜伽師地論》匿名 App 分析', '', '匿名使用實例（%s %s，共 %d 個）' % (RANGE_LABEL[d['range']], span(d['period']), d['total'])]
    if not d['instances']:
        out.append('（尚無資料）')
    for x in d['instances']:
        out.append('%s｜%s｜%s｜%s｜%d 次｜%d 分｜閱讀 %d 分｜搜尋 %d｜辭典 %d｜%s～%s' % (x['code'], x['city'], DEVICE.get(x['device'], '未知'), MODE.get(x.get('mode'), '—'), x['opens'], mins(x['active_seconds']),
                   mins(x.get('read_seconds', 0)), x.get('search_total', 0), x.get('dict_total', 0), x.get('first_day', '?'), x.get('last_day', '?')))
    if d['total'] > len(d['instances']):
        out.append('（僅列出前 %d 個；可用 --limit 調整、--sort 次數 改排序）' % len(d['instances']))
    out += ['', '註：短代號只用來區分實例，不代表任何人；搜尋／辭典為累計次數；城市為最新一次的粗略判斷，', '    裝置只分手機／平板／電腦；每日明細只保留約 2 個月。']
    return '\n'.join(out)


def render_instance(d):
    out = ['《瑜伽師地論》匿名 App 分析', '', '匿名實例 %s…' % d['code'], '城市：%s（最新一次）' % d['city'], '裝置：%s｜模式：%s' % (DEVICE.get(d['device'], '未知'), MODE.get(d.get('mode'), '—')),
           '首次出現：%s　最後出現：%s' % (d['first_day'], d['last_day']),
           '累計：開啟 %d 次｜有效使用 %d 分鐘｜有效閱讀 %d 分鐘｜搜尋 %d 次｜辭典 %d 次' % (d['opens_total'], mins(d['active_seconds_total']), mins(d.get('read_seconds_total', 0)), d.get('search_total', 0), d.get('dict_total', 0))]
    for key, label in (('today', '今天'), ('week', '本週'), ('month', '本月')):
        v = d['periods'][key]
        out += ['', label, '開啟：%d 次' % v['opens'], '有效使用：%d 分鐘' % mins(v['active_seconds'])]
    if d.get('day'):
        x = d['day']
        out += ['', '%s 當日摘要' % x['day'], '開啟 %d 次｜有效使用 %d 分鐘｜有效閱讀 %d 分鐘' % (x['opens'], mins(x['active_seconds']), mins(x['read_seconds']))]
        if x['reading']:
            out.append('閱讀：' + '｜'.join('卷%d（%s）%d 分' % (r['juan'], '藏' if r['e'] == 'z' else '韓', mins(r['sec'])) for r in x['reading']))
        out.append('搜尋 %d 次（成功 %d、零結果 %d）｜辭典 %d 次（未命中 %d）' % (x['search']['submit'], x['search']['ok'], x['search']['zero'], x['dict']['lookup'], x['dict']['miss']))
        if x['features']:
            out.append('功能：' + '｜'.join('%s %d' % (f['feature'], f['n']) for f in x['features'][:12]))
        out.append('科判：點過 %d 個不同節點，單一節點最多重複 %d 次' % (x['nodes']['distinct'], x['nodes']['max_repeat']))
    out += ['', '註：每日明細只保留約 2 個月；本工具不顯示此實例的搜尋詞、辭典詞、節點清單與設定組合。']
    return '\n'.join(out)


def feat_rows(fs, limit=None, total_inst=None):
    rows = []
    for f in (fs[:limit] if limit else fs):
        rows.append([f['id'], f['model'], f['u'], pct(f['u'], total_inst) if total_inst else '', f['n'], ('%.1f' % (f['n'] / float(f['u']))) if f['u'] else '—', f['rep'] if f['u'] else '—'])
    return table(rows, ['功能', '型', '使用實例', '占比', '次數', '平均/實例', '重複'], right=(2, 3, 4, 5, 6))


def render_features(d, a):
    out = title(d, '功能')
    fs = d['features']
    out += feat_rows(fs, a.limit if a.limit != 30 or not (a.all or a.unused) else None, d['instances'])
    if a.unused:
        out += ['', '（Registry %d 項；本期間 0 次：%d 項）' % (d['registry_total'], len(fs))]
        note = [f['id'] for f in fs if f.get('devices') and f['devices'] not in ('全部',)]
        if note:
            out.append('註：下列功能只在特定裝置／版本出現，0 次不一定是沒人用：' + '、'.join(note[:15]) + ('…' if len(note) > 15 else ''))
    else:
        out += ['', '（Registry %d 項；本期間有使用 %d 項，0 次 %d 項）' % (d['registry_total'], d['used_total'], d['registry_total'] - d['used_total'])]
    return '\n'.join(out)


def render_reading(d, a):
    out = title(d, '閱讀')
    if a.by == 'edition':
        return None
    out += ['有效閱讀人數／時間（依卷；人數少於 %d 的卷併入「其他」）' % d['k']]
    rows = [['卷%d' % x['juan'], x['u'], x['opens'], dur(x['sec']), dur(x['avg']), x['rep']] for x in d['juans'][:a.limit if a.limit != 30 else 100]]
    out += table(rows, ['卷', '人數', '進入', '有效閱讀', '平均/人', '再回來'], right=(1, 2, 3, 4, 5))
    if d['other']['juans']:
        out.append('其他：%d 卷，合計 %s' % (d['other']['juans'], total_dur(d['other']['sec'])))
    z = d['zero_juans']
    out += ['', '無人閱讀的卷（%d）：%s' % (len(z), ranges(z) if z else '無')]
    return '\n'.join(out)


def ranges(nums):
    out, i = [], 0
    while i < len(nums):
        j = i
        while j + 1 < len(nums) and nums[j + 1] == nums[j] + 1:
            j += 1
        out.append(str(nums[i]) if i == j else '%d–%d' % (nums[i], nums[j])); i = j + 1
    return '、'.join(out)


def render_nodes(d, f):
    out = title(d, '科判')
    out += ['節點排行（使用實例少於 %d 的節點併入「其他」；不顯示任何個別實例）' % d['k']]
    rows = [[kepan_title(x['ns'], x['node']), x['u'], x['n'], x['rep'], x['rep_days']] for x in d['nodes']]
    out += table(rows, ['節點', '人數', '次數', '重複', '跨日重複'], right=(1, 2, 3, 4))
    out.append('其他：%d 個節點，共 %d 次' % (d['other']['nodes'], d['other']['n']))
    out += ['', '入口與一層操作：'] + feat_rows([x for x in f['features'] if x['n']], None, f['instances'])
    return '\n'.join(out)


def render_edition(d, f):
    out = title(d, '版本')
    names = {'z': '藏經版', 'h': '韓版'}
    inst = {x['e']: x['u'] for x in d['editions']}
    out += ['有效閱讀依版本與來源（預設／主動選擇）：']
    rows = [[names[x['e']], '主動選擇' if x['src'] else '預設', x['u'], x['opens'], dur(x['sec'])] for x in d['rows']]
    out += table(rows, ['版本', '來源', '人數', '進入', '有效閱讀'], right=(2, 3, 4))
    out += ['', '各版使用實例：' + '、'.join('%s %d' % (names[k], v) for k, v in sorted(inst.items())), '同時使用兩版的實例：%d' % d['both_instances'], '', '切換與入口：']
    out += feat_rows([x for x in f['features'] if x['n']], None, f['instances'])
    return '\n'.join(out)


def dim_lines(dims):
    out = []
    for x in dims:
        dflt = x['default'] if not isinstance(x['default'], dict) else '依裝置'
        total = x.get('total_sec') or 0
        head_ = '%s（%s；預設 %s）' % (x['name'], x['dim'], dflt)
        out.append(head_)
        if x['basis'] == 'active' and x['default_sec'] is not None:
            out.append('  預設值：%s（%s）' % (dur(x['default_sec']), pct(x['default_sec'], total)))
        for v in x['values']:
            if x['basis'] == 'reading' or v['sec']:
                out.append('  %s：%s（%s）｜%d 人' % (v['val'], dur(v['sec']), pct(v['sec'], total), v['u']))
    return out


def render_bundle(d, name, a):
    out = title(d, name)
    fs = [f for f in d['features'] if f['n'] or a.all]
    out += ['功能使用：'] + (feat_rows(fs, None, d.get('instances')) if fs else ['  （本期間無資料）'])
    if d['dims']:
        out += ['', '狀態維度（只有非預設值被記錄；預設值＝總有效秒－非預設秒）：'] + dim_lines(d['dims'])
    return '\n'.join(out)


def term_lines(terms, other, label):
    out = [label]
    out += ['  %s｜%d 人次｜%d 次' % (t['term'], t['u'], t['n']) for t in terms] or ['  （無，或人次少於門檻）']
    if other['terms']:
        out.append('  其他：%d 個詞，共 %d 次' % (other['terms'], other['n']))
    return out


def counter(fs, key):
    for f in fs:
        if f['id'] == key:
            return f['n']
    return 0


def render_search(d):
    out = title(d, '搜尋')
    sub, ok, zero = counter(d['features'], 'search.submit'), counter(d['features'], 'search.ok'), counter(d['features'], 'search.zero')
    out += ['搜尋次數：%d｜成功 %d（%s）｜零結果 %d（%s）' % (sub, ok, pct(ok, sub), zero, pct(zero, sub)),
            '修正成功：%d｜點開結果：%d｜放棄：%d' % (counter(d['features'], 'search.recovered'), counter(d['features'], 'search.opened'), counter(d['features'], 'search.abandoned')), '']
    out += term_lines(d['terms'], d['terms_other'], '熱門搜尋詞：') + [''] + term_lines(d['zero_terms'], d['zero_other'], '熱門零結果詞：')
    if d['recovered']:
        out += ['', '零結果後的修正：'] + ['  %s → %s｜%d 次' % (x['from_term'], x['to_term'], x['n']) for x in d['recovered']]
    out += ['', '註：%s；詞只在通過隱私過濾後才統計，含英文字母、網址、長數字者不入庫。' % d['note']]
    return '\n'.join(out)


def render_dict(d):
    out = title(d, '辭典')
    lk = sum(f['n'] for f in d['features'] if f['id'].startswith('dict.lookup.'))
    hit, miss = counter(d['features'], 'dict.hit'), counter(d['features'], 'dict.miss')
    out += ['查詢：%d 次｜命中 %d｜未命中 %d（%s）' % (lk, hit, miss, pct(miss, hit + miss)), '']
    out += term_lines(d['hit'], d['hit_other'], '熱門詞條：') + [''] + term_lines(d['miss'], d['miss_other'], '常見未命中：')
    if d['juans']:
        out += ['', '常伴隨查詞的卷：' + '、'.join('卷%d（%d）' % (x['juan'], x['n']) for x in d['juans'])]
    out += ['', '註：%s' % d['note']]
    return '\n'.join(out)


def render_export(d):
    out = title(d, '匯出')
    g = d['groups']
    out += ['匯出摘要：%d 次（失敗 %d）' % (d['total'], d['failed'])]
    for key, label in (('kind', '類型'), ('fmt', '格式'), ('pack', '封裝'), ('parts', '內容'), ('label', '科判表標籤')):
        if g[key]:
            out.append('%s：%s' % (label, '、'.join('%s %d' % (k, v) for k, v in sorted(g[key].items(), key=lambda kv: -kv[1]))))
    if d['top_juans']:
        out.append('最常涵蓋的卷：' + '、'.join('卷%d（%d）' % (x['i'], x['n']) for x in d['top_juans']))
    if d['top_pages']:
        out.append('科判表最常涵蓋的頁：' + '、'.join('第%d頁（%d）' % (x['i'], x['n']) for x in d['top_pages']))
    out += ['', '功能：'] + feat_rows([x for x in d['features'] if x['n']], None, None)
    return '\n'.join(out)


def render_devices(parts, ov):
    d0 = parts['phone']
    out = title({'range': d0['range'], 'period': d0['period']}, '裝置')
    names = {'phone': '手機', 'tablet': '平板', 'desktop': '電腦'}
    out.append('實例：' + '、'.join('%s %d' % (names[k], v['instances']) for k, v in parts.items()))
    ids = {}
    for k, v in parts.items():
        for f in v['features']:
            ids.setdefault(f['id'], {})[k] = f
    rows = []
    for fid, m in sorted(ids.items(), key=lambda kv: -sum(x['u'] for x in kv[1].values()))[:40]:
        rows.append([fid] + ['%d（%s）' % (m[k]['u'], pct(m[k]['u'], parts[k]['instances'])) if k in m else '0' for k in names])
    out += [''] + table(rows, ['功能（使用實例，占該裝置）', '手機', '平板', '電腦'], right=(1, 2, 3))
    return '\n'.join(out)


def render_presence(d, recent=False):
    srv = d['server_time'][11:19]
    out = ['即時使用狀況（伺服器時間 %s UTC）' % srv]
    lst = d['recent'] if recent else d['online']
    out += ['目前在線：%d 個 anonymous instances（最後心跳 ≤ %d 秒）' % (len(d['online']), d['timeout']),
            '最近 5 分鐘活躍 %d｜最近 15 分鐘活躍 %d｜今天使用過 %d（長期統計，來源不同）' % (d['active_5m'], d['active_15m'], d['today_used']), '']
    if d['mode'] == 'watch' and not lst:
        out.append('目前為 watch 模式：監看窗口剛開始，約 30 秒後資料才完整。')
    rows = [[x['code'], DEVICE.get(x['device'], '?'), 'PWA' if x['mode'] == 'pwa' else 'Web', x['city'], '%d 秒前' % x['ago']] for x in lst]
    out += table(rows, ['代號', '裝置', '模式', '地區', '最後活動']) if rows else ['（目前沒有在線的實例）']
    out += ['', '在線＝最近有送心跳且在前景互動；背景、鎖屏、閒置超過約 90 秒、關閉分析或啟用 DNT／GPC 的不會出現。', '5／15 分鐘活躍只涵蓋有送心跳的實例，與長期統計不可混用。']
    return '\n'.join(out)


def render_trend(d):
    out = ['《瑜伽師地論》匿名 App 分析', '', '趨勢（最近 %d 天）' % d['days']]
    out += table([[r['day'], r['active'], r['new'], r['opens'], mins(r['sec'])] for r in d['rows']], ['日期', '活躍實例', '新實例', '開啟', '有效分鐘'], right=(1, 2, 3, 4))
    return '\n'.join(out)


def render_size(d):
    out = ['《瑜伽師地論》匿名 App 分析', '', '資料量（列數；估計大小 %.1f MB，不含索引，僅供參考）' % (d['estimated_bytes'] / 1048576.0)]
    out += table([[t['table'], t['rows']] for t in d['tables']], ['資料表', '列數'], right=(1,)) + ['', '註：' + d['note']]
    return '\n'.join(out)


def render_registry(d):
    out = ['《瑜伽師地論》匿名 App 分析', '', 'Registry v%s：功能 %d 項（啟用 %d）｜狀態維度 %d｜排除項 %d｜觸發規則 %d' % (d['version'], d['features'], d['active'], d['states'], d['excluded'], d['rules']),
           '各型：' + '、'.join('%s %d' % (MODEL_NAME.get(k, k), v) for k, v in sorted(d['by_model'].items()))]
    if d['verify_pending']:
        out += ['', '尚待以實際 DOM／行為核對（%d）：' % len(d['verify_pending'])] + ['  ' + x for x in d['verify_pending']]
    return '\n'.join(out)


# ---- 主程式 ----
def build_parser():
    ap = argparse.ArgumentParser(prog='瑜伽統計', description='查詢《瑜伽師地論》匿名 App 分析')
    ap.add_argument('what', help='今天｜本週｜本月｜使用者｜實例｜閱讀｜科判｜版本｜註釋｜搜尋｜辭典｜匯出｜導航｜顯示｜字體｜科標｜功能｜裝置｜即時｜回訪｜地區｜趨勢｜資料量｜登錄')
    ap.add_argument('period', nargs='?', help='範圍：今天｜本週｜本月；實例請給短代號；趨勢請給 7 或 30')
    ap.add_argument('--limit', type=int, default=30)
    ap.add_argument('--sort', default=None)
    ap.add_argument('--date'); ap.add_argument('--from', dest='from_', default=None); ap.add_argument('--to')
    ap.add_argument('--day', help='實例的指定日期 YYYY-MM-DD')
    ap.add_argument('--裝置', dest='dev', default=None)
    ap.add_argument('--全部', dest='all', action='store_true'); ap.add_argument('--未使用', dest='unused', action='store_true'); ap.add_argument('--類型', dest='type', default=None)
    ap.add_argument('--timeout', type=int, default=None); ap.add_argument('--監看', dest='watch', action='store_true'); ap.add_argument('--最近', dest='recent', action='store_true')
    ap.add_argument('--by', default=None, help='（閱讀）juan｜edition｜state')
    ap.add_argument('--json', action='store_true')
    return ap


def valid_date(s):
    return s and len(s) == 10 and s[4] == '-' and s[7] == '-' and s.replace('-', '').isdigit()


def main(argv=None, sleep=time.sleep):
    a = build_parser().parse_intermixed_args(argv)
    for opt, val in (('--date', a.date), ('--from', a.from_), ('--to', a.to), ('--day', a.day)):
        if val is not None and not valid_date(val):
            sys.exit('%s 格式須為 YYYY-MM-DD' % opt)
    if a.sort is not None and a.what in ('使用者',) and a.sort not in SORT:
        sys.exit('--sort 須為 時間 或 次數')
    dev = None
    if a.dev is not None:
        if a.dev not in DEV_IN:
            sys.exit('--裝置 須為 手機、平板 或 電腦')
        dev = DEV_IN[a.dev]
    if a.limit < 1:
        sys.exit('--limit 須為正整數')
    mtype = None
    if a.type is not None:
        mtype = MODEL.get(a.type.lower() if a.type.isascii() else a.type, a.type.upper() if len(a.type) == 1 else None)
        if mtype not in MODEL_NAME:
            sys.exit('--類型 須為 action、toggle、choice、continuous、navigation、export、flow、system（或單字母 A/T/C/K/N/X/F/S）')
    if a.what in RANGES:
        topic, rng = 'summary', RANGES[a.what]
    elif a.what in TOPICS:
        topic = TOPICS[a.what]
        if a.period and topic not in ('instance', 'trend') and a.period not in RANGES:
            sys.exit('範圍須為 今天、本週 或 本月')
        default = 'today' if topic in ('users',) else 'month'
        rng = RANGES[a.period] if a.period in RANGES else default
    else:
        sys.exit('不認得「%s」。可用：今天、本週、本月、使用者、實例、閱讀、科判、版本、註釋、搜尋、辭典、匯出、導航、顯示、字體、科標、功能、裝置、即時、回訪、地區、趨勢、資料量、登錄' % a.what)
    P = {'range': None if a.from_ else rng, 'date': a.date, 'from': a.from_, 'to': a.to, 'dev': dev}
    P = {k: v for k, v in P.items() if v}

    if topic == 'instance':
        code = (a.period or '').strip()
        if not (4 <= len(code) <= 8) or any(c not in '0123456789abcdefABCDEF' for c in code):
            sys.exit('請給 4 到 8 碼的短代號（十六進位），例如：瑜伽統計 實例 A7F3C2')
        d = call('/admin/instance', {'code': code, 'day': a.day}); return emit(a, d, render_instance(d))
    if topic == 'summary':
        d = call('/admin/overview', P); return emit(a, d, render_summary(d))
    if topic in ('returning', 'regions'):
        d = call('/admin/overview', {k: v for k, v in P.items() if k != 'dev'}); return emit(a, d, render_summary(d, topic))
    if topic == 'users':
        sort = SORT.get(a.sort or '時間')
        d = call('/admin/instances', {**{k: v for k, v in P.items() if k != 'dev'}, 'limit': max(1, min(200, a.limit)), 'sort': sort}); return emit(a, d, render_users(d))
    if topic == 'reading':
        a.by = a.by or 'juan'
        if a.by == 'juan':
            d = call('/admin/reading', {**P, 'by': 'juan', 'sort': {'人數': 'users', '次數': 'opens', '時間': 'sec', '平均': 'avg'}.get(a.sort or '時間', 'sec')}); return emit(a, d, render_reading(d, a))
        d = call('/admin/reading', {**P, 'by': a.by}); return emit(a, d, json.dumps(d, ensure_ascii=False, indent=2))
    if topic == 'nodes':
        d = call('/admin/nodes', {**P, 'sort': {'人數': 'users', '次數': 'count', '重複': 'rep'}.get(a.sort or '人數', 'users'), 'limit': min(a.limit, 100)})
        f = call('/admin/features', {**P, 'prefix': 'kepan.', 'all': '1'}); return emit(a, {'nodes': d, 'features': f}, render_nodes(d, f))
    if topic == 'edition':
        d = call('/admin/reading', {**P, 'by': 'edition'}); f = call('/admin/features', {**P, 'prefix': 'edition.', 'all': '1'}); return emit(a, {'reading': d, 'features': f}, render_edition(d, f))
    path = {'notes': ('/admin/notes', '註釋'), 'nav': ('/admin/nav', '導航'), 'display': ('/admin/display', '顯示'), 'font': ('/admin/font', '字體'), 'label': ('/admin/label', '科標')}
    if topic in path:
        d = call(path[topic][0], P); return emit(a, d, render_bundle(d, path[topic][1], a))
    if topic == 'search':
        d = call('/admin/search', {**P, 'limit': min(a.limit, 100)}); return emit(a, d, render_search(d))
    if topic == 'dict':
        d = call('/admin/dict', {**P, 'limit': min(a.limit, 100)}); return emit(a, d, render_dict(d))
    if topic == 'export':
        d = call('/admin/export', P); return emit(a, d, render_export(d))
    if topic == 'features':
        d = call('/admin/features', {**P, 'all': '1' if a.all else '', 'unused': '1' if a.unused else '', 'type': mtype}); return emit(a, d, render_features(d, a))
    if topic == 'devices':
        parts = {k: call('/admin/features', {**{x: y for x, y in P.items() if x != 'dev'}, 'dev': k}) for k in ('phone', 'tablet', 'desktop')}; return emit(a, parts, render_devices(parts, None))
    if topic == 'presence':
        params = {'timeout': a.timeout}
        if a.timeout is not None and not 30 <= a.timeout <= 300:
            sys.exit('--timeout 須為 30–300 秒')
        if not a.watch:
            d = call('/admin/presence', params); return emit(a, d, render_presence(d, a.recent))
        try:
            while True:
                d = call('/admin/presence', params)
                print(('\033[2J\033[H' if sys.stdout.isatty() else '') + render_presence(d, a.recent), flush=True)
                sleep(5)
        except KeyboardInterrupt:
            return
    if topic == 'trend':
        n = 7 if not a.period else a.period
        if str(n) not in ('7', '30'):
            sys.exit('趨勢天數須為 7 或 30')
        d = call('/admin/trend', {'days': n}); return emit(a, d, render_trend(d))
    if topic == 'size':
        d = call('/admin/size'); return emit(a, d, render_size(d))
    if topic == 'registry':
        d = call('/admin/registry'); return emit(a, d, render_registry(d))


if __name__ == '__main__':
    main()
