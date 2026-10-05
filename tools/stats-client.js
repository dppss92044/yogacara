/* W001 Analytics v2 客戶端（DECISIONS D040–D060）。App 內沒有任何統計 UI（D059）。
 * 來源檔：tools/stats-client.js；由 tools/patch-w001-stats.py 注入 index.html，並把 /*W001_CFG*\/ 換成由 analytics/registry.json 產生的設定。
 * 只做：Registry 白名單內的事件（單一委派監聽器，capture／passive／isTrusted）、設定狀態時間、閱讀歸屬、搜尋與辭典摘要、匯出摘要、
 *       科判節點次數、有效使用時間（沿用 v2 引擎）與 presence 心跳。不是全域 click logger：不符 Registry selector 的操作一律丟棄。
 * 不使用任何定位 API、不讀 User-Agent、不讀寫 App 既有資料（只讀 DOM／既有 localStorage）、任何錯誤都靜默，不影響 App。
 * 控制：window 事件 hk-analytics-control，detail:{mode:'off'|'basic'|'full', presence:true|false}。DNT／GPC 一律停用。 */
(function () {
  'use strict';
  try {
    var CFG = /*W001_CFG*/null;
    if (!CFG) return;
    var BASE = 'https://yogacara-stats.dppss92044.workers.dev';
    var KEY = 'hk-anon-stat-v1', OFF = 'hk-stats-off-v1', MODE_KEY = 'hk-analytics-mode-v2', FORGET_KEY = 'hk-analytics-forget-v1';
    var IDLE_MS = 90000, READ_IDLE_MS = 60000, GAP_MS = 30 * 60000, CAP_S = 3 * 3600, ROTATE_MS = 180 * 864e5;                   // D048：匿名 ID 每 180 天輪替
    var FLUSH_MS = 300000, RETRY_MS = 300000, START_MS = 3000, TIMEOUT_MS = 8000, MAX_BODY = 7600;
    var MAX_O = 20, MAX_S = 10800, KEEP_O = 1000, KEEP_S = 1000000, KEEP_N = 100000;
    var BEAT_MIN = 20000, BEAT_MAX = 300000, BEAT_DEFAULT = 30000, BEAT_FAIL_MAX = 300000;
    var IDS = {}; CFG.ids.forEach(function (i) { IDS[i] = 1; });
    var DIMS = {}; CFG.dims.forEach(function (d) { DIMS[d.dim] = d; });
    var NSV = CFG.dv || {};

    // ---- 基本工具 ----
    function store(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); return true; } catch (e) { return false; } }
    function fetchKey(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function dnt() {
      try { return navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.msDoNotTrack === '1' || navigator.globalPrivacyControl === true; } catch (e) { return false; }
    }
    function newId() {
      var c = window.crypto; if (!c || !c.getRandomValues) return null;
      var b = new Uint8Array(16); c.getRandomValues(b);
      b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
      var h = Array.prototype.map.call(b, function (x) { return (x < 16 ? '0' : '') + x.toString(16); }).join('');
      return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
    }
    // 裝置大類（手機／平板／電腦）：只用「是否觸控」與「螢幕短邊」即時判斷，結果以外的量不外傳。
    function deviceClass() {
      try {
        var touch = (navigator.maxTouchPoints || 0) > 0 && !!window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        if (!touch) return 'desktop';
        var sw = window.screen && window.screen.width, sh = window.screen && window.screen.height;
        var short = (sw > 0 && sh > 0) ? Math.min(sw, sh) : Math.min(window.innerWidth || 0, window.innerHeight || 0);
        return short > 0 && short < 600 ? 'phone' : 'tablet';
      } catch (e) { return 'desktop'; }
    }
    function appMode() {                           // web｜pwa（只分是否以主畫面 App 開啟）
      try { return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true ? 'pwa' : 'web'; } catch (e) { return 'web'; }
    }
    function ok(n, max) { return typeof n === 'number' && isFinite(n) && n >= 0 && n <= max; }
    var $ = function (s) { return document.querySelector(s); };
    var H = document.documentElement;

    // ---- 模式（D057）：{m:'off'|'basic'|'full', p:presence}；未定稿的預設暫為 full、presence 開（僅供開發與 P5，發布前須由 q 定稿）----
    function readMode() {
      var m = 'full', p = true, raw = fetchKey(MODE_KEY);
      if (raw) { try { var j = JSON.parse(raw); if (j && typeof j === 'object') { if (/^(off|basic|full)$/.test(j.m)) m = j.m; if (typeof j.p === 'boolean') p = j.p; } else if (/^(off|basic|full)$/.test(raw)) m = raw; } catch (e) { if (/^(off|basic|full)$/.test(raw)) m = raw; } }
      if (fetchKey(OFF) === '1') m = 'off';
      return { m: m, p: p && m !== 'off' };
    }
    var mode = readMode();

    // ---- 待送資料（單一 localStorage 鍵，含全部差量）----
    var st = null;
    function blank(o) {
      return { id: o.id, t: o.t, o: o.o | 0, s: o.s | 0, a: o.a | 0, e: o.e | 0, f: o.f || {}, ss: o.ss || {}, r: o.r || {}, nd: o.nd || {}, qt: o.qt || [], rp: o.rp || [], kt: o.kt || [], km: o.km || [], kj: o.kj || {}, x: o.x || [], hv: o.hv || [] };
    }
    function load() {
      var raw = fetchKey(KEY), j = null;
      try { j = raw && JSON.parse(raw); } catch (e) { j = null; }
      var now = Date.now();
      var valid = j && typeof j.id === 'string' && /^[0-9a-f-]{32,36}$/.test(j.id) && ok(j.t, now + 864e5) && ok(j.o, KEEP_O) && ok(j.s, KEEP_S);
      if (valid && now - j.t <= ROTATE_MS) return blank(j);
      var id = newId(); if (!id) return null;
      return blank({ id: id, t: now, o: valid ? j.o : 0, s: valid ? j.s : 0, a: valid ? j.a : 0 });   // 180 天自動換新編號；未送資料留給新編號
    }
    function save() { return st ? store(KEY, JSON.stringify(st)) : false; }
    function tier() { return mode.m === 'basic' ? 'b' : 'f'; }
    function full() { return mode.m === 'full'; }

    // ---- 事件計數（只收 Registry 內的 id）----
    function ev(id, n) {
      if (!st || !full() || !IDS[id]) return;
      var k = Object.keys(st.f); if (k.length >= 200 && !(id in st.f)) return;
      st.f[id] = Math.min((st.f[id] || 0) + (n || 1), KEEP_N);
    }
    function pushCap(arr, v, max) { if (arr.length < max) arr.push(v); }

    // ---- 狀態讀取（唯讀；只回目前值）----
    function layoutKey() { return H.dataset.layout || 'mac'; }
    function zoomOf(p) { var e = $('.zc[data-z="' + p + '"] .zv'), m = e && /(\d+)/.exec(e.textContent); return m ? m[1] : null; }
    function readState() {
      var s = {}, g;
      g = $('.label-choice[aria-checked="true"]'); s['label'] = g ? g.getAttribute('data-label') : null;
      g = $('#sourceFont'); s['font.family'] = g ? g.value : null;
      g = $('#sourceWeight'); s['font.weight'] = g ? g.value : null;
      s['font.size'] = H.style.getPropertyValue('--fz').trim() || null;
      g = $('#lsSeg [aria-checked="true"]'); s['font.line'] = g ? g.getAttribute('data-l') : null;
      s['zoom.r'] = zoomOf('r'); s['zoom.m'] = zoomOf('m'); s['zoom.p'] = zoomOf('p');
      g = $('#chartTitleColor'); s['kepan.color'] = g ? (g.value.toLowerCase() === '#9a2c1e' ? 'default' : 'custom') : null;
      var lm = fetchKey('hk-device-layout-v146'); s['layout.mode'] = lm === 'ipad' || lm === 'mac' ? lm : 'auto';
      g = $('#swapPanes'); s['layout.swap'] = g ? (g.getAttribute('aria-pressed') === 'true' ? '1' : '0') : null;
      g = $('#panelPin'); s['layout.panel_pin'] = g ? (g.getAttribute('aria-pressed') === 'true' ? 'pinned' : 'floating') : null;
      g = $('#railPin'); s['layout.rail_pin'] = g ? (g.getAttribute('aria-pressed') === 'true' ? 'pinned' : 'floating') : null;
      s['layout.pane'] = document.querySelector('.equal-panes') ? 'equal' : 'custom';
      g = $('#railOpen'); s['rail.visible'] = g ? (g.hidden ? 'visible' : 'hidden') : null;
      g = $('#panelOpen'); s['panel.visible'] = g ? (g.hidden ? 'visible' : 'hidden') : null;
      s['bar.visible'] = H.classList.contains('barless') ? 'hidden' : 'visible';
      g = $('#jFold'); s['jfold'] = g ? (g.getAttribute('aria-expanded') === 'true' ? 'open' : 'fold') : null;
      g = $('[data-screen][aria-current]'); s['phone.screen'] = g ? g.getAttribute('data-screen') : null;
      g = $('#tabT'); s['view.tab'] = g ? (g.getAttribute('aria-selected') === 'true' ? 't' : 'v') : null;
      try { s['orient'] = window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape'; } catch (e) { s['orient'] = null; }
      return s;
    }
    function defaultOf(dim) { var d = DIMS[dim]; if (!d) return null; var v = d.default; return v && typeof v === 'object' ? (v[layoutKey()] || null) : v; }
    function edLetter() { return H.dataset.edition === 'hk' ? 'h' : H.dataset.edition === 'zang' ? 'z' : null; }
    function curJuan() {
      var e = $('#jCur'), m = e && /(\d+)/.exec(e.textContent);
      if (!m) m = /^#j(\d+)/.exec(location.hash || '');
      var j = m ? parseInt(m[1], 10) : 0; return j >= 1 && j <= 100 ? j : 0;
    }
    function stMask() {
      var m = 0, g;
      g = $('#optPx'); if (g && g.checked) m |= 1; g = $('#optCb'); if (g && g.checked) m |= 2;
      g = $('#optKp'); if (g && !g.checked) m |= 4; g = $('#optDict'); if (g && !g.checked) m |= 8;
      return m;
    }

    // ---- 有效使用時間引擎（沿用 v2）＋ 狀態時間與閱讀歸屬 ----
    var running = false, timers = {}, sessionSec = 0, needOpen = true, hiddenAt = 0;
    var lastAct = 0, lastRead = 0, lastTick = 0, inFlight = false, nextTry = 0, lastSend = 0, tickN = 0, lastRK = '';
    function stateTick(dt) {
      var cur = readState();
      for (var i = 0; i < CFG.dims.length; i++) {
        var d = CFG.dims[i]; if (d.via !== 's') continue;
        var v = cur[d.dim]; if (v == null || d.values.indexOf(v) < 0) continue;
        var def = defaultOf(d.dim);
        if (def !== null && v === def) continue;                      // 只存非預設值；預設值秒數由伺服器推得
        var k = d.dim + '\u0001' + v;
        if (!(k in st.ss) && Object.keys(st.ss).length >= 200) continue;
        st.ss[k] = Math.min((st.ss[k] || 0) + dt, KEEP_S);
      }
    }
    function readTick(dt, now) {
      if (now - lastRead > READ_IDLE_MS) return;                      // 閱讀靜止 60 秒即停
      var e = edLetter(), j = curJuan(); if (!e || !j) return;
      var src = fetchKey('hk-edition-v154') ? 1 : 0, k = [e, src, stMask(), j].join('|');
      var r = st.r[k] || (Object.keys(st.r).length < 300 ? (st.r[k] = [0, 0]) : null); if (!r) return;
      r[0] = Math.min(r[0] + dt, KEEP_S);
      var rk = e + j; if (rk !== lastRK) { lastRK = rk; r[1] = Math.min(r[1] + 1, 1000); }
    }
    function tick() {
      try {
        var now = Date.now(), dt = Math.round((now - lastTick) / 1000); lastTick = now;
        if (dt <= 0 || document.visibilityState !== 'visible' || now - lastAct > IDLE_MS || sessionSec >= CAP_S) return;
        dt = Math.min(dt, 2); sessionSec += dt; st.s = Math.min(st.s + dt, KEEP_S); st.a = Math.min(st.a + dt, KEEP_S);
        if (full()) { stateTick(dt); readTick(dt, now); }
        if (++tickN % 15 === 0) save();                               // 每 15 秒存一次，避免頻繁寫入
      } catch (e) {}
    }

    // ---- 組裝與送出 ----
    function take() {
      var o = Math.min(st.o, MAX_O), s = Math.min(st.s, MAX_S), tk = { o: o, s: s, f: {}, ss: {}, r: {}, nd: {}, qt: [], rp: [], kt: [], km: [], kj: {}, x: [], hv: [] };
      var p = { v: 4, id: st.id, o: o, s: s, d: deviceClass(), m: appMode(), t: tier() };
      if (tier() === 'f') {
        var room = function () { return JSON.stringify(p).length < MAX_BODY; };
        var n = 0, k;
        var f = {}; for (k in st.f) { if (n >= 60 || !room()) break; f[k] = st.f[k]; tk.f[k] = st.f[k]; n++; p.f = f; }
        var ss = []; n = 0; for (k in st.ss) { if (n >= 40 || !room()) break; var q = k.split('\u0001'); var sec = Math.min(st.ss[k], MAX_S); ss.push([q[0], q[1], sec]); tk.ss[k] = sec; n++; p.ss = ss; }
        var r = []; n = 0; for (k in st.r) { if (n >= 30 || !room()) break; var a = k.split('|'), v = st.r[k]; if (v[0] <= 0 && v[1] <= 0) continue; r.push([a[0], +a[1], +a[2], +a[3], Math.min(v[0], MAX_S), Math.min(v[1], 50)]); tk.r[k] = [Math.min(v[0], MAX_S), Math.min(v[1], 50)]; n++; p.r = r; }
        var nd = [], total = 0, nss = 0, ns;
        for (ns in st.nd) { if (nss >= 2 || total >= 40 || !room()) break; var rows = [];
          for (k in st.nd[ns]) { if (total >= 40) break; rows.push([+k, Math.min(st.nd[ns][k], 200)]); (tk.nd[ns] || (tk.nd[ns] = {}))[k] = Math.min(st.nd[ns][k], 200); total++; }
          if (rows.length) { nd.push([ns, rows]); nss++; p.nd = nd; } }
        var qt = st.qt.slice(0, 10), rp = st.rp.slice(0, 5); if (qt.length || rp.length) { p.q = {}; if (qt.length) p.q.t = qt; if (rp.length) p.q.rp = rp; tk.qt = qt; tk.rp = rp; if (!room()) { delete p.q; tk.qt = []; tk.rp = []; } }
        var kt = st.kt.slice(0, 10), km = st.km.slice(0, 10), kj = Object.keys(st.kj).slice(0, 10);
        if (kt.length || km.length || kj.length) { p.k = {}; if (kt.length) p.k.t = kt; if (km.length) p.k.m = km; if (kj.length) p.k.j = kj.map(function (c) { return [+c, Math.min(st.kj[c], 1000)]; }); tk.kt = kt; tk.km = km; kj.forEach(function (c) { tk.kj[c] = Math.min(st.kj[c], 1000); }); if (!room()) { delete p.k; tk.kt = []; tk.km = []; tk.kj = {}; } }
        var x = st.x.slice(0, 5); if (x.length) { p.x = x; tk.x = x; if (!room()) { delete p.x; tk.x = []; } }
        var hv = st.hv.slice(0, 5); if (hv.length) { p.hv = hv; tk.hv = hv; }
      }
      var content = p.f || p.ss || p.r || p.nd || p.q || p.k || p.x || p.hv;
      if (o + s <= 0 && !content) return null;
      return { p: p, tk: tk };
    }
    function subtract(tk) {
      st.o -= tk.o; st.s -= tk.s; var k;
      for (k in tk.f) { st.f[k] -= tk.f[k]; if (st.f[k] <= 0) delete st.f[k]; }
      for (k in tk.ss) { st.ss[k] -= tk.ss[k]; if (st.ss[k] <= 0) delete st.ss[k]; }
      for (k in tk.r) { var v = st.r[k]; if (v) { v[0] -= tk.r[k][0]; v[1] -= tk.r[k][1]; if (v[0] <= 0 && v[1] <= 0) delete st.r[k]; else { if (v[0] < 0) v[0] = 0; if (v[1] < 0) v[1] = 0; } } }
      for (var ns in tk.nd) for (k in tk.nd[ns]) { st.nd[ns][k] -= tk.nd[ns][k]; if (st.nd[ns][k] <= 0) delete st.nd[ns][k]; if (!Object.keys(st.nd[ns]).length) delete st.nd[ns]; }
      st.qt.splice(0, tk.qt.length); st.rp.splice(0, tk.rp.length); st.kt.splice(0, tk.kt.length); st.km.splice(0, tk.km.length);
      for (k in tk.kj) { st.kj[k] -= tk.kj[k]; if (st.kj[k] <= 0) delete st.kj[k]; }
      st.x.splice(0, tk.x.length); st.hv.splice(0, tk.hv.length);
    }
    function restore(tk) {
      st.o = Math.min(st.o + tk.o, KEEP_O); st.s = Math.min(st.s + tk.s, KEEP_S); var k;
      for (k in tk.f) st.f[k] = Math.min((st.f[k] || 0) + tk.f[k], KEEP_N);
      for (k in tk.ss) st.ss[k] = Math.min((st.ss[k] || 0) + tk.ss[k], KEEP_S);
      for (k in tk.r) { var v = st.r[k] || (st.r[k] = [0, 0]); v[0] += tk.r[k][0]; v[1] += tk.r[k][1]; }
      for (var ns in tk.nd) for (k in tk.nd[ns]) { var m = st.nd[ns] || (st.nd[ns] = {}); m[k] = Math.min((m[k] || 0) + tk.nd[ns][k], 200000); }
      st.qt = tk.qt.concat(st.qt).slice(0, 40); st.rp = tk.rp.concat(st.rp).slice(0, 20); st.kt = tk.kt.concat(st.kt).slice(0, 40); st.km = tk.km.concat(st.km).slice(0, 40);
      for (k in tk.kj) st.kj[k] = Math.min((st.kj[k] || 0) + tk.kj[k], 100000);
      st.x = tk.x.concat(st.x).slice(0, 20); st.hv = tk.hv.concat(st.hv).slice(0, 20);
    }
    function post(path, body, cb, opts) {
      var ctl = typeof AbortController === 'function' ? new AbortController() : null;
      var to = ctl ? setTimeout(function () { try { ctl.abort(); } catch (e) {} }, TIMEOUT_MS) : 0;
      fetch(BASE + path, { method: 'POST', body: JSON.stringify(body), keepalive: true, mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer', headers: { 'Content-Type': 'text/plain' }, signal: ctl ? ctl.signal : undefined })
        .then(function (r) { clearTimeout(to); cb(!!(r && r.ok), r); }, function () { clearTimeout(to); cb(false, null); });
    }
    function flush(periodic) {
      try {
        if (!running || inFlight || !st) return;
        var now = Date.now(); if (now < nextTry) return;
        if (periodic === true && now - lastSend < FLUSH_MS) return;
        if (navigator.onLine === false) return;
        var t = take(); if (!t) return;
        // 先扣除再送（頁面可能在請求完成前就被關閉；失敗且頁面還在時再加回），避免下次啟動重複計算。
        subtract(t.tk); save(); inFlight = true; lastSend = now;
        post('/v', t.p, function (success) {
          inFlight = false;
          if (!success) { nextTry = Date.now() + RETRY_MS; if (st) { restore(t.tk); save(); } }
        });
      } catch (e) { inFlight = false; }
    }
    function act() { lastAct = Date.now(); }
    function readAct() { lastRead = Date.now(); }
    function maybeOpen() {
      if (!needOpen || document.visibilityState === 'hidden' || !st) return;
      needOpen = false; sessionSec = 0; lastRK = ''; st.o = Math.min(st.o + 1, KEEP_O);
      if (navigator.onLine === false) ev('app.offline_open');
      save(); setTimeout(function () { flush(); }, 0);
    }
    function onVis() {
      try {
        var now = Date.now();
        if (document.visibilityState === 'hidden') { hiddenAt = now; finalizeSearch(); save(); flush(); beatLeave(); return; }
        if (hiddenAt && now - hiddenAt > GAP_MS) needOpen = true;
        hiddenAt = 0; lastAct = now; lastRead = now; lastTick = now; maybeOpen(); beatKick();
      } catch (e) {}
    }
    function onHide() { try { finalizeSearch(); save(); flush(); beatLeave(); } catch (e) {} }

    // ---- presence 心跳（D060）：頁面可見＋90 秒內有互動才送；離開送 leave；間隔由伺服器標頭 x-p 控制（限制 20–300 秒）----
    var beatMs = BEAT_DEFAULT, beatFail = 0, lastBeat = 0, beatTimer = 0, beatBusy = false, beatStop = false, beatSent = false;
    function beatOk() { return running && mode.p && !beatStop && st && document.visibilityState === 'visible' && Date.now() - lastAct <= IDLE_MS && sessionSec < CAP_S && navigator.onLine !== false; }
    function beatNext() {
      clearTimeout(beatTimer);
      if (!running || !mode.p || beatStop) return;
      var wait = beatFail ? Math.min(BEAT_FAIL_MAX, beatMs * Math.pow(2, beatFail)) : beatMs + (Math.random() * 10000 - 5000);
      beatTimer = setTimeout(beatRun, Math.max(1000, wait));
    }
    function beatRun() {
      try {
        if (!beatOk()) { beatNext(); return; }
        if (beatBusy) { beatNext(); return; }
        beatBusy = true; lastBeat = Date.now(); beatSent = true;
        post('/p', { v: 1, id: st.id, d: deviceClass(), m: appMode() }, function (success, r) {
          beatBusy = false;
          if (success) {
            beatFail = 0; var x = r && r.headers && parseInt(r.headers.get('x-p'), 10);
            if (x === 0) beatStop = true; else if (x > 0) beatMs = Math.max(BEAT_MIN, Math.min(BEAT_MAX, x * 1000));
          } else beatFail = Math.min(beatFail + 1, 4);
          beatNext();
        });
      } catch (e) { beatBusy = false; beatNext(); }
    }
    function beatKick() { try { if (beatOk() && Date.now() - lastBeat > 10000 && !beatBusy) { clearTimeout(beatTimer); beatRun(); } else beatNext(); } catch (e) {} }
    function beatLeave() { try { if (!st || !mode.p || !beatSent || navigator.onLine === false) return; beatSent = false; post('/p', { v: 1, id: st.id, x: 1 }, function () {}); } catch (e) {} }

    // ---- 委派監聽（只認 Registry selector；isTrusted）----
    var RULES = {}; CFG.rules.forEach(function (r) { if (!r.sel || r.sel === '-' || r.sel === 'window' || r.sel === 'document' || r.sel === 'html') return; r.on.split(',').forEach(function (e) { if (e !== 'observe' && e !== 'boot') (RULES[e] || (RULES[e] = [])).push(r); }); });
    var lastVia = '', lastViaAt = 0, lastChip = 0, lastDbl = 0, lastZoomBtn = {}, lastResetClick = 0, tourLast = '', tourStep = 1, tourOn = false;
    var FN = {};
    function match(el, sel) { try { return el.closest(sel); } catch (e) { return null; } }
    function applyRule(r, el, e) {
      var id, v;
      if (r.kind === 'fixed') id = r.emit;
      else if (r.kind === 'attr') { v = el.getAttribute(r.attr); id = r.map ? r.map[v] : r.emit.replace('{v}', v); }
      else if (r.kind === 'value') id = r.emit.replace('{v}', el.value);
      else if (r.kind === 'checked') id = el.checked ? r.emit[0] : r.emit[1];
      else if (r.kind === 'pressed' || r.kind === 'expanded') {            // 點擊後的狀態（App 的處理常式在後）：延後讀取
        var attr = r.kind === 'pressed' ? 'aria-pressed' : 'aria-expanded';
        setTimeout(function () { try { ev(el.getAttribute(attr) === 'true' ? r.emit[0] : r.emit[1]); } catch (x) {} }, 0); return;
      } else if (r.kind === 'special') { var f = FN[r.fn]; if (f) f(el, e, r); return; }
      if (id) ev(id);
    }
    function onDoc(e) {
      try {
        if (!running || !full() || !e.isTrusted && e.type !== 'submit') return;
        var list = RULES[e.type]; if (!list || !e.target || !e.target.closest) return;
        for (var i = 0; i < list.length; i++) { var el = match(e.target, list[i].sel); if (el) applyRule(list[i], el, e); }
      } catch (x) {}
    }
    // ---- 特殊處理 ----
    var pendingNodes = [];
    FN.juanOpen = function () { ev(layoutKey() === 'iphone' ? 'nav.juan_open.phone' : 'nav.juan_open.rail'); };
    FN.layoutChoice = function () { setTimeout(function () { var lm = fetchKey('hk-device-layout-v146'); ev(lm === 'ipad' ? 'layout.mode.ipad' : lm === 'mac' ? 'layout.mode.mac' : 'layout.mode.auto'); }, 50); };
    var topTimer = 0;
    FN.chartTop = function (el, e) {
      if (e.detail >= 2) { clearTimeout(topTimer); topTimer = 0; ev('nav.top.double'); return; }
      clearTimeout(topTimer); topTimer = setTimeout(function () { topTimer = 0; ev('nav.top.single'); }, 350);
    };
    function nodeInfo(el) {
      var raw = el.getAttribute('data-n'); if (raw == null) raw = el.getAttribute('data-kn'); if (raw == null) raw = el.getAttribute('data-id');
      var idx = parseInt(raw, 10), l = edLetter(); if (!(idx >= 0) || !l || !NSV[l]) return null;
      var where = el.closest('.rol') ? 'rail' : el.closest('#pzoom,#kview') ? 'chart' : 'body';
      return { ns: l + NSV[l], idx: idx, where: where };
    }
    FN.nodeClick = function (el) {
      var info = nodeInfo(el); if (!info) return;
      // 延後 300 毫秒才計：若隨後是雙擊（往上一層），取消這次點擊，雙擊只記 1 次、不記 2 次節點點擊
      var rec = { t: 0 }; rec.t = setTimeout(function () {
        pendingNodes = pendingNodes.filter(function (x) { return x !== rec; });
        if (!st) return; var m = st.nd[info.ns] || (Object.keys(st.nd).length < 4 ? (st.nd[info.ns] = {}) : null); if (!m) return;
        if (!(info.idx in m) && Object.keys(m).length >= 4000) return;
        m[info.idx] = Math.min((m[info.idx] || 0) + 1, 200000); ev('kepan.node_click'); ev('kepan.click.' + info.where);
      }, 300); pendingNodes.push(rec);
    };
    FN.kepanUpDbl = function () { pendingNodes.forEach(function (x) { clearTimeout(x.t); }); pendingNodes = []; ev('kepan.up.dbl'); };
    var lpTimer = 0;
    FN.kepanLong = function (el, e) {
      clearTimeout(lpTimer); var cancel = function () { clearTimeout(lpTimer); document.removeEventListener('pointerup', cancel, true); document.removeEventListener('pointermove', cancel, true); };
      lpTimer = setTimeout(function () { cancel(); ev('kepan.longpress_parent'); }, 600);
      document.addEventListener('pointerup', cancel, true); document.addEventListener('pointermove', cancel, true);
    };
    // 字體大小：滑桿／按鈕；140 毫秒 debounce 後只取終值，不記過程
    var fsTimer = 0, fsBefore = null, fsVia = '', fsSnap = null;
    FN.fontSize = function (el, e) {
      var via = el.id === 'fsR' ? 'slider' : 'btn';
      if (fsBefore === null) fsBefore = readState()['font.size'];
      fsVia = via; clearTimeout(fsTimer);
      fsTimer = setTimeout(function () {
        var after = readState()['font.size'], b = fsBefore; fsBefore = null;
        if (Date.now() - lastResetClick < 800) return;                // 全部重置造成的變動只記 font.reset_all
        var bi = CFG.dims.filter(function (d) { return d.dim === 'font.size'; })[0].values, ib = bi.indexOf(b), ia = bi.indexOf(after);
        if (ib < 0 || ia < 0 || ib === ia) return;
        ev(ia > ib ? 'font.size.up' : 'font.size.down'); ev('font.size.via.' + fsVia); earlyOnce(1, 'early.font_size');
      }, 140);
    };
    document.addEventListener('click', function (e) { try { if (e.isTrusted && e.target.closest && e.target.closest('#fsReset')) lastResetClick = Date.now(); } catch (x) {} }, { capture: true, passive: true });
    // 縮放：以 reader-zoom 事件＋前後級距比較（debounce 300 毫秒）；操作方式由最近的輸入事件判定
    var zTimer = 0, zSnap = null, zInputs = {}, zVia = '';
    FN.zoomInput = function (el) {
      var pane = el.closest('.zc') && el.closest('.zc').getAttribute('data-z'); var zd = el.getAttribute('data-zd');
      lastVia = 'btn'; lastViaAt = Date.now(); if (pane) zInputs[pane] = { zd: zd, at: Date.now() };
    };
    FN.zoomWatch = function () {
      clearTimeout(zTimer);
      zTimer = setTimeout(function () {
        var cur = readState(), snap = zSnap || cur;
        ['r', 'm', 'p'].forEach(function (p) {
          var a = parseInt(snap['zoom.' + p], 10), b = parseInt(cur['zoom.' + p], 10); if (!(a > 0) || !(b > 0) || a === b) return;
          var reset = zInputs[p] && zInputs[p].zd === '0' && Date.now() - zInputs[p].at < 1500;
          ev('zoom.' + p + '.' + (reset ? 'reset' : b > a ? 'in' : 'out'));
          var via = Date.now() - lastViaAt < 1500 ? lastVia : ''; if (via) ev('zoom.via.' + via);
          if (p === 'm') earlyOnce(2, 'early.zoom_m');
        });
        zSnap = cur;
      }, 300);
    };
    document.addEventListener('keydown', function (e) { try { if (e.isTrusted && (e.ctrlKey || e.metaKey) && /^[-=+0]$/.test(e.key)) { lastVia = 'kbd'; lastViaAt = Date.now(); } } catch (x) {} }, { capture: true, passive: true });
    document.addEventListener('wheel', function (e) { try { if (e.isTrusted && e.ctrlKey) { lastVia = 'wheel'; lastViaAt = Date.now(); } } catch (x) {} }, { capture: true, passive: true });
    document.addEventListener('touchstart', function (e) { try { if (e.isTrusted && e.touches && e.touches.length >= 2) { lastVia = 'pinch'; lastViaAt = Date.now(); } } catch (x) {} }, { capture: true, passive: true });
    function earlyOnce(bit, id) { if (st && st.a < 300 && !(st.e & bit)) { st.e |= bit; ev(id); } }
    // 版本切換：觀察 html[data-edition]；切換後 60 秒內切回記一次 switch_back
    var edLast = null, edSwitchedAt = 0, edFrom = null;
    FN.editionWatch = function () {
      var now = edLetter(); if (!now || !edLast || now === edLast) { edLast = now || edLast; return; }
      ev('edition.select.' + now);
      if (edFrom === now && Date.now() - edSwitchedAt < 60000) ev('edition.switch_back');
      edFrom = edLast; edSwitchedAt = Date.now(); edLast = now;
    };
    // 搜尋：送出時讀詞；結果數由結果標題解析（不改 App）
    var TERM_RE = /^[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u{20000}-\u{2fa1f}·・、，。：；！？「」『』（）〈〉《》〔〕\-]+$/u;
    function cleanTerm(t) {                                              // 與 Worker 的 cleanTerm 相同規則；不合格的詞根本不離開裝置
      try {
        var q = String(t).normalize('NFKC').replace(/\s+/g, ''), n = Array.from(q).length;
        if (n < 1 || n > 16 || /[A-Za-z@]|\d{6,}/.test(q) || /https?:|www\./i.test(q)) return null;
        return TERM_RE.test(q) ? q : null;
      } catch (e) { return null; }
    }
    var sLast = null;
    function finalizeSearch() { if (sLast && sLast.ok && !sLast.opened) ev('search.abandoned'); sLast = null; }
    FN.searchOpen = function () { var q = $('#q'); if (!q || q.hidden) ev('search.open'); };
    FN.searchSubmit = function (el) {
      var q = $('#q'), term = q ? q.value : ''; if (!term || !term.trim()) return;
      ev('search.submit'); var prev = sLast; if (prev && prev.ok && !prev.opened) ev('search.abandoned');
      var ct = cleanTerm(term), cur = { term: term, ct: ct, ok: false, zero: false, opened: false, at: Date.now() }; sLast = cur;
      var tries = 0, poll = function () {
        var h = document.querySelector('.results h2'), m = h && /共\s*(\d+)\s*處/.exec(h.textContent);
        if (!m || h.textContent.indexOf(term.trim()) < 0) { if (++tries < 10) setTimeout(poll, 100); return; }
        if (!st) return; var n = parseInt(m[1], 10);
        if (n > 0) { cur.ok = true; ev('search.ok'); if (ct) pushCap(st.qt, [ct, 1], 40); if (prev && prev.zero && Date.now() - prev.at < 120000) { ev('search.recovered'); if (ct && prev.ct) pushCap(st.rp, [prev.ct, ct], 20); } }
        else { cur.zero = true; ev('search.zero'); if (ct) pushCap(st.qt, [ct, 0], 40); }
      };
      setTimeout(poll, 60);
    };
    FN.searchOpt = function (el) { var so = el.getAttribute('data-so'), k = so === 'p' ? 'px' : so === 'c' ? 'cb' : null; if (k) ev('search.opt_' + k + '.' + (el.checked ? 'on' : 'off')); };
    FN.searchResult = function (el) {
      if (sLast) sLast.opened = true; ev('search.opened');
      ev(el.hasAttribute('data-k') ? 'search.result.kepan' : el.hasAttribute('data-tj') ? 'search.result.text' : el.hasAttribute('data-nj') ? 'search.result.notes' : 'search.result.text');
    };
    // 辭典：觀察預覽標題（查詞）與內容框狀態（命中／未命中）
    var dCur = null;
    function dictMode() { var n = Date.now(); return n - lastChip < 1500 ? 'long' : n - lastDbl < 1200 ? 'dbl' : 'sel'; }
    function dictLookup() {
      var t = document.getElementById('termPreviewTitle'), term = t ? t.textContent.trim() : ''; if (!term || term === '名相辭典') return;
      if (dCur && dCur.term === term && Date.now() - dCur.at < 400) return;
      dCur = { term: term, at: Date.now(), done: false }; ev('dict.lookup.' + dictMode());
      var j = curJuan(); if (j && st) st.kj[j] = Math.min((st.kj[j] || 0) + 1, 100000);
      setTimeout(dictResult, 80);
    }
    function dictResult() {
      if (!dCur || dCur.done || !st) return;
      var f = document.querySelector('#termPreviewContent > div'); if (!f) return;
      if (f.getAttribute('data-loaded')) { dCur.done = true; ev('dict.hit'); var ctm = cleanTerm(dCur.term); if (ctm) pushCap(st.kt, ctm, 40); }
      else if (f.getAttribute('data-fallback')) { dCur.done = true; ev('dict.miss'); var ctm2 = cleanTerm(dCur.term); if (ctm2) pushCap(st.km, ctm2, 40); }
    }
    FN.dictEsc = function (el, e) { var p = $('#termPreview'); if (e.key === 'Escape' && p && !p.hidden) ev('dict.close.esc'); };
    FN.dictOutside = function (el, e) { var p = $('#termPreview'); if (p && !p.hidden && !e.target.closest('#termPreview,.dict-chip')) ev('dict.close.outside'); };
    // 匯出：點擊時讀選項；成敗由訊息文字判定（成功／失敗；取消與未選項目不算）
    var exPending = {};
    var FMTS = ['pdf', 'docx', 'html', 'md', 'txt'];
    function exCustom(kind) {
      var chk = function (id) { var e = document.getElementById(id); return e && e.checked; };
      var cur = parseInt((/(\d+)/.exec(($('#jCur') || {}).textContent || '') || [])[1], 10) || 0;
      var a = parseInt(($('#exFrom') || {}).value, 10) || 1, b = parseInt(($('#exTo') || {}).value, 10) || a;
      if (b < a) { var t = a; a = b; b = t; }
      var sc = a === 1 && b === 100 ? 'all' : (a === b && a === cur ? 'this' : 'range');
      var fmt = FMTS.filter(function (f) { return chk('exF_' + f); }), pt = [];
      if (chk('exText')) pt.push('text'); if (chk('exKp')) pt.push('kp'); if (chk('exPx')) pt.push('px'); if (chk('exCb')) pt.push('cb');
      return { k: kind, fmt: fmt, pt: pt, pk: chk('exZip') ? 'zip' : 'sep', sc: sc, a: Math.max(1, Math.min(200, a)), b: Math.max(1, Math.min(200, b)), lb: '', ok: 1 };
    }
    FN.exportRun = function (el) {
      var id = el.id, x, msgId, fid;
      if (id === 'exOne') { x = { k: 'one', fmt: ['pdf'], pt: ['kp', 'text'], pk: '', sc: 'all', a: 1, b: 100, lb: '', ok: 1 }; msgId = 'oneMsg'; fid = 'export.one_click'; }
      else if (id === 'exGo') { x = exCustom('custom'); msgId = 'exMsg'; fid = 'export.custom'; if (!x.fmt.length || !x.pt.length) { ev(fid); return; } }
      else {
        var all = id === 'dlAll', chk = function (i) { var e = document.getElementById(i); return e && e.checked; };
        var a = all ? 2 : (parseInt(($('#dlFrom') || {}).value, 10) || 2), b = all ? 96 : (parseInt(($('#dlTo') || {}).value, 10) || a); if (b < a) { var t = a; a = b; b = t; }
        var lb = EDITION_IS_Z() ? (chk('kplZj') ? 'zj' : 'gz') : '';
        x = { k: 'kepan', fmt: ['pdf'], pt: lb ? [lb] : [], pk: '', sc: all ? 'all' : 'range', a: Math.max(1, Math.min(200, a)), b: Math.max(1, Math.min(200, b)), lb: lb, ok: 1 }; msgId = 'dlMsg'; fid = 'export.kepan_pdf';
      }
      ev(fid); exPending[msgId] = { x: x, at: Date.now() };
    };
    function EDITION_IS_Z() { return H.dataset.edition === 'zang'; }
    function exMsg(msgId) {
      var p = exPending[msgId], e = document.getElementById(msgId); if (!p || !e || !st) return;
      if (Date.now() - p.at > 600000) { delete exPending[msgId]; return; }
      var t = e.textContent.trim();
      if (/^(已匯出|已存檔|已開始匯出|已開啟整本)/.test(t)) { delete exPending[msgId]; p.x.ok = 1; pushCap(st.x, p.x, 20); }
      else if (/(出錯|沒有載入|失敗|無法)/.test(t)) { delete exPending[msgId]; p.x.ok = 0; pushCap(st.x, p.x, 20); ev('export.fail'); }
      else if (/^(已取消|請至少|所選卷次沒有)/.test(t)) delete exPending[msgId];
    }
    FN.reportSend = function (el) { var t = $('#reportText'); if (!t || !t.value.trim()) return; rpPending = Date.now(); };
    var rpPending = 0;
    function rpMsg() {
      if (!rpPending || !st) return; var e = document.getElementById('reportMsg'), t = e ? e.textContent : '';
      if (t === '已送出') { rpPending = 0; ev('report.send.ok'); } else if (/目前無法直接送出/.test(t)) { rpPending = 0; ev('report.send.fail'); }
    }
    FN.historyDetail = function () {
      var b = document.querySelector('#versionDetail b'), m = b && /^v(\d{1,2}\.\d{1,3})$/.exec(b.textContent.trim()); if (m && st) { ev('history.detail'); pushCap(st.hv, m[1], 20); }
    };
    FN.offlineOpen = function () {}; FN.updateReload = function () {};
    FN.early = function () {};
    FN.tourWatch = function () {};
    function tourEnd() {
      if (!tourOn) return; tourOn = false;
      ev(tourLast === 'nx' ? 'guide.complete' : 'guide.skip');
      ev('guide.step_max.' + (tourStep <= 3 ? 'b1' : tourStep <= 10 ? 'b2' : tourStep <= 20 ? 'b3' : 'b4'));
    }
    function onTourClick(e) {
      try {
        if (!running || !full() || !e.isTrusted || !e.target.closest) return;
        var b = e.target.closest('#tour .nx,#tour .pv,#tour .sk'); if (!b) return;
        if (b.classList.contains('nx')) { tourLast = 'nx'; tourStep++; } else if (b.classList.contains('pv')) { tourLast = 'pv'; tourStep = Math.max(1, tourStep - 1); } else tourLast = 'sk';
      } catch (x) {}
    }
    function onTourKey(e) { try { if (running && full() && e.isTrusted && e.key === 'Escape' && document.getElementById('tour')) tourLast = 'sk'; } catch (x) {} }

    // ---- 觀察器（只讀）----
    var observers = [];
    function observe(target, opts, cb) { try { if (!target) return; var o = new MutationObserver(function () { try { cb(); } catch (e) {} }); o.observe(target, opts); observers.push(o); } catch (e) {} }
    function setupObservers() {
      edLast = edLetter(); zSnap = readState();
      observe(H, { attributes: true, attributeFilter: ['data-edition'] }, FN.editionWatch);
      observe(document.getElementById('termPreviewTitle'), { childList: true, characterData: true, subtree: true }, dictLookup);
      observe(document.getElementById('termPreviewContent'), { childList: true, attributes: true, subtree: true, attributeFilter: ['data-loaded', 'data-fallback'] }, dictResult);
      ['exMsg', 'oneMsg', 'dlMsg'].forEach(function (id) { observe(document.getElementById(id), { childList: true, characterData: true, subtree: true }, function () { exMsg(id); }); });
      observe(document.getElementById('reportMsg'), { childList: true, characterData: true, subtree: true }, rpMsg);
      observe(document.getElementById('versionDetail'), { childList: true, characterData: true, subtree: true }, FN.historyDetail);
      observe(document.body, { childList: true }, function () { var t = document.getElementById('tour'); if (t && !tourOn) { tourOn = true; tourStep = 1; tourLast = ''; } else if (!t && tourOn) tourEnd(); });
    }
    function onReaderZoom() { try { if (running && full()) FN.zoomWatch(); } catch (e) {} }
    function onUpdate() { try { if (running && full()) ev('app.update_reload'); } catch (e) {} }

    var CAPTURE_EVENTS = ['click', 'change', 'input', 'dblclick', 'pointerdown', 'submit', 'keydown'];
    var ACT_EVENTS = ['pointerdown', 'touchstart', 'keydown', 'wheel', 'scroll'], READ_EVENTS = ['scroll', 'wheel', 'keydown', 'touchmove', 'pointerdown'];
    document.addEventListener('dblclick', function () { lastDbl = Date.now(); }, { capture: true, passive: true });
    document.addEventListener('click', function (e) { try { if (e.target.closest && e.target.closest('.dict-chip')) lastChip = Date.now(); } catch (x) {} }, { capture: true, passive: true });

    function begin() {
      try {
        if (running) return;
        mode = readMode(); if (dnt() || mode.m === 'off') return;
        st = load(); if (!st || !save()) { st = null; return; }          // 無法保存就不啟用（否則每次都會算新實例）
        running = true; needOpen = true; hiddenAt = 0; nextTry = 0; lastSend = 0; sessionSec = 0; beatStop = false; beatFail = 0; beatMs = BEAT_DEFAULT; beatSent = false;
        lastAct = lastTick = lastRead = Date.now();
        ACT_EVENTS.forEach(function (ev_) { document.addEventListener(ev_, act, { capture: true, passive: true }); });
        READ_EVENTS.forEach(function (ev_) { document.addEventListener(ev_, readAct, { capture: true, passive: true }); });
        document.addEventListener('visibilitychange', onVis); window.addEventListener('pagehide', onHide);
        if (full()) {
          CAPTURE_EVENTS.forEach(function (ev_) { if (RULES[ev_]) document.addEventListener(ev_, onDoc, { capture: true, passive: true }); });
          document.addEventListener('click', onTourClick, { capture: true, passive: true }); document.addEventListener('keydown', onTourKey, { capture: true, passive: true });
          window.addEventListener('reader-zoom', onReaderZoom); window.addEventListener('reader-before-update', onUpdate);
          setupObservers();
        }
        timers.tick = setInterval(tick, 1000); timers.flush = setInterval(function () { flush(true); retryForget(); }, 60000);
        maybeOpen(); if (mode.p) { beatNext(); setTimeout(beatKick, 500); }
      } catch (e) { running = false; }
    }
    function stop() {
      try {
        running = false; clearInterval(timers.tick); clearInterval(timers.flush); clearTimeout(timers.start); clearTimeout(beatTimer); clearTimeout(fsTimer); clearTimeout(zTimer); clearTimeout(topTimer); clearTimeout(lpTimer);
        pendingNodes.forEach(function (x) { clearTimeout(x.t); }); pendingNodes = [];
        ACT_EVENTS.forEach(function (ev_) { document.removeEventListener(ev_, act, { capture: true }); });
        READ_EVENTS.forEach(function (ev_) { document.removeEventListener(ev_, readAct, { capture: true }); });
        CAPTURE_EVENTS.forEach(function (ev_) { document.removeEventListener(ev_, onDoc, { capture: true }); });
        document.removeEventListener('click', onTourClick, { capture: true }); document.removeEventListener('keydown', onTourKey, { capture: true });
        document.removeEventListener('visibilitychange', onVis); window.removeEventListener('pagehide', onHide);
        window.removeEventListener('reader-zoom', onReaderZoom); window.removeEventListener('reader-before-update', onUpdate);
        observers.forEach(function (o) { try { o.disconnect(); } catch (e) {} }); observers = []; exPending = {}; rpPending = 0; sLast = null; dCur = null;
        st = null;
      } catch (e) {}
    }

    // ---- forget 與控制（D057）----
    function retryForget() {
      try {
        var raw = fetchKey(FORGET_KEY); if (!raw || navigator.onLine === false || dnt()) return;
        var j = JSON.parse(raw); if (!j || !/^[0-9a-f-]{32,36}$/.test(j.id)) { store(FORGET_KEY, null); return; }
        post('/forget', { id: j.id }, function (success) { if (success) store(FORGET_KEY, null); });    // 成功才刪除本機的編號副本
      } catch (e) { store(FORGET_KEY, null); }
    }
    function control(d) {
      try {
        d = d || {}; var m = /^(off|basic|full)$/.test(d.mode) ? d.mode : null, cur = readMode();
        var p = typeof d.presence === 'boolean' ? d.presence : (m ? m !== 'off' : cur.p);
        if (!m && typeof d.presence !== 'boolean') return;
        m = m || cur.m;
        if (m === 'off') {
          var id = st ? st.id : (function () { try { var j = JSON.parse(fetchKey(KEY)); return j && j.id; } catch (e) { return null; } })();
          beatLeave(); stop(); store(KEY, null); store(MODE_KEY, JSON.stringify({ m: 'off', p: false }));
          if (id && !dnt()) { store(FORGET_KEY, JSON.stringify({ id: id })); retryForget(); }     // 立即停止、丟棄未送資料、送 forget、刪除本機編號；離線留墓碑待補送
          return;
        }
        store(MODE_KEY, JSON.stringify({ m: m, p: p })); store(OFF, null);
        if (dnt()) return;
        beatLeave(); stop(); mode = readMode(); begin();
      } catch (e) {}
    }
    window.addEventListener('hk-analytics-control', function (e) { control(e && e.detail); });

    if (dnt()) { return; }                                              // DNT／GPC：不建立編號、不傳送、不寫計數
    if (mode.m === 'off') { store(KEY, null); retryForget(); return; }   // 關閉狀態下不留編號
    // 載入完成後再等約 3 秒才啟動，不拖慢首屏、不在 App 啟動路徑上做事。
    var arm = function () { timers.start = setTimeout(begin, START_MS); };
    if (document.readyState === 'complete') arm(); else window.addEventListener('load', arm, { once: true });
  } catch (e) { /* 統計永遠不得影響 App */ }
})();
