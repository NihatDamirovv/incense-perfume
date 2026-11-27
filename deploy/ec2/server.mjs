import { Miniflare } from 'miniflare';
import { readFile, readdir } from 'node:fs/promises';
import { parseEnv } from 'node:util';

const secrets = parseEnv(await readFile('/etc/incense-parfume.env', 'utf8'));
if (!secrets.ADMIN_PASSWORD) throw new Error('ADMIN_PASSWORD is required');
const serverRoot = new URL('./dist/server/', import.meta.url).pathname;
const files = await readdir(serverRoot, { recursive: true });
const moduleFiles = ['index.js', ...files.filter(f => f !== 'index.js' && /\.(m?js)$/.test(f))];
const mf = new Miniflare({
  name: 'incense-parfume',
  host: '127.0.0.1',
  port: 9083,
  modules: moduleFiles.map(file => ({ type: 'ESModule', path: serverRoot + file })),
  modulesRoot: serverRoot,
  compatibilityDate: '2026-05-15',
  compatibilityFlags: ['nodejs_compat'],
  bindings: { ADMIN_PASSWORD: secrets.ADMIN_PASSWORD },
  d1Databases: { DB: '00000000-0000-4000-8000-000000000000' },
  r2Buckets: { BUCKET: 'site-creator-r2' },
  d1Persist: '/var/lib/incense-parfume/d1',
  r2Persist: '/var/lib/incense-parfume/r2',
  cachePersist: '/var/lib/incense-parfume/cache',
  assets: {
    directory: new URL('./dist/client/', import.meta.url).pathname,
    binding: 'ASSETS',
    routerConfig: { has_user_worker: true },
  },
  cf: false,
});
await mf.ready;
console.log('Incense Parfume listening on 127.0.0.1:9083');
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => {
  await mf.dispose();
  process.exit(0);
});
