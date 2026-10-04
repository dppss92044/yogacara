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
