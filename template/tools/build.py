#!/usr/bin/env python3
"""科判閱讀模板：把 source/ 的純文字資料轉成網站。

用法：python3 tools/build.py [來源資料夾，預設 source]

來源資料夾：
  book.json   書名、代號、卷的名稱、講記名稱等設定
  *.txt       正文、科判、講記（依檔名排序讀入；格式見 README.md）

產生（都在 template/ 底下）：
  index.html、sw.js、manifest.webmanifest、data/book.js、data/notes-NN.js
"""
import base64, gzip, hashlib, json, math, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, sys.argv[1] if len(sys.argv) > 1 else 'source')

# ---------- 層級：壹貳參… → 甲乙丙… → 子丑寅… → 天地玄黃… ----------
TIERS = '壹貳參肆伍陸柒捌玖拾'
GAN = '甲乙丙丁戊己庚辛壬癸'
ZHI = '子丑寅卯辰巳午未申酉戌亥'
QZW = '天地玄黃宇宙洪荒日月盈昃辰宿列張寒來暑往秋收冬藏閏餘成歲律呂調陽雲騰致雨露結為霜'
CN = '〇一二三四五六七八九'
NUMS = '一二三四五六七八九十百〇ㄧ'


def cn(n):
    if n < 10: return CN[n]
    if n < 20: return '十' + (CN[n % 10] if n % 10 else '')
    if n < 100: return CN[n // 10] + '十' + (CN[n % 10] if n % 10 else '')
    return '百' + (cn(n % 100) if n % 100 else '')


def cn_value(t):
    d = {c: i for i, c in enumerate(CN)}; v, cur = 0, 0
    for c in t:
        if c == '百': v += (cur or 1) * 100; cur = 0
        elif c == '十': v += (cur or 1) * 10; cur = 0
        else: cur = d.get(c, 0)
    return v + cur


def level_candidates(ch):
    """標號第一個字可能代表的層級（從 1 起算；壹貳參算第 0 層）。"""
    out = []
    if ch in TIERS: out.append(0)
    if ch in GAN: out.append(1 + GAN.index(ch))
    if ch in ZHI: out.append(11 + ZHI.index(ch))
    for i, c in enumerate(QZW):
        if c == ch: out.append(23 + i)
    return out


HEAD_RE = re.compile(r'^#(\d*)\s*(.+)$')
LABEL_RE = re.compile(r'^([壹貳參肆伍陸柒捌玖拾甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥' + QZW + r'][' + NUMS + r']*)\s*[、．.\s]\s*(.+)$')
FEN_RE = re.compile(r'[（(]\s*分[' + NUMS + r']+\s*[）)]\s*$')
FEN_NOTE_RE = re.compile(r'[（(]\s*分[' + NUMS + r']+\s*[：:]\s*(.+?)\s*[）)]\s*$')


SEG_RE = re.compile(r'^【[^】]{1,12}】')
MENTION_RE = re.compile(r'([壹貳參肆伍陸柒捌玖拾]|[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥' + QZW + r'][一二三四五六七八九十ㄧ]+)\s*、\s*([^、；;：:，,。\s]{1,20})')


def join_wrapped(lines):
    """PDF／網頁複製的講記常在固定字數處斷行：比一般行短的才算段落結尾。"""
    if len(lines) <= 1: return '\n'.join(lines)
    lens = sorted(len(l) for l in lines)
    full = lens[int(len(lens) * 0.8)]
    out, buf = [], ''
    for i, l in enumerate(lines):
        buf += l
        if i == 0 or len(l) < full - 2 or SEG_RE.match(l):
            out.append(buf); buf = ''
    if buf: out.append(buf)
    return '\n'.join(out)


class Book:
    def __init__(self, cfg):
        self.cfg = cfg
        self.nodes = []          # [標題, 小注, '', 層級, 上層, 標號, 卷, [], 下層數, 0, 0]
        self.juans = []          # [卷名, 區塊]
        self.notes = {}          # 卷 -> [[種類, 區塊位置, 文字]]
        self.stack = []          # (層級, 節點)
        self.warn = []
        marks = cfg.get('講記') or []
        self.note_kind = {}
        for i, m in enumerate(marks[:2]):
            self.note_kind[m['標記']] = 'p' if i == 0 else 'c'
        self.prev_level = 0
        self.auto = cfg.get('自動科判', True)
        self.last_note = None

    def blocks(self):
        if not self.juans: raise SystemExit('第一行之前沒有「= 卷名」：請先用「= 名稱」開始一卷')
        return self.juans[-1][1]

    def add_node(self, explicit, body, where):
        m = LABEL_RE.match(body)
        if m:
            label, title = m.group(1).replace('ㄧ', '一'), m.group(2).strip()
        else:
            parts = re.split(r'[、\s]', body, maxsplit=1)
            label, title = (parts[0], parts[1].strip()) if len(parts) == 2 else ('', body)
        if explicit:
            level = int(explicit)
        else:
            cands = level_candidates(label[:1]) if label else []
            if not cands:
                raise SystemExit('%s：看不出「%s」是第幾層；請在 # 後面寫層級數字，例如「#3 %s」' % (where, body, body))
            ok = [c for c in cands if c <= self.prev_level + 1] or cands
            level = max(ok)
        self.prev_level = level
        small = ''
        fm = FEN_NOTE_RE.search(title)
        if fm:
            small = '(' + fm.group(1) + ')'; title = title[:fm.start()].strip()
        else:
            title = FEN_RE.sub('', title).strip()
        while self.stack and self.stack[-1][0] >= level: self.stack.pop()
        parent = self.stack[-1][1] if self.stack else -1
        idx = len(self.nodes)
        self.nodes.append([title + small, '', '', level, parent, label, len(self.juans), [], 0, 0, 0])
        self.stack.append((level, idx))
        b = self.blocks()
        if b and b[-1][0] == 'k': b[-1][1].append(idx)
        else: b.append(['k', [idx]])

    def looks_like_heading(self, line):
        """沒有 # 的科判行（例如直接從講表複製的「乙一、聞法時處」）：標號層級要接得上、而且不像一句正文。"""
        m = LABEL_RE.match(line)
        if not m or len(line) > 60 or re.search(r'[。？！；]', FEN_NOTE_RE.sub('', m.group(2))): return False
        if m.group(1)[0] not in TIERS and not re.search(r'[一二三四五六七八九十ㄧ]', m.group(1)): return False
        cands = level_candidates(m.group(1)[:1])
        return any(c <= self.prev_level + 1 for c in cands) and (self.nodes or min(cands) <= 1)

    def add_line(self, raw, where):
        line = raw.rstrip('\n').strip()
        if not line or line.startswith('//'): return
        if line.startswith('='):
            name = line[1:].strip()
            self.juans.append([name, []]); self.last_note = None
            return
        b = self.blocks()
        if line.startswith('#'):
            m = HEAD_RE.match(line); self.add_node(m.group(1), m.group(2).strip(), where); self.last_note = None; return
        if self.auto and self.looks_like_heading(line):
            self.add_node('', line, where); self.last_note = None; return
        if line.startswith('>'):
            body = line[1:].strip()
            mark, _, text = body.partition(' ')
            kind = self.note_kind.get(mark)
            if not kind:
                raise SystemExit('%s：講記標記「%s」不在 book.json 的「講記」裡' % (where, mark))
            jn = len(self.juans); arr = self.notes.setdefault(jn, [])
            if self.last_note is not None and self.last_note[0] == kind and self.last_note[1] == len(b):
                self.last_note[2] += '\n' + text.strip()
            else:
                self.last_note = [kind, len(b), text.strip()]; arr.append(self.last_note)
            return
        self.last_note = None
        if line.startswith('@'): b.append(['r', line[1:].strip()])
        elif line.startswith('*'): b.append(['n', line[1:].strip()])
        elif line.startswith('~'): b.append(['v', line[1:].strip()])
        else: b.append(['y', line])

    # ---------- 講記資料夾：source/<標記>/*.txt，依【001】分段，依提到的科判自動接到那一科的正文後面 ----------
    def attach_lectures(self, folder, kind, where):
        files = sorted(f for f in os.listdir(folder) if f.endswith('.txt'))
        segs = []
        for f in files:
            cur = None
            for line in open(os.path.join(folder, f), encoding='utf-8-sig'):
                line = line.rstrip('\n').strip()
                if not line or line.startswith('//'): continue
                if SEG_RE.match(line):
                    cur = [line]; segs.append(cur)
                elif cur is not None: cur.append(line)
                else:
                    cur = [line]; segs.append(cur)
        ptr, done = 0, 0
        for seg in segs:
            text = join_wrapped(seg)
            hit = self.find_mention(text, ptr)
            if hit is not None: ptr = hit
            elif not self.nodes: continue
            jn = self.nodes[ptr][6]
            self.notes.setdefault(jn, []).append([kind, self.after_node(ptr), text]); done += 1
        self.warn.append('%s：%d 段講記，已接到科判後面' % (where, done))

    def find_mention(self, text, start):
        """講記裡提到的科判（「乙一、華嚴時」）：取這一段最後提到、而且在目前位置之後的那一科。
        「甲二、別明分五：乙一…；乙二…」這種列舉（前後是冒號、分號）不算。"""
        best, ptr = None, start
        flat = re.sub(r'\s+', '', text)
        for m in MENTION_RE.finditer(flat):
            before, after = flat[m.start() - 1:m.start()], flat[m.end():m.end() + 1]
            if (before and before in '；;：:') or (after and after in '；;'): continue
            label, rest = m.group(1).replace('ㄧ', '一'), m.group(2)
            for i in range(ptr, len(self.nodes)):
                n = self.nodes[i]
                t = re.sub(r'\(.*\)$', '', n[0])
                if n[5] == label and t and rest.startswith(t[:max(2, min(len(t), 4))]):
                    best = ptr = i; break
        return best

    def after_node(self, i):
        jn = self.nodes[i][6]; b = self.juans[jn - 1][1]
        k = next(x for x, blk in enumerate(b) if blk[0] == 'k' and i in blk[1])
        ids = b[k][1]
        if ids[-1] != i:
            # 這一科之後緊接著下一科（沒有正文）：把科判區塊拆開，講記才能夾在兩科之間
            cut = ids.index(i) + 1
            b[k:k + 1] = [['k', ids[:cut]], ['k', ids[cut:]]]
            for nt in self.notes.get(jn, []):
                if nt[1] > k: nt[1] += 1
            return k + 1
        for x in range(k + 1, len(b)):
            if b[x][0] == 'k': return x
        return len(b)

    def finish(self):
        # 同一層的標號跳號（例如丁一之後直接丁三）：多半是轉檔時漏了一行
        seen = {}
        for i, n in enumerate(self.nodes):
            m = re.match(r'^.([一二三四五六七八九十百]+)$', n[5] or '')
            if not m: continue
            v = cn_value(m.group(1)); key = n[4]
            prev = seen.get(key)
            if prev is not None and v != prev[0] + 1:
                self.warn.append('「%s、%s」前面少了一科（上一個同層是「%s」）' % (n[5], n[0], prev[1]))
            seen[key] = (v, n[5])
        # 層級從 1 起算（有用到壹貳參就從壹開始）
        lv = min((n[3] for n in self.nodes), default=1)
        for n in self.nodes: n[3] = n[3] - lv + 1
        for n in self.nodes:
            if n[4] >= 0: self.nodes[n[4]][8] += 1
        for j in self.juans: j[1].append(['e', j[0]])


# ---------- 科判頁（A4 直書）：決定每頁放哪些科，實際排版由 App 依樹狀結構重排 ----------
FULL, LEVEL_GAP, PAGE_H, PAGE_COLS = 4.93, 10.0, 262.0, 30.0


def node_text(book, i):
    if i < 0: return book.cfg['書名']
    n = book.nodes[i]
    return (n[5] + '、' if n[5] else '') + n[0]


def node_shape(book, i, has_kids):
    chars = len(re.sub(r'\([^()]*\)$', '', node_text(book, i)))
    if has_kids and chars > 10: cols = max(2, math.ceil(chars / 9))
    elif chars <= 18: cols = 1
    else: cols = math.ceil(chars / 14)
    return cols, math.ceil(chars / cols) * FULL


def make_pages(book):
    N = book.nodes
    kids = {}
    for i, n in enumerate(N): kids.setdefault(n[4], []).append(i)
    pages, appear, own = [], {}, {}
    pending = [-1]

    def measure(roots, open_):
        """回傳 (寬度欄數, 最高高度)。open_ = 有展開下層的科。"""
        def go(i):
            ks = kids.get(i, []) if i in open_ else []
            cols, h = node_shape(book, i, bool(ks))
            if not ks: return cols, h
            w = sum(go(k)[0] for k in ks) + 0.3 * (len(ks) - 1)
            hh = h + LEVEL_GAP + max(go(k)[1] for k in ks)
            return max(cols, w), hh
        r = [go(x) for x in roots]
        return sum(a for a, _ in r) + 0.6 * (len(roots) - 1), max(b for _, b in r)

    def fits(roots, open_):
        w, h = measure(roots, open_)
        return w <= PAGE_COLS and h <= PAGE_H

    def expand(roots):
        """roots 自己一定展開一層；之後由淺到深盡量展開。"""
        open_ = set(r for r in roots if kids.get(r))
        frontier = [k for r in roots for k in kids.get(r, [])]
        while frontier:
            nxt = []
            for k in sorted(frontier, key=lambda x: (N[x][3], x)):
                if not kids.get(k): continue
                open_.add(k)
                if fits(roots, open_): nxt.extend(kids[k])
                else: open_.discard(k)
            frontier = nxt
        return open_

    while pending:
        pending.sort()
        q = pending.pop(0)
        ks = kids.get(q, [])
        # 下層太多、一頁放不下：同一科分成好幾頁（每頁重複上層）
        chunks, cur = [], []
        for k in ks:
            cur.append(k)
            w, _ = measure_one(book, q, cur, kids, measure)
            if w > PAGE_COLS and len(cur) > 1:
                cur.pop(); chunks.append(cur); cur = [k]
        if cur: chunks.append(cur)
        if len(chunks) > 1:
            for ch in chunks:
                open_ = {q} | expand_sub(ch, kids, fits, N, q)
                pages.append(render_page(book, [q], open_, kids, appear, own, len(pages) + 2, pending, only={q: ch}))
            continue
        roots = [q]
        # 同一上層、緊接著的科，放得下就同一頁
        while pending and q >= 0:
            pending.sort()
            nx = pending[0]
            if N[nx][4] != N[q][4] or not kids.get(nx): break
            trial = roots + [nx]
            if not fits(trial, set(r for r in trial if kids.get(r))): break
            full = expand(trial)
            if not all(all(k in full or not kids.get(k) for k in kids[r]) for r in trial): break
            roots = trial; pending.pop(0)
        open_ = expand(roots)
        pages.append(render_page(book, roots, open_, kids, appear, own, len(pages) + 2, pending))
    return pages, appear, own


def measure_one(book, q, ch, kids, measure):
    saved = kids.get(q); kids[q] = ch
    try: return measure([q], {q})
    finally: kids[q] = saved


def expand_sub(ch, kids, fits, N, q):
    open_ = set()
    saved = kids[q]; kids[q] = ch
    try:
        frontier = list(ch)
        while frontier:
            nxt = []
            for k in sorted(frontier, key=lambda x: (N[x][3], x)):
                if not kids.get(k): continue
                open_.add(k)
                if fits([q], {q} | open_): nxt.extend(kids[k])
                else: open_.discard(k)
            frontier = nxt
    finally: kids[q] = saved
    return open_


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')


def render_page(book, roots, open_, kids, appear, own, pno, pending, only=None):
    N = book.nodes
    out, x = [], [184.6]

    def place(i, depth, rt):
        ks = (only or {}).get(i, kids.get(i, [])) if i in open_ else []
        top = 16 + depth * 24
        if ks:
            xs = [place(k, depth + 1, False) for k in ks]
            cx = (xs[0] + xs[-1]) / 2
        else:
            cx = x[0]; x[0] -= 6.2 * node_shape(book, i, False)[0]
        cls = 'nd tt rt' if rt else 'nd tt'
        out.append('<div class="%s" data-id="%d" style="left:%.2fmm;top:%.2fmm;width:5.19mm">%s</div>' % (cls, i, cx - 2.6, top, esc(node_text(book, i))))
        if i >= 0: appear.setdefault(str(i), pno)
        if not ks and kids.get(i):
            out.append('<div class="nd nt" data-go="%d" style="left:%.2fmm;top:%.2fmm;width:3.34mm">(分%s)</div>' % (i, cx - 2.4, top + 30, cn(len(kids[i]))))
            if i not in pending and str(i) not in own: pending.append(i)
        return cx

    for r in roots:
        place(r, 0, True); x[0] -= 4
        own.setdefault(str(r), pno)
    if roots == [-1]:
        appear['-1'] = pno
        head = esc(book.cfg['書名']) + '科判表　總表'
    else:
        path, p = [], N[roots[0]][4]
        while p >= 0: path.insert(0, node_text(book, p)); p = N[p][4]
        head = '別表：' + '　'.join(esc(t) for t in path) if path else '別表'
    return ('<section class="page">\n<div class="head">%s</div>\n'
            '<svg class="ln" viewBox="0 0 210 297" width="210mm" height="297mm"></svg>\n%s</section>') % (head, ''.join(out))


# ---------- 輸出 ----------
def b64gz(obj):
    raw = json.dumps(obj, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    return base64.b64encode(gzip.compress(raw, 9, mtime=0)).decode('ascii')


def sha(path):
    return base64.b64encode(hashlib.sha256(open(path, 'rb').read()).digest()).decode()


def main():
    cfg = json.load(open(os.path.join(SRC, 'book.json'), encoding='utf-8'))
    for k in ('代號', '書名'):
        if not cfg.get(k): raise SystemExit('book.json 缺少「%s」' % k)
    if not re.fullmatch(r'[a-z0-9-]+', cfg['代號']): raise SystemExit('book.json 的「代號」只能用小寫英文、數字、- （例如 fahua）')
    for k in ('書名',):
        if re.search(r'[\'"\\<>]', cfg[k]): raise SystemExit('「%s」不能有引號、反斜線或角括號' % k)
    book = Book(cfg)
    files = sorted(f for f in os.listdir(SRC) if f.endswith('.txt'))
    if not files: raise SystemExit('來源資料夾沒有 .txt 檔')
    for f in files:
        for ln, line in enumerate(open(os.path.join(SRC, f), encoding='utf-8-sig'), 1):
            book.add_line(line, '%s 第 %d 行' % (f, ln))
    for m in (cfg.get('講記') or [])[:2]:
        folder = os.path.join(SRC, m['標記'])
        if os.path.isdir(folder):
            book.attach_lectures(folder, book.note_kind[m['標記']], m['名稱'])
    book.finish()
    nj = len(book.juans)
    if nj > 100: raise SystemExit('目前最多 100 卷')
    pages, appear, own = make_pages(book)
    data = {'nodes': book.nodes, 'pages': pages, 'appear': appear, 'own': own,
            'text': [[j[0], j[1]] for j in book.juans], 'src': cfg['代號']}
    dd = os.path.join(ROOT, 'data')
    for f in os.listdir(dd):
        if re.fullmatch(r'notes-\d+\.js|book\.js', f): os.remove(os.path.join(dd, f))
    open(os.path.join(dd, 'book.js'), 'w', encoding='utf-8').write('window.HKZANG&&window.HKZANG("%s")\n' % b64gz(data))
    nchunks = max(1, math.ceil(nj / 5))
    for c in range(1, nchunks + 1):
        part = {str(j): book.notes.get(j, []) for j in range((c - 1) * 5 + 1, min(nj, c * 5) + 1)}
        open(os.path.join(dd, 'notes-%02d.js' % c), 'w', encoding='utf-8').write(
            'window.HKNOTES&&window.HKNOTES(' + json.dumps(part, ensure_ascii=False, separators=(',', ':')) + ')\n')

    marks = (cfg.get('講記') or [])[:2]
    names = [m['名稱'] for m in marks] + ['', ''][len(marks):]
    tags = [m['標記'] for m in marks] + ['', ''][len(marks):]
    unit = cfg.get('卷的名稱') or '卷'
    ver = cfg.get('版本') or '1.0.0'
    rep = {'{{書名}}': cfg['書名'], '{{短名}}': cfg.get('短名') or cfg['書名'], '{{代號}}': cfg['代號'],
           '{{卷數}}': str(nj), '{{註解檔數}}': str(nchunks), '{{講記一}}': names[0] or '講記一',
           '{{講記二}}': names[1] or '講記二', '{{講記一標記}}': tags[0] or '講', '{{卷}}': unit,
           '{{版本}}': ver, '{{日期}}': __import__('datetime').date.today().isoformat(), '{{關於}}': esc(cfg.get('關於') or '')}
    hide = []
    if not names[0]: hide.append('.sw.px,#exPx')
    if not names[1]: hide.append('.sw.cb,#exCb')
    shell = os.path.join(ROOT, 'shell')

    def fill(t):
        for k, v in rep.items(): t = t.replace(k, v)
        left = re.findall(r'\{\{[^{}]{1,8}\}\}', t)
        if left: raise SystemExit('外殼還有沒填的欄位：' + ', '.join(sorted(set(left))))
        return t
    html = fill(open(os.path.join(shell, 'index.html'), encoding='utf-8').read())
    if hide:
        html = html.replace('</head>', '<style id="book-hide">' + ','.join(hide).replace(',', ',') + '{display:none!important}</style></head>', 1)
    open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(html)
    open(os.path.join(ROOT, 'manifest.webmanifest'), 'w', encoding='utf-8').write(fill(open(os.path.join(shell, 'manifest.webmanifest'), encoding='utf-8').read()))
    offline = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'assets/tutorial/gestures-lite.svg']
    offline += sorted('data/' + f for f in os.listdir(dd) if not f.startswith('.'))
    F = {f: sha(os.path.join(ROOT, 'index.html' if f == './' else f)) for f in offline}
    sw = fill(open(os.path.join(shell, 'sw.js'), encoding='utf-8').read())
    sw = sw.replace("'__VERSION__'", json.dumps(ver)).replace('__FILES__', json.dumps(F, ensure_ascii=False, separators=(',', ':')))
    open(os.path.join(ROOT, 'sw.js'), 'w', encoding='utf-8').write(sw)
    nn = sum(len(v) for v in book.notes.values())
    print('完成：%s｜%d %s｜科判 %d 科｜科判頁 %d 頁｜講記 %d 段' % (cfg['書名'], nj, unit, len(book.nodes), len(pages), nn))
    for w in book.warn: print('注意：' + w)


if __name__ == '__main__':
    main()
