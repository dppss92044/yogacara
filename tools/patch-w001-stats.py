#!/usr/bin/env python3
"""W001 Analytics v2 補丁（不綁版本號；未發布前不改 appVer／sw.js）。
用法：python3 tools/patch-w001-stats.py index.html index.html
只做一件事：把 tools/stats-client.js 注入 index.html，並把 /*W001_CFG*/null 換成
由 analytics/registry.json 與內嵌科判資料雜湊（dv）產生的設定。
不加任何 UI、不改文案、不改 CSS（D059：App 無統計 UI）。"""
import sys, os, json, re
SRC, DST = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
sys.path.insert(0, here)
mk = __import__('make-kepan-registry')
s = open(SRC, encoding='utf-8').read()
MARK = 'hk-analytics-mode-v2'
if MARK in s:
    raise SystemExit('已套用過 W001 Analytics v2 補丁，不重複套用')
reg = json.load(open(os.path.join(root, 'analytics', 'registry.json'), encoding='utf-8'))
zang = open(os.path.join(root, 'data', 'zang.js'), encoding='utf-8').read()
cfg = {
    'ids': [f['id'] for f in reg['features'] if f.get('status') == 'active'],
    'rules': reg['rules'],
    'dims': reg['states'],
    'dv': {'h': mk.dv_of(mk.hk_payload(s)), 'z': mk.dv_of(mk.zang_payload(zang))},
}
js = open(os.path.join(here, 'stats-client.js'), encoding='utf-8').read()
if js.count('/*W001_CFG*/null') != 1: raise SystemExit('客戶端缺少 CFG 佔位')
js = js.replace('/*W001_CFG*/null', json.dumps(cfg, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/'))
anchor = '</script>\n</body></html>\n<style>'
if s.count(anchor) != 1: raise SystemExit('注入點數量不符')
s = s.replace(anchor, '</script>\n<script>\n' + js + '</script>\n</body></html>\n<style>')
open(DST, 'w', encoding='utf-8').write(s)
print('已套用 W001 Analytics v2 補丁 →', DST, '（ids %d, rules %d, dims %d, dv %s）' % (len(cfg['ids']), len(cfg['rules']), len(cfg['dims']), cfg['dv']))
