# v1.58
import sys, re
SRC, DST = sys.argv[1], sys.argv[2]
s = open(SRC, encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    c = s.count(old)
    if c != n: raise SystemExit('count %d: %r' % (c, old[:90]))
    s = s.replace(old, new)

# ---- 版本字：點一下直接切換 ----
rep("badge.onclick=function(e){e.stopPropagation();showSettingsPage('edition');openMenu();};",
    "badge.onclick=function(e){e.stopPropagation();switchEdition(EDITION==='zang'?'hk':'zang');};")
rep("badge.title='目前版本：'+(zang?'藏經科判':'韓清淨科判');", "badge.title='目前：'+(zang?'藏經科判':'韓清淨科判')+'（點一下切換）';")

# ---- 卷次樹狀線：從上一層標號第一個字的正中間往下 ----
rep('''bg.push(VM ? "linear-gradient(var(--thread),var(--thread)) 0 calc(" + c + " * var(--rs) + .4em + 4px)/100% 1px no-repeat" : "linear-gradient(var(--thread),var(--thread)) calc(" + c + " * var(--rs) + .4em + 4px) 0/1px 100% no-repeat"); }''',
    '''bg.push("linear-gradient(var(--thread),var(--thread)) " + (document.documentElement.dataset.mobileUi === "true" ? "min(calc(" + c + " * var(--rs) + 8px + .5em - .5px),42%)" : "calc(" + c + " * var(--rs) + 8px + .5em - .5px)") + " 0/1px 100% no-repeat"); }''')

# ---- 藏版章節標號 ----
rep('function lab(i) { return N[i][5] ? N[i][5] + "、" : ""; }',
    '''function labG(i) { return N[i][5] ? N[i][5] + "、" : ""; }
  var ZJ = null, LABEL = "gz";
  try { LABEL = localStorage.getItem("hk-zang-label-v158") === "zj" ? "zj" : "gz"; } catch (e) {}
  function lab(i) { if (EDITION === "zang" && LABEL === "zj" && ZJ) return ZJ[i] ? ZJ[i] + " " : ""; return labG(i); }''')
rep('  function setData(D) {\n    JL = {}; INS = {};\n', '  function setData(D) {\n    JL = {}; INS = {}; ZJ = D.zj || null;\n')
rep('if (t && t.indexOf(lab(k) + N[k][0]) === 0) return k;', 'if (t && t.indexOf(labG(k) + N[k][0]) === 0) return k;')

# ---- 直書：括號改半形；標號著色；長標題能放一欄就不換欄；連接線對齊 ----
rep('h.querySelectorAll("*").length || (h.textContent = h.textContent.replace(/（/g, "︵").replace(/）/g, "︶"));',
    'h.querySelectorAll("*").length || (h.textContent = h.textContent.replace(/（/g, "(").replace(/）/g, ")"));')
rep('var t = seg.replace(/（/g, "︵").replace(/）/g, "︶");', 'var t = seg.replace(/（/g, "(").replace(/）/g, ")");')
rep('return t.replace(/（/g, "︵").replace(/）/g, "︶").', 'return t.replace(/（/g, "(").replace(/）/g, ")").')
rep('''    el.querySelectorAll(".nd").forEach(function (nd) {
      var w = document.createTreeWalker(nd, NodeFilter.SHOW_TEXT), tn;''', '''    decorateLabels(el);
    el.querySelectorAll(".nd").forEach(function (nd) {
      var w = document.createTreeWalker(nd, NodeFilter.SHOW_TEXT), tn;''')
rep('''    centerSheet(el.querySelector(".page"));
  }
  function verticalForms(t) {''', '''    relayoutSheet(el.querySelector(".page"));
    centerSheet(el.querySelector(".page"));
  }
  function vlab(t) { return esc(t).replace(/[0-9]{1,2}/g, function (d) { return '<span class="tcy">' + d + "</span>"; }); }
  function decorateLabels(el) {
    el.querySelectorAll(".nd[data-id], .head span[data-id]").forEach(function (nd) {
      var i = +nd.dataset.id; if (!(i >= 0) || !N[i]) return;
      var g = labG(i), d = lab(i), t = nd.textContent, pre = "";
      if (t.charAt(0) === "◎") { pre = "◎"; t = t.slice(1); }
      if (!g || t.indexOf(g) !== 0) return;
      nd.innerHTML = esc(pre) + (d ? '<span class="lb">' + vlab(d) + "</span>" : "") + esc(t.slice(g.length));
    });
  }
  // 長標題被拆成好幾欄：下方有空間就合回一欄；仍需多欄時，連接線改接在第一欄正中。
  function relayoutSheet(pg) {
    if (!pg || pg.dataset.rl) return;
    var svg = pg.querySelector("svg.ln"); if (!svg) return;
    var nds = [].slice.call(pg.children).filter(function (e) { return e.classList && e.classList.contains("nd"); });
    if (!nds.length || !nds[0].offsetHeight) return;
    pg.dataset.rl = "1";
    var MM = 96 / 25.4;
    function box(e) { return { l: parseFloat(e.style.left), t: parseFloat(e.style.top), w: parseFloat(e.style.width), h: e.offsetHeight / MM }; }
    var L = [].slice.call(svg.querySelectorAll("line")).map(function (el) { return { el: el, x1: +el.getAttribute("x1"), y1: +el.getAttribute("y1"), x2: +el.getAttribute("x2"), y2: +el.getAttribute("y2") }; });
    function setL(o) { o.el.setAttribute("x1", o.x1.toFixed(2)); o.el.setAttribute("y1", o.y1.toFixed(2)); o.el.setAttribute("x2", o.x2.toFixed(2)); o.el.setAttribute("y2", o.y2.toFixed(2)); }
    function vert(o) { return Math.abs(o.x1 - o.x2) < 0.02; }
    function horz(o) { return Math.abs(o.y1 - o.y2) < 0.02; }
    function fixBar(y, ox, nx) {
      var hs = L.filter(function (o) { return horz(o) && Math.abs(o.y1 - y) < 0.06; });
      if (hs.some(function (o) { return Math.min(o.x1, o.x2) - 0.05 <= nx && nx <= Math.max(o.x1, o.x2) + 0.05; })) return;
      var e = hs.filter(function (o) { return Math.abs(o.x1 - ox) < 0.06 || Math.abs(o.x2 - ox) < 0.06; })[0];
      if (e) { if (Math.abs(e.x1 - ox) < 0.06) e.x1 = nx; else e.x2 = nx; setL(e); return; }
      var ln = document.createElementNS("http://www.w3.org/2000/svg", "line"); svg.appendChild(ln);
      var o = { el: ln, x1: ox, y1: y, x2: nx, y2: y }; setL(o); L.push(o);
    }
    var groups = [];
    for (var i = 0; i < nds.length; i++) {
      var e = nds[i]; if (e.dataset.id == null || e.classList.contains("nt")) continue;
      var g = [e];
      while (i + 1 < nds.length && nds[i + 1].dataset.id === e.dataset.id && !nds[i + 1].classList.contains("nt") && parseFloat(nds[i + 1].style.left) < parseFloat(g[g.length - 1].style.left) - 1) g.push(nds[++i]);
      if (g.length > 1) groups.push(g);
    }
    groups.forEach(function (g) {
      var bs = g.map(box), w = bs[0].w, top = bs[0].t;
      var minL = Math.min.apply(null, bs.map(function (b) { return b.l; })), maxR = Math.max.apply(null, bs.map(function (b) { return b.l + b.w; }));
      var bc = (minL + maxR) / 2, cc = bs[0].l + w / 2, bottom = Math.max.apply(null, bs.map(function (b) { return b.t + b.h; }));
      var id = g[0].dataset.id, nt = nds.filter(function (n) { return n.classList.contains("nt") && n.dataset.go === id && parseFloat(n.style.top) >= top && parseFloat(n.style.left) >= minL - 1 && parseFloat(n.style.left) <= maxR + 1; })[0];
      var ntb = nt ? box(nt) : null, blockBottom = ntb ? Math.max(bottom, ntb.t + ntb.h) : bottom;
      var inc = L.filter(function (o) { return vert(o) && Math.abs(o.x1 - bc) < 0.08 && Math.abs(Math.max(o.y1, o.y2) - top) < 1.7; })[0];
      var out = L.filter(function (o) { return vert(o) && Math.abs(o.x1 - bc) < 0.08 && Math.min(o.y1, o.y2) >= top + 1 && Math.min(o.y1, o.y2) <= blockBottom + 3; })[0];
      var saved = g.map(function (e) { return [e.innerHTML, e.style.left]; });
      g[0].innerHTML = g.map(function (e) { return e.innerHTML; }).join("");
      g.slice(1).forEach(function (e) { e.style.display = "none"; });
      g[0].style.left = (bc - w / 2).toFixed(2) + "mm";
      var h = g[0].offsetHeight / MM, nb = top + h, ntH = ntb ? ntb.h + 0.3 : 0, need = nb + ntH, limit = 281, x0 = bc - w / 2, x1 = bc + w / 2;
      nds.forEach(function (n) { if (g.indexOf(n) >= 0 || n === nt || n.style.display === "none") return; var b = box(n); if (b.t > top + 0.5 && b.l < x1 - 0.3 && b.l + b.w > x0 + 0.3) limit = Math.min(limit, b.t); });
      L.forEach(function (o) {
        if (o === inc || o === out) return;
        if (horz(o)) { if (o.y1 > top + 0.5 && Math.min(o.x1, o.x2) < x1 && Math.max(o.x1, o.x2) > x0) limit = Math.min(limit, o.y1); }
        else if (vert(o) && o.x1 > x0 && o.x1 < x1 && Math.min(o.y1, o.y2) > top + 0.5) limit = Math.min(limit, Math.min(o.y1, o.y2));
      });
      if (out) limit = Math.min(limit, Math.max(out.y1, out.y2) - 1.5);
      if (need <= limit - 1) {
        g.slice(1).forEach(function (e) { e.remove(); });
        if (nt) { nt.style.left = (bc - ntb.w / 2).toFixed(2) + "mm"; nt.style.top = (nb + 0.2).toFixed(2) + "mm"; }
        if (out) { var gap = Math.max(0.3, Math.min(out.y1, out.y2) - blockBottom), ny = need + gap; if (out.y1 < out.y2) out.y1 = ny; else out.y2 = ny; setL(out); }
      } else {
        g.forEach(function (e, k) { e.innerHTML = saved[k][0]; e.style.left = saved[k][1]; e.style.display = ""; });
        if (inc) { var ox = inc.x1; inc.x1 = inc.x2 = cc; setL(inc); fixBar(Math.min(inc.y1, inc.y2), ox, cc); }
        if (out) { var ox2 = out.x1; out.x1 = out.x2 = cc; setL(out); fixBar(Math.max(out.y1, out.y2), ox2, cc); }
      }
    });
  }
  function verticalForms(t) {''')
# 直書頁在面板看不見時，等出現在畫面上再排
rep('var pr = pg.getBoundingClientRect(), s = pr.width / pg.offsetWidth; if (!s) return;',
    'var pr = pg.getBoundingClientRect(), s = pr.width / pg.offsetWidth; if (!s) { delete pg.dataset.c; return; }')
rep('''        if (en.isIntersecting) { if (!el.firstChild) { fillPage(el, p); if (S.cur != null) markIn(el, S.cur); } pvis.set(p, 1); }''',
    '''        if (en.isIntersecting) { if (!el.firstChild) { fillPage(el, p); if (S.cur != null) markIn(el, S.cur); } else { var pgEl = el.querySelector(".page"); if (pgEl && !pgEl.dataset.rl) { relayoutSheet(pgEl); centerSheet(pgEl); } } pvis.set(p, 1); }''')

# ---- 點直書科判：留在原頁、標題保持可見；(分N) 跳到下一層 ----
rep('''        if (!pnd.closest(".head") && other && other !== here) { focusNode(pi, "go", other); return; }
        focusNode(pi, pnd.closest(".head") || N[pi][6] !== S.juan ? "panelhead" : "panel"); return;''',
    '''        void other; void here;
        focusNode(pi, pnd.closest(".head") ? "panelhead" : "panel"); return;''')
rep('''if(screen==='chart'){var el=hit.el,sh=el.closest('.ksheet'),here=sh?+sh.dataset.p:0,other=el.classList.contains('rt')?APPEAR[hit.i]:OWN[hit.i];if(!el.closest('.head')&&other&&other!==here){focusNode(hit.i,'go',other);return;}if(el.closest('.head')){focusNode(hit.i,'panelhead');return;}focusNode(hit.i,'panel',S.ppage);return;}''',
    '''if(screen==='chart'){if(hit.el.closest('.head')){focusNode(hit.i,'panelhead');return;}focusNode(hit.i,'panel',S.ppage);return;}''')
rep('var pgo = t.closest("#pzoom [data-go]"); if (pgo) { var g2 = +pgo.dataset.go; focusNode(g2, "go", OWN[g2]); return; }',
    'var pgo = t.closest("#pzoom [data-go]"); if (pgo) { goSub(+pgo.dataset.go); return; }')
rep('var go = t.closest(".kscale [data-go]"); if (go) { var gi = +go.dataset.go; focusNode(gi, "go", OWN[gi]); return; }',
    'var go = t.closest(".kscale [data-go]"); if (go) { goSub(+go.dataset.go); return; }')
rep('''  // floating ↑ in the 直書科判 panel''', '''  function goSub(g) {
    if (OWN[g]) { focusNode(g, "go", OWN[g]); return; }
    for (var c = g + 1; c < N.length; c++) if (N[c][4] === g) { focusNode(c, "go", APPEAR[c]); return; }
    focusNode(g, "panel");
  }
  // floating ↑ in the 直書科判 panel''')
rep('''      else { panelJuan = j; panelPage(pg || APPEAR[i] || 2, i, j); }''', '''      else { panelJuan = j; panelPage(pg || APPEAR[i] || 2, i, j, from === "go"); }''')
rep('''function panelPage(p, hl, jl) {''', '''function panelPage(p, hl, jl, preferRoot) {''')
rep('''var pv = $("pview"), tgt = hl != null ? el.querySelector('[data-id="' + hl + '"]') : null;''',
    '''var pv = $("pview"), tgt = hl != null ? (preferRoot && el.querySelector('.nd.rt[data-id="' + hl + '"]')) || el.querySelector('[data-id="' + hl + '"]') : null;''')
# 從科判點過去時，正文定位不被「跳卷固定」蓋掉；之後正文捲動前，科判不被同步拉走
rep('var targetPage=linkedPage;if (S.view !== "t" || S.juan !== j) openText(j);',
    'var targetPage=linkedPage;if (S.view !== "t" || S.juan !== j) { noPin = true; if (from === "panel" || from === "panelhead" || from === "go") panelJuan = j; openText(j); noPin = false; }panelHold = from === "panel" || from === "panelhead" || from === "go";')
rep('} else { main.scrollLeft = 0; pinJump(j); }', '} else { main.scrollLeft = 0; if (!noPin) pinJump(j); }')
rep('  var jumpUntil = 0, jumpJuan = 0, jumpGen = 0;', '''  var jumpUntil = 0, jumpJuan = 0, jumpGen = 0, noPin = false, panelHold = false;
  ["wheel", "touchmove", "keydown"].forEach(function (ev) { window.addEventListener(ev, function (e) { if (!(e.target && e.target.closest && e.target.closest("#panel"))) panelHold = false; }, { passive: true, capture: true }); });''')
rep('      if (Date.now() < spyLock) return;', '      if (Date.now() < spyLock || panelHold) return;')

# ---- 科判縮放以畫面中央（或已選的科判）為中心 ----
rep('''    Z[k] = f === 0 ? 1 : Math.max(50,Math.min(k==='p'?300:200,Math.round(Z[k]*10)*10+(f>0?10:-10)))/100;
    applyZoom(); if (k === "r") ensureRail();''', '''    Z[k] = f === 0 ? 1 : Math.max(50,Math.min(k==='p'?300:200,Math.round(Z[k]*10)*10+(f>0?10:-10)))/100;
    if (k === "p") chartZoomKeep(applyZoom); else applyZoom(); if (k === "r") ensureRail();''')
rep('''  function setFont(sz, lsp, save) {''', '''  function chartZoomKeep(fn) {
    var pv = $("pview"); if (!pv.clientWidth) { fn(); return; }
    var r = pv.getBoundingClientRect(), on = $("pzoom").querySelector(".nd.on"), ax = pv.clientWidth / 2, ay = pv.clientHeight / 2;
    if (on) { var o = on.getBoundingClientRect(); if (o.bottom > r.top && o.top < r.bottom && o.right > r.left && o.left < r.right) { ax = o.left + o.width / 2 - r.left; ay = o.top + o.height / 2 - r.top; } }
    var rx = (pv.scrollLeft + ax) / pv.scrollWidth, ry = (pv.scrollTop + ay) / pv.scrollHeight;
    fn();
    pv.scrollLeft = Math.max(0, rx * pv.scrollWidth - ax); pv.scrollTop = Math.max(0, ry * pv.scrollHeight - ay);
  }
  function setFont(sz, lsp, save) {''')

# ---- 觸控查詞按鈕改到反白字下方（系統選單在上方） ----
rep('''var x=Math.max(v.left+8,Math.min(v.left+v.width-w-8,cx-w/2)),y=first.top-SYS-h;
      if(y<b.top)y=last.bottom+SYS;y=Math.max(b.top,Math.min(b.bottom-h,y));''',
    '''var lx=(last.left+last.right)/2,x=Math.max(v.left+8,Math.min(v.left+v.width-w-8,lx-w/2)),y=last.bottom+34;
      if(y+h>b.bottom)y=first.top-SYS-28-h;y=Math.max(b.top,Math.min(b.bottom-h,y));void cx;''')

# ---- 匯出：預設不勾 ----
rep('<input type="checkbox" id="exText" checked>', '<input type="checkbox" id="exText">')
rep('<input type="checkbox" id="exKp" checked>', '<input type="checkbox" id="exKp">')
rep('<input type="checkbox" id="exF_pdf" checked>', '<input type="checkbox" id="exF_pdf">')
rep('<input type="radio" id="exSep" name="exm" checked>', '<input type="radio" id="exSep" name="exm">')

# ---- 問題回報：只留框與送出 ----
a = s.index('<div id="reportPage">'); b = s.index('<div id="versionHistory">', a)
s = s[:a] + '<div id="reportPage"><textarea id="reportText" rows="9" aria-label="問題回報內容"></textarea><button class="go rp-send" id="reportSend" type="button">送出</button><p class="rp-msg" id="reportMsg" role="status"></p></div>' + s[b:]
a = s.index('  function setupReport(){'); b = s.index('  // 手機與平板：兩指在直書科判上捏合', a)
s = s[:a] + r'''  function setupReport(){
    var TO='dppss92044@gmail.com',SUBJECT='瑜伽師地論app用戶問題回報';
    function meta(){return '版本 '+$('appVer').textContent+'・介面 '+({iphone:'手機',ipad:'平板',mac:'電腦'}[deviceLayout])+'・'+(EDITION==='zang'?'藏經科判':'韓清淨科判');}
    $('reportSend').onclick=function(){
      var text=$('reportText').value.trim(),msg=$('reportMsg'),btn=this;
      if(!text){$('reportText').focus();return;}
      btn.disabled=true;msg.textContent='傳送中…';
      var mail='mailto:'+TO+'?subject='+encodeURIComponent(SUBJECT)+'&body='+encodeURIComponent(text+'\n\n'+meta());
      fetch('https://formsubmit.co/ajax/'+TO,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({_subject:SUBJECT,_template:'table',_captcha:'false','內容':text,'環境':meta(),'瀏覽器':navigator.userAgent,'時間':new Date().toLocaleString('zh-TW')})})
        .then(function(r){return r.json().catch(function(){return {};}).then(function(j){if(!r.ok||String(j.success)==='false'){var er=new Error(j.message||('HTTP '+r.status));er.activation=/activat/i.test(j.message||'');throw er;}});})
        .then(function(){msg.textContent='已送出';$('reportText').value='';})
        .catch(function(er){msg.innerHTML=(er&&er.activation?'寄件服務尚未啟用（請到信箱點啟用信）。':'送出失敗。')+'<a href="'+mail+'">改用郵件</a>';})
        .finally(function(){btn.disabled=false;});
    };
  }
''' + s[b:]

# ---- 藏版：科判標號（干支／章節）----
LABEL_HTML = ('<div class="label-settings"><button class="mi" id="labelBtn" role="menuitem" aria-haspopup="true">'
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M5 6h3M5 12h3M5 18h3M11 6h8M11 12h8M11 18h8"/></svg>'
  '<span>科判標號</span><em class="mi-val" id="labelCur">干支</em><i class="chev">›</i></button>'
  '<div class="label-body" role="radiogroup" aria-label="科判標號">'
  '<button type="button" class="label-choice" data-label="gz" role="radio"><span class="ed-t"><b>干支</b><small>甲一、乙一、丙一…</small></span></button>'
  '<button type="button" class="label-choice" data-label="zj" role="radio"><span class="ed-t"><b>章節</b><small>1 本地分・1章・1節・1項・1目</small></span></button>'
  '</div></div>')
rep('<div class="content-settings">', LABEL_HTML + '<div class="content-settings">')
rep("var names={root:'功能',report:'問題回報',", "var names={root:'功能',label:'科判標號',report:'問題回報',")
rep("lockedSub=page==='root'?null:page==='edition'?'edition':", "lockedSub=page==='root'?null:page==='label'?'label':page==='edition'?'edition':")
rep("var target=e.target.closest('#reportBtn,#editionBtn,", "var target=e.target.closest('#labelBtn,#reportBtn,#editionBtn,")
rep("var page=target.id==='reportBtn'?'report':", "var page=target.id==='labelBtn'?'label':target.id==='reportBtn'?'report':")
rep("var rows=[['.edition-settings','edition','.edition-body'],", "var rows=[['.edition-settings','edition','.edition-body'],['.label-settings','label','.label-body'],")
rep('''  function setupEdition(){''', '''  function labelUI(){
    $('labelCur').textContent=LABEL==='zj'?'章節':'干支';
    document.querySelectorAll('.label-choice').forEach(function(b){b.setAttribute('aria-checked',String(b.dataset.label===LABEL));});
  }
  function setLabel(v){
    if(v===LABEL)return;LABEL=v;try{localStorage.setItem('hk-zang-label-v158',v);}catch(e){}labelUI();
    article.querySelectorAll('.reading-volume').forEach(function(sec){refreshVolume(+sec.dataset.juan);});
    if(S.cur!=null&&$('k'+S.cur))$('k'+S.cur).classList.add('on');
    renderRail(S.railJuan||1);if(S.cur!=null&&N[S.cur])railFocus(S.cur);
    $('pzoom').querySelectorAll('.ksheet').forEach(function(el){if(el.firstChild)fillPage(el,+el.dataset.p);});
    if(S.cur!=null)markIn($('pzoom'),S.cur);
  }
  function setupEdition(){
    labelUI();document.querySelectorAll('.label-choice').forEach(function(b){b.onclick=function(e){e.stopPropagation();setLabel(b.dataset.label);};});''')

# ---- 版本紀錄：精簡 ----
NEW = {
 '1.58': 'feat: 藏版「科判標號」干支／章節\\nfeat: 點正文右上「藏／韓」直接切換\\nfix: 直書長標題不必要換欄、連接線對齊、括號改半形\\nfix: 點直書科判不跳頁，標題留在畫面；(分N) 跳下一層\\nfix: 科判縮放以畫面中央為準\\nfix: 卷次樹狀線接在字中央\\nfix: 觸控查詞按鈕移到反白字下方\\nui: 介面選擇改底色、匯出精簡、問題回報精簡',
 '1.57': 'fix: 點卷號停在前一卷',
 '1.56': 'feat: 預設藏經科判、版本字、問題回報、桌面懸停子選單、科判捏合縮放\\nfix: 直書括號、頁首可點、行動捲動',
 '1.55': 'fix: PWA 更新（網頁線上優先、每版獨立快取、安全時機重新載入一次）',
 '1.54': 'feat: 版本切換（韓清淨／藏經）\\nfix: 觸控查詞、科判寬度、字體與匯出面板、底部導覽、行動捲動',
}
for k, v in NEW.items():
    if k == '1.58': continue
    s, n = re.subn(r'"%s":"(?:[^"\\]|\\.)*"' % re.escape(k), lambda m, k=k, v=v: '"%s":"%s"' % (k, v), s, count=1)
    assert n == 1, k
rep('var versionSummaries={"1.57":', 'var versionSummaries={"1.58":"%s","1.57":' % NEW['1.58'])
rep('<b id="appVer">v1.57</b>', '<b id="appVer">v1.58</b>')
rep('<div id="versionHistory"><button class="version-row" data-version="1.57">', '<div id="versionHistory"><button class="version-row" data-version="1.58"><span>v1.58</span><span>›</span></button><button class="version-row" data-version="1.57">')
rep("versionPage('1.57','about');};", "versionPage('1.58','about');};")
rep("versionPage('1.57','about');}};", "versionPage('1.58','about');}};")

CSS = open('v158.css', encoding='utf-8').read()
k = s.rindex('</body></html>'); s = s[:k] + '<style id="v158">' + CSS + '</style>\n' + s[k:]
open(DST, 'w', encoding='utf-8').write(s)
print('ok')
