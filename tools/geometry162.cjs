const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert'),{chromium}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..');let browser;
const server=http.createServer((req,res)=>{let file=path.join(root,req.url.split('?')[0].replace(/^\//,'')||'index.html');if(!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.html')?'text/html;charset=utf-8':'application/javascript');if(file.endsWith('index.html'))res.end(fs.readFileSync(file,'utf8').replace('\n})();\n</script>','\nwindow.__g={pages:()=>PAGES,relayoutSheet,switchEdition,setLabel};\n})();\n</script>'));else fs.createReadStream(file).pipe(res);});
(async()=>{await new Promise(r=>server.listen(8792,'127.0.0.1',r));browser=await chromium.launch({executablePath:'/tmp/headless161/chrome-linux/headless_shell',args:['--no-sandbox','--disable-dev-shm-usage']});const c=await browser.newContext({viewport:{width:1440,height:900}});await c.addInitScript(()=>{localStorage.setItem('hk-tour','7');localStorage.setItem('hk-edition-v154','hk');});await c.route('**/sw.js',r=>r.fulfill({status:404}));const p=await c.newPage();await p.goto('http://127.0.0.1:8792/');await p.waitForSelector('#volume-1');await p.evaluate(()=>document.fonts.ready);let result=[];
for(const ed of ['hk','zang']){if(ed==='zang')await p.evaluate(()=>__g.switchEdition('zang'));for(const label of ['gz','zj']){await p.evaluate(label=>__g.setLabel(label),label);let report=await p.evaluate(()=>{
  let pages=__g.pages(),fail=[],overflow=[],overlap=[],maxStem=0,nodeCount=0,originalCount=0,noteCount=0;
  let sheet=document.createElement('div');sheet.className='kscale';document.body.appendChild(sheet);
  for(let i=0;i<pages.length;i++){
    sheet.innerHTML=pages[i];let original=Array.from(sheet.querySelectorAll('.nd[data-id]')).map(e=>e.dataset.id);originalCount+=original.length;
    let pg=sheet.querySelector('.page');__g.relayoutSheet(pg);if(pg.dataset.vt!=='1')fail.push(i+2);
    let nodes=Array.from(sheet.querySelectorAll('.nd')),ids=new Set(nodes.filter(e=>e.dataset.id).map(e=>e.dataset.id));
    for(let id of original)if(!ids.has(id))throw Error('Lost title '+id+' page '+(i+2));
    let rects=nodes.map(e=>({id:e.dataset.id||e.dataset.go,note:e.classList.contains('nt'),x:parseFloat(e.style.left),y:parseFloat(e.style.top),w:parseFloat(e.style.width),h:e.getBoundingClientRect().height*25.4/96}));nodeCount+=rects.length;noteCount+=rects.filter(r=>r.note).length;
    for(let r of rects)if(r.x<11.5||r.x+r.w>185.5||r.y<15.5||r.y+r.h>282)overflow.push({p:i+2,...r});
    for(let a=0;a<rects.length;a++)for(let b=a+1;b<rects.length;b++){let r=rects[a],q=rects[b];if(r.id===q.id)continue;let dx=Math.min(r.x+r.w,q.x+q.w)-Math.max(r.x,q.x),dy=Math.min(r.y+r.h,q.y+q.h)-Math.max(r.y,q.y);if(dx>.4&&dy>.8)overlap.push({p:i+2,a:r,b:q});}
    for(let l of sheet.querySelectorAll('svg.ln line')){let x1=+l.getAttribute('x1'),x2=+l.getAttribute('x2'),y1=+l.getAttribute('y1'),y2=+l.getAttribute('y2');if(x1===x2)maxStem=Math.max(maxStem,Math.abs(y2-y1));}
    delete sheet.dataset.rl;delete sheet.dataset.vt;
  }sheet.remove();return {pages:pages.length,nodeCount,originalCount,noteCount,maxStem,fail,overflow:overflow.slice(0,15),overflowCount:overflow.length,overlap:overlap.slice(0,15),overlapCount:overlap.length};
});console.log(ed,JSON.stringify({...report,fail:report.fail.slice(0,20)}));assert.equal(report.fail.length,0);assert.equal(report.overflowCount,0);assert.equal(report.overlapCount,0);result.push({ed,label,...report});}}
fs.writeFileSync(path.join(__dirname,'geometry162-results.json'),JSON.stringify(result,null,2));await browser.close();server.close();})().catch(async e=>{console.error(e.stack);if(browser)await browser.close();server.close();process.exitCode=1});
