#!/usr/bin/env node
/* Прави страница за споделяне и картинка 1200×630 за всяка история.
     i/<id>.html      – мета данни за социалните мрежи и пренасочване към story.html?id=<id>
     media/og/<id>.jpg – картинката, която мрежите показват
   Пуска се след промяна в историите:  node tools/build_share.js   (нужен е Playwright) */
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), BASE = 'https://dansum.github.io/web-apps/bum/';
global.window = {};
['ten', 'sto-a', 'sto-b', 'sto-c', 'sto-d', 'sto-e', 'kilo'].forEach(f => require(path.join(ROOT, 'data', f + '.js')));
const people = [].concat(window.BUM_TEN, window.BUM_STO, window.BUM_KILO);
const FIELDS = { math: 'Математика', cs: 'Информатика', physics: 'Физика', astro: 'Космос и астрономия', chem: 'Химия', bio: 'Биология', med: 'Медицина', eng: 'Инженерство', econ: 'Икономика', games: 'Шах и игри', edu: 'Образование', earth: 'Науки за Земята' };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const years = p => p.bornLabel ? p.bornLabel : (p.bornApprox && !p.died) ? (p.sex === 'f' ? 'съвременничка' : 'съвременник') : p.died ? (p.bornApprox ? 'ок. ' : '') + p.born + (p.bornApprox || p.diedApprox ? ' – ' : '–') + (p.diedApprox ? 'ок. ' : '') + p.died : 'р. ' + p.born;
const initials = n => n.split(/\s+/).map(w => w[0]).slice(0, 2).join('');
const font = f => 'data:font/woff2;base64,' + fs.readFileSync(path.join(ROOT, 'fonts', f)).toString('base64');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await pg.setContent('<html><body></body></html>');
  await pg.addScriptTag({ path: path.join(ROOT, 'js', 'art.js') });
  for (const p of people) {
    const html = `<style>@font-face{font-family:Lato;src:url(${font('lato-bold.woff2')});font-weight:700 900}@font-face{font-family:Lato;src:url(${font('lato-regular.woff2')});font-weight:400}
      html,body{margin:0}body{width:1200px;height:630px;display:grid;grid-template-columns:520px 680px;font-family:Lato,sans-serif;background:#0A2A66;color:#fff}
      .art{position:relative;overflow:hidden}.art svg{position:absolute;inset:0;width:100%;height:100%}
      .pt{position:absolute;left:50%;top:50%;width:240px;height:240px;transform:translate(-50%,-50%);border-radius:50%;box-shadow:0 0 0 8px #fff;overflow:hidden;background:rgba(8,18,48,.92);display:grid;place-items:center;font-size:96px;font-weight:900}
      .pt svg{position:absolute;inset:0;width:100%;height:100%}
      .tx{padding:56px 56px 40px;display:flex;flex-direction:column;gap:18px}
      .brand{font-size:30px;font-weight:900;color:#14BF96}.brand span{color:#fff;font-weight:700;font-size:22px;margin-left:10px}
      .f{font-size:22px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#FA961E}
      h1{margin:0;font-size:${p.title.length > 52 ? 50 : 58}px;line-height:1.1;font-weight:900}
      .nm{font-size:30px;font-weight:700;margin-top:auto}.nm span{font-weight:400;opacity:.8}
      .fx{display:inline-block;background:#FFE14D;color:#241c00;font-weight:900;font-size:20px;padding:6px 12px;border-radius:8px;align-self:flex-start}</style>
      <div class="art">${window_svg(p)}<div class="pt">${p.avatar ? '' : esc(initials(p.name))}</div></div>
      <div class="tx"><div class="brand">БУМ<span>Български успехи с математика</span></div><div class="f">${esc(FIELDS[p.field] || '')}</div><h1>${esc(p.title)}</h1>
      ${p.fictional ? '<div class="fx">⚠ Примерна история за измислен човек</div>' : ''}<div class="nm">${esc(p.name)} <span>· ${esc(years(p))}</span></div></div>`;
    await pg.evaluate(([h, pp]) => { document.body.outerHTML = '<body>' + h + '</body>'; const s = document.querySelector('.art'); s.insertAdjacentHTML('afterbegin', window.BUMArt.svg(pp)); if (pp.avatar) document.querySelector('.pt').insertAdjacentHTML('afterbegin', window.BUMArt.avatar(pp.avatar)); }, [html, { id: p.id, field: p.field, motif: p.motif, art: p.art, avatar: p.avatar }]);
    await pg.waitForTimeout(60);
    await pg.screenshot({ path: path.join(ROOT, 'media', 'og', p.id + '.jpg'), type: 'jpeg', quality: 72 });
    const url = BASE + 'i/' + p.id + '.html', target = '../story.html?id=' + encodeURIComponent(p.id);
    const title = p.name + ' – ' + p.title + ' · БУМ';
    fs.writeFileSync(path.join(ROOT, 'i', p.id + '.html'), `<!doctype html>
<html lang="bg">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(p.lede)}">
<link rel="canonical" href="${BASE}story.html?id=${encodeURIComponent(p.id)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="БУМ – Български успехи с математика">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(p.lede)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${BASE}media/og/${p.id}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="bg_BG">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url=${target}">
<script>location.replace(${JSON.stringify(target)});</script>
</head>
<body><p><a href="${target}">${esc(p.name)} – ${esc(p.title)}</a></p></body>
</html>
`);
  }
  await b.close();
  /* Карта на сайта за търсачките: основните страници и всички истории. */
  const pages = ['', 'deset.html', 'sto.html', 'kilo.html', 'karta.html', 'statistika.html', 'za-proekta.html'];
  const urls = pages.map(u => BASE + u).concat(people.map(p => BASE + 'story.html?id=' + encodeURIComponent(p.id)));
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u => '  <url><loc>' + u.replace(/&/g, '&amp;') + '</loc></url>').join('\n') + '\n</urlset>\n');
  console.log('готово:', people.length, '· sitemap:', urls.length);
})();
function window_svg() { return ''; }
