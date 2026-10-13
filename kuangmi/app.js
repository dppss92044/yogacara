/* 數珠導覽（全息星海版）— 視覺與互動程式。內容全部來自 data/content.js。
 * 念珠為傾斜圓環的透視投影：點選任一珠，環會轉動使該珠停在畫面中央並放大。 */
(function () {
  "use strict";
  var D = window.KM_DATA;
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var SRC = { book: "書籍目次", quote: "平實導師引文", nav: "本站導覽分類" };
  var tag = function (k) { return '<span class="tag ' + k + '">' + SRC[k] + "</span>"; };
  var ZCOLOR = { jian: "#6fe3f0", xiu: "#ffd27a", xing: "#c9a8ff", guo: "#ff8f9d" };
  var TAU = Math.PI * 2;

  var chById = {}, termById = {}, extraById = {};
  D.chapters.forEach(function (c) { chById[c.id] = c; });
  D.terms.forEach(function (t) { termById[t.id] = t; });
  D.extras.forEach(function (x) { extraById[x.id] = x; });

  /* ---------- 珠位模型（唯一準則：每 26 顆普通數珠後接 1 顆隔珠） ---------- */
  var BEADS = [];
  for (var n = 1; n <= 108; n++) {
    var z = Math.floor((n - 1) / 27), r = ((n - 1) % 27) + 1;
    BEADS[n] = { n: n, z: z, pos: r, spacer: r === 27, term: null };
  }
  D.zones.forEach(function (zn, zi) {
    zn.idx = zi; zn.first = zi * 27 + 1; zn.last = zi * 27 + 26; zn.spacerNo = zi * 27 + 27;
    zn.terms.forEach(function (tid, i) { BEADS[zn.first + i].term = tid; });
  });
  var ASSIGNED = BEADS.filter(function (b) { return b && b.term; }).map(function (b) { return b.n; });
  function zonesOfChapter(cid) {
    return D.zones.filter(function (zn) { return zn.chapters.some(function (c) { return c.id === cid; }); });
  }

  /* ---------- 幾何：傾斜圓環 ---------- */
  var SIN = 0.78;
  var svg = $("#mala"), stage = $("#stage"), cvs = $("#galaxy"), cx2 = cvs.getContext("2d");
  var W = 1000, H = 700, k = 1, R = 350, narrow = false;
  var C = { x: 500, y: 400 }, F = { x: 500, y: 400 };
  var HEAD_D = 62;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  var sel = null, lastBead = 0, built = false;
  var rot = 0, rotTarget = 0, swayAmp = 0, swayT = 0, hold = 0, paused = false, sway = 0, spin = 0, gAng = 0;
  var cam = { s: 1, ax: 500, ay: 400, fx: 500, fy: 400 }, camTarget = cam;
  var headInfo = { x: 0, y: 0, dx: 0, dy: -1, sc: 1 };

  function layout() {
    W = stage.clientWidth || 1000; H = stage.clientHeight || 700;
    narrow = W < 760;
    var freeW = narrow ? W : W - 420;
    k = narrow ? Math.min(W * 0.42 / 350, H * 0.5 / 400) : Math.min(freeW / 1100, H / 800);
    R = 350 * k;
    var cxm = narrow ? W / 2 : freeW / 2 + 8;
    C = { x: cxm, y: H * (narrow ? 0.6 : 0.52) };
    F = { x: cxm, y: H * 0.5 };
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cvs.width = Math.round(W * dpr); cvs.height = Math.round(H * dpr);
    cx2.setTransform(dpr, 0, 0, dpr, 0, 0);
    camTarget = camFor(sel);
    if (!built) return;
    cam = Object.assign({}, camTarget); calloutKey = ""; render(); drawGalaxy(0);
  }

  function frontRot(n) { return Math.PI - TAU * n / 108; }
  function wrapNear(target, cur) { return cur + ((((target - cur) % TAU) + 3 * Math.PI) % TAU - Math.PI); }
  function thetaOf(n) { return TAU * n / 108 + rot + sway; }
  function camFor(s) {
    var rest = { s: 1, ax: C.x, ay: C.y, fx: C.x, fy: C.y };
    if (!s) return rest;
    var fp = { x: C.x, y: C.y + R * SIN };
    if (s.k === "bead" || s.k === "spacer") return { s: narrow ? 3.2 : 2.9, ax: fp.x, ay: fp.y, fx: F.x, fy: F.y };
    if (s.k === "zone") return { s: narrow ? 1.5 : 1.7, ax: fp.x, ay: fp.y - R * SIN * 0.15, fx: F.x, fy: F.y };
    if (s.k === "part" && (s.id === "head" || s.id === "tassel")) return { s: narrow ? 2 : 2.3, ax: C.x, ay: C.y - R * SIN - HEAD_D * k * 0.6, fx: F.x, fy: F.y };
    return rest;
  }
  function rotFor(s) {
    if (!s) return 0;
    if (s.k === "bead") return frontRot(s.n);
    if (s.k === "spacer") return frontRot(D.zones[s.z].spacerNo);
    if (s.k === "zone") return frontRot(D.zones[s.z].first + 13);
    if (s.k === "part" && (s.id === "head" || s.id === "tassel")) return 0;
    return null;
  }
  function proj(x, y) { return { x: cam.fx + (x - cam.ax) * cam.s, y: cam.fy + (y - cam.ay) * cam.s }; }
  function ringPt(th) {
    var x = C.x + R * Math.sin(th), y = C.y - R * SIN * Math.cos(th);
    var p = proj(x, y), nz = -Math.cos(th);
    var nx = Math.sin(th), ny = -Math.cos(th) / SIN, m = Math.hypot(nx, ny);
    return { x: p.x, y: p.y, nz: nz, ox: nx / m, oy: ny / m, rot: Math.atan2(SIN * Math.sin(th), Math.cos(th)) * 180 / Math.PI };
  }

  /* ---------- SVG 建構 ---------- */
  var els = { labs: {} };
  function defs() {
    return "<defs>" +
      '<radialGradient id="gHalo"><stop offset=".6" stop-color="#7ae8ff" stop-opacity="0"/><stop offset=".86" stop-color="#7ae8ff" stop-opacity=".16"/><stop offset="1" stop-color="#7ae8ff" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="gStr" x1="0" x2="1"><stop offset="0" stop-color="#b9f6ff"/><stop offset=".5" stop-color="#c4a6ff"/><stop offset="1" stop-color="#b9f6ff"/></linearGradient>' +
      '<radialGradient id="gB" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#ecd5a6"/><stop offset=".55" stop-color="#b58a52"/><stop offset="1" stop-color="#6b4a2b"/></radialGradient>' +
      '<radialGradient id="gS" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#d1564c"/><stop offset=".5" stop-color="#7a1616"/><stop offset="1" stop-color="#2a0707"/></radialGradient>' +
      '<radialGradient id="gH" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#fff3c9"/><stop offset=".55" stop-color="#d1a64a"/><stop offset="1" stop-color="#7d5a1c"/></radialGradient>' +
      '<radialGradient id="gRim" cx="50%" cy="50%" r="50%"><stop offset=".62" stop-color="#7ae8ff" stop-opacity="0"/><stop offset="1" stop-color="#7ae8ff" stop-opacity=".55"/></radialGradient>' +
      '<g id="bodhi"><circle r="10" fill="url(#gB)" stroke="#5b3d22" stroke-width=".7"/>' +
      '<g fill="#34210f"><circle cx="-4" cy="-3" r=".9"/><circle cx="2" cy="-5" r=".9"/><circle cx="5" cy="1" r=".9"/><circle cx="-1" cy="3" r=".9"/><circle cx="-5" cy="4" r=".8"/><circle cx="3" cy="6" r=".8"/><circle cx="0" cy="-1" r=".7"/><circle cx="-6" cy="-1" r=".7"/></g>' +
      '<ellipse cx="-9.2" cy="0" rx="1.3" ry="2.4" fill="#22140a"/><ellipse cx="9.2" cy="0" rx="1.3" ry="2.4" fill="#22140a"/>' +
      '<circle cx="-3.5" cy="-4.5" r="3" fill="#fff" opacity=".28"/><circle r="10" fill="url(#gRim)"/></g>' +
      '<g id="spacer"><circle r="13" fill="url(#gS)" stroke="#1a0404" stroke-width=".8"/>' +
      '<ellipse cx="-12" cy="0" rx="1.5" ry="3" fill="#0d0202"/><ellipse cx="12" cy="0" rx="1.5" ry="3" fill="#0d0202"/>' +
      '<ellipse cx="-4" cy="-5.5" rx="4" ry="2.4" fill="#fff" opacity=".35" transform="rotate(-25 -4 -5.5)"/><circle r="13" fill="url(#gRim)" opacity=".8"/></g>' +
      "</defs>";
  }
  function labelG(id, act, text) {
    return '<path class="leader" id="ld-' + id + '"/><circle class="ldot" id="dt-' + id + '" r="2.4"/>' +
      '<g class="lab far" id="lb-' + id + '" role="button" tabindex="0" data-act="' + act + '" aria-label="' + esc(text) + '"><text>' + esc(text) + "</text></g>";
  }

  function buildSvg() {
    var s = defs();
    s += '<ellipse id="halo" fill="url(#gHalo)"/>';
    s += '<g class="part" id="strpart" data-act="part:string" role="button" tabindex="0" aria-label="串繩">' +
      '<ellipse id="strglow" fill="none" stroke="#7ae8ff" stroke-opacity=".28" stroke-width="6"/>' +
      '<ellipse id="str" fill="none" stroke="url(#gStr)" stroke-width="2"/><ellipse class="hit" id="strhit"/></g>';
    s += '<line id="stem" stroke="url(#gStr)" stroke-width="2"/>';
    s += '<g id="beads">';
    for (var n = 1; n <= 108; n++) {
      var b = BEADS[n];
      var cls = "bead" + (b.spacer ? " spacer" : "") + (b.term || b.spacer ? "" : " empty");
      var lab = b.spacer ? "隔珠" + "一二三四".charAt(b.z) + "，" + D.zones[b.z].spacerTitle + "，環上第" + n + "顆"
        : b.term ? D.zones[b.z].name + "區第" + b.pos + "珠，環上第" + n + "顆：" + termById[b.term].name
        : D.zones[b.z].name + "區第" + b.pos + "珠，環上第" + n + "顆，待配置";
      var act = b.spacer ? "spacer:" + b.z : b.term ? "bead:" + n : "";
      s += '<g class="' + cls + '" data-n="' + n + '"' + (act ? ' data-act="' + act + '" role="button" tabindex="0"' : ' aria-hidden="true"') + ' aria-label="' + esc(lab) + '"><title>' + esc(lab) + "</title>" +
        '<g class="bb"><use href="#' + (b.spacer ? "spacer" : "bodhi") + '"/></g><circle class="ring" r="' + (b.spacer ? 9 : 7) + '"/></g>';
    }
    s += "</g>";
    var th = "";
    for (var j = -5; j <= 5; j++) th += '<path d="M0 -38 Q' + (j * 1.6) + " -53 " + (j * 3.2) + ' -72" stroke="' + (j % 2 ? "#ff6f74" : "#b8333b") + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
    s += '<g id="headg"><g class="part" data-act="part:head" role="button" tabindex="0" aria-label="佛頭珠">' +
      '<circle r="19" fill="url(#gH)" stroke="#6b4a14"/><ellipse rx="19" ry="5" fill="none" stroke="#7d5a1c" stroke-width="1.2" opacity=".7"/>' +
      '<ellipse cy="18.5" rx="3" ry="1.4" fill="#22140a"/><circle cx="-6" cy="-7" r="5" fill="#fff" opacity=".35"/><circle r="19" fill="url(#gRim)"/>' +
      '<path d="M-7 -17 L0 -27 L7 -17 Z" fill="#c79a3a" stroke="#6b4a14" stroke-width=".8"/><circle class="ring" r="22"/></g>' +
      '<g class="part" data-act="part:tassel" role="button" tabindex="0" aria-label="佛頭珠飾穗"><line x1="0" y1="-27" x2="0" y2="-38" stroke="#b9f6ff" stroke-width="2.2"/>' + th +
      '<circle cy="-38" r="5" fill="url(#gH)" stroke="#6b4a14" stroke-width=".8"/><rect x="-20" y="-76" width="40" height="44" fill="transparent"/><rect class="ring" x="-20" y="-74" width="40" height="40" rx="8"/></g></g>';
    s += '<g id="labels">';
    s += labelG("head", "part:head", "佛頭珠") + labelG("tassel", "part:tassel", "佛頭珠飾穗");
    D.zones.forEach(function (zn, zi) {
      s += labelG("sp" + zi, "spacer:" + zi, "隔珠" + "一二三四".charAt(zi) + "・" + zn.name);
      s += labelG("zn" + zi, "zone:" + zi, zn.name + " " + zn.first + "–" + zn.last);
    });
    s += labelG("bead", "part:bead", "普通數珠 104 顆") + labelG("string", "part:string", "串繩");
    s += '<text id="cap1" text-anchor="middle" style="font-size:15px;fill:var(--mut)" pointer-events="none">環上 108 顆 ＝ 104 普通數珠 ＋ 4 隔珠</text>';
    s += '<text id="cap2" text-anchor="middle" style="font-size:15px;fill:var(--mut)" pointer-events="none">佛頭珠另計，不在 108 顆內</text>';
    s += '</g><g id="fx" pointer-events="none"></g><g id="callout" class="callout"></g><g id="chfan"></g>';
    svg.innerHTML = s;
    els.beads = []; els.bb = []; els.ring = [];
    for (var m = 1; m <= 108; m++) {
      var e = svg.querySelector('.bead[data-n="' + m + '"]');
      els.beads[m] = e; els.bb[m] = e.querySelector(".bb"); els.ring[m] = e.querySelector(".ring");
    }
    ["halo", "str", "strglow", "strhit", "stem", "headg", "cap1", "cap2", "callout", "chfan", "fx"].forEach(function (i) { els[i] = document.getElementById(i); });
    ["head", "tassel", "bead", "string", "sp0", "sp1", "sp2", "sp3", "zn0", "zn1", "zn2", "zn3"].forEach(function (i) {
      els.labs[i] = { g: document.getElementById("lb-" + i), t: document.querySelector("#lb-" + i + " text"), l: document.getElementById("ld-" + i), d: document.getElementById("dt-" + i) };
    });
    built = true;
  }

  function setLab(id, x, y, anchor, tx, ty) {
    var L = els.labs[id], sx = anchor === "end" ? x + 6 : anchor === "start" ? x - 6 : x;
    L.t.setAttribute("x", x.toFixed(1)); L.t.setAttribute("y", y.toFixed(1)); L.t.setAttribute("text-anchor", anchor);
    if (tx == null) { L.l.setAttribute("d", ""); L.d.setAttribute("r", 0); return; }
    L.l.setAttribute("d", "M" + sx.toFixed(1) + " " + (y - 6).toFixed(1) + " L" + tx.toFixed(1) + " " + ty.toFixed(1));
    L.d.setAttribute("cx", tx.toFixed(1)); L.d.setAttribute("cy", ty.toFixed(1)); L.d.setAttribute("r", 2.4);
  }
  function anchorFor(x, cxs) { return x > cxs + 40 ? "start" : x < cxs - 40 ? "end" : "middle"; }

  /* ---------- 每幀繪製 ---------- */
  var BODHI_S = 0.64, SPACER_S = 0.62;
  function render() {
    var ctr = proj(C.x, C.y), rx = R * cam.s, ry = R * SIN * cam.s;
    ["str", "strglow", "strhit"].forEach(function (i) { var e = els[i]; e.setAttribute("cx", ctr.x.toFixed(1)); e.setAttribute("cy", ctr.y.toFixed(1)); e.setAttribute("rx", rx.toFixed(1)); e.setAttribute("ry", ry.toFixed(1)); });
    var h = els.halo; h.setAttribute("cx", ctr.x.toFixed(1)); h.setAttribute("cy", ctr.y.toFixed(1)); h.setAttribute("rx", (rx * 1.28).toFixed(1)); h.setAttribute("ry", (ry * 1.5).toFixed(1));
    for (var n = 1; n <= 108; n++) {
      var th = thetaOf(n), p = ringPt(th), b = BEADS[n];
      var sc = (b.spacer ? SPACER_S : BODHI_S) * k * cam.s * (1 + 0.12 * p.nz);
      els.beads[n].setAttribute("transform", "translate(" + p.x.toFixed(1) + " " + p.y.toFixed(1) + ")");
      els.bb[n].setAttribute("transform", "rotate(" + p.rot.toFixed(0) + ") scale(" + sc.toFixed(3) + ")");
      els.ring[n].setAttribute("r", ((b.spacer ? 13 : 10) * sc + 1.5).toFixed(1));
      if (n === 108) positionHead(th, p);
    }
    positionLabels();
    positionCallouts();
  }
  function positionHead(th, p) {
    var dx = Math.sin(th), dy = -Math.cos(th) / SIN, m = Math.hypot(dx, dy); dx /= m; dy /= m;
    var d = HEAD_D * k * cam.s, hx = p.x + dx * d, hy = p.y + dy * d;
    var ang = Math.atan2(dx, -dy) * 180 / Math.PI, sc = 0.82 * k * cam.s * (1 + 0.1 * p.nz);
    els.headg.setAttribute("transform", "translate(" + hx.toFixed(1) + " " + hy.toFixed(1) + ") rotate(" + ang.toFixed(1) + ") scale(" + sc.toFixed(3) + ")");
    els.stem.setAttribute("x1", p.x.toFixed(1)); els.stem.setAttribute("y1", p.y.toFixed(1)); els.stem.setAttribute("x2", hx.toFixed(1)); els.stem.setAttribute("y2", hy.toFixed(1));
    headInfo = { x: hx, y: hy, dx: dx, dy: dy, sc: sc };
  }
  function positionLabels() {
    var ctr = proj(C.x, C.y);
    svg.classList.toggle("zoomed", cam.s > 1.25);
    var capVis = cam.s < 1.25 && !narrow;
    els.cap1.style.display = els.cap2.style.display = capVis ? "" : "none";
    Object.keys(els.labs).forEach(function (i) { els.labs[i].g.style.display = narrow ? "none" : ""; });
    if (narrow) { Object.keys(els.labs).forEach(function (i) { setLab(i, 0, 0, "start", null); }); return; }
    var hp = headInfo;
    setLab("head", hp.x - 36 * hp.sc - 8, hp.y + 6, "end", hp.x - 22 * hp.sc, hp.y);
    setLab("tassel", hp.x + 40 * hp.sc, hp.y - 66 * hp.sc, "start", hp.x + hp.dx * 40 * hp.sc + 6, hp.y + hp.dy * 40 * hp.sc);
    D.zones.forEach(function (zn, zi) {
      var p = ringPt(thetaOf(zn.spacerNo)), o = 40, ax = p.x + p.ox * o;
      if (zi === 3) setLab("sp3", p.x + 22, p.y + 26, "start", p.x + 8, p.y + 6); // 第四隔珠：標籤放在珠旁，避開上方的佛頭珠與其標籤
      else setLab("sp" + zi, ax, p.y + p.oy * o + 6, anchorFor(ax, ctr.x), p.x + p.ox * 11 * cam.s, p.y + p.oy * 11 * cam.s);
      var q = ringPt(thetaOf(zi * 27 + 13.5)), qx = q.x + q.ox * 46;
      setLab("zn" + zi, qx, q.y + q.oy * 46 + 6, anchorFor(qx, ctr.x), q.x, q.y);
    });
    var pb = ringPt(thetaOf(40)), ps = ringPt(thetaOf(67.5));
    setLab("bead", ctr.x + 110 * k * cam.s, ctr.y + 50 * k * cam.s, "start", pb.x - pb.ox * 6, pb.y - pb.oy * 6);
    setLab("string", ctr.x - 110 * k * cam.s, ctr.y + 50 * k * cam.s, "end", ps.x - ps.ox * 6, ps.y - ps.oy * 6);
    els.cap1.setAttribute("x", ctr.x); els.cap1.setAttribute("y", ctr.y - 6); els.cap2.setAttribute("x", ctr.x); els.cap2.setAttribute("y", ctr.y + 16);
  }

  var calloutKey = "";
  function positionCallouts() {
    var key = sel ? JSON.stringify(sel) + narrow + W + H : "";
    if (key === calloutKey) return;
    calloutKey = key; els.callout.innerHTML = ""; els.chfan.innerHTML = ""; els.fx.innerHTML = "";
    if (!sel || (sel.k !== "bead" && sel.k !== "spacer")) return;
    var fx = F.x, fy = F.y, name, sub, zn;
    if (sel.k === "bead") { var b = BEADS[sel.n]; zn = D.zones[b.z]; name = termById[b.term].name; sub = zn.name + "區 第 " + b.pos + "／26 珠 ・ 環上 " + sel.n + "／108"; }
    else { zn = D.zones[sel.z]; name = "隔珠" + "一二三四".charAt(sel.z) + "：" + zn.spacerTitle; sub = "環上 " + zn.spacerNo + "／108 ・ 代表其前 26 顆數珠"; }
    var fs = narrow ? 0.78 : 1, ty = fy - (narrow ? 62 : 84);
    els.callout.innerHTML = '<path class="leader" style="opacity:.9;stroke-width:1.5" d="M' + fx + " " + (ty + 38) + " L" + fx + " " + (fy - 26) + '"/>' +
      '<text class="big" text-anchor="middle" x="' + fx + '" y="' + ty + '" style="font-size:' + (26 * fs) + 'px">' + esc(name) + "</text>" +
      '<text class="small" text-anchor="middle" x="' + fx + '" y="' + (ty + 24) + '" style="font-size:' + (15 * fs) + 'px">' + esc(sub) + "</text>";
    els.fx.innerHTML = '<circle class="reticle" cx="' + fx + '" cy="' + fy + '" r="' + (30 * fs) + '"/><circle class="reticle2" cx="' + fx + '" cy="' + fy + '" r="' + (40 * fs) + '"/><circle class="ripple" cx="' + fx + '" cy="' + fy + '" r="' + (26 * fs) + '"/>';
    if (narrow) return;
    // 章名以引線連到該珠：排在念珠下方（環外），可點擊
    var g = "", y0 = fy + 90, fanX = fx - 150;
    var selN = sel.k === "bead" ? sel.n : zn.spacerNo, dn = ((selN - 108 + 162) % 108) - 54;
    if (Math.abs(dn) <= 4) fanX = dn >= 0 ? fx + 70 : fx - 260; // 佛頭珠在附近時，章名改排在另一側，避免壓在佛頭珠上
    zn.chapters.forEach(function (c, i) {
      var ch = chById[c.id], y = y0 + i * 31, x = fanX;
      var t = "第" + ch.no + "章 " + ch.title + (c.partial ? "（部分內容）" : "");
      g += '<path class="leader" d="M' + (x - 8) + " " + (y - 6) + " C" + (x - 60) + " " + (y - 6) + " " + (fx - 40 + i * 6) + " " + (fy + 40) + " " + fx + " " + (fy + 14) + '"/>' +
        '<circle class="ldot" cx="' + (x - 8) + '" cy="' + (y - 6) + '" r="2.4"/>' +
        '<g class="lab chlab" role="button" tabindex="0" data-act="chapter:' + ch.id + '" aria-label="' + esc(t) + '"><text x="' + x + '" y="' + y + '">' + esc(t) + "</text></g>";
    });
    els.chfan.innerHTML = g;
  }

  /* ---------- 星系背景 ---------- */
  var stars = [];
  (function () {
    var rnd = Math.random, i;
    for (i = 0; i < 2200; i++) {
      var arm = i % 3, rr = Math.pow(rnd(), 0.62), th = arm * TAU / 3 + rr * 5.2 + (rnd() - .5) * (0.55 - rr * .3);
      stars.push({ r: rr, th: th, s: rnd() < .08 ? 2 : 1, c: rnd() < .15 ? "#ffd9a0" : rnd() < .5 ? "#bfeaff" : "#e3d4ff", a: .35 + rnd() * .65, bg: 0 });
    }
    for (i = 0; i < 380; i++) stars.push({ x: rnd(), y: rnd(), s: rnd() < .1 ? 2 : 1, c: "#fff", a: .2 + rnd() * .6, ph: rnd() * 6.28, bg: 1 });
  })();
  function drawGalaxy(t) {
    var g = cx2, gx = W * 0.46, gy = H * 0.46, RM = Math.max(W, H) * 0.78, tilt = -0.32, ct = Math.cos(tilt), st = Math.sin(tilt), zs = 1 + 0.06 * (cam.s - 1);
    g.clearRect(0, 0, W, H);
    var bgG = g.createRadialGradient(gx, gy, 0, gx, gy, RM); bgG.addColorStop(0, "#14123a"); bgG.addColorStop(.45, "#070b22"); bgG.addColorStop(1, "#02030a");
    g.fillStyle = bgG; g.fillRect(0, 0, W, H);
    var core = g.createRadialGradient(gx, gy, 0, gx, gy, RM * .32); core.addColorStop(0, "rgba(255,214,150,.38)"); core.addColorStop(.35, "rgba(170,130,255,.16)"); core.addColorStop(1, "rgba(60,90,200,0)");
    g.save(); g.translate(gx, gy); g.rotate(tilt); g.scale(1, .5); g.translate(-gx, -gy); g.fillStyle = core; g.fillRect(gx - RM, gy - RM, RM * 2, RM * 2); g.restore();
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i], x, y;
      if (s.bg) { x = s.x * W; y = s.y * H; g.globalAlpha = s.a * (0.7 + 0.3 * Math.sin(t * 1.3 + s.ph)); }
      else {
        var a = s.th + gAng * (1.4 - s.r), px = Math.cos(a) * s.r * RM * zs, py = Math.sin(a) * s.r * RM * .5 * zs;
        x = gx + px * ct - py * st; y = gy + px * st + py * ct; g.globalAlpha = s.a * (1 - s.r * .55);
      }
      g.fillStyle = s.c; g.fillRect(x, y, s.s, s.s);
    }
    g.globalAlpha = 1;
  }

  /* ---------- 主迴圈 ---------- */
  var tPrev = 0, tAcc = 0;
  function frame(now) {
    var dt = Math.min(0.05, (now - tPrev) / 1000 || 0.016); tPrev = now; tAcc += dt;
    var idle = !sel && !paused && !reduce && now > hold;
    swayAmp += ((idle ? 0.3 : 0) - swayAmp) * Math.min(1, dt * (paused ? 9 : 1.6));
    if (!paused && !reduce) swayT += dt;
    sway = swayAmp * Math.sin(swayT * 0.33);
    var e = reduce ? 1 : 1 - Math.exp(-dt * 5.5);
    rot += (rotTarget - rot) * e;
    ["s", "ax", "ay", "fx", "fy"].forEach(function (p) { cam[p] += (camTarget[p] - cam[p]) * e; });
    if (!paused && !reduce) { gAng += dt * (0.012 + spin); spin *= Math.exp(-dt * 1.6); }
    render();
    if (!reduce && !paused) drawGalaxy(tAcc);
    requestAnimationFrame(frame);
  }

  /* ---------- 選取 ---------- */
  function parseAct(a) { var i = a.indexOf(":"); return { k: a.slice(0, i), v: a.slice(i + 1) }; }
  function hashOf(s) {
    return s.k === "bead" ? "bead-" + s.n : s.k === "spacer" || s.k === "zone" ? s.k + "-" + s.z : s.k === "part" ? "part-" + s.id : s.k === "chapter" ? "ch-" + s.id : s.id;
  }
  function select(s, opt) {
    opt = opt || {};
    sel = s; if (s && s.k === "bead") lastBead = s.n;
    var rt = rotFor(s);
    if (rt != null) rotTarget = wrapNear(rt, rot);
    camTarget = camFor(s);
    if (reduce) { rot = rotTarget; cam = Object.assign({}, camTarget); }
    spin += 0.9; hold = performance.now() + 2500;
    calloutKey = ""; paintSel(); renderPanel(); syncToc(); render();
    if (opt.hash !== false) { try { history.replaceState(null, "", s ? "#" + hashOf(s) : location.pathname + location.search); } catch (e) {} }
    if (opt.tab !== false) showTab("content");
  }
  function paintSel() {
    var zone = null, hlSet = {}, zonSet = {};
    if (sel) {
      if (sel.k === "bead") { zone = BEADS[sel.n].z; var tid = BEADS[sel.n].term; ASSIGNED.forEach(function (m) { if (BEADS[m].term === tid && m !== sel.n) hlSet[m] = 1; }); }
      else if (sel.k === "spacer" || sel.k === "zone") zone = sel.z;
      else if (sel.k === "chapter") zonesOfChapter(sel.id).forEach(function (zn) { zn.terms.forEach(function (_, i) { hlSet[zn.first + i] = 1; zonSet[zn.first + i] = 1; }); });
    }
    svg.classList.toggle("dimmed", !!sel && sel.k !== "part" && sel.k !== "extra");
    svg.querySelectorAll(".bead,.part").forEach(function (el) {
      var n = +el.getAttribute("data-n"), on = false, hl = false, sl = false;
      if (n) {
        if (zone != null && BEADS[n].z === zone) on = true;
        if (zonSet[n]) on = true;
        if (hlSet[n]) hl = true;
        if (sel && sel.k === "bead" && sel.n === n) sl = true;
        if (sel && sel.k === "spacer" && D.zones[sel.z].spacerNo === n) sl = true;
      } else { var a = el.getAttribute("data-act"); if (sel && sel.k === "part" && a === "part:" + sel.id) sl = true; }
      el.classList.toggle("zon", on); el.classList.toggle("hl", hl); el.classList.toggle("sel", sl);
    });
  }

  /* ---------- 面板 ---------- */
  function chipsForChapters(list) {
    return '<div class="chips">' + list.map(function (c) {
      var ch = chById[c.id];
      return '<button class="chip" data-go="chapter:' + ch.id + '">第' + ch.no + "章 " + esc(ch.title) + (c.partial ? " <small>（部分內容）</small>" : "") + "</button>";
    }).join("") + "</div>";
  }
  function pendBlock() { return '<h3>正文・解說・出處</h3><p class="pend">正文待補。（解說、出處、相關名相欄位已預留於 data/content.js。）</p>'; }
  function zoneHead(zn) { return '<p class="crumb zone-' + zn.id + '">' + esc(zn.name) + "區 ・ 數珠 " + zn.first + "–" + zn.last + "，隔珠 " + zn.spacerNo + "</p>"; }
  function zoneBody(zn) {
    var h = "<h3>分類說明 " + tag("nav") + '</h3><div class="box"><p>' + esc(zn.summary) + "</p><p>核心：" + esc(zn.core) + "</p></div>";
    h += '<h3>相關名相（已配置珠位）</h3><div class="chips">' + zn.terms.map(function (tid, i) {
      var n = zn.first + i;
      return '<button class="chip" data-go="bead:' + n + '">' + (i + 1) + ". " + esc(termById[tid].name) + " <small>珠" + n + "</small></button>";
    }).join("") + "</div>";
    h += '<p class="pend" style="font-size:.88rem">本區 26 個珠位中，已配置 ' + zn.terms.length + " 個，其餘 " + (26 - zn.terms.length) + " 個待配置。</p>";
    h += "<h3>主要對應章 " + tag("nav") + '</h3><p style="margin:.2em 0;font-size:.92rem">' + esc(zn.mainNote) + "</p>" + chipsForChapters(zn.chapters);
    return h;
  }
  function renderPanel() {
    var el = $("#pane-content"), h = "";
    if (!sel) {
      h = '<p class="crumb">總覽</p><h2>請選取念珠、文字或目次</h2>' +
        "<p>點「見、修、行、果」隔珠或標籤，查看該區名相；點已配置的數珠，念珠會轉動並把它停在畫面中央；或切到「原書目次」按章瀏覽。左右切換只會在已配置內容的珠位間移動。</p>" +
        '<h3>四個區段</h3><div class="chips">' + D.zones.map(function (zn) { return '<button class="chip zone-' + zn.id + '" data-go="zone:' + zn.idx + '">' + esc(zn.name) + " 區 <small>" + zn.first + "–" + zn.last + "</small></button>"; }).join("") + "</div>" +
        '<div class="notice">環上 108 顆＝104 顆普通數珠＋4 顆隔珠（編號 27、54、81、108）；佛頭珠另計，與第四隔珠是不同部件。「見修行果」是本網站的導覽分類，不是引文原意。</div>';
    } else if (sel.k === "bead") {
      var b = BEADS[sel.n], zn = D.zones[b.z], t = termById[b.term];
      h = zoneHead(zn) + "<h2>" + esc(t.name) + "</h2>" +
        '<p class="pos">' + esc(zn.name) + "區 第 " + b.pos + "／26 珠 ・ 環上編號 " + sel.n + "／108 ・ 已配置 " + (zn.terms.indexOf(b.term) + 1) + "／" + zn.terms.length + " " + tag("nav") + "</p>";
      h += "<h3>名相 " + tag("nav") + '</h3><div class="box">' + esc(t.name) + "</div>";
      h += "<h3>所屬章（區段層級對應）</h3>" + chipsForChapters(zn.chapters);
      h += '<div class="notice">此名相與各章、節、目的細部對應尚待確認。上列為「' + esc(zn.name) + "」區所列之主要對應章（" + esc(zn.mainNote) + "），不代表該名相出自每一章。</div>";
      if (t.note) h += '<div class="notice">' + esc(t.note) + "</div>";
      var others = ASSIGNED.filter(function (m) { return BEADS[m].term === b.term && m !== sel.n; });
      if (others.length) h += '<h3>同一名相亦見於</h3><div class="chips">' + others.map(function (m) { return '<button class="chip" data-go="bead:' + m + '">' + esc(D.zones[BEADS[m].z].name) + "區 ・ 珠" + m + "</button>"; }).join("") + "</div>";
      h += pendBlock();
      h += '<p><button class="chip" data-go="zone:' + zn.idx + '">查看「' + esc(zn.name) + "」區全部名相</button></p>";
    } else if (sel.k === "spacer" || sel.k === "zone") {
      var z2 = D.zones[sel.z];
      if (sel.k === "spacer") {
        h = zoneHead(z2) + "<h2>" + z2.spacerName + "：" + esc(z2.spacerTitle) + "</h2>" +
          '<p class="pos">環上編號 ' + z2.spacerNo + "／108 ・ 代表其前 26 顆普通數珠（" + z2.first + "–" + z2.last + "）</p>";
        h += "<h3>原文的隔珠譬喻 " + tag("quote") + '</h3><div class="box">以風瑜伽為隔珠</div>';
        h += '<div class="notice">引文原本只說「以風瑜伽為隔珠」。將四顆隔珠分別設為「見、修、行、果」，是本網站的導覽安排，並非引文本身的說法。' + (sel.z === 1 ? "（第二隔珠標示「修（風瑜伽）」，與原文的風瑜伽相呼應。）" : "") + "</div>";
      } else h = zoneHead(z2) + "<h2>" + esc(z2.name) + "　區</h2>";
      h += zoneBody(z2);
    } else if (sel.k === "part") {
      var pt0 = D.parts[sel.id];
      h = '<p class="crumb">念珠部件</p><h2>' + esc(pt0.title) + "</h2><h3>譬喻 " + tag(pt0.src) + '</h3><div class="box">' + esc(pt0.text) + "</div>";
      if (sel.id === "bead") h += '<p>環上共 108 顆：104 顆普通數珠＋4 顆隔珠。每 26 顆普通數珠之後接 1 顆隔珠。普通數珠上的名相配置見四區說明。</p><div class="chips">' + D.zones.map(function (zn) { return '<button class="chip" data-go="zone:' + zn.idx + '">' + esc(zn.name) + " 區 " + zn.first + "–" + zn.last + "</button>"; }).join("") + "</div>";
      if (sel.id === "head") h += '<div class="notice">佛頭珠位於第四隔珠（環上第 108 顆）上方，是另計的 1 顆，不可與第四隔珠合併。</div>';
      if (sel.id === "string") h += '<div class="notice">串繩連續貫穿環上 108 顆珠子。</div>';
      h += '<p class="pend">此為引文中的譬喻說明；進一步解說待補。</p>';
    } else if (sel.k === "chapter") {
      var c = chById[sel.id], zs = zonesOfChapter(c.id);
      h = '<p class="crumb">原書目次 ・ 第 ' + c.no + " 章 " + tag("book") + "</p><h2>第" + c.no + "章 " + esc(c.title) + "</h2>";
      if (c.volumes) h += '<p class="pos">' + esc(c.volumes) + "</p>";
      h += "<h3>節、目、頁碼 " + tag("book") + "</h3>";
      if (c.sections) {
        h += '<ul class="toc" style="margin:0">' + c.sections.map(function (s) { return '<li class="sub" style="padding-left:0;color:var(--fg)">' + esc(s.no) + " " + esc(s.title) + '　<small class="pend">' + esc(s.volume) + "；頁碼待補</small></li>"; }).join("") + "</ul>";
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
      h = '<p class="crumb">原書目次入口 ' + tag("book") + "</p><h2>" + esc(x.title) + '</h2><p class="pend">目前僅有目次入口；內容與頁碼待補。</p>';
    }
    el.innerHTML = h;
  }

  /* ---------- 目次 ---------- */
  function buildToc() {
    var h = '<p class="pend" style="font-size:.88rem;margin-top:0">已提供的章名皆列於此；各章的輯別、節、目、頁碼待補，未提供者不猜補。圓點為本站導覽分類。</p><ul class="toc">';
    D.chapters.forEach(function (c) {
      var zs = zonesOfChapter(c.id);
      h += '<li><button class="row" data-go="chapter:' + c.id + '"><span class="n">' + c.no + "</span><span>" + esc(c.title) + '</span><span class="dots">' +
        zs.map(function (zn) { return '<b style="background:' + ZCOLOR[zn.id] + '" title="' + zn.name + '">' + zn.name + "</b>"; }).join("") + "</span></button>";
      if (c.volumes) h += '<div class="sub" style="padding-bottom:4px">' + esc(c.volumes) + "</div>";
      if (c.sections) h += c.sections.map(function (s) { return '<div class="sub">' + esc(s.no) + " " + esc(s.title) + "（" + esc(s.volume) + "）</div>"; }).join("");
      if (c.volumeNote) h += '<div class="sub">' + esc(c.volumeNote) + "</div>";
      h += "</li>";
    });
    h += '</ul><h4>其他目次入口</h4><ul class="toc">' + D.extras.map(function (x) { return '<li><button class="row" data-go="extra:' + x.id + '"><span>' + esc(x.title) + '</span><span class="dots pend">待補</span></button></li>'; }).join("") + "</ul>";
    $("#pane-toc").innerHTML = h;
    $("#chsel").innerHTML = '<option value="">— 選擇章節 —</option>' + D.chapters.map(function (c) { return '<option value="chapter:' + c.id + '">第' + c.no + "章 " + esc(c.title) + "</option>"; }).join("") +
      D.extras.map(function (x) { return '<option value="extra:' + x.id + '">' + esc(x.title) + "</option>"; }).join("");
  }
  function syncToc() {
    document.querySelectorAll("#pane-toc .row").forEach(function (b) {
      b.classList.toggle("on", !!(sel && (sel.k === "chapter" || sel.k === "extra") && b.getAttribute("data-go") === sel.k + ":" + sel.id));
    });
    $("#chsel").value = sel && (sel.k === "chapter" || sel.k === "extra") ? sel.k + ":" + sel.id : "";
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
    var pick;
    if (d > 0) { pick = ASSIGNED.filter(function (m) { return m > cur; })[0]; if (!pick) pick = ASSIGNED[0]; }
    else { var lo = ASSIGNED.filter(function (m) { return m < cur; }); pick = lo.length ? lo[lo.length - 1] : ASSIGNED[ASSIGNED.length - 1]; }
    select({ k: "bead", n: pick });
  }

  function init() {
    $("#quote").textContent = D.quote;
    try { buildToc(); } catch (e) { console.error(e); }
    try {
      buildSvg();
      $("#partbar").innerHTML = ["bead", "head", "tassel", "string"].map(function (kk) { return '<button type="button" data-go="part:' + kk + '">' + esc(D.parts[kk].title.replace(/（.*$/, "")) + "說明</button>"; }).join("") +
        D.zones.map(function (zn) { return '<button type="button" data-go="spacer:' + zn.idx + '">' + zn.spacerName + "・" + esc(zn.spacerTitle) + "</button>"; }).join("");
      layout(); camTarget = camFor(null); cam = Object.assign({}, camTarget); render(); drawGalaxy(0);
      window.addEventListener("resize", layout);
      if (window.ResizeObserver) new ResizeObserver(layout).observe(stage);
      requestAnimationFrame(frame);
    } catch (e) {
      console.error(e);
      stage.innerHTML = '<p style="padding:90px 24px">念珠圖載入失敗，請改用「原書目次」閱讀。</p>';
    }
    renderPanel();
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-go],[data-act]"); if (!t) return;
      var s = t.getAttribute("data-go") || t.getAttribute("data-act"); if (s) go(s);
    });
    stage.addEventListener("pointermove", function () { hold = performance.now() + 2000; });
    stage.addEventListener("pointerdown", function () { hold = performance.now() + 3000; });
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
    function setMotion(off) { paused = off; svg.classList.toggle("still", off); mb.setAttribute("aria-pressed", off); mb.textContent = off ? "恢復動態" : "暫停動態"; }
    mb.onclick = function () { setMotion(!paused); };
    var lb = $("#lines");
    lb.onclick = function () { var off = !svg.classList.contains("nolines"); svg.classList.toggle("nolines", off); lb.setAttribute("aria-pressed", !off); lb.textContent = off ? "引線：關" : "引線：開"; };
    if (reduce) setMotion(true);
    var m = /^#(bead|spacer|zone|part|ch|x)-(.+)$/.exec(location.hash);
    if (m) {
      var kk = { ch: "chapter", x: "extra" }[m[1]] || m[1], v = kk === "extra" ? "x-" + m[2] : m[2];
      if (kk === "chapter" ? chById[v] : kk === "extra" ? extraById[v] : true) {
        if (kk === "bead" && (!BEADS[+v] || !BEADS[+v].term)) return;
        go(kk + ":" + v, { hash: false });
      }
    }
  }
  init();
})();
