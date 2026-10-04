# v1.73
import sys, json
SRC, DST = sys.argv[1], sys.argv[2]
s = open(SRC, encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    c = s.count(old)
    if c != n: raise SystemExit('count %d: %r' % (c, old[:90]))
    s = s.replace(old, new)
# 卷次也放「大小」
rep("""    (function(){var pr=[].slice.call(fontTools.querySelectorAll('.font-pane-row'))[2],pb=pr&&pr.querySelector('.book-size-button'),pt=document.querySelector('.books-tools[data-z="p"]'),mb=document.querySelector('.books-tools[data-z="m"] .book-size-button');
      [mb,pb].forEach(""","""    (function(){var rows=[].slice.call(fontTools.querySelectorAll('.font-pane-row')),pr=rows[2],pb=pr&&pr.querySelector('.book-size-button'),pt=document.querySelector('.books-tools[data-z="p"]'),mb=document.querySelector('.books-tools[data-z="m"] .book-size-button'),rr=rows[0],rb=rr&&rr.querySelector('.book-size-button'),rt=document.querySelector('.books-tools[data-z="r"]');
      [mb,pb,rb].forEach(""")
rep("""      function home(){if(!pb||!pt)return;if(deviceLayout==='mac'||deviceLayout==='ipad'){if(pb.parentElement!==pt)pt.insertBefore(pb,pt.firstChild);}else if(pb.parentElement!==pr)pr.appendChild(pb);}""",
"""      function home(){var big=deviceLayout==='mac'||deviceLayout==='ipad';[[pb,pt,pr],[rb,rt,rr]].forEach(function(x){if(!x[0]||!x[1])return;if(big){if(x[0].parentElement!==x[1])x[1].insertBefore(x[0],x[1].firstChild);}else if(x[0].parentElement!==x[2])x[2].appendChild(x[0]);});}""")
# 小｜大 視窗：不透明，與欄位工具同底色
rep("popup.hidden=false;update();place();Motion.open(popup);", "popup.hidden=false;var tb=this.closest('.books-tools');popup.style.background=tb?getComputedStyle(tb).backgroundColor:'';update();place();Motion.open(popup);")
# 回上方
rep("""b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V6M6 11l6-6 6 6"/></svg>';b.onclick=function(e){e.stopPropagation();var v=$('pview');if(v)v.scrollTo({top:0,behavior:'smooth'});};""",
"""b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V6M6 11l6-6 6 6"/></svg><span class="t">回上方</span>';b.title='按一下：本卷科判頂端；按兩下：第一卷';
      var tmr=0;function goTop(j){var v=$('pview');if(!v)return;if(j==null){v.scrollTo({top:0,behavior:'smooth'});return;}var p=JFIRSTPAGE[j]||2,el=$('pp'+p);if(!el){v.scrollTo({top:0,behavior:'smooth'});return;}if(!el.firstChild)fillPage(el,p);pScrollLock=Date.now()+900;var r=el.getBoundingClientRect(),rv=v.getBoundingClientRect();v.scrollTo({top:v.scrollTop+r.top-rv.top-8,behavior:'smooth'});setPanelLabel(p,j);}
      b.onclick=function(e){e.stopPropagation();if(phoneMode()){goTop(null);return;}clearTimeout(tmr);tmr=setTimeout(function(){goTop(PJ[S.ppage]||S.juan||1);},260);};
      b.ondblclick=function(e){e.stopPropagation();clearTimeout(tmr);goTop(1);};""")
rep('<b id="appVer">v1.71</b>', '<b id="appVer">v1.73</b>')
i = s.index("$('versionHistory').onclick=null;$('versionDoc').textContent=") + len("$('versionHistory').onclick=null;$('versionDoc').textContent=")
_, end = json.JSONDecoder().raw_decode(s[i:])
s = s[:i] + json.dumps("v1.73\n最後更新：2026年10月4日", ensure_ascii=False) + s[i + end:]
CSS = open('v172.css', encoding='utf-8').read() + open('v173.css', encoding='utf-8').read()
k = s.rindex('</body></html>'); s = s[:k] + '<style id="v173">' + CSS + '</style>\n' + s[k:]
open(DST, 'w', encoding='utf-8').write(s)
print('ok')
