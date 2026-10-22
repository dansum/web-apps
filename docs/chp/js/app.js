// Приложение: навигация (#/…), изгледи за курс, умение, статия и тест.
import * as store from './store.js';
import { ask } from './quiz.js';
import { mountLowfi } from './lowfi.js';
import { hasWebGL, esc, shuffle } from './kit.js';

const GRADES = ['3', '4', '5', '6'];
const PRACTICE_N = 5;
const UNIT_TEST_MAX = 12;
const CHALLENGE_MAX = 30;

const courses = {};
const view = document.getElementById('view');
let cleanup = [];

async function loadCourses() {
  await Promise.all(GRADES.map(async (g) => {
    try {
      courses[g] = (await import(`../data/grade${g}.js`)).default;
    } catch (e) {
      console.warn('Няма данни за', g, e);
      courses[g] = null;
      return;
    }
    // Видеата са в отделен файл за всеки клас.
    try {
      const r = await fetch(`data/videos-grade${g}.json`);
      if (!r.ok) return;
      const vids = await r.json();
      for (const u of courses[g].units) {
        for (const sk of u.skills) if (!sk.video && vids[sk.id] && vids[sk.id].youtubeId) sk.video = vids[sk.id];
      }
    } catch (e) { /* без видеа за този клас */ }
  }));
}

// ---- търсене ----
function findSkill(id) {
  for (const c of Object.values(courses)) {
    if (!c) continue;
    for (const u of c.units) {
      const i = u.skills.findIndex((s) => s.id === id);
      if (i >= 0) return { course: c, unit: u, skill: u.skills[i], index: i };
    }
  }
  return null;
}
function findUnit(id) {
  for (const c of Object.values(courses)) {
    if (!c) continue;
    const u = c.units.find((x) => x.id === id);
    if (u) return { course: c, unit: u };
  }
  return null;
}
function findArticle(id) {
  for (const c of Object.values(courses)) {
    if (!c) continue;
    for (const u of c.units) if (u.article && u.article.id === id) return { course: c, unit: u, article: u.article };
  }
  return null;
}
function nextSkill(id) {
  const f = findSkill(id);
  if (!f) return null;
  const all = f.course.units.flatMap((u) => u.skills);
  const k = all.findIndex((s) => s.id === id);
  return all[k + 1] || null;
}

