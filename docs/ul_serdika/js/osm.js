// Loading OpenStreetMap data through the Overpass API and turning it into local features in metres.
// Coordinates: x = east, z = south (three.js: y is up, -z is north).

export const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

// Search window for the address: the centre of Sofia.
const SOFIA_BBOX = '42.680,23.295,42.715,23.350';
// Used only when the address cannot be found in OSM.
export const FALLBACK_CENTER = { lat: 42.69991, lon: 23.32464 }; // building way/303883064

export const LOAD_RADIUS = 300; // metres of data around the address
export const WALK_RADIUS = 200; // metres you may walk away from the address

async function overpass(query, onMirror) {
  let lastErr;
  for (const url of MIRRORS) {
    onMirror && onMirror(new URL(url).host);
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 60000);
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: ctl.signal,
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const j = await res.json();
      if (!j || !Array.isArray(j.elements)) throw new Error('bad response');
      return j;
    } catch (e) {
      lastErr = e;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr || new Error('Overpass unavailable');
}


export function wayCenter(geom) {
  let x = 0, y = 0, n = 0;
  for (const p of geom) if (p) { x += p.lat; y += p.lon; n++; }
  return n ? { lat: x / n, lon: y / n } : null;
}

// Finds Serdika 20. Returns { lat, lon, building (OSM way/relation or null), street: [ {lat,lon}... ], source }
export async function geocode(onMirror) {
  const q = `[out:json][timeout:30];
(
  nwr["addr:street"~"Сердика"]["addr:housenumber"~"^20([^0-9]|$)"](${SOFIA_BBOX});
  way["highway"]["name"~"Сердика"](${SOFIA_BBOX});
);
out geom;`;
  const j = await overpass(q, onMirror);
  const addr = j.elements.filter((e) => e.tags && e.tags['addr:housenumber']);
  addr.sort((a, b) => (a.tags['addr:housenumber'] === '20' ? 0 : 1) - (b.tags['addr:housenumber'] === '20' ? 0 : 1)
    || (a.tags.building ? 0 : 1) - (b.tags.building ? 0 : 1));
  const streets = j.elements.filter((e) => e.type === 'way' && e.tags && e.tags.highway && /Сердика/.test(e.tags.name || ''));
  let pt = null, osmId = null;
  if (addr.length) {
    const a = addr[0];
    osmId = a.type + '/' + a.id;
    if (a.type === 'node') pt = { lat: a.lat, lon: a.lon };
    else if (a.geometry) pt = wayCenter(a.geometry);
    else if (a.members) pt = wayCenter(a.members.flatMap((m) => m.geometry || []));
    else if (a.bounds) pt = { lat: (a.bounds.minlat + a.bounds.maxlat) / 2, lon: (a.bounds.minlon + a.bounds.maxlon) / 2 };
  }
  let source = 'address';
  if (!pt && streets.length) {
    // middle of the street as a fallback
    const all = streets.flatMap((s) => s.geometry);
    pt = all[Math.floor(all.length / 2)];
    source = 'street';
  }
  if (!pt) { pt = FALLBACK_CENTER; source = 'fallback'; }
  return { lat: pt.lat, lon: pt.lon, osmId, source };
}

export async function fetchArea(lat, lon, onMirror) {
  const R = LOAD_RADIUS;
  const a = `(around:${R},${lat},${lon})`;
  // geometry is clipped to a wider box so that huge areas do not blow up the download
  const dLat = 700 / 111320, dLon = 700 / (111320 * Math.cos(lat * Math.PI / 180));
  const bb = `${(lat - dLat).toFixed(6)},${(lon - dLon).toFixed(6)},${(lat + dLat).toFixed(6)},${(lon + dLon).toFixed(6)}`;
  const q = `[out:json][timeout:120];
(
  way["building"]${a};
  way["building:part"]${a};
  relation["building"]${a};
  relation["building:part"]${a};
  way["highway"]${a};
  way["railway"]${a};
  way["area:highway"]${a};
  way["landuse"]${a};
  way["leisure"]${a};
  way["natural"]${a};
  way["amenity"]${a};
  way["place"="square"]${a};
  way["man_made"]${a};
  way["barrier"]${a};
  way["historic"]${a};
  way["power"]${a};
  relation["type"="multipolygon"]["landuse"]${a};
  relation["type"="multipolygon"]["leisure"]${a};
  relation["type"="multipolygon"]["place"]${a};
  relation["type"="multipolygon"]["highway"]${a};
  relation["type"="multipolygon"]["area:highway"]${a};
  relation["type"="multipolygon"]["amenity"]${a};
  node${a}[~"^(natural|highway|amenity|shop|tourism|historic|leisure|office|craft|railway|public_transport|emergency|man_made|entrance|healthcare|club|barrier|advertising)$"~"."];
  node${a}["addr:housenumber"];
);
out geom(${bb});`;
  return overpass(q, onMirror);
}

// ---------------------------------------------------------------- parsing
export function makeProjection(lat0, lon0) {
  const R = 6378137, k = Math.PI / 180, c = Math.cos(lat0 * k);
  return {
    fwd: (lat, lon) => [(lon - lon0) * k * R * c, -(lat - lat0) * k * R],
    inv: (x, z) => ({ lat: lat0 - z / (k * R), lon: lon0 + x / (k * R * c) }),
  };
}

