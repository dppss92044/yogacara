// 2.2 mobile/tablet launch announcement regression; Chromium emulation only.
// Run a static repository server on port 8000 first.
const assert=require('node:assert/strict');
const {chromium,devices}=require('playwright');
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8000/';let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;};
const profiles=[['phone',devices['iPhone 13']],['phone-landscape',devices['iPhone 13 landscape']],['tablet',devices['iPad Pro 11']],['tablet-landscape',devices['iPad Pro 11 landscape']]];
async function run(b,name,opts,ed,{fresh=false,layout='',desktop=false}={}){
 const c=await b.newContext({...opts,serviceWorkers:'block'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 if(name==='ipad-desktop-ua')await c.addInitScript(()=>Object.defineProperty(navigator,'maxTouchPoints',{get:()=>5}));
 if(!fresh)await c.addInitScript(ed=>{for(const [k,v] of Object.entries({'hk-tour':'9','hk-anim-auto':'2.2','hk-anim-rev':'2.2b','hk-ver-opened':'2.2','hk-seen-version':'2.2','hk-update-notice':'off','hk-edition-v154':ed}))localStorage.setItem(k,v);},ed);
 await c.route('https://yogacara-stats.**',r=>r.abort());
 try{
 await p.goto(base+(layout?'?layout='+layout:''));await p.waitForSelector('.txt');
 if(desktop){await p.waitForTimeout(1800);ok(await p.locator('#updAnim').count()===0,name+' no auto update');await p.evaluate(()=>window.__updAnim());await p.waitForSelector('#updAnim');ok(await p.locator('#updAnim.mobile22').count()===0,name+' old desktop replay retained');}
 else{
 await p.waitForSelector('#updAnim.mobile22');ok(await p.locator('#updAnim .ua-ts').textContent()==='v2.2 上線',name+' exact version title');
 ok((await p.locator('#updAnim .ua-d').textContent()).includes('設定 → 介面 → 點選電腦圖示'),name+' selection instructions');
 ok(await p.locator('#updAnim .ua-dots button').count()===2,name+' two scenes');
 ok(await p.locator('#helpAnim').count()===0,name+' no overlapping fresh guide');
 const anim=await p.locator('.m22-menu').evaluate(e=>e.getAnimations().map(a=>({state:a.playState,time:a.currentTime})));await p.waitForTimeout(250);const later=await p.locator('.m22-menu').evaluate(e=>e.getAnimations().map(a=>a.currentTime));ok(anim.length>0&&anim[0].state==='running'&&later[0]>anim[0].time,name+' animation running');
 const rect=await p.locator('#updAnim .ua-card').boundingBox(),vw=await p.evaluate(()=>visualViewport.width);ok(rect.x>=-1&&rect.x+rect.width<=vw+1,name+' card fits viewport');
 await p.screenshot({path:`/tmp/mobile-launch-${name}-${ed}.png`});
 await p.locator('#updAnim [data-u=next]').tap();ok((await p.locator('#updAnim .ua-d').textContent()).includes('平板、手機版介面 bug 陸續修復中，目前完整功能以電腦版為主。'),name+' repair warning');
 await p.locator('#updAnim [data-u=next]').tap();ok(await p.locator('#updAnim').count()===0,name+' dismiss');ok(await p.evaluate(()=>localStorage.getItem('hk-mobile22-launch')==='1'),name+' new announcement read marker');
 if(fresh){await p.waitForSelector('#helpAnim');ok(await p.locator('#updAnim').count()===0,name+' guide runs after announcement');await p.locator('#helpAnim [data-u=skip]').tap();}
 await p.reload();await p.waitForSelector('.txt');await p.waitForTimeout(1400);ok(await p.locator('#updAnim').count()===0,name+' no repeat after reload');
 await p.evaluate(()=>window.__updAnim());await p.waitForSelector('#updAnim.mobile22');ok(await p.locator('#updAnim .ua-ts').textContent()==='v2.2 上線',name+' manual replay');
 }
 ok(errors.length===0,name+' page errors '+errors.join(';'));console.log('PASS',name,ed);
 }finally{await c.close();}
}
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const queue=profiles.flatMap(([n,o])=>['zang','hk'].map(e=>[n,o,e]));queue.push(['phone-desktop',devices['iPhone 13'],'zang',{layout:'mac'}],['fresh-phone',devices['iPhone 13'],'zang',{fresh:true}],['desktop',{viewport:{width:1440,height:900}},'zang',{desktop:true}],['desktop-phone-interface',{viewport:{width:1440,height:900}},'hk',{desktop:true,layout:'iphone'}],['android',devices['Pixel 7'],'zang'],['ipad-desktop-ua',{...devices['iPad Pro 11'],userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15'},'zang']);
 await Promise.all([0,1].map(async()=>{while(queue.length)await run(b,...queue.shift());}));console.log('PASS',checks,'assertions, 14 cases');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