// ---- знаци ----
function monBadges(item, { long = false } = {}) {
  const out = [];
  if (!item.mon) {
    out.push(`<span class="badge warn" title="Това не идва от учебната програма на МОН.">⚠ Не е по програма на МОН</span>`);
  }
  if (item.assumption) {
    out.push(long
      ? `<div class="warnbox"><b>⚠ Наше предположение, не е по данни от МОН:</b> ${esc(item.assumption)}</div>`
      : `<span class="badge warn" title="${esc(item.assumption)}">⚠ Наше предположение</span>`);
  }
  return out.join(' ');
}
function devBadge(item) {
  if (item.quality === 'high' && item.review) {
    return '<span class="badge hq">★ 3D преживяване</span> <span class="badge warn" title="Преживяването е готово, но още не е изпитано докрай.">🚧 В проверка</span>';
  }
  return item.quality === 'high' ? '<span class="badge hq">★ 3D преживяване</span>'
    : '<span class="badge warn" title="Опростена версия. Пълното 3D преживяване се разработва.">🚧 В разработка</span>';
}
function levelChip(id) {
  const lv = store.LEVELS[store.level(id)];
  return `<span class="lvchip ${lv.cls}"><i class="sq ${lv.cls}"></i>${esc(lv.name)}</span>`;
}
function sq(id) {
  const lv = store.LEVELS[store.level(id)];
  return `<i class="sq ${lv.cls}" title="${esc(lv.name)}"></i>`;
}
function monSource(course, item) {
  if (!item.mon) return '';
  const pages = (item.mon.pages || []).join(', ');
  return `<details class="monbox"><summary>📘 По учебната програма на МОН: <b>${esc(course.source.pdf)}</b>, стр. ${esc(pages)}</summary>
    ${item.mon.topic ? `<p><b>Тема:</b> ${esc(item.mon.topic)}</p>` : ''}
    ${item.mon.competences?.length ? `<p><b>Очаквани резултати:</b></p><ul>${item.mon.competences.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
    <p class="small">${esc(course.source.title)}. Текстът е извлечен автоматично от PDF файла и предстои дословна сверка.</p></details>`;
}
function crumbs(parts) {
  return `<nav class="crumbs">${parts.map(([href, t]) => href ? `<a href="${href}">${esc(t)}</a>` : `<span>${esc(t)}</span>`).join(' › ')}</nav>`;
}
function progressBar(pct) {
  return `<div class="pbar"><div style="width:${pct}%"></div></div>`;
}
function legend() {
  return `<div class="legend">${store.LEVELS.map((l) => `<span><i class="sq ${l.cls}"></i>${esc(l.name)}</span>`).join('')}</div>`;
}

// ---- изгледи ----
function renderHome() {
  document.title = 'Човекът и природата в 3D';
  view.innerHTML = `
    <section class="hero">
      <h1>Човекът и природата в 3D</h1>
      <p>Курсове за 3.–6. клас по учебните програми на МОН. Гледай, пипай, върти и проверявай знанията си.</p>
      <p class="small" style="color:#dbe7ff">Алфа версия. <a href="programa.html" style="color:#fff">Програмен план до пълния продукт →</a></p>
    </section>
    <section class="cards">
      ${GRADES.map((g) => {
        const c = courses[g];
        if (!c) return `<div class="card disabled"><h2>${g}. клас</h2><p>Съдържанието се подготвя.</p></div>`;
        const pct = store.coursePercent(c);
        const n = c.units.reduce((s, u) => s + u.skills.length, 0);
        return `<a class="card" href="#/c/${g}"><div class="grade">${g}</div><h2>${esc(c.title)}</h2>
          <p>${c.units.length} раздела · ${n} умения</p>${progressBar(pct)}<p class="small">${pct}% овладяване</p></a>`;
      }).join('')}
    </section>
    ${signsHelp()}`;
}

function signsHelp() {
  return `<details class="signs"><summary>Какво значат знаците</summary>
    <p><span class="badge hq">★ 3D преживяване</span> Пълно интерактивно преживяване.</p>
    <p><span class="badge warn">🚧 В разработка</span> Опростена 3D версия с картинка; пълното преживяване предстои.</p>
    <p><span class="badge warn">🚧 В проверка</span> Пълното преживяване е готово, но още не е изпитано докрай.</p>
    <p><span class="badge warn">⚠ Наше предположение</span> или <span class="badge warn">⚠ Не е по програма на МОН</span> Частта не идва директно от учебната програма на МОН.</p>
    <p><span class="badge warn">⚠ Непрегледано видео</span> Видеото е намерено автоматично и още не е прегледано от учител.</p></details>`;
}

function renderCourse(g) {
  const c = courses[g];
  if (!c) return notFound();
  document.title = c.title;
  const pct = store.coursePercent(c);
  view.innerHTML = `
    ${crumbs([['#/', 'Курсове'], [null, `${g}. клас`]])}
    <header class="course-head">
      <div><h1>${esc(c.title)}</h1>
        <p class="small">Основа: ${esc(c.source.title)} (<code>${esc(c.source.pdf)}</code>)</p></div>
      <div class="course-mastery"><b>${pct}%</b> овладяване ${progressBar(pct)}${legend()}</div>
    </header>
    <div class="course-grid">
      <aside class="unit-nav">
        <h3>Раздели</h3>
        <ol>${c.units.map((u) => `<li><a href="#u-${u.id}" data-scroll="u-${u.id}">${esc(u.title)}</a>
          <div class="sqrow">${u.skills.map((s) => sq(s.id)).join('')}</div></li>`).join('')}</ol>
        <a class="challenge" href="#/t/${g}">🏆 Предизвикателство за курса</a>
      </aside>
      <div class="units">
        ${c.units.map((u, k) => {
          const t = store.getState().tests[u.id];
          return `<section class="unit" id="u-${u.id}">
            <div class="unit-head"><span class="unit-n">Раздел ${k + 1}</span><h2>${esc(u.title)}</h2>
              ${u.mon ? `<span class="small">МОН, стр. ${esc((u.mon.pages || []).join(', '))}${u.mon.part ? ' · ' + esc(u.mon.part) : ''}</span>` : ''}
              ${monBadges(u, { long: true })}</div>
            <ul class="skills">
              ${u.skills.map((s) => `<li><a href="#/s/${s.id}">${sq(s.id)}<span class="sid">${esc(s.id)}</span> <span class="stitle">${esc(s.title)}</span></a>
                <span class="sbadges">${devBadge(s)} ${monBadges(s)}</span></li>`).join('')}
            </ul>
            <div class="unit-extra">
              ${u.article ? `<a class="pill" href="#/a/${u.article.id}">📖 Статия: ${esc(u.article.title)} ${store.getState().articles[u.article.id] ? '✔' : ''}</a> ${devBadge(u.article)}` : ''}
              <a class="pill test" href="#/t/${u.id}">📝 Тест върху раздела${t ? ` · най-добър резултат ${Math.round(t.best * 100)}%` : ''}</a>
            </div>
          </section>`;
        }).join('')}
        <section class="unit challenge-card"><h2>🏆 Предизвикателство за курса</h2>
          <p>Провери всичко от курса наведнъж. Верните отговори вдигат уменията до „Овладяно“.</p>
          <a class="btn primary" href="#/t/${g}">Започни</a>
          ${store.getState().tests[g] ? `<span class="small"> Най-добър резултат: ${Math.round(store.getState().tests[g].best * 100)}%</span>` : ''}
        </section>
      </div>
    </div>`;
  view.querySelectorAll('[data-scroll]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById(a.dataset.scroll)?.scrollIntoView({ behavior: 'smooth' });
  }));
}

const LANGS = { en: 'на английски', ru: 'на руски', none: 'без говор' };
function videoSlot(skill) {
  const v = skill.video;
  if (v && v.youtubeId) {
    const lang = v.lang && v.lang !== 'bg' ? ` · ${esc(LANGS[v.lang] || v.lang)}` : '';
    const note = v.confidence === 'high' ? ''
      : '<p class="vnote"><span class="badge warn" title="Видеото е намерено автоматично и още не е прегледано от учител.">⚠ Непрегледано видео</span></p>';
    return `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${esc(v.youtubeId)}?rel=0"
      title="${esc(v.title || 'Видео')}" allowfullscreen loading="lazy"
      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"></iframe>
      <p class="small">🎬 ${esc(v.title || '')}${lang} · <a href="https://www.youtube.com/watch?v=${esc(v.youtubeId)}" target="_blank" rel="noopener">отвори в YouTube</a></p>${note}</div>`;
  }
  return `<div class="video empty"><span class="badge warn">🎬 Видеото още не е подбрано</span></div>`;
}

async function renderSkill(id) {
  const f = findSkill(id);
  if (!f) return notFound();
  const { course, unit, skill } = f;
  document.title = `${skill.title} · ${course.id}. клас`;
  const nxt = nextSkill(id);
  view.innerHTML = `
    ${crumbs([['#/', 'Курсове'], [`#/c/${course.id}`, `${course.id}. клас`], [`#/c/${course.id}`, unit.title], [null, skill.id]])}
    <header class="skill-head">
      <h1><span class="sid">${esc(skill.id)}</span> ${esc(skill.title)}</h1>
      <div class="skill-badges">${levelChip(skill.id)} ${devBadge(skill)} ${monBadges(skill)}</div>
    </header>
    ${skill.assumption ? monBadges({ mon: skill.mon, assumption: skill.assumption }, { long: true }) : ''}
    ${monSource(course, skill)}
    <div class="skill-grid ${skill.quality === 'high' ? 'wide' : ''}">
      <section class="exercise"><h2>Упражнение</h2><div class="ex-area"></div></section>
      <aside class="side">${videoSlot(skill)}
        ${nxt ? `<a class="pill" href="#/s/${nxt.id}">Следващо умение: ${esc(nxt.title)} →</a>` : `<a class="pill" href="#/c/${course.id}">Обратно към курса</a>`}
      </aside>
    </div>`;
  const area = view.querySelector('.ex-area');

  if (skill.quality === 'high' && skill.experience) {
    if (!hasWebGL()) return noWebGL(area, skill, course);
    area.innerHTML = '<p class="small">Зареждане на 3D преживяването…</p>';
    try {
      const mod = await import(`./exp/${skill.experience}.js`);
      area.innerHTML = '';
      const inst = mod.mount(area, {
        skill, course,
        onComplete(ratio) {
          const r = store.applyPractice(skill.id, ratio);
          view.querySelector('.skill-badges').innerHTML = `${levelChip(skill.id)} ${devBadge(skill)} ${monBadges(skill)}`;
          return { ...r, levelName: store.LEVELS[r.after].name, next: nxt };
        },
      });
      cleanup.push(() => inst.dispose());
    } catch (e) {
      console.error(e);
      area.innerHTML = `<p class="warn">Преживяването не можа да се зареди: ${esc(e.message)}</p>`;
    }
    return;
  }

  // Опростено упражнение: 3D сцена + въпроси.
  if (!hasWebGL()) return noWebGL(area, skill, course);
  area.innerHTML = `<figure class="picture"><img src="img/${esc(skill.id)}.svg" alt="${esc(skill.title)}" loading="lazy" onerror="this.parentElement.remove()"></figure>
    <div class="lowfi-wrap"><div class="lowfi"></div><p class="scene-hint">Върти сцената с пръст или мишка. Кликни върху обект, за да прочетеш за него.</p></div>
    <div class="practice"></div>`;
  let lf = null;
  lf = mountLowfi(area.querySelector('.lowfi'), skill.scene?.objects || [], { onPick: (pid) => lf && lf._onPick && lf._onPick(pid) });
  cleanup.push(() => lf.dispose());
  practiceIntro(area.querySelector('.practice'), skill, lf, nxt, course);
}

function noWebGL(area, skill, course) {
  area.innerHTML = `<p class="warn">Този браузър не показва 3D (WebGL). Въпросите работят и без него.</p><div class="practice"></div>`;
  practiceIntro(area.querySelector('.practice'), skill, null, nextSkill(skill.id), course);
}

function practiceIntro(el, skill, lf, nxt, course) {
  const n = Math.min(PRACTICE_N, skill.questions?.length || 0);
  if (!n) { el.innerHTML = '<p class="warn">Още няма въпроси за това умение.</p>'; return; }
  el.innerHTML = `<div class="ex-start"><p>Разгледай сцената, после отговори на <b>${n} въпроса</b>.
    С поне ${Math.ceil(n * 0.7)} верни ставаш „Запознат“, с всички верни — „Владее“.</p>
    <button class="btn primary">Започни упражнението</button></div>`;
  el.querySelector('button').addEventListener('click', () => runPractice(el, skill, lf, nxt, course, n));
}

function runPractice(el, skill, lf, nxt, course, n) {
  const qs = shuffle(skill.questions).slice(0, n);
  const results = [];
  const objects = skill.scene?.objects || [];
  const step = () => {
    const i = results.length;
    if (i >= qs.length) return finish();
    el.innerHTML = `<div class="dots">${qs.map((_, k) => `<i class="${k < i ? (results[k] ? 'ok' : 'no') : k === i ? 'cur' : ''}"></i>`).join('')}</div><div class="qwrap"></div>`;
    ask(el.querySelector('.qwrap'), qs[i], {
      lowfi: lf, objects,
      nextLabel: i === qs.length - 1 ? 'Виж резултата' : 'Следващ въпрос',
      onDone: (ok) => { results.push(ok); step(); },
    });
  };
  const finish = () => {
    const good = results.filter(Boolean).length;
    const r = store.applyPractice(skill.id, good / qs.length);
    const lv = store.LEVELS[r.after];
    view.querySelector('.skill-badges').innerHTML = `${levelChip(skill.id)} ${devBadge(skill)} ${monBadges(skill)}`;
    el.innerHTML = `<div class="result"><h3>${good} от ${qs.length} верни</h3>
      <p>Ниво на умението: <span class="lvchip ${lv.cls}"><i class="sq ${lv.cls}"></i>${esc(lv.name)}</span>
      ${r.after > r.before ? ' ⬆' : ''}</p>
      ${r.after === 3 ? '<p class="small">За „Овладяно“ реши правилно въпросите за това умение в теста върху раздела или в предизвикателството за курса.</p>' : ''}
      <div class="row"><button class="btn again">Опитай пак</button>
      ${nxt ? `<a class="btn primary" href="#/s/${nxt.id}">Следващо умение →</a>` : `<a class="btn primary" href="#/c/${course.id}">Към курса</a>`}</div></div>`;
    el.querySelector('.again').addEventListener('click', () => runPractice(el, skill, lf, nxt, course, n));
  };
  step();
}

function renderArticle(id) {
  const f = findArticle(id);
  if (!f) return notFound();
  const { course, unit, article } = f;
  document.title = article.title;
  view.innerHTML = `
    ${crumbs([['#/', 'Курсове'], [`#/c/${course.id}`, `${course.id}. клас`], [`#/c/${course.id}`, unit.title], [null, 'Статия']])}
    <header class="skill-head"><h1>📖 ${esc(article.title)}</h1><div>${devBadge(article)} ${monBadges(article)}</div></header>
    <div class="article-stage"><div class="lowfi tall"></div>
      <div class="article-panel"><div class="article-step"></div>
        <div class="row"><button class="btn prev">← Назад</button><span class="counter"></span><button class="btn primary next">Напред →</button></div></div></div>`;
  const steps = article.steps || [];
  const objects = article.scene?.objects || [];
  if (!hasWebGL()) {
    view.querySelector('.lowfi').innerHTML = '<p class="warn">Този браузър не показва 3D. Текстът е по-долу.</p>';
  }
  const lf = hasWebGL() ? mountLowfi(view.querySelector('.lowfi'), objects) : null;
  if (lf) cleanup.push(() => lf.dispose());
  let k = 0;
  let bub = null;
  const panel = view.querySelector('.article-step');
  const draw = () => {
    const s = steps[k];
    view.querySelector('.counter').textContent = `${k + 1} / ${steps.length}`;
    view.querySelector('.prev').disabled = k === 0;
    const last = k === steps.length - 1;
    view.querySelector('.next').textContent = last ? 'Готово ✔' : 'Напред →';
    if (bub) { bub.remove(); bub = null; }
    const o = objects.find((x) => x.id === s.focus);
    if (lf && o) {
      const g = lf.stage.scene.children.find((c) => c.userData.pickId === o.id);
      if (g) {
        const p = g.position;
        lf.stage.flyTo([p.x * 0.6, p.y + 3.2, p.z + 5.2], [p.x, p.y + 0.5, p.z]);
        bub = lf.stage.bubble(g, `<b>${esc(o.label)}</b><br>${esc(s.text)}`, { lift: g.userData.top, cls: 'wide' });
      }
      panel.innerHTML = `<p class="small">Стъпка ${k + 1}: <b>${esc(o.label)}</b>. Текстът е до обекта в сцената.</p>`;
    } else {
      panel.innerHTML = `<p>${esc(s.text)}</p>`;
    }
    if (!lf) panel.innerHTML = `<p><b>${esc(o ? o.label : '')}</b> ${esc(s.text)}</p>`;
  };
  view.querySelector('.prev').addEventListener('click', () => { if (k > 0) { k--; draw(); } });
  view.querySelector('.next').addEventListener('click', () => {
    if (k < steps.length - 1) { k++; draw(); return; }
    store.markArticle(article.id);
    location.hash = `#/c/${course.id}`;
  });
  if (steps.length) draw();
}

