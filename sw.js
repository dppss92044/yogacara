const CACHE="yogacara-v148-auto-update-1";
const FILES=["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "data/fontkit.umd.min.js", "data/heil.woff2", "data/kai2.woff2", "data/kepan-pdf.js", "data/kepan.pdf", "data/ming.woff2", "data/notes-01.js", "data/notes-02.js", "data/notes-03.js", "data/notes-04.js", "data/notes-05.js", "data/notes-06.js", "data/notes-07.js", "data/notes-08.js", "data/notes-09.js", "data/notes-10.js", "data/notes-11.js", "data/notes-12.js", "data/notes-13.js", "data/notes-14.js", "data/notes-15.js", "data/notes-16.js", "data/notes-17.js", "data/notes-18.js", "data/notes-19.js", "data/notes-20.js", "data/pdf-font-hei.js", "data/pdf-font-kai.js", "data/pdf-font-ming.js", "data/pdf-font-study.js", "data/pdf-lib.min.js", "data/study-font-LICENSE.txt"];

self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  let next = 0;
  try {
    await Promise.all(Array.from({length: 4}, async () => {
      while (next < FILES.length) {
        const file = FILES[next++];
        const url = new URL(file, self.registration.scope);
        const res = await fetch(new Request(url, {cache: 'reload'}));
        if (!res.ok) throw Error(file);
        await cache.put(url, res);
      }
    }));
    await self.skipWaiting();
  } catch (err) {
    await caches.delete(CACHE);
    throw err;
  }
})()));

self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) {
    if (key.startsWith('yogacara-') && key !== CACHE) await caches.delete(key);
  }
  await self.clients.claim();
})()));

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;

  // 頁面導覽：有網路時優先拿 GitHub 最新版；離線時退回已快取版本。
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const fresh = await fetch(new Request(event.request, {cache: 'no-cache'}));
        if (fresh.ok) await cache.put(new URL('index.html', self.registration.scope), fresh.clone());
        return fresh;
      } catch (err) {
        const shell = await cache.match(new URL('index.html', self.registration.scope));
        if (shell) return shell;
        throw err;
      }
    })());
    return;
  }

  // 其他檔案：先立即使用離線快取；有網路時背景檢查並更新快取。
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(event.request, {ignoreSearch: true});
    if (hit) {
      event.waitUntil((async () => {
        try {
          const fresh = await fetch(new Request(event.request, {cache: 'no-cache'}));
          if (fresh.ok) await cache.put(event.request, fresh);
        } catch (_) {}
      })());
      return hit;
    }
    try {
      const fresh = await fetch(event.request);
      if (fresh.ok) await cache.put(event.request, fresh.clone());
      return fresh;
    } catch (err) {
      throw err;
    }
  })());
});
