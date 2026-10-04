/* 瑜伽師地論 PWA Service Worker
 * 線上有新版時優先新版；真正離線時才使用舊快取。
 *  - index.html／導覽：network-first（逾時或斷線才用快取）
 *  - 其他靜態資源：依版本快取（cache-first），每個版本一個 Cache Storage
 *  - sw.js 本身不進 Cache Storage
 * 本檔由 tools/build_release.py 產生；改版請執行該工具，不要手改 VERSION／FILES。
 */
const VERSION = "1.77";
const CACHE = 'yogacara-v' + VERSION;
const FILES = {"./":"17UtLdNXiRn8hAsDacXXJiUxpLZTnQzjcuhwY11Q3T0=","index.html":"17UtLdNXiRn8hAsDacXXJiUxpLZTnQzjcuhwY11Q3T0=","manifest.webmanifest":"TbrBENlzZ/g48IUT2IDkmBotxHFh93WNcJtkGsQO6LQ=","icon-192-20261004215829.png":"bF51aip+NOoJsrEbNrqWdYl7noJWOcGsJRiqBHUn/XU=","icon-512-20261004215829.png":"s+9e28MU81Z7wk2xZkjVeY2PY1XhfqSwh7C678JrH8E=","data/fontkit.umd.min.js":"VY4hGbCI49y4EHDiTMRcMtoEl3g+k0UW4imPoUC+wKg=","data/heil.woff2":"VNL6GTNblvzXRo1ZzkvTIKsbnw0+RE5bNVJXGE92Wf8=","data/kai2.woff2":"3cm8BvgfE7m4YWfIWOyIhLOyFkZKDSQUvJym0wQF2BM=","data/kepan-pdf.js":"Tqja8VNg9vpl3iTQbrHDbuwNYLwCDjnBZ2ErdXsxwCY=","data/kepan.pdf":"C03EajzD00UgIBCrQaWpCiajRVICs3QgzV/kI43tT9o=","data/ming.woff2":"GYLpxxCSYNiKOFUjj0t53q5mo2sbtlDjvs+DD2F7dGo=","data/notes-01.js":"3L2YiCyAoWPCgfmHsBxBuASJwI7sD0naWX62MPz0DkE=","data/notes-02.js":"zI8To+3lsEmiXQZGTAExfF6wNzkkxxajHxxtCnGnidw=","data/notes-03.js":"ZsbiubJmiprxUsJNFrtAI+OEsaB+R0bdBCRP/ovLxjc=","data/notes-04.js":"DTOrzZJ/jPvQ0vNPGevCAA7ix6PoXHziSWHSalWtYOQ=","data/notes-05.js":"oGmRB1rXsDvhzv5IhHfgM5en0WDO5sMAVORE8/O8zyA=","data/notes-06.js":"VKc/zObosClyHR5wOC84XpJagKeVaed118ruM2OPB7g=","data/notes-07.js":"AP3PVGLWD1WnJlz85PlusDQ44stNAxS2lxD9InUlYAo=","data/notes-08.js":"ELSHfKFCgchRXlKzrA1wlfmKlRbgTL7eHxKYuMm9axk=","data/notes-09.js":"dhf1O8H4HVc53iVyhMYPr2+Io1/kkaADctnkkmp6Zus=","data/notes-10.js":"1KPf6r5H9TCW/5sSRna1oO64CfIlTXvcPNG6/yblGNc=","data/notes-11.js":"fDirraF9X5u/ZMTAemubF93HoTsMO3KrJ9p8dylyiS4=","data/notes-12.js":"RNphbhZW5jo1DGYvR2Lij5As8XJR9bwRC9QR0X59mwE=","data/notes-13.js":"hmuCTiL7Gz9VHjpLD8dihc7UffUk6vwukE/iVuUp85c=","data/notes-14.js":"PeWQsUy+k2KUC19bZt5ZlIu83wYkAnkMyrymD4miBRw=","data/notes-15.js":"XcVo1LfHsWJfnTIPqb99c3TOS/xQ5LX3VISvgmiyDaw=","data/notes-16.js":"s0Jr9MbG5WEAdUFMj6zfh+9BzFWOFz76irKJ6lgt+rg=","data/notes-17.js":"c6azHi2Zzv7g/jcUc8R6Ikr9zIU42mljQckSmVcU0S0=","data/notes-18.js":"YGwjRNLI4oonxWYqzoLPlAXXeTT3EHJoz5Vs2BxVjqU=","data/notes-19.js":"aP1qaMplhfBZ93P0gn2Mz4j96zrBLh5XQp1wuVwsDJI=","data/notes-20.js":"3Miq6mRnjd+Tri/eIr6PZ5C5qUtqRWzgXwJ6nie5o4w=","data/pdf-font-hei.js":"LPD5MbK/JZp+4vvCufdxI8EhOmZcTvZ7wEFn2f2iCv8=","data/pdf-font-kai.js":"X7GlMKAr5BkbUK1cTuI6l3BQReAJmU7PJeLy96VKeJA=","data/pdf-font-ming.js":"7gMbBf92paPreM4r2d79M/dEzyeXc2iUKZNNosjZxXg=","data/pdf-font-study.js":"CLKZTu5NMotSztR5ik7rrG1ceUzraTKjEAOLNItKhmo=","data/pdf-lib.min.js":"U0vIbPdIOVozKSPPoKgLbkIY99NBuJpnnldGaVOSNG4=","data/study-font-LICENSE.txt":"GKq/GQhIcl4ldu77XCm6BqrBAp0CEyJSp/MS6sLlDPM=","data/zang.js":"gnceEQV7oNFNBpvYt/2F58TFnMbPWSGJ7kKa577kkVQ="};
const SHELL = 'index.html';
const NAV_TIMEOUT = 8000;          // 只等「伺服器開始回應」的時間，不是整份下載時間

