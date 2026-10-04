const CACHE = 'yogacara-v154-editions-1';
const FILES={"./":"ZgaynQTj0y7c5F8HaT+zVmFPOAE26WApAnvrME+cPgQ=","index.html":"ZgaynQTj0y7c5F8HaT+zVmFPOAE26WApAnvrME+cPgQ=","manifest.webmanifest":"TbrBENlzZ/g48IUT2IDkmBotxHFh93WNcJtkGsQO6LQ=","icon-192.png":"bF51aip+NOoJsrEbNrqWdYl7noJWOcGsJRiqBHUn/XU=","icon-512.png":"s+9e28MU81Z7wk2xZkjVeY2PY1XhfqSwh7C678JrH8E=","data/fontkit.umd.min.js":"VY4hGbCI49y4EHDiTMRcMtoEl3g+k0UW4imPoUC+wKg=","data/heil.woff2":"VNL6GTNblvzXRo1ZzkvTIKsbnw0+RE5bNVJXGE92Wf8=","data/kai2.woff2":"3cm8BvgfE7m4YWfIWOyIhLOyFkZKDSQUvJym0wQF2BM=","data/kepan-pdf.js":"Tqja8VNg9vpl3iTQbrHDbuwNYLwCDjnBZ2ErdXsxwCY=","data/kepan.pdf":"C03EajzD00UgIBCrQaWpCiajRVICs3QgzV/kI43tT9o=","data/ming.woff2":"GYLpxxCSYNiKOFUjj0t53q5mo2sbtlDjvs+DD2F7dGo=","data/notes-01.js":"3L2YiCyAoWPCgfmHsBxBuASJwI7sD0naWX62MPz0DkE=","data/notes-02.js":"zI8To+3lsEmiXQZGTAExfF6wNzkkxxajHxxtCnGnidw=","data/notes-03.js":"ZsbiubJmiprxUsJNFrtAI+OEsaB+R0bdBCRP/ovLxjc=","data/notes-04.js":"DTOrzZJ/jPvQ0vNPGevCAA7ix6PoXHziSWHSalWtYOQ=","data/notes-05.js":"oGmRB1rXsDvhzv5IhHfgM5en0WDO5sMAVORE8/O8zyA=","data/notes-06.js":"VKc/zObosClyHR5wOC84XpJagKeVaed118ruM2OPB7g=","data/notes-07.js":"AP3PVGLWD1WnJlz85PlusDQ44stNAxS2lxD9InUlYAo=","data/notes-08.js":"ELSHfKFCgchRXlKzrA1wlfmKlRbgTL7eHxKYuMm9axk=","data/notes-09.js":"dhf1O8H4HVc53iVyhMYPr2+Io1/kkaADctnkkmp6Zus=","data/notes-10.js":"1KPf6r5H9TCW/5sSRna1oO64CfIlTXvcPNG6/yblGNc=","data/notes-11.js":"fDirraF9X5u/ZMTAemubF93HoTsMO3KrJ9p8dylyiS4=","data/notes-12.js":"RNphbhZW5jo1DGYvR2Lij5As8XJR9bwRC9QR0X59mwE=","data/notes-13.js":"hmuCTiL7Gz9VHjpLD8dihc7UffUk6vwukE/iVuUp85c=","data/notes-14.js":"PeWQsUy+k2KUC19bZt5ZlIu83wYkAnkMyrymD4miBRw=","data/notes-15.js":"XcVo1LfHsWJfnTIPqb99c3TOS/xQ5LX3VISvgmiyDaw=","data/notes-16.js":"s0Jr9MbG5WEAdUFMj6zfh+9BzFWOFz76irKJ6lgt+rg=","data/notes-17.js":"c6azHi2Zzv7g/jcUc8R6Ikr9zIU42mljQckSmVcU0S0=","data/notes-18.js":"YGwjRNLI4oonxWYqzoLPlAXXeTT3EHJoz5Vs2BxVjqU=","data/notes-19.js":"aP1qaMplhfBZ93P0gn2Mz4j96zrBLh5XQp1wuVwsDJI=","data/notes-20.js":"3Miq6mRnjd+Tri/eIr6PZ5C5qUtqRWzgXwJ6nie5o4w=","data/pdf-font-hei.js":"LPD5MbK/JZp+4vvCufdxI8EhOmZcTvZ7wEFn2f2iCv8=","data/pdf-font-kai.js":"X7GlMKAr5BkbUK1cTuI6l3BQReAJmU7PJeLy96VKeJA=","data/pdf-font-ming.js":"7gMbBf92paPreM4r2d79M/dEzyeXc2iUKZNNosjZxXg=","data/pdf-font-study.js":"CLKZTu5NMotSztR5ik7rrG1ceUzraTKjEAOLNItKhmo=","data/pdf-lib.min.js":"U0vIbPdIOVozKSPPoKgLbkIY99NBuJpnnldGaVOSNG4=","data/study-font-LICENSE.txt":"GKq/GQhIcl4ldu77XCm6BqrBAp0CEyJSp/MS6sLlDPM=","data/zang.js":"ahjTf7Y/2qvoQQw6n4FrLGH4xcPNlmr9aQoQT4WYrGg="};

self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE),metadataURL=new URL('__asset_hashes__',self.registration.scope),existing=await cache.match(metadataURL);
  if(existing){
    const hashes=await existing.json();
    if(JSON.stringify(hashes)!==JSON.stringify(FILES))throw Error('A changed release needs a new cache version');
    const hits=await Promise.all(Object.keys(FILES).map(file=>cache.match(new URL(file,self.registration.scope))));
    if(hits.every(Boolean)){await self.skipWaiting();return;}
    // Keep an active version intact instead of rewriting it in-place.
    throw Error('Use a new cache version to repair an incomplete cache');
  }
  const older=(await caches.keys()).filter(k=>k.startsWith('yogacara-')&&k!==CACHE).reverse();
  const reusable=[];
  for(const key of older){const c=await caches.open(key),m=await c.match(new URL('__asset_hashes__',self.registration.scope));if(m)try{reusable.push({cache:c,hashes:await m.json()});}catch(_){} }
  const entries=Object.entries(FILES);let next=0,failed=false;
  const workers=await Promise.allSettled(Array.from({length:4},async()=>{
    while(!failed&&next<entries.length){
      const [file,hash]=entries[next++],url=new URL(file,self.registration.scope);
      let response;
      for(const old of reusable){if(old.hashes[file]===hash){response=await old.cache.match(url);if(response)break;}}
      try{
        if(!response)response=await fetch(new Request(url,{cache:'reload',integrity:'sha256-'+hash}));
        if(!response.ok)throw Error('Incomplete update: '+file);
        await cache.put(url,response);
      }catch(error){failed=true;throw error;}
    }
  }));
  if(workers.some(w=>w.status==='rejected')){await caches.delete(CACHE);throw Error('Update not complete; keep previous version');}
  await cache.put(new URL('__asset_hashes__',self.registration.scope),new Response(JSON.stringify(FILES),{headers:{'Content-Type':'application/json'}}));
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  // Retain one previous complete version while existing readers finish an operation.
  const older=(await caches.keys()).filter(k=>k.startsWith('yogacara-')&&k!==CACHE);
  for(const key of older.slice(0,-1))await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    // Serve a complete version; never mix a new HTML shell with an old asset cache.
    const hit=await cache.match(request,{ignoreSearch:true});if(hit)return hit;
    if(request.mode==='navigate'&&url.href.startsWith(self.registration.scope)){
      const shell=await cache.match(new URL('index.html',self.registration.scope));if(shell)return shell;
    }
    return fetch(request);
  })());
});
