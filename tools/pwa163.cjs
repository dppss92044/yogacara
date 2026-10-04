const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const {chromium}=(()=>{try{return require('playwright');}catch(e){return require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');}})();
const root=path.resolve(__dirname,'..');let mode='old',browser,requests=[];
const server=http.createServer((req,res)=>{
 let url=req.url.split('?')[0],relative=url.replace(/^\/yogacara\//,'')||'index.html',f=path.join(root,relative);
 if(relative==='sw.js')f=path.join(root,mode==='old'?'tools/fixtures/v1.62/sw.js':'sw.js');
 else if(relative==='index.html'&&mode==='old')f=path.join(root,'tools/fixtures/v1.62/index.html');
 if(!fs.existsSync(f)){res.writeHead(404);return res.end();}
 requests.push({mode,url});res.setHeader('Content-Type',f.endsWith('.html')?'text/html; charset=utf-8':f.endsWith('.js')?'application/javascript':f.endsWith('.webmanifest')?'application/manifest+json':'application/octet-stream');res.setHeader('Cache-Control','no-cache');
 if(relative==='index.html'&&mode==='bad'){res.end(fs.readFileSync(f,'utf8').replace('v1.63</b>','v1.00</b>'));return;}
 if(relative==='sw.js'&&mode==='bad'){res.end(fs.readFileSync(f,'utf8')+'\n// incomplete deploy test');return;}
 if(mode==='next'&&(relative==='index.html'||relative==='sw.js')){let shell=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/1\.63/g,'1.64');if(relative==='index.html'){res.end(shell);return;}let hash=crypto.createHash('sha256').update(shell).digest('base64'),sw=fs.readFileSync(f,'utf8').replace('const VERSION = \"1.63\"','const VERSION = \"1.64\"');sw=sw.replace(/const FILES = (.*);/,(_,json)=>{let files=JSON.parse(json);files['./']=files['index.html']=hash;return 'const FILES = '+JSON.stringify(files)+';'});res.end(sw);return;} fs.createReadStream(f).pipe(res);
});
async function version(p,v){await p.waitForFunction(v=>document.getElementById('appVer')?.textContent===v,v,{timeout:45000});}
(async()=>{
 await new Promise(r=>server.listen(8785,'127.0.0.1',r));browser=await chromium.launch({executablePath:'/tmp/headless161/chrome-linux/headless_shell',args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],headless:true});
 let c=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'});
 await c.addInitScript(()=>{try{localStorage.setItem('hk-tour','7');Object.defineProperty(navigator,'maxTouchPoints',{get:()=>5});}catch(e){}});
 let p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8785/yogacara/');await p.waitForSelector('.txt');
 await p.waitForFunction(()=>navigator.serviceWorker.controller,{timeout:45000});await version(p,'v1.62');await p.waitForTimeout(400);
 console.log('PASS v1.62 installed');
 mode='bad';await p.evaluate(async()=>{let r=await navigator.serviceWorker.ready;await r.update();});await p.waitForFunction(async()=>{let r=await navigator.serviceWorker.ready;return !r.installing;},{},{timeout:45000});await p.waitForTimeout(200);await p.waitForFunction(async()=>!(await caches.keys()).includes('yogacara-v1.63'),{},{timeout:45000});
 assert.equal(await p.locator('#appVer').textContent(),'v1.62');assert(!(await p.evaluate(()=>caches.keys())).includes('yogacara-v1.63'),'partial version retained');console.log('PASS incomplete update keeps old version');
 mode='new';await p.evaluate(async()=>{let r=await navigator.serviceWorker.ready;await r.update();});await version(p,'v1.63');await p.waitForSelector('.txt');
 assert.deepEqual(errors,[]);console.log('PASS v1.62 → v1.63 automatic update');
 let keys=await p.evaluate(()=>caches.keys());assert(keys.includes('yogacara-v1.63'));let count=await p.evaluate(async()=>{let c=await caches.open('yogacara-v1.63');return (await c.keys()).length;});assert.equal(count,39);
 await p.goto('http://127.0.0.1:8785/yogacara/#j67');await p.waitForSelector('#volume-67');await p.waitForTimeout(1800);await p.evaluate(()=>scrollTo(0,900));await p.waitForTimeout(400);let y=await p.evaluate(()=>scrollY);await p.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 await c.setOffline(true);await p.reload();await version(p,'v1.63');await p.waitForSelector('#volume-67');await p.waitForTimeout(800);assert.equal(await p.locator('.reading-volume').count(),1);assert(Math.abs(y-await p.evaluate(()=>scrollY))<5,'offline resume position before='+y+' after='+await p.evaluate(()=>scrollY)+' storage='+JSON.stringify(await p.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>/position|read/.test(k))))));console.log('PASS offline reload and reading position');
 await p.locator('#edBadge').click();await p.waitForFunction(()=>document.documentElement.dataset.edition==='hk');await p.waitForSelector('#volume-67');await p.locator('#menuBtn').click();await p.locator('#contentBtn').click();await p.locator('label:has(#optPx)').click();await p.waitForSelector('.nx.px');await p.locator('#menuBtn').click();await p.locator('[data-screen=chart]').click();await p.waitForSelector('#pzoom .kscale');await p.locator('[data-screen=catalog]').click();await p.locator('#jFold').click();await p.locator('#juans a[data-j="100"]').click();await p.waitForSelector('#volume-100');await p.waitForSelector('.nx.px');console.log('PASS offline notes, chart and volume 100');
 await c.setOffline(false);
 // A subsequent complete update must wait while typing, then preserve the reader.
 await p.locator('#searchButton').click();await p.locator('#q').fill('菩薩');let navigations=0;p.on('framenavigated',f=>{if(f===p.mainFrame())navigations++;});
 let sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');mode='next';
 try{await p.evaluate(async()=>{let r=await navigator.serviceWorker.ready;await r.update();});await p.waitForTimeout(2000);assert.equal(navigations,0,'update interrupted typing');await p.locator('#q').press('Escape');for(let i=0;i<12&&navigations===0;i++)await p.waitForTimeout(500);if(navigations===0)console.log('BUSY STATE',await p.evaluate(()=>({active:document.activeElement.outerHTML.slice(0,200),selection:String(getSelection()),menu:document.querySelector('#menu').className,hidden:document.hidden,q:document.getElementById('q').hidden,body:document.body.className,animations:document.getAnimations().map(a=>({state:a.playState,target:a.effect.target.id}))})));assert.equal(navigations,1,'idle update did not reload');await version(p,'v1.64');console.log('PASS update defers during input');}finally{mode='new';}
 fs.writeFileSync(path.join(__dirname,'pwa163-results.json'),JSON.stringify({cacheEntries:count,oldToNew:true,partialUpdateRejected:true,offline:true,notes100:true,inputDeferred:true,errors},null,2));await c.close();await browser.close();server.close();
})().catch(async e=>{console.error(e.stack);if(browser)await browser.close();server.close();process.exit(1);});
