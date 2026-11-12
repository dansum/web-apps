// 6.2.8 „Школи и университети през Средновековието“ — музей на открито с три средища на знанието:
// университет (Болоня), Търновската книжовна школа и учебното средище във Фес (извън програмата на МОН, с ясен знак).
// Стъпки: опознай (отгоре или с разходка) → какво дава университетът (опит с факултетите) → школа или университет → предскажи: Прага, 1348 г.
import { cornerMenu, esc } from '../kit.js';
import { createShell, stepScore, offMon, OFF_MON } from './shell.js';
import { createRig } from './hist/rig.js';
import { buildSchools, FACULTIES } from './hist/schools.js';

const SPOTS = [
  { id: 'lecture', label: 'Лекцията', icon: '📖',
    note: 'Магистърът чете книгата на глас и я тълкува. Студентите слушат и записват. Преподава се на латински — общия език на учените в Западна Европа.' },
  { id: 'faculties', label: 'Факултетите', icon: '🚪',
    note: 'Първо се учат седемте свободни изкуства. После студентът избира право, медицина или богословие. Болоня е прочута с правото.' },
  { id: 'students', label: 'Студентите', icon: '🧑‍🎓',
    note: 'Думата „университет“ значи общност — на преподаватели и студенти. Те идват от много страни и се обединяват, за да пазят правата си.' },
  { id: 'library', label: 'Книгите', icon: '📚',
    note: 'Книгите се преписват на ръка и са много скъпи. Затова най-ценните са вързани с верига за масата.' },
  { id: 'scriptorium', label: 'Търновската книжовна школа', icon: '✒️',
    note: 'В манастирите край Търновград монасите преписват и превеждат книги. Така се учат бъдещите книжовници и духовници. В средновековна България няма университети.' },
  { id: 'evtimiy', label: 'Патриарх Евтимий', icon: '☦️',
    note: 'Патриарх Евтимий ръководи Търновската книжовна школа през XIV век. Той въвежда правила за езика и правописа на книгите.' },
  { id: 'fes', label: 'Учебното средище във Фес', icon: '🕌', off: true,
    note: 'Във Фес (Мароко) джамията „Ал-Карауин“ е и учебно средище още от IX век. Учителят седи, а учениците са в кръг около него.' },
];
const JOBS = [
  'Свободните изкуства са основата: граматика, смятане, музика, астрономия. Завършилият става учител или писар.',
  'Завършилият право става съдия или съветник на владетел или град.',
  'Завършилият медицина става лекар.',
  'Завършилият богословие става учен духовник.',
];
const WRONG2 = {
  walls: 'Стените пазят града, но не учат никого да съди или да лекува.',
  knights: 'Рицарите се учат да воюват. Съдиите и лекарите имат нужда от други знания.',
};
// Твърдения за стъпка 3: за кое средище е вярно — университета или книжовната школа.
const CLAIMS = [
  { t: 'Студенти от много страни слушат лекции на латински.', yard: 'uni' },
  { t: 'Монаси преписват и превеждат богослужебни книги.', yard: 'bg' },
  { t: 'Има факултети по право, медицина и богословие.', yard: 'uni' },
  { t: 'Начело стои патриарх, който въвежда правила за правописа.', yard: 'bg' },
  { t: 'Завършилият получава степен: бакалавър, магистър или доктор.', yard: 'uni' },
  { t: 'Работи към манастир.', yard: 'bg' },
];
const YARD_NAME = { uni: 'университета', bg: 'Търновската книжовна школа', fes: 'учебното средище във Фес' };
const PREDICT = [
  { t: 'Повече млади хора от Централна Европа ще учат близо до дома си и Прага ще стане средище на знание.', ok: true },
  { t: 'Университетите в Болоня и Париж ще затворят.', ok: false, why: 'Старите университети продължават да работят. Новият само дава още едно място за учене.' },
  { t: 'В Прага ще се учат само рицари.', ok: false, why: 'Университетът учи на право, медицина, богословие и свободни изкуства, а не на бой.' },
];

