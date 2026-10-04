# v1.54 patch: 藏經版本切換、觸控反白查詞、科判寬度、字體／匯出面板、側欄圖示、手機底部列、捲動。
import re, sys
SRC, DST = sys.argv[1], sys.argv[2]
s = open(SRC, encoding='utf-8').read()

def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit('anchor count %d != %d: %r' % (n, count, old[:90]))
    s = s.replace(old, new)

# ------------------------------------------------------------------ icons
SIDE_L = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="4.5" width="15" height="15" rx="1.2"/><path d="M9.6 4.5v15"/></svg>'
SIDE_R = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="4.5" width="15" height="15" rx="1.2"/><path d="M14.4 4.5v15"/></svg>'
OLD_L = '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="2.5" y="3.5" width="15" height="13" rx="2.6"/><line x1="7.5" y1="3.5" x2="7.5" y2="16.5"/></svg>'
OLD_R = '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="2.5" y="3.5" width="15" height="13" rx="2.6"/><line x1="12.5" y1="3.5" x2="12.5" y2="16.5"/></svg>'
rep(OLD_L, SIDE_L, 2)
rep(OLD_R, SIDE_R, 2)
rep("""close.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16M12 9l-3 3 3 3"/></svg>';""",
    """close.innerHTML=zc.dataset.z==='r'?'"""+SIDE_L.replace("'", "\\'")+"""':'"""+SIDE_R.replace("'", "\\'")+"""';""")

# ------------------------------------------------------------------ 版本 menu
EDITION_HTML = ('<div class="edition-settings"><button class="mi" id="editionBtn" role="menuitem" aria-haspopup="true">'
 '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M4 5.5h6.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 0-1.5-1.5H4zM20 5.5h-6.5A1.5 1.5 0 0 0 12 7v12a1.5 1.5 0 0 1 1.5-1.5H20z"/></svg>'
 '<span>版本</span><em class="mi-val" id="editionCur">韓清淨科判</em><i class="chev">›</i></button>'
 '<div class="edition-body" role="radiogroup" aria-label="版本">'
 '<button type="button" class="edition-choice" data-edition="hk" role="radio" aria-checked="true"><span class="ed-t"><b>韓清淨科判</b><small>科句披尋記本・可開披尋記與常柏法師釋</small></span><span class="ed-ck" aria-hidden="true">✓</span></button>'
 '<button type="button" class="edition-choice" data-edition="zang" role="radio" aria-checked="false"><span class="ed-t"><b>藏經科判</b><small>大藏經原文・藏經科判表</small></span><span class="ed-ck" aria-hidden="true">✓</span></button>'
 '<p class="edition-note" id="editionMsg" role="status"></p></div></div>')
rep('<div class="content-settings">', EDITION_HTML + '<div class="content-settings">')

# 披尋記／常柏 switches get a shared class so 藏經 mode can hide them
rep('<label class="sw px"><span class="nm">披尋記</span>', '<label class="sw px notes-only"><span class="nm">披尋記</span>')
rep('<label class="sw cb"><span class="nm">常柏法師釋</span>', '<label class="sw cb notes-only"><span class="nm">常柏法師釋</span>')

# settings navigation
rep("var target=e.target.closest('#contentBtn,#ftBtn,", "var target=e.target.closest('#editionBtn,#contentBtn,#ftBtn,")
rep("var page=target.id==='contentBtn'?'content':", "var page=target.id==='editionBtn'?'edition':target.id==='contentBtn'?'content':")
rep("var names={root:'功能',content:'內文',", "var names={root:'功能',edition:'版本',content:'內文',")
rep("lockedSub=page==='root'?null:page==='content'?'content':", "lockedSub=page==='root'?null:page==='edition'?'edition':page==='content'?'content':")

# ------------------------------------------------------------------ font panel
rep('<button class="fa sm" id="fsDn" aria-label="字體縮小">A</button>', '<button class="fa sm" id="fsDn" aria-label="字體縮小">T</button>')
rep('<button class="fa lg" id="fsUp" aria-label="字體放大">A</button>', '<button class="fa lg" id="fsUp" aria-label="字體放大">T</button>')
rep('<input type="range" id="fsR" min="0" max="15" step="1" value="5" aria-label="字體大小"><div class="fticks" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i class="d"></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>',
    '<input type="range" id="fsR" min="0" max="6" step="1" value="3" aria-label="字體大小"><div class="fticks" aria-hidden="true"><i></i><i></i><i></i><i class="d"></i><i></i><i></i><i></i></div>')
