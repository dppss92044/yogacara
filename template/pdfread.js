/* 科判閱讀模板：把 PDF 轉成匯入用的文字。
 * PdfRead.read(pdfjsLib, data, opts) → Promise<pages>      讀出每頁的字（含位置）與線條
 * PdfRead.toText(pages, name)        → { text, kind, warnings }
 *   kind = 'tree'：科判表（直書樹狀圖），依連線還原科判樹，輸出「# 甲一、…」
 *   kind = 'text'：講表、講記等文章，直書或橫書都依版面接成段落
 *   kind = 'empty'：沒有文字（掃描圖片），需要先做文字辨識
 * 瀏覽器與 Node 都能用（Node 測試時把 pdfjs 傳進來）。
 */
(function (root) {
  'use strict';
  var TIERS = '壹貳參肆伍陸柒捌玖拾', GAN = '甲乙丙丁戊己庚辛壬癸', ZHI = '子丑寅卯辰巳午未申酉戌亥';
  var QZW = '天地玄黃宇宙洪荒日月盈昃辰宿列張寒來暑往秋收冬藏閏餘成歲律呂調陽雲騰致雨露結為霜';
  var NUMS = '一二三四五六七八九十百〇ㄧ';
  var LABEL_START = new RegExp('^(?:[' + GAN + ZHI + QZW + '][' + NUMS + ']+|[' + TIERS + '](?=[、．.]|$))');
  // 科號：天干地支等＋合法的中文數字（「己五四眾歡喜」的科號是「己五」，標題是「四眾歡喜」）
  var NUM_RE = /^(?:[一二三四五六七八九]?百(?:[一二三四五六七八九]?十)?[一二三四五六七八九]?|[二三四五六七八九]?十[一二三四五六七八九]?|[一二三四五六七八九])/;
  function splitLabel(t) {
    t = t.replace(/^[◎○●△□\d\s]+/, '');
    var ch = t[0];
    if (TIERS.indexOf(ch) >= 0 && !/^[一二三四五六七八九十]/.test(t.slice(1))) return [ch, t.slice(1).replace(/^[、．.\s]+/, '')];
    if ((GAN + ZHI + QZW).indexOf(ch) < 0) return null;
    var m = NUM_RE.exec(t.slice(1).replace(/ㄧ/g, '一'));
    if (!m || !m[0]) return null;
    return [ch + m[0], t.slice(1 + m[0].length).replace(/^[、．.\s]+/, '')];
  }
  // 標題後面的目錄點線、參照記號（……△5今初。）
  function cleanTitle(t) { return t.replace(/[…⋯·]+/g, '').replace(/[△□○◎]?\d+/g, '').replace(/[①-⑳]/g, '').replace(/今初。?/g, '').replace(/[△□○◎]\d*$/, '').replace(/今初。?$/, '').replace(/\s+/g, '').trim(); }
  var LEVEL_OF = function (label) {
    var ch = label[0];
    if (TIERS.indexOf(ch) >= 0) return 0;
    if (GAN.indexOf(ch) >= 0) return 1 + GAN.indexOf(ch);
    if (ZHI.indexOf(ch) >= 0) return 11 + ZHI.indexOf(ch);
    var q = QZW.indexOf(ch); return q >= 0 ? 23 + q : -1;
  };
  // 直書用的標點、異體寫法 → 一般寫法
  var MAP = { '﹁': '「', '﹂': '」', '﹃': '『', '﹄': '』', '︽': '《', '︾': '》', '︵': '（', '︶': '）', '︷': '｛', '︸': '｝',
    '︹': '〔', '︺': '〕', '︻': '【', '︼': '】', '︿': '〈', '﹀': '〉', '︐': '，', '︑': '、', '︒': '。', '︓': '：', '︔': '；',
    '︕': '！', '︖': '？', '︙': '…', '︰': '：', 'ㄧ': '一', '﹐': '，', '﹑': '、', '﹒': '．', '﹔': '；', '﹕': '：', '︱': '｜' };
  function norm(s) { return s.replace(/[\ue000-\uf8ff]/g, '').replace(/[﹁﹂﹃﹄︽︾︵︶︷︸︹︺︻︼︿﹀︐︑︒︓︔︕︖︙︰ㄧ﹐﹑﹒﹔﹕︱]/g, function (c) { return MAP[c]; }); }
  var SAME = { '敍': '敘', '敎': '教', '爲': '為', '眞': '真', '說': '說', '衆': '眾', '卽': '即', '旣': '既' };
  function key(s) { return norm(s).replace(/[\s、（）()：:◎「」『』，,。]/g, '').replace(/[敍敎爲眞衆卽旣]/g, function (c) { return SAME[c]; }); }

  /* ---------- 讀 PDF ---------- */
  function mul(m, n) { return [m[0] * n[0] + m[1] * n[2], m[0] * n[1] + m[1] * n[3], m[2] * n[0] + m[3] * n[2], m[2] * n[1] + m[3] * n[3], m[4] * n[0] + m[5] * n[2] + n[4], m[4] * n[1] + m[5] * n[3] + n[5]]; }

  function pageLines(OPS, ol) {
    var ctm = [1, 0, 0, 1, 0, 0], st = [], path = null, segs = [];
    function ap(m, x, y) { return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; }
    function flush(stroke) {
      if (!path) return;
      var k = 0, cur = null, start = null, c = path.c, m = path.m;
      path.ops.forEach(function (op) {
        if (op === OPS.moveTo) { cur = start = ap(m, c[k], c[k + 1]); k += 2; }
        else if (op === OPS.lineTo) { var p = ap(m, c[k], c[k + 1]); k += 2; if (stroke && cur) segs.push([cur, p]); cur = p; }
        else if (op === OPS.rectangle) {
          var x = c[k], y = c[k + 1], w = c[k + 2], h = c[k + 3]; k += 4;
          var a = ap(m, x, y), b = ap(m, x + w, y + h), W = Math.abs(b[0] - a[0]), H = Math.abs(b[1] - a[1]);
          if (W < 2.5 && H > 4) segs.push([[(a[0] + b[0]) / 2, a[1]], [(a[0] + b[0]) / 2, b[1]]]);       // 細長方塊當成線
          else if (H < 2.5 && W > 4) segs.push([[a[0], (a[1] + b[1]) / 2], [b[0], (a[1] + b[1]) / 2]]);
          else if (stroke) { var p1 = ap(m, x, y), p2 = ap(m, x + w, y), p3 = ap(m, x + w, y + h), p4 = ap(m, x, y + h); segs.push([p1, p2], [p2, p3], [p3, p4], [p4, p1]); }
        }
        else if (op === OPS.curveTo) { cur = ap(m, c[k + 4], c[k + 5]); k += 6; }
        else if (op === OPS.curveTo2 || op === OPS.curveTo3) { cur = ap(m, c[k + 2], c[k + 3]); k += 4; }
        else if (op === OPS.closePath) { if (stroke && cur && start) segs.push([cur, start]); cur = start; }
      });
      path = null;
    }
    for (var i = 0; i < ol.fnArray.length; i++) {
      var f = ol.fnArray[i], a = ol.argsArray[i];
      if (f === OPS.save) st.push(ctm);
      else if (f === OPS.restore) ctm = st.pop() || ctm;
      else if (f === OPS.transform) ctm = mul(a, ctm);
      else if (f === OPS.constructPath) { flush(false); path = { ops: a[0], c: a[1], m: ctm }; }
      else if (f === OPS.stroke || f === OPS.closeStroke || f === OPS.fillStroke || f === OPS.eoFillStroke || f === OPS.closeFillStroke || f === OPS.closeEOFillStroke) flush(true);
      else if (f === OPS.fill || f === OPS.eoFill) flush(false);
      else if (f === OPS.endPath) path = null;
    }
    // 只留水平、垂直線
    return segs.filter(function (s) { return Math.abs(s[0][0] - s[1][0]) < 1.5 || Math.abs(s[0][1] - s[1][1]) < 1.5; })
      .filter(function (s) { return Math.hypot(s[0][0] - s[1][0], s[0][1] - s[1][1]) > 3; });
  }

  function pageChars(tc) {
    // 每個字的位置：依文字矩陣的方向排開。Word 等軟體的直書常是「整行旋轉 90 度」，
    // 這時一串字是往下排，不是往右排。
    var out = [];
    tc.items.forEach(function (it, n) {
      var str = it.str || '', t = it.transform;
      if (!str.trim() || /^\s*[-–—]\s*\d+\s*[-–—]\s*$/.test(str)) return;             // 頁碼
      var ch = Array.from(str), L = ch.length;
      var s = Math.hypot(t[2], t[3]) || Math.hypot(t[0], t[1]) || 10;
      var al = Math.hypot(t[0], t[1]) || 1, ax = t[0] / al, ay = t[1] / al;           // 前進方向
      var ux = t[2] / s, uy = t[3] / s;                                               // 字的「上方」
      var rotated = Math.abs(ay) > Math.abs(ax);
      var vfont = !rotated && L > 1 && it.height > it.width * 1.4 && it.height > s * 1.4;   // 直書字型（不旋轉、往下排）
      var len = vfont ? it.height : (it.width || s * L), step = len / L;
      if (vfont) { ax = 0; ay = -1; ux = 0; uy = 1; }
      ch.forEach(function (c, i) {
        if (!c.trim()) return;
        var x0 = t[4] + ax * step * i, y0 = t[5] + ay * step * i, xs, ys;
        if (vfont) { xs = [x0, x0 + s]; ys = [y0, y0 + s]; }
        else {
          var x1 = x0 + ax * step, y1 = y0 + ay * step;
          xs = [x0, x1, x0 + ux * s, x1 + ux * s]; ys = [y0, y1, y0 + uy * s, y1 + uy * s];
        }
        var xl = Math.min.apply(null, xs), xr = Math.max.apply(null, xs), yb = Math.min.apply(null, ys), yt = Math.max.apply(null, ys);
        if (vfont || rotated) { yb = Math.max(yb, yt - s); }                             // 直行：一格一個字
        out.push({ c: c, x: (xl + xr) / 2, y: yb, s: s, top: yb + s, h: !vfont && !rotated && L > 1, item: n });
      });
    });
    return out;
  }

  function read(pdfjsLib, data, opts) {
    opts = opts || {};
    var params = { data: data, verbosity: 0 };
    if (opts.cMapUrl) { params.cMapUrl = opts.cMapUrl; params.cMapPacked = true; }
    if (opts.standardFontDataUrl) params.standardFontDataUrl = opts.standardFontDataUrl;
    return pdfjsLib.getDocument(params).promise.then(function (doc) {
      var pages = [], n = doc.numPages;
      function one(i) {
        if (i > n) return Promise.resolve(pages);
        return doc.getPage(i).then(function (pg) {
          var vp = pg.getViewport({ scale: 1 });
          return Promise.all([pg.getTextContent(), pg.getOperatorList()]).then(function (r) {
            pages.push({ n: i, w: vp.viewBox[2] - vp.viewBox[0], h: vp.viewBox[3] - vp.viewBox[1], chars: pageChars(r[0]), segs: pageLines(pdfjsLib.OPS, r[1]) });
            if (opts.progress) opts.progress(i, n);
            pg.cleanup();
            return one(i + 1);
          });
        });
      }
      return one(1).then(function (p) { doc.destroy(); return p; });
    });
  }

  /* ---------- 共用：把字排成直行 ---------- */
  function median(a) { var b = a.slice().sort(function (x, y) { return x - y; }); return b.length ? b[Math.floor(b.length / 2)] : 0; }

  function columns(chars) {
    // 直行：x 中心相近的字是同一行
    var cs = chars.filter(function (c) { return !c.h; }).sort(function (a, b) { return b.x - a.x; }), cols = [];
    cs.forEach(function (c) {
      var col = null;
      for (var i = cols.length - 1; i >= 0 && i >= cols.length - 6; i--) if (Math.abs(cols[i].x - c.x) <= c.s * 0.35) { col = cols[i]; break; }
      if (!col) { col = { x: c.x, chars: [] }; cols.push(col); }
      col.chars.push(c);
    });
    cols.forEach(function (col) { col.chars.sort(function (a, b) { return b.y - a.y; }); });
    return cols;
  }

  /* ---------- 科判表：依連線還原樹 ---------- */
  function hLines(chars) {
    // 橫寫的一行：由多字的橫排字串開始，把同一條基線上緊鄰的單字也收進來
    var lines = [];
    chars.forEach(function (c) {
      if (!c.h) return;
      var ln = null;
      for (var i = 0; i < lines.length; i++) if (Math.abs(lines[i].y - c.y) < c.s * 0.25) { ln = lines[i]; break; }
      if (!ln) { ln = { y: c.y, s: c.s, chars: [] }; lines.push(ln); }
      ln.chars.push(c);
    });
    lines.forEach(function (ln) {
      var grew = true;
      while (grew) {
        grew = false;
        var lo = Math.min.apply(null, ln.chars.map(function (c) { return c.x; })), hi = Math.max.apply(null, ln.chars.map(function (c) { return c.x; }));
        chars.forEach(function (c) {
          if (c.h || Math.abs(c.y - ln.y) > ln.s * 0.25 || Math.abs(c.s - ln.s) > ln.s * 0.2) return;
          if (c.x >= lo - ln.s * 1.6 && c.x <= hi + ln.s * 1.6) { c.h = true; ln.chars.push(c); grew = true; }
        });
      }
    });
    return lines;
  }

  function runsOf(page) {
    var runs = [], lines = hLines(page.chars);
    var CLOSE = /^[）)」』]$/;
    columns(page.chars).forEach(function (col) {
      var cur = null;
      col.chars.forEach(function (c, i) {
        var prev = col.chars[i - 1], gap = prev ? prev.y - c.top : 0;
        var two = c.c + (col.chars[i + 1] ? col.chars[i + 1].c : '');
        var newLabel = prev && gap > c.s * 0.8 && !!splitLabel(norm(two + (col.chars[i + 2] ? col.chars[i + 2].c : '')));
        var afterColon = prev && /[：:]/.test(norm(prev.c));                      // 「（分五：」之後的說明另成一段
        var lone = prev && CLOSE.test(norm(c.c)) && gap > c.s * 0.3 && i === col.chars.length - 1;   // 說明後面單獨的「）」
        var paren = prev && (/^[（(]$/.test(norm(c.c)) || /^[）)]$/.test(norm(prev.c)));              // 括號說明自成一段
        if (!cur || gap > c.s * 2.5 || newLabel || afterColon || lone || paren) { cur = { chars: [], vert: true }; runs.push(cur); }
        cur.chars.push(c);
      });
    });
    // 橫寫的一行（例如別表上方「◎甲一、…」）；由右往左寫的要倒過來
    lines.forEach(function (ln) {
      var cs = ln.chars.sort(function (a, b) { return a.x - b.x; }), t = norm(cs.map(function (c) { return c.c; }).join(''));
      var rev = Array.from(t).reverse().join('').replace(/[（）()]/g, function (p) { return { '（': '）', '）': '（', '(': ')', ')': '(' }[p]; });
      var bare = function (s) { return s.replace(/^[◎○●\s]+/, ''); };
      runs.push({ chars: cs, vert: false, text: splitLabel(rev) && !splitLabel(t) ? rev : t });
    });
    runs.forEach(function (r) {
      if (!r.text) r.text = norm(r.chars.map(function (c) { return c.c; }).join(''));
      r.s = median(r.chars.map(function (c) { return c.s; }));
      r.top = Math.max.apply(null, r.chars.map(function (c) { return c.top; }));
      r.bot = Math.min.apply(null, r.chars.map(function (c) { return c.y; }));
      r.x = r.vert ? median(r.chars.map(function (c) { return c.x; })) : (r.chars[0].x + r.chars[r.chars.length - 1].x) / 2;
      r.seed = !!splitLabel(r.text);
    });
    return runs;
  }

  function nodesOf(page, pi) {
    var runs = runsOf(page), seeds = runs.filter(function (r) { return r.seed; }), nodes = [];
    seeds.forEach(function (r) { var nd = { page: pi, seed: r, runs: [], x: r.x, top: r.top, parent: null, kids: [], linked: false }; r.node = nd; nodes.push(nd); });
    runs.forEach(function (r) {
      if (r.seed) return;
      var best = null, score = Infinity;
      seeds.forEach(function (sd) {
        if (r.vert && !sd.vert) return;                          // 橫寫的標題不收直行的字
        if (r.top > sd.top + sd.s * 0.5) return;                 // 說明文字不會比科號還高
        var dx = Math.abs(r.x - sd.x); if (dx > sd.s * 3.2) return;
        var gap = r.top < sd.bot ? sd.bot - r.top : 0, sc = dx + gap;
        if (sc < score) { score = sc; best = sd; }
      });
      if (best) { best.node.runs.push(r); r.node = best.node; } else r.node = null;
    });
    // 說明分好幾行：緊鄰已經歸好的那一行、頂端差不多高 → 同一科
    for (var grew = true; grew;) {
      grew = false;
      runs.forEach(function (r) {
        if (r.seed || r.node || !r.vert) return;
        var nb = null, d = Infinity;
        runs.forEach(function (o) {
          if (!o.node || o === r || !o.vert) return;
          var dx = Math.abs(o.x - r.x);
          if (dx > r.s * 2 || Math.abs(o.top - r.top) > r.s * 2.2) return;
          if (dx < d) { d = dx; nb = o; }
        });
        if (nb) { r.node = nb.node; nb.node.runs.push(r); grew = true; }
      });
    }
    nodes.forEach(function (nd) {
      var rs = nd.runs, minBot = Math.min.apply(null, rs.map(function (r) { return r.bot; }).concat([Infinity]));
      var last = function (r) { return /^[）)」』]+$/.test(r.text) || rs.every(function (o) { return o === r || r.top < o.bot; }) && rs.length > 1; };
      // 和科號同一行、緊接在下面的字是標題本身（遇到「：」為止，之後是說明）
      var chain = [], tail = nd.seed;
      if (nd.seed.vert && !/[：:]$/.test(nd.seed.text)) for (var more = true; more;) {
        more = false; var took = false;
        rs.forEach(function (r) {
          if (took || chain.indexOf(r) >= 0 || !r.vert || Math.abs(r.x - tail.x) > r.s * 0.4 || tail.bot - r.top > r.s * 1.2 || r.top - tail.bot > r.s * 0.5) return;
          chain.push(r); tail = r; took = true; more = !/[：:]$/.test(r.text);
        });
      }
      rs = rs.filter(function (r) { return chain.indexOf(r) < 0; });
      rs.sort(function (a, b) { return (last(a) - last(b)) || (b.x - a.x) || (b.top - a.top); });
      rs = chain.concat(rs); nd.runs = rs;
      var t = nd.seed.text + rs.map(function (r) { return r.text; }).join(''), sp = splitLabel(t) || ['', t];
      var rm = /([△□○])\s*(\d+)/.exec(t); nd.ref = rm ? rm[1] + rm[2] : '';
      nd.head = /^\s*[◎△□○]/.test(nd.seed.text) || !nd.seed.vert;
      nd.label = sp[0]; nd.title = cleanTitle(sp[1]);
      // 標題又以下一層科號開頭（頁首「丁五 戊二如來垂答」這種路徑）：取最後那一科
      for (var inner; nd.label && (inner = splitLabel(nd.title)) && LEVEL_OF(inner[0]) > LEVEL_OF(nd.label) && LEVEL_OF(inner[0]) <= LEVEL_OF(nd.label) + 3;) { nd.label = inner[0]; nd.title = cleanTitle(inner[1]); }
      nd.level = nd.label ? LEVEL_OF(nd.label) : -1;
      void minBot;
    });
    // 字 → 節點
    runs.forEach(function (r) { r.chars.forEach(function (c) { c.node = r.node; }); });
    return { nodes: nodes, runs: runs };
  }

  function link(page, pi, nodes) {
    var segs = page.segs, N = segs.length, par = [];
    for (var i = 0; i < N; i++) par.push(i);
    function f(i) { while (par[i] !== i) i = par[i] = par[par[i]]; return i; }
    function onSeg(p, s, tol) {
      var x1 = Math.min(s[0][0], s[1][0]) - tol, x2 = Math.max(s[0][0], s[1][0]) + tol, y1 = Math.min(s[0][1], s[1][1]) - tol, y2 = Math.max(s[0][1], s[1][1]) + tol;
      return p[0] >= x1 && p[0] <= x2 && p[1] >= y1 && p[1] <= y2;
    }
    function cross(a, b) {      // 一橫一直交叉（例如直線穿過橫槓）
      var va = Math.abs(a[0][0] - a[1][0]) < 1.5, vb = Math.abs(b[0][0] - b[1][0]) < 1.5;
      if (va === vb) return false;
      var v = va ? a : b, h = va ? b : a, x = v[0][0], y = h[0][1];
      return x >= Math.min(h[0][0], h[1][0]) - 1 && x <= Math.max(h[0][0], h[1][0]) + 1 && y >= Math.min(v[0][1], v[1][1]) - 1 && y <= Math.max(v[0][1], v[1][1]) + 1;
    }
    for (i = 0; i < N; i++) for (var j = i + 1; j < N; j++) {
      var a = segs[i], b = segs[j];
      if (onSeg(a[0], b, 2.5) || onSeg(a[1], b, 2.5) || onSeg(b[0], a, 2.5) || onSeg(b[1], a, 2.5) || cross(a, b)) par[f(i)] = f(j);
    }
    var groups = {};
    for (i = 0; i < N; i++) (groups[f(i)] = groups[f(i)] || []).push(i);
    var chars = page.chars.filter(function (c) { return c.node; });
    function near(p, up) {
      var best = null, d = Infinity;
      chars.forEach(function (c) {
        if (Math.abs(c.x - p[0]) > c.s * 0.9) return;
        var dd = up ? c.y - p[1] : p[1] - c.top;
        if (dd < -c.s * 0.6 || dd > c.s * 3) return;
        if (Math.abs(dd) < d) { d = Math.abs(dd); best = c; }
      });
      return best && best.node;
    }
    var edge = 0;
    Object.keys(groups).forEach(function (g) {
      var ids = groups[g], parents = [], kids = [], off = false;
      ids.forEach(function (i) {
        var s = segs[i], vert = Math.abs(s[0][0] - s[1][0]) < 1.5;
        [0, 1].forEach(function (e) {
          var p = s[e], q = s[1 - e];
          var free = ids.every(function (j) { return j === i || !onSeg(p, segs[j], 2.5); });
          if (!free) return;
          if (vert) {
            var nd = p[1] > q[1] ? near(p, true) : near(p, false);
            if (nd) (p[1] > q[1] ? parents : kids).push(nd);
          } else if (p[0] < (page.x0 || 0) + 25 || p[0] > (page.x1 || page.w) - 25) off = true;
          // 橫線的端點不判斷上下層（繞到旁邊的線容易誤接）
        });
      });
      parents.sort(function (a, b) { return b.top - a.top; });
      var P = parents[0];
      kids.forEach(function (k) {
        if (k === P) return;
        k.linked = true;
        if (P) { P.linked = true; if (!k.parent) { k.parent = P; P.kids.push(k); edge++; } }
        else k.offpage = off;
      });
      if (P) P.linked = true;
    });
    return edge;
  }

  // 一張大科判圖分在好幾頁：本頁從左邊出去的橫線，接到下一頁右邊進來、同高度的橫線 → 拼成一張
  function edgeEnds(pg, side) {
    var out = [];
    pg.segs.forEach(function (s) {
      if (Math.abs(s[0][1] - s[1][1]) >= 1.5) return;
      s.forEach(function (p) { if (side === 'L' ? p[0] < 25 : p[0] > pg.w - 25) out.push(p); });
    });
    return out;
  }
  function spreads(pages) {
    var out = [], i = 0;
    while (i < pages.length) {
      var first = pages[i], sp = { n: first.n, w: first.w, h: first.h, x0: 0, x1: first.w, chars: first.chars.slice(), segs: first.segs.slice(), pages: [first.n] };
      var cur = first, off = 0;
      while (i + 1 < pages.length) {
        var nx = pages[i + 1], L = edgeEnds(cur, 'L'), R = edgeEnds(nx, 'R'), hit = null;
        var bestD = Infinity;     // 兩頁的線要剛好在頁邊接上
        L.forEach(function (l) { R.forEach(function (r) { var d = Math.abs(l[0]) + Math.abs(r[0] - nx.w); if (Math.abs(l[1] - r[1]) < 3 && d < bestD) { bestD = d; hit = [l, r]; } }); });
        if (!hit) break;
        var dx = off + hit[0][0] - hit[1][0];
        nx.chars.forEach(function (c) { var d = Object.assign({}, c); d.x += dx; sp.chars.push(d); });
        nx.segs.forEach(function (s) { sp.segs.push([[s[0][0] + dx, s[0][1]], [s[1][0] + dx, s[1][1]]]); });
        sp.x0 = Math.min(sp.x0, dx); sp.pages.push(nx.n);
        off = dx; cur = nx; i++;
      }
      out.push(sp); i++;
    }
    return out;
  }

  function treeText(pages) {
    var all = [], warnings = [], dropped = [];
    pages = spreads(pages);
    pages.forEach(function (pg, pi) {
      var r = nodesOf(pg, pi);
      link(pg, pi, r.nodes);
      // 頁首的標題（△2己二身子領解、橫寫的「丁一…／戊一…」）：本頁沒有上一層的科，接在它下面
      var heads = r.nodes.filter(function (n) { return n.head && !n.parent && !n.kids.length && n.level >= 0; }).sort(function (a, b) { return a.level - b.level; });
      for (var i = 1; i < heads.length; i++) if (heads[i].level > heads[i - 1].level) { heads[i].parent = heads[i - 1]; heads[i - 1].kids.push(heads[i]); heads[i].linked = heads[i - 1].linked = true; }
      if (heads.length) r.nodes.forEach(function (n) {
        if (n.parent || heads.indexOf(n) >= 0 || !n.linked) return;
        var h = null; heads.forEach(function (x) { if (x.level < n.level) h = x; });
        if (h) { n.parent = h; h.kids.push(n); h.linked = true; }
      });
      r.nodes.forEach(function (nd) { all.push(nd); });
      // 沒有接上任何科判的字（頁首標題等）：保留成備註
      var loose = r.runs.filter(function (x) { return !x.node; }).map(function (x) { return x.text; }).join(' ');
      if (loose.trim()) dropped.push('// 第 ' + pg.n + ' 頁：' + loose.trim());
      r.nodes.forEach(function (nd) { if (!nd.linked && !nd.parent && !nd.kids.length) dropped.push('// 第 ' + pg.n + ' 頁（沒有連線）：' + nd.label + '、' + nd.title); });
    });
    function order(a, b) { return (a.page - b.page) || (b.x - a.x) || (b.top - a.top); }
    function num(n) { return cnum(n.label.slice(1)) || 0; }
    function sibOrder(a, b) { return (a.label[0] === b.label[0] ? num(a) - num(b) : 0) || order(a, b); }
    function sig(n) { return key(n.title.replace(/[（(][^）)]*([）)]|$)/g, '')); }
    function fen(n) { var m = /[（(]\s*分([一二三四五六七八九十]+)/.exec(n.title); return m ? cnum(m[1]) : 0; }
    function same(a, b) {
      if (a.label !== b.label) return false;
      var x = sig(a), y = sig(b), k = Math.min(x.length, y.length);
      if (k < 2 || x.slice(0, k) !== y.slice(0, k)) return false;
      if (fen(a) && fen(b) && fen(a) !== fen(b)) return false;
      var na = note(a), nb = note(b), m = Math.min(na.length, nb.length, 4);
      return !m || na.slice(0, m) === nb.slice(0, m);        // 「（自方便品至…）」這類說明不同 → 不同科
    }
    function note(n) { var m = /[（(]([^）)]*)/.exec(n.title); return m ? key(m[1].replace(/^分[一二三四五六七八九十]+[：:]?/, '')) : ''; }
    function better(a, b) {        // 兩個寫法選一個：括號完整、有「分N」的優先，其次較長
      function sc(t) { var o = (t.match(/[（(]/g) || []).length, c = (t.match(/[）)]/g) || []).length; return (o === c ? 2 : 0) + (/分[一二三四五六七八九十]/.test(t) ? 1 : 0); }
      return sc(b) > sc(a) || (sc(b) === sc(a) && key(b).length > key(a).length) ? b : a;
    }
    function inside(n, r) { for (; n; n = n.parent) if (n === r) return true; return false; }
    function mergeInto(dst, src) {
      dst.title = better(dst.title, src.title);
      src.kids.slice().forEach(function (k) {
        var m = null;
        dst.kids.forEach(function (d) { if (!m && same(d, k)) m = d; });
        if (m) mergeInto(m, k); else { dst.kids.push(k); k.parent = dst; }
      });
      src.kids = []; src.merged = dst;
    }
    var live = all.filter(function (n) { return n.linked || n.kids.length || n.parent; });
    var roots = live.filter(function (n) { return !n.parent; }).sort(order);
    // 1. 別表：同一科在別處已經出現 → 併到那一科（選頁數最近、在它之前的）
    roots.forEach(function (r) {
      var best = null;
      if (r.ref) live.forEach(function (n) { if (!best && n !== r && !n.merged && n.ref === r.ref && n.label === r.label && !inside(n, r)) best = n; });
      if (best) { mergeInto(best, r); return; }
      if (!r.head) return;                                     // 只有頁首標題才去找同名的科；其他是跨頁接續
      live.forEach(function (n) {
        if (n === r || n.merged || inside(n, r) || !same(n, r)) return;
        if (!best) { best = n; return; }
        var nb = n.page <= r.page, bb = best.page <= r.page;
        if (nb && (!bb || n.page > best.page) || !nb && !bb && n.page < best.page) best = n;
      });
      if (best) mergeInto(best, r);
    });
    roots = roots.filter(function (r) { return !r.merged; });
    // 2. 最上層：層級最高的那些科
    var minLv = Math.min.apply(null, roots.map(function (r) { return r.level; }).filter(function (l) { return l >= 0; }).concat([99]));
    var top = roots.filter(function (r) { return r.level === minLv; });
    // 3. 其餘找不到上一層的（跨頁接續）：接在閱讀順序上最近的上一層
    function dfs() { var list = []; (function walk(ns) { ns.slice().sort(sibOrder).forEach(function (n) { list.push(n); walk(n.kids); }); })(top); return list; }
    roots.filter(function (r) { return r.level !== minLv; }).forEach(function (r) {
      // 閱讀順序上在它前面、最接近的上一層（同一張圖裡右邊的比較前面）
      var list = dfs(), parent = null, exact = null, pos = function (n) { return n.page * 1e6 - n.x; }, me = pos(r);
      list.forEach(function (n) {
        if (n.level < 0 || n.level >= r.level || pos(n) >= me) return;
        if (!parent || pos(n) > pos(parent)) parent = n;
        if (n.level === r.level - 1 && (!exact || pos(n) > pos(exact))) exact = n;
      });
      // 最可靠的線索：已經有「前一號」的兄弟（丁五 → 找已有丁四、還沒有丁五的那一科）
      var k = num(r), seq = null;
      if (k > 1) list.forEach(function (n) {
        if (n.level !== r.level - 1 || pos(n) >= me) return;
        var prev = n.kids.some(function (c) { return c.label[0] === r.label[0] && num(c) === k - 1; });
        var dup = n.kids.some(function (c) { return c.label === r.label; });
        if (prev && !dup && (!seq || pos(n) > pos(seq))) seq = n;
      });
      parent = seq || exact || parent;
      if (parent) { warnings.push('「' + r.label + '、' + r.title + '」（第 ' + pages[r.page].n + ' 頁）沒有連到上一層，先接在「' + parent.label + '、' + parent.title + '」下面，請核對'); parent.kids.push(r); r.parent = parent; }
      else top.push(r);
    });
    var out = [], count = 0;
    function emit(n) {
      out.push('# ' + n.label + '、' + n.title);
      var fm = /[（(]\s*分([一二三四五六七八九十]+)/.exec(n.title);
      if (fm && n.kids.length && n.kids.length !== cnum(fm[1])) warnings.push('「' + n.label + '、' + n.title.replace(/[（(].*$/, '') + '」寫分' + fm[1] + '，讀到 ' + n.kids.length + ' 科');
      count++;
      n.kids.sort(sibOrder).forEach(emit);
    }
    top.sort(sibOrder).forEach(emit);
    return { text: '= 科判表\n' + out.join('\n') + (dropped.length ? '\n\n// 以下是沒有接上科判的字，請自己看要不要用\n' + dropped.join('\n') : '') + '\n', kind: 'tree', count: count, warnings: warnings };
  }
  function cnum(t) { var v = 0, cur = 0; Array.from(t).forEach(function (c) { var d = '〇一二三四五六七八九'.indexOf(c); if (c === '十') { v += (cur || 1) * 10; cur = 0; } else cur = d; }); return v + cur; }

  /* ---------- 文章：直書、橫書接成段落 ---------- */
  function proseText(pages) {
    var paras = [], buf = '', ends = /[。！？」』）；：]$/;
    function push() { if (buf) paras.push(buf); buf = ''; }
    pages.forEach(function (pg) {
      var cs = pg.chars, vertN = 0, horN = 0;
      cs.forEach(function (c) { if (c.h) horN++; else vertN++; });
      var cols = columns(cs).filter(function (c) { return c.chars.length; });
      var vertical = vertN > horN && cols.length && median(cols.map(function (c) { return c.chars.length; })) > 3;
      var lines;
      if (vertical) {
        lines = cols.map(function (col) { return { t: col.chars.map(function (c) { return c.c; }).join(''), a: col.chars[0].top, b: col.chars[col.chars.length - 1].y, s: col.chars[0].s }; });
        var A = Math.max.apply(null, lines.map(function (l) { return l.a; })), B = Math.min.apply(null, lines.map(function (l) { return l.b; }));
        lines.forEach(function (l) { l.indent = A - l.a > l.s * 0.8; l.short = l.b - B > l.s * 1.5; });
      } else {
        var rows = [];
        cs.slice().sort(function (a, b) { return b.y - a.y || a.x - b.x; }).forEach(function (c) {
          var r = rows.length && Math.abs(rows[rows.length - 1].y - c.y) < c.s * 0.4 ? rows[rows.length - 1] : null;
          if (!r) { r = { y: c.y, chars: [] }; rows.push(r); }
          r.chars.push(c);
        });
        lines = rows.map(function (r) { r.chars.sort(function (a, b) { return a.x - b.x; }); var f = r.chars[0], l = r.chars[r.chars.length - 1]; return { t: r.chars.map(function (c) { return c.c; }).join(''), a: f.x, b: l.x, s: f.s }; });
        var L = Math.min.apply(null, lines.map(function (l) { return l.a; })), R = Math.max.apply(null, lines.map(function (l) { return l.b; }));
        lines.forEach(function (l) { l.indent = l.a - L > l.s * 0.8; l.short = R - l.b > l.s * 1.5; });
      }
      lines.forEach(function (l) {
        var t = norm(l.t).replace(/[.．…·]{4,}\s*\d*\s*$/, '').trim();            // 目錄的點線
        if (!t) return;
        if (l.indent || LABEL_START.test(t)) push();
        buf += t;
        if (l.short) push();
      });
      if (buf && ends.test(buf)) push();
    });
    push();
    // 夾在段落中間的科判（例：「…說。甲二、正宗分（分二）」）拆成自己一行
    var out = [];
    var mid = new RegExp('([。！？」』）])\\s*((?:[' + GAN + ZHI + '][' + NUMS + ']+|[' + TIERS + '])、[^。！？]{1,40}?[（(]分[' + NUMS + ']+[^）)]{0,60}[）)])');
    paras.forEach(function (p) {
      var m;
      while ((m = mid.exec(p))) { out.push(p.slice(0, m.index + 1)); out.push(m[2]); p = p.slice(m.index + m[0].length); }
      if (p.trim()) out.push(p);
    });
    return { text: out.join('\n') + '\n', kind: 'text', count: out.length, warnings: [] };
  }

  function toText(pages, name) {
    var nChars = pages.reduce(function (a, p) { return a + p.chars.length; }, 0);
    if (nChars < 10) return { text: '', kind: 'empty', count: 0, warnings: [(name || 'PDF') + '：沒有讀到文字，可能是掃描成圖片的 PDF，需要先做文字辨識（OCR）'] };
    // 有連線把科號接起來的頁面夠多 → 科判表
    var treePages = 0, probe = 0;
    pages.forEach(function (pg, pi) {
      if (!pg.segs.length) return;
      probe++;
      var r = nodesOf(pg, pi);
      if (link(pg, pi, r.nodes) >= 2) treePages++;
    });
    if (treePages >= Math.max(1, pages.length * 0.3)) return treeText(pages);
    return proseText(pages);
  }

  var api = { read: read, toText: toText, norm: norm, _nodesOf: nodesOf, _link: link, _spreads: spreads, _edge: edgeEnds };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.PdfRead = api;
})(typeof self !== 'undefined' ? self : this);
