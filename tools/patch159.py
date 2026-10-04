# v1.59
import sys, re, json
SRC, DST = sys.argv[1], sys.argv[2]
s = open(SRC, encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    c = s.count(old)
    if c != n: raise SystemExit('count %d: %r' % (c, old[:90]))
    s = s.replace(old, new)

# ---- 承接前卷的卷次科判：不跳到別卷 ----
rep("""out.push('<a href="#n' + k + '" data-n="' + k + '"'""", """out.push('<a href="#n' + k + '" data-n="' + k + '"' + (carried ? ' data-carry="' + j + '"' : '')""")
rep('var rn = t.closest(".rol a"); if (rn) {', 'var rn = t.closest(".rol a"); if (rn && rn.dataset.carry) { e.preventDefault(); carryFocus(+rn.dataset.n, +rn.dataset.carry); return; } if (rn) {')
rep("if(screen==='catalog'){focusNode(hit.i,'rail');return;}", "if(screen==='catalog'){if(hit.el.dataset.carry){carryFocus(hit.i,+hit.el.dataset.carry);return;}focusNode(hit.i,'rail');return;}")
rep('''  function goSub(g) {''', '''  // 此卷沒有新科判（承接前卷）：留在此卷卷首，科判欄標出承接的那一科
  function carryFocus(i, j) {
    if (S.view !== "t" || S.juan !== j) nav("#j" + j); else pinJump(j);
    S.cur = i; linkedPage = APPEAR[i] || 2;
    var c = $("rinner").querySelector("a.cur"); if (c) c.classList.remove("cur");
    var a = $("rinner").querySelector('a[data-n="' + i + '"]'); if (a) a.classList.add("cur");
    if (S.panel) { panelJuan = j; panelPage(APPEAR[i] || 2, i, j); }
    panelHold = true;
  }
  function goSub(g) {''')
# 點卷號：卷首貼齊頂端，不露出前一卷
rep('d = sec.getBoundingClientRect().top - line - 8;', 'd = sec.getBoundingClientRect().top - line + 1;')

# ---- 切換版本：停在同一段原文，三欄同步 ----
rep('''    var j=S.view==='v'?(PJ[S.vpage]||S.railJuan||1):(S.juan||1),msg=$('editionMsg');''',
    '''    var j=S.view==='v'?(PJ[S.vpage]||S.railJuan||1):(S.juan||1),msg=$('editionMsg'),anchor=readingAnchor(),screen=ReaderUI.screen;''')
rep('''      nav('#j'+j);window.scrollTo(0,0);''', '''      noPin=true;nav('#j'+j);noPin=false;
      if(ReaderUI.single&&screen!=='read'&&screen!=='search')selectReaderPane(screen,false);
      restoreAnchor(anchor,j);''')
rep('''  function switchEdition(ed){''', r'''  function normT(t){return String(t||'').replace(/[^㐀-鿿豈-﫿]/g,'');}
  function textBlocks(vol){return vol?[].slice.call(vol.querySelectorAll('.txt > p:not(.au):not(.rq), .txt > .pin')):[];}
  var CJK=/[㐀-鿿豈-﫿]/;
  var VAR={'毘':'毗','缽':'鉢','拕':'柁','衆':'眾','爲':'為','説':'說','却':'卻','碍':'礙','畧':'略','麤':'粗','麁':'粗','麄':'粗','峯':'峰','綫':'線','鷄':'雞','脩':'修','弃':'棄','徧':'遍','游':'遊','妬':'妒','噁':'惡','姊':'姉','蘊':'蕴','异':'異'};
  function textIndex(el){var w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),n,map=[],str='';while((n=w.nextNode())){var t=n.textContent;for(var i=0;i<t.length;i++)if(CJK.test(t[i])){str+=VAR[t[i]]||t[i];map.push([n,i]);}}return {str:str,map:map};}
  function caretAt(x,y){if(document.caretRangeFromPoint){var r=document.caretRangeFromPoint(x,y);return r?{node:r.startContainer,offset:r.startOffset}:null;}if(document.caretPositionFromPoint){var q=document.caretPositionFromPoint(x,y);return q?{node:q.offsetNode,offset:q.offset}:null;}return null;}
  function charTop(node,o){var rg=document.createRange();rg.setStart(node,o);rg.setEnd(node,Math.min(node.textContent.length,o+1));return rg.getBoundingClientRect().top;}
  // 目前讀到的那一行原文：取該處起的幾小段文字，作為兩版共同的定位點
  function readingAnchor(){
    var j=S.juan||1,keys=[],off=null;
    if(S.view==='t'&&main.getClientRects().length){
      var band=document.querySelector('.zbar').getBoundingClientRect().bottom,ar=article.getBoundingClientRect();
      for(var y=band+20;y<innerHeight-40&&!keys.length;y+=22){
        var pos=caretAt(ar.left+Math.min(48,ar.width/4),y);if(!pos||pos.node.nodeType!==3)continue;
        var blk=pos.node.parentElement&&pos.node.parentElement.closest('.txt > p:not(.au):not(.rq), .txt > .pin'),vol=blk&&blk.closest('.reading-volume');
        if(!blk||!vol||+vol.dataset.juan!==j)continue;
        var ix=textIndex(blk),st=-1;for(var m=0;m<ix.map.length;m++)if(ix.map[m][0]===pos.node&&ix.map[m][1]>=pos.offset||ix.map[m][0]!==pos.node&&(pos.node.compareDocumentPosition(ix.map[m][0])&Node.DOCUMENT_POSITION_FOLLOWING)){st=m;break;}
        if(st<0)continue;off=charTop(ix.map[st][0],ix.map[st][1]);
        var rest=ix.str.slice(st);[0,8,16,24,32,40,56].forEach(function(a){var k=rest.slice(a,a+9);if(k.length>=7)keys.push({k:k,s:a});});[0,6,12,18,24,30,36,42,48].forEach(function(a){var k=rest.slice(a,a+6);if(k.length===6)keys.push({k:k,s:a});});
      }
    }
    if(!keys.length){
      var vol2=document.getElementById('volume-'+j),list=textBlocks(vol2),b=ReaderUI.bookmark,ref=b&&b.juan===j?$(b.id):(S.cur!=null?$('k'+S.cur):null),p=null;
      if(ref)for(var q=0;q<list.length;q++)if(list[q]===ref||(ref.compareDocumentPosition(list[q])&Node.DOCUMENT_POSITION_FOLLOWING)){p=list[q];break;}
      if(p){var t=textIndex(p).str;[0,8,16].forEach(function(a){var k=t.slice(a,a+9);if(k.length>=6)keys.push({k:k,s:a});});if(b)off=b.offset;}
    }
    return {juan:j,keys:keys,off:off};
  }
  function restoreAnchor(a,j){
    var vol=document.getElementById('volume-'+j),list=textBlocks(vol),hit=null,cache=new Map();
    if(a&&a.juan===j)for(var k=0;k<a.keys.length&&!hit;k++)for(var q=0;q<list.length;q++){var ix=cache.get(list[q]);if(!ix){ix=textIndex(list[q]);cache.set(list[q],ix);}var at=ix.str.indexOf(a.keys[k].k);if(at>=0){var c=Math.max(0,at-a.keys[k].s);hit={block:list[q],node:ix.map[c][0],o:ix.map[c][1]};break;}}
    if(!hit){pinJump(j);return;}
    var heads=vol.querySelectorAll('.kn'),best=null;
    for(var h=0;h<heads.length;h++){if(heads[h].compareDocumentPosition(hit.block)&Node.DOCUMENT_POSITION_FOLLOWING)best=heads[h];else break;}
    var i=best?+best.dataset.kn:(CARRY[j]!=null?CARRY[j]:null);
    if(i!=null&&N[i]){
      S.cur=i;article.querySelectorAll('.kn.on').forEach(function(x){x.classList.remove('on');});if(best)best.classList.add('on');
      linkedPage=APPEAR[i]||2;railFocus(i);if(S.panel){panelJuan=j;panelPage(APPEAR[i]||2,i,j);}
    }
    var band=document.querySelector('.zbar'),top=band?band.getBoundingClientRect().bottom+8:60,off=a.off!=null?Math.max(top,a.off):top+80;
    if(!main.getClientRects().length){ReaderUI.bookmark={juan:j,id:hit.block.id,offset:off,cur:S.cur,page:linkedPage};return;}
    var gen=++jumpGen;jumpUntil=Date.now()+1600;spyLock=Date.now()+2200;
    function stop(){if(gen===jumpGen)jumpUntil=0;}
    ['wheel','touchstart','keydown','pointerdown'].forEach(function(ev){window.addEventListener(ev,stop,{once:true,passive:true,capture:true});});
    function fix(){if(gen!==jumpGen||Date.now()>jumpUntil||!hit.node.isConnected||!hit.block.getClientRects().length)return;var d=charTop(hit.node,hit.o)-off;if(Math.abs(d)>2)window.scrollBy(0,d);}
    fix();requestAnimationFrame(fix);[80,250,600,1100].forEach(function(t){setTimeout(fix,t);});
    setTimeout(function(){if(gen===jumpGen)jumpUntil=0;},1650);
  }
  function switchEdition(ed){''')

# ---- 科判標號 → 科標；粗度 → 粗細 ----
s = s.replace('科判標號', '科標')
rep('<span>粗度</span>', '<span>粗細</span>')

# ---- 問題回報失敗訊息（給讀者看的） ----
rep("msg.innerHTML=(er&&er.activation?'寄件服務尚未啟用（請到信箱點啟用信）。':'送出失敗。')+'<a href=\"'+mail+'\">改用郵件</a>';",
    "msg.innerHTML='目前無法直接送出，<a href=\"'+mail+'\">改用郵件寄出</a>';void er;")

# ---- 版本紀錄：全部改成程式摘要 ----
SUM = json.load(open('summaries159.json', encoding='utf-8'))
m = re.search(r'var versionSummaries=(\{.*?\});', s)
s = s[:m.start(1)] + json.dumps(SUM, ensure_ascii=False, separators=(',', ':')) + s[m.end(1):]
rep('<b id="appVer">v1.58</b>', '<b id="appVer">v1.59</b>')
rep('<div id="versionHistory"><button class="version-row" data-version="1.58">', '<div id="versionHistory"><button class="version-row" data-version="1.59"><span>v1.59</span><span>›</span></button><button class="version-row" data-version="1.58">')
rep("versionPage('1.58','about');};", "versionPage('1.59','about');};")
rep("versionPage('1.58','about');}};", "versionPage('1.59','about');}};")

CSS = open('v159.css', encoding='utf-8').read()
k = s.rindex('</body></html>'); s = s[:k] + '<style id="v159">' + CSS + '</style>\n' + s[k:]
open(DST, 'w', encoding='utf-8').write(s)
print('ok')
