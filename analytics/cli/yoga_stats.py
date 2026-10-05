#!/usr/bin/env python3
"""瑜伽統計：查詢《瑜伽師地論》匿名使用統計（W001，DECISIONS D040–D043）。

用法：
  瑜伽統計 今天|本週|本月      完整摘要
  瑜伽統計 回訪 [期間]         新／回訪與使用頻率（期間預設 本月）
  瑜伽統計 地區 [期間]         城市分布（期間預設 本月）
  瑜伽統計 使用者 [期間]       各匿名實例：短代號｜城市｜裝置｜開啟次數｜有效使用分鐘（期間預設 今天）
  瑜伽統計 實例 <短代號>       單一匿名實例的累計與今天／本週／本月
  選項：--date YYYY-MM-DD 指定該日所在的日／週／月；--json 輸出原始 JSON；
        --limit N（使用者清單筆數，預設 30）；--sort 時間|次數（預設 時間）

只用 Python 標準函式庫。匿名實例只顯示 6 碼短代號；伺服器不會回傳完整識別碼，
本工具也不輸出任何 IP、User-Agent 或使用內容（伺服器端根本沒有這些資料）。

設定（皆不得寫進 repository）：
  YOGA_STATS_URL    接收端網址（預設為公開的 Worker 網址）
  YOGA_STATS_TOKEN  管理 token；未設定時從 macOS 鑰匙圈讀取（服務名 yoga-stats-admin）
"""
import argparse, json, os, subprocess, sys, urllib.error, urllib.request

DEFAULT_URL = 'https://yogacara-stats.dppss92044.workers.dev'
KEYCHAIN_SERVICE = 'yoga-stats-admin'
RANGES = {'今天': 'today', '今日': 'today', 'today': 'today',
          '本週': 'week', '本周': 'week', 'week': 'week',
          '本月': 'month', 'month': 'month'}
RANGE_LABEL = {'today': '今日', 'week': '本週', 'month': '本月'}
CMDS = {'回訪': 'returning', 'returning': 'returning', '地區': 'regions', '地区': 'regions', 'regions': 'regions',
        '使用者': 'users', 'users': 'users', '實例': 'instance', '实例': 'instance', 'instance': 'instance'}
DEVICE = {'phone': '手機', 'tablet': '平板', 'desktop': '電腦'}
SORT = {'時間': 'time', 'time': 'time', '次數': 'opens', 'opens': 'opens'}


def get_token():
    tok = os.environ.get('YOGA_STATS_TOKEN')
    if tok:
        return tok.strip()
    try:
        out = subprocess.run(['security', 'find-generic-password', '-s', KEYCHAIN_SERVICE, '-w'],
                             capture_output=True, text=True, timeout=30)
        if out.returncode == 0 and out.stdout.strip():
            return out.stdout.strip()
    except (OSError, subprocess.SubprocessError):
        pass
    sys.exit('找不到管理 token。請在 macOS 鑰匙圈建立服務名「%s」的項目，或設定環境變數 YOGA_STATS_TOKEN。' % KEYCHAIN_SERVICE)


