# v1.56: 選單卡片、預設藏經、版本角標、直書括號、觸控查詞位置、科判捏合縮放與頁首連結、問題回報、卷次提示、行動捲動、桌面懸停子選單
import sys
SRC, DST = sys.argv[1], sys.argv[2]
s = open(SRC, encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    c = s.count(old)
    if c != n: raise SystemExit('count %d: %r' % (c, old[:90]))
    s = s.replace(old, new)

# ---------- 預設藏經科判，並排在上方 ----------
rep('try { EDITION = localStorage.getItem("hk-edition-v154") === "zang" ? "zang" : "hk"; } catch (e) {}',
    'try { EDITION = localStorage.getItem("hk-edition-v154") === "hk" ? "hk" : "zang"; } catch (e) { EDITION = "zang"; }')
rep('var EDITION = "hk", EDATA = {};', 'var EDITION = "zang", EDATA = {};')
hk = '<button type="button" class="edition-choice" data-edition="hk" role="radio" aria-checked="true"><span class="ed-t"><b>韓清淨科判</b><small>科句披尋記本・可開披尋記與常柏法師釋</small></span><span class="ed-ck" aria-hidden="true">✓</span></button>'
zg = '<button type="button" class="edition-choice" data-edition="zang" role="radio" aria-checked="false"><span class="ed-t"><b>藏經科判</b><small>大藏經原文・藏經科判表</small></span><span class="ed-ck" aria-hidden="true">✓</span></button>'
rep(hk + zg, zg.replace('aria-checked="false"', 'aria-checked="true"') + hk.replace('aria-checked="true"', 'aria-checked="false"'))
rep('<em class="mi-val" id="editionCur">韓清淨科判</em>', '<em class="mi-val" id="editionCur">藏</em>')
rep("$('editionCur').textContent=zang?'藏經科判':'韓清淨科判';",
    "$('editionCur').textContent=zang?'藏':'韓';$('editionCur').title=zang?'藏經科判':'韓清淨科判';"
    "var badge=$('edBadge'),tools=document.querySelector('.zbar .books-tools[data-z=\"m\"]');"
    "if(!badge&&tools){badge=document.createElement('button');badge.type='button';badge.id='edBadge';badge.className='ed-badge';"
    "badge.onclick=function(e){e.stopPropagation();showSettingsPage('edition');openMenu();};tools.before(badge);}"
    "if(badge){badge.textContent=zang?'藏':'韓';badge.title='目前版本：'+(zang?'藏經科判':'韓清淨科判');badge.setAttribute('aria-label',badge.title);}")
# badge needs the toolbar, which is built after the edition is set up
rep('''    setupSearchButton();setupPhoneReading();setupSettingsNavigation();setupBooksTools();setupPhoneGestures();''',
    '''    setupSearchButton();setupPhoneReading();setupSettingsNavigation();setupBooksTools();setupPhoneGestures();editionUI();setupMenuFlyouts();setupReport();setupChartPinch();setupVolumeDamping();''')

# ---------- 直書科判：括號、破折號改直書字形；頁首每一段都可點 ----------
rep('''    centerSheet(el.querySelector(".page"));
  }''', '''    el.querySelectorAll(".nd").forEach(function (nd) {
      var w = document.createTreeWalker(nd, NodeFilter.SHOW_TEXT), tn;
      while ((tn = w.nextNode())) tn.textContent = verticalForms(tn.textContent);
    });
    centerSheet(el.querySelector(".page"));
  }
  function verticalForms(t) {
    return t.replace(/（/g, "︵").replace(/）/g, "︶").replace(/〔/g, "︹").replace(/〕/g, "︺").replace(/「/g, "﹁").replace(/」/g, "﹂").replace(/『/g, "﹃").replace(/』/g, "﹄").replace(/《/g, "︽").replace(/》/g, "︾").replace(/[—─]/g, "︱").replace(/…/g, "︙");
  }''')
rep('''        if (/^別表：/.test(seg)) { var nx = ids.filter(function (v) { return v != null; })[0], up = nx != null ? N[nx][4] : -1; return '<span data-page="2">別表</span>：' + (up >= 0 ? '<span data-id="' + up + '">' + esc(t.replace(/^別表：/, "")) + "</span>" : esc(t.replace(/^別表：/, ""))); }
        return '<span data-page="2">' + esc(t) + "</span>";''',
    '''        if (/^別表：/.test(seg)) { var nx = ids.filter(function (v) { return v != null; })[0], up = nx != null ? N[nx][4] : -1; return '<span data-page="2">別表</span>：' + (up >= 0 ? '<span data-id="' + up + '">' + esc(t.replace(/^別表：/, "")) + "</span>" : esc(t.replace(/^別表：/, ""))); }
        var after = ids.slice(x + 1).filter(function (v) { return v != null; })[0], par = after != null ? N[after][4] : -1;
        if (par >= 0 && x > 0) return '<span data-id="' + par + '">' + esc(t) + "</span>";
        return '<span data-page="2">' + esc(t) + "</span>";''')
# phone chart taps follow the same page logic as desktop (heads jump to the page of that 科)
rep('''      if(screen==='chart'){focusNode(hit.i,'panel',S.ppage);return;}''',
    '''      if(screen==='chart'){var el=hit.el,sh=el.closest('.ksheet'),here=sh?+sh.dataset.p:0,other=el.classList.contains('rt')?APPEAR[hit.i]:OWN[hit.i];if(!el.closest('.head')&&other&&other!==here){focusNode(hit.i,'go',other);return;}if(el.closest('.head')){focusNode(hit.i,'panelhead');return;}focusNode(hit.i,'panel',S.ppage);return;}''')

# ---------- 科判可放大到 300% ----------
rep("Z[k]=Number.isFinite(+Z[k])?Math.max(.5,Math.min(2,Math.round(+Z[k]*10)/10)):1;});",
    "Z[k]=Number.isFinite(+Z[k])?Math.max(.5,Math.min(k==='p'?3:2,Math.round(+Z[k]*20)/20)):1;});")
rep("Z[k] = f === 0 ? 1 : Math.max(50,Math.min(200,Math.round(Z[k]*100)+(f>0?10:-10)))/100;",
    "Z[k] = f === 0 ? 1 : Math.max(50,Math.min(k==='p'?300:200,Math.round(Z[k]*10)*10+(f>0?10:-10)))/100;")

# ---------- 觸控查詞：按鈕在反白字正上方，辭典浮在畫面中央 ----------
rep('''      chipRange=sel.getRangeAt(0).cloneRange();chip.querySelector('b').textContent=chipTerm;
      if(chip.hidden){chip.hidden=false;Motion.open(chip);}
    }''', '''      chipRange=sel.getRangeAt(0).cloneRange();chip.querySelector('b').textContent=chipTerm;
      if(chip.hidden){chip.hidden=false;placeChip();Motion.open(chip);}else placeChip();
    }
    // 放在反白字的正上方；中間留一段給系統的拷貝／查詢選單，兩者不重疊。
    function placeChip(){
      if(chip.hidden||!chipRange)return;
      var rects=Array.from(chipRange.getClientRects()).filter(function(r){return r.width&&r.height;}),first=rects[0]||chipRange.getBoundingClientRect(),last=rects[rects.length-1]||first;
      var v=viewportBox(),b=overlayBounds(),w=chip.offsetWidth,h=chip.offsetHeight,SYS=54;
      var cx=(first.left+(rects.length>1?first.right:last.right))/2;
      var x=Math.max(v.left+8,Math.min(v.left+v.width-w-8,cx-w/2)),y=first.top-SYS-h;
      if(y<b.top)y=last.bottom+SYS;y=Math.max(b.top,Math.min(b.bottom-h,y));
      chip.style.setProperty('--chip-left',x+'px');chip.style.setProperty('--chip-top',y+'px');
    }
    window.addEventListener('scroll',Motion.rafThrottle(placeChip),{passive:true});window.addEventListener('resize',Motion.rafThrottle(placeChip));''')
rep('''if(mobileDictionary()){var vb=viewportBox(),bb=overlayBounds(),sw=Math.min(560,vb.width-16);pop.style.setProperty('--dict-width',sw+'px');pop.style.setProperty('--dict-maxheight',Math.max(160,Math.min(vb.height*.62,bb.bottom-bb.top-8))+'px');pop.style.setProperty('--dict-left',(vb.left+(vb.width-sw)/2)+'px');pop.style.setProperty('--dict-top',Math.max(bb.top,bb.bottom-pop.offsetHeight)+'px');return;}''',
    '''if(mobileDictionary()){var vb=viewportBox(),bb=overlayBounds(),sw=Math.min(520,vb.width-24);pop.style.setProperty('--dict-width',sw+'px');pop.style.setProperty('--dict-maxheight',Math.max(160,Math.min(vb.height*.7,bb.bottom-bb.top-8))+'px');pop.style.setProperty('--dict-left',(vb.left+(vb.width-sw)/2)+'px');pop.style.setProperty('--dict-top',Math.max(bb.top,vb.top+(vb.height-pop.offsetHeight)/2)+'px');return;}''')

# ---------- 關於：問題回報 ----------
rep('<button class="mi version-history-button" id="versionHistoryBtn"><span>版本紀錄</span><i class="chev">›</i></button></div>',
    '<button class="mi version-history-button" id="versionHistoryBtn"><span>版本紀錄</span><i class="chev">›</i></button>'
    '<button class="mi version-history-button" id="reportBtn"><span>問題回報</span><i class="chev">›</i></button></div>'
    '<div id="reportPage"><p class="rp-hint">請寫下：<b>介面</b>（手機／平板／電腦）與<b>問題敘述</b>。也歡迎提出建議、改善方向或想新增的功能。</p>'
    '<label class="rp-label" for="reportText">內容</label><textarea id="reportText" rows="8" placeholder="介面：手機&#10;問題敘述：&#10;（或：建議／想新增的功能）"></textarea>'
    '<label class="rp-label" for="reportContact">聯絡信箱（選填，方便回覆）</label><input id="reportContact" type="email" autocomplete="email" placeholder="name@example.com">'
    '<small class="rp-meta" id="reportMeta"></small><button class="go rp-send" id="reportSend" type="button">送出</button><p class="rp-msg" id="reportMsg" role="status"></p></div>')
rep("var names={root:'功能',edition:'版本',", "var names={root:'功能',report:'問題回報',edition:'版本',")
rep("$('about').classList.toggle('open',page==='about'||page==='history'||page==='version');",
    "$('about').classList.toggle('open',page==='about'||page==='history'||page==='version'||page==='report');")
rep("page==='history'||page==='version'?'about':page;", "page==='history'||page==='version'||page==='report'?'about':page;")
rep("$('settingsBack').onclick=function(){showSettingsPage(settingsPage==='version'?versionBack:settingsPage==='history'?'about':'root');};",
    "$('settingsBack').onclick=function(){showSettingsPage(settingsPage==='version'?versionBack:settingsPage==='history'||settingsPage==='report'?'about':'root');};")
rep("var target=e.target.closest('#editionBtn,#contentBtn,", "var target=e.target.closest('#reportBtn,#editionBtn,#contentBtn,")
rep("var page=target.id==='editionBtn'?'edition':", "var page=target.id==='reportBtn'?'report':target.id==='editionBtn'?'edition':")
rep("$('settingsBack').setAttribute('aria-label',page==='history'?'返回關於':'返回功能列表');",
    "$('settingsBack').setAttribute('aria-label',page==='history'||page==='report'?'返回關於':'返回功能列表');var mp=$('menu').querySelector('.mpop');if(mp)delete mp.dataset.hover;")

# ---------- new functions ----------
rep('''  function setupEdition(){''', r'''  // 桌面：滑過列即浮現下一層，可點可不點；手機與平板仍點進分頁。
  function setupMenuFlyouts(){
    var panel=$('menu').querySelector('.mpop'),fine=matchMedia('(hover:hover) and (pointer:fine)'),cur=null,timer=0,leaveT=0;
    var rows=[['.edition-settings','edition','.edition-body'],['.content-settings','content','.content-body'],['.learning-settings-list','layout','.settings-body'],['.ft','ft','.ftpop'],['.dl','dl','.dlpop'],['.about','about','.apop']];
    function clear(){
      if(!cur)return;var was=cur;cur=null;delete panel.dataset.hover;panel.classList.remove('fly-left');
      if(settingsPage!=='root')return;
      if(was==='layout')document.querySelector('.learning-settings').open=false;
      if(was==='dl'){$('dlPop').hidden=true;document.querySelector('.menu .dl').classList.remove('on');}
      if(was==='ft')$('ftWrap').classList.remove('open');if(was==='about')$('about').classList.remove('open');
    }
    function place(body,row){
      var pr=panel.getBoundingClientRect(),rr=row.getBoundingClientRect(),w=body.offsetWidth,h=body.offsetHeight,vh=innerHeight;
      panel.classList.toggle('fly-left',pr.right+8+w>innerWidth-8&&pr.left-8-w>8);
      var top=rr.top-pr.top-12;top=Math.min(top,vh-12-pr.top-h);top=Math.max(top,12-pr.top);
      panel.style.setProperty('--fly-top',top+'px');panel.style.setProperty('--fly-maxh',(vh-24)+'px');
    }
    function show(page,row,sel){
      if(!fine.matches||settingsPage!=='root'||!$('menu').classList.contains('open'))return;
      if(cur===page)return;clear();cur=page;
      if(page==='layout')document.querySelector('.learning-settings').open=true;
      if(page==='dl'){openDl(true);document.querySelector('.menu .dl').classList.add('on');}
      panel.dataset.hover=page;var body=row.querySelector(sel);if(body)place(body,row);
    }
    rows.forEach(function(m){var row=panel.querySelector(':scope > '+m[0]);if(!row)return;row.addEventListener('mouseenter',function(){clearTimeout(leaveT);clearTimeout(timer);timer=setTimeout(function(){show(m[1],row,m[2]);},80);});});
    $('tourBtn').addEventListener('mouseenter',function(){clearTimeout(timer);clear();});
    panel.addEventListener('mouseleave',function(){clearTimeout(timer);leaveT=setTimeout(clear,300);});
    panel.addEventListener('mouseenter',function(){clearTimeout(leaveT);});
    new MutationObserver(function(){if(!$('menu').classList.contains('open')||panel.dataset.settingsPage!=='root')clear();}).observe($('menu'),{attributes:true,subtree:false,attributeFilter:['class']});
    new MutationObserver(function(){if(panel.dataset.settingsPage!=='root')clear();}).observe(panel,{attributes:true,attributeFilter:['data-settings-page']});
  }
  // 問題回報：直接寄到維護者信箱（FormSubmit）；失敗時改開郵件 App。
  function setupReport(){
    var TO='dppss92044@gmail.com',SUBJECT='瑜伽師地論app用戶問題回報';
    function meta(){return '版本 '+$('appVer').textContent+'・介面 '+({iphone:'手機',ipad:'平板',mac:'電腦'}[deviceLayout])+'・'+(EDITION==='zang'?'藏經科判':'韓清淨科判');}
    var mp=$('menu').querySelector('.mpop');new MutationObserver(function(){if(mp.dataset.settingsPage==='report'){$('reportMeta').textContent='會一併附上：'+meta();}}).observe(mp,{attributes:true,attributeFilter:['data-settings-page']});
    $('reportSend').onclick=function(){
      var text=$('reportText').value.trim(),contact=$('reportContact').value.trim(),msg=$('reportMsg'),btn=this;
      if(text.length<4){msg.textContent='請先寫下介面與問題敘述。';$('reportText').focus();return;}
      btn.disabled=true;msg.textContent='傳送中…';
      var body={_subject:SUBJECT,_template:'table',_captcha:'false','內容':text,'聯絡信箱':contact||'（未填）','環境':meta(),'瀏覽器':navigator.userAgent,'時間':new Date().toLocaleString('zh-TW')};
      if(contact)body._replyto=contact;
      fetch('https://formsubmit.co/ajax/'+TO,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)})
        .then(function(r){return r.json().catch(function(){return {};}).then(function(j){if(!r.ok||String(j.success)==='false')throw new Error(j.message||r.status);});})
        .then(function(){msg.textContent='已送出，謝謝回報！';$('reportText').value='';$('reportContact').value='';})
        .catch(function(){var mail='mailto:'+TO+'?subject='+encodeURIComponent(SUBJECT)+'&body='+encodeURIComponent(text+'\n\n'+(contact?'聯絡：'+contact+'\n':'')+meta());
          msg.innerHTML='目前無法直接送出（可能離線）。<a href="'+mail+'">改用郵件寄出</a>';})
        .finally(function(){btn.disabled=false;});
    };
  }
  // 手機與平板：兩指在直書科判上捏合，即時縮放、放開後定格。
  function setupChartPinch(){
    var pv=$('pview'),pz=$('pzoom'),g=null;
    function d(t){return Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);}
    function mobile(){return document.documentElement.dataset.mobileUi==='true';}
    pv.addEventListener('touchstart',function(e){
      if(e.touches.length!==2||!mobile())return;
      var r=pv.getBoundingClientRect(),zr=pz.getBoundingClientRect(),cx=(e.touches[0].clientX+e.touches[1].clientX)/2,cy=(e.touches[0].clientY+e.touches[1].clientY)/2;
      g={d:d(e.touches),cx:cx-r.left,cy:cy-r.top,sl:pv.scrollLeft,st:pv.scrollTop,z:Z.p,s:1};
      pz.style.transformOrigin=(cx-zr.left)+'px '+(cy-zr.top)+'px';pz.style.willChange='transform';pv.classList.remove('fit-x');
    },{passive:true});
    pv.addEventListener('touchmove',function(e){
      if(!g||e.touches.length!==2)return;e.preventDefault();
      var z=Math.max(.5,Math.min(3,g.z*d(e.touches)/g.d));g.s=z/g.z;pz.style.transform='scale('+g.s.toFixed(4)+')';
    },{passive:false});
    function end(){
      if(!g)return;var o=g;g=null;var z=Math.max(.5,Math.min(3,Math.round(o.z*o.s*20)/20)),k=z/o.z;
      pz.style.transform='';pz.style.willChange='';Z.p=z;applyZoom();try{localStorage.setItem('hk-zoom-v153',JSON.stringify(Z));}catch(er){}
      requestAnimationFrame(function(){pv.scrollLeft=Math.max(0,(o.sl+o.cx)*k-o.cx);pv.scrollTop=Math.max(0,(o.st+o.cy)*k-o.cy);});
    }
    pv.addEventListener('touchend',function(e){if(g&&e.touches.length<2)end();},{passive:true});
    pv.addEventListener('touchcancel',end,{passive:true});
    ['gesturestart','gesturechange'].forEach(function(t){pv.addEventListener(t,function(e){e.preventDefault();});});
  }
  // 觸控：一般捲動完全交給系統；只有慣性捲動越過卷首時，輕輕停在新卷開頭。
  function setupVolumeDamping(){
    if(!(navigator.maxTouchPoints>0))return;
    var touching=false,lastEnd=0,prevY=scrollY,done=new Set(),settling=0;
    addEventListener('touchstart',function(){touching=true;done.clear();},{passive:true});
    addEventListener('touchend',function(){touching=false;lastEnd=Date.now();},{passive:true});
    addEventListener('scroll',function(){
      var y=scrollY,dy=y-prevY;prevY=y;
      if(touching||!dy||Date.now()<settling||S.view!=='t'||Date.now()-lastEnd>3000||document.documentElement.dataset.mobileUi!=='true')return;
      var line=document.querySelector('.zbar').getBoundingClientRect().bottom+6,hs=article.querySelectorAll('.reading-volume > h1.jt');
      for(var i=1;i<hs.length;i++){
        var t=hs[i].getBoundingClientRect().top,before=t+dy;
        if(done.has(hs[i]))continue;
        if(dy>0&&before>line&&t<=line||dy<0&&before<line&&t>=line){done.add(hs[i]);settling=Date.now()+600;window.scrollTo({top:y+t-line,behavior:'smooth'});break;}
      }
    },{passive:true});
  }
  function setupEdition(){''')

rep("document.addEventListener('mouseover',function(e){if(!matchMedia('(hover:hover)').matches||$('tour'))return;",
    "document.addEventListener('mouseover',function(e){if(!matchMedia('(hover:hover)').matches||$('tour')||e.target.closest&&e.target.closest('#menu .mpop'))return;")
# ---------- version ----------
rep('<b id="appVer">v1.55</b>', '<b id="appVer">v1.56</b>')
rep('<div id="versionHistory"><button class="version-row" data-version="1.55">', '<div id="versionHistory"><button class="version-row" data-version="1.56"><span>v1.56</span><span>›</span></button><button class="version-row" data-version="1.55">')
rep('var versionSummaries={"1.55":', 'var versionSummaries={"1.56":"預設改為藏經科判並排在上方；正文右上方常駐淡色「藏／韓」版本字；功能選單改為單一圓角卡片；藏經版直書科判括號改為直書；手機／平板查辭典按鈕移到反白字正上方，辭典浮在畫面中央；直書科判可兩指捏合縮放（至 300%），頁首每段都可點跳頁；關於新增問題回報；手機卷次換卷提示放大並微微閃爍；行動版捲動更順，只在慣性捲過卷首時輕停；電腦版功能選單滑過即浮現下一層。","1.55":')
rep("versionPage('1.55','about');};", "versionPage('1.56','about');};")
rep("versionPage('1.55','about');}};", "versionPage('1.56','about');}};")

CSS = open('v156.css', encoding='utf-8').read()
k = s.rindex('</body></html>'); s = s[:k] + '<style id="v156">' + CSS + '</style>\n' + s[k:]
open(DST, 'w', encoding='utf-8').write(s)
print('ok')
