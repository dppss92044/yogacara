# v1.57: 點卷號會跳到前一卷的修正
import sys
SRC, DST = sys.argv[1], sys.argv[2]
s = open(SRC, encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    c = s.count(old)
    if c != n: raise SystemExit('count %d: %r' % (c, old[:90]))
    s = s.replace(old, new)
# 1) 跳卷後，在版面穩定前持續把新卷卷首放在頂端（手機／平板的正文分頁剛切回來時才有版面）
rep('''} else { var section=document.getElementById("volume-"+j);if(section)section.scrollIntoView({block:"start"});main.scrollLeft = 0; }''',
    '''} else { main.scrollLeft = 0; pinJump(j); }''')
rep('''  // keep a jumped-to element in plain sight''', '''  // 跳到某一卷：前一卷可能稍後才插入上方，或正文分頁稍後才顯示；這段時間內固定在新卷卷首。
  var jumpUntil = 0, jumpJuan = 0, jumpGen = 0;
  function pinJump(j) {
    var gen = ++jumpGen; jumpJuan = j; jumpUntil = Date.now() + 1600;
    function stop() { if (gen === jumpGen) jumpUntil = 0; }
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach(function (ev) { window.addEventListener(ev, stop, { once: true, passive: true, capture: true }); });
    function fix() {
      if (gen !== jumpGen || Date.now() > jumpUntil || S.view !== "t") return;
      var sec = document.getElementById("volume-" + j); if (!sec || !sec.getClientRects().length) return;
      var band = document.querySelector(".zbar"), line = band ? Math.max(0, band.getBoundingClientRect().bottom) : 0, d = sec.getBoundingClientRect().top - line - 8;
      if (Math.abs(d) > 2) window.scrollBy(0, d);
      if (S.juan !== j) { S.juan = j; try { history.replaceState(null, "", "#j" + j); } catch (e) {} if (S.railJuan !== j) renderRail(j); }
    }
    fix(); requestAnimationFrame(fix); [60, 180, 400, 800, 1300].forEach(function (t) { setTimeout(fix, t); });
    setTimeout(function () { if (gen === jumpGen) { jumpUntil = 0; trackStream(); } }, 1650);
  }
  // keep a jumped-to element in plain sight''')
# 2) 跳卷期間不插入前一卷、不改目前卷；之後往上捲到卷首附近才補前一卷
rep('''if(entry.target.dataset.edge==='start'&&j>1&&!document.getElementById('volume-'+(j-1)))addVolume(j-1,true);''',
    '''if(entry.target.dataset.edge==='start'&&j>1&&Date.now()>jumpUntil&&!document.getElementById('volume-'+(j-1)))addVolume(j-1,true);''')
rep('''function trackStream(){if(S.view!=='t'||ReaderUI.single&&ReaderUI.screen!=='read'||!main.getClientRects().length)return;var sections=article.querySelectorAll('.reading-volume');if(!sections.length)return;''',
    '''function trackStream(){if(S.view!=='t'||ReaderUI.single&&ReaderUI.screen!=='read'||!main.getClientRects().length||Date.now()<jumpUntil)return;var sections=article.querySelectorAll('.reading-volume');if(!sections.length)return;var firstSec=sections[0],fj=+firstSec.dataset.juan;if(fj>1&&!streamBusy&&firstSec.getBoundingClientRect().top>-1200)addVolume(fj-1,true);''')
# 3) 前一卷插入後的位置補償，改用插入前仍在畫面上的那一卷為基準
rep('''var first=article.querySelector('.reading-volume'),top=first?first.getBoundingClientRect().top:0,el=createVolume(j);''',
    '''var first=article.querySelector('.reading-volume'),top=first&&first.getClientRects().length?first.getBoundingClientRect().top:null,el=createVolume(j);if(prepend&&top===null){streamBusy=false;return;}''')
# version
rep('<b id="appVer">v1.56</b>', '<b id="appVer">v1.57</b>')
rep('<div id="versionHistory"><button class="version-row" data-version="1.56">', '<div id="versionHistory"><button class="version-row" data-version="1.57"><span>v1.57</span><span>›</span></button><button class="version-row" data-version="1.56">')
rep('var versionSummaries={"1.56":', 'var versionSummaries={"1.57":"修正點卷目次的卷號時，有時會停在前一卷：跳卷後先固定在新卷卷首，等版面穩定才補上前一卷；手機與平板從卷次分頁切回正文時也正確。","1.56":')
rep("versionPage('1.56','about');};", "versionPage('1.57','about');};")
rep("versionPage('1.56','about');}};", "versionPage('1.57','about');}};")
open(DST, 'w', encoding='utf-8').write(s)
print('ok')
