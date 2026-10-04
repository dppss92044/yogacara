# v1.74
import sys, json
SRC, DST = sys.argv[1], sys.argv[2]
s = open(SRC, encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    c = s.count(old)
    if c != n: raise SystemExit('count %d: %r' % (c, old[:90]))
    s = s.replace(old, new)
# ---- iPad：科判一律固定；卷次浮動／圖釘固定 ----
rep('try { ipadPinned=localStorage.getItem("hk-ipad-pinned")!=="0"; }catch(e){}', 'ipadPinned=true;var ipadRailDock=false;try{ipadRailDock=localStorage.getItem("hk-ipad-rail-dock")==="1";}catch(e){}\n  function ipadFloat(){return deviceLayout==="ipad"&&!ReaderUI.single&&!ipadRailDock;}\n  function railModeUI(){document.documentElement.dataset.ipadRail=ipadFloat()?"float":"dock";var b=document.getElementById("railPin");if(b){b.setAttribute("aria-pressed",String(ipadRailDock));b.title=ipadRailDock?"取消固定卷次":"固定卷次";b.setAttribute("aria-label",b.title);}}')
rep('''  function setRail(on) {
    if(ReaderUI.ready&&ReaderUI.single)''', '''  function setRail(on) {
    if(ReaderUI.ready&&ipadFloat()){railOn=on;rail.classList.toggle("open",on);wrap.classList.remove("no-rail");updFloat();setTimeout(function(){placeGutters();fitP();fitV();},0);return;}
    if(ReaderUI.ready&&ReaderUI.single)''')
rep('''        else{railOn=true;rail.classList.remove('open');wrap.classList.remove('no-rail');S.panel=true;applyPanel();ReaderUI.screen='read';}''',
    '''        else{railOn=!ipadFloat();rail.classList.remove('open');wrap.classList.remove('no-rail');S.panel=true;applyPanel();ReaderUI.screen='read';}''')
rep("      boundWidths();pinUI();syncReaderUI();", "      railModeUI();boundWidths();pinUI();syncReaderUI();updFloat();")
rep("$('panelPin').onclick=function(){", "$('panelPin').onclick=function(){if(deviceLayout==='ipad')return;")
rep("$('swapPanes').onclick=function(){if(deviceLayout==='ipad'&&!ipadPinned)$('panelPin').click();", "$('swapPanes').onclick=function(){")
rep('''  function updFloat() {
    $("railOpen").hidden = ''', '''  function updFloat() {
    if (typeof ipadFloat === "function" && ReaderUI.ready && ipadFloat()) { $("railOpen").hidden = rail.classList.contains("open"); $("panelOpen").hidden = S.panel || S.view === "v"; main.classList.toggle("ro", !$("railOpen").hidden); if (typeof placeGutters === "function") placeGutters(); return; }
    $("railOpen").hidden = ''')
# 圖釘鈕放在卷次右上；點外面收起浮動卷次
rep('''  function focusRailCamera(a){railProg''', '''  (function mkPin(){
    var rt=document.querySelector('.books-tools[data-z="r"]'),pp=$('panelPin');if(!rt||!$('railClose')||$('railClose').parentElement!==rt){setTimeout(mkPin,200);return;}if(!$('railPin')){var b=document.createElement('button');b.type='button';b.id='railPin';b.className='icb';b.innerHTML=pp?pp.innerHTML:'📌';rt.insertBefore(b,$('railClose'));
      b.onclick=function(e){e.stopPropagation();ipadRailDock=!ipadRailDock;try{localStorage.setItem('hk-ipad-rail-dock',ipadRailDock?'1':'0');}catch(er){}rail.classList.remove('open');railOn=true;wrap.classList.remove('no-rail');railModeUI();if(ipadFloat()){railOn=false;}updFloat();boundWidths&&0;setTimeout(function(){placeGutters();fitP();fitV();},30);};}
    railModeUI();
    document.addEventListener('pointerdown',function(e){if(!ipadFloat()||!rail.classList.contains('open'))return;if(rail.contains(e.target)||e.target.closest('#railOpen,#tour'))return;setRail(false);},true);
    rail.addEventListener('click',function(e){if(ipadFloat()&&e.target.closest('.rol a'))setTimeout(function(){setRail(false);},250);});
  })();
  function focusRailCamera(a){railProg''')
# ---- 回上方：只在白色紙面上 ----
rep("""      b.ondblclick=function(e){e.stopPropagation();clearTimeout(tmr);goTop(1);};""", """      b.ondblclick=function(e){e.stopPropagation();clearTimeout(tmr);goTop(1);};
      function placeCT(){if(phoneMode()){return;}var v=$('pview');if(!v||panel.hidden||!v.clientHeight){b.dataset.off='1';return;}var rv=v.getBoundingClientRect(),y=rv.bottom-14-31,sh=null,best=null;
        v.querySelectorAll('.ksheet .page').forEach(function(x){var r=x.getBoundingClientRect();if(!r.width)return;if(r.bottom<rv.top||r.top>rv.bottom)return;if(r.top<=y&&r.bottom>=y+31)sh=r;if(r.bottom<y+31&&r.bottom>rv.top+60&&(!best||r.bottom>best.bottom))best=r;});
        if(!sh&&best){sh=best;y=best.bottom-12-31;}if(!sh){b.dataset.off='1';return;}delete b.dataset.off;
        document.documentElement.style.setProperty('--ct-x',(Math.max(sh.left,rv.left)+12)+'px');document.documentElement.style.setProperty('--ct-y',Math.min(y,sh.bottom-12-31)+'px');}
      var pq=0;function qCT(){if(!pq)pq=requestAnimationFrame(function(){pq=0;placeCT();});}
      setTimeout(function(){var v=$('pview');if(v)v.addEventListener('scroll',qCT,{passive:true});window.addEventListener('resize',qCT);window.addEventListener('reader-layout',qCT);setInterval(placeCT,400);placeCT();},300);""")
# ---- 導覽：一句一行、簡單 ----
D = [
 {"t":"閱讀導覽","d":"左邊是卷次。\n中間是正文。\n右邊是直書科判。\n三欄會一起跟著走。","desk":1},
 {"s":".rail-top","t":"卷目次","d":"點卷號，換一卷。\n往下滑，會接到下一卷。","desk":1},
 {"s":"#railPin","t":"固定卷次","d":"點圖釘，卷次固定在左邊。\n再點一下，卷次改回浮動。","ipad":1},
 {"s":"#rv","t":"卷次科判","d":"點一下標題。\n正文和科判一起跳過去。","desk":1},
 {"s":"#article","t":"查辭典","d":"用滑鼠反白一個詞。\n辭典就會跳出來。","desk":1,"demo":1},
 {"s":"#panel","t":"科判標題","d":"點一下標題：正文跳到這一段。\n點兩下標題：回到上一層。","desk":1},
 {"s":"#panel","t":"科判小字","d":"點一下小字（分N）：跳到下一層。\n點兩下右邊「別表」小字：跳到那一科。","desk":1},
 {"s":"#chartTop","t":"回上方","d":"點一下：回到這一卷的科判。\n點兩下：回到第一卷。","desk":1},
 {"s":"#labBadge","t":"科標","d":"點一下「干支／章節」。\n標號就會換。","desk":1},
 {"s":"#edBadge","t":"版本","d":"點一下「藏版／韓版」。\n版本就會換，停在同一段原文。","desk":1},
 {"s":".books-tools[data-z=\"m\"] .book-size-button","t":"大小","d":"點「大小」。\n再點「小」或「大」。\n每點一下，字改 10%。","desk":1},
 {"s":"#menuBtn","t":"功能","d":"點三點，打開功能。","desk":1},
 {"s":"#searchButton","t":"搜尋","d":"點放大鏡。\n輸入要找的字。","desk":1},
 {"t":"閱讀導覽","d":"下面有三個分頁：卷次、正文、科判。\n左上「卷」可以選卷。","phone":1},
 {"s":"#article","t":"查辭典 1／3","d":"長按一個詞。\n拖兩端，調整反白範圍。","phone":1,"demo":1},
 {"s":"#article","t":"查辭典 2／3","d":"反白下方會出現「查詞」。\n點一下「查詞」，打開辭典。","phone":1},
 {"s":"#article","t":"查辭典 3／3","d":"點辭典外面。\n辭典就關掉。","phone":1},
 {"s":".device-tabs","t":"科判","d":"點一下標題：跳到正文。\n點一下小字（分N）：看下一層。\n點兩下標題：回上一層。\n點左下 ↑：回到頂端。","phone":1},
 {"s":"#menuBtn","t":"功能","d":"點三點，打開功能。","phone":1},
]
i = s.index('var TOUR='); j = s.index('];', i) + 2
s = s[:i] + 'var TOUR=' + json.dumps(D, ensure_ascii=False) + ';' + s[j:]
rep('var TOUR_VER="8";', 'var TOUR_VER="9";')
rep('<b id="appVer">v1.73</b>', '<b id="appVer">v1.74</b>')
i = s.index("$('versionHistory').onclick=null;$('versionDoc').textContent=") + len("$('versionHistory').onclick=null;$('versionDoc').textContent=")
_, end = json.JSONDecoder().raw_decode(s[i:])
s = s[:i] + json.dumps("v1.74\n最後更新：2026年10月4日", ensure_ascii=False) + s[i + end:]
CSS = open('v174.css', encoding='utf-8').read()
k = s.rindex('</body></html>'); s = s[:k] + '<style id="v174">' + CSS + '</style>\n' + s[k:]
open(DST, 'w', encoding='utf-8').write(s)
print('ok')
