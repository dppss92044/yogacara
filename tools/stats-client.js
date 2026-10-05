/* W001 匿名使用統計客戶端（DECISIONS D040–D048）。
 * 只送 {"v":2,"id":"<隨機匿名編號>","o":<開啟次數>,"s":<有效使用秒數>,"d":"phone|tablet|desktop"}；不送任何其他資料。
 * 裝置大類在本機即時分類，只送分類結果；不讀 User-Agent，分類用的量不傳送、不保存。
 * 不使用任何定位 API；不讀寫既有功能的任何資料；任何錯誤都靜默，不影響 App。
 * 來源檔：tools/stats-client.js；由 tools/patch-w001-stats.py 注入 index.html。 */
(function () {
  'use strict';
  try {
    var EP = 'https://yogacara-stats.dppss92044.workers.dev/v';
    var KEY = 'hk-anon-stat-v1', OFF = 'hk-stats-off-v1';
    var IDLE_MS = 90000, GAP_MS = 30 * 60000, CAP_S = 3 * 3600, ROTATE_MS = 180 * 864e5;                  // D048：匿名 ID 每 180 天輪替
    var FLUSH_MS = 300000, RETRY_MS = 300000, START_MS = 3000, TIMEOUT_MS = 8000;
    var MAX_O = 20, MAX_S = 10800, KEEP_O = 1000, KEEP_S = 1000000;
    var MSG_OFF = '已關閉：不再傳送任何統計，本機的匿名編號也已刪除。';
    var MSG_DNT = '偵測到瀏覽器的「不追蹤」設定，匿名使用統計已自動停用。';

    function store(k, v) {                       // v === null 表示刪除；失敗回傳 false
      try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); return true; } catch (e) { return false; }
    }
    function fetchKey(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function dnt() {
      try {
        return navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.msDoNotTrack === '1' || navigator.globalPrivacyControl === true;
      } catch (e) { return false; }
    }
    function isOff() { return fetchKey(OFF) === '1'; }
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
    function ok(n, max) { return typeof n === 'number' && isFinite(n) && n >= 0 && n <= max; }

    var st = null;                               // {id, t, o, s}：t＝編號建立時間（毫秒）
    var running = false, timers = {}, sessionSec = 0, needOpen = true, hiddenAt = 0;
    var lastAct = 0, lastTick = 0, inFlight = false, nextTry = 0, lastSend = 0;

    function load() {
      var raw = fetchKey(KEY), j = null;
      try { j = raw && JSON.parse(raw); } catch (e) { j = null; }
      var now = Date.now();
      var valid = j && typeof j.id === 'string' && /^[0-9a-f-]{32,36}$/.test(j.id) && ok(j.t, now + 864e5) && ok(j.o, KEEP_O) && ok(j.s, KEEP_S);
      if (valid && now - j.t <= ROTATE_MS) return { id: j.id, t: j.t, o: j.o | 0, s: j.s | 0 };
      var id = newId(); if (!id) return null;            // 沒有密碼學亂數就不啟用
      return { id: id, t: now, o: valid ? j.o | 0 : 0, s: valid ? j.s | 0 : 0 };   // 180 天自動換新編號
    }
    function save() { return store(KEY, JSON.stringify(st)); }

    function flush(periodic) {
      try {
        if (!running || inFlight || !st) return;
        var now = Date.now(); if (now < nextTry) return;
        if (periodic === true && now - lastSend < FLUSH_MS) return;      // 前景定時回報：距上次嘗試滿 5 分鐘才送
        var o = Math.min(st.o, MAX_O), s = Math.min(st.s, MAX_S);
        if (o + s <= 0) return;
        if (navigator.onLine === false) return;
        // 先扣除再送（頁面可能在請求完成前就被關閉；失敗且頁面還在時再加回），避免下次啟動重複計算。
        st.o -= o; st.s -= s; save();
        inFlight = true; lastSend = now;
        var done = function (success) {
          inFlight = false;
          if (!success) { nextTry = Date.now() + RETRY_MS; if (st) { st.o = Math.min(st.o + o, KEEP_O); st.s = Math.min(st.s + s, KEEP_S); save(); } }
        };
        var ctl = typeof AbortController === 'function' ? new AbortController() : null;
        var to = ctl ? setTimeout(function () { try { ctl.abort(); } catch (e) {} }, TIMEOUT_MS) : 0;
        fetch(EP, {
          method: 'POST', body: JSON.stringify({ v: 2, id: st.id, o: o, s: s, d: deviceClass() }), keepalive: true, mode: 'cors',
          credentials: 'omit', referrerPolicy: 'no-referrer', headers: { 'Content-Type': 'text/plain' }, signal: ctl ? ctl.signal : undefined
        }).then(function (r) { clearTimeout(to); done(r && r.ok); }, function () { clearTimeout(to); done(false); });
      } catch (e) { inFlight = false; }
    }

    function act() { lastAct = Date.now(); }
    function maybeOpen() {
      if (!needOpen || document.visibilityState === 'hidden' || !st) return;
      needOpen = false; sessionSec = 0; st.o = Math.min(st.o + 1, KEEP_O); save();
      setTimeout(function () { flush(); }, 0);
    }
    function tick() {
      try {
        var now = Date.now(), dt = Math.round((now - lastTick) / 1000); lastTick = now;
        if (dt <= 0 || document.visibilityState !== 'visible' || now - lastAct > IDLE_MS || sessionSec >= CAP_S) return;
        dt = Math.min(dt, 2); sessionSec += dt; st.s = Math.min(st.s + dt, KEEP_S);
        if (!tick.n) tick.n = 0; if (++tick.n % 15 === 0) save();     // 每 15 秒存一次，避免頻繁寫入
      } catch (e) {}
    }
    function onVis() {
      try {
        var now = Date.now();
        if (document.visibilityState === 'hidden') { hiddenAt = now; save(); flush(); return; }
        if (hiddenAt && now - hiddenAt > GAP_MS) needOpen = true;
        hiddenAt = 0; lastAct = now; lastTick = now; maybeOpen();
      } catch (e) {}
    }
    function onHide() { try { save(); flush(); } catch (e) {} }

    var ACT_EVENTS = ['pointerdown', 'touchstart', 'keydown', 'wheel', 'scroll'];
    function begin() {
      try {
        if (running) return;
        if (dnt() || isOff()) return;
        st = load(); if (!st || !save()) { st = null; return; }   // 無法保存就不啟用（否則每次都會算新實例）
        running = true; needOpen = true; hiddenAt = 0; nextTry = 0; lastSend = 0; sessionSec = 0;
        lastAct = lastTick = Date.now();
        ACT_EVENTS.forEach(function (ev) { document.addEventListener(ev, act, { capture: true, passive: true }); });
        document.addEventListener('visibilitychange', onVis);
        window.addEventListener('pagehide', onHide);
        timers.tick = setInterval(tick, 1000);
        timers.flush = setInterval(function () { flush(true); }, 60000);
        maybeOpen();
      } catch (e) { running = false; }
    }
    function stop() {
      try {
        running = false;
        clearInterval(timers.tick); clearInterval(timers.flush); clearTimeout(timers.start);
        ACT_EVENTS.forEach(function (ev) { document.removeEventListener(ev, act, { capture: true }); });
        document.removeEventListener('visibilitychange', onVis);
        window.removeEventListener('pagehide', onHide);
        st = null;
      } catch (e) {}
    }

    // ---- 關於頁：開關與告知 ----
    function bindSwitch() {
      try {
        var sw = document.getElementById('optStats'), msg = document.getElementById('statsMsg');
        if (!sw) return;
        function paint() {
          if (dnt()) { sw.checked = false; sw.disabled = true; if (msg) msg.textContent = MSG_DNT; return; }
          sw.disabled = false; sw.checked = !isOff(); if (msg) msg.textContent = sw.checked ? '' : MSG_OFF;
        }
        paint();
        sw.addEventListener('change', function () {
          try {
            if (sw.checked) { store(OFF, null); if (msg) msg.textContent = ''; begin(); }
            else {
              stop(); store(KEY, null); store(OFF, '1');             // 立即停止、丟棄未送資料、刪除編號、保留「已關閉」
              if (msg) msg.textContent = MSG_OFF;
            }
          } catch (e) {}
        });
      } catch (e) {}
    }
    bindSwitch();
    if (dnt() || isOff()) { if (!dnt()) store(KEY, null); return; }   // 關閉狀態下不留編號
    // 載入完成後再等約 3 秒才啟動，不拖慢首屏、不在 App 啟動路徑上做事。
    var arm = function () { timers.start = setTimeout(begin, START_MS); };
    if (document.readyState === 'complete') arm(); else window.addEventListener('load', arm, { once: true });
  } catch (e) { /* 統計永遠不得影響 App */ }
})();