def ls_icon(gap):
    ys = [12 - gap, 12, 12 + gap]
    return ('<svg viewBox="0 0 28 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">'
            + ''.join('<path d="M5 %.1fh18"/>' % y for y in ys) + '</svg>')
rep('<button data-l="0.85" role="radio">緊湊</button><button data-l="1" role="radio">標準</button><button data-l="1.25" role="radio">寬鬆</button>',
    '<button data-l="0.85" role="radio" aria-label="緊湊" title="緊湊">' + ls_icon(3.2) + '</button>'
    '<button data-l="1" role="radio" aria-label="標準" title="標準">' + ls_icon(5) + '</button>'
    '<button data-l="1.25" role="radio" aria-label="寬鬆" title="寬鬆">' + ls_icon(7) + '</button>')
rep('var FSTEPS = Array.from({length:16},function(_,i){return (50+i*10)/100;});', 'var FSTEPS = [0.7,0.8,0.9,1,1.15,1.3,1.5];')
rep('r.style.setProperty("--fp", (ix / 15 * 100) + "%");var defaultIx=5;', 'r.style.setProperty("--fp", (ix / (FSTEPS.length-1) * 100) + "%");var defaultIx=3;')
rep('document.querySelector(".fdef").style.left=(defaultIx/15*100)+"%";', 'document.querySelector(".fdef").style.left=(defaultIx/(FSTEPS.length-1)*100)+"%";')
rep('$("fsUp").onclick = function () { setFont(FSTEPS[Math.min(15, fsIdx(Z.m) + 1)], null, true); };', '$("fsUp").onclick = function () { setFont(FSTEPS[Math.min(FSTEPS.length-1, fsIdx(Z.m) + 1)], null, true); };')

# ------------------------------------------------------------------ export panel markup
i0 = s.index('<div class="dlpop" id="dlPop" hidden>')
i1 = s.index('<div class="about" id="about">')
old = s[i0:i1]
j = old.rindex('</div>')  # closes .dl wrapper
DL_HTML = '''<div class="dlpop ex-panel" id="dlPop" hidden>
          <button class="one ex-hero" id="exOne"><svg width="26" height="26" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 2.8h7l3.5 3.5v10.9H5z"/><path d="M12 2.8v3.5h3.5M10 9v5M7.8 11.8 10 14l2.2-2.2"/></svg><span class="ex-hero-t"><b>一鍵匯出全書</b><small>卷一至卷一百・內文與科判・PDF</small></span><i class="chev" aria-hidden="true">›</i></button>
          <div class="msg" id="oneMsg"></div>
          <section class="ex-card">
            <h5>自訂匯出</h5>
            <div class="ex-row"><span class="ex-l">卷次</span><div class="ex-c ex-range"><span>卷</span><input id="exFrom" type="number" min="1" max="100" value="1" aria-label="起始卷"><span>至</span><input id="exTo" type="number" min="1" max="100" value="1" aria-label="結束卷"><span class="ex-quick"><button class="lk" id="exThis">本卷</button><button class="lk" id="exAll">全部</button></span></div></div>
            <div class="ex-row"><span class="ex-l">內容</span><div class="cks"><label class="ck"><input type="checkbox" id="exText" checked><span>內文</span></label><label class="ck"><input type="checkbox" id="exKp" checked><span>科判</span></label><label class="ck notes-only"><input type="checkbox" id="exPx"><span>披尋記</span></label><label class="ck notes-only"><input type="checkbox" id="exCb"><span>常柏法師釋</span></label></div></div>
            <div class="ex-row"><span class="ex-l">格式</span><div class="cks"><label class="ck"><input type="checkbox" id="exF_pdf" checked><span>PDF</span></label><label class="ck"><input type="checkbox" id="exF_docx"><span>Word</span></label><label class="ck"><input type="checkbox" id="exF_html"><span>HTML</span></label><label class="ck"><input type="checkbox" id="exF_md"><span>Markdown</span></label><label class="ck"><input type="checkbox" id="exF_txt"><span>TXT</span></label></div></div>
            <div class="ex-row"><span class="ex-l">方式</span><div class="cks"><label class="ck"><input type="radio" id="exSep" name="exm" checked><span>個別檔案</span></label><label class="ck"><input type="radio" id="exZip" name="exm"><span>打包 ZIP</span></label></div></div>
            <button class="go ex-go" id="exGo">匯出</button>
            <div class="msg" id="exMsg"></div>
          </section>
          <section class="ex-card ex-kp">
            <h5>直書科判表 PDF</h5>
            <p class="ex-info" id="dlInfo">選擇要匯出的頁碼範圍。</p>
            <div class="ex-row"><span class="ex-l">頁碼</span><div class="ex-c ex-range"><span>第</span><input id="dlFrom" type="number" min="1" aria-label="起始頁"><span>至</span><input id="dlTo" type="number" min="1" aria-label="結束頁"><span>頁</span></div></div>
            <div class="ex-acts"><button class="allbtn" id="dlAll"><svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3v9.5M6 9l4 4 4-4M3.5 15.5v1.5h13v-1.5"/></svg>整本科判表</button><button class="go" id="dlGo">匯出所選頁</button><button id="dlCancel" hidden></button></div>
            <div class="msg" id="dlMsg"></div>
          </section>
        </div>
    '''
