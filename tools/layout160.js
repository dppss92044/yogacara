  // 直書科判：每頁依樹狀結構重新排版。
  // 同層對齊、兄弟等距、奇數子科中間那科與上層同一直線、連接線一律在字塊正中、括號不斷在欄尾。
  function vlabel(i) { return EDITION === "zang" && LABEL === "zj" && ZJ ? (ZJ[i] || "") : labG(i); }
  var VT = { FULL: 4.93, HALF: 2.73, NFULL: 3.25, NHALF: 1.8, WC: 5.19, TOP: 16, BOTTOM: 280, LEFT: 12, RIGHT: 184.6, LEVEL: 8, STUB: 4.95, BAND: 10 };
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
      if (col.length && top + y + tk[i].a > Hc + 0.01) {
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
    n.bw = cols.length * VT.WC;
    var bottoms = n.colLen.map(function (len, c) { return (c ? n.ind : 0) + len; });
    n.textH = Math.max.apply(null, bottoms);
    n.ntH = n.ntTk ? n.ntTk.reduce(function (s, t) { return s + t.a; }, 0) : 0;
    n.h = n.ntTk ? Math.max(n.textH, bottoms[bottoms.length - 1] + 0.3 + n.ntH) : n.textH;
  }
  function relayoutSheet(pg) {
    if (!pg || pg.dataset.rl) return;
    pg.dataset.rl = "1";
    // 放不下時把層距收緊再排一次
    var tries = [[8, 10], [6.5, 8], [5, 6]];
    try { for (var i = 0; i < tries.length; i++) { VT.LEVEL = tries[i][0]; VT.BAND = tries[i][1]; VT.STUB = tries[i][0] * 0.62; if (layoutTreePage(pg)) break; } }
    catch (err) { if (window.console) console.warn("chart layout", err); }
    VT.LEVEL = 8; VT.BAND = 10; VT.STUB = 4.95;
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
        n.tk = lead.concat(lt, vtoks(verticalForms(N[n.id][0]), VT.FULL, VT.HALF));
        n.indA = lead.concat(lt).reduce(function (s, t) { return s + t.a; }, 0); n.labN = lead.length + lt.length;
      }
      n.ntTk = n.nt ? vtoks(n.nt, VT.NFULL, VT.NHALF) : null;
      n.k = 1; vmeasure(n);
    });
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
      var lo0 = -(n.cols.length - 0.5) * VT.WC, hi0 = 0.5 * VT.WC;
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
      if (offs.length > 2 && uni.indexOf(n) >= 0) { var P = 0; for (var j = 1; j < offs.length; j++) P = Math.max(P, offs[j - 1] - offs[j]); offs = offs.map(function (_, k) { return -k * P; }); }
      var m = offs.length, pc = m % 2 ? offs[(m - 1) / 2] : (offs[0] + offs[m - 1]) / 2;
      n.offs = offs.map(function (o) { return o - pc; });
      n.cont = [[lo0, hi0]].concat(build(n.offs));
    }
    function setX(n, cx) { n.cx = cx; n.kids.forEach(function (c, i) { setX(c, cx + n.offs[i]); }); }
    function fitBand(b, gap, uni, ub) {
      var x = VT.RIGHT, ext = [];
      b.trees.forEach(function (r) {
        place(r, gap, uni);
        var lo = Infinity, hi = -Infinity; r.cont.forEach(function (lr) { lo = Math.min(lo, lr[0]); hi = Math.max(hi, lr[1]); });
        ext.push([lo, hi, x - hi]); x = x - hi + lo - 6;
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
      var gs = [3.2, 2.6, 2.2];
      for (var i = 0; i < gs.length; i++) if (fitBand(b, gs[i], groups, true)) return;
      var best = null;
      [3.2, 2.6, 2.2, 1.4].forEach(function (g) {
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
          var cx = n.cx + b.shift, top = rowTop[n.d], right = cx + VT.WC / 2, foot = top + (n.cols.length > 1 ? n.colLen[0] : n.h) + 0.4;
          n.cols.forEach(function (col, c) {
            html.push('<div class="nd tt' + (n.rt ? " rt" : "") + '" data-id="' + n.id + '" style="left:' + f(right - (c + 1) * VT.WC) + "mm;top:" + f(top + (c ? n.ind : 0)) + "mm;width:" + f(VT.WC) + 'mm">' + col.map(function (t) { return t.h; }).join("") + "</div>");
          });
          if (n.ntTk) { var lc = n.cols.length - 1; html.push('<div class="nd nt" data-go="' + n.id + '" style="left:' + f(right - (lc + 1) * VT.WC + (VT.WC - 3.34) / 2) + "mm;top:" + f(top + (lc ? n.ind : 0) + n.colLen[lc] + 0.3) + 'mm;width:3.34mm">' + n.ntTk.map(function (t) { return t.h; }).join("") + "</div>"); }
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
