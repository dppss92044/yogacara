# v1.70：電腦正文／科判右上「大小」鈕
import sys, json
SRC, DST = sys.argv[1], sys.argv[2]
s = open(SRC, encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    c = s.count(old)
    if c != n: raise SystemExit('count %d: %r' % (c, old[:90]))
    s = s.replace(old, new)
rep('''popup.innerHTML='<div class="book-size-row"><button data-size="-1" aria-label="縮小 10%">−</button><output id="bookPercent"></output><button data-size="1" aria-label="放大 10%">＋</button></div><button class="book-font">字體與行距</button>';''',
    '''popup.innerHTML='<div class="book-size-row"><button data-size="-1" aria-label="縮小 10%">小</button><output id="bookPercent"></output><button data-size="1" aria-label="放大 10%">大</button></div><button class="book-font">字體與行距</button>';popup.classList.add('seg');''')
rep('''    var bar=document.querySelector('.zbar'),juanButton=''', '''    // 電腦：正文與科判右上各一個「大小」鈕
    (function(){var pr=[].slice.call(fontTools.querySelectorAll('.font-pane-row'))[2],pb=pr&&pr.querySelector('.book-size-button'),pt=document.querySelector('.books-tools[data-z="p"]'),mb=document.querySelector('.books-tools[data-z="m"] .book-size-button');
      [mb,pb].forEach(function(b){if(!b)return;b.classList.add('dx');b.innerHTML='<span class="g">大<span class="s">小</span></span>';b.setAttribute('aria-label','字的大小');});
      function home(){if(!pb||!pt)return;if(deviceLayout==='mac'){if(pb.parentElement!==pt)pt.insertBefore(pb,pt.firstChild);}else if(pb.parentElement!==pr)pr.appendChild(pb);}
      home();window.addEventListener('reader-layout',home);})();
    var bar=document.querySelector('.zbar'),juanButton=''')
rep('<b id="appVer">v1.69</b>', '<b id="appVer">v1.70</b>')
i = s.index("$('versionHistory').onclick=null;$('versionDoc').textContent=") + len("$('versionHistory').onclick=null;$('versionDoc').textContent=")
_, end = json.JSONDecoder().raw_decode(s[i:])
s = s[:i] + json.dumps("v1.70\n最後更新：2026年10月4日", ensure_ascii=False) + s[i + end:]
CSS = open('v170.css', encoding='utf-8').read()
k = s.rindex('</body></html>'); s = s[:k] + '<style id="v170">' + CSS + '</style>\n' + s[k:]
open(DST, 'w', encoding='utf-8').write(s)
print('ok')
