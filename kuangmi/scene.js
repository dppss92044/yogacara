/* 念珠 3D 層（three.js）：寫實念珠、微微飄動、點選轉動拉近、引線與文字入口。
 * 內容與珠位模型由 app.js（KM）提供；本檔只負責畫面。 */
(function () {
  "use strict";
  var API = (window.KM3D = {});
  var T = window.THREE, G = window.gsap;
  var KM, D, host, stage, renderer, scene, camera, floatGroup, malaGroup;
  var R = 24, TAU = Math.PI * 2, FOV = 32, REST = Math.PI;
  var RB = 0.6, RS = 0.66, RG = 0.95;               // 普通珠、隔珠、佛頭珠半徑
  var W = 1, H = 1, narrow = false, offX = 0, offY = 0;
  var beads = [], guru, stupa, tassel, tasselHit, cord, ringLocal = [];
  var paused = false, reduce = false, selected = null, focused = false;
  var hover = null, down = null, tt = 0, rotTween = null, built = false, camTarget = new T.Vector3();
  var labelDefs = [], leaders, labelsBox, calloutEl, fanBox, quoteEl, marks;
  var tmp = new T.Vector3(), tmp2 = new T.Vector3();
  var cands = [];
  var SVGNS = "http://www.w3.org/2000/svg";

  /* ---------- 材質貼圖（以程式繪製，不用外部圖片） ---------- */
  function canvas(w, h) { var c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function bodhiMaps() { // 星月菩提子：象牙底色、深色星點、一端月形凹痕、兩端孔眼
    var w = 1024, h = 512, c = canvas(w, h), g = c.getContext("2d"), b = canvas(w, h), gb = b.getContext("2d"), i;
    g.fillStyle = "#e6d5b2"; g.fillRect(0, 0, w, h); gb.fillStyle = "#808080"; gb.fillRect(0, 0, w, h);
    for (i = 0; i < 6000; i++) { g.fillStyle = Math.random() < .5 ? "rgba(255,250,235,.10)" : "rgba(120,90,50,.06)"; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    for (i = 0; i < 420; i++) { // 星點
      var v = rnd(0.13, 0.9), y = v * h, lat = Math.sin(v * Math.PI), x = Math.random() * w, r = rnd(1.4, 3.6);
      g.fillStyle = "rgba(96,64,34," + rnd(.55, .9) + ")"; g.beginPath(); g.ellipse(x, y, r / Math.max(lat, .25), r, 0, 0, TAU); g.fill();
      gb.fillStyle = "#3a3a3a"; gb.beginPath(); gb.ellipse(x, y, r / Math.max(lat, .25), r, 0, 0, TAU); gb.fill();
    }
    // 月：上端一圈較深的凹痕
    var gr = g.createLinearGradient(0, 0, 0, h * 0.16); gr.addColorStop(0, "rgba(60,40,22,1)"); gr.addColorStop(.28, "rgba(60,40,22,1)"); gr.addColorStop(.32, "rgba(150,115,70,.9)"); gr.addColorStop(.75, "rgba(175,140,95,.55)"); gr.addColorStop(1, "rgba(175,140,95,0)");
    g.fillStyle = gr; g.fillRect(0, 0, w, h * 0.16);
    gb.fillStyle = "#202020"; gb.fillRect(0, 0, w, h * 0.06); gb.fillStyle = "#555"; gb.fillRect(0, h * 0.06, w, h * 0.07);
    // 下端孔眼
    var gr2 = g.createLinearGradient(0, h, 0, h * 0.93); gr2.addColorStop(0, "rgba(55,38,20,1)"); gr2.addColorStop(.5, "rgba(55,38,20,1)"); gr2.addColorStop(1, "rgba(150,115,70,0)");
    g.fillStyle = gr2; g.fillRect(0, h * 0.93, w, h * 0.07); gb.fillStyle = "#202020"; gb.fillRect(0, h * 0.96, w, h * 0.04);
    var mt = new T.CanvasTexture(c); mt.encoding = T.sRGBEncoding; mt.anisotropy = 4;
    return { map: mt, bump: new T.CanvasTexture(b) };
  }
  function agateMap() { // 暗紅瑪瑙：深紅底、柔和層紋、兩端孔眼
    var w = 512, h = 256, c = canvas(w, h), g = c.getContext("2d"), i, k;
    g.fillStyle = "#4e0d0d"; g.fillRect(0, 0, w, h);
    for (i = 0; i < 26; i++) {
      var y0 = rnd(0.12, 0.88) * h, amp = rnd(4, 14), fr = rnd(1, 3), ph = rnd(0, TAU);
      g.strokeStyle = Math.random() < .5 ? "rgba(120,30,24," + rnd(.12, .28) + ")" : "rgba(26,3,3," + rnd(.2, .4) + ")";
      g.lineWidth = rnd(2, 9); g.beginPath();
      for (k = 0; k <= w; k += 8) { var yy = y0 + Math.sin(k / w * TAU * fr + ph) * amp; if (k === 0) g.moveTo(k, yy); else g.lineTo(k, yy); }
      g.stroke();
    }
    g.fillStyle = "#170303"; g.fillRect(0, 0, w, h * 0.05); g.fillRect(0, h * 0.95, w, h * 0.05);
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  }
  function silkMap() { // 飾穗絲線：細密直紋
    var w = 256, h = 64, c = canvas(w, h), g = c.getContext("2d");
    g.fillStyle = "#7a1414"; g.fillRect(0, 0, w, h);
    for (var x = 0; x < w; x += 2) { g.fillStyle = "rgba(" + (Math.random() < .5 ? "190,60,50" : "50,6,6") + "," + rnd(.15, .5) + ")"; g.fillRect(x, 0, 1, h); }
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(3, 1); return t;
  }

  function wrapNear(target, cur) { var d = (((target - cur) % TAU) + 3 * Math.PI) % TAU - Math.PI; return cur + d; }
  function toScreen(v) { tmp2.copy(v).project(camera); return { x: (tmp2.x * .5 + .5) * W, y: (-tmp2.y * .5 + .5) * H, z: tmp2.z }; }
  function pxPerUnit(p) { return (H / 2) / (Math.tan(FOV * Math.PI / 360) * camera.position.distanceTo(p)); }
  function aEff() { return Math.max(0.5, (W - (narrow ? 0 : 2 * offX)) / H); }

  /* ---------- 建構 ---------- */
  API.init = function (km) {
    G.ticker.lagSmoothing(0); // 低效能裝置上動畫仍依實際時間完成
    KM = km; D = km.D;
    host = document.getElementById("canvas-container"); stage = document.getElementById("stage");
    leaders = document.getElementById("leaders"); labelsBox = document.getElementById("labels");
    calloutEl = document.getElementById("callout"); fanBox = document.getElementById("fan"); quoteEl = document.getElementById("main-quote");
    reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return false; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.92;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.VSMShadowMap;
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    scene = new T.Scene();
    if (T.RoomEnvironment) { var pm = new T.PMREMGenerator(renderer); scene.environment = pm.fromScene(new T.RoomEnvironment(), 0.04).texture; }
    camera = new T.PerspectiveCamera(FOV, 1, 0.5, 600);
    scene.add(new T.HemisphereLight(0xfff8ee, 0xd8c8ad, 0.55));
    var key = new T.DirectionalLight(0xfff1dc, 1.15); key.position.set(6, 44, 10); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 14; var sc = key.shadow.camera; sc.left = sc.bottom = -34; sc.right = sc.top = 34; sc.near = 5; sc.far = 100; key.shadow.bias = -0.0005;
    scene.add(key);
    var fill = new T.DirectionalLight(0xe8eeff, 0.35); fill.position.set(-20, 12, -10); scene.add(fill);
    var ground = new T.Mesh(new T.PlaneGeometry(300, 300), new T.ShadowMaterial({ opacity: 0.08 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -9; ground.receiveShadow = true; scene.add(ground);

    buildMala(); buildOverlay();
    resize();
    camera.position.copy(overviewPos()); camTarget.copy(overviewTarget()); camera.lookAt(camTarget);
    malaGroup.rotation.y = REST; // 第 108 顆在後方，佛頭珠在其外側，畫面上位於其上方

    var el = renderer.domElement;
    el.addEventListener("pointermove", onMove); el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp); el.addEventListener("pointerleave", function () { setHover(null); });
    el.addEventListener("pointercancel", function () { down = null; });
    window.addEventListener("resize", resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(host);
    built = true;
    requestAnimationFrame(loop);
    return true;
  };

  function buildMala() {
    floatGroup = new T.Group(); scene.add(floatGroup);
    malaGroup = new T.Group(); floatGroup.add(malaGroup);
    var bm = bodhiMaps(), ag = agateMap(), Y = new T.Vector3(0, 1, 0);
    var geoB = new T.SphereGeometry(RB, 32, 20), geoS = new T.SphereGeometry(RS, 32, 20);
    var agate = new T.MeshPhysicalMaterial({ map: ag, roughness: 0.16, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.9 });
    for (var n = 1; n <= 108; n++) {
      var b = KM.BEADS[n], th = TAU * n / 108, mat;
      if (b.spacer) mat = agate;
      else {
        mat = new T.MeshStandardMaterial({ map: bm.map, bumpMap: bm.bump, bumpScale: 0.025, roughness: 0.5, metalness: 0, envMapIntensity: 0.55 });
        // 已配置：略帶蜜色（盤玩後的色澤）；待配置：較淺淡、低調
        if (b.term) mat.color.setHSL(0.09, 0.5, rnd(0.74, 0.8)).convertSRGBToLinear(); else mat.color.setHSL(0.1, 0.18, 0.96).convertSRGBToLinear();
      }
      var m = new T.Mesh(b.spacer ? geoS : geoB, mat); m.castShadow = true;
      m.position.set(Math.sin(th) * R, 0, Math.cos(th) * R);
      var tan = new T.Vector3(Math.cos(th), 0, -Math.sin(th));        // 孔眼沿串繩方向
      m.quaternion.setFromUnitVectors(Y, tan);
      m.rotateY(rnd(0, TAU));
      malaGroup.add(m);
      var o = { n: n, mesh: m, spacer: b.spacer, z: b.z, assigned: !!b.term, r: b.spacer ? RS : RB };
      beads[n] = o;
      if (b.term || b.spacer) cands.push({ act: b.spacer ? "spacer:" + b.z : "bead:" + n, obj: m, rad: (b.spacer ? RS : RB) * 1.15, bead: o });
    }
    // 串繩：深紅絲繩，連續貫穿所有珠心
    var cordMat = new T.MeshStandardMaterial({ color: new T.Color(0x6e2218).convertSRGBToLinear(), roughness: 0.75, metalness: 0 });
    cord = new T.Mesh(new T.TorusGeometry(R, 0.075, 10, 480), cordMat); cord.rotation.x = Math.PI / 2; cord.castShadow = true; malaGroup.add(cord);
    for (var i = 0; i < 160; i++) { var a = i / 160 * TAU; ringLocal.push(new T.Vector3(Math.sin(a) * R, 0, Math.cos(a) * R)); }

    // 佛頭珠：在第 108 顆（local 角度 0 → (0,0,R)）外側，以短繩相連；靜止時第 108 顆在後方，佛頭珠在其上方
    var gz = R + RB + RG + 0.18;
    var gc = new T.Mesh(new T.CylinderGeometry(0.075, 0.075, gz - R, 10), cordMat); gc.rotation.x = Math.PI / 2; gc.position.set(0, 0, R + (gz - R) / 2); malaGroup.add(gc);
    guru = new T.Mesh(new T.SphereGeometry(RG, 56, 40), agate); guru.position.set(0, 0, gz); guru.castShadow = true;
    guru.quaternion.setFromUnitVectors(Y, new T.Vector3(0, 0, 1)); malaGroup.add(guru);
    cands.push({ act: "part:head", obj: guru, rad: RG * 1.2 });
    // 佛塔（佛頭珠上的小塔形件）
    var brass = new T.MeshStandardMaterial({ color: new T.Color(0xb48a3c).convertSRGBToLinear(), roughness: 0.32, metalness: 0.85, envMapIntensity: 1 });
    var prof = [[0, 0], [0.42, 0], [0.46, 0.08], [0.3, 0.22], [0.36, 0.34], [0.22, 0.5], [0.16, 0.72], [0.1, 0.86], [0, 0.92]].map(function (p) { return new T.Vector2(p[0], p[1]); });
    stupa = new T.Mesh(new T.LatheGeometry(prof, 32), brass); stupa.castShadow = true;
    stupa.rotation.x = Math.PI / 2; stupa.position.set(0, 0, gz + RG - 0.06); malaGroup.add(stupa);
    // 飾穗：接在佛塔外端，向外伸出並略為下垂、隨風輕擺
    tassel = new T.Group(); tassel.position.set(0, 0, gz + RG + 0.82); malaGroup.add(tassel);
    var silk = new T.MeshStandardMaterial({ map: silkMap(), color: 0xffffff, roughness: 0.45, metalness: 0.05 });
    var knot = new T.Mesh(new T.SphereGeometry(0.24, 20, 16), silk); tassel.add(knot);
    var collar = new T.Mesh(new T.CylinderGeometry(0.27, 0.27, 0.42, 24), brass); collar.rotation.x = Math.PI / 2; collar.position.z = 0.34; tassel.add(collar);
    // 穗身：內芯＋一束細絲線（InstancedMesh），末端自然散開
    var bp = []; for (var j = 0; j <= 16; j++) { var u = j / 16; bp.push(new T.Vector2(0.15 + u * 0.16, u * 2.3)); }
    var core = new T.Mesh(new T.LatheGeometry(bp, 32), silk); core.rotation.x = Math.PI / 2; core.position.z = 0.55; tassel.add(core);
    var NS = 110, strandMat = new T.MeshStandardMaterial({ color: new T.Color(0x6e1210).convertSRGBToLinear(), roughness: 0.42, metalness: 0.05 });
    var strands = new T.InstancedMesh(new T.CylinderGeometry(0.022, 0.022, 1, 5), strandMat, NS), mtx = new T.Matrix4(), q = new T.Quaternion(), Yv = new T.Vector3(0, 1, 0);
    for (var si = 0; si < NS; si++) {
      var sa = si / NS * TAU + rnd(-0.05, 0.05), r0 = 0.17 * Math.sqrt(Math.random()), r1 = 0.2 + Math.pow(Math.random(), 0.6) * 0.3, len = rnd(2.55, 2.85);
      var p0 = new T.Vector3(Math.cos(sa) * r0, Math.sin(sa) * r0, 0.55), p1 = new T.Vector3(Math.cos(sa) * r1, Math.sin(sa) * r1, 0.55 + len);
      var dir = p1.clone().sub(p0), L = dir.length(); q.setFromUnitVectors(Yv, dir.normalize());
      mtx.compose(p0.clone().add(p1).multiplyScalar(0.5), q, new T.Vector3(1, L, 1)); strands.setMatrixAt(si, mtx);
    }
    strands.castShadow = true; tassel.add(strands);
    tassel.rotation.x = 0.32;
    tasselHit = new T.Object3D(); tasselHit.position.set(0, 0, 2.2); tassel.add(tasselHit);
    cands.push({ act: "part:tassel", obj: tasselHit, rad: 1.6 });
  }

  /* ---------- 疊層：文字入口、引線、標記 ---------- */
  function buildOverlay() {
    function add(id, act, text, anchor, dir, off) { labelDefs.push({ id: id, act: act, text: text, anchor: anchor, dir: dir, off: off }); }
    var ringW = function (n, rr) { return function (out) { var th = TAU * n / 108; out.set(Math.sin(th) * (rr || R), 0, Math.cos(th) * (rr || R)); return malaGroup.localToWorld(out); }; };
    add("head", "part:head", "佛頭珠", function (o) { return guru.getWorldPosition(o); }, [-1, -0.2], 40);
    add("tassel", "part:tassel", "佛頭珠飾穗", function (o) { return tasselHit.getWorldPosition(o); }, [1, -0.3], 40);
    D.zones.forEach(function (zn, zi) {
      add("sp" + zi, "spacer:" + zi, "隔珠" + "一二三四".charAt(zi) + "・" + zn.name, ringW(zn.spacerNo), zi === 3 ? [1, 0.5] : null, 34);
      add("zn" + zi, "zone:" + zi, zn.name + "　" + zn.first + "–" + zn.last, ringW(zi * 27 + 13.5), null, 48);
    });
    add("bead", "part:bead", "普通數珠 104 顆", ringW(40), "in", 70);
    add("string", "part:string", "串繩", ringW(67.5), "in", 70);
    labelDefs.forEach(function (d) {
      var b = document.createElement("button"); b.type = "button"; b.className = "lab"; b.textContent = d.text; b.setAttribute("data-act", d.act);
      b.addEventListener("click", function () { KM.go(d.act); });
      labelsBox.appendChild(b); d.el = b;
      var p = document.createElementNS(SVGNS, "path"); leaders.appendChild(p); d.path = p;
    });
    marks = document.createElementNS(SVGNS, "g"); marks.setAttribute("class", "marks"); leaders.appendChild(marks);
  }

  /* ---------- 版面 ---------- */
  function overviewPos() { var f = Math.max(1, 1.42 / aEff()); return new T.Vector3(0, 46 * f, 72 * f); }
  function overviewTarget() { return new T.Vector3(0, -1, -2.5); }
  function resize() {
    if (!renderer) return;
    W = host.clientWidth || 800; H = host.clientHeight || 600; narrow = W < 760;
    var panel = document.getElementById("panel");
    offX = (!narrow && panel) ? (panel.offsetWidth + 32) / 2 : 0; offY = narrow ? 0 : 50;
    renderer.setSize(W, H);
    camera.aspect = W / H; camera.setViewOffset(W, H, offX, offY, W, H); camera.updateProjectionMatrix();
    labelsBox.style.display = narrow ? "none" : "";
    if (built && !selected) { G.killTweensOf(camera.position); G.killTweensOf(camTarget); camera.position.copy(overviewPos()); camTarget.copy(overviewTarget()); }
  }

  /* ---------- 選取 → 緩轉與拉近 ---------- */
  var FOCUS_KINDS = { bead: 1, spacer: 1, zone: 1 };
  API.setSelection = function (sel) {
    if (!built) return;
    selected = sel;
    focused = !!sel && (FOCUS_KINDS[sel.k] || (sel.k === "part" && (sel.id === "head" || sel.id === "tassel")));
    var dur = reduce ? 0.01 : 1.6, camTo, tgtTo, rotTo = REST;
    var f = Math.max(1, 1.5 / aEff());
    if (sel && sel.k === "bead") rotTo = -TAU * sel.n / 108;
    else if (sel && sel.k === "spacer") rotTo = -TAU * D.zones[sel.z].spacerNo / 108;
    else if (sel && sel.k === "zone") rotTo = -TAU * (D.zones[sel.z].first + 13) / 108;
    else if (sel && sel.k === "part" && (sel.id === "head" || sel.id === "tassel")) rotTo = 0;
    if (sel && (sel.k === "bead" || sel.k === "spacer")) { camTo = new T.Vector3(0, 6.5, R + 10.5); tgtTo = new T.Vector3(0, 0, R); }
    else if (sel && sel.k === "zone") { camTo = new T.Vector3(0, 20 * f, R + 26 * f); tgtTo = new T.Vector3(0, 0, R - 6); }
    else if (sel && sel.k === "part" && (sel.id === "head" || sel.id === "tassel")) { camTo = new T.Vector3(0, 10, R + 20); tgtTo = new T.Vector3(0, -0.6, R + 3.2); }
    else { camTo = overviewPos(); tgtTo = overviewTarget(); }
    G.killTweensOf(camera.position); G.killTweensOf(camTarget); if (rotTween) rotTween.kill();
    rotTween = G.to(malaGroup.rotation, { y: wrapNear(rotTo, malaGroup.rotation.y), duration: dur, ease: "power2.inOut" });
    G.to(camTarget, { x: tgtTo.x, y: tgtTo.y, z: tgtTo.z, duration: dur, ease: "power2.inOut" });
    G.to(camera.position, { x: camTo.x, y: camTo.y, z: camTo.z, duration: dur, ease: "power2.inOut" });
    quoteEl.classList.toggle("hide", !!focused && !narrow);
    labelsBox.classList.toggle("hide", !!focused);
    buildFocusUI();
  };

  /* ---------- 聚焦文字：名稱、章名引線 ---------- */
  var fanItems = [], selInfo = null, focusPaths = [];
  function buildFocusUI() {
    fanBox.innerHTML = ""; focusPaths.forEach(function (p) { p.remove(); }); focusPaths = []; fanItems = []; selInfo = null;
    calloutEl.classList.remove("on");
    var s = selected; if (!s || (s.k !== "bead" && s.k !== "spacer")) return;
    var n, zn, name, sub;
    if (s.k === "bead") { var b = KM.BEADS[s.n]; n = s.n; zn = D.zones[b.z]; name = KM.termById[b.term].name; sub = zn.name + "區　第 " + b.pos + "／26 珠　環上 " + n + "／108"; }
    else { zn = D.zones[s.z]; n = zn.spacerNo; name = "隔珠" + "一二三四".charAt(s.z) + "：" + zn.spacerTitle; sub = "環上 " + n + "／108　代表其前 26 顆數珠"; }
    calloutEl.innerHTML = "<b>" + KM.esc(name) + "</b><small>" + KM.esc(sub) + "</small>";
    selInfo = { n: n };
    var cp = document.createElementNS(SVGNS, "path"); leaders.appendChild(cp); selInfo.cpath = cp; focusPaths.push(cp);
    if (narrow) return;
    zn.chapters.forEach(function (c) {
      var ch = KM.chById[c.id], t = "第" + ch.no + "章　" + ch.title + (c.partial ? "（部分內容）" : "");
      var b2 = document.createElement("button"); b2.type = "button"; b2.className = "fl"; b2.textContent = t;
      b2.addEventListener("click", function () { KM.go("chapter:" + ch.id); });
      fanBox.appendChild(b2);
      var p = document.createElementNS(SVGNS, "path"); leaders.appendChild(p); focusPaths.push(p);
      fanItems.push({ el: b2, path: p });
    });
  }

  function circle(x, y, r, cls) { var c = document.createElementNS(SVGNS, "circle"); c.setAttribute("cx", x.toFixed(1)); c.setAttribute("cy", y.toFixed(1)); c.setAttribute("r", r.toFixed(1)); c.setAttribute("class", cls); marks.appendChild(c); }
  function updateOverlays() {
    var ctr = toScreen(malaGroup.getWorldPosition(tmp));
    if (!narrow && !focused) {
      labelDefs.forEach(function (d) {
        d.anchor(tmp); var a = toScreen(tmp), dx, dy;
        if (Array.isArray(d.dir)) { dx = d.dir[0]; dy = d.dir[1]; }
        else { dx = a.x - ctr.x; dy = a.y - ctr.y; if (d.dir === "in") { dx = -dx; dy = -dy; } }
        var m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
        var lx = a.x + dx * d.off, ly = a.y + dy * d.off, tx = dx > 0.35 ? "0" : dx < -0.35 ? "-100%" : "-50%";
        d.el.style.transform = "translate(" + lx.toFixed(1) + "px," + ly.toFixed(1) + "px) translate(" + tx + ",-50%)";
        var r0 = (d.id === "head" ? RG : d.id === "tassel" ? 0.4 : RS) * pxPerUnit(tmp) + 3;
        d.path.setAttribute("d", "M" + (a.x + dx * r0).toFixed(1) + " " + (a.y + dy * r0).toFixed(1) + " L" + (lx - dx * 4).toFixed(1) + " " + (ly - dy * 4).toFixed(1));
        d.path.style.display = "";
      });
    } else labelDefs.forEach(function (d) { d.path.style.display = "none"; });

    // 標記：選取圈、區段弧、章節對應點
    marks.innerHTML = "";
    var s = selected, zone = null, chSet = null;
    if (s && s.k === "zone") zone = s.z;
    if (s && s.k === "chapter") { chSet = []; KM.zonesOfChapter(s.id).forEach(function (zn) { zn.terms.forEach(function (_, i) { chSet.push(zn.first + i); }); }); }
    if (zone != null) {
      var zn = D.zones[zone], pts = [];
      for (var n = zn.first; n <= zn.spacerNo; n++) { var th = TAU * n / 108; tmp.set(Math.sin(th) * (R + 1.5), 0, Math.cos(th) * (R + 1.5)); malaGroup.localToWorld(tmp); var q = toScreen(tmp); pts.push(q.x.toFixed(1) + " " + q.y.toFixed(1)); }
      var arc = document.createElementNS(SVGNS, "path"); arc.setAttribute("d", "M" + pts.join(" L")); arc.setAttribute("class", "zarc"); marks.appendChild(arc);
    }
    if (chSet) chSet.forEach(function (n) { var th = TAU * n / 108; tmp.set(Math.sin(th) * (R + 1.3), 0, Math.cos(th) * (R + 1.3)); malaGroup.localToWorld(tmp); var q = toScreen(tmp); circle(q.x, q.y, 3.2, "chdot"); });
    if (hover && hover.bead && !(selInfo && selInfo.n === hover.bead.n)) { hover.obj.getWorldPosition(tmp); var h = toScreen(tmp); circle(h.x, h.y, hover.rad * pxPerUnit(tmp) + 4, "hov"); }

    if (selInfo) {
      beads[selInfo.n].mesh.getWorldPosition(tmp); var sp = toScreen(tmp), cx = sp.x, cy = sp.y, rr = beads[selInfo.n].r * pxPerUnit(tmp);
      circle(cx, cy, rr + 6, "selc");
      calloutEl.classList.add("on");
      if (narrow) {
        calloutEl.style.transform = "translate(" + cx.toFixed(1) + "px," + (cy - rr - 18).toFixed(1) + "px) translate(-50%,-100%)"; calloutEl.style.textAlign = "center";
        selInfo.cpath.setAttribute("d", "");
      } else {
        calloutEl.style.transform = "translate(" + (cx - rr - 40).toFixed(1) + "px," + (cy - rr - 46).toFixed(1) + "px) translate(-100%,-100%)"; calloutEl.style.textAlign = "right";
        selInfo.cpath.setAttribute("d", "M" + (cx - (rr + 6) * 0.7) + " " + (cy - (rr + 6) * 0.7) + " L" + (cx - rr - 36) + " " + (cy - rr - 44));
      }
      fanItems.forEach(function (it, i) {
        var x = cx - rr - 60, y = cy + rr + 40 + i * 32;
        it.el.style.maxWidth = Math.max(150, x - 12).toFixed(0) + "px";
        it.el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) translate(-100%,-50%)";
        it.path.setAttribute("d", "M" + (x + 6) + " " + y + " L" + (x + 30) + " " + y + " L" + (cx - (rr + 6) * 0.7) + " " + (cy + (rr + 6) * 0.7));
      });
    }
  }

  /* ---------- 點選／懸停（以螢幕距離挑選，手機也易點） ---------- */
  function pick(cx, cy) {
    var best = null, bs = 1e9, i;
    for (i = 0; i < cands.length; i++) {
      var c = cands[i]; c.obj.getWorldPosition(tmp); var s = toScreen(tmp);
      if (s.z > 1) continue;
      var rp = Math.max(narrow ? 12 : 9, c.rad * pxPerUnit(tmp)), d = Math.hypot(s.x - cx, s.y - cy);
      if (d <= rp) { var sc = d / rp + s.z * 0.01; if (sc < bs) { bs = sc; best = c; } }
    }
    if (best) return best;
    var md = 1e9;
    for (i = 0; i < ringLocal.length; i++) { tmp.copy(ringLocal[i]); malaGroup.localToWorld(tmp); var q = toScreen(tmp); if (q.z > 1) continue; md = Math.min(md, Math.hypot(q.x - cx, q.y - cy)); }
    if (md < (narrow ? 10 : 7)) return { act: "part:string" };
    return null;
  }
  function localXY(e) { var r = renderer.domElement.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function setHover(c) { hover = c; renderer.domElement.style.cursor = c ? "pointer" : "default"; }
  function onMove(e) { if (down || e.pointerType !== "mouse") return; var p = localXY(e); setHover(pick(p.x, p.y)); }
  function onDown(e) { down = { x: e.clientX, y: e.clientY, t: performance.now() }; }
  function onUp(e) {
    if (!down) return;
    var moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t; down = null;
    if (moved > 8 || dt > 800) return;
    var p = localXY(e), c = pick(p.x, p.y); if (c) KM.go(c.act);
  }

  /* ---------- 主迴圈：微微飄動 ---------- */
  var clock = new T.Clock(), first = true;
  function loop() {
    requestAnimationFrame(loop);
    var dt = Math.min(0.05, clock.getDelta());
    var still = paused || reduce;
    if (!still) tt += dt;
    var amp = focused ? 0.35 : 1;
    floatGroup.position.y = still ? 0 : Math.sin(tt * 0.55) * 0.32 * amp;
    floatGroup.rotation.x = still ? 0 : Math.sin(tt * 0.37) * 0.012 * amp;
    floatGroup.rotation.z = still ? 0 : Math.sin(tt * 0.29 + 1.3) * 0.014 * amp;
    tassel.rotation.x = 0.32 + (still ? 0 : Math.sin(tt * 0.9) * 0.05);
    tassel.rotation.y = still ? 0 : Math.sin(tt * 0.63 + 0.5) * 0.08;
    camera.lookAt(camTarget);
    updateOverlays();
    renderer.render(scene, camera);
    if (first) { first = false; window.__kmReady = true; var l = document.getElementById("loading"); if (l) { l.style.opacity = 0; setTimeout(function () { l.style.display = "none"; }, 700); } }
  }

  /* ---------- 對外 ---------- */
  API.setPaused = function (v) { paused = !!v; };
  API.setLines = function (v) { stage.classList.toggle("nolines", !v); };
  API.screenOf = function (n) { // 供測試：物件在頁面上的座標
    var o = n === "head" ? guru : n === "tassel" ? tasselHit : beads[n].mesh; o.getWorldPosition(tmp); var s = toScreen(tmp), r = renderer.domElement.getBoundingClientRect();
    return { x: r.left + s.x, y: r.top + s.y, z: s.z };
  };
  API.stats = function () {
    var out = { beads: 0, spacers: [], axisErr: 0, minGap: 1e9 }, P = [];
    for (var n = 1; n <= 108; n++) {
      var b = beads[n]; P[n] = b.mesh.position; out.beads++; if (b.spacer) out.spacers.push(n);
      out.axisErr = Math.max(out.axisErr, Math.abs(Math.hypot(P[n].x, P[n].z) - R) + Math.abs(P[n].y));
    }
    for (var m = 1; m <= 108; m++) { var m2 = m % 108 + 1; out.minGap = Math.min(out.minGap, P[m].distanceTo(P[m2]) - beads[m].r - beads[m2].r); }
    out.guruOutside108 = Math.abs(guru.position.x - P[108].x) < 1e-6 && guru.position.z > P[108].z + RB + RG - 1e-6;
    out.tasselBeyondGuru = tassel.position.z > guru.position.z + RG;
    out.cordRadius = cord.geometry.parameters.radius;
    out.floatY = floatGroup.position.y; out.rotY = malaGroup.rotation.y;
    return out;
  };
})();
