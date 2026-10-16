// Current 2.2 interface selection regression (2026-10-16); Chromium emulation, not Safari hardware.
// Start the repository static server on port 8000, then: node tools/device-layout.cjs
const assert=require('node:assert/strict');
const {chromium,devices}=require('playwright');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8000/';
const profiles=[['desktop',{viewport:{width:1440,height:900}}],['tablet-portrait',{...devices['iPad Pro 11']}],['tablet-landscape',{...devices['iPad Pro 11 landscape']}],['phone-portrait',{...devices['iPhone 13']}],['phone-landscape',{...devices['iPhone 13 landscape']}]];
let checks=0;
function check(value,message){assert.ok(value,message);checks++;}
async function run(browser,name,options,edition){
 const c=await browser.newContext({...options,serviceWorkers:'block'}),p=await c.newPage(),errors=[];
 p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));
 await c.addInitScript(ed=>{localStorage.setItem('hk-mobile22-launch','1');localStorage.setItem('hk-tour','9');localStorage.setItem('hk-anim-auto','2.2');localStorage.setItem('hk-seen-version','2.2');localStorage.setItem('hk-update-notice','off');localStorage.setItem('km-tour-off','1');localStorage.setItem('hk-edition-v154',ed)},edition);
 await p.route('https://yogacara-stats.**',r=>r.abort());
 const press=async selector=>{const l=p.locator(selector).first();if(options.hasTouch)await l.tap();else {await p.mouse.move(0,0);await l.focus();await p.keyboard.press('Enter');}};
 async function ready(){await p.waitForSelector('.txt');await p.waitForFunction(()=>document.querySelectorAll('.layout-choice').length===3);}
 async function select(layout){
  console.log("SELECT",name,edition,layout);
  if(await p.locator('#menuBtn').getAttribute('aria-pressed')!=='true')await press('#menuBtn');
  if(!(await p.locator('[data-layout-choice=mac]').isVisible()))await press('.learning-settings > summary');
  const style=await p.locator('[data-layout-choice=mac]').evaluate(e=>({pointer:getComputedStyle(e).pointerEvents,opacity:getComputedStyle(e).opacity}));
  check(style.pointer!=='none'&&+style.opacity>.4,`${name} desktop choice enabled`);
  await press(`[data-layout-choice=${layout}]`);
  await p.waitForFunction(v=>document.documentElement.dataset.layout===v,layout);
  await p.waitForTimeout(500);
  check(await p.evaluate(v=>localStorage.getItem('hk-device-layout-v146')===v,layout),`${name} ${layout} preference`);
  check(new URL(p.url()).searchParams.get('layout')===layout,`${name} ${layout} URL tracks choice`);
 }
 try{
  await p.goto(base+'?layout=iphone');await ready();
  check(await p.evaluate(()=>document.documentElement.dataset.layout==='iphone'),`${name} phone link`);
  for(const layout of ['ipad','mac','iphone']){
   await select(layout);
   if(layout==='mac'){
    check(await p.evaluate(()=>document.documentElement.dataset.singlePane==='false'&&document.documentElement.dataset.mobileUi==='false'),`${name} full desktop mode`);
    for(const id of ['rail','main','panel'])check(await p.locator('#'+id).isVisible(),`${name} desktop ${id}`);
    check(await p.locator('#swapPanes').isVisible(),`${name} desktop swap`);
    await press('#swapPanes');check(await p.locator('#wrap').evaluate(e=>e.classList.contains('panes-swapped')),`${name} swapped`);await press('#swapPanes');
   }
  }
  await p.reload();await ready();check(await p.evaluate(()=>document.documentElement.dataset.layout==='iphone'),`${name} reload phone`);
  await select('mac');await p.reload();await ready();check(await p.evaluate(()=>document.documentElement.dataset.layout==='mac'),`${name} reload desktop`);
  // Load without URL selection: stored desktop selection must still win on actual phone UAs.
  await p.goto(base);await ready();check(await p.evaluate(()=>document.documentElement.dataset.layout==='mac'),`${name} persisted desktop without query`);
  await press('#searchButton');await p.locator('#q').fill('瑜伽');await p.locator('#q').press('Enter');await p.waitForSelector('.results mark');check(await p.locator('.results h2').textContent().then(t=>t.includes('瑜伽')),`${name} search results`);
  await p.goto(base);await ready();await press('#menuBtn');await press('#dlBtn');check(await p.locator('#dlPop').isVisible(),`${name} export panel`);
  await p.goto(base+'?layout=ipad');await ready();check(await p.evaluate(()=>document.documentElement.dataset.layout==='ipad'),`${name} tablet link`);
  // Native adaptive layout's chart tab remains an entry to the same complete map.
  if(await p.evaluate(()=>document.documentElement.dataset.singlePane==='true'))await press('.device-tabs [data-screen=chart]');
  await press('#mapBtn');await p.waitForSelector('#kmap:not([hidden]) canvas');
  check(await p.locator('#kmap canvas').isVisible(),`${name} map canvas`);
  if(await p.locator('#kmap.km-emb').count())await press('#kmap .km-exp');
  check(await p.locator('#kmap [data-a=print]').isVisible(),`${name} full map print available`);
  await p.screenshot({path:`/tmp/device-layout-${name}-${edition}.png`});
  check(errors.length===0,`${name} page errors: ${errors.join('; ')}`);
  console.log('PASS',name,edition);
 }catch(e){await p.screenshot({path:`/tmp/layout-fail-${name}-${edition}.png`});throw e;}finally{await c.close();}
}
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});try{const queue=profiles.flatMap(([n,o])=>['zang','hk'].map(ed=>[n,o,ed]));await Promise.all([0,1].map(async()=>{while(queue.length)await run(b,...queue.shift());}));console.log(`PASS ${checks} assertions, 10 device/edition cases`);}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