export function mount(container, { onComplete }) {
  const shell = createShell(container, { steps: ['Опознай', 'Какво дава университетът?', 'Школа или университет?', 'Предскажи'] });
  container.querySelector('.scene-hint').textContent = 'Това е музей на открито: трите средища са събрани на едно място, а всъщност са в различни страни и векове. Отгоре: върти и приближавай. Разходка: стрелки или бутони, оглеждане с влачене.';
  const rig = createRig(shell, { home: [[-22, 3, -14], [0, 88, 116]], build: buildSchools, start: { x: 0, z: 13, yaw: 0 }, shadow: { x: 0, z: -12, half: 110 }, limits: { min: 14, max: 300 } });
  const { places, world } = rig;
  const scores = [];
  let menu = null, timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const isOff = (id) => !!places.get(id).site.off;
  // Балонче за място; местата извън програмата носят знака най-отгоре.
  const note = (p, s, cls = 'wide') => rig.say(p.group, `${isOff(p.id) ? offMon() + '<br>' : ''}<b>${esc(s.label)}</b><br>${esc(s.note)}`, { cls, lift: p.top + 0.9 });

  function step1() {
    shell.step(0);
    scores.length = 0;
    rig.allowWalk(true);
    shell.task(`Три средища на знанието от Средновековието са събрани в един музей на открито. Разгледай ги отгоре или се разходи. Мястото със знак ⚠ е извън програмата на МОН.`);
    const seen = new Set();
    for (const p of places.values()) { p.wanted = true; p.done = false; }
    const open = (id) => {
      const s = SPOTS.find((x) => x.id === id), p = rig.showPlace(id);
      note(p, s);
      seen.add(id); p.wanted = false; p.done = true;
      menu.mark(id); menu.setActive(id);
      shell.score(`Разгледани: ${seen.size} от ${SPOTS.length}`);
      if (seen.size === SPOTS.length) {
        const c = shell.setControls('<button class="btn primary next">Напред →</button>');
        c.querySelector('.next').addEventListener('click', () => { menu.show(false); rig.clearTip(); rig.select(null); step2(); });
      }
    };
    menu = cornerMenu(rig.stage, { title: 'Разгледай', items: SPOTS.map((s) => ({ id: s.id, label: s.label + (s.off ? ' ⚠' : ''), icon: s.icon })), onSelect: open });
    rig.menu = menu;
    rig.setClick(open);
    shell.setControls('');
  }

  function step2() {
    shell.step(1);
    shell.score('');
    rig.setClick(null);
    for (const p of places.values()) { p.wanted = false; p.done = false; }
    rig.allowWalk(false);
    rig.look([-7, 1, -17], [13, 21, 27], 1.5);
    world.resetGraduates();
    let mistakes = 0, phase = 'predict';
    shell.task('Градовете растат. Владетелите и градовете имат нужда от съдии, лекари и писари. <b>Кое ще им ги даде?</b>');
    const c = shell.setControls('<div class="col"><button class="btn" data-a="walls">По-високи крепостни стени</button><button class="btn" data-a="ok">Университет с факултети</button><button class="btn" data-a="knights">Повече рицарски турнири</button></div>');
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      if (phase !== 'predict') return;
      if (b.dataset.a !== 'ok') { mistakes++; b.disabled = true; shell.msg(WRONG2[b.dataset.a], 'bad'); return; }
      phase = 'try';
      shell.msg('Да проверим! Изпрати студент във всеки факултет.', 'good');
      tryIt();
    }));
    function tryIt() {
      shell.task('Избери факултет и гледай: студентът влиза, а какъв излиза?');
      const cc = shell.setControls(`<div class="col">${FACULTIES.map(([name], i) => `<button class="btn fac" data-i="${i}">${esc(name)}</button>`).join('')}</div>`);
      const done = new Set();
      let busy = false;
      cc.querySelectorAll('.fac').forEach((b) => b.addEventListener('click', () => {
        const i = +b.dataset.i;
        if (busy || done.has(i)) return;
        busy = true; b.disabled = true;
        rig.clearTip();
        world.graduate(i, (g) => {
          busy = false; done.add(i);
          b.textContent = `${FACULTIES[i][0]} ✓`;
          rig.say(g, esc(JOBS[i]), { cls: 'wide', lift: 2.5 });
          if (done.size === FACULTIES.length) {
            scores.push(stepScore(mistakes, 2));
            shell.msg('Университетът дава на градовете и държавите учени хора.', 'good');
            const nx = document.createElement('button'); nx.className = 'btn primary next'; nx.textContent = 'Напред →';
            cc.appendChild(nx);
            nx.addEventListener('click', () => { rig.clearTip(); step3(); });
          }
        });
      }));
    }
  }

  function step3() {
    shell.step(2);
    rig.allowWalk(true);
    rig.look(rig.home[0], rig.home[1], 1.4);
    let mistakes = 0, k = 0, miss = 0, busy = false;
    for (const p of places.values()) { p.wanted = !p.site.off; p.done = false; }
    const ask = () => {
      busy = false; miss = 0; rig.select(null); rig.clearTip();
      shell.task(`За кое средище е вярно? <b data-yard="${CLAIMS[k].yard}">${esc(CLAIMS[k].t)}</b> Щракни някое място в него: в университета или в Търновската книжовна школа.`);
      shell.score(`Твърдения: ${k} от ${CLAIMS.length}`);
    };
    shell.setControls('');
    rig.setClick((id) => {
      if (busy) return;
      const p = places.get(id), cl = CLAIMS[k];
      if (p.site.yard !== cl.yard) {
        mistakes++; miss++;
        shell.msg(p.site.off ? `Това е ${YARD_NAME.fes}. То е извън програмата на МОН и не участва в задачата.`
          : miss >= 2 ? `Подсказка: разгледай пак ${YARD_NAME[cl.yard]}.` : `Не е вярно за ${YARD_NAME[p.site.yard]}. Помисли кой учи там и какво прави.`, 'bad');
        return;
      }
      busy = true; rig.select(id);
      shell.msg('Вярно!', 'good');
      rig.say(p.group, `Да, това е вярно за ${esc(YARD_NAME[cl.yard])}.`, { cls: 'good wide', lift: p.top + 0.9 });
      k++;
      shell.score(`Твърдения: ${k} от ${CLAIMS.length}`);
      if (k < CLAIMS.length) later(ask, 2000);
      else {
        scores.push(stepScore(mistakes, 4));
        const n = shell.setControls('<button class="btn primary next">Напред →</button>');
        n.querySelector('.next').addEventListener('click', () => { rig.clearTip(); rig.select(null); step4(); });
      }
    });
    ask();
  }

  function step4() {
    shell.step(3);
    shell.score('');
    rig.setClick(null);
    for (const p of places.values()) { p.wanted = false; p.done = false; }
    rig.allowWalk(false);
    rig.look([0, 2, -10], [0, 24, 34], 1.5);
    world.resetGraduates(); world.resetArrive();
    let mistakes = 0, solved = false;
    shell.task('Дълго време студентите от Централна Европа пътуват чак до Болоня или Париж. През 1348 г. крал Карл IV основава университет в Прага. <b>Какво ще се промени?</b>');
    const c = shell.setControls(`<div class="col">${PREDICT.map((p, i) => `<button class="btn" data-i="${i}">${esc(p.t)}</button>`).join('')}</div>`);
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      if (solved) return;
      const p = PREDICT[+b.dataset.i];
      if (!p.ok) { mistakes++; b.disabled = true; shell.msg(p.why, 'bad'); return; }
      solved = true;
      scores.push(stepScore(mistakes, 2));
      world.arrive();
      rig.say(places.get('students').group, '<b>Така и става.</b> Университетът в Прага е първият в Централна Европа. След него се откриват още много. Тук виждаш как нови студенти влизат в университет.', { cls: 'good wide', lift: 4 });
      shell.msg('Вярно предсказание!', 'good');
      const n = shell.setControls('<button class="btn primary">Виж резултата</button>');
      n.querySelector('button').addEventListener('click', () => { rig.clearTip(); shell.finish(scores.reduce((a, s) => a + s, 0) / scores.length, onComplete, restart); });
    }));
  }

  function restart() {
    timers.forEach(clearTimeout); timers = [];
    rig.clearTip(); rig.select(null);
    world.resetGraduates(); world.resetArrive();
    if (menu) menu.remove();
    rig.setMode('top');
    rig.look(rig.home[0], rig.home[1], 0.9);
    step1();
  }

  step1();
  container.__demo = { stage: rig.stage, places, walk: rig.walk, world, setMode: rig.setMode, OFF_MON };
  return { dispose() { timers.forEach(clearTimeout); if (menu) menu.remove(); rig.dispose(); } };
}