def fetch(rng, date=None, path='/admin/stats', extra=None):
    base = os.environ.get('YOGA_STATS_URL', DEFAULT_URL).rstrip('/')
    url = base + path + '?' + ('range=' + rng if rng else '') + ('&date=' + date if date else '') + ''.join('&%s=%s' % kv for kv in (extra or {}).items())
    url = url.replace('?&', '?')
    req = urllib.request.Request(url, headers={'Authorization': 'Bearer ' + get_token(), 'User-Agent': 'yoga-stats-cli/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        hint = {401: 'token 不正確（或 Worker 未設定 ADMIN_TOKEN）', 403: '被拒絕（可能是 Cloudflare 防護規則）',
                400: '參數不正確', 404: '網址不正確或找不到', 409: '短代號對到多個實例，請多給幾碼（最多 8 碼）', 500: '伺服器錯誤'}.get(e.code, '')
        try:
            msg = json.load(e).get('error')
        except Exception:
            msg = None
        sys.exit('查詢失敗：HTTP %d %s' % (e.code, msg or hint))
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        sys.exit('無法連線到統計伺服器：%s' % getattr(e, 'reason', e))


def dur(sec):
    if sec < 60:
        return '%d 秒' % sec
    m = sec / 60
    return ('%d 分鐘' % round(m)) if m >= 10 else ('%.1f 分鐘' % m)


def total_dur(sec):
    if sec < 3600:
        return dur(sec)
    return '%.1f 小時' % (sec / 3600)


def head(d):
    p = d['period']
    span = p['start'] if p['start'] == p['end'] else '%s～%s' % (p['start'], p['end'])
    return '%s（%s）' % (RANGE_LABEL[d['range']], span)


def freq_lines(d):
    f = d['frequency']
    names = [('1', '1 次'), ('2-5', '2–5 次'), ('6-20', '6–20 次'), ('20+', '20 次以上')]
    return ['  %s：%d' % (n, f[k]) for k, n in names]


def city_lines(d):
    if not d['cities']:
        return ['  （尚無資料）']
    return ['  %s：%d' % (c['city'], c['active']) for c in d['cities']]


def render(cmd, d):
    out = ['《瑜伽師地論》匿名使用統計', '', head(d)]
    if cmd in ('summary', 'returning'):
        out += ['匿名使用實例：%d' % d['instances'], '新實例：%d' % d['new'], '回訪實例：%d' % d['returning'],
                '回訪率：%d%%' % round(d['returning_rate'] * 100)]
    if cmd == 'summary':
        out += ['App 開啟：%d 次' % d['opens'], '平均有效使用時間：%s（每次開啟）' % dur(d['avg_active_seconds_per_open']),
                '有效使用時間合計：%s' % total_dur(d['active_seconds'])]
    if cmd in ('summary', 'returning'):
        out += ['', '使用頻率（期間內活躍實例的累計開啟次數）：'] + freq_lines(d)
    if cmd in ('summary', 'regions'):
        out += ['', '城市（匿名使用實例數）：'] + city_lines(d)
    out += ['', '註：「匿名使用實例」不等於自然人；換瀏覽器／裝置／清除網站資料會算成新實例。',
            '    城市由網路連線粗略推算，可能不準；少於 %d 個實例的地區併入「其他」。' % d['k_min']]
    return '\n'.join(out)


def mins(sec):
    return int(round(sec / 60.0))


def render_users(d):
    p = d['period']
    span = p['start'] if p['start'] == p['end'] else '%s～%s' % (p['start'], p['end'])
    out = ['《瑜伽師地論》匿名使用統計', '', '匿名使用實例（%s %s，共 %d 個）' % (RANGE_LABEL[d['range']], span, d['total'])]
    if not d['instances']:
        out.append('（尚無資料）')
    for x in d['instances']:
        out.append('%s｜%s｜%s｜%d 次｜%d 分' % (x['code'], x['city'], DEVICE.get(x['device'], '未知'), x['opens'], mins(x['active_seconds'])))
    if d['total'] > len(d['instances']):
        out.append('（僅列出前 %d 個；可用 --limit 調整、--sort 次數 改排序）' % len(d['instances']))
    out += ['', '註：短代號只用來區分實例，不代表任何人；城市為該實例最新一次的粗略判斷（依網路連線，可能不準），', '    裝置只分手機／平板／電腦；每日明細只保留約 2 個月。']
    return '\n'.join(out)


def render_instance(d):
    out = ['《瑜伽師地論》匿名使用統計', '', '匿名實例 %s…' % d['code'], '城市：%s（最新一次）' % d['city'], '裝置：%s' % DEVICE.get(d['device'], '未知'),
           '首次出現：%s　最後出現：%s' % (d['first_day'], d['last_day']),
           '累計：開啟 %d 次｜有效使用 %d 分鐘' % (d['opens_total'], mins(d['active_seconds_total']))]
    for key, label in (('today', '今天'), ('week', '本週'), ('month', '本月')):
        v = d['periods'][key]
        out += ['', label, '開啟：%d 次' % v['opens'], '有效使用：%d 分鐘' % mins(v['active_seconds'])]
    out += ['', '註：每日明細只保留約 2 個月；超過的部分只剩累計。']
    return '\n'.join(out)


def main(argv=None):
    ap = argparse.ArgumentParser(prog='瑜伽統計', description='查詢《瑜伽師地論》匿名使用統計')
    ap.add_argument('what', help='今天｜本週｜本月｜回訪｜地區｜使用者｜實例')
    ap.add_argument('period', nargs='?', help='回訪／地區／使用者可指定期間：今天｜本週｜本月；實例請給 6 碼短代號')
    ap.add_argument('--limit', type=int, default=30, help='使用者清單筆數（1–200，預設 30）')
    ap.add_argument('--sort', default='時間', help='使用者清單排序：時間｜次數（預設 時間）')
    ap.add_argument('--date', help='YYYY-MM-DD，查該日所在的日／週／月')
    ap.add_argument('--json', action='store_true', help='輸出原始 JSON')
    a = ap.parse_args(argv)
    if a.date and not (len(a.date) == 10 and a.date[4] == '-' and a.date[7] == '-'):
        sys.exit('--date 格式須為 YYYY-MM-DD')
    if a.sort not in SORT:
        sys.exit('--sort 須為 時間 或 次數')
    if a.what in RANGES:
        cmd, rng = 'summary', RANGES[a.what]
    elif a.what in CMDS:
        cmd = CMDS[a.what]
        if cmd == 'instance':
            code = (a.period or '').strip()
            if not (4 <= len(code) <= 8) or any(c not in '0123456789abcdefABCDEF' for c in code):
                sys.exit('請給 4 到 8 碼的短代號（十六進位），例如：瑜伽統計 實例 A7F3C2')
            d = fetch(None, None, '/admin/instance', {'code': code})
            print(json.dumps(d, ensure_ascii=False, indent=2) if a.json else render_instance(d))
            return
        if a.period and a.period not in RANGES:
            sys.exit('期間須為 今天、本週 或 本月')
        rng = RANGES[a.period] if a.period else ('today' if cmd == 'users' else 'month')
        if cmd == 'users':
            d = fetch(rng, a.date, '/admin/instances', {'limit': max(1, min(200, a.limit)), 'sort': SORT[a.sort]})
            print(json.dumps(d, ensure_ascii=False, indent=2) if a.json else render_users(d))
            return
    else:
        sys.exit('不認得「%s」。可用：今天、本週、本月、回訪、地區、使用者、實例' % a.what)
    d = fetch(rng, a.date)
    print(json.dumps(d, ensure_ascii=False, indent=2) if a.json else render(cmd, d))


if __name__ == '__main__':
    main()
