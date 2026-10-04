# v1.67（以 v1.66 為底）
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
s = s[:a] + open('layout167.js', encoding='utf-8').read() + s[b:]

# 2) 科判欄跳轉：置中、並在版面穩定後再校正一次
rep('''    pScrollLock = Date.now() + 600;
    if (tgt) {
      var r = tgt.getBoundingClientRect(), rv = pv.getBoundingClientRect();
      pv.scrollTop += (r.top - rv.top) - pv.clientHeight / 3;
      pv.scrollLeft += (r.left - rv.left) - pv.clientWidth / 2;
    } else pv.scrollTop = el.offsetTop - 12;''',
'''    pScrollLock = Date.now() + 600;
    if (tgt) chartCenter(tgt, hl, p, preferRoot);
    else pv.scrollTop = el.offsetTop - 12;''')
rep('''  function panelPage(p, hl, jl, preferRoot) {''', '''  // 把科判欄的某一科捲到畫面正中；頁面延遲排版時再校正，使用者一動就停
  var chartGen = 0;
  function chartCenter(tgt, id, p, preferRoot) {
    var pv = $("pview"), gen = ++chartGen, t0 = Date.now();
    function find() { var el = $("pp" + p); if (!el) return tgt; return (preferRoot && el.querySelector('.nd.rt[data-id="' + id + '"]')) || (tgt && tgt.isConnected ? tgt : el.querySelector('[data-id="' + id + '"]')); }
    function fix() {
      if (gen !== chartGen) return; var t = find(); if (!t || !t.getClientRects().length) return;
      var rv = pv.getBoundingClientRect(), sh = $("pp" + p);
      // 該頁還在畫面外（尚未排版）：先把那一頁捲進來，下一個畫面再精確置中
      if (sh) { var sr = sh.getBoundingClientRect(); if (sr.bottom < rv.top + 20 || sr.top > rv.bottom - 20) { pScrollLock = Date.now() + 400; pv.scrollTop += sr.top - rv.top; requestAnimationFrame(function () { requestAnimationFrame(fix); }); return; } }
      var r = t.getBoundingClientRect();
      var dy = (r.top + r.height / 2) - (rv.top + pv.clientHeight / 2), dx = (r.left + r.width / 2) - (rv.left + pv.clientWidth / 2);
      if (r.height > pv.clientHeight * 0.8) dy = r.top - rv.top - pv.clientHeight * 0.1;
      pScrollLock = Date.now() + 400;
      if (Math.abs(dy) > 2) pv.scrollTop += dy; if (Math.abs(dx) > 2) pv.scrollLeft += dx;
    }
    fix(); [120, 450, 1000].forEach(function (ms) { setTimeout(fix, ms); });
    ["wheel", "touchstart", "pointerdown"].forEach(function (ev) { pv.addEventListener(ev, function () { if (Date.now() - t0 > 80) chartGen++; }, { once: true, passive: true }); });
  }
  function chartJumpTo(id, wantRoot, from) {
    if (!(id >= 0) || !N[id]) return;
    buildPanel();
    var p = wantRoot ? (OWN[id] || APPEAR[id]) : (APPEAR[id] || OWN[id]); if (!p) return;
    var el = $("pp" + p); if (!el) return; if (!el.firstChild) fillPage(el, p);
    var t = wantRoot ? el.querySelector('.nd.rt[data-id="' + id + '"]') : el.querySelector('.nd.tt[data-id="' + id + '"]:not(.rt)');
    if (!t) t = el.querySelector('.nd[data-id="' + id + '"]');
    markIn($("pzoom"), id); panelHold = true; setPanelLabel(p);
    chartCenter(t, id, p, wantRoot);
  }
  function panelPage(p, hl, jl, preferRoot) {''')
# 點兩下：往上回溯
rep('''  function goSub(g) {''', '''  setTimeout(function () {
    var pz = $("pzoom"); if (!pz) return;
    pz.addEventListener("dblclick", function (e) {
      var t = e.target; if (!(t instanceof Element)) return;
      var h = t.closest(".head [data-id]");
      if (h) { e.preventDefault(); chartJumpTo(+h.dataset.id, false); return; }
      var nd = t.closest(".nd.tt[data-id]"); if (!nd) return;
      e.preventDefault(); var id = +nd.dataset.id; if (!(id >= 0) || !N[id]) return;
      if (nd.classList.contains("rt")) { chartJumpTo(id, false); return; }
      var pid = N[id][4], sheet = nd.closest(".ksheet"), pe = pid >= 0 && sheet && (sheet.querySelector('.nd.tt[data-id="' + pid + '"]:not(.rt)') || sheet.querySelector('.nd.tt[data-id="' + pid + '"]'));
      if (pe) { markIn(pz, pid); panelHold = true; chartCenter(pe, pid, +sheet.dataset.p, pe.classList.contains("rt")); }
      else if (pid >= 0) chartJumpTo(pid, false);
      try { getSelection().removeAllRanges(); } catch (er) {}
    });
  }, 0);
  function goSub(g) {''')
