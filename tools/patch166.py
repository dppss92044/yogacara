# v1.66（以 v1.65 為底）
import sys, json, re
SRC, DST = sys.argv[1], sys.argv[2]
s = open(SRC, encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    c = s.count(old)
    if c != n: raise SystemExit('count %d: %r' % (c, old[:90]))
    s = s.replace(old, new)
# 1) 直書科判
a = s.index('  // 直書科判（藏版）：每頁依樹狀結構重新排版（v1.65）。'); b = s.index('  function verticalForms(t) {', a)
s = s[:a] + open('layout166.js', encoding='utf-8').read() + s[b:]
# 2) 跟讀：以正文為準，標題上滑到畫面 2/5 處即反白，三欄同步
rep('''      var hh = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hh")) || 0) + 60;''',
    '''      var zb = document.querySelector(".zbar"), bandB = zb ? Math.max(0, zb.getBoundingClientRect().bottom) : 0, tabs = phoneMode() && document.querySelector(".device-tabs"), viewB = tabs ? tabs.getBoundingClientRect().top : innerHeight, hh = bandB + (viewB - bandB) * 0.4;''')
# 3) 科判欄左上角的科標切換字；正文右上「藏版／韓版」
rep("if(badge){badge.textContent=zang?'藏':'韓';", "if(badge){badge.innerHTML=zang?'藏<span class=\"v\">版</span>':'韓<span class=\"v\">版</span>';")
rep('''  function labelUI(){''', '''  function labBadge(){var b=$('labBadge');if(!b){b=document.createElement('button');b.type='button';b.id='labBadge';b.className='lab-badge';b.onclick=function(e){e.stopPropagation();setLabel(LABEL==='zj'?'gz':'zj');};panel.appendChild(b);if(getComputedStyle(panel).position==='static')panel.style.position='relative';}b.textContent=LABEL==='zj'?'章節':'干支';b.title='科標：'+b.textContent+'（點一下切換）';}
  function labelUI(){labBadge();''')
# 4) 浮出子選單：已有一個浮窗時，換列稍等，滑向浮窗途中不跳掉
rep("timer=setTimeout(function(){if(panel.dataset.pin)return;show(m[1],row,m[2]);},80);});});",
    "timer=setTimeout(function(){if(panel.dataset.pin)return;show(m[1],row,m[2]);},cur&&cur!==m[1]?280:80);});});\n    panel.querySelectorAll('.edition-body,.label-body,.content-body,.settings-body,.ftpop,.dlpop,.apop').forEach(function(bd){bd.addEventListener('mouseenter',function(){clearTimeout(timer);clearTimeout(leaveT);});});")
rep("d.addEventListener('mouseleave',function(){if(preview&&!pinned&&!d.closest('[data-pin]')){preview=false;d.open=false;}});",
    "d.addEventListener('mouseleave',function(){if(preview&&!pinned&&!d.closest('[data-pin],[data-hover=layout]')){preview=false;d.open=false;}});")
rep("d.addEventListener('mouseleave',function(){if(!lockedSub && !d.closest('[data-pin]') && matchMedia('(hover:hover)').matches)d.open=false;});",
    "d.addEventListener('mouseleave',function(){if(!lockedSub && !d.closest('[data-pin],[data-hover=layout]') && matchMedia('(hover:hover)').matches)d.open=false;});")
# 5) 恢復預設：連拖曳過的欄寬一起還原
rep('$("fsReset").onclick = function () { setFont(1, 1, true); resetSourceFont(); };',
    '''$("fsReset").onclick = function () { setFont(1, 1, true); resetSourceFont();
    var rs=document.documentElement.style;['--rw','--pw','--ipad-rw','--ipad-pw','--th','--kw'].forEach(function(p){rs.removeProperty(p);});
    ['hk5-widths','hk-ipad-widths-v145','hk-vsizes','hk-pane-split-v140'].forEach(function(k){try{localStorage.removeItem(k);}catch(e){}});
    equalPanes=true;wrap.classList.add('equal-panes');try{placeGutters();}catch(e){}fitP();fitV();if(S.railJuan){var kc=S.cur;renderRail(S.railJuan);if(kc!=null)railFocus(kc);}
  };''')
# 6) 版本說明：簡短
rep('<small>科句披尋記本・可開披尋記與常柏法師釋</small>', '<small>科句、披尋記、法師註解</small>')
# 7) 版本紀錄：只留最新版本
LATEST = ("v1.66（2026年10月4日更新）\n\n"
 "1. 正文捲動時，標題上滑到畫面約五分之二處即自動反白，卷次、科判兩欄同步。\n"
 "2. 科標（干支／章節）改到科判欄左上角，點一下切換；功能列表移除科標。\n"
 "3. 正文右上改回「藏版／韓版」。\n"
 "4. 藏版直書科判：各分支依自身高度往下排，不再為對齊而拉長支線。\n"
 "5. 藏版直書科判：有下層的科，標題超過五字換行（七字為四、三）；沒有下層的科原則不換行。\n"
 "6. 章節科標後空一字再接標題；換行的兩行間距縮小一半。\n"
 "7. 字體「恢復預設」一併還原拖曳過的欄寬與大小。\n"
 "8. 電腦版功能浮窗可直接滑過去點選，不再跳掉；功能鍵不再蓋住卷次縮圖鈕。\n"
 "9. 字體設定移除卷次／科判大小列（電腦正文的放大縮小保留）。\n"
 "10. 版本說明精簡。")
i = s.index("$('versionHistory').onclick=null;(function(){"); j = s.index("})();", i) + len("})();")
s = s[:i] + "$('versionHistory').onclick=null;$('versionDoc').textContent=" + json.dumps(LATEST, ensure_ascii=False) + ";" + s[j:]
m = re.search(r'var versionSummaries=(\{.*?\});', s)
SUM = json.loads(m.group(1)); SUM = dict([('1.66', LATEST)] + list(SUM.items()))
s = s[:m.start(1)] + json.dumps(SUM, ensure_ascii=False, separators=(',', ':')) + s[m.end(1):]
rep('<b id="appVer">v1.65</b>', '<b id="appVer">v1.66</b>')
CSS = open('v166.css', encoding='utf-8').read()
k = s.rindex('</body></html>'); s = s[:k] + '<style id="v166">' + CSS + '</style>\n' + s[k:]
open(DST, 'w', encoding='utf-8').write(s)
print('ok')
