/* 瑜伽師地論 PWA Service Worker
 * 使用已同意的版本；下載新版本後先詢問，再由使用者決定套用。
 *  - index.html／導覽：本版已下載就直接開啟；尚未下載才走網路（逾時或斷線用舊快取）
 *  - 其他靜態資源：依版本快取（cache-first），每個版本一個 Cache Storage
 *  - sw.js 本身不進 Cache Storage
 * 本檔由 tools/build_release.py 產生；改版請執行該工具，不要手改 VERSION／FILES。
 */
const VERSION = '__VERSION__';
const CACHE = 'yogacara-v' + VERSION;
const FILES = __FILES__;
const SHELL = 'index.html';
const STATE_CACHE = 'yogacara-update-state';
const NAV_TIMEOUT = 8000;          // 只等「伺服器開始回應」的時間，不是整份下載時間

const scopeURL = path => new URL(path, self.registration.scope).href;
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));

// Persist consent independently of the worker lifecycle: a waiting worker can
// activate automatically when every tab closes, but must still serve the chosen version.
async function approvedVersion() {
  const saved = await (await caches.open(STATE_CACHE)).match(scopeURL('__approved_version__'));
  if (!saved) return null;
  try { const value = await saved.json(); return /^\d+\.\d+(?:\.\d+)?$/.test(value.version) ? value.version : null; } catch (_) { return null; }
}
async function approve(version) {
  await (await caches.open(STATE_CACHE)).put(scopeURL('__approved_version__'), new Response(JSON.stringify({ version }), { headers: { 'Content-Type': 'application/json' } }));
}
async function initializeConsent() {
  if (await approvedVersion()) return;
  let previous = null;
  if (self.registration.active) {
    previous = await new Promise(resolve => {
      const channel = new MessageChannel();
      const timer = setTimeout(() => { channel.port1.close(); resolve(null); }, 3000);
      channel.port1.onmessage = event => { clearTimeout(timer); channel.port1.close(); resolve(event.data && event.data.version); };
      self.registration.active.postMessage({ type: 'GET_VERSION' }, [channel.port2]);
    });
    if (!previous) {
      const old = (await caches.keys()).filter(key => key.startsWith('yogacara-v') && key !== CACHE);
      if (old.length) previous = old[old.length - 1].slice('yogacara-v'.length);
    }
  }
  await approve(previous || VERSION);
}
async function servingCache() {
  return caches.open('yogacara-v' + (await approvedVersion() || VERSION));
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    await initializeConsent();
    const cache = await caches.open(CACHE);
    const meta = scopeURL('__asset_hashes__');
    const saved = await cache.match(meta);
    if (saved) {
      let same = false;
      try { same = JSON.stringify(await saved.json()) === JSON.stringify(FILES); } catch (_) {}
      const hits = same ? await Promise.all(Object.keys(FILES).map(f => cache.match(scopeURL(f)))) : [];
      if (same && hits.every(Boolean)) { if (!self.registration.active) await self.skipWaiting(); return; }
      // 同名但不完整或內容不同：清空重建，不卡在舊版。
      await caches.delete(CACHE);
    }
    const fresh = await caches.open(CACHE);
    // 未變更的大檔（字型、科判 PDF、註釋）直接從舊版快取沿用，不重新下載。
    const reusable = [];
    for (const key of await caches.keys()) {
      if (!key.startsWith('yogacara-v') || key === CACHE) continue;
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
    // 首次安裝直接啟用；升級保留 waiting，僅「立即更新」才接管。
    if (!self.registration.active) await self.skipWaiting();
  })().catch(async error => { await caches.delete(CACHE); throw error; }));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // 只清 Cache Storage 的舊版本；localStorage／IndexedDB（閱讀位置、設定、筆記）完全不碰。
    // 其他分頁可能選了稍後更新；保留它們仍使用的完整版本快取。
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const approved = 'yogacara-v' + (await approvedVersion() || VERSION);
    if (!clients.length) for (const key of await caches.keys()) if (key.startsWith('yogacara-v') && key !== CACHE && key !== approved) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.type === 'GET_VERSION' && event.ports[0]) event.ports[0].postMessage({ version: VERSION, cache: CACHE });
  else if (data.type === 'APPLY_UPDATE' || data.type === 'SKIP_WAITING') {
    event.waitUntil((async () => {
      await approve(VERSION);
      if (event.ports[0]) event.ports[0].postMessage({ approved: VERSION });
      await self.skipWaiting();
    })());
  }
});

async function digest(response) {
  return b64(await crypto.subtle.digest('SHA-256', await response.arrayBuffer()));
}

async function networkFirstShell(request) {
  const approved = await approvedVersion() || VERSION;
  const cache = await caches.open('yogacara-v' + approved);
  // 已下載的本版首頁直接開啟（不再每次重新下載 7MB 的 index.html）；
  // 新版由瀏覽器檢查 sw.js 發現，使用者同意後才接管並重新載入。
  const ready = await cache.match(scopeURL(SHELL));
  if (ready) return ready;
  if (approved !== VERSION) return new Response(`<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>更新版本</title><style>body{margin:0;padding:32px 24px;background:#f2f2f7;color:#222;font:16px/1.8 system-ui}main{max-width:440px;margin:10vh auto;background:white;padding:24px;border-radius:24px}button{border:0;border-radius:14px;padding:14px 22px;background:#007aff;color:white;font:inherit}</style><main><h2>已有最新版本v${VERSION}</h2><p>目前版本的離線資料不完整。可更新後繼續閱讀，閱讀位置與設定會保留。</p><button type="button">立即更新</button><p role="status"></p></main><script>document.querySelector('button').onclick=function(){var b=this,s=document.querySelector('[role=status]');if(!navigator.onLine){s.textContent='請連上網路後再更新。';return;}b.disabled=true;s.textContent='正在更新…';var c=new MessageChannel(),t=setTimeout(function(){c.port1.close();b.disabled=false;s.textContent='更新尚未完成，請稍後再試。';},10000);c.port1.onmessage=function(e){if(e.data&&e.data.approved){clearTimeout(t);c.port1.close();location.reload();}};if(navigator.serviceWorker.controller)navigator.serviceWorker.controller.postMessage({type:'APPLY_UPDATE'},[c.port2]);};</script></html>`, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
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
      if (!key.startsWith('yogacara-v')) continue;
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
  if (path === 'sw.js' || path === 'assets/releases/latest.json') return;                                   // 更新描述與 worker 永遠向網路檢查
  if (request.mode === 'navigate' || path === '' || path === SHELL) {
    event.respondWith(networkFirstShell(request));
    return;
  }
  event.respondWith((async () => {
    const cache = await servingCache();
    const hit = await cache.match(request, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const response = await fetch(request);
      if (response.ok && FILES[path] === undefined && /^data\//.test(path)) cache.put(request, response.clone()).catch(() => {});
      return response;
    } catch (error) {
      for (const key of await caches.keys()) {
        if (!key.startsWith('yogacara-v')) continue;
        const old = await (await caches.open(key)).match(request, { ignoreSearch: true });
        if (old) return old;
      }
      throw error;
    }
  })());
});
