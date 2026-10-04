# v1.68（以 v1.67 為底）
import sys, json, re
SRC, DST = sys.argv[1], sys.argv[2]
s = open(SRC, encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    c = s.count(old)
    if c != n: raise SystemExit('count %d: %r' % (c, old[:90]))
    s = s.replace(old, new)
# 縮圖鈕與工具列重疊：電腦隱藏卷次縮圖鈕；iPad 保留縮圖鈕，工具列讓位
rep("""  function railOpenGuard(){var a=$('railOpen'),b=$('menuBtn');if(!a||!b)return;a.style.visibility='';var r1=a.getBoundingClientRect(),r2=b.getBoundingClientRect();if(r1.width&&r2.width&&r1.right>r2.left-6&&r1.left<r2.right+6&&r1.bottom>r2.top&&r1.top<r2.bottom)a.style.visibility='hidden';}""",
"""  function railOpenGuard(){
    var zb=document.querySelector('.zbar');if(!zb)return;var a=$('railOpen'),b=$('menuBtn'),po=$('panelOpen'),sb=document.querySelector('.books-tools[data-z="m"]');
    zb.style.paddingLeft='';zb.style.paddingRight='';if(a)a.style.visibility='';
    function hit(x,y){if(!x||!y)return 0;var r1=x.getBoundingClientRect(),r2=y.getBoundingClientRect();if(!r1.width||!r2.width||r1.bottom<=r2.top||r1.top>=r2.bottom)return 0;return r1.right>r2.left-6&&r1.left<r2.right+6;}
    if(a&&b&&hit(a,b)){if(deviceLayout==='ipad'){var need=a.getBoundingClientRect().right+8-b.getBoundingClientRect().left;zb.style.paddingLeft=(parseFloat(getComputedStyle(zb).paddingLeft)+need)+'px';}else a.style.visibility='hidden';}
    if(po&&sb&&hit(po,sb)){var need2=sb.getBoundingClientRect().right-po.getBoundingClientRect().left+8;zb.style.paddingRight=(parseFloat(getComputedStyle(zb).paddingRight)+need2)+'px';}
  }""")
rep("setInterval(railOpenGuard,1500);","setInterval(railOpenGuard,800);document.addEventListener('click',function(){setTimeout(railOpenGuard,350);setTimeout(railOpenGuard,900);},true);")
rep('<b id="appVer">v1.67</b>', '<b id="appVer">v1.68</b>')
i = s.index("$('versionHistory').onclick=null;$('versionDoc').textContent=") + len("$('versionHistory').onclick=null;$('versionDoc').textContent=")
dec = json.JSONDecoder(); _, end = dec.raw_decode(s[i:])
s = s[:i] + json.dumps("v1.68\n最後更新：2026年10月4日", ensure_ascii=False) + s[i + end:]
CSS = open('v168.css', encoding='utf-8').read()
k = s.rindex('</body></html>'); s = s[:k] + '<style id="v168">' + CSS + '</style>\n' + s[k:]
open(DST, 'w', encoding='utf-8').write(s)
print('ok')