const scopeURL = path => new URL(path, self.registration.scope).href;
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const meta = scopeURL('__asset_hashes__');
    const saved = await cache.match(meta);
    if (saved) {
      let same = false;
      try { same = JSON.stringify(await saved.json()) === JSON.stringify(FILES); } catch (_) {}
      const hits = same ? await Promise.all(Object.keys(FILES).map(f => cache.match(scopeURL(f)))) : [];
      if (same && hits.every(Boolean)) { await self.skipWaiting(); return; }
      // 同名但不完整或內容不同：清空重建，不卡在舊版。
      await caches.delete(CACHE);
    }
    const fresh = await caches.open(CACHE);
    // 未變更的大檔（字型、科判 PDF、註釋）直接從舊版快取沿用，不重新下載。
    const reusable = [];
    for (const key of await caches.keys()) {
      if (!key.startsWith('yogacara-') || key === CACHE) continue;
      const c = await caches.open(key), m = await c.match(meta);
      if (m) try { reusable.push({ cache: c, hashes: await m.json() }); } catch (_) {}
    }
    const entries = Object.entries(FILES);
    let next = 0;
    await Promise.all(Array.from({ length: 4 }, async () => {
      while (next < entries.length) {
        const [file, hash] = entries[next++], url = scopeURL(file);
        let response = null;
        for (const old of reusable) if (old.hashes[file] === hash && (response = await old.cache.match(url))) break;
        if (!response) response = await fetch(new Request(url, { cache: 'reload', integrity: 'sha256-' + hash }));
        if (!response.ok) throw new Error('Incomplete update: ' + file);
        await fresh.put(url, response);
      }
    }));
    await fresh.put(meta, new Response(JSON.stringify(FILES), { headers: { 'Content-Type': 'application/json' } }));
    // 安裝完成就接管；頁面端會在安全時機最多重新載入一次。
    await self.skipWaiting();
  })().catch(async error => { await caches.delete(CACHE); throw error; }));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // 只清 Cache Storage 的舊版本；localStorage／IndexedDB（閱讀位置、設定、筆記）完全不碰。
    for (const key of await caches.keys()) if (key.startsWith('yogacara-') && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.type === 'GET_VERSION' && event.ports[0]) event.ports[0].postMessage({ version: VERSION, cache: CACHE });
  else if (data.type === 'SKIP_WAITING') self.skipWaiting();
});

async function digest(response) {
  return b64(await crypto.subtle.digest('SHA-256', await response.arrayBuffer()));
}

async function networkFirstShell(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await Promise.race([
      fetch(request.mode === 'navigate' ? new Request(scopeURL(SHELL), { cache: 'no-cache', credentials: 'same-origin' }) : new Request(request, { cache: 'no-cache' })),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), NAV_TIMEOUT))
    ]);
    if (response.ok) {
      // 只有與本版本相同的 index.html 才回寫離線快取，避免新殼配舊資源。
      const forHash = response.clone(), forCache = response.clone();
      digest(forHash).then(hash => { if (hash === FILES[SHELL]) return cache.put(scopeURL(SHELL), forCache); }).catch(() => {});
      return response;
    }
    throw new Error('HTTP ' + response.status);
  } catch (error) {
    const hit = await cache.match(scopeURL(SHELL));
    if (hit) return hit;
    for (const key of await caches.keys()) {
      if (!key.startsWith('yogacara-')) continue;
      const old = await (await caches.open(key)).match(scopeURL(SHELL));
      if (old) return old;
    }
    throw error;
  }
}

self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (!url.href.startsWith(self.registration.scope)) return;
  const path = url.href.slice(self.registration.scope.length).split(/[?#]/)[0];
  if (path === 'sw.js') return;                                   // 永遠交給瀏覽器取最新 sw.js
  if (request.mode === 'navigate' || path === '' || path === SHELL) {
    event.respondWith(networkFirstShell(request));
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(request, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const response = await fetch(request);
      if (response.ok && FILES[path] === undefined && /^data\//.test(path)) cache.put(request, response.clone()).catch(() => {});
      return response;
    } catch (error) {
      for (const key of await caches.keys()) {
        if (!key.startsWith('yogacara-')) continue;
        const old = await (await caches.open(key)).match(request, { ignoreSearch: true });
        if (old) return old;
      }
      throw error;
    }
  })());
});
