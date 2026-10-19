/* 科判閱讀模板：匯入（瀏覽器版）。與 tools/build.py 同一套規則，產生同樣的資料。
 * BookImporter.build(cfg, files, lectures) → { data, notes, juans, warnings }
 *   cfg      { 書名, 講記:[{標記, 名稱}], 自動科判 }
 *   files    [{ name, text }]                正文與科判（依檔名排序）
 *   lectures { 標記: [{ name, text }] }       講記資料夾（依【001】分段，自動對到科判）
 * BookImporter.fill(shellHtml, cfg, juans) → 填好書名、卷數、講記名稱的 index.html
 */
(function () {
  'use strict';
  var TIERS = '壹貳參肆伍陸柒捌玖拾', GAN = '甲乙丙丁戊己庚辛壬癸', ZHI = '子丑寅卯辰巳午未申酉戌亥';
  var QZW = '天地玄黃宇宙洪荒日月盈昃辰宿列張寒來暑往秋收冬藏閏餘成歲律呂調陽雲騰致雨露結為霜';
  var CN = '〇一二三四五六七八九', NUMS = '一二三四五六七八九十百〇ㄧ';
  var HEAD_RE = /^#(\d*)\s*(.+)$/;
  var LABEL_RE = new RegExp('^([' + TIERS + GAN + ZHI + QZW + '][' + NUMS + ']*)\\s*[、．.\\s]\\s*(.+)$');
  var FEN_RE = new RegExp('[（(]\\s*分[' + NUMS + ']+\\s*[）)]\\s*$');
  var FEN_NOTE_RE = new RegExp('[（(]\\s*分[' + NUMS + ']+\\s*[：:]\\s*(.+?)\\s*[）)]\\s*$');
  var SEG_RE = /^【[^】]{1,12}】/;
  var MENTION_RE = new RegExp('([' + TIERS + ']|[' + GAN + ZHI + QZW + '][一二三四五六七八九十ㄧ]+)\\s*、\\s*([^、；;：:，,。\\s]{1,20})', 'g');
  var FULL = 4.93, LEVEL_GAP = 10.0, PAGE_H = 262.0, PAGE_COLS = 30.0;

  function len(s) { return Array.from(s).length; }
  function cn(n) {
    if (n < 10) return CN[n];
    if (n < 20) return '十' + (n % 10 ? CN[n % 10] : '');
    if (n < 100) return CN[Math.floor(n / 10)] + '十' + (n % 10 ? CN[n % 10] : '');
    return '百' + (n % 100 ? cn(n % 100) : '');
  }
  function cnValue(t) {
    var v = 0, cur = 0;
    Array.from(t).forEach(function (c) {
      if (c === '百') { v += (cur || 1) * 100; cur = 0; }
      else if (c === '十') { v += (cur || 1) * 10; cur = 0; }
      else cur = Math.max(0, CN.indexOf(c));
    });
    return v + cur;
  }
  function levelCandidates(ch) {
    var out = [];
    if (TIERS.indexOf(ch) >= 0) out.push(0);
    if (GAN.indexOf(ch) >= 0) out.push(1 + GAN.indexOf(ch));
    if (ZHI.indexOf(ch) >= 0) out.push(11 + ZHI.indexOf(ch));
    for (var i = 0; i < QZW.length; i++) if (QZW[i] === ch) out.push(23 + i);
    return out;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function lines(text) { return String(text).replace(/^\uFEFF/, '').split(/\r?\n/); }
  function byName(a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; }

  function joinWrapped(ls) {
    if (ls.length <= 1) return ls.join('\n');
    var lens = ls.map(len).sort(function (a, b) { return a - b; }), full = lens[Math.floor(lens.length * 0.8)];
    var out = [], buf = '';
    ls.forEach(function (l, i) {
      buf += l;
      if (i === 0 || len(l) < full - 2 || SEG_RE.test(l)) { out.push(buf); buf = ''; }
    });
    if (buf) out.push(buf);
    return out.join('\n');
  }

  function Book(cfg) {
    this.cfg = cfg; this.nodes = []; this.juans = []; this.notes = {}; this.stack = []; this.warn = [];
    this.noteKind = {};
    var self = this;
    (cfg['講記'] || []).slice(0, 2).forEach(function (m, i) { self.noteKind[m['標記']] = i === 0 ? 'p' : 'c'; });
    this.prevLevel = 0; this.auto = cfg['自動科判'] !== false; this.lastNote = null;
  }
  Book.prototype.blocks = function () {
    if (!this.juans.length) throw new Error('第一行之前沒有「= 卷名」：請先用「= 名稱」開始一卷');
    return this.juans[this.juans.length - 1][1];
  };
  Book.prototype.addNode = function (explicit, body, where) {
    var m = LABEL_RE.exec(body), label, title, level;
    if (m) { label = m[1].replace(/ㄧ/g, '一'); title = m[2].trim(); }
    else { var mm = /^([^、\s]*)[、\s]([\s\S]*)$/.exec(body); if (mm) { label = mm[1]; title = mm[2].trim(); } else { label = ''; title = body; } }
    if (explicit) level = parseInt(explicit, 10);
    else {
      var cands = label ? levelCandidates(Array.from(label)[0]) : [];
      if (!cands.length) throw new Error(where + '：看不出「' + body + '」是第幾層；請在 # 後面寫層級數字，例如「#3 ' + body + '」');
      var self = this, ok = cands.filter(function (c) { return c <= self.prevLevel + 1; });
      level = Math.max.apply(null, ok.length ? ok : cands);
    }
    this.prevLevel = level;
    var small = '', fm = FEN_NOTE_RE.exec(title);
    if (fm) { small = '(' + fm[1] + ')'; title = title.slice(0, fm.index).trim(); }
    else title = title.replace(FEN_RE, '').trim();
    while (this.stack.length && this.stack[this.stack.length - 1][0] >= level) this.stack.pop();
    var parent = this.stack.length ? this.stack[this.stack.length - 1][1] : -1, idx = this.nodes.length;
    this.nodes.push([title + small, '', '', level, parent, label, this.juans.length, [], 0, 0, 0]);
    this.stack.push([level, idx]);
    var b = this.blocks();
    if (b.length && b[b.length - 1][0] === 'k') b[b.length - 1][1].push(idx); else b.push(['k', [idx]]);
  };
  Book.prototype.looksLikeHeading = function (line) {
    var m = LABEL_RE.exec(line);
    if (!m || len(line) > 60 || /[。？！；]/.test(m[2].replace(FEN_NOTE_RE, ''))) return false;
    if (TIERS.indexOf(m[1][0]) < 0 && !/[一二三四五六七八九十ㄧ]/.test(m[1])) return false;
    var cands = levelCandidates(m[1][0]), self = this;
    return cands.some(function (c) { return c <= self.prevLevel + 1; }) && (this.nodes.length > 0 || Math.min.apply(null, cands) <= 1);
  };
  Book.prototype.addLine = function (raw, where) {
    var line = raw.trim();
    if (!line || line.indexOf('//') === 0) return;
    if (line[0] === '=') { this.juans.push([line.slice(1).trim(), []]); this.lastNote = null; return; }
    var b = this.blocks();
    if (line[0] === '#') { var m = HEAD_RE.exec(line); this.addNode(m[1], m[2].trim(), where); this.lastNote = null; return; }
    if (this.auto && this.looksLikeHeading(line)) { this.addNode('', line, where); this.lastNote = null; return; }
    if (line[0] === '>') {
      var body = line.slice(1).trim(), sp = body.indexOf(' '), mark = sp < 0 ? body : body.slice(0, sp), text = sp < 0 ? '' : body.slice(sp + 1);
      var kind = this.noteKind[mark];
      if (!kind) throw new Error(where + '：講記標記「' + mark + '」沒有設定（請在講記名稱旁填上這個標記）');
      var jn = this.juans.length, arr = this.notes[jn] = this.notes[jn] || [];
      if (this.lastNote && this.lastNote[0] === kind && this.lastNote[1] === b.length) this.lastNote[2] += '\n' + text.trim();
      else { this.lastNote = [kind, b.length, text.trim()]; arr.push(this.lastNote); }
      return;
    }
    this.lastNote = null;
    if (line[0] === '@') b.push(['r', line.slice(1).trim()]);
    else if (line[0] === '*') b.push(['n', line.slice(1).trim()]);
    else if (line[0] === '~') b.push(['v', line.slice(1).trim()]);
    else b.push(['y', line]);
  };
  Book.prototype.attachLectures = function (files, kind, where) {
    var segs = [];
    files.slice().sort(byName).forEach(function (f) {
      var cur = null;
      lines(f.text).forEach(function (l) {
        l = l.trim();
        if (!l || l.indexOf('//') === 0) return;
        if (SEG_RE.test(l) || !cur) { cur = [l]; segs.push(cur); } else cur.push(l);
      });
    });
    var ptr = 0, done = 0, self = this;
    segs.forEach(function (seg) {
      var text = joinWrapped(seg), hit = self.findMention(text, ptr);
      if (hit != null) ptr = hit; else if (!self.nodes.length) return;
      var jn = self.nodes[ptr][6], arr = self.notes[jn] = self.notes[jn] || [];
      arr.push([kind, self.afterNode(ptr), text]); done++;
    });
    this.warn.push(where + '：' + done + ' 段講記，已接到科判後面');
  };
  Book.prototype.findMention = function (text, start) {
    var best = null, ptr = start, flat = text.replace(/\s+/g, ''), m;
    MENTION_RE.lastIndex = 0;
    while ((m = MENTION_RE.exec(flat))) {
      var before = flat.slice(m.index - 1, m.index), after = flat.slice(MENTION_RE.lastIndex, MENTION_RE.lastIndex + 1);
      if ((m.index > 0 && '；;：:'.indexOf(before) >= 0) || (after && '；;'.indexOf(after) >= 0)) continue;
      var label = m[1].replace(/ㄧ/g, '一'), rest = m[2];
      for (var i = ptr; i < this.nodes.length; i++) {
        var n = this.nodes[i], t = Array.from(n[0].replace(/\(.*\)$/, ''));
        if (n[5] === label && t.length && rest.indexOf(t.slice(0, Math.max(2, Math.min(t.length, 4))).join('')) === 0) { best = ptr = i; break; }
      }
    }
    return best;
  };
  Book.prototype.afterNode = function (i) {
    var jn = this.nodes[i][6], b = this.juans[jn - 1][1], k = -1;
    for (var x = 0; x < b.length; x++) if (b[x][0] === 'k' && b[x][1].indexOf(i) >= 0) { k = x; break; }
    var ids = b[k][1];
    if (ids[ids.length - 1] !== i) {
      var cut = ids.indexOf(i) + 1;
      b.splice(k, 1, ['k', ids.slice(0, cut)], ['k', ids.slice(cut)]);
      (this.notes[jn] || []).forEach(function (nt) { if (nt[1] > k) nt[1] += 1; });
      return k + 1;
    }
    for (var y = k + 1; y < b.length; y++) if (b[y][0] === 'k') return y;
    return b.length;
  };
  Book.prototype.finish = function () {
    var seen = {}, self = this;
    this.nodes.forEach(function (n) {
      var m = /^.([一二三四五六七八九十百]+)$/.exec(n[5] || ''); if (!m) return;
      var v = cnValue(m[1]), prev = seen[n[4]];
      if (prev && v !== prev[0] + 1) self.warn.push('「' + n[5] + '、' + n[0] + '」前面少了一科（上一個同層是「' + prev[1] + '」）');
      seen[n[4]] = [v, n[5]];
    });
    var lv = this.nodes.length ? Math.min.apply(null, this.nodes.map(function (n) { return n[3]; })) : 1;
    this.nodes.forEach(function (n) { n[3] = n[3] - lv + 1; });
    this.nodes.forEach(function (n) { if (n[4] >= 0) self.nodes[n[4]][8] += 1; });
    this.juans.forEach(function (j) { j[1].push(['e', j[0]]); });
  };

  // ---------- 科判頁 ----------
  function nodeText(book, i) { if (i < 0) return book.cfg['書名']; var n = book.nodes[i]; return (n[5] ? n[5] + '、' : '') + n[0]; }
  function nodeShape(book, i, hasKids) {
    var chars = len(nodeText(book, i).replace(/\([^()]*\)$/, '')), cols;
    if (hasKids && chars > 10) cols = Math.max(2, Math.ceil(chars / 9));
    else if (chars <= 18) cols = 1;
    else cols = Math.ceil(chars / 14);
    return [cols, Math.ceil(chars / cols) * FULL];
  }
  function makePages(book) {
    var N = book.nodes, kids = {}, pages = [], appear = {}, own = {}, pending = [-1];
    N.forEach(function (n, i) { (kids[n[4]] = kids[n[4]] || []).push(i); });
    function K(i) { return kids[i] || []; }
    function measure(roots, open) {
      function go(i) {
        var ks = open.has(i) ? K(i) : [], s = nodeShape(book, i, ks.length > 0);
        if (!ks.length) return s;
        var r = ks.map(go), w = r.reduce(function (a, x) { return a + x[0]; }, 0) + 0.3 * (ks.length - 1);
        return [Math.max(s[0], w), s[1] + LEVEL_GAP + Math.max.apply(null, r.map(function (x) { return x[1]; }))];
      }
      var r = roots.map(go);
      return [r.reduce(function (a, x) { return a + x[0]; }, 0) + 0.6 * (roots.length - 1), Math.max.apply(null, r.map(function (x) { return x[1]; }))];
    }
    function fits(roots, open) { var m = measure(roots, open); return m[0] <= PAGE_COLS && m[1] <= PAGE_H; }
    function order(a, b) { return N[a][3] - N[b][3] || a - b; }
    function expand(roots) {
      var open = new Set(roots.filter(function (r) { return K(r).length; })), frontier = [];
      roots.forEach(function (r) { frontier = frontier.concat(K(r)); });
      while (frontier.length) {
        var nxt = [];
        frontier.slice().sort(order).forEach(function (k) {
          if (!K(k).length) return;
          open.add(k);
          if (fits(roots, open)) nxt = nxt.concat(K(k)); else open.delete(k);
        });
        frontier = nxt;
      }
      return open;
    }
    function withKids(q, ch, fn) { var saved = kids[q]; kids[q] = ch; try { return fn(); } finally { kids[q] = saved; } }
    function expandSub(ch, q) {
      var open = new Set();
      return withKids(q, ch, function () {
        var frontier = ch.slice();
        while (frontier.length) {
          var nxt = [];
          frontier.slice().sort(order).forEach(function (k) {
            if (!K(k).length) return;
            open.add(k);
            var all = new Set(open); all.add(q);
            if (fits([q], all)) nxt = nxt.concat(K(k)); else open.delete(k);
          });
          frontier = nxt;
        }
        return open;
      });
    }
    function render(roots, open, only) {
      var pno = pages.length + 2, out = [], x = 184.6;
      function place(i, depth, rt) {
        var ks = open.has(i) ? (only && only[i] ? only[i] : K(i)) : [], top = 16 + depth * 24, cx;
        if (ks.length) { var xs = ks.map(function (k) { return place(k, depth + 1, false); }); cx = (xs[0] + xs[xs.length - 1]) / 2; }
        else { cx = x; x -= 6.2 * nodeShape(book, i, false)[0]; }
        out.push('<div class="' + (rt ? 'nd tt rt' : 'nd tt') + '" data-id="' + i + '" style="left:' + (cx - 2.6).toFixed(2) + 'mm;top:' + top.toFixed(2) + 'mm;width:5.19mm">' + esc(nodeText(book, i)) + '</div>');
        if (i >= 0 && !(String(i) in appear)) appear[String(i)] = pno;
        if (!ks.length && K(i).length) {
          out.push('<div class="nd nt" data-go="' + i + '" style="left:' + (cx - 2.4).toFixed(2) + 'mm;top:' + (top + 30).toFixed(2) + 'mm;width:3.34mm">(分' + cn(K(i).length) + ')</div>');
          if (pending.indexOf(i) < 0 && !(String(i) in own)) pending.push(i);
        }
        return cx;
      }
      roots.forEach(function (r) { place(r, 0, true); x -= 4; if (!(String(r) in own)) own[String(r)] = pno; });
      var head;
      if (roots.length === 1 && roots[0] === -1) { appear['-1'] = pno; head = esc(book.cfg['書名']) + '科判表　總表'; }
      else {
        var path = [], p = N[roots[0]][4];
        while (p >= 0) { path.unshift(nodeText(book, p)); p = N[p][4]; }
        head = path.length ? '別表：' + path.map(esc).join('　') : '別表';
      }
      pages.push('<section class="page">\n<div class="head">' + head + '</div>\n<svg class="ln" viewBox="0 0 210 297" width="210mm" height="297mm"></svg>\n' + out.join('') + '</section>');
    }
    function num(a, b) { return a - b; }
    while (pending.length) {
      pending.sort(num);
      var q = pending.shift(), ks = K(q), chunks = [], cur = [];
      ks.forEach(function (k) {
        cur.push(k);
        var w = withKids(q, cur, function () { return measure([q], new Set([q]))[0]; });
        if (w > PAGE_COLS && cur.length > 1) { cur.pop(); chunks.push(cur); cur = [k]; }
      });
      if (cur.length) chunks.push(cur);
      if (chunks.length > 1) {
        chunks.forEach(function (ch) { var open = expandSub(ch, q); open.add(q); var only = {}; only[q] = ch; render([q], open, only); });
        continue;
      }
      var roots = [q];
      while (pending.length && q >= 0) {
        pending.sort(num);
        var nx = pending[0];
        if (N[nx][4] !== N[q][4] || !K(nx).length) break;
        var trial = roots.concat([nx]);
        if (!fits(trial, new Set(trial.filter(function (r) { return K(r).length; })))) break;
        var full = expand(trial);
        if (!trial.every(function (r) { return K(r).every(function (k) { return full.has(k) || !K(k).length; }); })) break;
        roots = trial; pending.shift();
      }
      render(roots, expand(roots));
    }
    return { pages: pages, appear: appear, own: own };
  }

  function build(cfg, files, lectures) {
    if (!cfg['書名']) throw new Error('請填書名');
    if (/['"\\<>]/.test(cfg['書名'])) throw new Error('書名不能有引號、反斜線或角括號');
    if (!files.length) throw new Error('請選擇正文與科判的 .txt 檔');
    var book = new Book(cfg);
    files.slice().sort(byName).forEach(function (f) {
      lines(f.text).forEach(function (l, i) { book.addLine(l, f.name + ' 第 ' + (i + 1) + ' 行'); });
    });
    (cfg['講記'] || []).slice(0, 2).forEach(function (m) {
      var fs = (lectures || {})[m['標記']];
      if (fs && fs.length) book.attachLectures(fs, book.noteKind[m['標記']], m['名稱']);
    });
    book.finish();
    var nj = book.juans.length;
    if (nj > 100) throw new Error('目前最多 100 卷');
    var pg = makePages(book), notes = {};
    for (var j = 1; j <= nj; j++) notes[j] = book.notes[j] || [];
    return {
      data: { nodes: book.nodes, pages: pg.pages, appear: pg.appear, own: pg.own, text: book.juans.map(function (x) { return [x[0], x[1]]; }), src: cfg['代號'] || '' },
      notes: notes, juans: nj, warnings: book.warn,
      stats: { nodes: book.nodes.length, pages: pg.pages.length, notes: Object.keys(book.notes).reduce(function (a, k) { return a + book.notes[k].length; }, 0) }
    };
  }

  function fill(shell, cfg, juans, code) {
    var marks = (cfg['講記'] || []).slice(0, 2), names = [marks[0] ? marks[0]['名稱'] : '', marks[1] ? marks[1]['名稱'] : ''];
    var rep = {
      '{{書名}}': cfg['書名'], '{{短名}}': cfg['短名'] || cfg['書名'], '{{代號}}': code, '{{卷數}}': String(juans),
      '{{註解檔數}}': String(Math.max(1, Math.ceil(juans / 5))), '{{講記一}}': names[0] || '講記一', '{{講記二}}': names[1] || '講記二',
      '{{講記一標記}}': marks[0] ? marks[0]['標記'] : '講', '{{講記二標記}}': marks[1] ? marks[1]['標記'] : '', '{{版本}}': cfg['版本'] || '1.0.0', '{{日期}}': new Date().toISOString().slice(0, 10),
      '{{關於}}': esc(cfg['關於'] || '')
    };
    Object.keys(rep).forEach(function (k) { shell = shell.split(k).join(rep[k]); });
    var hide = [];
    if (!names[0]) hide.push('.sw.px,#exPx');
    if (!names[1]) hide.push('.sw.cb,#exCb');
    if (hide.length) shell = shell.replace('</head>', '<style id="book-hide">' + hide.join(',') + '{display:none!important}</style></head>');
    return shell;
  }

  window.BookImporter = { build: build, fill: fill };
})();