s = s[:i0] + DL_HTML + old[j:] + s[i1:]

rep("var inset=v.width<500?16:24,width=Math.max(80,Math.min(380,v.width-inset*2));",
    "var inset=v.width<500?12:24,width=Math.max(80,Math.min(settingsPage==='dl'?460:settingsPage==='edition'?320:380,v.width-inset*2));")

# ------------------------------------------------------------------ edition data plumbing (JS)
rep('''  var CN = "〇一二三四五六七八九";
  function cn(n)''', '''  async function gunzipB64(b64) {
    var b = atob(b64), u8 = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u8[i] = b.charCodeAt(i);
    if (window.DecompressionStream) return JSON.parse(await new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream("gzip"))).text());
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js");
    return JSON.parse(window.pako.ungzip(u8, { to: "string" }));
  }
  // v1.54: two editions share one reader. Only the data set changes.
  var EDITION = "hk", EDATA = {};
  try { EDITION = localStorage.getItem("hk-edition-v154") === "zang" ? "zang" : "hk"; } catch (e) {}
  document.documentElement.dataset.edition = EDITION;
  var ZANG_PROMISE = null;
  function loadEdition(ed) {
    if (EDATA[ed]) return Promise.resolve(EDATA[ed]);
    if (ed === "hk") return unpack().then(function (d) { return (EDATA.hk = d); });
    if (!ZANG_PROMISE) ZANG_PROMISE = new Promise(function (res, rej) {
      window.HKZANG = function (b64) { res(b64); };
      var sc = document.createElement("script"); sc.src = "data/zang.js"; sc.onerror = function () { ZANG_PROMISE = null; rej(new Error("zang")); }; document.head.appendChild(sc);
    }).then(gunzipB64).then(function (d) { return (EDATA.zang = d); });
    return ZANG_PROMISE;
  }
  function posKey() { return EDITION === "zang" ? "hk-reading-position-zang-v154" : "hk-reading-position-v149"; }
  var CN = "〇一二三四五六七八九";
  function cn(n)''')

rep('function lab(i) { return N[i][5] + "、"; }', 'function lab(i) { return N[i][5] ? N[i][5] + "、" : ""; }')
rep('localStorage.setItem(\'hk-reading-position-v149\',JSON.stringify(b))', 'localStorage.setItem(posKey(),JSON.stringify(b))')
rep('JSON.parse(localStorage.getItem(\'hk-reading-position-v149\')||\'null\')', 'JSON.parse(localStorage.getItem(posKey())||\'null\')')

# move the data half of init() into setData()
a = s.index('    N = D.nodes; PAGES = D.pages; APPEAR = D.appear; OWN = D.own; TXT = D.text; JU = {};')
b = s.index('    var jh = ""; for (var k = 1; k <= 100; k++)')
body = s[a:b]
body = body.replace('for (var jj0 = 1; jj0 <= 100; jj0++) JU[jj0] = [(JL[jj0] || [0])[0], ""];',
  'CARRY = {}; var lastN = 0; for (var jj0 = 1; jj0 <= 100; jj0++) { if (JL[jj0]) { JU[jj0] = [JL[jj0][0], ""]; lastN = JL[jj0][JL[jj0].length - 1]; } else { JU[jj0] = [lastN, ""]; CARRY[jj0] = lastN; } }')
