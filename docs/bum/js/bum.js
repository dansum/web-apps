/* БУМ – общ код за всички страници. */
(function () {
  'use strict';
  var Art = window.BUMArt;

  /* ---------- тема ---------- */
  var THEMES = ['auto', 'light', 'dark'], ICON = { auto: '◐', light: '☀', dark: '☾' }, LABEL = { auto: 'Тема: автоматична', light: 'Тема: светла', dark: 'Тема: тъмна' };
  function getTheme() { try { var t = localStorage.getItem('bum-theme'); if (THEMES.indexOf(t) >= 0) return t; } catch (e) {} return 'auto'; }
  function applyTheme(t) {
    if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
    var b = document.getElementById('theme'); if (b) { b.textContent = ICON[t]; b.title = LABEL[t]; b.setAttribute('aria-label', LABEL[t]); }
  }
  applyTheme(getTheme());

  /* Страницата за дарения на „Образование без раници“ – сменя се само тук. */
  var DONATE_URL = 'https://obr.education/stani-daritel/';

  /* ---------- данни ---------- */
  var FIELDS = {
    math: 'Математика', cs: 'Информатика', physics: 'Физика', astro: 'Космос и астрономия', chem: 'Химия',
    bio: 'Биология', med: 'Медицина', eng: 'Инженерство', econ: 'Икономика', games: 'Шах и игри',
    edu: 'Образование', earth: 'Науки за Земята', business: 'Бизнес'
  };
  var SECTIONS = {
    ten: { name: '10 БУМа', href: 'deset.html' },
    sto: { name: 'СтоБУМ', href: 'sto.html' },
    kilo: { name: 'КилоБУМ', href: 'kilo.html' }
  };
  var LIVES = { bg: 'В България', abroad: 'В чужбина', both: 'И двете' };
  var COUNTRIES = ['САЩ', 'Русия', 'Австрия', 'Молдова', 'Германия', 'Франция', 'Швейцария', 'Румъния', 'Турция', 'Гърция', 'Сърбия', 'Северна Македония'];
  /* Град на раждане, изведен от полето place: „Студен извор, Трънско“ → „Студен извор“; „Виена, Австрия“ → „Виена (Австрия)“. */
  function cityOf(place) {
    if (!place || /^(България|Първо българско царство)$/.test(place)) return 'неизвестно';
    var parts = place.split(/,\s*/), last = parts[parts.length - 1], c = parts[0].replace(/^(село|гр\.)\s+/, '');
    return parts.length > 1 && COUNTRIES.indexOf(last) >= 0 ? c + ' (' + last + ')' : c;
  }
  function tag(list, sec) {
    var F = window.BUM_FACETS || {};
    return (list || []).map(function (p, i) {
      p.sec = sec; p.rank = i + 1; if (!FIELDS[p.field]) p.field = 'math';
      var f = F[p.id] || {};
      p.fields = (f.s && f.s.length ? f.s : [p.field]).filter(function (k) { return FIELDS[k]; });
      if (p.fields.indexOf(p.field) < 0) p.fields.unshift(p.field);
      p.lives = f.lv || 'bg'; p.city = cityOf(p.place);
      return p;
    });
  }
  var TEN = tag(window.BUM_TEN, 'ten');
  var STO = tag(window.BUM_STO, 'sto').sort(function (a, b) { return (a.born || 0) - (b.born || 0); });
  var KILO = tag(window.BUM_KILO, 'kilo');
  var ALL = TEN.concat(STO, KILO), BY = {};
  ALL.forEach(function (p) { BY[p.id] = p; });

  /* ---------- помощни ---------- */
  function el(t, cls, html) { var n = document.createElement(t); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  var esc = Art.esc;
  function shuffle(a, r) { a = a.slice(); r = r || Math.random; for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function roman(n) { var v = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']], s = ''; v.forEach(function (x) { while (n >= x[0]) { s += x[1]; n -= x[0]; } }); return s; }
  /* Търсене: по отделни думи, без значение от реда, на кирилица или на латиница. */
  var LAT = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sht', ъ: 'a', ь: 'y', ю: 'yu', я: 'ya' };
  function lat(t) { return t.replace(/[а-я]/g, function (c) { return LAT[c] || c; }); }
  function norm(t) { return String(t || '').toLowerCase().replace(/ѝ/g, 'и').trim(); }
  function haystack(p) {
    if (!p._hay) { var h = norm([p.name, p.title, p.lede, (p.tags || []).join(' '), p.place || '', p.city || '', (p.fields || [p.field]).map(function (k) { return FIELDS[k]; }).join(' ')].join(' ')); p._hay = h + ' ' + lat(h); }
    return p._hay;
  }
  function textMatch(p, q) { var h = haystack(p); return q.split(/\s+/).every(function (w) { return !w || h.indexOf(w) >= 0 || h.indexOf(lat(w)) >= 0; }); }
  function century(p) { return p.born ? Math.floor((p.born - 1) / 100) + 1 : 0; }
  function years(p) {
    if (p.bornLabel) return p.bornLabel;
    if (p.bornApprox && !p.died) return p.sex === 'f' ? 'съвременничка' : 'съвременник';
    var b = p.born ? (p.bornApprox ? 'ок. ' : '') + p.born : '?';
    if (p.died) return b + (p.bornApprox || p.diedApprox ? ' – ' : '–') + (p.diedApprox ? 'ок. ' : '') + p.died;
    return 'р. ' + b;
  }
  function initials(n) { return n.split(/\s+/).map(function (w) { return w.charAt(0); }).slice(0, 2).join(''); }
  function url(p) { return 'story.html?id=' + encodeURIComponent(p.id); }
  function fieldTag(p) { return '<span class="field-tag f-' + p.field + '">' + FIELDS[p.field] + '</span>'; }

  /* Блок „графика + портрет“ */
  function artBlock(p, cls) {
    var d = el('div', 'art' + (cls ? ' ' + cls : ''), Art.svg({ id: p.id, field: p.field, motif: p.motif, art: p.art }));
    var pr = el('div', 'portrait');
    if (p.avatar) pr.innerHTML = Art.avatar(p.avatar);
    /* Докато няма снимка: илюстрация на работата на човека (js/emblems.js). */
    else { pr.innerHTML = '<div class="emb" role="img" aria-label="' + esc(window.BUMEmblem ? BUMEmblem.label(p) : p.name) + '">' + (window.BUMEmblem ? BUMEmblem.svg(p) : esc(initials(p.name))) + '</div>'; pr.setAttribute('data-pid', p.id); }
    d.appendChild(pr);
    return d;
  }

  /* ---------- снимки от Уикипедия ----------
     Браузърът пита API-то на Уикипедия за главната (свободна) снимка на статията.
     Резултатът се пази в localStorage за 7 дни. Ако няма снимка, остават инициалите. */
  /* Снимки. Ред на търсене: ръчен файл (photoFile) → външна снимка (photoUrl) → главната снимка на статията
     в Уикипедия (bg, после en) → изображението (P18) в Уикидата (wikidata или връзката от статията).
     Всеки запис в кеша има свое време t и изтича след 7 дни. „Без снимка“ (s: '') се записва само след
     успешни отговори, така че мрежова грешка не скрива снимките за седмица. */
  var PKEY = 'bum-photos-v3', cache = {}, TTL = 7 * 864e5;
  try { var raw = JSON.parse(localStorage.getItem(PKEY) || '{}'); Object.keys(raw).forEach(function (k) { if (raw[k] && Date.now() - raw[k].t < TTL) cache[k] = raw[k]; }); } catch (e) {}
  function saveCache() { try { localStorage.setItem(PKEY, JSON.stringify(cache)); } catch (e) {} }
  function commonsEntry(file) { return { s: 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(file) + '?width=480', l: 'commons', f: file, t: Date.now() }; }
  ALL.forEach(function (p) {
    if (p.photoFile) cache[p.id] = commonsEntry(p.photoFile);
    else if (p.photoUrl) cache[p.id] = { s: p.photoUrl, l: 'ext', src: p.photoSource || '', t: Date.now(), m: 1 };
    else if (p.noPhoto) cache[p.id] = { s: '', t: Date.now() };
  });
  var pending = {}, answered = {}, qid = {};
  function hasSource(p) { return !!(p.wikidata || (p.wiki && (p.wiki.bg || p.wiki.en))); }
  function fetchLang(lang, people) {
    var chunks = []; for (var i = 0; i < people.length; i += 45) chunks.push(people.slice(i, i + 45));
    return Promise.all(chunks.map(function (ch) {
      var q = 'https://' + lang + '.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&prop=pageimages%7Cpageprops&ppprop=wikibase_item&piprop=thumbnail%7Cname&pithumbsize=480&titles=' +
        encodeURIComponent(ch.map(function (p) { return p.wiki[lang]; }).join('|'));
      return fetch(q).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (j) {
        if (j.error || !j.query) throw new Error('api');
        var qu = j.query, map = {};
        (qu.normalized || []).forEach(function (n) { map[n.from] = n.to; });
        var red = {}; (qu.redirects || []).forEach(function (n) { red[n.from] = n.to; });
        var pages = {}; Object.keys(qu.pages || {}).forEach(function (k) { var pg = qu.pages[k]; pages[pg.title] = pg; });
        ch.forEach(function (p) {
          var t = p.wiki[lang]; t = map[t] || t; t = red[t] || t; var pg = pages[t];
          if (pg && pg.thumbnail) cache[p.id] = { s: pg.thumbnail.source, l: lang, a: pg.title, f: pg.pageimage || '', t: Date.now() };
          else {
            (answered[p.id] = answered[p.id] || {})[lang] = 1;
            if (pg && pg.pageprops && pg.pageprops.wikibase_item && !qid[p.id]) qid[p.id] = pg.pageprops.wikibase_item;
          }
        });
      }).catch(function () {});
    }));
  }
  /* Изображение (P18) от Уикидата – за хора без статия или със статия без снимка. */
  function fetchWikidata(people) {
    var ids = people.map(function (p) { return p.wikidata || qid[p.id]; }).filter(Boolean);
    if (!ids.length) return Promise.resolve();
    var chunks = []; for (var i = 0; i < ids.length; i += 45) chunks.push(ids.slice(i, i + 45));
    return Promise.all(chunks.map(function (ch) {
      return fetch('https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*&props=claims&ids=' + ch.join('|'))
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (j) {
          if (j.error || !j.entities) throw new Error('api');
          var ents = j.entities;
          people.forEach(function (p) {
            var q = p.wikidata || qid[p.id], e = q && ents[q]; if (!e) return;
            (answered[p.id] = answered[p.id] || {}).wd = 1;
            var c = e.claims && e.claims.P18, f = c && c[0] && c[0].mainsnak && c[0].mainsnak.datavalue && c[0].mainsnak.datavalue.value;
            if (f && !cache[p.id]) cache[p.id] = commonsEntry(f);
          });
        }).catch(function () {});
    }));
  }
  function loadPhotos(root) {
    var nodes = Array.prototype.slice.call((root || document).querySelectorAll('[data-pid]'));
    var want = [];
    nodes.forEach(function (n) { var id = n.getAttribute('data-pid'); if (cache[id] && cache[id].s) put(n, cache[id]); else if (BY[id] && !pending[id] && hasSource(BY[id]) && !cache[id]) { want.push(BY[id]); pending[id] = 1; } });
    if (!want.length) return;
    var wk = function (p) { return p.wiki || {}; };
    fetchLang('bg', want.filter(function (p) { return wk(p).bg; })).then(function () {
      return fetchLang('en', want.filter(function (p) { return !cache[p.id] && wk(p).en; }));
    }).then(function () {
      return fetchWikidata(want.filter(function (p) { return !cache[p.id]; }));
    }).then(function () {
      want.forEach(function (p) {
        pending[p.id] = 0;
        var a = answered[p.id] || {}, w = wk(p), q = p.wikidata || qid[p.id];
        /* „Без снимка“ само ако всичко, което сме питали, е отговорило успешно. */
        if (!cache[p.id] && (!w.bg || a.bg) && (!w.en || a.en) && (!q || a.wd)) cache[p.id] = { s: '', t: Date.now() };
      });
      saveCache();
      document.querySelectorAll('[data-pid]').forEach(function (n) { var c = cache[n.getAttribute('data-pid')]; if (c && c.s) put(n, c); });
      document.dispatchEvent(new CustomEvent('bum-photos'));
    });
  }
  function put(node, c) {
    if (node.querySelector('img')) return;
    var img = new Image(); img.alt = ''; img.decoding = 'async'; img.referrerPolicy = 'no-referrer';
    img.onload = function () { img.className = 'on'; var m = node.querySelector('.emb, .mono'); if (m) m.remove(); };
    img.onerror = function () { img.remove(); };
    img.src = c.s; node.appendChild(img);
  }

  /* ---------- автор и лиценз на снимката (от Уикимедия) ---------- */
  function fileUrl(c) { return 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(c.f.replace(/ /g, '_')); }
  function creditHtml(c) {
    var nw = '<i class="sr"> (отваря се в нов раздел)</i>';
    if (c.l === 'ext') return 'Снимка: ' + (c.src ? '<a href="' + esc(c.src) + '" target="_blank" rel="noopener">източник' + nw + '</a>' : 'външен източник') + '. <span class="lic-check">Лицензионните права още се проверяват.</span>';
    if (!c.f) return 'Снимка: <a href="https://' + c.l + '.wikipedia.org/wiki/' + encodeURIComponent(c.a.replace(/ /g, '_')) + '" target="_blank" rel="noopener">Уикипедия' + nw + '</a>.';
    var parts = ['Снимка: ' + (c.au ? esc(c.au) : 'автор – виж файла')];
    if (c.lic) parts.push(c.licu ? '<a href="' + esc(c.licu) + '" target="_blank" rel="noopener">' + esc(c.lic) + nw + '</a>' : esc(c.lic));
    parts.push('<a href="' + fileUrl(c) + '" target="_blank" rel="noopener">Уикимедия Общомедия' + nw + '</a>');
    return parts.join(' · ') + '.';
  }
  /* Взима автора и лиценза на файла. Пази ги в кеша заедно със снимката. */
  /* Авторът от Общомедия често е суров текст („Unknown author“, няколко езика, повторения). */
  function cleanAuthor(t) {
    t = String(t || '').split(/\n+/).map(function (x) { return x.replace(/\s+/g, ' ').trim(); }).filter(Boolean)[0] || '';
    if (!t || /unknown|anonym|nieznany|неизвестен/i.test(t)) return 'неизвестен автор';
    t = t.replace(/\s*\(.*?\)\s*/g, ' ').trim();
    return t.length > 60 ? t.slice(0, 58).replace(/\s+\S*$/, '') + '…' : t;
  }
  function loadMeta(id, done) {
    var c = cache[id]; if (!c || !c.f || c.m || c.mp) return; c.mp = 1;
    var host = c.l === 'commons' ? 'commons.wikimedia.org' : c.l + '.wikipedia.org';
    fetch('https://' + host + '/w/api.php?action=query&format=json&origin=*&prop=imageinfo&iiprop=extmetadata&iiextmetadatafilter=Artist%7CLicenseShortName%7CLicenseUrl&titles=' + encodeURIComponent('File:' + c.f))
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) {
        var pg = j.query && j.query.pages, k = pg && Object.keys(pg)[0], ii = k && pg[k].imageinfo && pg[k].imageinfo[0], md = (ii && ii.extmetadata) || {};
        /* DOMParser не изпълнява и не зарежда нищо от HTML-а, който връща API-то. */
        var txt = function (h) { return (new DOMParser().parseFromString(h || '', 'text/html').body.textContent || '').replace(/\s+/g, ' ').trim(); };
        c.au = cleanAuthor(md.Artist && md.Artist.value ? (new DOMParser().parseFromString(md.Artist.value, 'text/html').body.innerText || txt(md.Artist.value)) : ''); c.lic = txt(md.LicenseShortName && md.LicenseShortName.value); c.licu = (md.LicenseUrl && md.LicenseUrl.value) || '';
        if (c.licu && !/^https?:\/\//.test(c.licu)) c.licu = 'https:' + c.licu;
        c.m = 1; delete c.mp; saveCache(); if (done) done();
      }).catch(function () { delete c.mp; });
  }

  /* ---------- шапка и долна част ---------- */
  function chrome(active) {
    var top = document.getElementById('top');
    if (top) {
      top.className = 'top';
      top.innerHTML = '<a class="skip" href="#main-content">Към съдържанието</a><div class="wrap"><a class="brand" href="index.html" aria-label="БУМ – начало">' + logo() +
        '<span><b>БУМ</b><small>Български успехи<br>с математика</small></span></a>' +
        '<nav class="nav" aria-label="Секции"><a href="deset.html"' + (active === 'ten' ? ' aria-current="page"' : '') + '>10 БУМа</a>' +
        '<a href="sto.html"' + (active === 'sto' ? ' aria-current="page"' : '') + '>СтоБУМ</a>' +
        '<a href="kilo.html"' + (active === 'kilo' ? ' aria-current="page"' : '') + '>КилоБУМ</a>' +
        '<a href="karta.html" class="nav-stats"' + (active === 'map' ? ' aria-current="page"' : '') + ' aria-label="Карта"><span aria-hidden="true">🕸</span><span class="lbl"> Карта</span></a>' +
        '<a href="statistika.html" class="nav-stats"' + (active === 'stats' ? ' aria-current="page"' : '') + ' aria-label="Статистика"><span aria-hidden="true">📊</span><span class="lbl"> Статистика</span></a>' +
        '<a href="za-proekta.html" class="nav-stats"' + (active === 'about' ? ' aria-current="page"' : '') + ' aria-label="За проекта"><span aria-hidden="true">ℹ️</span><span class="lbl"> За проекта</span></a></nav>' +
        '<button class="theme" id="theme" type="button"></button></div>';
      applyTheme(getTheme());
      document.getElementById('theme').addEventListener('click', function () {
        var t = THEMES[(THEMES.indexOf(getTheme()) + 1) % 3]; try { localStorage.setItem('bum-theme', t); } catch (e) {} applyTheme(t);
      });
    }
    var f = document.getElementById('foot');
    if (f) {
      f.className = 'foot';
      f.innerHTML = '<div class="obr-band"><div class="wrap"><p>БУМ е проект на „Образование без раници“ – сдружението, което превежда Кан Академия на български и помага на учители и ученици да учат умно с технологии.</p>' +
        '<a class="obr-link" href="' + DONATE_URL + '" target="_blank" rel="noopener" aria-label="Образование без раници – дари">' +
        '<img class="light" src="media/obr-logo.svg" alt="Образование без раници" width="189" height="44"><img class="dark" src="media/obr-logo-light.svg" alt="" width="189" height="44"><span class="give">Дари ♥</span></a></div></div>' +
        '<div class="wrap meta"><span><b>БУМ</b> – Български успехи с математика · истории за хора, които променят света с числа</span>' +
        '<span><a href="za-proekta.html">За проекта</a> · Снимки: Уикимедия Общомедия, свободни лицензи – авторът и лицензът са под снимката във всяка история · <a href="../">Още проекти</a> · <button type="button" class="ck" onclick="window.d4Consent&&d4Consent.reset()">Бисквитки</button></span></div>';
    }
  }
  /* Блок с 1–2 урока от Кан Академия (data/ka.js). */
  function kaBlock(key, title) {
    var list = (window.BUM_KA || {})[key];
    if (!list || !list.length) return el('div');
    var d = el('aside', 'ka');
    d.setAttribute('aria-label', 'Уроци в Кан Академия');
    d.innerHTML = '<img class="logo" src="media/khan-academy.svg" alt="Кан Академия" width="52" height="58">' +
      '<div><h2>' + esc(title || 'Научи математиката зад историята') + '</h2><p>Безплатни уроци с видео и упражнения в българската Кан Академия.</p><ul>' +
      list.map(function (x) {
        return '<li><a href="' + esc(x.u) + '" target="_blank" rel="noopener"><img src="media/khan-academy.svg" alt="" width="22" height="25">' +
          '<div>' + esc(x.t) + '<span>Кан Академия · ' + esc(x.c) + '<i class="sr"> (отваря се в нов раздел)</i></span></div><b aria-hidden="true">Учи →</b></a></li>';
      }).join('') + '</ul></div>';
    return d;
  }
  function logo() {
    var pts = [], n = 12; for (var i = 0; i < n * 2; i++) { var a = i / (n * 2) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 11 : 20; pts.push((21 + r * Math.cos(a)).toFixed(1) + ',' + (21 + r * Math.sin(a)).toFixed(1)); }
    return '<svg viewBox="0 0 42 42" aria-hidden="true"><polygon points="' + pts.join(' ') + '" fill="var(--accent)"/><text x="21" y="26.5" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="15" fill="#fff">π</text></svg>';
  }

  /* ---------- малки карти ---------- */
  function stripCard(p) {
    var a = el('a'); a.href = url(p);
    a.appendChild(artBlock(p));
    a.appendChild(el('div', 'cap', esc(p.name) + '<small>' + esc(years(p)) + ' · ' + FIELDS[p.field] + '</small>'));
    return a;
  }
  function listItem(p) {
    var li = el('li', 'item f-' + p.field), a = el('a'); a.href = url(p);
    a.appendChild(artBlock(p));
    a.appendChild(el('div', '', fieldTag(p) + (p.fictional ? ' <span class="fict" style="font-size:10px;padding:2px 6px">измислен' + (p.sex === 'f' ? 'а' : '') + '</span>' : '') +
      '<h3>' + esc(p.name) + ' <span class="yrs">' + esc(years(p)) + '</span></h3><p>' + esc(p.title) + '</p>'));
    li.appendChild(a); return li;
  }

  /* ---------- НАЧАЛО ---------- */
  function pageHome() {
    chrome('home');
    var pool = TEN.concat(STO);
    var d = new Date(), key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(), h = 0;
    for (var i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    var idx = h % pool.length;
    var box = document.getElementById('day');
    var live = el('p', 'sr'); live.setAttribute('aria-live', 'polite'); box.parentNode.insertBefore(live, box.nextSibling);
    function show(p, isDay, focus) {
      box.innerHTML = '';
      box.setAttribute('aria-label', isDay ? 'БУМ на деня' : 'Случаен БУМ');
      var a = artBlock(p); a.appendChild(el('div', 'stamp', isDay ? 'БУМ на деня' : 'Случаен БУМ'));
      box.appendChild(a);
      var b = el('div', 'body');
      b.innerHTML = '<div>' + fieldTag(p) + ' <span class="eyebrow" style="color:var(--muted)">· ' + SECTIONS[p.sec].name + '</span></div>' +
        '<h2>' + esc(p.title) + '</h2><div class="who">' + esc(p.name) + ' <span>' + esc(years(p)) + (p.place ? ' · ' + esc(p.place) : '') + '</span></div>' +
        '<p class="lede">' + esc(p.lede) + '</p><div class="acts"><a class="btn" href="' + url(p) + '">Прочети историята →</a><button class="btn ghost" type="button" id="again">🎲 Друг БУМ</button></div>';
      box.appendChild(b);
      document.getElementById('again').onclick = function () { var j; do { j = Math.floor(Math.random() * pool.length); } while (pool[j] === p && pool.length > 1); show(pool[j], false, true); };
      if (focus) { document.getElementById('again').focus(); live.textContent = 'Случаен БУМ: ' + p.name + ' – ' + p.title; }
      loadPhotos(box);
    }
    show(pool[idx], true);

    /* За лицата в картите: първо хората със снимка, после тези, за които може да има. */
    function withPhotos(list, n) {
      var a = shuffle(list), has = a.filter(function (p) { return cache[p.id] && cache[p.id].s; }), maybe = a.filter(function (p) { return !cache[p.id] && hasSource(p); });
      return has.concat(maybe, a).filter(function (p, i, arr) { return arr.indexOf(p) === i; }).slice(0, n);
    }
    function faces(list) { return list.map(function (p) { return '<span data-pid="' + (p.avatar ? '' : p.id) + '">' + (p.avatar ? Art.avatar(p.avatar) : '<i class="emb-f">' + BUMEmblem.svg(p) + '</i>') + '</span>'; }).join(''); }
    var secs = document.getElementById('sections');
    secs.innerHTML =
      '<a class="sec" href="deset.html"><span class="big" aria-hidden="true">10</span><h3>10 БУМа</h3><p>Десетте най-известни приноса на българи в математиката и науките – от компютъра на Атанасов до кристалите в лазерите.</p><div class="faces">' + faces(TEN.slice(0, 6)) + '</div></a>' +
      '<a class="sec" href="sto.html"><span class="big" aria-hidden="true">100</span><h3>СтоБУМ</h3><p>Сто истории на успеха – не всички прочути, но всички истински. Жени и мъже от различни векове и области.</p><div class="faces">' + faces(withPhotos(STO, 6)) + '</div></a>' +
      '<a class="sec" href="kilo.html"><span class="big" aria-hidden="true">1000</span><h3>КилоБУМ</h3><p>Истории, които събираме чрез интервюта – с хора около нас, които правят нещо важно с математика. Засега: примерни статии.</p><div class="faces">' + faces(KILO) + '</div></a>';
    secs.querySelectorAll('[data-pid=""]').forEach(function (n) { n.removeAttribute('data-pid'); });
    loadPhotos(secs);

    var real = TEN.concat(STO), women = real.filter(function (p) { return p.sex === 'f'; }).length;
    var cs = real.map(century).filter(Boolean), minC = Math.min.apply(null, cs), maxC = Math.max.apply(null, cs);
    document.querySelector('main').appendChild(kaBlock('@home', 'Математиката зад откритията'));
    document.getElementById('stats').innerHTML = '<div><b>' + real.length + '</b><span>истински истории</span></div><div><b>' + women + '</b><span>жени</span></div><div><b>' + roman(minC) + '–' + roman(maxC) + '</b><span>век</span></div>' + '<a class="stats-more" href="statistika.html">Всички числа и осева таблица →</a> <a class="stats-more" href="karta.html">Мисловна карта на всички истории →</a>';
  }

  /* ---------- 10 БУМа ---------- */
  function pageTen() {
    chrome('ten');
    var g = document.getElementById('ten');
    TEN.forEach(function (p) {
      var a = el('a', 'tcard f-' + p.field); a.href = url(p);
      var art = artBlock(p); art.appendChild(el('span', 'rank', String(p.rank)));
      a.appendChild(art);
      a.appendChild(el('div', 'meta', fieldTag(p) + '<h2>' + esc(p.name) + '</h2><div class="yrs">' + esc(years(p)) + '</div><p class="ttl">' + esc(p.title) + '</p>'));
      g.appendChild(a);
    });
    loadPhotos(g);
    g.parentNode.appendChild(kaBlock('@ten', 'Научи математиката зад десетте БУМа'));
  }

  /* ---------- СтоБУМ и КилоБУМ: снимки отгоре + списък с филтри ---------- */
  function pageList(sec) {
    chrome(sec);
    var data = sec === 'sto' ? STO : KILO;
    var strip = document.getElementById('strip');
    function deal() { strip.innerHTML = ''; shuffle(data).slice(0, 5).forEach(function (p) { strip.appendChild(stripCard(p)); }); loadPhotos(strip); }
    deal();
    var sh = document.getElementById('shuffle'); if (sh) sh.onclick = deal;

    var st = { q: '', sex: '', cent: '', field: '', sort: 'born' };
    var fieldsUsed = Object.keys(FIELDS).filter(function (k) { return data.some(function (p) { return p.fields.indexOf(k) >= 0; }); });
    var cents = []; data.forEach(function (p) { var c = century(p); if (c && cents.indexOf(c) < 0) cents.push(c); }); cents.sort(function (a, b) { return a - b; });

    function chips(id, items, key) {
      var box = document.getElementById(id); box.innerHTML = '';
      items.forEach(function (it) {
        var b = el('button', 'chip' + (it.cls ? ' ' + it.cls : ''), esc(it.t) + '<span class="n"></span>'); b.type = 'button'; b.dataset.v = it.v;
        b.onclick = function () { st[key] = it.v; render(); };
        box.appendChild(b);
      });
    }
    chips('f-sex', [{ v: '', t: 'Всички' }, { v: 'f', t: 'Жени' }, { v: 'm', t: 'Мъже' }], 'sex');
    chips('f-cent', [{ v: '', t: 'Всички векове' }].concat(cents.map(function (c) { return { v: String(c), t: roman(c) + ' век' }; })), 'cent');
    chips('f-field', [{ v: '', t: 'Всички области' }].concat(fieldsUsed.map(function (k) { return { v: k, t: FIELDS[k], cls: 'fdot f-' + k }; })), 'field');

    var q = document.getElementById('q'), sort = document.getElementById('sort');
    q.oninput = function () { st.q = norm(q.value); render(); };
    sort.onchange = function () { st.sort = sort.value; if (st.sort === 'random') rnd = shuffle(data); render(); };
    var rnd = shuffle(data);

    function match(p, skip) {
      if (st.q && !textMatch(p, st.q)) return false;
      if (skip !== 'sex' && st.sex && p.sex !== st.sex) return false;
      if (skip !== 'cent' && st.cent && String(century(p)) !== st.cent) return false;
      if (skip !== 'field' && st.field && p.fields.indexOf(st.field) < 0) return false;
      return true;
    }
    function counts(id, key, fn) {
      document.querySelectorAll('#' + id + ' .chip').forEach(function (b) {
        var v = b.dataset.v; b.setAttribute('aria-pressed', String(st[key] === v));
        b.querySelector('.n').textContent = data.filter(function (p) { var x = fn(p); return match(p, key) && (!v || (Array.isArray(x) ? x.indexOf(v) >= 0 : x === v)); }).length;
      });
    }
    var list = document.getElementById('list'), cnt = document.getElementById('count');
    function render() {
      counts('f-sex', 'sex', function (p) { return p.sex; });
      counts('f-cent', 'cent', function (p) { return String(century(p)); });
      counts('f-field', 'field', function (p) { return p.fields; });
      var arr = (st.sort === 'random' ? rnd : data).filter(function (p) { return match(p); });
      if (st.sort === 'born-desc') arr = arr.slice().sort(function (a, b) { return b.born - a.born; });
      if (st.sort === 'name') arr = arr.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'bg'); });
      if (st.sort === 'born') arr = arr.slice().sort(function (a, b) { return a.born - b.born; });
      list.innerHTML = '';
      arr.forEach(function (p) { list.appendChild(listItem(p)); });
      cnt.textContent = arr.length === data.length ? 'Всички ' + arr.length + ' истории' : arr.length + ' от ' + data.length + ' истории';
      if (!arr.length) {
        var other = st.q ? ALL.filter(function (p) { return p.sec !== sec && textMatch(p, st.q); }).slice(0, 5) : [];
        list.innerHTML = '<li class="empty">Няма истории с тези филтри. Опитай с по-малко.' + (other.length ? '<br>В другите раздели: ' + other.map(function (p) { return '<a href="' + url(p) + '">' + esc(p.name) + '</a> (' + SECTIONS[p.sec].name + ')'; }).join(', ') : '') + '</li>';
      }
      loadPhotos(list);
    }
    render();
    list.parentNode.appendChild(kaBlock('@' + sec, sec === 'kilo' ? 'Научи се да работиш с данни като героите на КилоБУМ' : 'Математика от сто истории'));
  }

  /* ---------- СТАТИЯ ---------- */
  function pageStory() {
    var id = new URLSearchParams(location.search).get('id'), p = BY[id];
    chrome(p ? p.sec : '');
    var main = document.getElementById('main');
    if (!p) { main.innerHTML = '<div class="wrap page-head"><h1>Няма такава история</h1><p><a href="index.html">Към началото</a></p></div>'; return; }
    document.title = p.name + ' – ' + p.title + ' · БУМ';
    var canon = 'https://dansum.github.io/web-apps/bum/story.html?id=' + encodeURIComponent(p.id);
    [['link[rel=canonical]', 'href'], ['meta[property="og:url"]', 'content']].forEach(function (x) { var n = document.querySelector(x[0]); if (n) n.setAttribute(x[1], canon); });
    [['meta[property="og:title"]', document.title], ['meta[property="og:description"]', p.lede], ['meta[property="og:image"]', 'https://dansum.github.io/web-apps/bum/media/og/' + p.id + '.jpg']].forEach(function (x) { var n = document.querySelector(x[0]); if (n) n.setAttribute('content', x[1]); });
    var md = document.querySelector('meta[name=description]'); if (md) md.setAttribute('content', p.lede);
    var S = SECTIONS[p.sec];

    var hero = el('div', 'hero'), art = artBlock(p);
    hero.appendChild(art);
    hero.appendChild(el('div', 'crumbs', '<div class="wrap"><a href="' + S.href + '">← ' + S.name + '</a></div>'));
    main.appendChild(hero);

    var ar = el('article', 'article');
    var head = '<div class="head">' + (p.fictional ? '<span class="fict">Измислен' + (p.sex === 'f' ? 'а' : '') + ' човек · примерна статия</span>' : '') +
      '<div class="tags">' + p.fields.map(function (k) { return '<span class="field-tag f-' + k + '">' + FIELDS[k] + '</span>'; }).join(' ') + '</div>' + '<div class="name">' + esc(p.name) + ' <span>' + esc(years(p)) + (p.sec === 'kilo' && p.born && !p.died ? ' · ' + (new Date().getFullYear() - p.born) + ' г.' : '') + (p.place ? ' · ' + esc(p.place) : '') + '</span></div>' +
      '<h1>' + esc(p.title) + '</h1><p class="lede">' + esc(p.lede) + '</p>' +
      (p.tags && p.tags.length ? '<div class="tags">' + p.tags.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' : '') +
      '<button class="btn ghost share" type="button" id="share">↗ Сподели</button><span class="share-msg" id="share-msg" aria-live="polite"></span></div>';
    var body = '';
    if (p.fictional) body += '<div class="notice" style="margin-top:28px"><span class="fict">!</span><p><b>Това е примерна статия.</b> ' + esc(p.name) + ' не съществува – човекът, историята, интервюто и видеото са измислени, за да покажат как ще изглеждат истинските истории в КилоБУМ, които ще събираме чрез интервюта. Линковете водят към истински статии по темата.</p></div>';
    body += '<div class="body">' + p.story.map(function (s) { return '<p>' + esc(s) + '</p>'; }).join('') + '</div>';
    if (p.num) body += '<div class="bignum"><b>' + esc(p.num.n) + '</b><span><small>БУМ число</small>' + esc(p.num.t) + '</span></div>';
    if (p.sec === 'kilo') {
      body += '<div class="kilo-media"><div><div class="vid"><video aria-label="Примерно видео за измислен човек"  controls playsinline preload="none" poster="' + esc(p.video.poster) + '" src="' + esc(p.video.src) + '"></video></div><div class="vcap">' + esc(p.video.caption) + '</div></div>' +
        '<figure class="figure"><div class="art">' + Art.svg({ id: p.id + '-work', field: p.field, motif: p.work.motif }) + '</div><figcaption><b>От работата ' + (p.sex === 'f' ? 'ѝ' : 'му') + '</b>' + esc(p.work.caption) + '</figcaption></figure></div>';
      body += '<section class="qa"><h2>Интервю</h2><dl>' + p.interview.map(function (x) { return '<div><dt>' + esc(x.q) + '</dt><dd>' + esc(x.a) + '</dd></div>'; }).join('') + '</dl></section>';
    }
    if (p.links && p.links.length) body += '<nav class="links" aria-label="Още информация"><h2>' + (p.fictional ? 'Прочети още по темата' : 'Прочети още') + '</h2>' + p.links.map(function (l) {
      var host = ''; try { host = new URL(l.u).hostname.replace(/^www\./, ''); } catch (e) {}
      return '<a href="' + esc(l.u) + '" target="_blank" rel="noopener">' + esc(l.t) + ' <span>' + esc(host) + ' ↗</span><i class="sr"> (отваря се в нов раздел)</i></a>';
    }).join('') + '</nav>';
    body += '<div id="ka-slot"></div><p class="credit" id="credit"></p>';

    var list = p.sec === 'ten' ? TEN : p.sec === 'sto' ? STO : KILO, i = list.indexOf(p);
    var prev = list[(i - 1 + list.length) % list.length], next = list[(i + 1) % list.length];
    body += '<div class="pager"><a href="' + url(prev) + '"><small>← Предишна</small><b>' + esc(prev.name) + '</b></a><a class="next" href="' + url(next) + '"><small>Следваща →</small><b>' + esc(next.name) + '</b></a></div>';
    ar.innerHTML = head + body;
    main.appendChild(ar);
    /* Споделяне: страницата i/<id>.html носи заглавието и картинката на историята за социалните мрежи. */
    document.getElementById('share').onclick = function () {
      var u = new URL('i/' + p.id + '.html', location.href).href, msg = document.getElementById('share-msg');
      if (navigator.share) { navigator.share({ title: p.name + ' – ' + p.title, url: u }).catch(function () {}); return; }
      var done = function () { msg.textContent = 'Връзката е копирана.'; };
      if (navigator.clipboard) navigator.clipboard.writeText(u).then(done, function () { msg.textContent = u; }); else msg.textContent = u;
    };
    var slot = document.getElementById('ka-slot'); slot.parentNode.replaceChild(kaBlock(p.id), slot);

    var more = el('section', 'more wrap', '<h2>Още БУМ истории</h2>'), ul = el('div', 'strip');
    shuffle(TEN.concat(STO).filter(function (x) { return x !== p; })).slice(0, 5).forEach(function (x) { ul.appendChild(stripCard(x)); });
    more.appendChild(ul); main.appendChild(more);

    function credit() {
      var n = document.getElementById('credit'); if (!n) return;
      if (p.avatar) { n.textContent = 'Портретът е рисунка, а не снимка – човекът е измислен.'; return; }
      var c = cache[p.id]; if (!c || !c.s) { n.textContent = c ? 'Снимката още не е добавена. Илюстрацията показва работата на ' + (p.sex === 'f' ? 'изследователката' : 'изследователя') + ' и е рисувана за БУМ.' : ''; return; }
      n.innerHTML = creditHtml(c) + ' Графиката е рисувана за БУМ.';
      if (!c.m) loadMeta(p.id, credit);
    }
    document.addEventListener('bum-photos', credit);
    loadPhotos(document); credit();
  }

  /* ---------- СТАТИСТИКА: осева таблица ---------- */
  function pageStats() {
    chrome('stats');
    var DIMS = {
      cent: { t: 'Век на раждане', get: function (p) { var c = century(p); return c ? [String(c)] : ['?']; }, label: function (v) { return v === '?' ? 'неизвестен' : roman(+v) + ' век'; }, order: 'num' },
      field: { t: 'Сфера', get: function (p) { return p.fields; }, label: function (v) { return FIELDS[v]; }, order: 'count' },
      sex: { t: 'Пол', get: function (p) { return [p.sex]; }, label: function (v) { return v === 'f' ? 'Жени' : 'Мъже'; }, order: 'fixed', fixed: ['f', 'm'] },
      lives: { t: 'Живее (живял/а) основно', get: function (p) { return [p.lives]; }, label: function (v) { return LIVES[v]; }, order: 'fixed', fixed: ['bg', 'both', 'abroad'] },
      city: { t: 'Град на раждане', get: function (p) { return [p.city]; }, label: function (v) { return v; }, order: 'count' },
      sec: { t: 'Раздел', get: function (p) { return [p.sec]; }, label: function (v) { return SECTIONS[v].name; }, order: 'fixed', fixed: ['ten', 'sto', 'kilo'] },
      none: { t: '– (само общо)', get: function () { return ['all']; }, label: function () { return 'Брой'; }, order: 'fixed', fixed: ['all'] }
    };
    var rowSel = document.getElementById('rows'), colSel = document.getElementById('cols');
    Object.keys(DIMS).forEach(function (k) {
      if (k !== 'none') rowSel.add(new Option(DIMS[k].t, k));
      colSel.add(new Option(DIMS[k].t, k));
    });
    rowSel.value = 'field'; colSel.value = 'cent';
    var inc = { ten: true, sto: true, kilo: false };
    ['ten', 'sto', 'kilo'].forEach(function (k) {
      var c = document.getElementById('inc-' + k); c.checked = inc[k];
      c.onchange = function () { inc[k] = c.checked; render(); };
    });
    rowSel.onchange = colSel.onchange = render;
    document.getElementById('swap').onclick = function () {
      if (colSel.value === 'none') return; var r = rowSel.value; rowSel.value = colSel.value; colSel.value = r; render();
    };
    var cur = null;
    function people() { return ALL.filter(function (p) { return inc[p.sec]; }); }
    function sortVals(dim, vals, cnt) {
      var D = DIMS[dim];
      if (D.order === 'fixed') return D.fixed.filter(function (v) { return vals.indexOf(v) >= 0; });
      if (D.order === 'num') return vals.sort(function (a, b) { return (a === '?') - (b === '?') || +a - +b; });
      return vals.sort(function (a, b) { return (a === 'неизвестно') - (b === 'неизвестно') || cnt[b] - cnt[a] || a.localeCompare(b, 'bg'); });
    }
    function render() {
      var P = people(), R = DIMS[rowSel.value], Cd = DIMS[colSel.value];
      var cells = {}, rowsSet = {}, colsSet = {}, rowP = {}, colP = {};
      P.forEach(function (p) {
        R.get(p).forEach(function (r) {
          rowsSet[r] = 1; (rowP[r] = rowP[r] || []).indexOf(p) < 0 && rowP[r].push(p);
          Cd.get(p).forEach(function (c) {
            colsSet[c] = 1; (colP[c] = colP[c] || []).indexOf(p) < 0 && colP[c].push(p);
            var k = r + '\u0001' + c; (cells[k] = cells[k] || []).push(p);
          });
        });
      });
      var rc = {}, cc = {}; Object.keys(rowP).forEach(function (k) { rc[k] = rowP[k].length; }); Object.keys(colP).forEach(function (k) { cc[k] = colP[k].length; });
      var rows = sortVals(rowSel.value, Object.keys(rowsSet), rc), cols = sortVals(colSel.value, Object.keys(colsSet), cc);
      var max = 0; Object.keys(cells).forEach(function (k) { max = Math.max(max, cells[k].length); });
      var showTotalCol = colSel.value !== 'none';
      var h = '<table class="pivot"><thead><tr><th scope="col" class="corner">' + esc(R.t) + (showTotalCol ? ' \\ ' + esc(Cd.t) : '') + '</th>' +
        cols.map(function (c) { return '<th scope="col">' + esc(Cd.label(c)) + '</th>'; }).join('') + (showTotalCol ? '<th scope="col" class="tot">Общо*</th>' : '') + '</tr></thead><tbody>';
      rows.forEach(function (r) {
        h += '<tr><th scope="row">' + esc(R.label(r)) + '</th>';
        cols.forEach(function (c) {
          var L = cells[r + '\u0001' + c] || [], n = L.length, pc = max ? Math.round(n / max * 70) : 0;
          h += n ? '<td><button type="button" data-r="' + esc(r) + '" data-c="' + esc(c) + '" style="--h:' + pc + '%">' + n + '</button></td>' : '<td class="z" aria-hidden="true">·</td>';
        });
        if (showTotalCol) h += '<td class="tot"><button type="button" data-r="' + esc(r) + '" data-c="*">' + rowP[r].length + '</button></td>';
        h += '</tr>';
      });
      h += '</tbody><tfoot><tr><th scope="row">Общо*</th>' + cols.map(function (c) { return '<td><button type="button" data-r="*" data-c="' + esc(c) + '">' + colP[c].length + '</button></td>'; }).join('') +
        (showTotalCol ? '<td class="tot"><button type="button" data-r="*" data-c="*">' + P.length + '</button></td>' : '') + '</tr></tfoot></table>';
      var box = document.getElementById('pivot'); box.innerHTML = P.length ? h : '<p class="empty">Избери поне един раздел.</p>';
      box.querySelectorAll('button[data-r]').forEach(function (b) {
        b.onclick = function () {
          var r = b.dataset.r, c = b.dataset.c, L;
          if (r === '*' && c === '*') L = P; else if (r === '*') L = colP[c]; else if (c === '*') L = rowP[r]; else L = cells[r + '\u0001' + c];
          var title = (r === '*' ? '' : R.label(r)) + (r !== '*' && c !== '*' && colSel.value !== 'none' ? ' · ' : '') + (c === '*' || colSel.value === 'none' ? '' : Cd.label(c));
          showList(title || 'Всички', L);
          box.querySelectorAll('button.on').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on');
        };
      });
      var multi = rowSel.value === 'field' || colSel.value === 'field';
      document.getElementById('multi').hidden = !multi;
      cur = { rows: rows, cols: cols, cells: cells, rowP: rowP, colP: colP, R: R, C: Cd, P: P, tc: showTotalCol };
      cards(P);
      document.getElementById('cell').innerHTML = '';
    }
    function showList(title, L) {
      var d = document.getElementById('cell');
      L = L.slice().sort(function (a, b) { return (a.born || 0) - (b.born || 0); });
      d.innerHTML = '<h2>' + esc(title) + ' <span>· ' + L.length + '</span></h2>';
      var ul = el('ul', 'list'); L.forEach(function (p) { ul.appendChild(listItem(p)); }); d.appendChild(ul);
      loadPhotos(d); d.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    function cards(P) {
      var n = P.length || 1, f = P.filter(function (p) { return p.sex === 'f'; }).length, bg = P.filter(function (p) { return p.lives === 'bg'; }).length;
      var cs = P.map(century).filter(Boolean), cities = {}; P.forEach(function (p) { if (p.city !== 'неизвестно') cities[p.city] = 1; });
      var fl = {}; P.forEach(function (p) { p.fields.forEach(function (k) { fl[k] = 1; }); });
      document.getElementById('cards').innerHTML = [
        [P.length, 'истории'], [Math.round(bg / n * 100) + '%', 'живеят основно в България'],
        [cs.length ? roman(Math.min.apply(null, cs)) + '–' + roman(Math.max.apply(null, cs)) : '–', 'век на раждане'], [Object.keys(cities).length, 'града на раждане'], [Object.keys(fl).length, 'сфери'],
        [Math.round(f / n * 100) + '%', 'жени (' + f + ')']
      ].map(function (x) { return '<div><b>' + x[0] + '</b><span>' + x[1] + '</span></div>'; }).join('');
    }
    document.getElementById('csv').onclick = function () {
      if (!cur) return;
      var q = function (s) { return '"' + String(s).replace(/"/g, '""') + '"'; };
      var lines = [[cur.R.t].concat(cur.cols.map(function (c) { return cur.C.label(c); }), cur.tc ? ['Общо'] : []).map(q).join(',')];
      cur.rows.forEach(function (r) { lines.push([q(cur.R.label(r))].concat(cur.cols.map(function (c) { return (cur.cells[r + '\u0001' + c] || []).length; }), cur.tc ? [cur.rowP[r].length] : []).join(',')); });
      lines.push([q('Общо')].concat(cur.cols.map(function (c) { return cur.colP[c].length; }), cur.tc ? [cur.P.length] : []).join(','));
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
      a.download = 'bum-statistika.csv'; document.body.appendChild(a); a.click(); a.remove();
    };
    render();
    document.querySelector('main').appendChild(kaBlock('@stats', 'Научи се да четеш таблици и данни'));
    document.querySelector('main').appendChild(kaTopics());
  }

  /* Всички уроци от Кан Академия, към които води сайтът: по теми, с брой споменавания и с хората. */
  var KA_PAGES = { '@home': ['Начало', 'index.html'], '@ten': ['10 БУМа', 'deset.html'], '@sto': ['СтоБУМ', 'sto.html'], '@kilo': ['КилоБУМ', 'kilo.html'],
    '@stats': ['Статистика', 'statistika.html'], '@karta': ['Карта', 'karta.html'], '@about': ['За проекта', 'za-proekta.html'] };
  function kaTopics() {
    var KA = window.BUM_KA || {}, TP = window.BUM_KA_TOPICS || { topics: [], map: {} }, L = {}, n = 0;
    Object.keys(KA).forEach(function (key) {
      if (key.charAt(0) !== '@' && !BY[key]) return;
      KA[key].forEach(function (x) {
        var l = L[x.u] || (L[x.u] = { t: x.t, c: x.c, u: x.u, who: [], pages: [] });
        if (key.charAt(0) === '@') { if (KA_PAGES[key]) l.pages.push(KA_PAGES[key]); } else l.who.push(BY[key]);
      });
    });
    var groups = {}, topics = TP.topics.concat([{ k: 'other', t: 'Други' }]);
    Object.keys(L).forEach(function (u) {
      var k = TP.map[u.replace('https://bg.khanacademy.org/math/', '')] || 'other';
      (groups[k] = groups[k] || []).push(L[u]); n++;
    });
    function cnt(l) { return l.who.length + l.pages.length; }
    var sec = el('section', 'kat'); sec.id = 'kan';
    sec.innerHTML = '<h2><img src="media/khan-academy.svg" alt="" width="30" height="34"> Уроците от Кан Академия по теми</h2>' +
      '<p>Всички ' + n + ' урока, към които водят историите и страниците на БУМ. Числото показва колко пъти е споменат урокът, а под заглавието са хората, при които стои.</p>';
    topics.forEach(function (T) {
      var G = groups[T.k]; if (!G) return;
      G.sort(function (a, b) { return cnt(b) - cnt(a) || a.t.localeCompare(b.t, 'bg'); });
      var tot = G.reduce(function (s, l) { return s + cnt(l); }, 0);
      var d = el('details'); d.open = true;
      d.innerHTML = '<summary><h3>' + esc(T.t) + '</h3><span>' + G.length + (G.length === 1 ? ' урок' : ' урока') + ' · ' + tot + (tot === 1 ? ' споменаване' : ' споменавания') + '</span></summary><ol>' +
        G.map(function (l) {
          var who = l.who.slice().sort(function (a, b) { return (a.born || 0) - (b.born || 0); }).map(function (p) {
            return '<a href="' + url(p) + '">' + esc(p.name) + '</a>' + (p.sec === 'kilo' ? ' <i>(примерна история)</i>' : '');
          }).concat(l.pages.map(function (pg) { return '<a class="pg" href="' + pg[1] + '">страница „' + esc(pg[0]) + '“</a>'; }));
          var c = cnt(l);
          return '<li><b class="n" title="' + c + (c === 1 ? ' споменаване' : ' споменавания') + '">' + c + '</b><div><a class="les" href="' + esc(l.u) + '" target="_blank" rel="noopener">' + esc(l.t) +
            '<i class="sr"> (Кан Академия, отваря се в нов раздел)</i></a> <small>' + esc(l.c) + '</small><p>' + who.join(', ') + '</p></div></li>';
        }).join('') + '</ol>';
      sec.appendChild(d);
    });
    return sec;
  }

  /* ---------- МИСЛОВНА КАРТА (d3-force) ---------- */
  /* Връзки, избрани на ръка: [id, id, защо са свързани]. Останалите връзки свързват
     хората от една и съща основна сфера по реда на раждане. */
  var LINKS = [
    ['john-atanasoff', 'blagovest-sendov', 'Сендов кани Атанасов в България (1970)'],
    ['ivan-stranski', 'lyubomir-krastanov', 'механизмът Странски–Кръстанов'],
    ['ivan-stranski', 'rostislav-kaishev', 'теорията за растежа на кристалите'],
    ['blagovest-sendov', 'rumen-tsanev', 'общ математически модел на гените'],
    ['blagovest-sendov', 'evgenia-sendova', 'баща и дъщеря; компютрите в училище'],
    ['vladimir-koylazov', 'petar-mitev', 'основават заедно Chaos (V-Ray)'],
    ['georgi-ivanov', 'aleksandar-aleksandrov', 'първите двама български космонавти'],
    ['georgi-ivanov', 'kiril-serafimov', 'българските космически изследвания'],
    ['aleksandar-aleksandrov', 'tanya-ivanova', 'станция „Мир“'],
    ['veselin-topalov', 'antoaneta-stefanova', 'световни шампиони по шах'],
    ['antoaneta-stefanova', 'venka-asenova', 'българският женски шах'],
    ['antoaneta-stefanova', 'nurgyul-salimova', 'българският женски шах'],
    ['veselin-topalov', 'kiril-georgiev', 'български гросмайстори'],
    ['pencho-raykov', 'teodora-raykova-kovacheva', 'баща и дъщеря, химици'],
    ['elisaveta-karamihailova', 'georgi-nadjakov', 'физиката в Софийския университет'],
    ['lyubomir-chakalov', 'nikola-obreshkov', 'софийската школа по анализ'],
    ['lyubomir-chakalov', 'yaroslav-tagamlitzki', 'софийската школа по анализ'],
    ['emanuil-ivanov', 'kiril-popov', 'първите професори по математика'],
    ['anastasia-golovina', 'tota-venkova', 'първите българки лекарки'],
    ['maria-luisa-doseva', 'victoria-angelova', 'първите българки архитектки'],
    ['vladimir-shkodrov', 'nikola-bonev', 'обсерваторията „Рожен“'],
    ['vladimir-shkodrov', 'violeta-ivanova', 'астероиди, открити от Рожен'],
    ['preslav-nakov', 'zornitsa-kozareva', 'компютърна лингвистика'],
    ['kalina-boncheva', 'galia-angelova', 'компютърна лингвистика'],
    ['dragomir-radev', 'preslav-nakov', 'компютърна лингвистика'],
    ['kristina-toutanova', 'zornitsa-kozareva', 'езикови модели'],
    ['martin-vechev', 'preslav-nakov', 'изкуствен интелект'],
    ['doncho-kostov', 'hristo-daskalov', 'генетика на растенията'],
    ['rayna-georgieva', 'doncho-kostov', 'генетика на растенията'],
    ['hristaki-pavlovich', 'petar-beron', 'първите учебници по смятане'],
    ['ivan-gyuzelev', 'hristaki-pavlovich', 'възрожденски учебници'],
    ['john-atanasoff', 'lyubomir-iliev', 'първите компютри'],
    ['lyubomir-iliev', 'ivan-marangozov', 'българските компютри'],
    ['ivan-marangozov', 'lyubomir-antonov-elka', 'българската изчислителна техника'],
    ['lyubomir-iliev', 'blagovest-sendov', 'Институтът по математика на БАН'],
    ['stefan-dodunekov', 'lyubomir-iliev', 'Институтът по математика на БАН'],
    ['petar-kenderov', 'zvezdelina-stankova', 'математическите олимпиади'],
    ['zvezdelina-stankova', 'greta-panova', 'олимпиади и комбинаторика'],
    ['kristalina-georgieva', 'simeon-dyankov', 'Световната банка'],
    ['dimitar-sasselov', 'ellie-hadjiyska-schmelzer', 'търсенето на екзопланети'],
    ['svetlin-nakov', 'svetozar-georgiev', 'Телерик и Телерик Академия'],
    ['georgi-zlatarski', 'nikola-pushkarov', 'картите на българските земи'],
    ['spas-vatsov', 'marin-bachevarov', 'метеорологичните наблюдения'],
    ['ivan-todorov', 'valentina-petkova', 'математическа физика'],
    ['katya-georgieva', 'penka-maglova', 'слънчевата активност']
  ];
  function pageMap() {
    chrome('map');
    var box = document.getElementById('map'), panel = document.getElementById('panel');
    if (!window.d3) { box.innerHTML = '<p class="empty">Картата не можа да се зареди. Провери връзката с интернет.</p>'; return; }
    var nodes = TEN.concat(STO).map(function (p) { return { id: p.id, p: p, r: p.sec === 'ten' ? 17 : 7 }; });
    var byId = {}; nodes.forEach(function (n) { byId[n.id] = n; });
    var links = [];
    LINKS.forEach(function (l) { if (byId[l[0]] && byId[l[1]]) links.push({ source: l[0], target: l[1], why: l[2], k: 'hand' }); });
    Object.keys(FIELDS).forEach(function (f) {
      var L = nodes.filter(function (n) { return n.p.field === f; }).sort(function (a, b) { return a.p.born - b.p.born; });
      for (var i = 1; i < L.length; i++) {
        var a = L[i - 1].id, b = L[i].id;
        if (!links.some(function (l) { return (l.source === a && l.target === b) || (l.source === b && l.target === a); }))
          links.push({ source: a, target: b, why: 'една сфера: ' + FIELDS[f], k: 'field' });
      }
    });
    var css = getComputedStyle(document.documentElement);
    function col(f) { return (css.getPropertyValue('--f-' + f) || '#888').trim(); }
    var fieldsUsed = Object.keys(FIELDS).filter(function (f) { return nodes.some(function (n) { return n.p.field === f; }); });
    /* На тесен екран картата е изправена (по-висока), за да са точките по-големи. */
    var narrow = box.clientWidth < 600, W = narrow ? 600 : 1000, H = narrow ? 900 : 720, d3 = window.d3;
    var centers = {}; fieldsUsed.forEach(function (f, i) { var a = i / fieldsUsed.length * 2 * Math.PI - Math.PI / 2; centers[f] = [W / 2 + (narrow ? 190 : 270) * Math.cos(a), H / 2 + (narrow ? 300 : 200) * Math.sin(a)]; });
    var svg = d3.select(box).append('svg').attr('viewBox', '0 0 ' + W + ' ' + H).attr('role', 'group')
      .attr('aria-label', 'Мисловна карта на ' + nodes.length + ' истории. Натиснете Tab, за да влезете, и стрелките, за да минавате от човек на човек.');
    var g = svg.append('g');
    var zoom = d3.zoom().scaleExtent([0.3, 6]).on('zoom', function (e) { g.attr('transform', e.transform); g.classed('zoomed', e.transform.k > 1.6); });
    svg.call(zoom);
    /* Събира всички точки в рамката. */
    function fit(animate) {
      var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      nodes.forEach(function (d) { x0 = Math.min(x0, d.x - d.r); y0 = Math.min(y0, d.y - d.r); x1 = Math.max(x1, d.x + d.r); y1 = Math.max(y1, d.y + d.r + 16); });
      var k = Math.min(W / (x1 - x0 + 60), H / (y1 - y0 + 60), 2);
      var t = d3.zoomIdentity.translate(W / 2 - k * (x0 + x1) / 2, H / 2 - k * (y0 + y1) / 2).scale(k);
      (animate ? svg.transition().duration(600) : svg).call(zoom.transform, t);
    }
    var link = g.append('g').attr('class', 'm-links').selectAll('line').data(links).join('line').attr('class', function (d) { return 'm-link ' + d.k; });
    var node = g.append('g').selectAll('g').data(nodes).join('g').attr('class', function (d) { return 'm-node ' + d.p.sec; }).attr('tabindex', -1).attr('role', 'button')
      .attr('aria-label', function (d) { return d.p.name + ', ' + FIELDS[d.p.field] + ', ' + years(d.p); });
    node.append('circle').attr('class', 'm-hit').attr('r', function (d) { return d.r + (narrow ? 12 : 6); });
    node.append('circle').attr('class', 'm-dotc').attr('r', function (d) { return d.r; }).attr('fill', function (d) { return col(d.p.field); });
    node.append('title').text(function (d) { return d.p.name + ' · ' + years(d.p) + ' · ' + FIELDS[d.p.field]; });
    /* Надписите са в отделен слой над всички точки, за да не ги закриват чужди точки. */
    var label = g.append('g').attr('class', 'm-labels').attr('aria-hidden', 'true').selectAll('text').data(nodes).join('text')
      .attr('class', function (d) { return 'm-label ' + d.p.sec; }).attr('text-anchor', 'middle').text(function (d) { return d.p.name; });
    /* Една спирка за Tab: стрелките минават от човек на човек (по реда на раждане), Enter отваря картата му. */
    var order = nodes.slice().sort(function (a, b) { return a.p.born - b.p.born; }), cur = order[0];
    function rove(d, focus) { cur = d; node.attr('tabindex', function (x) { return x === d ? 0 : -1; }); if (focus) node.filter(function (x) { return x === d; }).node().focus(); }
    rove(cur, false);
    var sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(function (d) { return d.id; }).distance(function (l) { return l.k === 'hand' ? 70 : 40; }).strength(function (l) { return l.k === 'hand' ? 0.25 : 0.35; }))
      .force('charge', d3.forceManyBody().strength(function (d) { return d.r > 10 ? -180 : -45; }).distanceMax(260))
      .force('collide', d3.forceCollide().radius(function (d) { return d.r + 4; }))
      .force('x', d3.forceX(function (d) { return centers[d.p.field][0]; }).strength(0.07))
      .force('y', d3.forceY(function (d) { return centers[d.p.field][1]; }).strength(0.07))
      .on('tick', function () {
        link.attr('x1', function (d) { return d.source.x; }).attr('y1', function (d) { return d.source.y; }).attr('x2', function (d) { return d.target.x; }).attr('y2', function (d) { return d.target.y; });
        node.attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; });
        label.attr('x', function (d) { return d.x; }).attr('y', function (d) { return d.y + d.r + 13; });
      })
      .on('end', function () { if (!fitted) { fitted = true; fit(true); } });
    var fitted = false;
    sim.tick(200); fit(false);
    node.call(d3.drag()
      .on('start', function (e, d) { if (!e.active) sim.alphaTarget(0.2).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', function (e, d) { d.fx = e.x; d.fy = e.y; })
      .on('end', function (e, d) { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

    /* ---------- филтри ---------- */
    var st = { field: '', cent: '', lives: '', city: '', sec: '', sex: '' };
    var P = nodes.map(function (n) { return n.p; });
    function opts(id, label, pairs) {
      var s = document.getElementById(id); s.innerHTML = ''; s.add(new Option(label, ''));
      pairs.forEach(function (x) { s.add(new Option(x[1], x[0])); });
      s.onchange = function () { st[id.slice(2)] = s.value; apply(); };
    }
    var cents = []; P.forEach(function (p) { var c = century(p); if (c && cents.indexOf(c) < 0) cents.push(c); }); cents.sort(function (a, b) { return a - b; });
    var cityCnt = {}; P.forEach(function (p) { cityCnt[p.city] = (cityCnt[p.city] || 0) + 1; });
    var cities = Object.keys(cityCnt).sort(function (a, b) { return (a === 'неизвестно') - (b === 'неизвестно') || cityCnt[b] - cityCnt[a] || a.localeCompare(b, 'bg'); });
    opts('m-cent', 'Всички векове', cents.map(function (c) { return [String(c), roman(c) + ' век']; }));
    opts('m-lives', 'Живее: навсякъде', [['bg', LIVES.bg], ['both', LIVES.both], ['abroad', LIVES.abroad]]);
    opts('m-city', 'Всички градове', cities.map(function (c) { return [c, c + ' (' + cityCnt[c] + ')']; }));
    opts('m-sec', 'Всички раздели', [['ten', '10 БУМа'], ['sto', 'СтоБУМ']]);
    opts('m-sex', 'Жени и мъже', [['f', 'Жени'], ['m', 'Мъже']]);
    var leg = document.getElementById('m-field');
    leg.innerHTML = '<button type="button" class="chip" data-v="" aria-pressed="true">Всички сфери</button>' + fieldsUsed.map(function (f) {
      return '<button type="button" class="chip m-dot" data-v="' + f + '" aria-pressed="false" style="--dc:' + col(f) + '">' + FIELDS[f] + '</button>';
    }).join('');
    leg.querySelectorAll('.chip').forEach(function (b) { b.onclick = function () { st.field = b.dataset.v; apply(); }; });
    document.getElementById('m-reset').onclick = function () {
      Object.keys(st).forEach(function (k) { st[k] = ''; }); ['m-cent', 'm-lives', 'm-city', 'm-sec', 'm-sex'].forEach(function (id) { document.getElementById(id).value = ''; }); apply();
    };
    function ok(p) {
      return (!st.field || p.fields.indexOf(st.field) >= 0) && (!st.cent || String(century(p)) === st.cent) && (!st.lives || p.lives === st.lives) &&
        (!st.city || p.city === st.city) && (!st.sec || p.sec === st.sec) && (!st.sex || p.sex === st.sex);
    }
    function apply() {
      var n = 0;
      node.classed('off', function (d) { var o = !ok(d.p); if (!o) n++; return o; });
      label.classed('off', function (d) { return !ok(d.p); });
      link.classed('off', function (d) { return !ok(d.source.p) || !ok(d.target.p); });
      leg.querySelectorAll('.chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === st.field)); });
      document.getElementById('m-count').textContent = n === nodes.length ? 'Всички ' + n + ' истории' : n + ' от ' + nodes.length + ' истории отговарят на филтрите';
    }
    /* ---------- избор на точка ---------- */
    function show(d, scroll) {
      node.classed('sel', function (x) { return x === d; });
      label.classed('sel', function (x) { return x === d; });
      var nb = links.filter(function (l) { return l.source === d || l.target === d; });
      node.classed('near', function (x) { return nb.some(function (l) { return l.source === x || l.target === x; }) && x !== d; });
      label.classed('near', function (x) { return nb.some(function (l) { return l.source === x || l.target === x; }) && x !== d; });
      link.classed('hi', function (l) { return l.source === d || l.target === d; });
      var p = d.p; panel.innerHTML = '';
      var a = artBlock(p); a.classList.add('m-art'); panel.appendChild(a);
      var b = el('div', 'm-body');
      b.innerHTML = '<div class="tags" style="justify-content:flex-start">' + p.fields.map(function (k) { return '<span class="field-tag f-' + k + '">' + FIELDS[k] + '</span>'; }).join(' ') + '</div>' +
        '<h2>' + esc(p.name) + '</h2><div class="yrs">' + esc(years(p)) + (p.city !== 'неизвестно' ? ' · ' + esc(p.city) : '') + ' · ' + SECTIONS[p.sec].name + '</div>' +
        '<p><b>' + esc(p.title) + '</b></p><p>' + esc(p.lede) + '</p><a class="btn" href="' + url(p) + '">Прочети историята →</a>' +
        (nb.length ? '<h3>Свързани</h3><ul class="m-rel">' + nb.map(function (l) { var o = l.source === d ? l.target : l.source; return '<li><button type="button" data-id="' + o.id + '">' + esc(o.p.name) + '</button> <span>' + esc(l.why) + '</span></li>'; }).join('') + '</ul>' : '');
      var cr = el('p', 'm-credit'); b.appendChild(cr);
      var setCr = function () { var c = cache[p.id]; cr.innerHTML = c && c.s ? creditHtml(c) : ''; if (c && c.s && !c.m) loadMeta(p.id, setCr); };
      document.addEventListener('bum-photos', setCr); setCr();
      panel.appendChild(b); panel.hidden = false;
      b.querySelectorAll('button[data-id]').forEach(function (x) { x.onclick = function () { show(byId[x.dataset.id], true); }; });
      loadPhotos(panel);
      if (scroll && window.innerWidth < 900) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    node.on('click', function (e, d) { rove(d, false); show(d, true); }).on('keydown', function (e, d) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(d, true); return; }
      var step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key], vis = order.filter(function (x) { return ok(x.p); });
      if (e.key === 'Home') step = -1e6; if (e.key === 'End') step = 1e6;
      if (!step || !vis.length) return;
      e.preventDefault();
      var i = vis.indexOf(d); i = Math.max(0, Math.min(vis.length - 1, (i < 0 ? 0 : i) + step));
      rove(vis[i], true); show(vis[i], false);
    });
    apply();
    var start = byId[new URLSearchParams(location.search).get('id')] || byId['john-atanasoff'];
    setTimeout(function () { show(start); }, 50);
    document.querySelector('main').appendChild(kaBlock('@karta', 'Филтрите са множества: научи се да ги пресичаш'));
  }

  /* ---------- АДМИН: съдържанието е шифровано (tools/encrypt_admin.py) ---------- */
  function pageAdmin() {
    chrome('admin');
    var form = document.getElementById('lock'), pw = document.getElementById('pw'), err = document.getElementById('err'), out = document.getElementById('admin');
    function b64(s) { var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
    function open(pass) {
      var E = window.BUM_ADMIN, c = window.crypto && window.crypto.subtle;
      if (!E || !c) { err.textContent = 'Този браузър не може да отвори страницата.'; err.hidden = false; return Promise.resolve(false); }
      return c.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey'])
        .then(function (k) { return c.deriveKey({ name: 'PBKDF2', salt: b64(E.salt), iterations: E.iter, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 256 }, false, ['decrypt']); })
        .then(function (key) { return c.decrypt({ name: 'AES-GCM', iv: b64(E.iv) }, key, b64(E.ct)); })
        .then(function (buf) {
          out.innerHTML = new TextDecoder().decode(buf); out.hidden = false; form.hidden = true; err.hidden = true;
          return true;
        })
        .catch(function () { err.textContent = 'Грешна парола.'; err.hidden = false; return false; });
    }
    form.onsubmit = function (e) { e.preventDefault(); open(pw.value); };
  }

  /* ---------- СНИМКИ: служебен списък кои хора са без снимка (изчислява се в браузъра) ---------- */
  function pagePhotos() {
    chrome('photos');
    var people = TEN.concat(STO), out = document.getElementById('ph-out'), hold = el('div'); hold.hidden = true;
    people.forEach(function (p) { var n = el('span'); n.setAttribute('data-pid', p.id); hold.appendChild(n); });
    document.body.appendChild(hold);
    var done = false;
    function report() {
      var miss = people.filter(function (p) { return !(cache[p.id] && cache[p.id].s); }), has = people.length - miss.length;
      var why = function (p) { return p.noPhoto ? 'снимката е изключена (паметник, плоча или група)' : !hasSource(p) ? 'няма статия в Уикипедия и запис в Уикидата' : cache[p.id] ? 'статията и Уикидата са без снимка' : 'не отговори – опитайте пак'; };
      out.innerHTML = '<p class="count">Със снимка: <b>' + has + '</b> · без снимка: <b>' + miss.length + '</b> от ' + people.length + '</p>' +
        '<table class="ph-table"><thead><tr><th>№</th><th>Човек</th><th>id</th><th>Раздел</th><th>Защо няма</th></tr></thead><tbody>' +
        miss.map(function (p, i) { return '<tr><td>' + (i + 1) + '</td><td><a href="' + url(p) + '">' + esc(p.name) + '</a></td><td><code>' + esc(p.id) + '</code></td><td>' + SECTIONS[p.sec].name + '</td><td>' + why(p) + '</td></tr>'; }).join('') +
        '</tbody></table><p class="pv-note">За да добавите снимка, запишете в данните на човека <code>photoFile</code> (файл от Уикимедия Общомедия) или <code>photoUrl</code> и <code>photoSource</code> (снимка от друг сайт – под нея ще пише, че лицензът се проверява).</p>';
    }
    document.addEventListener('bum-photos', function () { done = true; report(); });
    loadPhotos(hold); report();
    setTimeout(function () { if (!done) report(); }, 8000);
  }

  window.BUM = { TEN: TEN, STO: STO, KILO: KILO, FIELDS: FIELDS };
  var mainEl = document.querySelector('main'); if (mainEl && !mainEl.id) mainEl.id = 'main-content';
  if (mainEl) mainEl.setAttribute('tabindex', '-1');
  var page = document.body.getAttribute('data-page');
  if (page === 'home') pageHome();
  else if (page === 'ten') pageTen();
  else if (page === 'sto') pageList('sto');
  else if (page === 'kilo') pageList('kilo');
  else if (page === 'story') pageStory();
  else if (page === 'stats') pageStats();
  else if (page === 'map') pageMap();
  else if (page === 'admin') pageAdmin();
  else if (page === 'about') { chrome('about'); document.querySelector('.ab-body').appendChild(kaBlock('@about', '10, 100, 1000 – степените на десет')); }
  else if (page === 'photos') pagePhotos();
  var skip = document.querySelector('.skip'); if (skip && mainEl) skip.setAttribute('href', '#' + mainEl.id);
})();