export function parseNum(v) {
  if (v == null) return NaN;
  const m = String(v).replace(',', '.').match(/-?\d+(\.\d+)?/);
  if (!m) return NaN;
  let n = parseFloat(m[0]);
  if (/ft|'/.test(v)) n *= 0.3048;
  return n;
}

function closeRing(r) {
  if (r.length > 2) {
    const a = r[0], b = r[r.length - 1];
    if (Math.abs(a[0] - b[0]) < 0.01 && Math.abs(a[1] - b[1]) < 0.01) r.pop();
  }
  return r;
}

// Joins way pieces of a multipolygon into closed rings.
function assembleRings(pieces) {
  const rings = [];
  const left = pieces.map((p) => p.slice()).filter((p) => p.length >= 2);
  const same = (a, b) => Math.abs(a[0] - b[0]) < 0.05 && Math.abs(a[1] - b[1]) < 0.05;
  while (left.length) {
    let cur = left.shift();
    let guard = 0;
    while (!same(cur[0], cur[cur.length - 1]) && guard++ < 500) {
      const end = cur[cur.length - 1];
      const i = left.findIndex((p) => same(p[0], end) || same(p[p.length - 1], end));
      if (i < 0) break;
      let p = left.splice(i, 1)[0];
      if (!same(p[0], end)) p = p.reverse();
      cur = cur.concat(p.slice(1));
    }
    if (same(cur[0], cur[cur.length - 1]) && cur.length >= 4) rings.push(closeRing(cur));
  }
  return rings;
}

export function parse(json, proj) {
  const P = (g) => (g ? proj.fwd(g.lat, g.lon) : null);
  const out = { areas: [], buildings: [], lines: [], nodes: [] };
  for (const e of json.elements) {
    const t = e.tags || {};
    if (e.type === 'node') {
      out.nodes.push({ id: e.id, tags: t, p: P(e), key: e.lat.toFixed(7) + ',' + e.lon.toFixed(7) });
      continue;
    }
    if (e.type === 'way' && e.geometry) {
      const hasGap = e.geometry.some((g) => !g);
      const pts = e.geometry.filter(Boolean).map(P);
      const keys = e.geometry.filter(Boolean).map((g) => g.lat.toFixed(7) + ',' + g.lon.toFixed(7));
      if (pts.length < 2) continue;
      const closed = keys.length > 3 && keys[0] === keys[keys.length - 1] && !hasGap;
      const f = { id: 'w' + e.id, tags: t, pts, keys, closed };
      if (t.building || t['building:part']) {
        if (!closed) continue;
        out.buildings.push({ ...f, outer: closeRing(pts.slice()), holes: [] });
      } else {
        const areaTag = t.landuse || t.leisure || t.natural || t.amenity || t.place || t.man_made || t.historic;
        const isArea = closed && t.area !== 'no' && t.natural !== 'tree_row'
          && (t.area === 'yes' || t['area:highway'] || (areaTag && !t.highway && !t.barrier && !t.railway));
        if (isArea) out.areas.push({ ...f, outer: closeRing(pts.slice()), holes: [] });
        else if (hasGap && areaTag && !t.highway && !t.barrier && !t.railway) out.areas.push({ ...f, outer: pts.slice(), holes: [] }); // clipped area
        if ((t.highway && !isArea) || t.railway || t.barrier || t.natural === 'tree_row' || t.power === 'line') out.lines.push(f);
      }
      continue;
    }
    if (e.type === 'relation' && e.members) {
      const outer = [], inner = [];
      for (const m of e.members) {
        if (m.type !== 'way' || !m.geometry) continue;
        const pts = m.geometry.filter(Boolean).map(P);
        (m.role === 'inner' ? inner : outer).push(pts);
      }
      const outs = assembleRings(outer), ins = assembleRings(inner);
      if (!outs.length) continue;
      for (const o of outs) {
        const f = { id: 'r' + e.id, tags: t, outer: o, holes: ins.filter((h) => pointInRing(h[0], o)) };
        if (t.building || t['building:part']) out.buildings.push(f); else out.areas.push(f);
      }
    }
  }
  return out;
}

export function pointInRing(p, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i], [xj, zj] = ring[j];
    if ((zi > p[1]) !== (zj > p[1]) && p[0] < ((xj - xi) * (p[1] - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

// ---------------------------------------------------------------- cache
const CACHE_KEY = 'serdika20-osm-v1';
export function readCache() {
  try {
    const s = localStorage.getItem(CACHE_KEY);
    if (!s) return null;
    const c = JSON.parse(s);
    if (!c || !c.data || Date.now() - c.t > 30 * 86400e3) return null;
    return c;
  } catch { return null; }
}
export function writeCache(center, data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), center, data })); } catch { /* full or blocked */ }
}
export function clearCache() { try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ } }

// A snapshot shipped next to the page (data/osm.json), made with tools/fetch-osm.sh. Optional.
export async function readSnapshot() {
  try {
    const r = await fetch('data/osm.json', { cache: 'no-cache' });
    if (!r.ok) return null;
    const j = await r.json();
    return j && j.center && j.data ? j : null;
  } catch { return null; }
}