assert 'CARRY = {}' in body
s = s[:a] + '    setData(D);\n' + s[b:]
rep('  // ---------- init ----------\n  function init(D) {',
    '  // ---------- init ----------\n  var CARRY = {};\n  function setData(D) {\n    JL = {}; INS = {};\n' + body + '  }\n  function init(D) {')

# 卷 without new 科: show the carried-over path instead of an empty rail
rep('var list = JL[j] || [], out = [];', 'var carried = !JL[j] && CARRY[j] != null, list = JL[j] || (carried ? pathOf(CARRY[j]) : []), out = [];')
rep('''out.push('<div class="rsub">本卷 ' + list.length + " 科</div><div class=\\"rol\\">");''',
    '''out.push('<div class="rsub">' + (carried ? "本卷承接前卷科判" : "本卷 " + list.length + " 科") + "</div><div class=\\"rol\\">");''')

# verse / centred title blocks (藏經本)
rep('''      else if (ty === "r") { closeG(); tagKind = null; out.push('<p class="' + (k < fy ? "au" : "rq") + '">' + esc(v.trim()) + "</p>"); }''',
    '''      else if (ty === "v") { closeG(); tagKind = null; out.push('<p class="v" id="b' + k + '">' + vt(v) + "</p>"); }
      else if (ty === "n") { closeG(); tagKind = null; out.push('<div class="pin" id="b' + k + '">' + vt(v) + "</div>"); }
      else if (ty === "r") { closeG(); tagKind = null; out.push('<p class="' + (k < fy ? "au" : "rq") + '">' + esc(v.trim()) + "</p>"); }''')
rep('''var fy = t[1].findIndex(function (b) { return b[0] === "y"; }); if (fy < 0) fy = 1e9;
    t[1].forEach(function (b, k) {
      flush(k);
      var ty = b[0], v = b[1];
      if (ty === "k") { closeG();''', '''var fy = t[1].findIndex(function (b) { return /^[yvn]$/.test(b[0]); }); if (fy < 0) fy = 1e9;
    t[1].forEach(function (b, k) {
      flush(k);
      var ty = b[0], v = b[1];
      if (ty === "k") { closeG();''')
rep('''      else if (ty === "r") { tagKind = null; if (inc.text) items.push({ t: k < fy ? "au" : "rq", s: v.trim() }); }''',
    '''      else if (ty === "v") { tagKind = null; if (inc.text) items.push({ t: "v", s: v }); }
      else if (ty === "n") { tagKind = null; if (inc.text) items.push({ t: "pin", s: v }); }
      else if (ty === "r") { tagKind = null; if (inc.text) items.push({ t: k < fy ? "au" : "rq", s: v.trim() }); }''')
rep('''    var t = TXT[j - 1], items = [{ t: "jt", s: t[0] }], nb = {}, tagKind = null;''', '''    var t = TXT[j - 1], items = [{ t: "jt", s: t[0] }], nb = {}, tagKind = null, fy0 = t[1].findIndex(function (b) { return /^[yvn]$/.test(b[0]); });''')
rep('''    flush(t[1].length);

    return items;''', '''    flush(t[1].length);
    void fy0;
    return items;''')
rep('''TXT[j][1].forEach(function (b, k) { if (b[0] !== "y") return;''', '''TXT[j][1].forEach(function (b, k) { if (!/^[yvn]$/.test(b[0])) return;''')

# titles & file names follow the edition
rep('var DOC_TITLE = "瑜伽師地論（韓清淨科判）";', 'var DOC_TITLE = EDITION === "zang" ? "瑜伽師地論（藏經科判）" : "瑜伽師地論（韓清淨科判）";')
rep('var base = "瑜伽師地論_" + (a === b', 'var base = (EDITION === "zang" ? "瑜伽師地論藏經科判_" : "瑜伽師地論_") + (a === b')

# boot with the remembered edition
rep('''  unpack().then(function (D) {
    init(D);''', '''  loadEdition(EDITION).catch(function () { EDITION = "hk"; document.documentElement.dataset.edition = "hk"; return loadEdition("hk"); }).then(function (D) {
    init(D);setupEdition();''')

