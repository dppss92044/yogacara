// 驗證腳本：針對 kuangmi/ 目前版本。用法：node tools/verify.cjs <網址或 file://路徑>
const { chromium } = require('playwright');
(async () => {
  const url = process.argv[2];
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(()=>chromium.launch());
  const out = []; const svgClick = async (p,s)=>{ await p.click('#home'); await p.waitForTimeout(500); await p.click(s); }; const ok = (n, c, x='') => { out.push((c?'PASS':'FAIL')+' '+n+(x?' '+x:'')); };
  for (const [name, vp] of [['desktop',{width:1366,height:850}],['mobile',{width:390,height:800}]]) {
    const p = await b.newPage({ viewport: vp, hasTouch: name==='mobile' });
    const errs=[]; p.on('pageerror', e=>errs.push(String(e)));
    await p.goto(url); await p.waitForSelector('.bead');
    if (name==='desktop') {
      const r = await p.evaluate(()=>{
        const beads=[...document.querySelectorAll('.bead')];
        const sp=beads.filter(e=>e.classList.contains('spacer')).map(e=>+e.dataset.n);
        const nums=beads.map(e=>+e.dataset.n);
        const perZone=[0,1,2,3].map(z=>beads.filter(e=>!e.classList.contains('spacer')&&Math.floor((+e.dataset.n-1)/27)===z).length);
        const pos=beads.map(e=>{const t=e.querySelector('g').getAttribute('transform').match(/translate\(([\d.]+) ([\d.]+)\)/);return [+t[1],+t[2]]});
        let minD=1e9; for(let i=0;i<pos.length;i++){const j=(i+1)%pos.length;minD=Math.min(minD,Math.hypot(pos[i][0]-pos[j][0],pos[i][1]-pos[j][1]));}
        return {total:beads.length,uniq:new Set(nums).size,sp,perZone,plain:beads.filter(e=>!e.classList.contains('spacer')).length,heads:document.querySelectorAll('.part[data-act="part:head"]').length,minD,
          quote:document.querySelector('#quote').textContent, assigned:beads.filter(e=>!e.classList.contains('empty')&&!e.classList.contains('spacer')).map(e=>+e.dataset.n),
          chapters:document.querySelectorAll('#pane-toc > ul.toc:first-of-type > li').length, headY:document.querySelector('[data-act="part:head"] circle').getAttribute('cy'), spTop:pos[107][1]};
      });
      ok('環上108顆且編號不重複', r.total===108&&r.uniq===108);
      ok('普通數珠104、隔珠4', r.plain===104&&r.sp.length===4);
      ok('隔珠位置27/54/81/108', JSON.stringify(r.sp)==='[27,54,81,108]');
      ok('每區普通珠26', JSON.stringify(r.perZone)==='[26,26,26,26]');
      ok('佛頭珠1顆且在第108顆上方', r.heads===1 && +r.headY < r.spTop);
      ok('相鄰珠心距足夠(不重疊)', r.minD>16, r.minD.toFixed(1));
      ok('17章入口', r.chapters===17, r.chapters);
      const q='以數珠為喻：西藏密宗乃是以種種虛構之觀想法、持外道咒、天瑜伽、遷識⋯等外道法為數珠，以風瑜伽為隔珠，以佛教教相及僧寶表相為佛頭珠；以自己所定義之般若中觀名相及果位修證名相，作為佛頭珠所懸之飾穗，最後以淫樂之樂空雙運欲界外道雙身法為串繩，貫串密宗之一切成佛理論與行門。如是串成之數珠，即是西藏密教之真實宗義。－－平實導師－－';
      ok('首頁引文逐字一致', r.quote===q);
      // 左右切換跳過空位
      await svgClick(p,'[data-n="1"]'); 
      const seq=[]; for(let i=0;i<10;i++){ await p.click('#next'); seq.push(await p.evaluate(()=>+location.hash.split('-')[1])); }
      ok('下一個只在已配置珠位', seq.every(n=>r.assigned.includes(n)), seq.join(','));
      ok('跨區跳過待配置(8→28)', await (async()=>{await svgClick(p,'[data-n="8"]');await p.click('#next');return (await p.evaluate(()=>location.hash))==='#bead-28';})());
      await p.click('#prev'); ok('上一個', (await p.evaluate(()=>location.hash))==='#bead-8');
      // 隔珠
      await svgClick(p,'.lab[data-act="spacer:1"]'); ok('點隔珠文字', (await p.textContent('#pane-content')).includes('風瑜伽'));
      await svgClick(p,'[data-n="108"]'); ok('點第四隔珠', (await p.textContent('#pane-content')).includes('隔珠四'));
      await svgClick(p,'[data-act="part:head"] circle'); ok('佛頭珠說明', (await p.textContent('#pane-content')).includes('以佛教教相及僧寶表相為佛頭珠'));
      await svgClick(p,'[data-act="part:tassel"] circle'); ok('飾穗說明', (await p.textContent('#pane-content')).includes('所懸之飾穗'));
      await p.click('.hit[rx]',{force:true,position:{x:5,y:5}}).catch(()=>{});
      await p.evaluate(()=>document.querySelector('[data-act="part:string"]').dispatchEvent(new MouseEvent('click',{bubbles:true})));
      ok('串繩說明', (await p.textContent('#pane-content')).includes('樂空雙運欲界外道雙身法為串繩'));
      await svgClick(p,'.lab[data-act="part:bead"]'); ok('普通數珠說明', (await p.textContent('#pane-content')).includes('天瑜伽、遷識'));
      // 目次同步
      await p.click('#tab-toc'); await p.click('[data-go="chapter:c07"]');
      const hl = await p.evaluate(()=>document.querySelectorAll('.bead.hl').length);
      ok('目次→念珠高亮(第7章=見區8顆)', hl===8, hl);
      ok('第7章跨輯上下半', (await p.textContent('#pane-content')).includes('上半')&&(await p.textContent('#pane-content')).includes('下半'));
      await p.click('#tab-toc'); await p.click('[data-go="chapter:c15"]'); ok('第15章無配置仍可進入', (await p.textContent('#pane-content')).includes('尚未配置'));
      await p.selectOption('#chsel','chapter:c12'); ok('章節快速選取', (await p.textContent('#pane-content')).includes('神通'));
      await p.click('#home'); ok('返回總覽', (await p.getAttribute('#mala','viewBox')).startsWith('0.0 0.0 1100'));
      await p.click('#motion'); ok('暫停動態', await p.evaluate(()=>getComputedStyle(document.querySelector('#halo')).animationName==='none'));
      await p.screenshot({path:process.argv[3]+'/desktop-overview.png'});
      await svgClick(p,'.lab[data-act="zone:0"]'); await p.waitForTimeout(700); await p.screenshot({path:process.argv[3]+'/desktop-zone.png'});
      await svgClick(p,'[data-n="3"]'); await p.waitForTimeout(700); await p.screenshot({path:process.argv[3]+'/desktop-bead.png'});
    } else {
      await p.waitForTimeout(300);
      const sw = await p.evaluate(()=>document.documentElement.scrollWidth);
      ok('手機無橫向捲動', sw<=392, sw);
      await svgClick(p,'.lab[data-act="spacer:2"]'); await p.waitForTimeout(600);
      ok('手機點隔珠面板更新', (await p.textContent('#pane-content')).includes('隔珠三'));
      await p.screenshot({path:process.argv[3]+'/mobile.png'});
    }
    ok(name+' 無JS錯誤', errs.length===0, errs.join('|'));
    await p.close();
  }
  console.log(out.join('\n')); await b.close();
})();
