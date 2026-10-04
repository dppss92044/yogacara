  // 直書科判（藏版）：每頁依樹狀結構重新排版（v1.65）。
  // 同層對齊、兄弟等距、奇數子科中間那科與上層同一直線、連接線一律在字塊正中、括號不斷在欄尾。
  function vlabel(i) { return EDITION === "zang" && LABEL === "zj" && ZJ ? (ZJ[i] || "") : labG(i); }
  var VT = { FULL: 4.93, HALF: 2.73, NFULL: 3.25, NHALF: 1.8, WC: 5.19, TOP: 16, BOTTOM: 282, LEFT: 12, RIGHT: 184.6, LEVEL: 10, STUB: 4.6, BAND: 10, MAXC: 12, GREEDY: false, CG: 2.0 };
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
  var VCFG = [[12, 10], [12, 8], [12, 6.5], [12, 6.5, 1], [12, 5.5, 1], [9, 5.5, 1], [5, 5, 1]];
  function relayoutSheet(pg) {
    if (!pg || pg.dataset.rl) return;
    if (EDITION !== "zang") { relayoutMerge(pg); if (pg.dataset.rl) smallParensHK(pg); return; }
    pg.dataset.rl = "1";
    try { outer: for (var i = 0; i < VCFG.length; i++) for (var gw = 1; gw >= 0; gw--) { VT.GW = gw; VT.MAXC = VCFG[i][0]; VT.LEVEL = VCFG[i][1]; VT.STUB = VCFG[i][1] * 0.46; VT.BAND = Math.max(8, VCFG[i][1]); VT.GREEDY = !!VCFG[i][2]; if (layoutTreePage(pg)) { pg.dataset.cfg = i + (gw ? "" : "n"); break outer; } } }
    catch (err) { if (window.console) console.warn("chart layout", err); }
  }
  // 韓版：標題後的括號小注改成「(分N)」的字級與顏色，下方的 (分N) 與連接線跟著上移，不留空格
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
    inst.forEach(function (n) {
      if (n.id < 0 || !N[n.id]) { n.tk = vtoks(verticalForms(n.text), VT.FULL, VT.HALF); n.indA = 0; n.labN = 0; }
      else {
        var lead = n.rt ? [{ c: "◎", h: "◎", a: VT.FULL }] : [];
        var lt = vtoks(vlabel(n.id), VT.FULL, VT.HALF).map(function (x) { return { c: x.c, h: '<span class="lb">' + x.h + "</span>", a: x.a }; });
        var ttl = verticalForms(N[n.id][0]), pm = /\([^()]*\)$/.exec(ttl), pnTk = [];
        // 標題後面的括號小注：字級、顏色與「(分N)」相同
        if (pm && pm.index > 0) { pnTk = vtoks(ttl.slice(pm.index), VT.NFULL, VT.NHALF).map(function (x) { return { c: x.c, h: '<span class="pn">' + x.h + "</span>", a: x.a, pn: 1 }; }); ttl = ttl.slice(0, pm.index); }
        n.tk = lead.concat(lt, vtoks(ttl, VT.FULL, VT.HALF), pnTk);
        n.indA = lead.concat(lt).reduce(function (s, t) { return s + t.a; }, 0); n.labN = lead.length + lt.length;
      }
      n.ntTk = n.nt ? vtoks(n.nt, VT.NFULL, VT.NHALF) : null;
      n.adv = n.tk.slice(n.labN).reduce(function (s, t) { return s + (t.pn ? 0 : t.a); }, 0) / VT.FULL - 0.01;
      n.k = n.adv <= VT.MAXC ? 1 : Math.ceil(n.adv / VT.MAXC);
    });
    // 同一排兄弟格式一致：有一科超過 MAXC 字要分欄時，同排較長（≥0.7×MAXC）的也一起分成兩半；
    // 整排放不下（或 VT.GW 關閉）時，同排都不分欄（除非超過 18 字）
    function kOf(n) { return Math.max(2, Math.ceil(n.adv / VT.MAXC)); }
    function decideGroup(g) {
      if (g.length < 2) return;
      if (!g.some(function (n) { return n.adv > VT.MAXC; })) return;
      var cand = g.filter(function (n) { return n.adv > VT.MAXC * 0.7; }), w = 0;
      g.forEach(function (n) { var k = cand.indexOf(n) >= 0 ? kOf(n) : 1; w += k * VT.WC + (k - 1) * VT.CG + 2.2; });
      if (VT.GW && w <= VT.RIGHT - VT.LEFT) cand.forEach(function (n) { n.k = kOf(n); });
      else g.forEach(function (n) { n.k = n.adv > 18 ? Math.ceil(n.adv / VT.MAXC) : 1; });
    }
    inst.forEach(function (p) { decideGroup(p.kids); });
    // 同一橫排的幾張小表，表頭也一致
    var rb = [];
    roots.forEach(function (r) { var b = rb.filter(function (x) { return Math.abs(x.t - r.t) < 3; })[0]; if (!b) { b = { t: r.t, g: [] }; rb.push(b); } b.g.push(r); });
    rb.forEach(function (b) { decideGroup(b.g); });
    inst.forEach(vmeasure);
    // 4) bands: sub-tables stacked from top to bottom, side by side within a band
    roots.sort(function (a, b) { return a.t - b.t || b.r - a.r; });
    var bands = [];
    roots.forEach(function (r) { var b = bands.filter(function (x) { return Math.abs(x.t - r.t) < 3; })[0]; if (!b) { b = { t: r.t, trees: [] }; bands.push(b); } b.trees.push(r); });
    bands.forEach(function (b) { b.trees.sort(function (a, c) { return c.r - a.r; }); });
    function levels(r) { var lv = []; (function walk(n, d) { n.d = d; lv[d] = Math.max(lv[d] || 0, n.h); n.kids.forEach(function (c) { walk(c, d + 1); }); })(r, 0); r.lv = lv; return lv.reduce(function (s, h) { return s + h; }, 0) + (lv.length - 1) * VT.LEVEL; }
    function total() { var s = 0; bands.forEach(function (b) { b.h = 0; b.trees.forEach(function (r) { r.th = levels(r); b.h = Math.max(b.h, r.th); }); s += b.h; }); return s + (bands.length - 1) * VT.BAND; }
    function nodesAt(r, d) { var out = []; (function walk(n) { if (n.d === d) out.push(n); else n.kids.forEach(walk); })(r); return out; }
    // 高度不夠時才分欄：每一步挑「每多一欄能省下最多高度」的那一層來分，避免整排過度換欄
    var avail = VT.BOTTOM - VT.TOP, guard = 0;
    function trialH(n, k) { var o = Object.create(n); o.k = k; vmeasure(o); return o.h; }
    // 每欄至少要有 minC 個正文字才分欄（先 3 字，不夠再放寬到 2 字）
    var minC = 3;
    function canWrap(n) {
      if (!(minC > 0 ? n.tk.length - n.labN >= minC * (n.k + 1) : n.tk.length >= 2 * (n.k + 1))) return false;
      // 不留單字孤欄
      var o = Object.create(n); o.k = n.k + 1; vmeasure(o);
      return minC === 0 || o.cols[o.cols.length - 1].length >= 2;
    }
    if (!VT.GREEDY && total() > avail + 0.01) return false;
    while (total() > avail && guard++ < 400) {
      var best = null;
      bands.forEach(function (b) {
        var top = b.trees.filter(function (r) { return r.th >= b.h - 0.01; });
        if (top.length !== 1) return;
        var r = top[0], second = 0; b.trees.forEach(function (x) { if (x !== r) second = Math.max(second, x.th); });
        r.lv.forEach(function (H, d) {
          var at = nodesAt(r, d), tall = at.filter(function (n) { return n.h >= H - 0.01; });
          if (!tall.every(canWrap)) return;
          var nh = 0; at.forEach(function (n) { nh = Math.max(nh, tall.indexOf(n) >= 0 ? trialH(n, n.k + 1) : n.h); });
          var gain = Math.min(H - nh, r.th - second); if (gain < 0.3) return;
          var score = gain / tall.reduce(function (t, n) { return t + n.k; }, 0);
          if (!best || score > best.score) best = { score: score, tall: tall };
        });
      });
      if (!best) {
        // 一個橫排有好幾棵一樣高的樹：一起分欄
        var any = false;
        bands.forEach(function (b) { b.trees.forEach(function (r) { if (r.th < b.h - 0.01) return; var d = r.lv.indexOf(Math.max.apply(null, r.lv)); nodesAt(r, d).forEach(function (n) { if (n.h >= r.lv[d] - 0.01 && canWrap(n)) { n.k++; vmeasure(n); any = true; } }); }); });
        if (!any) { if (minC > 0) { minC--; continue; } break; } continue;
      }
      best.tall.forEach(function (n) { n.k++; vmeasure(n); });
    }
    // 5) horizontal layout with depth contours.
    // 每科的定位點 = 第一欄（標號所在欄）的中心；多出來的欄往左排，連接線一律接在第一欄正中。
    function place(n, gap, uni) {
      var lo0 = -(0.5 * VT.WC + (n.cols.length - 1) * vpitch()), hi0 = 0.5 * VT.WC;
      if (!n.kids.length) { n.cont = [[lo0, hi0]]; return; }
      n.kids.forEach(function (c) { place(c, gap, uni); });
      function build(offs) {
        var u = [];
        n.kids.forEach(function (c, i) { if (i >= offs.length) return; c.cont.forEach(function (lr, d) { var a = lr[0] + offs[i], b = lr[1] + offs[i]; if (!u[d]) u[d] = [a, b]; else { u[d][0] = Math.min(u[d][0], a); u[d][1] = Math.max(u[d][1], b); } }); });
        return u;
      }
      var offs = [0];
      for (var i = 1; i < n.kids.length; i++) {
        var u = build(offs), c = n.kids[i], o = Infinity;
        for (var d = 0; d < Math.min(u.length, c.cont.length); d++) o = Math.min(o, u[d][0] - c.cont[d][1] - gap);
        offs.push(o);
      }
      if (offs.length > 2 && uni.indexOf(n) >= 0) { var P = 0; for (var j = 1; j < offs.length; j++) P = Math.max(P, offs[j - 1] - offs[j]); var span0 = offs[0] - offs[offs.length - 1]; if (P * (offs.length - 1) <= span0 * 1.3 + 0.01) offs = offs.map(function (_, k) { return -k * P; }); }
      // 上層置於子科橫線正中（原書做法）；奇數子科且中間那科就在附近時，對齊中間那科成一直線
      var m = offs.length, mp = (offs[0] + offs[m - 1]) / 2, pc = m % 2 && Math.abs(offs[(m - 1) / 2] - mp) < 2.6 ? offs[(m - 1) / 2] : mp;
      n.offs = offs.map(function (o) { return o - pc; });
      n.cont = [[lo0, hi0]].concat(build(n.offs));
    }
    function setX(n, cx) { n.cx = cx; n.kids.forEach(function (c, i) { setX(c, cx + n.offs[i]); }); }
    function fitBand(b, gap, uni, ub) {
      var x = VT.RIGHT, ext = [];
      b.trees.forEach(function (r) {
        place(r, gap, uni);
        var lo = Infinity, hi = -Infinity; r.cont.forEach(function (lr) { lo = Math.min(lo, lr[0]); hi = Math.max(hi, lr[1]); });
        ext.push([lo, hi, x - hi]); x = x - hi + lo - Math.max(6, gap * 1.6);
      });
      // 同一橫排的幾張小表：彼此等距
      if (ub && ext.length > 2) { var P = 0; for (var i = 1; i < ext.length; i++) P = Math.max(P, ext[i - 1][2] - ext[i][2]); ext.forEach(function (e, i) { e[2] = ext[0][2] - i * P; }); }
      var minX = Infinity, maxX = -Infinity;
      b.trees.forEach(function (r, i) { setX(r, ext[i][2]); minX = Math.min(minX, ext[i][2] + ext[i][0]); maxX = Math.max(maxX, ext[i][2] + ext[i][1]); });
      b.shift = (VT.LEFT + VT.RIGHT) / 2 - (minX + maxX) / 2;
      return maxX - minX <= VT.RIGHT - VT.LEFT + 0.01;
    }
    // 兄弟等距（每個橫排分開決定）：先試全部等距（間距由寬到窄）；
    // 放不下時，各種間距都試，由上層往下逐組加入等距，取等距組數最多者（同數取較寬間距）
    var ok = true;
    bands.forEach(function (b) {
      var groups = [];
      b.trees.forEach(function (r) { (function walk(n) { if (n.kids.length > 2) groups.push(n); n.kids.forEach(walk); })(r); });
      groups.sort(function (p, q) { return p.d - q.d || p.id - q.id; });
      // 紙面還很空時，間距放寬
      var gs = [7, 5.6, 4.4, 3.2, 2.6, 2.2];
      for (var i = 0; i < gs.length; i++) if (fitBand(b, gs[i], groups, true)) return;
      var best = null;
      [5.6, 4.4, 3.2, 2.6, 2.2, 1.4].forEach(function (g) {
        var u = [];
        if (!fitBand(b, g, u, false)) return;
        groups.forEach(function (x) { u.push(x); if (!fitBand(b, g, u, false)) u.pop(); });
        var ub = fitBand(b, g, u, true);
        var sc = u.length + (ub ? 1 : 0);
        if (!best || sc > best.sc) best = { sc: sc, g: g, u: u, ub: ub };
      });
      if (!best) { ok = false; return; }
      fitBand(b, best.g, best.u, best.ub);
    });
    if (!ok) return false;
    // 6) write
    var html = [], lines = [], y = VT.TOP;
    function f(v) { return v.toFixed(2); }
    function L(x1, y1, x2, y2) { lines.push('<line x1="' + f(x1) + '" y1="' + f(y1) + '" x2="' + f(x2) + '" y2="' + f(y2) + '"/>'); }
    bands.forEach(function (b) {
      b.trees.forEach(function (r) {
        var rowTop = [y]; for (var d = 1; d < r.lv.length; d++) rowTop[d] = rowTop[d - 1] + r.lv[d - 1] + VT.LEVEL;
        (function draw(n) {
          var cx = n.cx + b.shift, top = rowTop[n.d], right = cx + VT.WC / 2, foot = top + n.h + 0.4;
          n.cols.forEach(function (col, c) {
            html.push('<div class="nd tt' + (n.rt ? " rt" : "") + '" data-id="' + n.id + '" style="left:' + f(right - VT.WC - c * vpitch()) + "mm;top:" + f(top + (c ? n.ind : 0)) + "mm;width:" + f(VT.WC) + 'mm">' + col.map(function (t) { return t.h; }).join("") + "</div>");
          });
          if (n.ntTk) { var lc = n.cols.length - 1; html.push('<div class="nd nt" data-go="' + n.id + '" style="left:' + f(right - VT.WC - lc * vpitch() + (VT.WC - 3.34) / 2) + "mm;top:" + f(top + (lc ? n.ind : 0) + n.colLen[lc] + 0.8) + 'mm;width:3.34mm">' + n.ntTk.map(function (t) { return t.h; }).join("") + "</div>"); }
          if (n.kids.length) {
            var ct = rowTop[n.d + 1], bar = ct - VT.STUB, xs = n.kids.map(function (c) { return c.cx + b.shift; });
            if (n.kids.length === 1 && Math.abs(xs[0] - cx) < 0.05) L(cx, foot, cx, ct - 1);
            else {
              L(cx, foot, cx, bar);
              L(Math.max.apply(null, xs.concat([cx])), bar, Math.min.apply(null, xs.concat([cx])), bar);
              xs.forEach(function (x) { L(x, bar, x, ct - 1); });
            }
            n.kids.forEach(draw);
          }
        })(r);
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
