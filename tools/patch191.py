import sys, json, re
SRC, DST = sys.argv[1], sys.argv[2]
s = open(SRC, encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    c = s.count(old)
    if c != n: raise SystemExit('count %d: %r' % (c, old[:90]))
    s = s.replace(old, new)
ZLINK = '<a class="srcl" href="https://dlbs.liberal.ntu.edu.tw/FULLTEXT/sutra/chi_pdf/sutra14/T30n1579.pdf" target="_blank" rel="noopener">dlbs.liberal.ntu.edu.tw／T30n1579.pdf</a>'
# 1. 關於：藏經兩段合併為一段
rep('<br><br>藏版（大藏經原文）來源：《大正藏》第30冊 No.1579《瑜伽師地論》，臺灣大學佛學數位圖書館 PDF：' + ZLINK + '</p>', '</p>')
rep('<p class="src">內文、分卷、科判、披尋記與常柏法師釋，全部依', '<p class="src">韓版：內文、分卷、科判、披尋記與常柏法師釋，全部依')
ZP = '藏經版：原文、分卷與科判依《大正藏》第30冊 No.1579《瑜伽師地論》（唐玄奘譯，一百卷）整理，原文取自臺灣大學佛學數位圖書館 PDF：' + ZLINK.replace("'", "\\'") + '。本頁僅重新排版，排版、卷次目錄與直書科判沿用同一介面。'
rep("src.innerHTML=zang?'藏經科判：原文、分卷與科判依所附大藏經版本整理（唐玄奘譯，一百卷），本頁僅重新排版，排版、卷次目錄與直書科判沿用同一介面。<br><br>'+src.dataset.hk:src.dataset.hk;",
    "src.innerHTML=zang?'" + ZP + "<br><br>'+src.dataset.hk:src.dataset.hk+'<br><br>" + ZP + "';")
# 2. 版本名稱
rep("$('editionCur').textContent=zang?'藏版':'韓版';", "$('editionCur').textContent=zang?'藏經版':'韓版';")
rep('<em class="mi-val" id="editionCur">藏</em>', '<em class="mi-val" id="editionCur">藏經版</em>')
rep('<span class="ed-t"><b>藏經科判</b>', '<span class="ed-t"><b>大藏經版</b>')
# 3. 頁碼輸入改為文字（可配合數字鍵）
rep('<input id="pNum" type="number" min="2" aria-label="科判頁碼" hidden>', '<input id="pNum" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" min="2" aria-label="科判頁碼" hidden>')
# 4. 回上方固定，不再跟著紙面移動
rep("function placeCT(){if(phoneMode()){return;}", "function placeCT(){if(true){var _v=$('pview');if(_v&&!panel.hidden&&_v.clientHeight)delete b.dataset.off;else b.dataset.off='1';return;}")
CSS = open('v191.css', encoding='utf-8').read()
JS = open('v191.js', encoding='utf-8').read()
m = re.search(r'var versionSummaries=(\{.*?\});', s)
SUM = json.loads(m.group(1)); SUM = dict([('1.91', "關於：藏經來源合併為一段。功能面板標題下方縮短；版本顯示「藏經版」，選項為「大藏經版」。科判欄右下頁碼改為「x/96」白色膠囊，可直接輸入或用 0–9 數字鍵跳頁；左下「回上方」固定在角落、平時淡、滑過才明顯，兩者左右對稱。滑鼠停在功能按鈕兩秒會出現小說明框。選取標題的黃底改為微圓角。")] + list(SUM.items()))
s = s[:m.start(1)] + json.dumps(SUM, ensure_ascii=False, separators=(',', ':')) + s[m.end(1):]
rep('"v1.90\\n最後更新：2026年10月5日\\n\\n"+versionSummaries["1.90"]', '"v1.91\\n最後更新：2026年10月5日\\n\\n"+versionSummaries["1.91"]')
rep('<b id="appVer">v1.90</b>', '<b id="appVer">v1.91</b>')
rep('id="appUpd" datetime="2026-10-04">2026-10-04<', 'id="appUpd" datetime="2026-10-05">2026-10-05<')
k = s.rindex('</body></html>'); s = s[:k] + '<style id="v191">' + CSS + '</style>\n<script id="v191js">' + JS + '</script>\n' + s[k:]
open(DST, 'w', encoding='utf-8').write(s); print('ok')
