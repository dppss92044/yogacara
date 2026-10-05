#!/usr/bin/env python3
"""W001 匿名使用統計補丁（不綁版本號；W001 未發布前不改 appVer／sw.js）。
用法：python3 tools/patch-w001-stats.py index.html index.html
做三件事（每項都檢查出現次數，不符就中止）：
 1. 「關於」頁：在「版本／最後更新」之後、「版本紀錄」按鈕之前，加入「匿名使用統計」開關與告知。
 2. 導覽中「關於」的描述改為「這裡看版本、資料來源，也可以關閉匿名使用統計。」
 3. 注入 tools/stats-client.js（單一來源）與必要的少量 CSS。"""
import sys, os
SRC, DST = sys.argv[1], sys.argv[2]
here = os.path.dirname(os.path.abspath(__file__))
s = open(SRC, encoding='utf-8').read()
if 'hk-anon-stat-v1' in s:
    raise SystemExit('已套用過 W001 統計補丁，不重複套用')
def rep(old, new, n=1):
    global s
    c = s.count(old)
    if c != n: raise SystemExit('count %d: %r' % (c, old[:90]))
    s = s.replace(old, new)

NOTE = ('協助了解 App 的使用情況。啟用後，本 App 會用一組隨機產生的匿名識別來區分不同的 App／瀏覽器，'
        '並記錄開啟次數、有效使用時間、裝置大類（手機、平板或電腦），以及依網路連線粗略判斷的城市（不使用 GPS 定位）。'
        '這些資料不包含你的姓名或帳號，也不記錄搜尋、筆記、反白或閱讀內容。每日使用紀錄最多保留約 2 個月。'
        '可隨時關閉；關閉後會停止傳送，並刪除本機的匿名識別。')
BLOCK = ('<div class="grp stats-grp"><label class="sw stats"><span class="nm">匿名使用統計</span>'
         '<input type="checkbox" id="optStats" role="switch" checked><span class="tr" aria-hidden="true"></span></label>'
         '<p class="src stats-note">' + NOTE + '</p><p class="rp-msg" id="statsMsg" role="status"></p></div>\n')
ANCHOR = '<button class="mi version-history-button" id="versionHistoryBtn">'
rep(ANCHOR, BLOCK + ANCHOR)

rep('"d": "這裡看版本與資料來源。"', '"d": "這裡看版本、資料來源，也可以關閉匿名使用統計。"')

js = open(os.path.join(here, 'stats-client.js'), encoding='utf-8').read()
rep('</script>\n</body></html>\n<style>', '</script>\n<script>\n' + js + '</script>\n</body></html>\n<style>')

CSS = '''/* W001 匿名使用統計（關於頁） */
.settings-panel .stats-grp .sw{display:flex;width:100%;box-sizing:border-box;justify-content:space-between;gap:16px;min-height:52px;padding:12px 14px 0!important;font-size:16px}
.settings-panel .stats-grp .sw .nm{flex:1}
.settings-panel .stats-grp .stats-note{font-size:12.5px;line-height:1.75;color:var(--muted)}
.settings-panel .stats-grp .rp-msg{border-top:0!important;padding:0 14px 14px!important}
.settings-panel .stats-grp input:disabled+.tr{opacity:.5}
'''
assert s.endswith('</style>\n')
s = s[:-len('</style>\n')] + CSS + '</style>\n'
open(DST, 'w', encoding='utf-8').write(s)
print('已套用 W001 統計補丁 →', DST)