# edition switch (placed just before the boot call)
rep('''  function dictionaryTourExample(){''', r'''  function editionUI(){
    var zang=EDITION==='zang';document.documentElement.dataset.edition=EDITION;
    DOC_TITLE=zang?'瑜伽師地論（藏經科判）':'瑜伽師地論（韓清淨科判）';
    $('editionCur').textContent=zang?'藏經科判':'韓清淨科判';
    document.querySelectorAll('.edition-choice').forEach(function(b){b.setAttribute('aria-checked',String(b.dataset.edition===EDITION));});
    var src=$('about').querySelector('.src');if(src){if(!src.dataset.hk)src.dataset.hk=src.innerHTML;src.innerHTML=zang?'藏經科判：原文、分卷與科判依所附大藏經版本整理（唐玄奘譯，一百卷），本頁僅重新排版，排版、卷次目錄與直書科判沿用同一介面。<br><br>'+src.dataset.hk:src.dataset.hk;}
  }
  function switchEdition(ed){
    if(ed===EDITION)return Promise.resolve(false);
    var j=S.view==='v'?(PJ[S.vpage]||S.railJuan||1):(S.juan||1),msg=$('editionMsg');
    saveReadingPosition();if(msg)msg.textContent='正在載入'+(ed==='zang'?'藏經科判':'韓清淨科判')+'…';
    return loadEdition(ed).then(function(D){
      EDITION=ed;try{localStorage.setItem('hk-edition-v154',ed);}catch(e){}
      setData(D);
      if(ed==='zang'){OPT.px=false;OPT.cb=false;$('optPx').checked=false;$('optCb').checked=false;SOPT.p=false;SOPT.c=false;}
      $('optKp').checked=true;article.classList.remove('nokp');
      if(!$('optDict').checked){$('optDict').checked=true;$('optDict').onchange();}
      if(pio)pio.disconnect();pvis.clear();pBuilt=false;$('pzoom').innerHTML='';panelJuan=0;S.ppage=2;
      if(io)io.disconnect();vis.clear();
      S.cur=null;S.hl=null;linkedPage=null;ReaderUI.bookmark=null;$('upNav').hidden=true;
      streamGeneration++;streamBusy=false;if(streamObserver)streamObserver.disconnect();article.replaceChildren();
      S.railJuan=0;S.juan=0;editionUI();
      nav('#j'+j);window.scrollTo(0,0);
      if(msg)msg.textContent='';
      return true;
    }).catch(function(){if(msg)msg.textContent='版本資料無法載入，請確認 data／zang.js 存在或連網後再試。';return false;});
  }
  function setupEdition(){
    editionUI();
    document.querySelectorAll('.edition-choice').forEach(function(b){b.onclick=function(e){e.stopPropagation();switchEdition(b.dataset.edition).then(function(changed){if(changed)dismissMenu();});};});
  }
  function dictionaryTourExample(){''')

# ------------------------------------------------------------------ touch dictionary: selection → bottom chip → sheet
rep("function queueSelection(){clearTimeout(selectionTimer);if(mobileDictionary())return;",
    "function queueSelection(){clearTimeout(selectionTimer);if(mobileDictionary()){touchQueue();return;}")
