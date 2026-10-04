# v1.64（以使用者的 v1.63 為底）
import sys, json, re
SRC, DST = sys.argv[1], sys.argv[2]
s = open(SRC, encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    c = s.count(old)
    if c != n: raise SystemExit('count %d: %r' % (c, old[:90]))
    s = s.replace(old, new)

# 1) 直書科判：恢復 v1.59 的排法（原版面＋長標題下方有空間就合回一欄）
a = s.index('  // 直書科判：每頁依樹狀結構重新排版。'); b = s.index('  function verticalForms(t) {', a)
s = s[:a] + open('layout164.js', encoding='utf-8').read() + s[b:]

# 2) 卷次樹狀線：上層科判在前一卷時，豎線照樣延伸到頂
rep('''      for (var c = 0; c < d - 1; c++) { var an = lastAt[c + 1]; if (an != null && moreA[an]) bg.push(''',
    '''      for (var c = 0; c < d - 1; c++) { var an = lastAt[c + 1]; if (an != null ? moreA[an] : hiddenMore(li, c + 1)) bg.push(''')
rep('''    var lastAt = [];
    for (var li = 0; li < list.length; li++) {''',
    '''    var lastAt = [];
    // 這一層的上層科判在前一卷（本卷看不到）：之後還有同層科判，豎線就從頂端一路接下來
    function hiddenMore(li, lv) { for (var q = li + 1; q < dl.length; q++) { if (dl[q] < lv) return false; if (dl[q] === lv) return true; } return false; }
    for (var li = 0; li < list.length; li++) {''')

# 3) 卷次：使用者自己拖過橫向捲軸後，不再自動左右對焦
rep('''  function focusRailCamera(a){
    var sc=$('rscroll');if(!a||!sc.clientHeight)return;''',
    '''  var railUserX=false,railDrag=false;
  function setupRailManualX(){
    var sc=$('rscroll');if(!sc)return;sc._lastX=sc.scrollLeft;
    sc._lastY=sc.scrollTop;
    sc.addEventListener('scroll',function(){var user=Date.now()-(sc._progX||0)>200;if(sc.scrollLeft!==sc._lastX){if(user)railUserX=true;sc._lastX=sc.scrollLeft;}else if(Math.abs(sc.scrollTop-sc._lastY)>2&&user&&!railDrag)railUserX=false;sc._lastY=sc.scrollTop;},{passive:true});
    sc.addEventListener('wheel',function(e){if(Math.abs(e.deltaX)>Math.abs(e.deltaY)&&e.deltaX)railUserX=true;},{passive:true});
    sc.addEventListener('pointerdown',function(){railDrag=true;});
    window.addEventListener('pointerup',function(){railDrag=false;},true);window.addEventListener('pointercancel',function(){railDrag=false;},true);
  }
  function focusRailCamera(a){
    var sc=$('rscroll');if(!a||!sc.clientHeight||railDrag)return;''')
rep('''    centerHeadingText(a.querySelector('.rail-title')||a,sc);
  }''', '''    if(!railUserX){sc._progX=Date.now();centerHeadingText(a.querySelector('.rail-title')||a,sc);}
  }''')
rep('''    $("rscroll").scrollTop = 0; $("rscroll").scrollLeft = 0;''',
    '''    if ($("rscroll").dataset.rj !== String(j)) { railUserX = false; $("rscroll").dataset.rj = j; }
    $("rscroll")._progX = Date.now(); $("rscroll").scrollTop = 0; if (!railUserX) $("rscroll").scrollLeft = 0;''')

# 4) 介面：點下去就把右側三個圖示釘住，不再另開一頁
rep("panel.addEventListener('click',function(e){var target=e.target.closest('#labelBtn",
    "panel.addEventListener('click',function(e){if(e.target.closest('.learning-settings summary')&&settingsPage==='root'){e.preventDefault();e.stopImmediatePropagation();pinLayoutFly();return;}var target=e.target.closest('#labelBtn")
rep('''  function setupMenuFlyouts(){''', '''  var pinLayoutFly=function(){};
  function setupMenuFlyouts(){''')
rep('''      if(!cur)return;var was=cur;cur=null;delete panel.dataset.hover;panel.classList.remove('fly-left');''',
    '''      delete panel.dataset.pin;panel.classList.remove('fly-inline');
      if(!cur)return;var was=cur;cur=null;delete panel.dataset.hover;panel.classList.remove('fly-left');''')
rep('''      panel.classList.toggle('fly-left',pr.right+8+w>innerWidth-8&&pr.left-8-w>8);''',
    '''      var noR=pr.right+8+w>innerWidth-8,noL=pr.left-8-w<8;
      panel.classList.toggle('fly-left',noR&&!noL);panel.classList.toggle('fly-inline',!!panel.dataset.pin&&noR&&noL);''')
rep('''    function show(page,row,sel){
      if(!fine.matches||settingsPage!=='root'||!$('menu').classList.contains('open'))return;
      if(cur===page)return;clear();cur=page;''',
    '''    function show(page,row,sel,force){
      if((!fine.matches&&!force)||settingsPage!=='root'||!$('menu').classList.contains('open'))return;
      if(cur===page){if(force){panel.dataset.pin=page;var b0=row.querySelector(sel);if(b0)place(b0,row);}return;}clear();cur=page;if(force)panel.dataset.pin=page;''')
rep('''timer=setTimeout(function(){show(m[1],row,m[2]);},80);});});''',
    '''timer=setTimeout(function(){if(panel.dataset.pin)return;show(m[1],row,m[2]);},80);});});
    pinLayoutFly=function(){var row=panel.querySelector(':scope > .learning-settings-list');if(!row)return;clearTimeout(timer);clearTimeout(leaveT);menuPinned=true;$('menu').classList.add('pinned');show('layout',row,'.settings-body',true);};''')
rep('''    panel.addEventListener('mouseleave',function(){clearTimeout(timer);leaveT=setTimeout(clear,300);});''',
    '''    panel.addEventListener('mouseleave',function(){clearTimeout(timer);if(panel.dataset.pin)return;leaveT=setTimeout(function(){if(!panel.dataset.pin)clear();},300);});''')

# 初始化：卷次橫向捲動
rep('''  function setupMenuFlyouts(){''', '''  setTimeout(setupRailManualX, 0);
  function setupMenuFlyouts(){''')

# 釘住時，滑鼠離開「介面」列不收起
rep("d.addEventListener('mouseleave',function(){if(preview&&!pinned){preview=false;d.open=false;}});",
    "d.addEventListener('mouseleave',function(){if(preview&&!pinned&&!d.closest('[data-pin]')){preview=false;d.open=false;}});")
rep("d.addEventListener('mouseleave',function(){if(!lockedSub && matchMedia('(hover:hover)').matches)d.open=false;});",
    "d.addEventListener('mouseleave',function(){if(!lockedSub && !d.closest('[data-pin]') && matchMedia('(hover:hover)').matches)d.open=false;});")

# 卷次停下來時的自動左右對焦：使用者剛拖過橫向捲軸就不做
rep("var best=rows[lo];if(best)centerHeadingText(best.querySelector('.rail-title')||best,sc);",
    "var best=rows[lo];if(best&&!railUserX&&!railDrag){sc._progX=Date.now();centerHeadingText(best.querySelector('.rail-title')||best,sc);}")

# 版本
m = re.search(r'var versionSummaries=(\{.*?\});', s)
SUM = json.loads(m.group(1))
SUM = dict([('1.64', "revert(chart): 直書科判恢復 v1.59 版面（原排法，長標題下方有空間才合回一欄），標號顏色保留\nfix(text): 正文欄科判標題改淡灰色（兩版）\nfix(rail): 上層科判在前一卷時，樹狀豎線照樣延伸到頂\nfix(rail): 副標題「本卷 N 科」與全部科判一起縮排\nfix(rail): 手動拖橫向捲軸後不再強制左右對焦\nfix(menu): 點「介面」直接釘住右側三個圖示，移除獨立頁面")] + list(SUM.items()))
s = s[:m.start(1)] + json.dumps(SUM, ensure_ascii=False, separators=(',', ':')) + s[m.end(1):]
rep('<b id="appVer">v1.63</b>', '<b id="appVer">v1.64</b>')
rep('<div id="versionHistory"><button class="version-row" data-version="1.63">', '<div id="versionHistory"><button class="version-row" data-version="1.64"><span>v1.64</span><span>›</span></button><button class="version-row" data-version="1.63">')
rep("versionPage('1.63','about');};", "versionPage('1.64','about');};")
rep("versionPage('1.63','about');}};", "versionPage('1.64','about');}};")
CSS = open('v164.css', encoding='utf-8').read()
k = s.rindex('</body></html>'); s = s[:k] + '<style id="v164">' + CSS + '</style>\n' + s[k:]
open(DST, 'w', encoding='utf-8').write(s)
print('ok')
