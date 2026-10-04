  // 直書科判（藏版）：每頁依樹狀結構重新排版（v1.65）。
  // 同層對齊、兄弟等距、奇數子科中間那科與上層同一直線、連接線一律在字塊正中、括號不斷在欄尾。
  function vlabel(i) { return EDITION === "zang" && LABEL === "zj" && ZJ ? (ZJ[i] || "") : labG(i); }
  var VT = { FULL: 4.93, HALF: 2.73, NFULL: 3.25, NHALF: 1.8, WC: 5.19, TOP: 16, BOTTOM: 282, LEFT: 12, RIGHT: 184.6, LEVEL: 10, STUB: 4.6, BAND: 10, CG: 1.0, LONG: 18, GAP: 2.47 };
  function vpitch() { return VT.WC + VT.CG; }
  function vtoks(str, full, half) {
    var out = [], re = /[0-9]{1,2}|[\s\S]/g, m;
    while ((m = re.exec(str))) {
      var ch = m[0];
      if (/^[0-9]+$/.test(ch)) out.push({ c: ch, h: '<span class="tcy">' + ch + "</span>", a: full });
      else if (/\s/.test(ch)) continue;
      else if (/[\x21-\x7e]/.test(ch)) out.push({ c: ch, h: esc(ch), a: half });
      else out.push({ c: ch, h: esc(ch), a: full });
    }
    return out;
  }
  var VCLOSE = /^[)、，。；：！？」』）︶]$/;
  function vfill(tk, Hc, ind) {
    var cols = [[]], y = 0;
    for (var i = 0; i < tk.length; i++) {
      var col = cols[cols.length - 1], top = cols.length > 1 ? ind : 0;
      if (col.length && top + y + tk[i].a > Hc + 0.01 && !/^[—─]$/.test(tk[i].c)) {
        var cut = col.length;
        if (col[cut - 1].c === "(") cut--;
        for (var q = cut - 1; q >= 1; q--) { if (col[q].c === ")") break; if (col[q].c === "(") { cut = q; break; } }
        if (VCLOSE.test(tk[i].c) && cut === col.length && cut > 1) cut--;
        if (cut < 1) cut = col.length;
        var moved = col.splice(cut);
        cols.push(moved); y = moved.reduce(function (s, t) { return s + t.a; }, 0);
        col = cols[cols.length - 1];
      }
      col.push(tk[i]); y += tk[i].a;
    }
    return cols;
  }
  function vmeasure(n) {
    var tk = n.tk, total = tk.reduce(function (s, t) { return s + t.a; }, 0), ind = n.indA, cols;
    if (n.k <= 1) cols = [tk];
    else {
      // 續欄一律從標號下方（正文起點）開始，不往上頂
      var lo = (total + ind * (n.k - 1)) / n.k - 0.01, hi = total;
      for (var it = 0; it < 22; it++) { var mid = (lo + hi) / 2; if (vfill(tk, mid, ind).length <= n.k) hi = mid; else lo = mid; }
      cols = vfill(tk, hi + 0.001, ind);
    }
    n.cols = cols; n.ind = cols.length > 1 ? ind : 0;
    n.colLen = cols.map(function (c) { return c.reduce(function (s, t) { return s + t.a; }, 0); });
    n.bw = cols.length * VT.WC + (cols.length - 1) * VT.CG;
    var bottoms = n.colLen.map(function (len, c) { return (c ? n.ind : 0) + len; });
    n.textH = Math.max.apply(null, bottoms);
    n.ntH = n.ntTk ? n.ntTk.reduce(function (s, t) { return s + t.a; }, 0) : 0;
    n.h = n.ntTk ? Math.max(n.textH, bottoms[bottoms.length - 1] + 0.8 + n.ntH) : n.textH;
  }
  // 藏版（干支／章節）：樹狀重排；韓版：原書版面（長標題下方有空間才合回一欄）。
  // 藏版（干支／章節）：樹狀重排；韓版：原書版面（長標題下方有空間才合回一欄）。
  // 規則：有下層的科，正文超過 5 字換行（平均分，前多後少）；沒有下層的科，正文超過 14 字才換行。
  // 以整頁放不放得下為準：先全部一欄寫完（極長的才分），放不下時才挑最高那條支線上最長的科換行
  var VCFG = [[10], [8], [6.5], [5.5], [4.5]];
  function relayoutSheet(pg) {
    if (!pg || pg.dataset.rl) return;
    if (EDITION !== "zang") { relayoutMerge(pg); if (pg.dataset.rl) smallParensHK(pg); return; }
    pg.dataset.rl = "1";
    try { for (var i = 0; i < VCFG.length; i++) { VT.LEVEL = VCFG[i][0]; VT.STUB = Math.min(4.6, VCFG[i][0] * 0.46); VT.BAND = Math.max(8, VCFG[i][0]); if (layoutTreePage(pg)) { pg.dataset.cfg = i; break; } } }
    catch (err) { if (window.console) console.warn("chart layout", err); }
  }
  function smallParensHK(pg) {
    var svg = pg.querySelector("svg.ln"), MM = 96 / 25.4; if (!svg) return;
    var L = [].slice.call(svg.querySelectorAll("line"));
    [].slice.call(pg.children).forEach(function (nd) {
      if (!nd.classList || !nd.classList.contains("nd") || nd.classList.contains("nt") || nd.style.display === "none" || nd.querySelector(".pn")) return;
      var w = document.createTreeWalker(nd, NodeFilter.SHOW_TEXT), t, last = null; while ((t = w.nextNode())) if (t.data.trim()) last = t;
      if (!last) return;
      var m = /[(（][^()（）]*[)）]\s*$/.exec(last.data); if (!m) return;
      if (m.index === 0 && nd.textContent.trim() === last.data.trim()) return;
      var top = parseFloat(nd.style.top), l = parseFloat(nd.style.left), wd = parseFloat(nd.style.width), h0 = nd.offsetHeight / MM;
      var sp = document.createElement("span"); sp.className = "pn"; sp.textContent = last.data.slice(m.index);
      last.data = last.data.slice(0, m.index); last.parentNode.insertBefore(sp, last.nextSibling);
      var dy = h0 - nd.offsetHeight / MM; if (!(dy > 0.2)) return;
      var b0 = top + h0, id = nd.dataset.id;
      [].slice.call(pg.querySelectorAll('.nd.nt[data-go="' + id + '"]')).forEach(function (n) { var nt = parseFloat(n.style.top), nl = parseFloat(n.style.left); if (nt >= b0 - 1 && nt <= b0 + 4 && nl > l - 2 && nl < l + wd + 2) n.style.top = (nt - dy).toFixed(2) + "mm"; });
      L.forEach(function (ln) { var x1 = +ln.getAttribute("x1"), x2 = +ln.getAttribute("x2"), y1 = +ln.getAttribute("y1"), y2 = +ln.getAttribute("y2"); if (Math.abs(x1 - x2) > 0.02 || x1 < l || x1 > l + wd) return; var ya = Math.min(y1, y2); if (ya < b0 - 1 || ya > b0 + 12) return; if (y1 < y2) ln.setAttribute("y1", (y1 - dy).toFixed(2)); else ln.setAttribute("y2", (y2 - dy).toFixed(2)); });
    });
  }
  function layoutTreePage(pg) {
    var svg = pg.querySelector("svg.ln"); if (!svg) return false;
    var els = [].slice.call(pg.children).filter(function (e) { return e.classList && e.classList.contains("nd"); });
    if (!els.length) return false;
    // 1) instances (a 科 may be drawn twice: inside its parent's tree, and as ◎ root of its own sub-table)
    var inst = [], last = null;
    els.forEach(function (e) {
      if (e.classList.contains("nt")) { var g = +e.dataset.go; for (var q = inst.length - 1; q >= 0; q--) if (inst[q].id === g) { inst[q].nt = e.textContent; break; } return; }
      var id = +e.dataset.id, l = parseFloat(e.style.left), t = parseFloat(e.style.top);
      if (last && last.id === id && l < last.l - 1 && e.previousElementSibling === last.lastEl) { last.l = l; last.text += e.textContent; last.lastEl = e; return; }
      last = { id: id, rt: e.classList.contains("rt"), text: e.textContent, l: l, r: l + parseFloat(e.style.width), t: t, nt: null, kids: [], lastEl: e };
      inst.push(last);
    });
    // 2) tree
    var byId = {};
    inst.forEach(function (n) { (byId[n.id] = byId[n.id] || []).push(n); });
    inst.forEach(function (n) {
      if (n.rt || n.id < 0 || !N[n.id]) return;
      var cands = byId[N[n.id][4]]; if (!cands) return;
      // 同一科在本頁出現多次（如「別解」與「別解（續）」）：接到上方最近、水平最近的那一個
      var p = null, best = Infinity, ncx = (n.l + n.r) / 2;
      cands.forEach(function (c) { if (c.t >= n.t) return; var v = (n.t - c.t) + 0.5 * Math.abs((c.l + c.r) / 2 - ncx); if (v < best) { best = v; p = c; } });
      if (!p) return;
      n.parent = p; p.kids.push(n);
    });
    inst.forEach(function (n) { n.kids.sort(function (a, b) { return a.id - b.id; }); });
    var roots = inst.filter(function (n) { return !n.parent; });
    // 3) text tokens
    var ZJM = LABEL === "zj" && ZJ;
    inst.forEach(function (n) {
      if (n.id < 0 || !N[n.id]) { n.tk = vtoks(verticalForms(n.text), VT.FULL, VT.HALF); n.indA = 0; n.labN = 0; }
      else {
        var lead = n.rt ? [{ c: "◎", h: "◎", a: VT.FULL }] : [];
        var lt = vtoks(vlabel(n.id), VT.FULL, VT.HALF).map(function (x) { return { c: x.c, h: '<span class="lb">' + x.h + "</span>", a: x.a }; });
        // 章節科標：標號後空一個字再接標題
        if (ZJM && lt.length) lt.push({ c: " ", h: '<span class="vgap"></span>', a: VT.GAP });
        var ttl = verticalForms(N[n.id][0]), pm = /\([^()]*\)$/.exec(ttl), pnTk = [];
        // 標題後面的括號小注：字級、顏色與「(分N)」相同
        if (pm && pm.index > 0) { pnTk = vtoks(ttl.slice(pm.index), VT.NFULL, VT.NHALF).map(function (x) { return { c: x.c, h: '<span class="pn">' + x.h + "</span>", a: x.a, pn: 1 }; }); ttl = ttl.slice(0, pm.index); }
        n.tk = lead.concat(lt, vtoks(ttl, VT.FULL, VT.HALF), pnTk);
        n.indA = lead.concat(lt).reduce(function (s, t) { return s + t.a; }, 0); n.labN = lead.length + lt.length;
      }
      n.ntTk = n.nt ? vtoks(n.nt, VT.NFULL, VT.NHALF) : null;
      n.adv = n.tk.slice(n.labN).reduce(function (s, t) { return s + (t.pn ? 0 : t.a); }, 0) / VT.FULL - 0.01;
      // 有下層、正文超過 10 字的科，預設分兩欄（較美觀）；其餘先一欄寫完，視整頁空間再換
      n.k = n.kids.length && n.adv > 10 ? Math.max(2, Math.ceil(n.adv / 9)) : n.adv <= VT.LONG ? 1 : Math.ceil(n.adv / 14);
      vmeasure(n);
    });
    // 4) 垂直：每一科的下層緊接在它自己下面（各分支依自身高度，不強求同層對齊）
    function hgt(n) { n.kt = n.h + VT.LEVEL; n.H = n.kids.length ? n.kt + Math.max.apply(null, n.kids.map(hgt)) : n.h; return n.H; }
    roots.sort(function (a, b) { return a.t - b.t || b.r - a.r; });
    var bands = [];
    roots.forEach(function (r) { var b = bands.filter(function (x) { return Math.abs(x.t - r.t) < 3; })[0]; if (!b) { b = { t: r.t, trees: [] }; bands.push(b); } b.trees.push(r); });
    bands.forEach(function (b) { b.trees.sort(function (a, c) { return c.r - a.r; }); b.h = Math.max.apply(null, b.trees.map(hgt)); });
    function total() { bands.forEach(function (b) { b.h = Math.max.apply(null, b.trees.map(hgt)); }); return bands.reduce(function (s, b) { return s + b.h; }, 0) + (bands.length - 1) * VT.BAND; }
    function canWrap(n) { var body = n.tk.slice(n.labN).filter(function (t) { return !t.pn; }).length; return body >= 3 * (n.k + 1) || (n.k === 1 && body >= 4); }
    var guard = 0;
    while (total() > VT.BOTTOM - VT.TOP + 0.01 && guard++ < 300) {
      var bb = bands.reduce(function (a, b) { return b.h > a.h ? b : a; }), best = null;
      bb.trees.forEach(function (r) {
        if (r.H < bb.h - 0.01) return;
        // 最高的那條支線（可能不只一條）上，挑字最長、還能換行的科
        (function walk(n, rest) {
          var onPath = Math.abs(n.H - rest) < 0.01;
          if (!onPath) return;
          if (canWrap(n) && (!best || n.h > best.h)) best = n;
          n.kids.forEach(function (c) { walk(c, rest - n.kt); });
        })(r, r.H);
      });
      if (!best) return false;
      best.k++; vmeasure(best);
    }
    if (total() > VT.BOTTOM - VT.TOP + 0.01) return false;
    // 5) 水平：以實際字塊（含連接線）的上下範圍判斷碰撞
    function own(n) { return { x0: -0.5 * VT.WC - (n.cols.length - 1) * vpitch(), x1: 0.5 * VT.WC, y0: 0, y1: n.h }; }
    function shift(bx, dx, dy) { return bx.map(function (b) { return { x0: b.x0 + dx, x1: b.x1 + dx, y0: b.y0 + dy, y1: b.y1 + dy }; }); }
    function need(A, B, gap) { var o = Infinity; A.forEach(function (a) { B.forEach(function (b) { if (a.y0 < b.y1 + 1.2 && b.y0 < a.y1 + 1.2) o = Math.min(o, a.x0 - b.x1 - gap); }); }); return o; }
    function place(n, gap, uni) {
      if (!n.kids.length) { n.box = [own(n)]; return; }
      n.kids.forEach(function (c) { place(c, gap, uni); });
      var offs = [0], acc = shift(n.kids[0].box, 0, 0);
      for (var i = 1; i < n.kids.length; i++) { var o = need(acc, n.kids[i].box, gap); if (!isFinite(o)) o = -gap; offs.push(o); acc = acc.concat(shift(n.kids[i].box, o, 0)); }
      if (offs.length > 2 && uni) { var P = 0; for (var j = 1; j < offs.length; j++) P = Math.max(P, offs[j - 1] - offs[j]); var span0 = offs[0] - offs[offs.length - 1]; if (P * (offs.length - 1) <= span0 * 1.3 + 0.01) offs = offs.map(function (_, k) { return -k * P; }); }
      // 上層置於子科橫線正中；奇數子科且中間那科就在附近時，對齊中間那科成一直線
      var m = offs.length, mp = (offs[0] + offs[m - 1]) / 2, pc = m % 2 && Math.abs(offs[(m - 1) / 2] - mp) < 2.6 ? offs[(m - 1) / 2] : mp;
      n.offs = offs.map(function (o) { return o - pc; });
      var bx = [own(n), { x0: -0.4, x1: 0.4, y0: n.h, y1: n.kt }, { x0: Math.min(0, n.offs[m - 1]) - 0.4, x1: Math.max(0, n.offs[0]) + 0.4, y0: n.kt - VT.STUB, y1: n.kt }];
      n.kids.forEach(function (c, i) { bx = bx.concat(shift(c.box, n.offs[i], n.kt)); });
      n.box = bx;
    }
    function setX(n, cx) { n.cx = cx; (n.kids || []).forEach(function (c, i) { setX(c, cx + n.offs[i]); }); }
    function ext(r) { var lo = Infinity, hi = -Infinity; r.box.forEach(function (b) { lo = Math.min(lo, b.x0); hi = Math.max(hi, b.x1); }); return [lo, hi]; }
    function fitBand(b, gap, uni) {
      var x = VT.RIGHT, E = [];
      b.trees.forEach(function (r) { place(r, gap, uni); var e = ext(r); E.push([e[0], e[1], x - e[1]]); x = x - e[1] + e[0] - Math.max(6, gap * 1.6); });
      if (uni && E.length > 2) { var P = 0; for (var i = 1; i < E.length; i++) P = Math.max(P, E[i - 1][2] - E[i][2]); E.forEach(function (e, i) { e[2] = E[0][2] - i * P; }); }
      var minX = Infinity, maxX = -Infinity;
      b.trees.forEach(function (r, i) { setX(r, E[i][2]); minX = Math.min(minX, E[i][2] + E[i][0]); maxX = Math.max(maxX, E[i][2] + E[i][1]); });
      b.shift = (VT.LEFT + VT.RIGHT) / 2 - (minX + maxX) / 2;
      return maxX - minX <= VT.RIGHT - VT.LEFT + 0.01;
    }
    // 紙面還很空時間距放寬；先試兄弟等距，放不下再改緊排
    var ok = true;
    bands.forEach(function (b) {
      var tries = [[7, 1], [5.6, 1], [4.4, 1], [3.2, 1], [2.6, 1], [2.2, 1], [3.2, 0], [2.2, 0], [1.4, 0]];
      for (var i = 0; i < tries.length; i++) if (fitBand(b, tries[i][0], tries[i][1])) return;
      ok = false;
    });
    if (!ok) return false;
    // 6) write
    var html = [], lines = [], y = VT.TOP;
    function f(v) { return v.toFixed(2); }
    function L(x1, y1, x2, y2) { lines.push('<line x1="' + f(x1) + '" y1="' + f(y1) + '" x2="' + f(x2) + '" y2="' + f(y2) + '"/>'); }
    bands.forEach(function (b) {
      b.trees.forEach(function (r) {
        (function draw(n, top) {
          var cx = n.cx + b.shift, right = cx + VT.WC / 2, foot = top + n.h + 0.4;
          n.cols.forEach(function (col, c) {
            html.push('<div class="nd tt' + (n.rt ? " rt" : "") + '" data-id="' + n.id + '" style="left:' + f(right - VT.WC - c * vpitch()) + "mm;top:" + f(top + (c ? n.ind : 0)) + "mm;width:" + f(VT.WC) + 'mm">' + col.map(function (t) { return t.h; }).join("") + "</div>");
          });
          if (n.ntTk) { var lc = n.cols.length - 1; html.push('<div class="nd nt" data-go="' + n.id + '" style="left:' + f(right - VT.WC - lc * vpitch() + (VT.WC - 3.34) / 2) + "mm;top:" + f(top + (lc ? n.ind : 0) + n.colLen[lc] + 0.8) + 'mm;width:3.34mm">' + n.ntTk.map(function (t) { return t.h; }).join("") + "</div>"); }
          if (n.kids.length) {
            var ct = top + n.kt, bar = ct - VT.STUB, xs = n.kids.map(function (c) { return c.cx + b.shift; });
            if (n.kids.length === 1 && Math.abs(xs[0] - cx) < 0.05) L(cx, foot, cx, ct - 1);
            else {
              L(cx, foot, cx, bar);
              L(Math.max.apply(null, xs.concat([cx])), bar, Math.min.apply(null, xs.concat([cx])), bar);
              xs.forEach(function (x) { L(x, bar, x, ct - 1); });
            }
            n.kids.forEach(function (c) { draw(c, ct); });
          }
        })(r, y);
      });
      y += b.h + VT.BAND;
    });
    els.forEach(function (e) { e.remove(); });
    svg.innerHTML = lines.join("");
    var anchor = pg.querySelector(".head") || pg.lastChild;
    anchor.insertAdjacentHTML("beforebegin", html.join(""));
    pg.dataset.vt = "1";
    return true;
  }
  // 長標題被拆成好幾欄：下方有空間就合回一欄；仍需多欄時，連接線改接在第一欄正中。
  function relayoutMerge(pg) {
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
