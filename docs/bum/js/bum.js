/* БУМ — общ код за всички страници. */
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

  /* ---------- данни ---------- */
  var FIELDS = {
    math: 'Математика', cs: 'Информатика', physics: 'Физика', astro: 'Космос и астрономия', chem: 'Химия',
    bio: 'Биология', med: 'Медицина', eng: 'Инженерство', econ: 'Икономика', games: 'Шах и игри',
    edu: 'Образование', earth: 'Науки за Земята'
  };
  var SECTIONS = {
    ten: { name: '10 БУМа', href: 'deset.html' },
    sto: { name: 'СтоБУМ', href: 'sto.html' },
    kilo: { name: 'КилоБУМ', href: 'kilo.html' }
  };
  function tag(list, sec) { return (list || []).map(function (p, i) { p.sec = sec; p.rank = i + 1; if (!FIELDS[p.field]) p.field = 'math'; return p; }); }
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
  function century(p) { return p.born ? Math.floor((p.born - 1) / 100) + 1 : 0; }
  function years(p) {
    if (p.bornLabel) return p.bornLabel;
    if (p.bornApprox && !p.died) return p.sex === 'f' ? 'съвременничка' : 'съвременник';
    var b = p.born ? (p.bornApprox ? 'ок. ' : '') + p.born : '?';
    if (p.died) return b + ' – ' + (p.diedApprox ? 'ок. ' : '') + p.died;
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
    else { pr.innerHTML = '<div class="mono">' + esc(initials(p.name)) + '</div>'; pr.setAttribute('data-pid', p.id); }
    d.appendChild(pr);
    return d;
  }

  /* ---------- снимки от Уикипедия ----------
     Браузърът пита API-то на Уикипедия за главната (свободна) снимка на статията.
     Резултатът се пази в localStorage за 7 дни. Ако няма снимка, остават инициалите. */
  var PKEY = 'bum-photos-v1', cache = {};
  try { var raw = JSON.parse(localStorage.getItem(PKEY) || '{}'); if (raw.t && Date.now() - raw.t < 7 * 864e5) cache = raw.d || {}; } catch (e) {}
  function saveCache() { try { localStorage.setItem(PKEY, JSON.stringify({ t: Date.now(), d: cache })); } catch (e) {} }
  var pending = {};
  function fetchLang(lang, people) {
    var titles = people.map(function (p) { return p.wiki[lang]; });
    var chunks = []; for (var i = 0; i < titles.length; i += 45) chunks.push(people.slice(i, i + 45));
    return Promise.all(chunks.map(function (ch) {
      var q = 'https://' + lang + '.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&prop=pageimages&piprop=thumbnail%7Cname&pithumbsize=480&titles=' +
        encodeURIComponent(ch.map(function (p) { return p.wiki[lang]; }).join('|'));
      return fetch(q).then(function (r) { return r.json(); }).then(function (j) {
        var qu = j.query || {}, map = {};
        (qu.normalized || []).forEach(function (n) { map[n.from] = n.to; });
        var red = {}; (qu.redirects || []).forEach(function (n) { red[n.from] = n.to; });
        var pages = {}; Object.keys(qu.pages || {}).forEach(function (k) { var pg = qu.pages[k]; pages[pg.title] = pg; });
        ch.forEach(function (p) {
          var t = p.wiki[lang]; t = map[t] || t; t = red[t] || t; var pg = pages[t];
          if (pg && pg.thumbnail) cache[p.id] = { s: pg.thumbnail.source, l: lang, a: pg.title, f: pg.pageimage || '' };
        });
      });
    })).catch(function () {});
  }
  function loadPhotos(root) {
    var nodes = Array.prototype.slice.call((root || document).querySelectorAll('[data-pid]'));
    var want = [];
    nodes.forEach(function (n) { var id = n.getAttribute('data-pid'); if (cache[id]) put(n, cache[id]); else if (BY[id] && !pending[id] && BY[id].wiki && !(id in cache)) { want.push(BY[id]); pending[id] = 1; } });
    if (!want.length) return;
    var bg = want.filter(function (p) { return p.wiki.bg; });
    fetchLang('bg', bg).then(function () {
      var en = want.filter(function (p) { return !cache[p.id] && p.wiki.en; });
      return fetchLang('en', en);
    }).then(function () {
      want.forEach(function (p) { if (!cache[p.id]) cache[p.id] = 0; });
      saveCache();
      document.querySelectorAll('[data-pid]').forEach(function (n) { var c = cache[n.getAttribute('data-pid')]; if (c) put(n, c); });
      document.dispatchEvent(new CustomEvent('bum-photos'));
    });
  }
  function put(node, c) {
    if (node.querySelector('img')) return;
    var img = new Image(); img.alt = ''; img.decoding = 'async'; img.referrerPolicy = 'no-referrer';
    img.onload = function () { img.className = 'on'; var m = node.querySelector('.mono'); if (m) m.remove(); };
    img.onerror = function () { img.remove(); };
    img.src = c.s; node.appendChild(img);
  }

  /* ---------- шапка и долна част ---------- */
  function chrome(active) {
    var top = document.getElementById('top');
    if (top) {
      top.className = 'top';
      top.innerHTML = '<div class="wrap"><a class="brand" href="index.html" aria-label="БУМ — начало">' + logo() +
        '<span><b>БУМ</b><small>Български Успехи<br>с Математика</small></span></a>' +
        '<nav class="nav" aria-label="Секции"><a href="deset.html"' + (active === 'ten' ? ' aria-current="page"' : '') + '>10 БУМа</a>' +
        '<a href="sto.html"' + (active === 'sto' ? ' aria-current="page"' : '') + '>СтоБУМ</a>' +
        '<a href="kilo.html"' + (active === 'kilo' ? ' aria-current="page"' : '') + '>КилоБУМ</a></nav>' +
        '<button class="theme" id="theme" type="button"></button></div>';
      applyTheme(getTheme());
      document.getElementById('theme').addEventListener('click', function () {
        var t = THEMES[(THEMES.indexOf(getTheme()) + 1) % 3]; try { localStorage.setItem('bum-theme', t); } catch (e) {} applyTheme(t);
      });
    }
    var f = document.getElementById('foot');
    if (f) {
      f.className = 'foot';
      f.innerHTML = '<div class="wrap"><span><b>БУМ</b> — Български Успехи с Математика · истории за хора, които променят света с числа</span>' +
        '<span>Снимки: Уикипедия / Уикимедия Общомедия, свободни лицензи · <a href="../">Още проекти</a> · <button type="button" class="ck" onclick="window.d4Consent&&d4Consent.reset()">Бисквитки</button></span></div>';
    }
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
    function show(p, isDay) {
      box.innerHTML = '';
      var a = artBlock(p); a.appendChild(el('div', 'stamp', isDay ? 'БУМ на деня' : 'Случаен БУМ'));
      box.appendChild(a);
      var b = el('div', 'body');
      b.innerHTML = '<div>' + fieldTag(p) + ' <span class="eyebrow" style="color:var(--muted)">· ' + SECTIONS[p.sec].name + '</span></div>' +
        '<h2>' + esc(p.title) + '</h2><div class="who">' + esc(p.name) + ' <span>' + esc(years(p)) + (p.place ? ' · ' + esc(p.place) : '') + '</span></div>' +
        '<p class="lede">' + esc(p.lede) + '</p><div class="acts"><a class="btn" href="' + url(p) + '">Прочети историята →</a><button class="btn ghost" type="button" id="again">🎲 Друг БУМ</button></div>';
      box.appendChild(b);
      document.getElementById('again').onclick = function () { var j; do { j = Math.floor(Math.random() * pool.length); } while (pool[j] === p && pool.length > 1); show(pool[j], false); };
      loadPhotos(box);
    }
    show(pool[idx], true);

    function faces(list) { return list.map(function (p) { return '<span data-pid="' + (p.avatar ? '' : p.id) + '">' + (p.avatar ? Art.avatar(p.avatar) : Art.svg(p)) + '</span>'; }).join(''); }
    var secs = document.getElementById('sections');
    secs.innerHTML =
      '<a class="sec" href="deset.html"><span class="big">10</span><h3>10 БУМа</h3><p>Десетте най-известни и най-важни приноса на българи чрез математика и науки — от първия електронен компютър до кристалите в лазерите.</p><div class="faces">' + faces(TEN.slice(0, 6)) + '</div></a>' +
      '<a class="sec" href="sto.html"><span class="big">100</span><h3>СтоБУМ</h3><p>Сто истории на успеха — не всички прочути, но всички истински. Жени и мъже от различни векове и области.</p><div class="faces">' + faces(shuffle(STO).slice(0, 6)) + '</div></a>' +
      '<a class="sec" href="kilo.html"><span class="big">1000</span><h3>КилоБУМ</h3><p>Истории, които събираме чрез интервюта — с хора около нас, които правят нещо важно с математика. Засега: примерни статии.</p><div class="faces">' + faces(KILO) + '</div></a>';
    secs.querySelectorAll('[data-pid=""]').forEach(function (n) { n.removeAttribute('data-pid'); });
    loadPhotos(secs);

    var real = TEN.concat(STO), women = real.filter(function (p) { return p.sex === 'f'; }).length;
    var cs = real.map(century).filter(Boolean), minC = Math.min.apply(null, cs), maxC = Math.max.apply(null, cs);
    document.getElementById('stats').innerHTML = '<div><b>' + real.length + '</b><span>истински истории</span></div><div><b>' + women + '</b><span>жени</span></div><div><b>' + roman(minC) + '–' + roman(maxC) + '</b><span>век</span></div>';
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
    var fieldsUsed = Object.keys(FIELDS).filter(function (k) { return data.some(function (p) { return p.field === k; }); });
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
    q.oninput = function () { st.q = q.value.trim().toLowerCase(); render(); };
    sort.onchange = function () { st.sort = sort.value; if (st.sort === 'random') rnd = shuffle(data); render(); };
    var rnd = shuffle(data);

    function match(p, skip) {
      if (st.q && (p.name + ' ' + p.title + ' ' + (p.tags || []).join(' ') + ' ' + (p.place || '') + ' ' + FIELDS[p.field]).toLowerCase().indexOf(st.q) < 0) return false;
      if (skip !== 'sex' && st.sex && p.sex !== st.sex) return false;
      if (skip !== 'cent' && st.cent && String(century(p)) !== st.cent) return false;
      if (skip !== 'field' && st.field && p.field !== st.field) return false;
      return true;
    }
    function counts(id, key, fn) {
      document.querySelectorAll('#' + id + ' .chip').forEach(function (b) {
        var v = b.dataset.v; b.setAttribute('aria-pressed', String(st[key] === v));
        b.querySelector('.n').textContent = data.filter(function (p) { return match(p, key) && (!v || fn(p) === v); }).length;
      });
    }
    var list = document.getElementById('list'), cnt = document.getElementById('count');
    function render() {
      counts('f-sex', 'sex', function (p) { return p.sex; });
      counts('f-cent', 'cent', function (p) { return String(century(p)); });
      counts('f-field', 'field', function (p) { return p.field; });
      var arr = (st.sort === 'random' ? rnd : data).filter(function (p) { return match(p); });
      if (st.sort === 'born-desc') arr = arr.slice().sort(function (a, b) { return b.born - a.born; });
      if (st.sort === 'name') arr = arr.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'bg'); });
      if (st.sort === 'born') arr = arr.slice().sort(function (a, b) { return a.born - b.born; });
      list.innerHTML = '';
      arr.forEach(function (p) { list.appendChild(listItem(p)); });
      cnt.textContent = arr.length === data.length ? 'Всички ' + arr.length + ' истории' : arr.length + ' от ' + data.length + ' истории';
      if (!arr.length) list.innerHTML = '<li class="empty">Няма истории с тези филтри. Опитай с по-малко.</li>';
      loadPhotos(list);
    }
    render();
  }

  /* ---------- СТАТИЯ ---------- */
  function pageStory() {
    var id = new URLSearchParams(location.search).get('id'), p = BY[id];
    chrome(p ? p.sec : '');
    var main = document.getElementById('main');
    if (!p) { main.innerHTML = '<div class="wrap page-head"><h1>Няма такава история</h1><p><a href="index.html">Към началото</a></p></div>'; return; }
    document.title = p.name + ' — ' + p.title + ' · БУМ';
    var md = document.querySelector('meta[name=description]'); if (md) md.setAttribute('content', p.lede);
    var S = SECTIONS[p.sec];

    var hero = el('div', 'hero'), art = artBlock(p);
    hero.appendChild(art);
    hero.appendChild(el('div', 'crumbs', '<div class="wrap"><a href="' + S.href + '">← ' + S.name + '</a></div>'));
    main.appendChild(hero);

    var ar = el('article', 'article');
    var head = '<div class="head">' + (p.fictional ? '<span class="fict">Измислен' + (p.sex === 'f' ? 'а' : '') + ' човек · примерна статия</span>' : '') +
      fieldTag(p) + '<div class="name">' + esc(p.name) + ' <span>' + esc(years(p)) + (p.age ? ' · ' + p.age + ' г.' : '') + (p.place ? ' · ' + esc(p.place) : '') + '</span></div>' +
      '<h1>' + esc(p.title) + '</h1><p class="lede">' + esc(p.lede) + '</p>' +
      (p.tags && p.tags.length ? '<div class="tags">' + p.tags.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' : '') + '</div>';
    var body = '';
    if (p.fictional) body += '<div class="notice" style="margin-top:28px"><span class="fict">!</span><p><b>Това е примерна статия.</b> ' + esc(p.name) + ' не съществува — човекът, историята, интервюто и видеото са измислени, за да покажат как ще изглеждат истинските истории в КилоБУМ, които ще събираме чрез интервюта. Линковете водят към истински статии по темата.</p></div>';
    body += '<div class="body">' + p.story.map(function (s) { return '<p>' + esc(s) + '</p>'; }).join('') + '</div>';
    if (p.num) body += '<div class="bignum"><b>' + esc(p.num.n) + '</b><span><small>БУМ число</small>' + esc(p.num.t) + '</span></div>';
    if (p.sec === 'kilo') {
      body += '<div class="kilo-media"><div><div class="vid"><span class="fict vtag">примерно видео</span><video controls playsinline preload="none" poster="' + esc(p.video.poster) + '" src="' + esc(p.video.src) + '"></video></div><div class="vcap">' + esc(p.video.caption) + '</div></div>' +
        '<figure class="figure"><div class="art">' + Art.svg({ id: p.id + '-work', field: p.field, motif: p.work.motif }) + '</div><figcaption><b>От работата ' + (p.sex === 'f' ? 'ѝ' : 'му') + '</b>' + esc(p.work.caption) + '</figcaption></figure></div>';
      body += '<section class="qa"><h2>Интервю</h2><dl>' + p.interview.map(function (x) { return '<div><dt>' + esc(x.q) + '</dt><dd>' + esc(x.a) + '</dd></div>'; }).join('') + '</dl></section>';
    }
    if (p.links && p.links.length) body += '<nav class="links" aria-label="Още информация"><h2>' + (p.fictional ? 'Прочети още по темата' : 'Прочети още') + '</h2>' + p.links.map(function (l) {
      var host = ''; try { host = new URL(l.u).hostname.replace(/^www\./, ''); } catch (e) {}
      return '<a href="' + esc(l.u) + '" target="_blank" rel="noopener">' + esc(l.t) + ' <span>' + esc(host) + ' ↗</span></a>';
    }).join('') + '</nav>';
    body += '<p class="credit" id="credit"></p>';

    var list = p.sec === 'ten' ? TEN : p.sec === 'sto' ? STO : KILO, i = list.indexOf(p);
    var prev = list[(i - 1 + list.length) % list.length], next = list[(i + 1) % list.length];
    body += '<div class="pager"><a href="' + url(prev) + '"><small>← Предишна</small><b>' + esc(prev.name) + '</b></a><a class="next" href="' + url(next) + '"><small>Следваща →</small><b>' + esc(next.name) + '</b></a></div>';
    ar.innerHTML = head + body;
    main.appendChild(ar);

    var more = el('section', 'more wrap', '<h2>Още БУМ истории</h2>'), ul = el('div', 'strip');
    shuffle(TEN.concat(STO).filter(function (x) { return x !== p; })).slice(0, 5).forEach(function (x) { ul.appendChild(stripCard(x)); });
    more.appendChild(ul); main.appendChild(more);

    function credit() {
      var c = cache[p.id], n = document.getElementById('credit');
      if (c && n) n.innerHTML = 'Снимка: <a href="https://' + c.l + '.wikipedia.org/wiki/' + encodeURIComponent((c.f ? 'File:' + c.f : c.a).replace(/ /g, '_')) + '" target="_blank" rel="noopener">Уикипедия' + (c.f ? ' / ' + esc(c.f) : '') + '</a> (свободен лиценз). Графиката е рисувана за БУМ.';
      else if (n && p.avatar) n.textContent = 'Портретът е рисунка, а не снимка — човекът е измислен.';
    }
    document.addEventListener('bum-photos', credit);
    loadPhotos(document); credit();
  }

  window.BUM = { TEN: TEN, STO: STO, KILO: KILO, FIELDS: FIELDS };
  var page = document.body.getAttribute('data-page');
  if (page === 'home') pageHome();
  else if (page === 'ten') pageTen();
  else if (page === 'sto') pageList('sto');
  else if (page === 'kilo') pageList('kilo');
  else if (page === 'story') pageStory();
})();