function pickTestQuestions(skills, max, perSkill) {
  const pools = shuffle(skills).map((s) => ({ s, qs: shuffle(s.questions || []) }));
  const out = [];
  for (let round = 0; round < perSkill && out.length < max; round++) {
    for (const p of pools) {
      if (out.length >= max) break;
      if (p.qs[round]) out.push({ skill: p.s, q: p.qs[round] });
    }
  }
  return shuffle(out);
}

function renderTest(id) {
  const isCourse = GRADES.includes(id);
  const course = isCourse ? courses[id] : findUnit(id)?.course;
  const unit = isCourse ? null : findUnit(id)?.unit;
  if (!course || (!isCourse && !unit)) return notFound();
  const skills = isCourse ? course.units.flatMap((u) => u.skills) : unit.skills;
  const title = isCourse ? 'Предизвикателство за курса' : `Тест върху раздела: ${unit.title}`;
  document.title = title;
  view.innerHTML = `
    ${crumbs([['#/', 'Курсове'], [`#/c/${course.id}`, `${course.id}. клас`], [null, isCourse ? 'Предизвикателство' : 'Тест']])}
    <header class="skill-head"><h1>${isCourse ? '🏆' : '📝'} ${esc(title)}</h1></header>
    <section class="test"></section>`;
  const el = view.querySelector('.test');
  const max = isCourse ? CHALLENGE_MAX : UNIT_TEST_MAX;
  const est = Math.min(max, skills.length * (isCourse ? 1 : 2));
  el.innerHTML = `<div class="ex-start"><p><b>${est} въпроса</b> от ${skills.length} умения. Верен отговор вдига умението с едно ниво
    (до „Овладяно“), грешен го сваля с едно.</p><button class="btn primary">Започни теста</button></div>`;
  el.querySelector('button').addEventListener('click', () => {
    const items = pickTestQuestions(skills, max, isCourse ? 1 : 2);
    const results = [];
    const changes = new Map();
    const step = () => {
      const i = results.length;
      if (i >= items.length) return finish();
      const { skill, q } = items[i];
      el.innerHTML = `<div class="test-top"><span>Въпрос ${i + 1} от ${items.length}</span><span class="small">Умение ${esc(skill.id)}: ${esc(skill.title)}</span></div>
        <div class="dots">${items.map((_, k) => `<i class="${k < i ? (results[k] ? 'ok' : 'no') : k === i ? 'cur' : ''}"></i>`).join('')}</div><div class="qwrap"></div>`;
      ask(el.querySelector('.qwrap'), q, {
        objects: skill.scene?.objects || [],
        nextLabel: i === items.length - 1 ? 'Виж резултата' : 'Следващ въпрос',
        onDone: (ok) => {
          results.push(ok);
          const r = store.applyTestAnswer(skill.id, ok);
          if (!changes.has(skill.id)) changes.set(skill.id, { skill, before: r.before });
          changes.get(skill.id).after = r.after;
          step();
        },
      });
    };
    const finish = () => {
      const good = results.filter(Boolean).length;
      store.recordTest(id, good / Math.max(1, items.length));
      el.innerHTML = `<div class="result"><h3>${good} от ${items.length} верни (${Math.round((good / Math.max(1, items.length)) * 100)}%)</h3>
        <table class="changes"><thead><tr><th>Умение</th><th>Преди</th><th>Сега</th></tr></thead><tbody>
        ${[...changes.values()].map((c) => `<tr><td><a href="#/s/${c.skill.id}">${esc(c.skill.id)} ${esc(c.skill.title)}</a></td>
          <td><span class="lvchip ${store.LEVELS[c.before].cls}"><i class="sq ${store.LEVELS[c.before].cls}"></i>${esc(store.LEVELS[c.before].name)}</span></td>
          <td><span class="lvchip ${store.LEVELS[c.after].cls}"><i class="sq ${store.LEVELS[c.after].cls}"></i>${esc(store.LEVELS[c.after].name)}</span>
          ${c.after > c.before ? '⬆' : c.after < c.before ? '⬇' : ''}</td></tr>`).join('')}
        </tbody></table>
        <div class="row"><a class="btn primary" href="#/c/${course.id}">Към курса</a></div></div>`;
    };
    step();
  });
}

function notFound() {
  view.innerHTML = `<p class="warn">Страницата не е намерена.</p><p><a href="#/">Към началото</a></p>`;
}

// ---- лента с напредъка ----
function courseOfRoute(kind, arg) {
  if (kind === 'c' || (kind === 't' && GRADES.includes(arg))) return courses[arg];
  if (kind === 's') return findSkill(arg)?.course;
  if (kind === 'a') return findArticle(arg)?.course;
  if (kind === 't') return findUnit(arg)?.course;
  return null;
}
function drawStats(course) {
  const el = document.getElementById('stats');
  if (!el) return;
  if (course) store.setLastCourse(course.id);
  const c = course || courses[store.getState().lastCourse] || null;
  const today = store.tasksToday();
  const word = today === 1 ? 'задача' : 'задачи';
  let left;
  if (c) {
    const pct = store.coursePercent(c);
    left = `<span class="stat">📘 ${esc(c.id)}. клас: <b>${pct}%</b> от курса <span class="mini"><i style="width:${pct}%"></i></span></span>`;
  } else {
    const all = GRADES.map((g) => courses[g]).filter(Boolean);
    const pct = all.length ? Math.round(all.reduce((a, x) => a + store.coursePercent(x), 0) / all.length) : 0;
    left = `<span class="stat">📘 Всички курсове: <b>${pct}%</b> <span class="mini"><i style="width:${pct}%"></i></span></span>`;
  }
  el.innerHTML = `<div class="in">${left}<span class="stat">✅ Днес: <b>${today}</b> ${word}</span></div>`;
  el.hidden = false;
}
store.onChange(() => {
  const h = location.hash.replace(/^#\/?/, '').split('/');
  drawStats(courseOfRoute(h[0], h[1]));
});

// ---- маршрути ----
function route() {
  for (const fn of cleanup) { try { fn(); } catch (e) { console.warn(e); } }
  cleanup = [];
  const h = location.hash.replace(/^#\/?/, '');
  const [kind, arg] = h.split('/');
  window.scrollTo(0, 0);
  drawStats(courseOfRoute(kind, arg));
  if (!kind) return renderHome();
  if (kind === 'c') return renderCourse(arg);
  if (kind === 's') return renderSkill(arg);
  if (kind === 'a') return renderArticle(arg);
  if (kind === 't') return renderTest(arg);
  if (kind.startsWith('u-')) return; // котва в страницата на курса
  return notFound();
}

// ---- горна лента: име, сваляне, качване ----
function toast(msg, kind = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3800);
}

function drawName() {
  const n = store.getState().name;
  document.getElementById('who').textContent = n ? `👤 ${n}` : '👤 Въведи име';
}

async function importFile(file) {
  const text = await file.text();
  const r = store.importText(text);
  if (!r.ok) return toast(r.error, 'bad');
  drawName();
  toast(r.warning || 'Напредъкът е зареден.', r.warning ? 'bad' : 'good');
  route();
}

function setupBar() {
  drawName();
  document.getElementById('who').addEventListener('click', () => {
    const n = prompt('Как се казваш? (Името влиза в името на файла с напредъка.)', store.getState().name || '');
    if (n !== null) { store.setName(n); drawName(); }
  });
  document.getElementById('dl').addEventListener('click', () => {
    if (!store.getState().name) {
      const n = prompt('Как се казваш? (Името влиза в името на файла.)', '');
      if (n) { store.setName(n); drawName(); }
    }
    store.download();
    toast('Файлът с напредъка е свален. Пази го и го качи следващия път.', 'good');
  });
  const inp = document.getElementById('ul-input');
  document.getElementById('ul').addEventListener('click', () => inp.click());
  inp.addEventListener('change', () => { if (inp.files[0]) importFile(inp.files[0]); inp.value = ''; });
  window.addEventListener('dragover', (e) => { e.preventDefault(); document.body.classList.add('dropping'); });
  window.addEventListener('dragleave', (e) => { if (!e.relatedTarget) document.body.classList.remove('dropping'); });
  window.addEventListener('drop', (e) => {
    document.body.classList.remove('dropping');
    const f = e.dataTransfer?.files?.[0];
    if (f && /\.txt$/i.test(f.name)) { e.preventDefault(); importFile(f); }
  });
}

setupBar();
await loadCourses();
window.addEventListener('hashchange', route);
route();
