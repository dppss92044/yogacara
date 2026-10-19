#!/usr/bin/env python3
"""整理 PDF 轉出來的文字，讓它可以放進 source/。

直書 PDF 轉成文字時，常常一個字一行、夾著頁碼「- 12 -」和目錄的點點線。
本工具把這些整理成一行一句，科判行（甲一、乙二…）各自一行。
整理完請自己看一遍，再加上「= 卷名」等標記。

用法：python3 tools/pdf_text.py 轉出來的.txt > source/02-某某.txt
"""
import re, sys

LABEL = re.compile(r'^[壹貳參肆伍陸柒捌玖拾甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥][一二三四五六七八九十ㄧ]+、')


def main(path):
    lines = open(path, encoding='utf-8-sig').read().split('\n')
    out, buf = [], ''
    for l in lines:
        t = l.strip()
        if re.fullmatch(r'-\s*\d*\s*-?|-', t) or re.fullmatch(r'\d+', t):
            continue
        if len(t) <= 2 and t:
            buf += t
            continue
        if buf:
            out.append(buf); buf = ''
        out.append(t)
    if buf: out.append(buf)
    text = '\n'.join(out)
    text = re.sub(r'\.{5,}\s*\n?\s*\d*', '', text)          # 目錄點點線與頁碼
    text = text.replace('ㄧ', '一').replace('﹁', '「').replace('﹂', '」').replace('︽', '《').replace('︾', '》')
    res = []
    for t in text.split('\n'):
        t = t.strip()
        if not t: continue
        # 科判夾在一行中間時拆開
        parts = re.split(r'(?=(?<![甲-龥])[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥][一二三四五六七八九十]+、)', t)
        res.extend(p.strip() for p in parts if p.strip())
    sys.stdout.write('\n'.join(res) + '\n')


if __name__ == '__main__':
    if len(sys.argv) != 2: raise SystemExit(__doc__)
    main(sys.argv[1])
