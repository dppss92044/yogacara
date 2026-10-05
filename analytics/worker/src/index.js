// W001 Analytics v2 接收端（Cloudflare Worker + D1）。決定見 DECISIONS.md D040–D060。
// 原則：嚴格 payload 允許清單；城市由伺服器端依 request.cf 取得；不讀取、不儲存、不記錄任何網路位址、
// User-Agent、其他標頭或請求內容；不使用任何日誌輸出。
import { json, sameSecret } from './common.js';
import { collect, forget, presence } from './ingest.js';
import { ROUTES } from './admin.js';
import { rollup, cleanup, purgePresence } from './cron.js';

export { cityLabel, weekKey, periodRange, taipeiDay } from './common.js';
export { cleanup, rollup, purgePresence };

const preflight = (env, methods) => new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN, 'Access-Control-Allow-Methods': methods, 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', 'Vary': 'Origin' } });

async function authed(request, env) {
  const auth = request.headers.get('Authorization') || '';
  return !!env.ADMIN_TOKEN && auth.startsWith('Bearer ') && await sameSecret(auth.slice(7), env.ADMIN_TOKEN);
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url), path = url.pathname;
      if (path === '/health') return new Response('ok');
      if (path === '/v' || path === '/forget' || path === '/p') {
        if (request.method === 'OPTIONS') return preflight(env, 'POST');
        if (request.method !== 'POST') return new Response(null, { status: 405 });
        return await (path === '/v' ? collect : path === '/p' ? presence : forget)(request, env);
      }
      if (ROUTES[path]) {
        if (request.method !== 'GET') return new Response(null, { status: 405 });
        if (!(await authed(request, env))) return new Response(null, { status: 401 });
        return await ROUTES[path](url, env);
      }
      return new Response(null, { status: 404 });
    } catch (_) {
      return new Response(null, { status: 500 });
    }
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      if (event.cron === '0 * * * *') return purgePresence(env);
      await rollup(env); await cleanup(env);
    })());
  },
};
