// 產生 CLI 測試用的固定回應（由真正的 Worker 程式碼＋node:sqlite 模擬 D1 產生，避免手寫資料與實際格式脫節）。
// 執行：node analytics/worker/test/make-cli-fixtures.mjs   （固定時間 2026-10-05；虛構資料）
import { writeFileSync, mkdirSync } from 'node:fs';
import { makeEnv, ID, post, beat, admin, at } from './helpers.mjs';

const OUT = new URL('../../cli/fixtures/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const { env } = makeEnv();
const base = (n, over = {}) => ({ v: 4, id: ID(n), o: 2, s: 900, d: ['phone', 'tablet', 'desktop'][n % 3], m: n % 2 ? 'pwa' : 'web', t: 'f',
  f: { 'font.size.up': 1 + (n % 3), 'search.submit': 2, 'search.ok': 1, 'search.zero': 1, 'dict.lookup.dbl': 3, 'dict.hit': 2, 'dict.miss': 1, 'nav.juan_open.rail': 4, 'kepan.node_click': 3, 'kepan.click.rail': 3, 'edition.select.h': 1, 'export.custom': 1, 'content.px.on': 1 },
  ss: [['font.size', '1.3', 300], ['zoom.m', '150', 200], ['orient', 'landscape', 400]],
  r: [['h', 1, 1, 12, 400, 1], ['z', 0, 0, 3, 300, 1]], nd: [['h64432c', [[20233, 2], [20240, 1]]]],
  q: { t: [['般若', 1], ['阿賴耶', 0]], rp: [['阿賴耶', '阿賴耶識']] }, k: { t: ['阿賴耶識'], m: ['無此詞'], j: [[12, 3]] },
  x: [{ k: 'custom', fmt: ['pdf', 'md'], pt: ['text', 'kp'], pk: 'zip', sc: 'range', a: 1, b: 3, lb: '', ok: 1 }], hv: ['1.91'], ...over });
const fx = {};
await at('2026-10-05T04:00:00Z', async () => {
  for (let n = 1; n <= 6; n++) await post(env, base(n), { cf: { country: 'TW', city: n % 2 ? 'Taoyuan' : 'Taipei' } });
  for (let n = 1; n <= 6; n++) await beat(env, { v: 1, id: ID(n), d: 'phone', m: 'web' });
  const put = async (name, path) => { fx[name] = await admin(env, path); };
  await put('overview', '/admin/overview?range=today'); await put('instances', '/admin/instances?range=today&limit=5');
  const code = fx.instances.instances[0].code;
  await put('instance', `/admin/instance?code=${code}&day=2026-10-05`);
  for (const [k, p] of [['reading', '/admin/reading?range=today&by=juan'], ['reading_edition', '/admin/reading?range=today&by=edition'], ['nodes', '/admin/nodes?range=today'], ['features_kepan', '/admin/features?range=today&prefix=kepan.&all=1'],
    ['features_edition', '/admin/features?range=today&prefix=edition.&all=1'], ['features', '/admin/features?range=today'], ['features_all', '/admin/features?range=today&all=1'], ['features_unused', '/admin/features?range=today&unused=1'],
    ['notes', '/admin/notes?range=today'], ['nav', '/admin/nav?range=today'], ['display', '/admin/display?range=today'], ['font', '/admin/font?range=today'], ['label', '/admin/label?range=today'],
    ['search', '/admin/search?range=today'], ['dict', '/admin/dict?range=today'], ['export', '/admin/export?range=today'], ['trend', '/admin/trend?days=7'], ['size', '/admin/size'], ['registry', '/admin/registry'], ['presence', '/admin/presence']]) await put(k, p);
});
writeFileSync(new URL('canned.json', OUT), JSON.stringify(fx, null, 1));
console.log('fixtures:', Object.keys(fx).join(', '));
