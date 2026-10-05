(function(){
  var $=function(i){return document.getElementById(i);};
  // ---- 頁碼：膠囊 + 0–9 數字鍵 ----
  function setupPager(){
    var n=$('pNum'),pj=document.querySelector('.page-jump'),btn=$('pageJump');
    if(!n||!pj||!btn){setTimeout(setupPager,300);return;}
    if($('pKeypad'))return;
    var tot=document.createElement('span');tot.className='pj-tot';tot.hidden=true;n.insertAdjacentElement('afterend',tot);
    var kp=document.createElement('div');kp.id='pKeypad';kp.hidden=true;kp.setAttribute('role','group');kp.setAttribute('aria-label','頁碼數字鍵');
    var keys=['1','2','3','4','5','6','7','8','9','del','0','go'];
    kp.innerHTML=keys.map(function(k){return k==='del'?'<button type="button" class="del" data-k="del" aria-label="刪除">⌫</button>':k==='go'?'<button type="button" class="go" data-k="go" aria-label="前往">前往</button>':'<button type="button" data-k="'+k+'">'+k+'</button>';}).join('');
    pj.appendChild(kp);
    function size(){n.style.setProperty('--page-ch',Math.max(1,String(n.value).length)+'ch');}
    function go(){var v=parseInt(n.value,10),mx=parseInt(n.max,10)||999;if(!v)v=2;v=Math.max(2,Math.min(mx,v));n.value=v;n.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));}
    n.addEventListener('focus',function(){n.inputMode=matchMedia('(hover:none)').matches?'none':'numeric';tot.textContent='/'+(($('pageTotal')||{}).textContent||'');tot.hidden=false;kp.hidden=false;size();});
    n.addEventListener('blur',function(){tot.hidden=true;kp.hidden=true;});
    n.addEventListener('input',function(){var v=n.value.replace(/\D/g,'').slice(0,3);if(v!==n.value)n.value=v;size();});
    kp.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();});
    kp.addEventListener('mousedown',function(e){e.preventDefault();});
    kp.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;e.stopPropagation();var k=b.dataset.k,v=n.value,s=n.selectionStart,t=n.selectionEnd;if(s==null){s=t=v.length;}
      if(k==='go'){go();return;}
      if(k==='del'){if(s===t&&s>0)s--;n.value=v.slice(0,s)+v.slice(t);n.setSelectionRange(s,s);}
      else{if(v.length-(t-s)>=3)return;n.value=v.slice(0,s)+k+v.slice(t);n.setSelectionRange(s+1,s+1);}
      size();n.focus();});
  }
  // ---- 回上方：底色跟隨科判欄 ----
  setInterval(function(){var p=$('panel');if(p)document.documentElement.style.setProperty('--ct-bg',getComputedStyle(p).backgroundColor);},800);
  // ---- 滑鼠停留兩秒：小說明框 ----
  var TIPS=[
    ['#menuBtn','功能列表：版本、內文、介面、字體、匯出等'],['#swapPanes','左右置換內文與科判表'],
    ['#editionBtn','切換大藏經版／韓清淨科判'],['.edition-choice[data-edition=zang]','大藏經原文與藏經科判表'],['.edition-choice[data-edition=hk]','韓清淨科判、披尋記與法師註解'],
    ['#labelBtn','科標顯示干支或章節'],['#contentBtn','選擇正文要顯示的科判、披尋記、法師釋、辭典'],['#detailedTourBtn','一步一步介紹各項功能'],
    ['.learning-settings summary','選擇電腦、平板或手機介面'],['#ftBtn','調整字體、大小、行距與科判顏色'],['#dlBtn','選卷次與格式，下載檔案'],['#aboutBtn','版本紀錄、資料來源與問題回報'],
    ['#versionHistoryBtn','查看每一版的更新內容'],['#chartColorReset','科判標題顏色回到預設'],['#fsReset',''],
    ['#pageJump','目前頁／總頁數；點一下輸入頁碼跳頁'],['#pNum',''],['#pKeypad',''],['#chartTop','按一下回本卷頂端；按兩下回第一卷'],
    ['#searchButton','搜尋全文'],['#railOpen','打開卷目次欄'],['#railClose','收起卷目次欄'],['#panelOpen','打開科判欄'],['#panelClose','收起科判欄'],['#panelPin','釘選／取消釘選科判欄'],['#railPin','釘選／取消釘選卷目次欄'],
    ['#jFold','展開或收起一百卷清單'],['#edBadge','點一下切換大藏經版／韓版'],['.zc [data-zd="-1"]','縮小'],['.zc [data-zd="1"]','放大'],['.zc .zv','回到 100%'],
    ['.sw.kp','正文科判：亮燈顯示，熄燈隱藏'],['.sw.px','披尋記：亮燈顯示，熄燈隱藏'],['.sw.cb','常柏法師釋：亮燈顯示，熄燈隱藏'],['.sw.dict','辭典：亮燈後反白查詞']
  ];
  var SKIP='#juans a,#rv .rol a,.kn,.nd,#article,.pview,.reader-hint,.hovtip,input[type=range]';
  var CAND='button,a[href],summary,select,label,.mi,[role=menuitem],[role=radio],.sw,.lab-badge,#edBadge';
  var tip=document.createElement('div');tip.className='hovtip';tip.hidden=true;tip.setAttribute('role','tooltip');
  var tmr=0,cur=null;
  function textFor(el){for(var i=0;i<TIPS.length;i++){var m=el.closest(TIPS[i][0]);if(m&&(m===el||el.contains(m)||m.contains(el)))return TIPS[i][1];}
    if(el.title){el.dataset.tip=el.title;el.removeAttribute('title');}
    return el.dataset.tip||el.getAttribute('aria-label')||'';}
  function hide(){clearTimeout(tmr);tmr=0;cur=null;tip.classList.remove('on');tip.hidden=true;}
  function show(el,txt){if(!el.isConnected||!cur)return;var h=document.querySelector('.reader-hint:not([hidden])');if(h)return;if(document.getElementById('tour'))return;
    if(!tip.isConnected)document.body.appendChild(tip);tip.textContent=txt;tip.hidden=false;var r=el.getBoundingClientRect(),w=tip.offsetWidth,ht=tip.offsetHeight;
    var x=Math.max(8,Math.min(innerWidth-w-8,r.left+r.width/2-w/2)),y=r.bottom+8;if(y+ht>innerHeight-8)y=r.top-ht-8;tip.style.left=x+'px';tip.style.top=Math.max(8,y)+'px';requestAnimationFrame(function(){tip.classList.add('on');});}
  document.addEventListener('mouseover',function(e){if(!matchMedia('(hover:hover)').matches)return;var t=e.target;if(!t.closest)return;
    var el=t.closest(CAND);if(el&&el.closest(SKIP)&&!el.closest('#pageJump'))el=null;
    if(el&&el.matches('label')&&!el.closest('.menu,.mpop'))el=null;
    if(el===cur)return;hide();if(!el)return;
    // 先清掉原生 title（避免兩個說明框）
    var txt=textFor(el);el.querySelectorAll('[title]').forEach(function(x){x.dataset.tip=x.title;x.removeAttribute('title');});
    if(!txt)return;cur=el;tmr=setTimeout(function(){show(el,txt);},2000);},true);
  document.addEventListener('mouseout',function(e){if(cur&&!(e.relatedTarget&&cur.contains(e.relatedTarget))&&cur.contains(e.target))hide();},true);
  ['pointerdown','keydown','wheel'].forEach(function(ev){document.addEventListener(ev,hide,{capture:true,passive:true});});
  window.addEventListener('scroll',hide,{capture:true,passive:true});window.addEventListener('blur',hide);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setupPager);else setupPager();
})();
