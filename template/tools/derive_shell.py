#!/usr/bin/env python3
"""由瑜伽論 App（repo 根目錄 index.html）產生空白外殼 shell/index.html。

外殼保留全部介面與功能，只做以下改動：
  1. 拿掉內嵌的瑜伽論資料、韓清淨版與版本切換，固定讀 data/book.js。
  2. 書名、卷數、講記名稱改成 {{書名}}、{{卷數}}、{{講記一}} 等欄位，由 tools/build.py 填入。
  3. 移除匿名使用統計（不再送資料到 yogacara-stats）。
  4. localStorage／sessionStorage 與離線快取加上 {{代號}} 前綴，同一網域的多本書互不干擾。
  5. 版本紀錄、關於頁來源改成本書自己的。
App 更新後要同步時：重新執行本檔，再執行 tools/build.py。任何一處對不上會直接停下來。
用法：python3 tools/derive_shell.py [來源 index.html，預設 ../index.html]
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, '..', 'index.html')
s = open(SRC, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count: raise SystemExit('對不上（預期 %d 處，找到 %d 處）：%s' % (count, n, old[:80]))
    s = s.replace(old, new)


def rsub(pat, new, count=None, flags=0):
    global s
    s, n = re.subn(pat, new, s, flags=flags)
    if count is not None and n != count: raise SystemExit('對不上（預期 %d 處，找到 %d 處）：%s' % (count, n, pat[:80]))
    return n


# 1. 資料
rsub(r'(<script type="application/octet-stream" id="dz">).*?(</script>)', r'\1\2', 1, re.S)
rep('try { EDITION = localStorage.getItem("hk-edition-v154") === "hk" ? "hk" : "zang"; } catch (e) { EDITION = "zang"; }', 'EDITION = "zang";')
rep('sc.src = "data/zang.js"', 'sc.src = "data/book.js"')
# 版本切換介面全部隱藏（只有一個版本）
s = s.replace('</head>', '<style id="book-shell">#editionBtn,.edition-body,.ed-badge,#edBadge,[data-e="hk"],[data-e="zang"],[data-pr="edz"],[data-pr="edh"]{display:none!important}</style></head>', 1)
# 藏經版原本會隱藏講記開關；外殼要顯示
rep(':root[data-edition=zang] .notes-only,:root[data-edition=zang] .ex-kp,:root[data-edition=zang] .results .sopt{display:none!important}',
    ':root[data-edition=zang] .ex-kp{display:none!important}')

# 2. 統計
rsub(r'<script[^>]*>\s*/\* W001 Analytics v2 客戶端.*?</script>', '', 1, re.S)
if 'workers.dev' in s: raise SystemExit('統計程式沒有拿乾淨')

# 3. 儲存與快取分開
NS = ('<script id="book-ns">(function(){var P="{{代號}}:";[window.localStorage,window.sessionStorage].forEach(function(st){'
      'try{var g=st.getItem,p=st.setItem,r=st.removeItem;st.getItem=function(k){return g.call(st,P+k)};'
      'st.setItem=function(k,v){return p.call(st,P+k,v)};st.removeItem=function(k){return r.call(st,P+k)};}catch(e){}});})();</script>')
i = s.index('<script')
s = s[:i] + NS + s[i:]

# 4. 書名
for old, new in [('瑜伽師地論（藏經科判）', '{{書名}}'), ('瑜伽師地論（韓清淨科判）', '{{書名}}'),
                 ('瑜伽師地論藏經科判表', '{{書名}}科判表'), ('瑜伽師地論藏經科判_', '{{書名}}科判_'),
                 ('瑜伽師地論科判表（韓清淨科句）', '{{書名}}科判表'), ('瑜伽師地論科判表（韓清淨科）', '{{書名}}科判表'),
                 ('瑜伽師地論科判綱要', '{{書名}}'), ('<meta name="apple-mobile-web-app-title" content="瑜伽師地論">', '<meta name="apple-mobile-web-app-title" content="{{短名}}">')]:
    s = s.replace(old, new)
# 關於頁的來源說明（含藏經版切換時改寫的那段）
rsub(r'(<p class="src">).*?(</p>)', r'\1<span class="src-b">{{關於}}</span>\2', 1, re.S)
rsub(r"var src=\$\('about'\)\.querySelector\('\.src'\);if\(src\)\{.*?\}\n", '\n', 1, re.S)
s = s.replace('瑜伽師地論', '{{書名}}')

# 5. 卷數
def juan_cmp(m):
    return m.group(0)[:-3] + '{{卷數}}'
# cn()/cnum() 內的 n < 100 是中文數字，不換
keep = ['if (n < 100) return CN[', 'function cnum(n) { return n < 100 ?']
for k in keep: s = s.replace(k, k.replace('100', '\x00'))
rsub(r'(?:[<>]=?|===?)\s*100(?![\d%.])', juan_cmp, 31)
for k in keep: s = s.replace(k.replace('100', '\x00'), k)
rsub(r'Math\.min\(100,', 'Math.min({{卷數}},', 6)
for old, new, n in [('cl(ra+dx,1,100-span)', 'cl(ra+dx,1,{{卷數}}-span)', 1), ('cl(ra+dx,1,100)', 'cl(ra+dx,1,{{卷數}})', 1),
                    ('cl(rb+dx,1,100)', 'cl(rb+dx,1,{{卷數}})', 1), ('max:100,', 'max:{{卷數}},', 2), ('max="100"', 'max="{{卷數}}"', 2),
                    ('data-j="100"', 'data-j="{{卷數}}"', 1), ('$("exTo").value = 100;', '$("exTo").value = {{卷數}};', 1),
                    ('ra=1;rb=100;', 'ra=1;rb={{卷數}};', 4), ('prVb=100,', 'prVb={{卷數}},', 1), ('prSpanOf(rs){var a=100,', 'prSpanOf(rs){var a={{卷數}},', 1),
                    (":100,100);sv2('wr'", ":{{卷數}},{{卷數}});sv2('wr'", 1), ('setRange(1,100)', 'setRange(1,{{卷數}})', 1),
                    ('for (var c = 1; c <= 20; c++)', 'for (var c = 1; c <= {{註解檔數}}; c++)', 1), ('onStep(done, 20)', 'onStep(done, {{註解檔數}})', 1),
                    ('第 1 到 100 卷', '第 1 到 {{卷數}} 卷', 1)]:
    rep(old, new, n)
s = s.replace('全部一百卷共', '全部共').replace('一百卷卷次', '卷次').replace('收起或展開一百卷', '收起或展開卷次').replace('展開或收起一百卷清單', '展開或收起卷次清單').replace("'aria-label','一百卷'", "'aria-label','卷次'")

# 6. 講記名稱
s = s.replace('常柏法師釋', '{{講記二}}').replace('披尋記', '{{講記一}}').replace('<span class="ntag">(披)</span>', '<span class="ntag">({{講記一標記}})</span>')

# 7. 版本
rsub(r'<meta name="app-version" content="[^"]*">', '<meta name="app-version" content="{{版本}}">', 1)
rsub(r'(<b id="appVer">)v[^<]*(</b>)', r'\1v{{版本}}\2', 1)
rsub(r'<time id="appUpd" datetime="[^"]*">[^<]*</time>', '<time id="appUpd" datetime="{{日期}}">{{日期}}</time>', 1)
# 更新動畫是瑜伽論 2.4.0 的內容：本書第一次開啟一律當作已看過（新使用者只看操作簡介）
rep("window.__releaseVersion='2.4.0';", "window.__releaseVersion='{{版本}}';try{if(localStorage.getItem('hk-update-animation-seen')==null)localStorage.setItem('hk-update-animation-seen',window.__releaseVersion);}catch(e){}")
rsub(r'var versionNotes=\{.*?\n  \]\}\};', 'var versionNotes={"{{版本}}":{date:"{{日期}}",quiet:1,items:[["new","初版。"]]}};', 1, re.S)
rsub(r'var versionSummaries=\{.*?\};(?=\s*\(function\(\)\{var a=document\.getElementById\(\'appVer\'\))', 'var versionSummaries={};', 1, re.S)

out = os.path.join(ROOT, 'shell', 'index.html')
os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, 'w', encoding='utf-8').write(s)
print('外殼完成：', out, len(s), 'bytes；剩下的「瑜伽」字樣：', len(re.findall('瑜伽', s)))