rep('''    if (OWN[g]) { focusNode(g, "go", OWN[g]); return; }
    for (var c = g + 1; c < N.length; c++) if (N[c][4] === g) { focusNode(c, "go", APPEAR[c]); return; }''',
'''    if (OWN[g]) { focusNode(g, "go", OWN[g]); chartJumpTo(g, true); return; }
    for (var c = g + 1; c < N.length; c++) if (N[c][4] === g) { focusNode(c, "go", APPEAR[c]); chartJumpTo(c, false); return; }''')

# 3) 卷次：連續多卷，可一直上下滑
i = s.index('  function renderRail(j) {'); j = s.index('  (function rubber() {', i)
body = s[i:j]
nb = body.replace('  function renderRail(j) {\n    S.railJuan = j;\n', '  function railHTML(j) {\n', 1)
nb = nb.replace('$("rinner").style.setProperty("--rs", Math.max(14, Math.min(20, avail / maxD)).toFixed(2) + "px");', 'var rsv = Math.max(14, Math.min(20, avail / maxD)).toFixed(2);', 1)
k1 = nb.index('    $("rinner").innerHTML = out.join("");')
nb = nb[:k1] + '''    return '<div class="rsec" data-j="' + j + '" style="--rs:' + rsv + 'px">' + out.join("") + "</div>";
  }
  function railMark(j) {
    S.railJuan = j;
    var as = $("juans").children; for (var q = 0; q < as.length; q++) as[q].classList.toggle("on", q + 1 === j);
    $("jCur").textContent = "卷" + j;
  }
  var railBusy = false, railProg = 0;
  function railFill() {
    var sc = $("rscroll"), inner = $("rinner"), secs = inner.querySelectorAll(".rsec"); if (!secs.length || railBusy) return;
    railBusy = true;
    var last = +secs[secs.length - 1].dataset.j, first = +secs[0].dataset.j;
    if (last < 100 && sc.scrollHeight - sc.scrollTop - sc.clientHeight < 1400) inner.insertAdjacentHTML("beforeend", railHTML(last + 1));
    if (first > 1 && sc.scrollTop < 500) { var an = secs[0], o0 = an.offsetTop, st0 = sc.scrollTop; inner.insertAdjacentHTML("afterbegin", railHTML(first - 1)); sc._progX = Date.now(); sc.scrollTop = st0 + an.offsetTop - o0; }
    secs = inner.querySelectorAll(".rsec");
    if (secs.length > 7) {
      var mid = sc.scrollTop + sc.clientHeight / 2, a0 = secs[0], aN = secs[secs.length - 1];
      if (a0.offsetTop + a0.offsetHeight < mid - 3000) { var a1 = secs[1], o1 = a1.offsetTop, st1 = sc.scrollTop; a0.remove(); sc.scrollTop = st1 - (o1 - a1.offsetTop); }
      else if (aN.offsetTop > mid + 3000) aN.remove();
    }
    railBusy = false;
  }
  var railAnchor = null;
  function railHold() { if (!railAnchor || Date.now() > railAnchor.until) { railAnchor = null; return; } var sc = $("rscroll"), x = $("rinner").querySelector('.rsec[data-j="' + railAnchor.j + '"]'); if (x) { railProg = Date.now() + 300; sc.scrollTop = x.offsetTop - 6; } }
  function renderRail(j) {
    railMark(j); railProg = Date.now() + 900; railAnchor = { j: j, until: Date.now() + 1200 };
    setTimeout(railHold, 60); setTimeout(railHold, 300); setTimeout(railHold, 800);
    $("rinner").innerHTML = railHTML(j);
''' + nb[k1 + len('    $("rinner").innerHTML = out.join("");\n'):]
nb = nb.replace('''    var as = $("juans").children; for (var q = 0; q < as.length; q++) as[q].classList.toggle("on", q + 1 === j);
    $("jCur").textContent = "卷" + j;
    $("pullTop")''', '''    railFill();
    $("pullTop")''', 1)