rep('''    var lastTap=null,tapStart=null,lastLookup=0;''', r'''    // Touch: the native selection menu stays untouched. After the finger lifts,
    // a small chip appears at the bottom edge; tapping it opens the dictionary sheet.
    var chip=document.createElement('button');chip.type='button';chip.className='dict-chip';chip.hidden=true;chip.setAttribute('aria-label','查佛學辭典');
    chip.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4.5h10.5A2.5 2.5 0 0 1 18 7v12.5H7.5A2.5 2.5 0 0 1 5 17z"/><path d="M5 17a2.5 2.5 0 0 1 2.5-2.5H18"/></svg><span>查辭典</span><b></b>';
    document.body.appendChild(chip);var chipTerm='',chipRange=null,chipMatches=[];
    function hideChip(){if(!chip.hidden)Motion.close(chip,function(){chip.hidden=true;});}
    function touchQueue(){selectionTimer=setTimeout(function(){if(selectingNow()){touchQueue();return;}showChip();},420);}
    function showChip(){
      if(!enabled){hideChip();return;}
      var sel=getSelection();if(!sel||!sel.rangeCount||sel.isCollapsed){hideChip();return;}
      if(!article.contains(sel.anchorNode)||!article.contains(sel.focusNode)){hideChip();return;}
      var selected=sel.toString().replace(/\s+/g,'').trim();if(!selected){hideChip();return;}
      chipMatches=knownTerms.filter(function(t){return selected.includes(t);});
      chipTerm=selected.length<=12?selected:(chipMatches[0]||'');if(!chipTerm){hideChip();return;}
      chipRange=sel.getRangeAt(0).cloneRange();chip.querySelector('b').textContent=chipTerm;
      if(chip.hidden){chip.hidden=false;Motion.open(chip);}
    }
    chip.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();});
    chip.addEventListener('touchstart',function(e){e.stopPropagation();},{passive:true});
    chip.addEventListener('click',function(e){
      e.preventDefault();e.stopPropagation();if(!chipTerm||!chipRange)return;
      var term=chipTerm,range=chipRange,matches=chipMatches;chip.hidden=true;
      try{getSelection().removeAllRanges();}catch(er){}
      dismissedSelection='';showPreview(term,range);
      var choices=$('termChoices');choices.replaceChildren();matches.filter(function(t,i,all){return t!==term&&!all.slice(0,i).some(function(longer){return longer.includes(t);});}).slice(0,12).forEach(function(t){var b=document.createElement('button');b.textContent=t;b.onclick=function(){if(activeRange)showPreview(t,activeRange.cloneRange());};choices.appendChild(b);});
      requestAnimationFrame(placePreview);
    });
    var lastTap=null,tapStart=null,lastLookup=0;''')
# double tap word lookup on touch is retired (native double tap selects the word instead)
rep('''if(lastTap&&now-lastTap.time<350&&Math.hypot(t.clientX-lastTap.x,t.clientY-lastTap.y)<20){e.preventDefault();lastTap=null;wordAt(t.clientX,t.clientY);}else lastTap={x:t.clientX,y:t.clientY,time:now};},{passive:false});''',
    '''lastTap={x:t.clientX,y:t.clientY,time:now};},{passive:true});''')
rep('''article.addEventListener('dblclick',function(e){if(mobileDictionary()&&!e.target.closest('.kh')){e.preventDefault();wordAt(e.clientX,e.clientY);}});''',
    '''void wordAt;''')
rep('''document.addEventListener('selectionchange',function(){if(mobileDictionary()&&selectingNow()){if(!pop.hidden)hidePreview();dismissedSelection='';}queueSelection();});''',
    '''document.addEventListener('selectionchange',function(){if(mobileDictionary()){var sl=getSelection();if(!sl||sl.isCollapsed){clearTimeout(selectionTimer);hideChip();return;}if(selectingNow()){hideChip();if(!pop.hidden)hidePreview();}}queueSelection();});''')
rep('''document.addEventListener('pointerdown',function(e){if(pop.contains(e.target))return;if(mobileDictionary()){releasePending=true;''',
    '''document.addEventListener('pointerdown',function(e){if(pop.contains(e.target)||chip.contains(e.target))return;if(mobileDictionary()){releasePending=true;''')
rep('''document.addEventListener('touchstart',function(e){if(!mobileDictionary()||pop.contains(e.target))return;''',
    '''document.addEventListener('touchstart',function(e){if(!mobileDictionary()||pop.contains(e.target)||chip.contains(e.target))return;''')
rep('''document.addEventListener('pointerdown',function(e){if(!pop.hidden && !pop.contains(e.target)){hidePreview();''',
    '''document.addEventListener('pointerdown',function(e){if(!pop.hidden && !pop.contains(e.target)&&!chip.contains(e.target)){hidePreview();''')
rep('''window.addEventListener('scroll',function(){var selected=getSelection();if(selected&&!selected.isCollapsed)queuePreview();else hidePreview();},{passive:true});''',
    '''window.addEventListener('scroll',function(){if(mobileDictionary()){if(!pop.hidden)queuePreview();return;}var selected=getSelection();if(selected&&!selected.isCollapsed)queuePreview();else hidePreview();},{passive:true});''')
