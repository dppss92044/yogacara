/* 數珠導覽 — 視覺與互動程式。內容全部來自 data/content.js。 */
(function () {
  "use strict";
  var D = window.KM_DATA;
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var SRC = { book: "書籍目次", quote: "平實導師引文", nav: "本站導覽分類" };
  var tag = function (k) { return '<span class="tag ' + k + '">' + SRC[k] + "</span>"; };
  var ZCOLOR = { jian: "#2f5d62", xiu: "#8a5a14", xing: "#5b3f7a", guo: "#9a2b2b" };

  var chById = {}, termById = {};
  D.chapters.forEach(function (c) { chById[c.id] = c; });
  D.terms.forEach(function (t) { termById[t.id] = t; });
  var extraById = {};
  D.extras.forEach(function (x) { extraById[x.id] = x; });

  /* ---------- 珠位模型（唯一準則：每 26 顆普通數珠後接 1 顆隔珠） ---------- */
  var BEADS = []; // index 1..108
  for (var n = 1; n <= 108; n++) {
    var z = Math.floor((n - 1) / 27), r = ((n - 1) % 27) + 1;
    var isSp = r === 27;
    BEADS[n] = { n: n, z: z, pos: r, spacer: isSp, term: null };
  }
  D.zones.forEach(function (zn, zi) {
    zn.idx = zi; zn.first = zi * 27 + 1; zn.last = zi * 27 + 26; zn.spacerNo = zi * 27 + 27;
    zn.terms.forEach(function (tid, i) { BEADS[zn.first + i].term = tid; });
  });
  var ASSIGNED = BEADS.filter(function (b) { return b && b.term; }).map(function (b) { return b.n; });

  /* ---------- 幾何（等弧長橢圓） ---------- */
  var CX = 550, CY = 420, A = 360, B = 270, VW = 1100, VH = 760;
  var table = [], L = 0, prev = null;
  for (var i = 0; i <= 4000; i++) {
    var t = i / 4000 * Math.PI * 2, x = CX + A * Math.sin(t), y = CY - B * Math.cos(t);
    if (prev) L += Math.hypot(x - prev[0], y - prev[1]);
    table.push([t, L]); prev = [x, y];
  }
  function tAt(s) {
    s = ((s % L) + L) % L;
    var lo = 0, hi = table.length - 1;
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (table[m][1] <= s) lo = m; else hi = m; }
    var f = (s - table[lo][1]) / ((table[hi][1] - table[lo][1]) || 1);
    return table[lo][0] + f * (table[hi][0] - table[lo][0]);
  }
  function pt(s) {
    var t = tAt(s);
    var dx = A * Math.cos(t), dy = B * Math.sin(t);
    return { x: CX + A * Math.sin(t), y: CY - B * Math.cos(t), rot: Math.atan2(dy, dx) * 180 / Math.PI,
      nx: (A * Math.sin(t)) / (A * A), ny: (-B * Math.cos(t)) / (B * B) };
  }
  function beadPt(n) { return pt(n / 108 * L); }
  function outward(p, d) {
    var m = Math.hypot(p.nx, p.ny); return { x: p.x + p.nx / m * d, y: p.y + p.ny / m * d };
  }

  /* ---------- SVG ---------- */
  var svg = $("#mala");
  var HEADY = CY - B - 66;
  function defs() {
    return '<defs>' +
      '<radialGradient id="gHalo"><stop offset=".72" stop-color="#e8c98a" stop-opacity="0"/><stop offset=".88" stop-color="#e8c98a" stop-opacity=".28"/><stop offset="1" stop-color="#e8c98a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="gB" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#ecd5a6"/><stop offset=".55" stop-color="#b58a52"/><stop offset="1" stop-color="#6b4a2b"/></radialGradient>' +
      '<radialGradient id="gS" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#d1564c"/><stop offset=".5" stop-color="#7a1616"/><stop offset="1" stop-color="#2a0707"/></radialGradient>' +
      '<radialGradient id="gH" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#fff3c9"/><stop offset=".55" stop-color="#d1a64a"/><stop offset="1" stop-color="#7d5a1c"/></radialGradient>' +
      '<g id="bodhi"><circle r="10" fill="url(#gB)" stroke="#5b3d22" stroke-width=".8"/>' +
      '<g fill="#34210f"><circle cx="-4" cy="-3" r=".9"/><circle cx="2" cy="-5" r=".9"/><circle cx="5" cy="1" r=".9"/><circle cx="-1" cy="3" r=".9"/><circle cx="-5" cy="4" r=".8"/><circle cx="3" cy="6" r=".8"/><circle cx="0" cy="-1" r=".7"/><circle cx="-6" cy="-1" r=".7"/></g>' +
      '<ellipse cx="-9.2" cy="0" rx="1.3" ry="2.4" fill="#22140a"/><ellipse cx="9.2" cy="0" rx="1.3" ry="2.4" fill="#22140a"/>' +
      '<circle cx="-3.5" cy="-4.5" r="3" fill="#fff" opacity=".28"/></g>' +
      '<g id="spacer"><circle r="13" fill="url(#gS)" stroke="#1a0404" stroke-width=".9"/>' +
      '<ellipse cx="-12" cy="0" rx="1.5" ry="3" fill="#0d0202"/><ellipse cx="12" cy="0" rx="1.5" ry="3" fill="#0d0202"/>' +
      '<ellipse cx="-4" cy="-5.5" rx="4" ry="2.4" fill="#fff" opacity=".35" transform="rotate(-25 -4 -5.5)"/></g>' +
      '</defs>';
  }

  function labelG(act, text, x, y, anchor, tx, ty, lbl) {
    var line = "";
    if (tx != null) {
      var sx = anchor === "end" ? x + 6 : anchor === "start" ? x - 6 : x;
      line = '<path class="leader" d="M' + sx.toFixed(1) + ' ' + (y - 7).toFixed(1) + ' L' + tx.toFixed(1) + ' ' + ty.toFixed(1) + '"/><circle cx="' + tx.toFixed(1) + '" cy="' + ty.toFixed(1) + '" r="2.4" fill="#8a2b22" opacity=".7" pointer-events="none"/>';
    }
    return line + '<g class="lab" role="button" tabindex="0" data-act="' + act + '" aria-label="' + esc(lbl || text) + '"><text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="' + anchor + '">' + esc(text) + '</text></g>';
  }
  function anchorFor(x) { return x > CX + 40 ? "start" : x < CX - 40 ? "end" : "middle"; }

  function buildSvg() {
    var s = defs() + '<ellipse id="halo" cx="' + CX + '" cy="' + CY + '" rx="' + (A + 70) + '" ry="' + (B + 60) + '" fill="url(#gHalo)"/><g id="floatg">';
    // 串繩（連續橢圓，在所有珠子之下）
    s += '<g class="part" data-act="part:string" role="button" tabindex="0" aria-label="串繩"><ellipse cx="' + CX + '" cy="' + CY + '" rx="' + A + '" ry="' + B + '" fill="none" stroke="#6e4f31" stroke-width="2.6"/><ellipse class="hit" cx="' + CX + '" cy="' + CY + '" rx="' + A + '" ry="' + B + '"/></g>';
    // 佛頭珠之繩
    var top = beadPt(108);
    s += '<line x1="' + top.x.toFixed(1) + '" y1="' + (top.y - 12) + '" x2="' + top.x.toFixed(1) + '" y2="' + (HEADY + 18) + '" stroke="#6e4f31" stroke-width="2.6"/>';
    // 數珠
    for (var n = 1; n <= 108; n++) {
      var b = BEADS[n], p = beadPt(n);
      var sc = b.spacer ? 0.8 : 0.76;
      var cls = "bead" + (b.spacer ? " spacer" : "") + (b.term || b.spacer ? "" : " empty");
      var lab = b.spacer ? "隔珠" + "一二三四".charAt(b.z) + "，" + D.zones[b.z].spacerTitle + "，環上第" + n + "顆"
        : b.term ? D.zones[b.z].name + "區第" + b.pos + "珠，環上第" + n + "顆：" + termById[b.term].name
        : D.zones[b.z].name + "區第" + b.pos + "珠，環上第" + n + "顆，待配置";
      var act = b.spacer ? "spacer:" + b.z : b.term ? "bead:" + n : "";
      s += '<g class="' + cls + '" data-n="' + n + '"' + (act ? ' data-act="' + act + '" role="button" tabindex="0"' : ' aria-hidden="true"') + ' aria-label="' + esc(lab) + '"><title>' + esc(lab) + '</title>' +
        '<g transform="translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ') rotate(' + p.rot.toFixed(1) + ') scale(' + sc + ')"><use href="#' + (b.spacer ? "spacer" : "bodhi") + '"/></g>' +
        '<circle class="ring" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + (b.spacer ? 12.5 : 9.5) + '"/></g>';
    }
    // 佛頭珠
    var hy = HEADY, hx = top.x;
    s += '<g class="part" data-act="part:head" role="button" tabindex="0" aria-label="佛頭珠"><circle cx="' + hx + '" cy="' + hy + '" r="19" fill="url(#gH)" stroke="#6b4a14" stroke-width="1"/>' +
      '<ellipse cx="' + hx + '" cy="' + hy + '" rx="19" ry="5" fill="none" stroke="#7d5a1c" stroke-width="1.2" opacity=".7"/>' +
      '<ellipse cx="' + hx + '" cy="' + (hy + 18.5) + '" rx="3" ry="1.4" fill="#22140a"/>' +
      '<circle cx="' + (hx - 6) + '" cy="' + (hy - 7) + '" r="5" fill="#fff" opacity=".35"/>' +
      '<path d="M' + (hx - 7) + ' ' + (hy - 17) + ' L' + hx + ' ' + (hy - 27) + ' L' + (hx + 7) + ' ' + (hy - 17) + ' Z" fill="#c79a3a" stroke="#6b4a14" stroke-width=".8"/>' +
      '<circle class="ring" cx="' + hx + '" cy="' + hy + '" r="22"/></g>';
    // 飾穗（由佛頭珠向外、向上延伸）
    var ky = hy - 38;
    var th = "";
    for (var k = -5; k <= 5; k++) th += '<path d="M' + hx + ' ' + ky + ' Q' + (hx + k * 1.6) + ' ' + (ky - 15) + ' ' + (hx + k * 3.2) + ' ' + (ky - 34) + '" stroke="' + (k % 2 ? "#a32a22" : "#7a1616") + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
    s += '<g class="part" data-act="part:tassel" role="button" tabindex="0" aria-label="佛頭珠飾穗"><line x1="' + hx + '" y1="' + (hy - 27) + '" x2="' + hx + '" y2="' + ky + '" stroke="#6e4f31" stroke-width="2.4"/>' + th +
      '<circle cx="' + hx + '" cy="' + ky + '" r="5" fill="url(#gH)" stroke="#6b4a14" stroke-width=".8"/><rect x="' + (hx - 20) + '" y="' + (ky - 40) + '" width="40" height="46" fill="none" class="hit" style="stroke:none;fill:transparent"/>' +
      '<rect class="ring" x="' + (hx - 20) + '" y="' + (ky - 38) + '" width="40" height="42" rx="8"/></g>';

    // 文字入口與引線
    s += labelG("part:head", "佛頭珠", hx - 38, hy + 6, "end", hx - 20, hy);
    s += labelG("part:tassel", "佛頭珠飾穗", hx + 40, ky - 20, "start", hx + 14, ky - 22);
    // 隔珠標籤
    D.zones.forEach(function (zn, zi) {
      var p = beadPt(zn.spacerNo), nm = "隔珠" + "一二三四".charAt(zi) + "・" + zn.name;
      if (zi === 3) { s += labelG("spacer:3", nm, hx + 50, top.y - 8, "start", top.x + 10, top.y - 7, "隔珠四，果"); }
      else {
        var o = outward(p, 42); s += labelG("spacer:" + zi, nm, o.x, o.y + 7, anchorFor(o.x), p.x + (o.x > p.x ? 12 : o.x < p.x ? -12 : 0), p.y + (o.y > p.y ? 12 : o.y < p.y ? -12 : 0), nm);
      }
    });
    // 區段標籤
    D.zones.forEach(function (zn, zi) {
      var mid = zi * 27 + 13.5, p = pt(mid / 108 * L), o = outward(p, 44);
      var t = zn.name + " " + zn.first + "–" + zn.last;
      s += labelG("zone:" + zi, t, o.x, o.y + 7, anchorFor(o.x), p.x, p.y, t + "，查看該區");
    });
    // 環內標籤
    var pb = beadPt(40), ps = pt(67.5 / 108 * L);
    var ib = outward(pb, -90), is = outward(ps, -90);
    s += labelG("part:bead", "普通數珠 104 顆", ib.x, ib.y, "middle", pb.x + (ib.x - pb.x) * 0.1, pb.y + (ib.y - pb.y) * 0.1, "普通數珠");
    s += labelG("part:string", "串繩", is.x, is.y, "middle", ps.x + (is.x - ps.x) * 0.06, ps.y + (is.y - ps.y) * 0.06, "串繩");
    s += '<text x="' + CX + '" y="' + (CY + 52) + '" text-anchor="middle" style="font-size:16px;fill:var(--mut)" pointer-events="none">環上 108 顆 ＝ 104 普通數珠 ＋ 4 隔珠</text>';
    s += '<text x="' + CX + '" y="' + (CY + 76) + '" text-anchor="middle" style="font-size:16px;fill:var(--mut)" pointer-events="none">佛頭珠另計，不在 108 顆內</text>';
    s += '</g><g id="callout" class="callout" pointer-events="none"></g>';
    svg.innerHTML = s;
  }

  /* ---------- 視角縮放 ---------- */
  var view = { x: 0, y: 0, w: VW }, anim = 0;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function applyView(v) { svg.setAttribute("viewBox", v.x.toFixed(1) + " " + v.y.toFixed(1) + " " + v.w.toFixed(1) + " " + (v.w * VH / VW).toFixed(1)); }
  function setView(cx, cy, w) {
    w = Math.min(VW, w); var h = w * VH / VW;
    var x = Math.max(0, Math.min(VW - w, cx - w / 2)), y = Math.max(0, Math.min(VH - h, cy - h / 2));
    var from = { x: view.x, y: view.y, w: view.w }, to = { x: x, y: y, w: w };
    cancelAnimationFrame(anim);
    if (reduce) { view = to; applyView(view); return; }
    var t0 = performance.now(), dur = 420;
    (function step(now) {
      var k = Math.min(1, (now - t0) / dur); k = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      view = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, w: from.w + (to.w - from.w) * k };
      applyView(view);
      if (k < 1) anim = requestAnimationFrame(step);
    })(t0);
  }
  function fullView() { setView(VW / 2, VH / 2, VW); }

  /* ---------- 狀態與選取 ---------- */
  var sel = null, lastBead = 0;
  function parseAct(a) { var i = a.indexOf(":"); return { k: a.slice(0, i), v: a.slice(i + 1) }; }
  function zonesOfChapter(cid) {
    return D.zones.filter(function (zn) { return zn.chapters.some(function (c) { return c.id === cid; }); });
  }
  function select(s, opt) {
    opt = opt || {};
    sel = s;
    if (s && s.k === "bead") lastBead = s.n;
    paintSel();
    renderPanel();
    syncToc();
    if (opt.zoom !== false) zoomFor(s);
    if (opt.hash !== false) { try { history.replaceState(null, "", s ? "#" + hashOf(s) : location.pathname + location.search); } catch (e) {} }
    if (opt.tab !== false) showTab("content");
  }
  function hashOf(s) {
    return s.k === "bead" ? "bead-" + s.n : s.k === "spacer" || s.k === "zone" ? s.k + "-" + s.z : s.k === "part" ? "part-" + s.id : s.k === "chapter" ? "ch-" + s.id : s.id;
  }
  function zoomFor(s) {
    if (!s) return fullView();
    if (s.k === "bead") { var p = beadPt(s.n); return setView(p.x, p.y, 520); }
    if (s.k === "spacer") { var q = beadPt(D.zones[s.z].spacerNo); return setView(q.x, q.y, 520); }
    if (s.k === "zone") {
      var zn = D.zones[s.z], x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (var n = zn.first; n <= zn.spacerNo; n++) { var b = beadPt(n); x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x); y0 = Math.min(y0, b.y); y1 = Math.max(y1, b.y); }
      var w = Math.max(x1 - x0 + 260, (y1 - y0 + 200) * VW / VH, 560);
      return setView((x0 + x1) / 2, (y0 + y1) / 2, w);
    }
    if (s.k === "part" && (s.id === "head" || s.id === "tassel")) return setView(CX, 90, 480);
    fullView();
  }
  function paintSel() {
    var g = svg.querySelectorAll(".bead,.part");
    var zone = null, hlSet = {}, zonSet = {};
    if (sel) {
      if (sel.k === "bead") { zone = BEADS[sel.n].z; var tid = BEADS[sel.n].term; ASSIGNED.forEach(function (m) { if (BEADS[m].term === tid && m !== sel.n) hlSet[m] = 1; }); }
      else if (sel.k === "spacer" || sel.k === "zone") zone = sel.z;
      else if (sel.k === "chapter") { zonesOfChapter(sel.id).forEach(function (zn) { zn.terms.forEach(function (_, i) { hlSet[zn.first + i] = 1; zonSet[zn.first + i] = 1; }); }); }
    }
    svg.classList.toggle("zoomed", !!sel && (sel.k === "bead" || sel.k === "spacer"));
    svg.classList.toggle("dimmed", !!sel && sel.k !== "part" && sel.k !== "extra");
    g.forEach(function (el) {
      var n = +el.getAttribute("data-n"), on = false, hl = false, sl = false;
      if (n) {
        if (zone != null && BEADS[n].z === zone) on = true;
        if (zonSet[n]) on = true;
        if (hlSet[n]) hl = true;
        if (sel && sel.k === "bead" && sel.n === n) sl = true;
        if (sel && sel.k === "spacer" && D.zones[sel.z].spacerNo === n) sl = true;
      } else {
        var a = el.getAttribute("data-act"); if (sel && sel.k === "part" && a === "part:" + sel.id) sl = true;
      }
      el.classList.toggle("zon", on); el.classList.toggle("hl", hl && (!sel || sel.k !== "bead" || true)); el.classList.toggle("sel", sl);
    });
    // 引線說明（選取珠位時）
    var co = $("#callout"); co.innerHTML = "";
    if (sel && sel.k === "bead") {
      var p = beadPt(sel.n), o = outward(p, 46), nm = termById[BEADS[sel.n].term].name;
      var anc = anchorFor(o.x);
      co.innerHTML = '<path class="leader" style="stroke-width:1.6;opacity:.9" d="M' + p.x + ' ' + p.y + ' L' + o.x + ' ' + o.y + '"/><text x="' + o.x + '" y="' + (o.y + 6) + '" text-anchor="' + anc + '" style="font-size:20px;paint-order:stroke;stroke:var(--bg);stroke-width:5px;fill:var(--acc)">' + esc(nm) + '</text>';
    }
  }

  /* ---------- 面板 ---------- */
  function chipsForChapters(list) {
    return '<div class="chips">' + list.map(function (c) {
      var ch = chById[c.id];
      return '<button class="chip" data-go="chapter:' + ch.id + '">第' + ch.no + '章 ' + esc(ch.title) + (c.partial ? " <small>（部分內容）</small>" : "") + "</button>";
    }).join("") + "</div>";
  }
  function pendBlock() {
    return '<h3>正文・解說・出處</h3><p class="pend">正文待補。（解說、出處、相關名相欄位已預留於 data/content.js。）</p>';
  }
  function zoneHead(zn) {
    return '<p class="crumb zone-' + zn.id + '">' + esc(zn.name) + "區 ・ 數珠 " + zn.first + "–" + zn.last + "，隔珠 " + zn.spacerNo + "</p>";
  }
  function zoneBody(zn) {
    var h = '<h3>分類說明 ' + tag("nav") + "</h3><div class=\"box\"><p>" + esc(zn.summary) + "</p><p>核心：" + esc(zn.core) + "</p></div>";
    h += "<h3>相關名相（已配置珠位）</h3><div class=\"chips\">" + zn.terms.map(function (tid, i) {
      var n = zn.first + i;
      return '<button class="chip" data-go="bead:' + n + '">' + (i + 1) + ". " + esc(termById[tid].name) + " <small>珠" + n + "</small></button>";
    }).join("") + "</div>";
    h += "<p class=\"pend\" style=\"font-size:.88rem\">本區 26 個珠位中，已配置 " + zn.terms.length + " 個，其餘 " + (26 - zn.terms.length) + " 個待配置。</p>";
    h += "<h3>主要對應章 " + tag("nav") + "</h3><p style=\"margin:.2em 0;font-size:.92rem\">" + esc(zn.mainNote) + "</p>" + chipsForChapters(zn.chapters);
    return h;
  }
  function renderPanel() {
    var el = $("#pane-content"), h = "";
    if (!sel) {
      h = '<p class="crumb">總覽</p><h2>請選取念珠、文字或目次</h2>' +
        '<p>點「見、修、行、果」隔珠或標籤，查看該區名相；點已配置的數珠，展開所屬章；或切到「原書目次」按章瀏覽。左右切換只會在已配置內容的珠位間移動。</p>' +
        '<h3>四個區段</h3><div class="chips">' + D.zones.map(function (zn) { return '<button class="chip zone-' + zn.id + '" data-go="zone:' + zn.idx + '">' + esc(zn.name) + " 區 <small>" + zn.first + "–" + zn.last + "</small></button>"; }).join("") + "</div>" +
        '<div class="notice">環上 108 顆＝104 顆普通數珠＋4 顆隔珠（編號 27、54、81、108）；佛頭珠另計，與第四隔珠是不同部件。「見修行果」是本網站的導覽分類，不是引文原意。</div>';
    } else if (sel.k === "bead") {
      var b = BEADS[sel.n], zn = D.zones[b.z], t = termById[b.term];
      h = zoneHead(zn).replace("</p>", "</p>") + "<h2>" + esc(t.name) + "</h2>" +
        '<p class="pos">' + esc(zn.name) + "區 第 " + b.pos + "／26 珠 ・ 環上編號 " + sel.n + "／108 ・ 已配置 " + (zn.terms.indexOf(b.term) + 1) + "／" + zn.terms.length + " " + tag("nav") + "</p>";
      h += "<h3>名相 " + tag("nav") + '</h3><div class="box">' + esc(t.name) + "</div>";
      h += "<h3>所屬章（區段層級對應）" + "</h3>" + chipsForChapters(zn.chapters);
      h += '<div class="notice">此名相與各章、節、目的細部對應尚待確認。上列為「' + esc(zn.name) + "」區所列之主要對應章（" + esc(zn.mainNote) + "），不代表該名相出自每一章。</div>";
      if (t.note) h += '<div class="notice">' + esc(t.note) + "</div>";
      var others = ASSIGNED.filter(function (m) { return BEADS[m].term === b.term && m !== sel.n; });
      if (others.length) h += "<h3>同一名相亦見於</h3><div class=\"chips\">" + others.map(function (m) { return '<button class="chip" data-go="bead:' + m + '">' + esc(D.zones[BEADS[m].z].name) + "區 ・ 珠" + m + "</button>"; }).join("") + "</div>";
      h += pendBlock();
      h += '<p><button class="chip" data-go="zone:' + zn.idx + '">查看「' + esc(zn.name) + "」區全部名相</button></p>";
    } else if (sel.k === "spacer" || sel.k === "zone") {
      var z2 = D.zones[sel.z];
      if (sel.k === "spacer") {
        h = zoneHead(z2) + "<h2>" + z2.spacerName + "：" + esc(z2.spacerTitle) + "</h2>" +
          '<p class="pos">環上編號 ' + z2.spacerNo + "／108 ・ 代表其前 26 顆普通數珠（" + z2.first + "–" + z2.last + "）</p>";
        h += "<h3>原文的隔珠譬喻 " + tag("quote") + '</h3><div class="box">以風瑜伽為隔珠</div>';
        h += '<div class="notice">引文原本只說「以風瑜伽為隔珠」。將四顆隔珠分別設為「見、修、行、果」，是本網站的導覽安排，並非引文本身的說法。' + (sel.z === 1 ? "（第二隔珠標示「修（風瑜伽）」，與原文的風瑜伽相呼應。）" : "") + "</div>";
      } else {
        h = zoneHead(z2) + "<h2>" + esc(z2.name) + "　區</h2>";
      }
      h += zoneBody(z2);
    } else if (sel.k === "part") {
      var pt0 = D.parts[sel.id];
      h = '<p class="crumb">念珠部件</p><h2>' + esc(pt0.title) + "</h2><h3>譬喻 " + tag(pt0.src) + '</h3><div class="box">' + esc(pt0.text) + "</div>";
      if (sel.id === "bead") h += '<p>環上共 108 顆：104 顆普通數珠＋4 顆隔珠。每 26 顆普通數珠之後接 1 顆隔珠。普通數珠上的名相配置見四區說明。</p><div class="chips">' + D.zones.map(function (zn) { return '<button class="chip" data-go="zone:' + zn.idx + '">' + esc(zn.name) + " 區 " + zn.first + "–" + zn.last + "</button>"; }).join("") + "</div>";
      if (sel.id === "head") h += '<div class="notice">佛頭珠位於第四隔珠（環上第 108 顆）上方，是另計的 1 顆，不可與第四隔珠合併。</div>';
      if (sel.id === "string") h += '<div class="notice">串繩連續貫穿環上 108 顆珠子。</div>';
      h += "<p class=\"pend\">此為引文中的譬喻說明；進一步解說待補。</p>";
    } else if (sel.k === "chapter") {
      var c = chById[sel.id], zs = zonesOfChapter(c.id);
      h = '<p class="crumb">原書目次 ・ 第 ' + c.no + " 章 " + tag("book") + "</p><h2>第" + c.no + "章 " + esc(c.title) + "</h2>";
      if (c.volumes) h += '<p class="pos">' + esc(c.volumes) + "</p>";
      h += "<h3>節、目、頁碼 " + tag("book") + "</h3>";
      if (c.sections) {
        h += '<ul class="toc" style="margin:0">' + c.sections.map(function (s) { return "<li class=\"sub\" style=\"padding-left:0;color:var(--fg)\">" + esc(s.no) + " " + esc(s.title) + "　<small class=\"pend\">" + esc(s.volume) + "；頁碼待補</small></li>"; }).join("") + "</ul>";
        h += '<p class="pend" style="font-size:.88rem">其餘節、目及頁碼待補，不猜補。第七章第三節跨輯接續：上半在第一輯、下半在第二輯，各保留原題名。</p>';
      } else if (c.volumeNote) h += "<p>" + esc(c.volumeNote) + "</p>";
      else h += '<p class="pend">本章的節、目與頁碼待補（尚未提供）。</p>';
      h += "<h3>所屬分類 " + tag("nav") + "</h3>";
      if (zs.length) {
        h += '<div class="chips">' + zs.map(function (zn) { var part = zn.chapters.filter(function (x) { return x.id === c.id; })[0].partial; return '<button class="chip zone-' + zn.id + '" data-go="zone:' + zn.idx + '">' + esc(zn.name) + "區" + (part ? " <small>（部分內容）</small>" : "") + "</button>"; }).join("") + "</div>";
        h += '<div class="notice">念珠上已高亮這些區段中已配置的珠位。分類為章層級對應，節級對應待確認。</div>';
      } else h += '<p class="pend">此章尚未配置到「見修行果」珠位（待確認），仍可由目次進入。</p>';
      h += pendBlock();
    } else if (sel.k === "extra") {
      var x = extraById[sel.id];
      h = '<p class="crumb">原書目次入口 ' + tag("book") + "</p><h2>" + esc(x.title) + "</h2><p class=\"pend\">目前僅有目次入口；內容與頁碼待補。</p>";
    }
    el.innerHTML = h;
  }

  /* ---------- 目次 ---------- */
  function buildToc() {
    var h = '<p class="pend" style="font-size:.88rem;margin-top:0">已提供的章名皆列於此；各章的輯別、節、目、頁碼待補，未提供者不猜補。右側圓點為本站導覽分類。</p><ul class="toc">';
    D.chapters.forEach(function (c) {
      var zs = zonesOfChapter(c.id);
      h += '<li><button class="row" data-go="chapter:' + c.id + '"><span class="n">' + c.no + '</span><span>' + esc(c.title) + '</span><span class="dots">' +
        zs.map(function (zn) { return '<b style="background:' + ZCOLOR[zn.id] + '" title="' + zn.name + '">' + zn.name + "</b>"; }).join("") + "</span></button>";
      if (c.volumes) h += '<div class="sub" style="padding-bottom:4px">' + esc(c.volumes) + "</div>";
      if (c.sections) h += c.sections.map(function (s) { return '<div class="sub">' + esc(s.no) + " " + esc(s.title) + "（" + esc(s.volume) + "）</div>"; }).join("");
      if (c.volumeNote) h += '<div class="sub">' + esc(c.volumeNote) + "</div>";
      h += "</li>";
    });
    h += "</ul><h4>其他目次入口</h4><ul class=\"toc\">" + D.extras.map(function (x) { return '<li><button class="row" data-go="extra:' + x.id + '"><span>' + esc(x.title) + '</span><span class="dots pend">待補</span></button></li>'; }).join("") + "</ul>";
    $("#pane-toc").innerHTML = h;
    var o = '<option value="">— 選擇章節 —</option>' + D.chapters.map(function (c) { return '<option value="chapter:' + c.id + '">第' + c.no + "章 " + esc(c.title) + "</option>"; }).join("") +
      D.extras.map(function (x) { return '<option value="extra:' + x.id + '">' + esc(x.title) + "</option>"; }).join("");
    $("#chsel").innerHTML = o;
  }
  function syncToc() {
    document.querySelectorAll("#pane-toc .row").forEach(function (b) {
      var g = b.getAttribute("data-go"), on = false;
      if (sel && (sel.k === "chapter" || sel.k === "extra")) on = g === sel.k + ":" + sel.id;
      b.classList.toggle("on", on);
    });
    var cs = document.getElementById("chsel");
    // 值以 "kind:id" 表示
    cs.value = sel && (sel.k === "chapter" || sel.k === "extra") ? sel.k + ":" + sel.id : "";
  }
  function showTab(name) {
    var c = name === "content";
    $("#tab-content").setAttribute("aria-selected", c); $("#tab-toc").setAttribute("aria-selected", !c);
    $("#pane-content").hidden = !c; $("#pane-toc").hidden = c;
  }

  /* ---------- 導覽 ---------- */
  function go(str, opt) {
    var a = parseAct(str), v = a.v;
    if (a.k === "bead") select({ k: "bead", n: +v }, opt);
    else if (a.k === "spacer") select({ k: "spacer", z: +v }, opt);
    else if (a.k === "zone") select({ k: "zone", z: +v }, opt);
    else if (a.k === "part") select({ k: "part", id: v }, opt);
    else if (a.k === "chapter") select({ k: "chapter", id: v }, opt);
    else if (a.k === "extra") select({ k: "extra", id: v }, opt);
  }
  function step(d) {
    var cur;
    if (sel && sel.k === "bead") cur = sel.n;
    else if (sel && sel.k === "spacer") cur = D.zones[sel.z].spacerNo;
    else if (sel && sel.k === "zone") cur = D.zones[sel.z].first - 0.5;
    else if (sel && sel.k === "chapter") { var zs = zonesOfChapter(sel.id); cur = zs.length ? zs[0].first - 0.5 : lastBead; }
    else cur = lastBead || (d > 0 ? 0 : 109);
    var pick = null;
    if (d > 0) { pick = ASSIGNED.filter(function (m) { return m > cur; })[0]; if (!pick) pick = ASSIGNED[0]; }
    else { var lo = ASSIGNED.filter(function (m) { return m < cur; }); pick = lo.length ? lo[lo.length - 1] : ASSIGNED[ASSIGNED.length - 1]; }
    select({ k: "bead", n: pick });
  }

  function init() {
    $("#quote").textContent = D.quote;
    try { buildToc(); } catch (e) { console.error(e); }
    try {
      buildSvg();
      $("#partbar").innerHTML = ["bead", "head", "tassel", "string"].map(function (k) { return '<button type="button" data-go="part:' + k + '">' + esc(D.parts[k].title.replace(/（.*$/, "")) + "說明</button>"; }).join("") +
        D.zones.map(function (zn) { return '<button type="button" data-go="spacer:' + zn.idx + '">' + zn.spacerName + "・" + esc(zn.spacerTitle) + "</button>"; }).join("");
    } catch (e) {
      console.error(e);
      svg.parentNode.innerHTML = '<p style="padding:16px">念珠圖載入失敗，請改用右側「原書目次」閱讀。</p>';
    }
    renderPanel();
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-go],[data-act]"); if (!t) return;
      var s = t.getAttribute("data-go") || t.getAttribute("data-act"); if (!s) return;
      go(s);
    });
    document.addEventListener("keydown", function (e) {
      if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("[data-act][tabindex]")) { e.preventDefault(); go(e.target.getAttribute("data-act")); }
      else if (e.key === "ArrowRight" && !/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) step(1);
      else if (e.key === "ArrowLeft" && !/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) step(-1);
      else if (e.key === "Escape") select(null);
    });
    $("#prev").onclick = function () { step(-1); };
    $("#next").onclick = function () { step(1); };
    $("#home").onclick = function () { select(null); };
    $("#chsel").onchange = function (e) { if (e.target.value) go(e.target.value); };
    $("#tab-content").onclick = function () { showTab("content"); };
    $("#tab-toc").onclick = function () { showTab("toc"); };
    var mb = $("#motion");
    function setMotion(off) { svg.classList.toggle("still", off); mb.setAttribute("aria-pressed", off); mb.textContent = off ? "恢復動態" : "暫停動態"; }
    mb.onclick = function () { setMotion(!svg.classList.contains("still")); };
    if (reduce) setMotion(true);
    // 由網址還原
    var m = /^#(bead|spacer|zone|part|ch|x)-(.+)$/.exec(location.hash);
    if (m) {
      var map = { ch: "chapter", x: "extra" }, k = map[m[1]] || m[1], v = m[2];
      if (k === "extra") v = "x-" + v;
      if (k === "chapter" ? chById[v] : k === "extra" ? extraById[v] : true) {
        if (k === "bead" && !BEADS[+v].term) return;
        go(k + ":" + v, { hash: false });
      }
    }
  }
  init();
})();
