// Downloads the OpenStreetMap data around 20 Serdika St and saves it as data/osm.json,
// so that the page loads fast and does not depend on the Overpass servers.
// Uses the same queries as the page (js/osm.js). Requests go through curl, so proxies work.
//   node tools/fetch-osm.mjs          (run from docs/ul_serdika)
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

globalThis.fetch = async (url, opts = {}) => {
  const out = execFileSync('curl', ['-s', '-m', '180', '-A', 'serdika20-snapshot/1.0', '-w', '\n%{http_code}', '--data-binary', opts.body || '', url], { maxBuffer: 1 << 28 }).toString();
  const i = out.lastIndexOf('\n'), status = parseInt(out.slice(i + 1), 10), body = out.slice(0, i);
  console.error('    HTTP', status, body.length, 'bytes');
  return { ok: status >= 200 && status < 300, status, json: async () => JSON.parse(body) };
};

const here = dirname(fileURLToPath(import.meta.url));
const { geocode, fetchArea } = await import(join(here, '../js/osm.js'));
const log = (h) => console.error('  server:', h);
console.error('Looking up the address…');
const retry = async (fn) => { for (let i = 0; ; i++) { try { return await fn(); } catch (e) { if (i >= 3) throw e; console.error('  failed (' + e.message + '), retrying…'); await new Promise((r) => setTimeout(r, 5000 * (i + 1))); } } };
const center = await retry(() => geocode(log));
console.error('Found', center);
console.error('Downloading the area…');
const data = await retry(() => fetchArea(center.lat, center.lon, log));
const slim = { version: data.version, generator: data.generator, osm3s: data.osm3s, elements: data.elements };
mkdirSync(join(here, '../data'), { recursive: true });
writeFileSync(join(here, '../data/osm.json'), JSON.stringify({ t: new Date().toISOString(), center, data: slim }));
console.error(`Saved ${data.elements.length} elements to data/osm.json`);