rep('''$('optDict').onchange=function(){enabled=this.checked;''', '''$('optDict').onchange=function(){enabled=this.checked;hideChip();''')
# sheet placement on touch devices
rep('''function placePreview(){if(pop.hidden||!activeRange)return;''',
    '''function placePreview(){if(pop.hidden||!activeRange)return;if(mobileDictionary()){var vb=viewportBox(),bb=overlayBounds(),sw=Math.min(560,vb.width-16);pop.style.setProperty('--dict-width',sw+'px');pop.style.setProperty('--dict-maxheight',Math.max(160,Math.min(vb.height*.62,bb.bottom-bb.top-8))+'px');pop.style.setProperty('--dict-left',(vb.left+(vb.width-sw)/2)+'px');pop.style.setProperty('--dict-top',Math.max(bb.top,bb.bottom-pop.offsetHeight)+'px');return;}''')

# ------------------------------------------------------------------ chart: fit width at 100%
rep('''      var pv=$('pview'),w=Math.max(40,pv.clientWidth-16)*(Z?Z.p*FT.s:1);''',
    '''      var pv=$('pview'),w=Math.max(40,pv.clientWidth-16)*(Z?Z.p*FT.s:1);pv.classList.toggle('fit-x',!Z||Z.p*FT.s<=1);''')
rep('''    var any = $("pzoom").querySelector(".ksheet");
    if (any && any.clientWidth) $("pview").style.setProperty("--pks", any.clientWidth / (210 * 96 / 25.4));''',
    '''    var any = $("pzoom").querySelector(".ksheet");$("pview").classList.toggle("fit-x", !Z || Z.p * FT.s <= 1);
    if (any && any.clientWidth) $("pview").style.setProperty("--pks", any.clientWidth / (210 * 96 / 25.4));''')
# fitP is called before Z exists on first load; guard
rep('''  function fitP() {
    if(phoneMode()){''', '''  function fitP() {
    if (typeof Z === "undefined") return;
    if(phoneMode()){''')

# ------------------------------------------------------------------ scrolling: floating panes only follow scroll when open
rep("window.addEventListener('scroll',queueFloating,{passive:true});",
    "window.addEventListener('scroll',function(){if($('menu').classList.contains('open')||!$('q').hidden)queueFloating();},{passive:true});")

# ------------------------------------------------------------------ phone 卷目次 expand button
rep('''$('jFold').onclick=function(e){if(!phoneMode()){originalFold.call(this,e);return;}''',
    '''$('jFold').onclick=function(e){if(!phoneMode()){originalFold.call(this,e);return;}e.stopPropagation();''')

# ------------------------------------------------------------------ version
rep('<b id="appVer">v1.53</b>', '<b id="appVer">v1.54</b>')
rep('''<div id="versionHistory"><button class="version-row" data-version="1.53">''', '''<div id="versionHistory"><button class="version-row" data-version="1.54"><span>v1.54</span><span>›</span></button><button class="version-row" data-version="1.53">''')
rep('''var versionSummaries={"1.27":''', '''var versionSummaries={"1.54":"新增「版本」：可在韓清淨科判與藏經科判之間切換，排版、卷次目錄與直書科判沿用同一介面；手機／平板改為反白後由底部「查辭典」開啟辭典，不再與系統選取選單重疊；科判 100% 時不左右滑動；字體大小改為七段、預設置中，行距改用示意圖；匯出面板加寬重排；側欄圖示更新；手機底部導覽置中；行動版科判標題改為換行，捲動更順，只在換卷時保留輕微吸附。","1.53":"還原原有白底與字色；三欄預設 100%，10% 級距；正文跨卷連續閱讀；手機與平板雙擊查詞；精簡功能面板。","1.27":''')
rep("$('appVer').onclick=function(){versionPage('1.53','about');};", "$('appVer').onclick=function(){versionPage('1.54','about');};")
rep("e.preventDefault();versionPage('1.53','about');}};", "e.preventDefault();versionPage('1.54','about');}};")

# ------------------------------------------------------------------ CSS (last in cascade)
CSS = open(__file__.replace('patch154.py', 'v154.css'), encoding='utf-8').read()
k = s.rindex('</body></html>'); s = s[:k] + '<style id="v154">' + CSS + '</style>\n' + s[k:]
open(DST, 'w', encoding='utf-8').write(s)
print('ok', len(s))