nb += '''  setTimeout(function () {
    var sc = $("rscroll"), tk = false;
    ["wheel", "touchstart", "pointerdown", "keydown"].forEach(function (ev) { sc.addEventListener(ev, function () { railAnchor = null; railProg = 0; }, { passive: true }); });
    sc.addEventListener("scroll", function () {
      if (tk) return; tk = true;
      requestAnimationFrame(function () {
        tk = false; railFill(); railHold();
        var line = sc.getBoundingClientRect().top + sc.clientHeight * 0.5, cur = null;
        sc.querySelectorAll(".rsec").forEach(function (x) { var r = x.getBoundingClientRect(); if (r.top <= line && r.bottom > line) cur = +x.dataset.j; });
        if (cur && cur !== S.railJuan && Date.now() > railProg) railMark(cur);
      });
    }, { passive: true });
  }, 0);
'''
s = s[:i] + nb + s[j:]
rep('''    if (S.railJuan !== j) renderRail(j);
    var c = $("rinner").querySelector("a.cur"); if (c) c.classList.remove("cur");
    var a = $("rinner").querySelector('a[data-n="' + i + '"]');''',
'''    if (!$("rinner").querySelector('.rsec[data-j="' + j + '"]')) renderRail(j); else if (S.railJuan !== j) railMark(j);
    $("rinner").querySelectorAll("a.cur").forEach(function (x) { x.classList.remove("cur"); });
    var a = $("rinner").querySelector('.rsec[data-j="' + j + '"] a[data-n="' + i + '"]') || $("rinner").querySelector('a[data-n="' + i + '"]');''')
rep('var rn = t.closest(".rol a");', 'var rn = t.closest(".rol a"); if (rn && rn.dataset.juan) railMark(+rn.dataset.juan);')
rep("if(screen==='catalog'){if(hit.el.dataset.carry)", "if(screen==='catalog'){if(hit.el.dataset.juan)railMark(+hit.el.dataset.juan);if(hit.el.dataset.carry)")
# 不再用阻尼切卷
rep("function show() {", "function show() { pull = 0; return;")
rep("function commit(dir) {", "function commit(dir) { reset(); return;")
rep("sc.addEventListener('touchstart',function(e){if(!(e.target instanceof Element)||!phoneMode()", "sc.addEventListener('touchstart',function(e){if(true||!(e.target instanceof Element)||!phoneMode()")

# 4) 章節空格、版本紀錄
LATEST = "v1.67\n最後更新：2026年10月4日"
i = s.index("$('versionHistory').onclick=null;$('versionDoc').textContent=") + len("$('versionHistory').onclick=null;$('versionDoc').textContent=")
dec = json.JSONDecoder(); _, end = dec.raw_decode(s[i:])
s = s[:i] + json.dumps(LATEST, ensure_ascii=False) + s[i + end:]
m = re.search(r'var versionSummaries=(\{.*?\});', s)
SUM = json.loads(m.group(1)); SUM = dict([('1.67', LATEST)] + list(SUM.items()))
s = s[:m.start(1)] + json.dumps(SUM, ensure_ascii=False, separators=(',', ':')) + s[m.end(1):]
rep('<b id="appVer">v1.66</b>', '<b id="appVer">v1.67</b>')

# 5) 視窗變窄時卷次縮圖鈕會壓到功能鍵：直接隱藏
rep('''  function focusRailCamera(a){''', '''  function railOpenGuard(){var a=$('railOpen'),b=$('menuBtn');if(!a||!b)return;a.style.visibility='';var r1=a.getBoundingClientRect(),r2=b.getBoundingClientRect();if(r1.width&&r2.width&&r1.right>r2.left-6&&r1.left<r2.right+6&&r1.bottom>r2.top&&r1.top<r2.bottom)a.style.visibility='hidden';}
  window.addEventListener('resize',function(){setTimeout(railOpenGuard,60);});window.addEventListener('reader-layout',function(){setTimeout(railOpenGuard,60);});setInterval(railOpenGuard,1500);
  // 手機科判：一鍵回頂
  setTimeout(function(){var p=$('panel');if(!p||$('chartTop'))return;var b=document.createElement('button');b.type='button';b.id='chartTop';b.className='chart-top';b.setAttribute('aria-label','回到頂端');b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V6M6 11l6-6 6 6"/></svg>';b.onclick=function(e){e.stopPropagation();var v=$('pview');if(v)v.scrollTo({top:0,behavior:'smooth'});};p.appendChild(b);},0);
  function focusRailCamera(a){railProg=Date.now()+700;railAnchor=null;''')

CSS = open('v167.css', encoding='utf-8').read()
k = s.rindex('</body></html>'); s = s[:k] + '<style id="v167">' + CSS + '</style>\n' + s[k:]
open(DST, 'w', encoding='utf-8').write(s)
print('ok')
