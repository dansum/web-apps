// Снимка отблизо на обект в преживяване (за преглед на око).
// Употреба: NODE_PATH=$(npm root -g) node tools/look.mjs <exp> <pickId> <out.png> [dist] [height]  (сървър на :8765, корен docs/)
// Снимка отблизо на обект: node look.mjs <exp> <pickId> <out> [dist] [height]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , exp, id, out, dist = '3', hgt = '1.5'] = process.argv;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto('http://localhost:8765/history/xp.html?exp=' + exp); await p.waitForTimeout(2500);
await p.locator('.xp').scrollIntoViewIfNeeded();
await p.evaluate(([i, d, h]) => { const st = document.querySelector('#area').__demo.stage; let o = null; st.scene.traverse((x) => { if (!o && x.userData.pickId === i) o = x; }); document.querySelectorAll('.bubble').forEach((e) => e.remove()); st.focusOn(o, { dist: +d, height: +h, lift: 0.4, keepFollow: false }); }, [id, dist, hgt]);
await p.waitForTimeout(1500);
await p.locator('.xp-stage').screenshot({ path: out });
await b.close();
