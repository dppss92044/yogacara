// 驗證腳本：針對 kuangmi/ 全息星海版寫的 Playwright 測試。
// 用法：NODE_PATH=$(npm root -g) node tools/verify.cjs <網址或 file://路徑> <截圖資料夾>
const { chromium } = require('playwright');
(async () => {
  const url = process.argv[2], shots = process.argv[3];
  const b = await chromium.launch();
  const out = []; const ok = (n, c, x = '') => out.push((c ? 'PASS' : 'FAIL') + ' ' + n + (x !== '' ? ' ' + x : ''));
  const home = async p => { await p.click('#home'); await p.waitForTimeout(2200); };
  const svgClick = async (p, s) => { await home(p); await p.click(s); await p.waitForTimeout(2200); };
  const beadPos = n => `(()=>{const e=document.querySelector('.bead[data-n="${n}"]');const m=e.getAttribute('transform').match(/translate\\(([-\\d.]+) ([-\\d.]+)\\)/);const s=+e.querySelector('.bb').getAttribute('transform').match(/scale\\(([\\d.]+)\\)/)[1];return {x:+m[1],y:+m[2],r:s*(e.classList.contains('spacer')?13:10)}})()`;
  for (const [name, vp] of [['desktop', { width: 1366, height: 850 }], ['mobile', { width: 390, height: 800 }]]) {
    const p = await b.newPage({ viewport: vp, hasTouch: name === 'mobile' });
    const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto(url); await p.waitForSelector('.bead');
    await p.click('#motion'); await p.waitForTimeout(400);
    if (name === 'desktop') {
      const r = await p.evaluate(() => {
        const beads = [...document.querySelectorAll('.bead')];
        const nums = beads.map(e => +e.dataset.n);
        const get = e => { const m = e.getAttribute('transform').match(/translate\(([-\d.]+) ([-\d.]+)\)/); const s = +e.querySelector('.bb').getAttribute('transform').match(/scale\(([\d.]+)\)/)[1]; return { x: +m[1], y: +m[2], r: s * (e.classList.contains('spacer') ? 13 : 10) }; };
        const P = beads.map(get);
        let minGap = 1e9; for (let i = 0; i < P.length; i++) { const j = (i + 1) % P.length; minGap = Math.min(minGap, Math.hypot(P[i].x - P[j].x, P[i].y - P[j].y) - P[i].r - P[j].r); }
        const hm = document.getElementById('headg').getAttribute('transform').match(/translate\(([-\d.]+) ([-\d.]+)\)/);
        return {
          total: beads.length, uniq: new Set(nums).size,
          sp: beads.filter(e => e.classList.contains('spacer')).map(e => +e.dataset.n),
          perZone: [0, 1, 2, 3].map(z => beads.filter(e => !e.classList.contains('spacer') && Math.floor((+e.dataset.n - 1) / 27) === z).length),
          plain: beads.filter(e => !e.classList.contains('spacer')).length,
          heads: document.querySelectorAll('#headg .part[data-act="part:head"]').length, minGap,
          headAbove: +hm[2] < P[107].y && Math.abs(+hm[1] - P[107].x) < 40,
          quote: document.querySelector('#quote').textContent,
          assigned: beads.filter(e => !e.classList.contains('empty') && !e.classList.contains('spacer')).map(e => +e.dataset.n),
          chapters: document.querySelectorAll('#pane-toc > ul.toc:first-of-type > li').length,
          strings: document.querySelectorAll('#str').length, galaxy: !!document.querySelector('canvas#galaxy')
        };
      });
      ok('環上108顆且編號不重複', r.total === 108 && r.uniq === 108);
      ok('普通數珠104、隔珠4', r.plain === 104 && r.sp.length === 4);
      ok('隔珠位置27/54/81/108', JSON.stringify(r.sp) === '[27,54,81,108]');
      ok('每區普通珠26', JSON.stringify(r.perZone) === '[26,26,26,26]');
      ok('佛頭珠1顆，在第108顆上方', r.heads === 1 && r.headAbove);
      ok('相鄰珠不重疊(邊緣間隙>0)', r.minGap > 0, r.minGap.toFixed(2));
      ok('單一連續串繩橢圓＋星系畫布', r.strings === 1 && r.galaxy);
      ok('17章入口', r.chapters === 17, r.chapters);
      const q = '以數珠為喻：西藏密宗乃是以種種虛構之觀想法、持外道咒、天瑜伽、遷識⋯等外道法為數珠，以風瑜伽為隔珠，以佛教教相及僧寶表相為佛頭珠；以自己所定義之般若中觀名相及果位修證名相，作為佛頭珠所懸之飾穗，最後以淫樂之樂空雙運欲界外道雙身法為串繩，貫串密宗之一切成佛理論與行門。如是串成之數珠，即是西藏密教之真實宗義。－－平實導師－－';
      ok('首頁引文逐字一致', r.quote === q);
      await p.screenshot({ path: shots + '/desktop-overview.png' });
      // 點珠 → 珠子轉到畫面中央
      await svgClick(p, '.bead[data-n="5"]');
      const c5 = await p.evaluate(beadPos(5)); const box = await p.evaluate(() => { const s = document.getElementById('stage'); return { w: s.clientWidth, h: s.clientHeight }; });
      const cxm = (box.w - 420) / 2 + 8;
      ok('點第5珠後該珠停在畫面中央', Math.abs(c5.x - cxm) < 3 && Math.abs(c5.y - box.h * 0.5) < 3, JSON.stringify([c5.x.toFixed(0), c5.y.toFixed(0), cxm.toFixed(0), box.h / 2]));
      ok('點珠後放大特寫', c5.r > 15, c5.r.toFixed(1));
      ok('面板顯示名相', (await p.textContent('#pane-content')).includes('般若中觀') || (await p.textContent('#pane-content')).includes('實相'));
      ok('章名引線標籤出現', await p.evaluate(() => document.querySelectorAll('#chfan .chlab').length) === 3);
      await p.screenshot({ path: shots + '/desktop-bead.png' });
      await p.click('#lines'); ok('引線可關閉', await p.evaluate(() => getComputedStyle(document.querySelector('#chfan .leader')).display === 'none'));
      await p.click('#lines');
      // 左右切換
      await p.click('.bead[data-n="1"]', { force: true }).catch(() => {});
      await svgClick(p, '.bead[data-n="1"]');
      const seq = []; for (let i = 0; i < 10; i++) { await p.click('#next'); seq.push(await p.evaluate(() => +location.hash.split('-')[1])); }
      ok('下一個只在已配置珠位', seq.every(n => r.assigned.includes(n)), seq.join(','));
      await svgClick(p, '.bead[data-n="8"]'); await p.click('#next');
      ok('跨區跳過待配置(8→28)', (await p.evaluate(() => location.hash)) === '#bead-28');
      await p.click('#prev'); ok('上一個', (await p.evaluate(() => location.hash)) === '#bead-8');
      // 隔珠、部件
      await svgClick(p, '.lab[data-act="spacer:1"]'); ok('點隔珠文字', (await p.textContent('#pane-content')).includes('風瑜伽'));
      await svgClick(p, '.bead[data-n="108"]'); ok('點第四隔珠', (await p.textContent('#pane-content')).includes('隔珠四'));
      await p.screenshot({ path: shots + '/desktop-spacer.png' });
      await svgClick(p, '#headg .part[data-act="part:head"] circle'); ok('佛頭珠說明', (await p.textContent('#pane-content')).includes('以佛教教相及僧寶表相為佛頭珠'));
      await p.screenshot({ path: shots + '/desktop-head.png' });
      await home(p); await p.click('#headg .part[data-act="part:tassel"] circle', { force: true }); ok('飾穗說明', (await p.textContent('#pane-content')).includes('所懸之飾穗'));
      await home(p); await p.evaluate(() => document.querySelector('#strpart').dispatchEvent(new MouseEvent('click', { bubbles: true })));
      ok('串繩說明', (await p.textContent('#pane-content')).includes('樂空雙運欲界外道雙身法為串繩'));
      await svgClick(p, '.lab[data-act="part:bead"]'); ok('普通數珠說明', (await p.textContent('#pane-content')).includes('天瑜伽、遷識'));
      // 目次
      await p.click('#tab-toc'); await p.click('[data-go="chapter:c07"]'); await p.waitForTimeout(2200);
      const hl = await p.evaluate(() => document.querySelectorAll('.bead.hl').length);
      ok('目次→念珠高亮(第7章=見區8顆)', hl === 8, hl);
      ok('第7章跨輯上下半', (await p.textContent('#pane-content')).includes('上半') && (await p.textContent('#pane-content')).includes('下半'));
      await p.click('#tab-toc'); await p.click('[data-go="chapter:c15"]'); ok('第15章無配置仍可進入', (await p.textContent('#pane-content')).includes('尚未配置'));
      await p.selectOption('#chsel', 'chapter:c12'); ok('章節快速選取', (await p.textContent('#pane-content')).includes('神通'));
      await p.click('#home'); await p.waitForTimeout(2200);
      ok('返回總覽(取消放大)', await p.evaluate(() => !document.getElementById('mala').classList.contains('zoomed')));
      await svgClick(p, '.lab[data-act="zone:0"]'); await p.screenshot({ path: shots + '/desktop-zone.png' });
      // 動態：未暫停時念珠自行緩慢擺動
      await home(p); await p.click('#motion'); // 恢復動態
      const a = await p.evaluate(beadPos(10)); await p.waitForTimeout(3500); const a2 = await p.evaluate(beadPos(10));
      ok('動態開啟時念珠緩慢擺動', Math.hypot(a.x - a2.x, a.y - a2.y) > 0.5, Math.hypot(a.x - a2.x, a.y - a2.y).toFixed(2));
      await p.click("#motion"); await p.waitForTimeout(2000);
      const c1 = await p.evaluate(beadPos(10)); await p.waitForTimeout(1000); const c2 = await p.evaluate(beadPos(10));
      ok('暫停動態後靜止', Math.hypot(c1.x - c2.x, c1.y - c2.y) < 0.05);
    } else {
      await p.waitForTimeout(300);
      const sw = await p.evaluate(() => document.documentElement.scrollWidth);
      ok('手機無橫向捲動', sw <= 392, sw);
      await p.screenshot({ path: shots + '/mobile-overview.png' });
      await p.click('[data-go="spacer:2"]'); await p.waitForTimeout(2200);
      ok('手機點隔珠面板更新', (await p.textContent('#pane-content')).includes('隔珠三'));
      await p.screenshot({ path: shots + '/mobile.png' });
      await p.click('#next'); await p.waitForTimeout(2200); await p.screenshot({ path: shots + '/mobile-bead.png' });
      ok('手機左右切換', (await p.evaluate(() => location.hash)).startsWith('#bead-'));
    }
    ok(name + ' 無JS錯誤', errs.length === 0, errs.join('|'));
    await p.close();
  }
  console.log(out.join('\n')); await b.close();
})();
