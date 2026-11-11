// 4.3.6 „Хранителни вещества и заразни болести“ — 3D училищна столова.
// Стъпки: опознай столовата → хранителни вещества и здравословна чиния → микроби и хигиена → предпазване и лечение.
import { createStage, labelSprite, mat, addHitBox, cornerMenu, zoneRing, THREE, esc, shuffle } from '../kit.js';
import { createShell, stepScore } from './shell.js';

const V3 = THREE.Vector3;
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

// ---------- хранителни вещества ----------
const NUT = {
  p: { label: 'Белтъци', icon: '🥚', color: 0xe0605a, pos: [-2.7, -0.25],
    note: '<b>Белтъци.</b> От тях тялото изгражда мускулите, кожата и косата. Нужни са за растежа. Има ги в месото, рибата, яйцата, млякото, сиренето и боба.' },
  c: { label: 'Въглехидрати', icon: '🍞', color: 0xe8a63a, pos: [-0.9, -0.25],
    note: '<b>Въглехидрати.</b> Те дават енергия за игра и учене. Има ги в хляба, ориза, картофите и макароните. Захарта също е въглехидрат, но в сладкишите има твърде много от нея.' },
  f: { label: 'Мазнини', icon: '🧈', color: 0xc9a227, pos: [0.9, -0.25],
    note: '<b>Мазнини.</b> Те също дават енергия и пазят тялото топло. Има ги в маслото, олиото и ядките. Нужни са, но в малко количество.' },
  v: { label: 'Витамини и минерали', icon: '🍎', color: 0x3f9d47, pos: [2.7, -0.25],
    note: '<b>Витамини и минерали.</b> Те пазят тялото здраво и му помагат да се бори с болестите. Има ги най-много в плодовете и зеленчуците. Калцият от млякото е минерал за здрави кости и зъби.' },
};
const NUT_IDS = ['p', 'c', 'f', 'v'];
// Разположение на храните около кръга на групата им (в стъпка 1 и след подреждане).
const CL = [[-0.34, -0.14], [0.34, -0.18], [-0.14, 0.32], [0.38, 0.3]];

const FOODS = {
  meat: { label: 'Месо', def: 'Месото', n: 'p', ok: 'Месото е богато на белтъци — от тях се изграждат мускулите.', hint: 'Месото помага на мускулите да растат.' },
  egg: { label: 'Яйце', def: 'Яйцето', n: 'p', ok: 'Яйцето е богато на белтъци.', hint: 'От яйцето излиза пиле — в него има всичко нужно за растеж на мускулите.' },
  beans: { label: 'Боб', def: 'Бобът', n: 'p', ok: 'Бобът дава белтъци — като месото, но от растение.',
    almost: { c: 'Бобът наистина има и въглехидрати. Но той е ценен най-вече с нещо друго — може да замени месото в чинията.' },
    hint: 'Бобът може да замени месото в чинията.' },
  bread: { label: 'Хляб', def: 'Хлябът', n: 'c', ok: 'Хлябът е богат на въглехидрати — дава енергия.', hint: 'Хлябът е от брашно, а брашното е от зърно. Зърнените храни дават енергия.' },
  rice: { label: 'Ориз', def: 'Оризът', n: 'c', ok: 'Оризът е зърнена храна, богата на въглехидрати.', hint: 'Оризът е зърно — като пшеницата за хляба.' },
  potato: { label: 'Картоф', def: 'Картофът', n: 'c', ok: 'Картофът съдържа много нишесте — въглехидрат, който дава енергия.', hint: 'В картофа има много нишесте.' },
  butter: { label: 'Масло', def: 'Маслото', n: 'f', ok: 'Маслото е почти само мазнина. Слагаме го малко.', hint: 'Маслото е мазно на пипане.' },
  nuts: { label: 'Ядки', def: 'Ядките', n: 'f', ok: 'Ядките съдържат много мазнини. Те са полезни, но се ядат по малко.',
    almost: { p: 'Ядките имат и белтъци, но в тях има още повече от нещо друго. От някои ядки и семена дори се изстисква олио.' },
    hint: 'От някои ядки и семена се изстисква олио.' },
  apple: { label: 'Ябълка', def: 'Ябълката', n: 'v', ok: 'Ябълката е богата на витамини и минерали.', hint: 'Плодовете пазят тялото здраво.' },
  carrot: { label: 'Морков', def: 'Морковът', n: 'v', ok: 'Морковът е зеленчук, богат на витамини. Полезен е за очите.', hint: 'Зеленчуците пазят тялото здраво.' },
  milk: { label: 'Мляко', def: 'Млякото', n: 'p', also: 'v', ok: 'Млякото дава белтъци, а също и калций — минерал за здрави кости и зъби.', hint: 'Млякото помага за растежа, за костите и зъбите.' },
};
const FOOD_IDS = Object.keys(FOODS);

// Храни за здравословната чиния.
const PLATE = {
  tomato: { label: 'Домат', g: 'veg' }, cucumber: { label: 'Краставица', g: 'veg' }, apple2: { label: 'Ябълка', g: 'veg', make: 'apple' },
  bread2: { label: 'Хляб', g: 'grain', make: 'bread' }, rice2: { label: 'Ориз', g: 'grain', make: 'rice' },
  fish: { label: 'Риба', g: 'prot' }, egg2: { label: 'Яйце', g: 'prot', make: 'egg' },
  cake: { label: 'Торта', g: 'junk' }, chips: { label: 'Чипс', g: 'junk' },
  water: { label: 'Вода', g: 'drink' }, soda: { label: 'Газирана напитка', g: 'drink' },
};
const PLATE_IDS = Object.keys(PLATE);

// Навици: предпазват ли от заразни болести, или разпространяват микробите.
const HABITS = [
  { t: 'Мия ръцете си със сапун преди ядене.', ok: true, why: 'Сапунът отмива микробите от ръцете, преди да стигнат до устата.' },
  { t: 'Кихам в лакътя или в кърпичка.', ok: true, why: 'Капчиците остават в ръкава или в кърпичката и не летят към другите.' },
  { t: 'Мия плодовете, преди да ги изям.', ok: true, why: 'По кората на немитите плодове може да има микроби и пръст.' },
  { t: 'Пия само от моята чаша или бутилка.', ok: true, why: 'Така микробите от устата на другите не стигат до мен.' },
  { t: 'Проветрявам стаята често.', ok: true, why: 'Чистият въздух изнася навън микробите, които летят в стаята.' },
  { t: 'Кихам и кашлям право към другите.', ok: false, why: 'Капчиците от кихането носят микроби и стигат до другите хора.' },
  { t: 'Ям с немити ръце след игра навън.', ok: false, why: 'Микробите от ръцете влизат в устата заедно с храната.' },
  { t: 'Отивам на училище болен, с температура.', ok: false, why: 'Болното дете заразява съучениците си. Когато си болен, оставаш вкъщи.' },
];

// Средства за предпазване и лечение.
const CURE = {
  vaccine: { label: 'Ваксина', icon: '💉',
    note: '<b>Ваксина — предпазва.</b> Прави се на <b>здрав</b> човек. Тя „учи“ тялото да познава определен микроб. Ако микробът дойде по-късно, тялото е готово да се пребори с него.' },
  medicine: { label: 'Лекарство', icon: '💊',
    note: '<b>Лекарство — лекува.</b> Пие се, когато вече си болен, само ако лекар го е предписал и само когато го даде възрастен. Никога не взимай лекарства сам!' },
  hygiene: { label: 'Хигиена', icon: '🧼',
    note: '<b>Хигиена — предпазва.</b> Чисти ръце, измити плодове, своя чаша, четка за зъби и кърпа. Така микробите не стигат до теб.' },
};
const CURE_IDS = ['vaccine', 'medicine', 'hygiene'];
const CASES = [
  { t: 'Мими е здрава. Лекарят иска да я предпази от морбили (дребна шарка), преди изобщо да се е срещнала с вируса.', a: 'vaccine' },
  { t: 'Иво има висока температура и го боли гърлото. Лекарят го прегледа и написа какво да пие.', a: 'medicine' },
  { t: 'Преди обяд децата от класа мият ръцете си със сапун.', a: 'hygiene' },
  { t: 'Бебето е здраво. Медицинската сестра му прави нещо, което „учи“ тялото му да разпознава опасен микроб.', a: 'vaccine' },
  { t: 'Ани е болна от възпаление на ухото, причинено от бактерии. Мама ѝ дава точно това, което лекарят е предписал, по часовник.', a: 'medicine' },
  { t: 'Всеки в семейството има своя четка за зъби и своя кърпа.', a: 'hygiene' },
];
const WRONG = {
  vaccine: {
    medicine: 'Тук човекът е здрав. Лекарства се пият само при болест и само ако лекар ги е предписал. Кое „учи“ тялото предварително?',
    hygiene: 'Хигиената също предпазва, но тук лекарят иска да „научи“ тялото да познава точно този микроб.',
  },
  medicine: {
    vaccine: 'Ваксината предпазва, но се прави, преди да се разболееш. Тук болестта вече е започнала.',
    hygiene: 'Хигиената пази другите да не се заразят, но не лекува вече започнала болест.',
  },
  hygiene: {
    vaccine: 'Тук няма лекар. Става дума за нещо, което правим сами всеки ден.',
    medicine: 'Тук никой не е болен. Лекарства се пият само при болест и само ако лекар ги е предписал.',
  },
};

// ---------- стил (само за този модул) ----------
function injectStyle() {
  if (document.getElementById('foodhealth-style')) return;
  const s = document.createElement('style');
  s.id = 'foodhealth-style';
  s.textContent = `
  .foodhealth-lens { display:block; width:100%; max-width:210px; aspect-ratio:1; margin:6px auto 2px; border-radius:50%; background:#fbe0c8; box-shadow:0 2px 10px rgba(0,0,0,.18); }
  .foodhealth-case { background:#f3f8ff; border:2px solid #c9dcff; border-radius:8px; padding:7px 9px; margin:6px 0; font-weight:600; }
  .foodhealth-legend { display:flex; flex-wrap:wrap; gap:4px 10px; font-size:.78rem; margin-top:4px; }
  .foodhealth-legend span { display:inline-flex; align-items:center; gap:4px; }
  .foodhealth-legend i { width:.8em; height:.8em; border-radius:50%; display:inline-block; }
  .foodhealth-btns { display:flex; flex-wrap:wrap; gap:6px; }
  .foodhealth-btns .btn { padding:7px 10px; font-size:.9rem; }
  `;
  document.head.appendChild(s);
}

// ---------- помощни модели ----------
function setStick(mesh, a, b) {
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.scale.set(1, Math.max(0.001, a.distanceTo(b)), 1);
  mesh.quaternion.setFromUnitVectors(new V3(0, 1, 0), b.clone().sub(a).normalize());
}
function stick(a, b, r, m) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 10), m);
  setStick(mesh, a, b);
  return mesh;
}
function lathe(pts, m, seg = 24) {
  return new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg), m);
}
function glassMat(opacity = 0.3) {
  return new THREE.MeshStandardMaterial({ color: 0xe6f4ff, transparent: true, opacity, roughness: 0.08, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide });
}
function ball(r, color, sx = 1, sy = 1, sz = 1, flat = false) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat(color, { flat }));
  m.scale.set(sx, sy, sz);
  return m;
}
function boxM(w, h, d, color, extra) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, extra));
}
function bowl(color = 0xf4f1ea) {
  return lathe([[0, 0], [0.11, 0], [0.19, 0.05], [0.22, 0.13], [0.2, 0.13], [0.17, 0.07], [0.1, 0.03], [0, 0.03]], mat(color, { side: THREE.DoubleSide }));
}
function smallPlate() {
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.03, 24), mat(0xffffff));
  p.position.y = 0.015;
  return p;
}
function disposeTree(o) {
  o.traverse((x) => {
    if (x.geometry) x.geometry.dispose();
    if (x.material) (Array.isArray(x.material) ? x.material : [x.material]).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
  });
}

// Модели на храните. Всеки е група с основа в y = 0, висока около 0.3–0.45.
const MAKE = {
  meat() {
    const g = new THREE.Group();
    const m = ball(0.15, 0x9c4a2f, 1.25, 0.85, 1); m.position.set(0.06, 0.13, 0);
    const bone = stick(new V3(-0.1, 0.1, 0), new V3(-0.27, 0.1, 0), 0.035, mat(0xf5efe0));
    const k1 = ball(0.045, 0xf5efe0); k1.position.set(-0.29, 0.1, 0.03);
    const k2 = ball(0.045, 0xf5efe0); k2.position.set(-0.29, 0.1, -0.03);
    g.add(m, bone, k1, k2);
    return g;
  },
  egg() {
    const g = new THREE.Group();
    const e = ball(0.12, 0xf5ebd8, 1, 1.3, 1); e.position.y = 0.155;
    g.add(e);
    return g;
  },
  beans() {
    const g = new THREE.Group();
    g.add(bowl(0xd7e8f5));
    for (let i = 0; i < 14; i++) {
      const b = ball(0.035, i % 2 ? 0x8d5a3b : 0xb5653f, 1.4, 0.8, 0.9);
      const a = i * 2.4; const r = 0.04 + (i % 5) * 0.028;
      b.position.set(Math.cos(a) * r, 0.11 + (i % 3) * 0.015, Math.sin(a) * r);
      b.rotation.y = a;
      g.add(b);
    }
    return g;
  },
  bread() {
    const g = new THREE.Group();
    const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.24, 6, 12), mat(0xd9a05b));
    l.rotation.z = Math.PI / 2; l.scale.set(0.95, 1, 0.9); l.position.y = 0.11;
    g.add(l);
    for (let i = -1; i <= 1; i++) {
      const c = boxM(0.03, 0.02, 0.16, 0xa8692e); c.position.set(i * 0.1, 0.215, 0); c.rotation.y = 0.5;
      g.add(c);
    }
    return g;
  },
  rice() {
    const g = new THREE.Group();
    g.add(bowl(0xf1d6b8));
    const m = ball(0.17, 0xfbfbf7, 1, 0.45, 1, true); m.position.y = 0.11;
    g.add(m);
    return g;
  },
  potato() {
    const g = new THREE.Group();
    const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 1), mat(0xb8895a, { flat: true }));
    p.scale.set(1.25, 0.8, 0.95); p.position.y = 0.12;
    g.add(p);
    for (let i = 0; i < 4; i++) {
      const d = ball(0.015, 0x6d4c2e); const a = i * 1.7;
      d.position.set(Math.cos(a) * 0.15, 0.15 + (i % 2) * 0.03, Math.sin(a) * 0.1);
      g.add(d);
    }
    return g;
  },
  butter() {
    const g = new THREE.Group();
    g.add(smallPlate());
    const b = boxM(0.26, 0.11, 0.16, 0xffe27a); b.position.y = 0.085;
    g.add(b);
    return g;
  },
  nuts() {
    const g = new THREE.Group();
    g.add(smallPlate());
    const P = [[0, 0.07, 0], [0.09, 0.07, 0.05], [-0.09, 0.07, 0.04], [0.02, 0.07, -0.09], [0.01, 0.15, 0.01]];
    for (const [x, y, z] of P) {
      const n = new THREE.Mesh(new THREE.DodecahedronGeometry(0.06, 0), mat(0xa86b3c, { flat: true }));
      n.position.set(x, y, z); n.rotation.set(x * 9, z * 7, 0);
      g.add(n);
    }
    return g;
  },
  apple() {
    const g = new THREE.Group();
    const a = ball(0.15, 0xd62828, 1, 0.9, 1); a.position.y = 0.14;
    const st = stick(new V3(0, 0.26, 0), new V3(0.01, 0.33, 0), 0.012, mat(0x6d4c2e));
    const lf = ball(0.05, 0x43a047, 1, 0.25, 0.5); lf.position.set(0.05, 0.31, 0); lf.rotation.z = 0.5;
    g.add(a, st, lf);
    return g;
  },
  carrot() {
    const g = new THREE.Group();
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.42, 12), mat(0xf28c28));
    c.rotation.z = Math.PI / 2 + 0.1; c.position.set(0.02, 0.08, 0);
    g.add(c);
    for (let i = -1; i <= 1; i++) {
      const l = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.2, 6), mat(0x43a047));
      l.position.set(-0.27, 0.11 + i * 0.02, i * 0.03); l.rotation.z = Math.PI / 2 + 0.4 + i * 0.25;
      g.add(l);
    }
    return g;
  },
  milk() {
    const g = new THREE.Group();
    const b = boxM(0.18, 0.3, 0.18, 0xffffff); b.position.y = 0.15;
    const band = boxM(0.185, 0.1, 0.185, 0x3d7fd6); band.position.y = 0.14;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.18, 3), mat(0xffffff));
    top.rotation.set(0, 0, Math.PI / 2); top.rotation.order = 'ZYX'; top.position.y = 0.33; top.scale.set(0.6, 1, 1);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 10), mat(0x3d7fd6)); cap.position.set(0.04, 0.36, 0.04);
    g.add(b, band, top, cap);
    return g;
  },
  tomato() {
    const g = new THREE.Group();
    const t = ball(0.15, 0xe53935, 1, 0.8, 1); t.position.y = 0.12;
    const s = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.03, 5), mat(0x2e7d32)); s.position.y = 0.245;
    g.add(t, s);
    return g;
  },
  cucumber() {
    const g = new THREE.Group();
    const c = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.3, 6, 12), mat(0x2e7d32));
    c.rotation.z = Math.PI / 2; c.position.y = 0.07;
    g.add(c);
    for (let i = 0; i < 5; i++) { const d = ball(0.012, 0x9ccc65); d.position.set(-0.16 + i * 0.08, 0.13, (i % 2 - 0.5) * 0.05); g.add(d); }
    return g;
  },
  fish() {
    const g = new THREE.Group();
    const b = ball(0.15, 0xd9a273, 1.5, 0.45, 0.75); b.position.y = 0.07;
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 4), mat(0xc58b5c));
    tail.rotation.z = -Math.PI / 2; tail.position.set(-0.27, 0.07, 0); tail.scale.set(1, 1, 0.3);
    g.add(b, tail);
    for (let i = -1; i <= 1; i++) { const s = boxM(0.02, 0.01, 0.16, 0x7a4a26); s.position.set(i * 0.08, 0.135, 0); s.rotation.y = 0.6; g.add(s); }
    const lem = ball(0.045, 0xffe14d, 1, 0.5, 1); lem.position.set(0.18, 0.1, 0.1); g.add(lem);
    return g;
  },
  cake() {
    const g = new THREE.Group();
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.18, 12, 1, false, 0, Math.PI / 3), mat(0xf6b9c9));
    s.position.set(-0.1, 0.09, -0.05);
    const cr = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.04, 12, 1, false, 0, Math.PI / 3), mat(0xffffff));
    cr.position.set(-0.1, 0.2, -0.05);
    const ch = ball(0.035, 0xc62828); ch.position.set(0.0, 0.25, 0.1);
    g.add(s, cr, ch);
    return g;
  },
  chips() {
    const g = new THREE.Group();
    const b = ball(0.16, 0xffc107, 0.85, 1.15, 0.38); b.position.y = 0.18;
    const st = boxM(0.2, 0.06, 0.12, 0xe53935); st.position.y = 0.2;
    g.add(b, st);
    return g;
  },
  water() {
    const g = new THREE.Group();
    const gl = lathe([[0, 0], [0.09, 0], [0.11, 0.3], [0.105, 0.3], [0.085, 0.01], [0, 0.01]], glassMat(0.35));
    gl.renderOrder = 3;
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.086, 0.22, 16), new THREE.MeshStandardMaterial({ color: 0x8fd3ff, transparent: true, opacity: 0.7, roughness: 0.1 }));
    w.position.y = 0.12;
    g.add(w, gl);
    return g;
  },
  soda() {
    const g = new THREE.Group();
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.27, 16), mat(0xd32f2f, { roughness: 0.4, metalness: 0.3 }));
    c.position.y = 0.135;
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.025, 16), mat(0xcfd8dc, { metalness: 0.7, roughness: 0.3 }));
    t.position.y = 0.28;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.05, 16), mat(0xffffff)); band.position.y = 0.15;
    g.add(c, t, band);
    return g;
  },
};

// Карта с текст (спрайт), която може да се влачи.
function cardSprite(text, { w = 2.1, color = '#1b2a3a', border = '#9fb4cc' } = {}) {
  const W = 560; const H = 190;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(255,255,255,0.97)';
  x.beginPath(); x.roundRect(4, 4, W - 8, H - 8, 26); x.fill();
  x.lineWidth = 6; x.strokeStyle = border; x.stroke();
  x.fillStyle = color;
  x.font = '700 40px system-ui, "Segoe UI", Roboto, Arial, sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  const words = text.split(' '); const lines = []; let cur = '';
  for (const wd of words) {
    const t = cur ? cur + ' ' + wd : wd;
    if (x.measureText(t).width > W - 60 && cur) { lines.push(cur); cur = wd; } else cur = t;
  }
  lines.push(cur);
  lines.forEach((l, i) => x.fillText(l, W / 2, H / 2 + (i - (lines.length - 1) / 2) * 48));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  s.scale.set(w, w * (H / W), 1);
  s.renderOrder = 12;
  return s;
}

// ---------- преживяване ----------
export function mount(container, { onComplete }) {
  injectStyle();
  const STEPS = ['Опознай столовата', 'Хранителни вещества', 'Микроби и хигиена', 'Предпазване и лечение'];
  const shell = createShell(container, { steps: STEPS });
  const stage = createStage(shell.stageEl, {
    background: 0xf3ead8, camPos: [0, 5, 10], target: [0, 0.4, -0.5], maxDistance: 22, minDistance: 2,
  });
  const { scene, camera } = stage;
  const narrow = camera.aspect < 1.15;

  // Реално време (а не кадри): анимациите траят еднакво и на бавен компютър.
  let rdt = 0.016;
  let lastNow = performance.now();
  stage.tick(() => { const n = performance.now(); rdt = Math.min(0.25, Math.max(0.001, (n - lastNow) / 1000)); lastNow = n; });
  let gen = 0; // при „Започни отначало“ недовършените анимации спират
  const phase = (dur, fn) => new Promise((res) => {
    const my = gen;
    let k = 0;
    const stop = stage.tick((dt, t) => {
      if (my !== gen) { stop(); return; }
      k = Math.min(1, k + rdt / dur);
      if (fn) fn(k, rdt, t);
      if (k >= 1) { stop(); res(); }
    });
  });

  // ---------- стая ----------
  const FLOOR = -1.5;
  const floorTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = '#e9dcc4'; x.fillRect(0, 0, 128, 128);
    x.fillStyle = '#d6c4a6'; x.fillRect(0, 0, 64, 64); x.fillRect(64, 64, 64, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(14, 9);
    return t;
  })();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(28, 18), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, FLOOR, 2);
  scene.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(28, 9), mat(0xd8eef0));
  wall.position.set(0, 3, -3.25);
  scene.add(wall);
  const skirting = boxM(28, 1.6, 0.04, 0xa9d6c9); skirting.position.set(0, FLOOR + 0.8, -3.22);
  scene.add(skirting);

  // Прозорец с облаци.
  const win = new THREE.Group();
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.7), new THREE.MeshBasicMaterial({ color: 0xbfe6ff }));
  win.add(sky);
  const clouds = [];
  for (let i = 0; i < 3; i++) {
    const cl = new THREE.Group();
    for (let j = 0; j < 3; j++) { const p = new THREE.Mesh(new THREE.CircleGeometry(0.16 + j % 2 * 0.06, 16), new THREE.MeshBasicMaterial({ color: 0xffffff })); p.position.set(j * 0.18 - 0.18, j % 2 * 0.05, 0.005); cl.add(p); }
    cl.position.set(-1 + i * 0.9, 0.35 - i * 0.25, 0.005);
    win.add(cl); clouds.push(cl);
  }
  for (const [w, h, x, y] of [[2.8, 0.1, 0, 0.9], [2.8, 0.1, 0, -0.9], [0.1, 1.9, -1.35, 0], [0.1, 1.9, 1.35, 0], [0.06, 1.7, 0, 0]]) {
    const f = boxM(w, h, 0.08, 0xffffff); f.position.set(x, y, 0.03); win.add(f);
  }
  win.position.set(1.8, 2.5, -3.22);
  scene.add(win);
  // Часовник.
  const clock = new THREE.Group();
  clock.add(new THREE.Mesh(new THREE.CircleGeometry(0.4, 28), mat(0xffffff)));
  clock.add(new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.04, 8, 28), mat(0xe76f51)));
  const hand = (len, w) => { const p = new THREE.Group(); const m = boxM(w, len, 0.01, 0x263238); m.position.y = len / 2 - 0.03; p.add(m); p.position.z = 0.02; clock.add(p); return p; };
  const hH = hand(0.2, 0.04); const hM = hand(0.3, 0.03); const hS = hand(0.33, 0.012);
  hS.children[0].material.color.set(0xd32f2f);
  clock.position.set(4.3, 2.5, -3.2);
  scene.add(clock);

  // Маса.
  const TABLE_W = 7.6;
  const top = boxM(TABLE_W, 0.12, 3.8, 0xe2b77f); top.position.set(0, -0.06, 0.5);
  scene.add(top);
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(TABLE_W - 0.3, 3.5), mat(0xfff8ec));
  cloth.rotation.x = -Math.PI / 2; cloth.position.set(0, 0.002, 0.5);
  scene.add(cloth);
  for (const [x, z] of [[-3.6, -1.2], [3.6, -1.2], [-3.6, 2.2], [3.6, 2.2]]) {
    const leg = boxM(0.14, 1.44, 0.14, 0xb98953); leg.position.set(x, FLOOR + 0.72, z); scene.add(leg);
  }

  // Хладилник.
  const fridge = new THREE.Group();
  const fb = boxM(1.5, 3.4, 1.2, 0xf4f7f9); fb.position.y = 1.7; fridge.add(fb);
  const seam = boxM(1.52, 0.03, 1.22, 0xc5ced6); seam.position.y = 2.45; fridge.add(seam);
  for (const y of [1.7, 2.8]) { const h = boxM(0.06, 0.5, 0.06, 0xb0bec5, { metalness: 0.5 }); h.position.set(0.6, y, 0.63); fridge.add(h); }
  const led = new THREE.Mesh(new THREE.CircleGeometry(0.04, 12), new THREE.MeshBasicMaterial({ color: 0x4caf50 }));
  led.position.set(-0.5, 3.1, 0.61); fridge.add(led);
  [[0xe76f51, -0.3, 2.0], [0x2a9d8f, 0, 1.6], [0xe9c46a, -0.25, 1.2]].forEach(([c, x, y]) => { const m = ball(0.07, c, 1, 1, 0.4); m.position.set(x, y, 0.61); fridge.add(m); });
  fridge.position.set(-5.3, FLOOR, -2.5);
  scene.add(fridge);

  // Плот с мивка, кран и сапун.
  const counter = new THREE.Group();
  const cb = boxM(3.3, 1.5, 1.4, 0x9fd3c7); cb.position.set(0, -0.75, 0); counter.add(cb);
  const ct = boxM(3.4, 0.08, 1.5, 0xf1f3f4); ct.position.set(0, -0.04, 0); counter.add(ct);
  counter.position.set(4.5, 0, -2.5);
  scene.add(counter);
  const sink = new THREE.Group();
  const basin = boxM(1.1, 0.02, 0.85, 0x9fb3c2, { metalness: 0.5, roughness: 0.3 }); basin.position.y = 0.012; sink.add(basin);
  for (const [w, d, x, z] of [[1.2, 0.06, 0, 0.45], [1.2, 0.06, 0, -0.45], [0.06, 0.9, 0.58, 0], [0.06, 0.9, -0.58, 0]]) {
    const r = boxM(w, 0.06, d, 0xd5dde3, { metalness: 0.5, roughness: 0.3 }); r.position.set(x, 0.03, z); sink.add(r);
  }
  const chrome = mat(0xcfd8dc, { metalness: 0.8, roughness: 0.25 });
  sink.add(stick(new V3(0, 0, -0.55), new V3(0, 0.95, -0.55), 0.05, chrome));
  sink.add(stick(new V3(0, 0.95, -0.55), new V3(0, 0.95, -0.2), 0.04, chrome));
  const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 12), mat(0x3d7fd6)); tap.position.set(0.18, 0.93, -0.55); sink.add(tap);
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1, 10), new THREE.MeshStandardMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.7, roughness: 0.1 }));
  stream.visible = false; sink.add(stream);
  const drip = ball(0.025, 0x9fd8ff); sink.add(drip);
  sink.position.set(5.0, 0, -2.35);
  sink.userData.pickId = 'sink';
  scene.add(sink);
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.04, 16), mat(0xffffff)); dish.position.set(5.85, 0.02, -2.15);
  scene.add(dish);
  const soap = new THREE.Group();
  const sb = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.14, 4, 10), mat(0x9ad7dc));
  sb.rotation.z = Math.PI / 2; sb.scale.set(1, 1, 1.4); soap.add(sb);
  soap.position.set(5.85, 0.11, -2.15);
  soap.userData.home = soap.position.clone();
  soap.userData.pickId = 'sink';
  scene.add(soap);
  const soapBubbles = [];
  for (let i = 0; i < 6; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshStandardMaterial({ color: 0xe3f6ff, transparent: true, opacity: 0.55, roughness: 0.05, metalness: 0.2 }));
    b.userData.ph = i / 6; scene.add(b); soapBubbles.push(b);
  }
  const sinkLbl = labelSprite('Мивка и сапун', { size: 0.22 }); sinkLbl.position.set(5.3, 1.25, -2.4); scene.add(sinkLbl); stage.steadyLabel(sinkLbl, 9);

  // Ръка над мивката (за лупата и миенето).
  const SKIN = 0xf2c7a5;
  const handG = new THREE.Group();
  const palm = ball(1, SKIN, 0.24, 0.07, 0.21); handG.add(palm);
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.17 - Math.abs(i - 1.5) * 0.03, 4, 8), mat(SKIN));
    f.rotation.z = -Math.PI / 2; f.position.set(0.33 - Math.abs(i - 1.5) * 0.015, 0.01, -0.15 + i * 0.1);
    handG.add(f);
  }
  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.13, 4, 8), mat(SKIN));
  thumb.rotation.set(Math.PI / 2, 0, 0.6); thumb.position.set(0.08, 0.01, 0.25); handG.add(thumb);
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.55, 14), mat(0x2a9d8f));
  sleeve.rotation.z = Math.PI / 2; sleeve.position.set(-0.5, 0, 0); handG.add(sleeve);
  const foam = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const f = ball(0.05 + (i % 3) * 0.015, 0xffffff); const a = i * 2.3;
    f.position.set(Math.cos(a) * 0.17 + 0.05, 0.05 + (i % 2) * 0.03, Math.sin(a) * 0.15);
    foam.add(f);
  }
  foam.scale.setScalar(0.001); handG.add(foam);
  handG.position.set(4.95, 0.42, -2.3);
  handG.rotation.y = -0.25;
  scene.add(handG);
  const HAND_HOME = handG.position.clone();

  // Лупа на стойка — показва увеличено кожата на ръката с микробите.
  const LS = 256;
  const lensCanvas = document.createElement('canvas'); lensCanvas.width = lensCanvas.height = LS;
  const lctx = lensCanvas.getContext('2d');
  const lensTex = new THREE.CanvasTexture(lensCanvas); lensTex.colorSpace = THREE.SRGBColorSpace;
  const magnifier = new THREE.Group();
  const dark = mat(0x37474f, { metalness: 0.3, roughness: 0.5 });
  const mBase = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.06, 18), dark); mBase.position.set(3.35, 0.03, -2.8); magnifier.add(mBase);
  magnifier.add(stick(new V3(3.35, 0, -2.8), new V3(3.35, 1.55, -2.8), 0.035, dark));
  const LENS_POS = new V3(3.95, 1.15, -2.2);
  magnifier.add(stick(new V3(3.35, 1.55, -2.8), LENS_POS.clone(), 0.03, dark));
  const lens = new THREE.Group();
  const lensDisc = new THREE.Mesh(new THREE.CircleGeometry(0.46, 40), new THREE.MeshBasicMaterial({ map: lensTex }));
  const lensRim = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.045, 10, 40), mat(0x264653, { metalness: 0.4, roughness: 0.4 }));
  lens.add(lensDisc, lensRim);
  lens.position.copy(LENS_POS);
  magnifier.add(lens);
  magnifier.userData.pickId = 'magnifier';
  scene.add(magnifier);
  const lensLbl = labelSprite('Лупа', { size: 0.2 }); lensLbl.position.set(3.95, 1.78, -2.2); scene.add(lensLbl); stage.steadyLabel(lensLbl, 9);

  // Шкаф на медицинската сестра.
  const cabinet = new THREE.Group();
  const cbody = boxM(2.5, 3.5, 0.7, 0xffffff); cbody.position.y = 1.75; cabinet.add(cbody);
  const inner = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 3.2), mat(0xeaf6fb, { emissive: 0x3a4a52 })); inner.position.set(0, 1.75, 0.351); cabinet.add(inner);
  for (const y of [1.0, 2.0, 2.9]) { const sh = boxM(2.3, 0.05, 0.6, 0xdfe7ec); sh.position.set(0, y, 0.08); cabinet.add(sh); }
  for (const s of [-1, 1]) {
    const door = new THREE.Group();
    const dp = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.3, 0.03), glassMat(0.25)); dp.position.x = -s * 0.6; door.add(dp);
    const df = boxM(1.2, 0.06, 0.05, 0xffffff); df.position.set(-s * 0.6, 1.62, 0); door.add(df);
    door.position.set(s * 1.25, 1.75, 0.37); door.rotation.y = s * 1.9;
    cabinet.add(door);
  }
  const crossM = mat(0x2e9e5b);
  const cx1 = boxM(0.5, 0.15, 0.05, 0x2e9e5b); cx1.position.set(0, 3.85, 0.1); cabinet.add(cx1);
  const cx2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.05), crossM); cx2.position.set(0, 3.85, 0.1); cabinet.add(cx2);
  // Декорация по горните рафтове.
  [[0x90caf9, -0.8, 1.05], [0xffcc80, -0.35, 1.05], [0xa5d6a7, 0.3, 1.05], [0xce93d8, 0.8, 1.05], [0xffffff, -0.6, 2.95], [0x80cbc4, 0.5, 2.95]].forEach(([c, x, y], i) => {
    const b = i % 2 ? boxM(0.3, 0.35, 0.25, c) : new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.36, 12), mat(c));
    b.position.set(x, y + 0.2, 0.05); cabinet.add(b);
  });
  cabinet.position.set(-1.6, FLOOR, -2.85);
  cabinet.userData.pickId = 'nurse';
  scene.add(cabinet);
  const cabLbl = labelSprite('Медицинска сестра', { size: 0.24, bg: 'rgba(232,248,238,0.96)', border: '#2e9e5b' });
  cabLbl.position.set(-1.6, 2.95, -2.6); scene.add(cabLbl); stage.steadyLabel(cabLbl, 10);

  // Средствата в шкафа (на средния рафт).
  const cure = {};
  const CURE_POS = { vaccine: -2.35, medicine: -1.6, hygiene: -0.85 };
  CURE_IDS.forEach((id) => {
    const g = new THREE.Group();
    if (id === 'vaccine') {
      const v = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.26, 14), glassMat(0.5)); v.position.y = 0.13; v.renderOrder = 3;
      const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 14), new THREE.MeshStandardMaterial({ color: 0xbfe3ff, transparent: true, opacity: 0.8 })); liq.position.y = 0.1;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.07, 14), mat(0x3d7fd6)); cap.position.y = 0.29;
      const box = boxM(0.32, 0.2, 0.18, 0xffffff); box.position.set(0.25, 0.1, 0);
      const st = boxM(0.33, 0.06, 0.185, 0x3d7fd6); st.position.set(0.25, 0.12, 0);
      g.add(liq, v, cap, box, st);
    } else if (id === 'medicine') {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.28, 14), mat(0x8d5524, { roughness: 0.3 })); b.position.y = 0.14;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.06, 14), mat(0xffffff)); cap.position.y = 0.31;
      const lbl = new THREE.Mesh(new THREE.CylinderGeometry(0.102, 0.102, 0.12, 14), mat(0xfff3e0)); lbl.position.y = 0.14;
      const spoon = boxM(0.04, 0.015, 0.22, 0xffffff); spoon.position.set(0.22, 0.01, 0.05); spoon.rotation.y = 0.4;
      const sp2 = ball(0.045, 0xffffff, 1, 0.4, 1); sp2.position.set(0.26, 0.015, 0.15);
      g.add(b, lbl, cap, spoon, sp2);
    } else {
      const s = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.14, 4, 10), mat(0x8fd694)); s.rotation.z = Math.PI / 2; s.scale.set(1, 1, 1.4); s.position.set(-0.1, 0.07, 0);
      const br = boxM(0.04, 0.03, 0.34, 0x2a9d8f); br.position.set(0.17, 0.03, 0); br.rotation.y = 0.3;
      const bristles = boxM(0.05, 0.05, 0.08, 0xffffff); bristles.position.set(0.12, 0.065, -0.13); bristles.rotation.y = 0.3;
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.2, 14), mat(0xffb3c7)); cup.position.set(0.05, 0.1, -0.15);
      g.add(s, br, bristles, cup);
    }
    g.scale.setScalar(1.5);
    g.position.set(CURE_POS[id], FLOOR + 2.025, -2.6);
    const lbl = labelSprite(CURE[id].label, { size: 0.15 });
    lbl.position.set(0, 0.5, 0); g.add(lbl);
    g.userData.pickId = id;
    g.userData.lbl = lbl;
    g.userData.home = g.position.clone();
    scene.add(g);
    addHitBox(g, 0.6);
    stage.steadyLabel(lbl, 7);
    cure[id] = g;
  });

  // Дете (за кихането).
  const kid = new THREE.Group();
  const shirt = mat(0xf4a261); const pants = mat(0x3d5a80);
  for (const z of [-0.13, 0.13]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 1.2, 10), pants); l.position.set(0, 0.6, z); kid.add(l); }
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.6, 6, 14), shirt); torso.position.y = 1.65; kid.add(torso);
  const headG = new THREE.Group(); headG.position.set(0, 2.25, 0); kid.add(headG);
  const head = ball(0.3, SKIN); head.position.y = 0.3; headG.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.315, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), mat(0x5d4037));
  hair.position.y = 0.33; hair.rotation.z = 0.35; headG.add(hair);
  for (const z of [-0.1, 0.1]) { const e = ball(0.035, 0x1b1b1b); e.position.set(0.27, 0.36, z); headG.add(e); }
  const nose = ball(0.04, 0xe8b08c); nose.position.set(0.3, 0.28, 0); headG.add(nose);
  const armM = shirt; const handM = mat(SKIN);
  const SH_R = new V3(0, 2.12, 0.36); const SH_L = new V3(0, 2.12, -0.36);
  const upR = stick(SH_R, new V3(0.02, 1.6, 0.38), 0.085, armM); const loR = stick(new V3(0.02, 1.6, 0.38), new V3(0.06, 1.15, 0.38), 0.075, armM);
  const palmR = ball(0.08, SKIN); kid.add(upR, loR, palmR);
  const upL = stick(SH_L, new V3(0.02, 1.6, -0.38), 0.085, armM); const loL = stick(new V3(0.02, 1.6, -0.38), new V3(0.06, 1.15, -0.38), 0.075, armM);
  const palmL = ball(0.08, SKIN); palmL.position.set(0.06, 1.1, -0.38); kid.add(upL, loL, palmL);
  void handM;
  kid.position.set(-4.7, FLOOR, 0.6);
  scene.add(kid);
  const MOUTH_L = new V3(0.29, 2.45, 0);
  const ARM_REST = { e: new V3(0.02, 1.6, 0.38), h: new V3(0.06, 1.15, 0.38) };
  const ARM_ELBOW = { e: new V3(0.4, 2.42, 0.1), h: new V3(0.22, 2.55, -0.3) };
  const armE = new V3(); const armH = new V3();
  function poseArm(k) {
    armE.lerpVectors(ARM_REST.e, ARM_ELBOW.e, k);
    armH.lerpVectors(ARM_REST.h, ARM_ELBOW.h, k);
    setStick(upR, SH_R, armE); setStick(loR, armE, armH); palmR.position.copy(armH);
  }
  poseArm(0);

  // Капчици при кихане.
  const DN = 150;
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshStandardMaterial({ color: 0x6ec1ff, transparent: true, opacity: 0.8, roughness: 0.1 }), DN);
  drops.count = 0; drops.frustumCulled = false;
  scene.add(drops);
  const dP = []; const dV = []; const dState = new Array(DN).fill(0);
  for (let i = 0; i < DN; i++) { dP.push(new V3()); dV.push(new V3()); }
  let dropAge = 0; let dropMode = null; let dropMaxX = 0;
  const dm = new THREE.Matrix4(); const dq = new THREE.Quaternion(); const ds = new V3();

  // Кана с вода (стъпка 1).
  const jug = new THREE.Group();
  const jg = lathe([[0, 0], [0.18, 0], [0.22, 0.25], [0.18, 0.5], [0.15, 0.6], [0.17, 0.66], [0.16, 0.66], [0.13, 0.6], [0, 0.6]], glassMat(0.32));
  jg.renderOrder = 3;
  const jw = lathe([[0, 0.01], [0.17, 0.01], [0.205, 0.25], [0.17, 0.45], [0, 0.45]], new THREE.MeshStandardMaterial({ color: 0x8fd3ff, transparent: true, opacity: 0.7 }));
  jug.add(jw, jg);
  const jglass = MAKE.water(); jglass.position.set(0.38, 0, 0.1); jug.add(jglass);
  const jugLbl = labelSprite('Вода', { size: 0.2 }); jugLbl.position.set(0.15, 0.95, 0); jug.add(jugLbl); stage.steadyLabel(jugLbl, 9);
  jug.position.set(0, 0, 1.2);
  jug.userData.pickId = 'water';
  scene.add(jug);
  addHitBox(jug, 0.6);

  // ---------- зони на хранителните вещества ----------
  const zones = {};
  NUT_IDS.forEach((n) => {
    const z = zoneRing(NUT[n].color, 0.78);
    z.position.set(NUT[n].pos[0], 0, NUT[n].pos[1]);
    const l = labelSprite(NUT[n].label, { size: 0.22, border: '#' + NUT[n].color.toString(16).padStart(6, '0') });
    l.position.set(0, 0.12, -0.95);
    z.add(l);
    stage.steadyLabel(l, 9);
    z.userData.zoneId = n;
    scene.add(z);
    zones[n] = z;
  });
  function highlightZone(id, list = zones) {
    for (const k of Object.keys(list)) list[k].userData.disc.material.opacity = k === id ? 0.45 : 0.18;
  }

  // ---------- храните ----------
  function makeFood(kind, label) {
    const g = new THREE.Group();
    const m = MAKE[kind]();
    m.scale.setScalar(1.25);
    g.add(m);
    const box = new THREE.Box3().setFromObject(m);
    scene.add(g);
    addHitBox(g, 0.5); // без етикета: широк етикет не бива да закрива съседната храна
    const lbl = labelSprite(label, { size: 0.15 });
    lbl.position.set(0, box.max.y + 0.14, 0);
    g.add(lbl);
    g.userData.lbl = lbl;
    g.userData.model = m;
    stage.steadyLabel(lbl, 8);
    return g;
  }
  const foods = {};
  FOOD_IDS.forEach((id) => {
    const g = makeFood(id, FOODS[id].label);
    g.userData.pickId = 'food:' + id;
    g.userData.food = id;
    foods[id] = g;
  });
  const pfood = {};
  PLATE_IDS.forEach((id) => {
    const g = makeFood(PLATE[id].make || id, PLATE[id].label);
    g.userData.pickId = 'pf:' + id;
    g.userData.pf = id;
    g.visible = false;
    pfood[id] = g;
  });
  function foodsHome() {
    const fill = { p: 0, c: 0, f: 0, v: 0 };
    for (const id of FOOD_IDS) {
      const n = FOODS[id].n; const k = fill[n]++;
      const [x, z] = NUT[n].pos;
      foods[id].position.set(x + CL[k][0], 0, z + CL[k][1]);
      foods[id].rotation.set(0, 0, 0);
      foods[id].visible = true;
      foods[id].userData.locked = true;
      delete foods[id].userData.dragId;
      foods[id].userData.lbl.material.opacity = 1;
    }
  }
  // Позиции в редица пред детето (на тесен екран — два реда).
  function rowPos(i, n) {
    if (!narrow) return [-((n - 1) * 0.66) / 2 + i * 0.66, 1.65];
    const half = Math.ceil(n / 2);
    if (i < half) return [-((half - 1) * 1.0) / 2 + i * 1.0, 1.3];
    const j = i - half; const m = n - half;
    return [-((m - 1) * 1.0) / 2 + j * 1.0, 2.0];
  }

  // Чиния на четири части и място за чаша.
  const plate = new THREE.Group();
  const pl = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.15, 0.06, 40), mat(0xffffff, { roughness: 0.4 }));
  pl.position.y = 0.03; plate.add(pl);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.04, 8, 48), mat(0x8ecae6)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.065; plate.add(rim);
  const lineM = mat(0x8ecae6);
  const l1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.012, 0.035), lineM); l1.position.y = 0.066; plate.add(l1);
  const l2 = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.012, 2.4), lineM); l2.position.y = 0.066; plate.add(l2);
  plate.position.set(0, 0, -0.15);
  plate.visible = false;
  scene.add(plate);
  const QPOS = [[-0.55, -0.5], [-0.55, 0.5], [0.55, -0.5], [0.55, 0.5]];
  const coaster = zoneRing(0x3d7fd6, 0.4);
  coaster.position.set(narrow ? 1.85 : 2.0, 0, -0.15);
  coaster.visible = false;
  scene.add(coaster);
  const coasterLbl = labelSprite('Напитка', { size: 0.16 }); coasterLbl.position.set(0, 0.08, -0.55); coaster.add(coasterLbl); stage.steadyLabel(coasterLbl, 8);
  const plateLbl = labelSprite('Моят обяд', { size: 0.2 }); plateLbl.position.set(0, 0.1, -1.45); plate.add(plateLbl); stage.steadyLabel(plateLbl, 9);

  // Зони за навиците.
  const hz = {
    yes: zoneRing(0x2e9e5b, 1.0),
    no: zoneRing(0xe76f51, 1.0),
  };
  hz.yes.position.set(-1.9, 0, 0.0); hz.no.position.set(1.9, 0, 0.0);
  for (const [k, t, c] of [['yes', 'Предпазва', '#2e9e5b'], ['no', 'Разпространява', '#e76f51']]) {
    const l = labelSprite(t, { size: 0.26, border: c, color: c });
    l.position.set(0, 0.15, -1.15); hz[k].add(l); stage.steadyLabel(l, 9);
    hz[k].visible = false; scene.add(hz[k]);
  }

  // ---------- микроби в лупата ----------
  const MCOL = ['#9b7fd1', '#6cc070', '#f4a259', '#5fa8e0', '#ef7aa1', '#4fc1b5'];
  let microbes = [];
  const creases = [];
  for (let i = 0; i < 6; i++) creases.push([Math.random() * 60 + i * 40 - 20, Math.random() * 50 + 20, Math.random() * 0.6 - 0.3]);
  const lensState = { water: 0, foam: 0 };
  function makeMicrobes() {
    microbes = [];
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2; const r = 20 + Math.sqrt(Math.random()) * 82;
      microbes.push({ x: 128 + Math.cos(a) * r, y: 128 + Math.sin(a) * r, type: ['rod', 'ball', 'virus'][i % 3], col: MCOL[i % 6],
        ph: Math.random() * 6, rot: Math.random() * 6, gone: 0, goneT: 0, dx: (Math.random() - 0.5) * 50 });
    }
  }
  const alive = () => microbes.filter((m) => m.goneT === 0).length;
  function removeMicrobes(n) {
    for (const m of shuffle(microbes)) { if (n <= 0) break; if (m.goneT === 0) { m.goneT = 1; n--; } }
  }
  function face(c, s = 1) {
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(-3.5 * s, -1.5 * s, 2.8 * s, 0, 7); c.arc(3.5 * s, -1.5 * s, 2.8 * s, 0, 7); c.fill();
    c.fillStyle = '#222';
    c.beginPath(); c.arc(-3.2 * s, -1.2 * s, 1.4 * s, 0, 7); c.arc(3.8 * s, -1.2 * s, 1.4 * s, 0, 7); c.fill();
    c.strokeStyle = '#333'; c.lineWidth = 1.2;
    c.beginPath(); c.arc(0, 2 * s, 3 * s, 0.2, Math.PI - 0.2); c.stroke();
  }
  function drawMicrobe(c, m) {
    c.fillStyle = m.col; c.strokeStyle = 'rgba(40,40,60,.55)'; c.lineWidth = 1.5;
    if (m.type === 'rod') {
      c.beginPath(); c.roundRect(-17, -8, 34, 16, 8); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(17, 0); c.quadraticCurveTo(22, -5, 26, 0); c.quadraticCurveTo(30, 5, 34, 0); c.stroke();
      face(c, 1);
    } else if (m.type === 'ball') {
      c.beginPath(); c.arc(-8, 0, 9, 0, 7); c.fill(); c.stroke();
      c.beginPath(); c.arc(8, 0, 9, 0, 7); c.fill(); c.stroke();
      c.save(); c.translate(8, 0); face(c, 0.8); c.restore();
    } else {
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; c.beginPath(); c.arc(Math.cos(a) * 9.5, Math.sin(a) * 9.5, 2.4, 0, 7); c.fill(); }
      c.beginPath(); c.arc(0, 0, 8, 0, 7); c.fill(); c.stroke();
      face(c, 0.7);
    }
  }
  function drawLens(t) {
    const c = lctx;
    c.save();
    c.clearRect(0, 0, LS, LS);
    c.beginPath(); c.arc(128, 128, 127, 0, 7); c.clip();
    const g = c.createRadialGradient(100, 90, 20, 128, 128, 150);
    g.addColorStop(0, '#fde5cf'); g.addColorStop(1, '#eab894');
    c.fillStyle = g; c.fillRect(0, 0, LS, LS);
    c.strokeStyle = 'rgba(175,115,85,.35)'; c.lineWidth = 2.5;
    for (const [x, y, s] of creases) { c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + 40, y + 60 * s + 40, x + 30, y + 120, x + 70 * s + 10, y + 200); c.stroke(); }
    c.fillStyle = 'rgba(175,115,85,.25)';
    for (let i = 0; i < 40; i++) { c.beginPath(); c.arc((i * 73) % 256, (i * 131) % 256, 1.6, 0, 7); c.fill(); }
    for (const m of microbes) {
      if (m.gone >= 1) continue;
      c.save();
      c.globalAlpha = 1 - m.gone;
      c.translate(m.x + m.dx * m.gone + Math.sin(t * 1.3 + m.ph) * 2.5, m.y + m.gone * 110 + Math.cos(t * 1.1 + m.ph) * 2);
      c.rotate(m.rot + Math.sin(t * 0.9 + m.ph) * 0.3);
      drawMicrobe(c, m);
      c.restore();
    }
    if (lensState.water > 0.01) {
      c.globalAlpha = 0.5 * lensState.water; c.strokeStyle = '#7cc8ff'; c.lineWidth = 3;
      for (let i = 0; i < 14; i++) { const x = (i * 37) % 256; const y = ((t * 220 + i * 61) % 300) - 40; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 4, y + 34); c.stroke(); }
      c.globalAlpha = 1;
    }
    if (lensState.foam > 0.01) {
      c.globalAlpha = 0.75 * lensState.foam; c.fillStyle = '#ffffff'; c.strokeStyle = '#cfe6f5'; c.lineWidth = 1.5;
      for (let i = 0; i < 26; i++) { const x = (i * 97) % 256; const y = (i * 53 + Math.sin(t + i) * 6) % 256; c.beginPath(); c.arc(x, y, 7 + (i % 4) * 4, 0, 7); c.fill(); c.stroke(); }
      c.globalAlpha = 1;
    }
    c.restore();
    c.lineWidth = 7; c.strokeStyle = '#264653';
    c.beginPath(); c.arc(128, 128, 124, 0, 7); c.stroke();
  }
  makeMicrobes();

  // ---------- живата сцена ----------
  const dust = [];
  for (let i = 0; i < 18; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
    d.userData.ph = Math.random() * 10; scene.add(d); dust.push(d);
  }
  const wash = { water: false, scrub: false, secs: 0 };
  let foamK = 0; let lensFrame = 0;
  stage.tick((dt, t) => {
    const now = new Date();
    hS.rotation.z = -((now.getSeconds() + now.getMilliseconds() / 1000) / 60) * Math.PI * 2;
    hM.rotation.z = -((now.getMinutes() + now.getSeconds() / 60) / 60) * Math.PI * 2;
    hH.rotation.z = -(((now.getHours() % 12) + now.getMinutes() / 60) / 12) * Math.PI * 2;
    clouds.forEach((cl, i) => { cl.position.x = ((t * 0.05 * (1 + i * 0.3) + i * 0.9) % 2.6) - 1.3; });
    led.material.color.setHex(Math.sin(t * 2) > 0.85 ? 0xa5d6a7 : 0x4caf50);
    // Капка от крана, когато водата е спряна.
    stream.visible = wash.water;
    if (wash.water) {
      const a = new V3(0, 0.92, -0.2); const b = new V3(0, 0.12 + Math.sin(t * 30) * 0.01, 0.02);
      setStick(stream, a, b);
      drip.visible = false;
    } else {
      const k = (t * 0.6) % 1;
      drip.visible = true;
      drip.position.set(0, 0.9 - k * k * 0.85, -0.2);
    }
    for (const b of soapBubbles) {
      const k = (t * 0.12 + b.userData.ph) % 1;
      b.position.set(5.85 + Math.sin(t + b.userData.ph * 9) * 0.15, 0.2 + k * 1.4, -2.15 + Math.cos(b.userData.ph * 7) * 0.2);
      b.scale.setScalar(0.5 + k);
      b.material.opacity = 0.55 * (1 - k);
    }
    for (const d of dust) {
      const p = d.userData.ph;
      d.position.set(1.8 + Math.sin(t * 0.1 + p) * 1.6, 0.8 + ((t * 0.04 + p * 0.3) % 2.4), -2.2 + Math.cos(t * 0.13 + p) * 1.2);
    }
    // Детето диша и леко се оглежда.
    torso.scale.set(1, 1 + Math.sin(t * 1.6) * 0.015, 1);
    if (!kid.userData.busy) headG.rotation.y = Math.sin(t * 0.4) * 0.25;
    // Пяна и търкане.
    const foamTarget = wash.scrub || wash.soaped ? 1 : 0;
    foamK += (foamTarget - foamK) * Math.min(1, dt * 3);
    foam.scale.setScalar(Math.max(0.001, foamK * (1 + (wash.scrub ? Math.sin(t * 12) * 0.08 : 0))));
    lensState.foam = foamK;
    lensState.water += ((wash.water ? 1 : 0) - lensState.water) * Math.min(1, dt * 4);
    if (wash.scrub) {
      handG.rotation.y = -0.25 + Math.sin(t * 9) * 0.25;
      handG.position.x = HAND_HOME.x + Math.sin(t * 9) * 0.06;
    } else {
      handG.rotation.y += (-0.25 - handG.rotation.y) * Math.min(1, dt * 5);
      handG.position.x += (HAND_HOME.x - handG.position.x) * Math.min(1, dt * 5);
    }
    for (const m of microbes) if (m.gone < m.goneT) m.gone = Math.min(m.goneT, m.gone + dt * 0.8);
    // Лупата гледа към камерата и показва увеличената кожа.
    lens.lookAt(camera.position);
    if ((lensFrame++ & 1) === 0) {
      drawLens(t);
      lensTex.needsUpdate = true;
      const pc = container.querySelector('.foodhealth-lens');
      if (pc) { const x = pc.getContext('2d'); x.clearRect(0, 0, LS, LS); x.drawImage(lensCanvas, 0, 0); }
    }
    // Капчици.
    if (drops.count) {
      dropAge += dt;
      const fade = dropAge > 3.5 ? Math.max(0, 1 - (dropAge - 3.5) / 1.5) : 1;
      const mouthX = kid.position.x + MOUTH_L.x;
      for (let i = 0; i < drops.count; i++) {
        const p = dP[i]; const v = dV[i];
        if (dState[i] === 0) {
          v.y -= 4 * dt;
          p.addScaledVector(v, dt);
          if (dropMode === 'elbow' && p.x > mouthX + 0.1) { dState[i] = 1; p.x = mouthX + 0.1 + Math.random() * 0.04; }
          if (p.y <= 0.03 && p.x > -TABLE_W / 2 && p.x < TABLE_W / 2 && p.z > -1.4 && p.z < 2.4) { p.y = 0.03; dState[i] = 1; }
          if (p.y <= FLOOR + 0.02) { p.y = FLOOR + 0.02; dState[i] = 1; }
          if (dropMode === 'open') dropMaxX = Math.max(dropMaxX, p.x);
        }
        ds.setScalar(fade);
        dm.compose(p, dq, ds);
        drops.setMatrixAt(i, dm);
      }
      drops.instanceMatrix.needsUpdate = true;
      if (fade <= 0) drops.count = 0;
    }
  });

  // ---------- изгледи ----------
  const tanV = Math.tan((camera.fov * Math.PI) / 360);
  function fitView(c, hw, hh, elev = 0.5, dur = 1.0) {
    const asp = camera.aspect;
    const d = Math.max(hw / (tanV * asp), hh / tanV) * 1.06;
    const pos = [c[0], c[1] + Math.sin(elev) * d, c[2] + Math.cos(elev) * d];
    stage.stopFollow();
    stage.flyTo(pos, c, dur);
  }
  const overview = () => fitView([0, 0.5, -0.5], 5.9, 2.4, 0.45);
  const tableView = () => (narrow ? fitView([0, 0, 0.75], 3.25, 2.0, 0.85) : fitView([0, 0, 0.6], 3.95, 1.9, 0.8));
  const sinkView = () => fitView([4.5, 0.55, -2.35], narrow ? 1.35 : 1.7, 0.95, 0.42);
  const kidView = () => fitView([-2.7, 0.25, 0.5], narrow ? 2.3 : 2.6, 1.5, 0.3);
  const cabinetView = () => fitView([-1.6, 0.85, -2.5], narrow ? 1.3 : 1.7, 0.95, 0.3);
  const showLabels = (foodN, cureOn) => {
    for (const id of FOOD_IDS) foods[id].userData.lbl.visible = foodN === 'all' || FOODS[id].n === foodN;
    for (const id of CURE_IDS) cure[id].userData.lbl.visible = cureOn;
  };

  // ---------- балончета ----------
  let tip = null;
  function say(anchor, html, cls = '', lift = 0.4) {
    if (tip) tip.remove();
    tip = stage.bubble(anchor, html, { lift, cls });
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }
  let extraTag = null;
  function tag(anchor, html, lift = 0.4) {
    if (extraTag) extraTag.remove();
    extraTag = stage.bubble(anchor, html, { lift, cls: 'tag' });
  }
  function clearTag() { if (extraTag) { extraTag.remove(); extraTag = null; } }

  // ---------- общи действия ----------
  let clickHandler = null;
  let menuHandler = null;
  stage.onClick((hit) => { if (clickHandler) clickHandler(hit ? hit.root.userData.pickId : null, hit); });
  const MENU = [
    ...NUT_IDS.map((n) => ({ id: n, label: NUT[n].label, icon: NUT[n].icon })),
    { id: 'water', label: 'Вода', icon: '💧' },
    { id: 'sink', label: 'Мивка и сапун', icon: '🧼' },
    { id: 'magnifier', label: 'Лупа', icon: '🔍' },
    { id: 'nurse', label: 'Кабинет на сестрата', icon: '🩺' },
  ];
  const menu = cornerMenu(stage, { title: 'Разгледай', items: MENU, onSelect: (id) => menuHandler && menuHandler(id) });

  const scores = [];
  let stopDrag = null;
  function hop(g, to, dur = 0.45, h = 0.3) {
    const from = g.position.clone();
    return phase(dur, (k) => { g.position.lerpVectors(from, to, ease(k)); g.position.y = to.y + Math.sin(k * Math.PI) * h; }).then(() => g.position.copy(to));
  }
  function nextBtn(label, fn) {
    const c = shell.setControls(`<button class="btn primary">${label}</button>`);
    c.querySelector('button').addEventListener('click', fn);
  }

  // ---------- 1. Опознай ----------
  const NOTES = {
    water: '💧 <b>Вода.</b> Повече от половината от тялото ни е вода. Тя е най-добрата напитка — пий вода през целия ден, особено когато играеш и е горещо.',
    sink: '🧼 <b>Мивка и сапун.</b> Сапунът отлепя мазнината и микробите от кожата, а водата ги отмива. Ръцете се мият поне 20 секунди — преди ядене, след тоалетна и след игра навън.',
    magnifier: '🔍 <b>Лупа.</b> С нея кожата изглежда по-голяма. Но микробите не се виждат с лупа. Те са толкова малки, че се виждат само с микроскоп, а вирусите — само с много силен микроскоп. Тук са нарисувани, за да ги видиш.',
    nurse: '🩺 <b>Кабинет на медицинската сестра.</b> Тук има ваксини, лекарства и неща за хигиена. Лекарства се дават само от лекар, медицинска сестра или родител.',
  };
  function step1() {
    shell.step(0);
    clearTip(); clearTag();
    menu.show(true);
    menu.setActive(null);
    const seen = new Set();
    shell.task(`<p>Добре дошъл в училищната столова! Тук ще научиш какво ни дава храната и как да се пазим от заразни болести.</p>
      <p><b>Разгледай всичко</b> — кликни върху храните, каната, мивката, лупата и шкафа или ги избери от менюто в ъгъла.</p>`);
    const ctrl = shell.setControls('<div class="row"><button class="btn all">🔭 Цялата столова</button></div>');
    ctrl.querySelector('.all').addEventListener('click', () => { clearTip(); showLabels(null, false); overview(); });
    const upd = () => shell.score(`Разгледани: ${seen.size} от ${MENU.length}`);
    upd();
    const visit = (id) => {
      if (NUT[id]) {
        const [x, z] = NUT[id].pos;
        showLabels(id, false);
        fitView([x, 0.2, z + 0.1], 2.0, 1.1, 0.6);
        say(new V3(x, 0.35, z), `${NUT[id].icon} ${NUT[id].note}`, 'wide', 0.2);
      } else if (id === 'water') {
        showLabels(null, false);
        fitView([0.1, 0.35, 1.2], 1.6, 1.0, 0.5);
        say(jug, NOTES.water, 'wide', 0.95);
      } else if (id === 'sink') {
        showLabels(null, false);
        sinkView();
        say(sink, NOTES.sink, 'wide', 1.15);
      } else if (id === 'magnifier') {
        showLabels(null, false);
        fitView([4.3, 0.75, -2.3], 1.7, 1.0, 0.38);
        say(lens, NOTES.magnifier, 'wide', 0.55);
      } else if (id === 'nurse') {
        showLabels(null, true);
        cabinetView();
        say(new V3(-1.6, 1.5, -2.5), NOTES.nurse, 'wide', 0.3);
      }
      seen.add(id); menu.mark(id); menu.setActive(id); upd();
      if (seen.size === MENU.length && !ctrl.querySelector('.go')) {
        shell.msg('Разгледа всичко! Продължи напред.', 'good');
        const b = document.createElement('button');
        b.className = 'btn primary go'; b.textContent = 'Напред →';
        b.addEventListener('click', step2);
        ctrl.querySelector('.row').appendChild(b);
      }
    };
    clickHandler = (pid) => {
      if (!pid) { clearTip(); return; }
      if (pid.startsWith('food:')) visit(FOODS[pid.slice(5)].n);
      else if (pid === 'water' || pid === 'sink' || pid === 'magnifier' || pid === 'nurse') visit(pid);
      else if (CURE[pid]) visit('nurse');
    };
    menuHandler = visit;
    showLabels(null, false);
    overview();
  }

  // ---------- 2. Хранителни вещества ----------
  function zoneUnder(p, list = zones, r = 0.95) {
    let best = null; let bd = r;
    for (const k of Object.keys(list)) {
      const z = list[k].position;
      const d = Math.hypot(p.x - z.x, p.z - z.z);
      if (d < bd) { bd = d; best = k; }
    }
    return best;
  }
  function step2() {
    shell.step(1);
    clearTip(); clearTag();
    menu.show(false);
    menuHandler = null;
    jug.visible = false;
    showLabels('all', false);
    for (const n of NUT_IDS) zones[n].visible = true;
    let mistakes = 0;
    let done = 0;
    const tries = {};
    const fill = { p: 0, c: 0, f: 0, v: 0 };
    const order = shuffle(FOOD_IDS);
    order.forEach((id, i) => {
      const g = foods[id];
      const [x, z] = rowPos(i, order.length);
      g.position.set(x, 0, z);
      g.userData.home = g.position.clone();
      g.userData.locked = false;
      g.userData.dragId = id;
    });
    tableView();
    shell.task(`<p>Храните се разбъркаха! <b>Провлачи всяка храна</b> до групата вещества, с които е най-богата.</p>
      <p class="small">Кликни храна, за да видиш името ѝ.</p>`);
    const upd = () => shell.score(`Подредени: ${done} от ${FOOD_IDS.length} · грешки: ${mistakes}`);
    upd();
    shell.setControls('');
    clickHandler = (pid) => {
      if (!pid) return clearTip();
      if (pid.startsWith('food:')) { const g = foods[pid.slice(5)]; say(g, `<b>${esc(FOODS[g.userData.food].label)}</b>`, 'tag', 0.55); }
    };
    stopDrag = stage.enableDrag({
      planeY: 0,
      lift: 0.35,
      onStart: () => clearTip(),
      onMove: (g, p) => highlightZone(zoneUnder(p)),
      onDrop: (g, p, start) => {
        highlightZone(null);
        const id = g.userData.food;
        if (!id) { g.position.copy(start); return; }
        const f = FOODS[id];
        const z = zoneUnder(p);
        if (!z) { hop(g, g.userData.home); return; }
        if (z !== f.n && z !== f.also) {
          const anchor = new V3(NUT[z].pos[0], 0.3, NUT[z].pos[1]);
          if (f.almost && f.almost[z]) {
            say(anchor, `🤔 ${esc(f.almost[z])}`, 'bad', 0.3);
            shell.msg('Почти! Опитай друга група.', 'bad');
          } else {
            mistakes++;
            tries[id] = (tries[id] || 0) + 1;
            say(anchor, `✘ ${esc(f.def)} ${id === 'nuts' ? 'не са' : 'не е'} сред храните, най-богати на ${esc(NUT[z].label.toLowerCase())}.${tries[id] >= 2 ? `<br><i>Подсказка: ${esc(f.hint)}</i>` : ''}`, 'bad', 0.3);
            shell.msg('Не е тази група. Прочети защо и опитай пак.', 'bad');
            upd();
          }
          hop(g, g.userData.home);
          return;
        }
        const k = fill[z]++;
        const [x, zz] = NUT[z].pos;
        const cl = CL[Math.min(k, CL.length - 1)];
        hop(g, new V3(x + cl[0], 0, zz + cl[1]));
        g.userData.locked = true;
        done++;
        say(new V3(x, 0.4, zz), `✔ ${esc(f.ok)}`, 'good', 0.3);
        shell.msg('Вярно!', 'good');
        upd();
        if (done === FOOD_IDS.length) {
          stopDrag(); stopDrag = null;
          shell.msg(mistakes ? `Всички храни са подредени. Грешки: ${mistakes}.` : 'Всички храни са подредени без грешка! 🎉', 'good');
          nextBtn('Сега — здравословен обяд →', () => platePart(mistakes));
        }
      },
    });
  }

  function platePart(mistakes0) {
    clearTip();
    let mistakes = mistakes0;
    let checks = 0;
    for (const id of FOOD_IDS) foods[id].visible = false;
    for (const n of NUT_IDS) zones[n].visible = false;
    plate.visible = true; plate.rotation.y = 0;
    coaster.visible = true;
    const slot = {}; // id -> 'q0'..'q3' | 'drink'
    const order = shuffle(PLATE_IDS);
    order.forEach((id, i) => {
      const g = pfood[id];
      const [x, z] = rowPos(i, order.length);
      g.position.set(x, 0, z);
      g.userData.home = g.position.clone();
      g.userData.dragId = id;
      g.userData.locked = false;
      g.visible = true;
    });
    tableView();
    shell.task(`<p>Направи <b>здравословен обяд</b>! Чинията е разделена на 4 равни части.</p>
      <p><b>Провлачи храни</b> в четирите части и <b>напитка</b> в синия кръг. После натисни „Провери чинията“.</p>
      <p class="small">Кликни храна в чинията, за да я върнеш.</p>`);
    shell.score(`Грешки в стъпката: ${mistakes}`);
    const c = shell.setControls('<button class="btn primary chk">🍽 Провери чинията</button>');
    const occupant = (s) => Object.keys(slot).find((k) => slot[k] === s);
    const sendHome = (id) => { delete slot[id]; hop(pfood[id], pfood[id].userData.home); };
    const placeAt = (id, s) => {
      const prev = occupant(s);
      if (prev && prev !== id) sendHome(prev);
      slot[id] = s;
      let to;
      if (s === 'drink') to = new V3(coaster.position.x, 0, coaster.position.z);
      else { const q = QPOS[+s.slice(1)]; to = new V3(plate.position.x + q[0], 0.06, plate.position.z + q[1]); }
      hop(pfood[id], to, 0.35, 0.2);
    };
    clickHandler = (pid) => {
      if (!pid) return clearTip();
      if (pid.startsWith('pf:')) {
        const id = pid.slice(3);
        if (slot[id]) sendHome(id);
        else say(pfood[id], `<b>${esc(PLATE[id].label)}</b>`, 'tag', 0.55);
      }
    };
    stopDrag = stage.enableDrag({
      planeY: 0,
      lift: 0.35,
      onStart: () => clearTip(),
      onDrop: (g, p, start) => {
        const id = g.userData.pf;
        if (!id) { g.position.copy(start); return; }
        const isDrink = PLATE[id].g === 'drink';
        const dc = Math.hypot(p.x - coaster.position.x, p.z - coaster.position.z);
        const dp = Math.hypot(p.x - plate.position.x, p.z - plate.position.z);
        if (dc < 0.6) {
          if (!isDrink) { shell.msg('Синият кръг е за напитката. Храната слагаме в чинията.', 'bad'); sendHome(id); return; }
          placeAt(id, 'drink');
        } else if (dp < 1.4) {
          if (isDrink) { shell.msg('Напитката слагаме в синия кръг до чинията.', 'bad'); sendHome(id); return; }
          let best = 0; let bd = 1e9;
          QPOS.forEach((q, i) => { const d = Math.hypot(p.x - plate.position.x - q[0], p.z - plate.position.z - q[1]); if (d < bd) { bd = d; best = i; } });
          placeAt(id, 'q' + best);
        } else sendHome(id);
        shell.msg('');
      },
    });
    c.querySelector('.chk').addEventListener('click', () => {
      const onPlate = Object.keys(slot).filter((k) => slot[k] !== 'drink');
      const drink = occupant('drink');
      if (onPlate.length < 4) { shell.msg('Напълни и четирите части на чинията.', 'bad'); return; }
      if (!drink) { shell.msg('Сложи и напитка в синия кръг.', 'bad'); return; }
      const cnt = { veg: 0, grain: 0, prot: 0, junk: 0 };
      onPlate.forEach((k) => { cnt[PLATE[k].g]++; });
      const probs = [];
      if (cnt.junk) probs.push(`${onPlate.filter((k) => PLATE[k].g === 'junk').map((k) => PLATE[k].label).join(' и ')} — много захар, сол и мазнини. Това не е храна за всеки ден, а за рядко.`);
      if (cnt.veg < 2) probs.push('Плодовете и зеленчуците трябва да заемат половината чиния.');
      if (cnt.veg > 2) probs.push('Плодовете и зеленчуците са половината чиния — остави място и за други храни.');
      if (cnt.grain === 0) probs.push('Липсва зърнена храна, която дава енергия.');
      if (cnt.grain > 1) probs.push('Зърнените храни са една четвърт от чинията — не повече.');
      if (cnt.prot === 0) probs.push('Липсва храна с белтъци, нужна за растежа.');
      if (cnt.prot > 1) probs.push('Храните с белтъци са една четвърт от чинията — не повече.');
      if (drink === 'soda') probs.push('Газираната напитка е пълна със захар. Жаждата се утолява най-добре с вода.');
      checks++;
      const anchor = new V3(plate.position.x, 0.3, plate.position.z - 0.4);
      if (probs.length) {
        mistakes++;
        shell.score(`Грешки в стъпката: ${mistakes}`);
        say(anchor, `🍽 Чинията казва:<br>${probs.map((s) => '✘ ' + esc(s)).join('<br>')}`, 'bad wide', 0.4);
        shell.msg('Почти! Поправи чинията и провери пак.', 'bad');
        return;
      }
      stopDrag(); stopDrag = null;
      clickHandler = null;
      for (const k of Object.keys(slot)) pfood[k].userData.locked = true;
      for (const id of PLATE_IDS) if (!slot[id]) pfood[id].visible = false;
      say(anchor, '✔ Чудесен здравословен обяд! Половината — плодове и зеленчуци, една четвърт — зърнени храни, една четвърт — белтъци, а за пиене — вода.', 'good wide', 0.4);
      shell.msg(checks === 1 && mistakes === mistakes0 ? 'Чинията е здравословна от първия опит! 🎉' : 'Чинията е здравословна!', 'good');
      scores.push(stepScore(mistakes, 4));
      // Чинията леко се завърта, за да се види отвсякъде.
      const items = Object.keys(slot).filter((k) => slot[k] !== 'drink').map((k) => pfood[k]);
      items.forEach((g) => { const wp = g.position.clone(); plate.worldToLocal(wp); plate.add(g); g.position.copy(wp); });
      phase(2.2, (k) => { plate.rotation.y = ease(k) * Math.PI * 2; });
      nextBtn('Напред: микробите →', step3);
    });
  }

  // ---------- 3. Микроби и хигиена ----------
  function step3() {
    shell.step(2);
    clearTip(); clearTag();
    clickHandler = null;
    sinkView();
    shell.task(`<p>Това е ръката на дете, което току-що е играло навън. Микробите по нея са нарисувани много по-големи. Виж колко <b>микроби</b> има по кожата!</p>
      <canvas class="foodhealth-lens" width="${LS}" height="${LS}"></canvas>
      <p class="small">Първо опитай да измиеш ръката само с вода.</p>`);
    say(lens, '🔍 Това са <b>микроби</b> — бактерии и вируси, нарисувани много по-големи. Повечето са безобидни, но някои причиняват <b>заразни болести</b>. Грипът и настинката се причиняват от вируси. Някои болести, например някои видове ангина, се причиняват от бактерии.', 'wide', 0.55);
    const upd = () => shell.score(`Микроби по ръката: ${alive()}`);
    upd();
    const c = shell.setControls('<div class="foodhealth-btns"><button class="btn primary w">💧 Само вода (5 секунди)</button></div>');
    c.querySelector('.w').addEventListener('click', async (e) => {
      e.target.disabled = true;
      clearTip();
      wash.water = true;
      tag(sink, '💧 Само вода…', 1.3);
      await phase(2.5, (k) => { const want = 24 - Math.round(k * 6); if (alive() > want) removeMicrobes(alive() - want); upd(); });
      wash.water = false;
      clearTag();
      say(lens, `Водата отми само малко микроби — останаха ${alive()}. Те се държат здраво за мазнинката по кожата.`, 'bad wide', 0.55);
      soapPart();
    });
  }
  function soapPart() {
    const upd = () => shell.score(`Микроби по ръката: ${alive()} · търкане: ${Math.floor(wash.secs)} с`);
    upd();
    shell.task(`<p>Сега измий ръката със <b>сапун</b>. Натисни „Сапун“, после „Търкай“ и търкай <b>поне 20 секунди</b> — колкото да изпееш два пъти „Честит рожден ден“.</p>
      <canvas class="foodhealth-lens" width="${LS}" height="${LS}"></canvas>`);
    const c = shell.setControls('<div class="foodhealth-btns"><button class="btn primary s">🧼 Сапун</button><button class="btn r" disabled>👐 Търкай</button></div>');
    const sBtn = c.querySelector('.s'); const rBtn = c.querySelector('.r');
    let n0 = alive();
    let stopT = null;
    sBtn.addEventListener('click', async () => {
      sBtn.disabled = true;
      const from = soap.position.clone();
      await hop(soap, handG.position.clone().add(new V3(0, 0.12, 0)), 0.6, 0.3);
      wash.soaped = true;
      await hop(soap, from, 0.5, 0.2);
      rBtn.disabled = false; rBtn.classList.add('primary'); sBtn.classList.remove('primary');
      shell.msg('Сега търкай!', 'good');
    });
    rBtn.addEventListener('click', () => {
      if (!wash.scrub) {
        wash.scrub = true; n0 = Math.max(n0, alive());
        rBtn.textContent = '✋ Спри';
        clearTip(); shell.msg('');
        stopT = stage.tick(() => {
          wash.secs += rdt;
          const want = Math.max(1, n0 - Math.floor(Math.min(1, wash.secs / 20) * (n0 - 1)));
          if (alive() > want) removeMicrobes(alive() - want);
          tag(sink, `⏱ ${Math.min(20, Math.floor(wash.secs))} с`, 1.3);
          upd();
          if (wash.secs >= 20) { stopT(); stopT = null; finishWash(); }
        });
      } else {
        wash.scrub = false;
        if (stopT) { stopT(); stopT = null; }
        rBtn.textContent = '👐 Търкай още';
        shell.msg(`Спря на ${Math.floor(wash.secs)} секунди. Още има микроби! Търкай поне 20 секунди.`, 'bad');
      }
    });
    async function finishWash() {
      wash.scrub = false;
      rBtn.disabled = true; rBtn.textContent = '👐 Търкай';
      clearTag();
      tag(sink, '💧 Изплакване…', 1.3);
      wash.water = true; wash.soaped = false;
      await phase(1.6);
      wash.water = false;
      clearTag();
      upd();
      say(lens, `✔ Със сапун и 20 секунди търкане се отмиха почти всички микроби — остана само ${alive()}. Накрая подсуши ръцете с чиста кърпа.`, 'good wide', 0.55);
      shell.msg('Чисти ръце! Сапунът отмива много повече микроби от водата.', 'good');
      nextBtn('Напред: кихането →', sneezePart);
    }
  }

  function sneezePart() {
    clearTip(); clearTag();
    shell.msg('');
    kidView();
    const done = new Set();
    shell.task(`<p>Когато болен човек киха или кашля, от устата и носа му излитат <b>малки капчици</b>. С тях летят и микроби.</p>
      <p>Опитай и двата начина и сравни <b>докъде стигат капчиците</b>.</p>`);
    shell.score('');
    const c = shell.setControls('<div class="foodhealth-btns"><button class="btn o">🤧 Кихни без да се пазиш</button><button class="btn e">💪 Кихни в лакътя</button></div>');
    let busy = false;
    const go = async (mode) => {
      if (busy) return;
      busy = true;
      clearTip();
      c.querySelectorAll('button').forEach((b) => { b.disabled = true; });
      await sneeze(mode);
      done.add(mode);
      const tableX = dropMaxX;
      if (mode === 'open') say(new V3(Math.max(-3, tableX - 0.6), 0.2, 0.6), '😮 Капчиците полетяха надалеч и паднаха върху масата и храната! Така микробите стигат до другите.', 'bad wide', 0.3);
      else say(kid, '✔ Капчиците останаха в ръкава. Така микробите не стигат до другите. После измий ръцете!', 'good wide', 2.9);
      c.querySelectorAll('button').forEach((b) => { b.disabled = false; });
      busy = false;
      if (done.size === 2 && !c.querySelector('.n')) {
        shell.msg('Кихай и кашляй в лакътя или в кърпичка!', 'good');
        const b = document.createElement('button');
        b.className = 'btn primary n'; b.textContent = 'Напред: навиците →';
        b.addEventListener('click', habitsPart);
        c.querySelector('.foodhealth-btns').appendChild(b);
      }
    };
    c.querySelector('.o').addEventListener('click', () => go('open'));
    c.querySelector('.e').addEventListener('click', () => go('elbow'));
  }
  async function sneeze(mode) {
    kid.userData.busy = true;
    headG.rotation.y = 0;
    if (mode === 'elbow') await phase(0.5, (k) => poseArm(ease(k)));
    tag(kid, 'Ааа…', 2.9);
    await phase(0.6, (k) => { headG.rotation.z = ease(k) * 0.35; });
    tag(kid, 'Апчих!', 2.9);
    dropMode = mode; dropAge = 0; dropMaxX = -99;
    const mouth = kid.localToWorld(MOUTH_L.clone());
    for (let i = 0; i < DN; i++) {
      dP[i].copy(mouth).add(new V3(0, (Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.08));
      const sp = 2.6 + Math.random() * 2.8;
      dV[i].set(sp, (Math.random() - 0.35) * 1.4, (Math.random() - 0.5) * 2.4);
      dState[i] = 0;
    }
    drops.count = DN;
    await phase(0.25, (k) => { headG.rotation.z = 0.35 - ease(k) * 0.65; });
    await phase(1.6);
    await phase(0.4, (k) => { headG.rotation.z = -0.3 * (1 - k); });
    clearTag();
    if (mode === 'elbow') await phase(0.5, (k) => poseArm(1 - ease(k)));
    kid.userData.busy = false;
  }

  let cards = [];
  function clearCards() { for (const g of cards) { scene.remove(g); disposeTree(g); } cards = []; }
  function habitsPart() {
    clearTip(); clearTag();
    tableView();
    plate.visible = false; coaster.visible = false;
    for (const id of PLATE_IDS) pfood[id].visible = false;
    hz.yes.visible = true; hz.no.visible = true;
    let mistakes = 0;
    let idx = 0;
    const order = shuffle(HABITS);
    const tries = {};
    shell.task(`<p>Кои навици ни <b>предпазват</b> от заразни болести и кои <b>разпространяват</b> микробите?</p>
      <p><b>Провлачи всяка карта</b> в правилния кръг.</p>`);
    const upd = () => shell.score(`Карта ${Math.min(idx + 1, order.length)} от ${order.length} · грешки: ${mistakes}`);
    shell.setControls('');
    const CARD_POS = new V3(0, 0.45, narrow ? 1.7 : 1.55);
    const spawn = () => {
      const h = order[idx];
      const g = new THREE.Group();
      const s = cardSprite(h.t, { w: narrow ? 2.2 : 2.3 });
      g.add(s);
      g.position.copy(CARD_POS);
      g.userData.pickId = 'card'; g.userData.dragId = 'card'; g.userData.habit = h;
      scene.add(g);
      addHitBox(g, 0.6);
      cards.push(g);
      g.scale.setScalar(0.01);
      phase(0.35, (k) => g.scale.setScalar(Math.max(0.01, ease(k))));
      upd();
    };
    spawn();
    clickHandler = (pid) => { if (!pid) clearTip(); };
    const stacked = { yes: 0, no: 0 };
    stopDrag = stage.enableDrag({
      planeY: 0.45,
      lift: 0.1,
      onStart: () => clearTip(),
      onMove: (g, p) => highlightZone(zoneUnder(p, hz, 1.4), hz),
      onDrop: (g, p, start) => {
        highlightZone(null, hz);
        const h = g.userData.habit;
        if (!h) { g.position.copy(start); return; }
        const z = zoneUnder(p, hz, 1.4);
        if (!z) { hop(g, CARD_POS, 0.35, 0.1); return; }
        const right = (z === 'yes') === h.ok;
        if (!right) {
          mistakes++;
          tries[h.t] = (tries[h.t] || 0) + 1;
          say(hz[z], `✘ Помисли пак. ${esc(h.why)}`, 'bad wide', 0.5);
          shell.msg('Не е този кръг. Прочети защо.', 'bad');
          hop(g, CARD_POS, 0.35, 0.1);
          upd();
          return;
        }
        g.userData.locked = true;
        g.userData.pickId = 'card-done';
        const k = stacked[z]++;
        const zp = hz[z].position;
        const to = new V3(zp.x, 0.12 + k * 0.03, zp.z - 0.55 + k * 0.28);
        hop(g, to, 0.35, 0.15).then(() => g.scale.setScalar(0.62));
        say(hz[z], `✔ ${esc(h.why)}`, 'good wide', 0.5);
        shell.msg('Вярно!', 'good');
        idx++;
        if (idx < order.length) { spawn(); return; }
        stopDrag(); stopDrag = null;
        upd();
        scores.push(stepScore(mistakes, 3));
        shell.msg(mistakes ? `Готово! Грешки: ${mistakes}.` : 'Всички навици са подредени без грешка! 🎉', 'good');
        nextBtn('Напред: ваксини и лекарства →', step4);
      },
    });
  }

  // ---------- 4. Предпазване и лечение ----------
  function step4() {
    shell.step(3);
    clearTip(); clearTag();
    clearCards();
    hz.yes.visible = false; hz.no.visible = false;
    showLabels(null, true);
    cabinetView();
    let mistakes = 0;
    let idx = 0;
    const tries = {};
    const order = shuffle(CASES);
    const draw = () => {
      shell.task(`<p>Какво помага в тази ситуация? <b>Кликни</b> ваксината, лекарството или хигиената в шкафа.</p>
        <div class="foodhealth-case">${esc(order[idx].t)}</div>`);
      shell.score(`Ситуация ${idx + 1} от ${order.length} · грешки: ${mistakes}`);
    };
    draw();
    shell.setControls('');
    let busy = false;
    clickHandler = async (pid) => {
      if (!pid) return;
      if (!CURE[pid] || busy) return;
      const cs = order[idx];
      const g = cure[pid];
      if (pid !== cs.a) {
        mistakes++;
        tries[idx] = (tries[idx] || 0) + 1;
        say(g, `✘ ${esc(WRONG[cs.a][pid])}`, 'bad wide', 0.75);
        shell.msg('Не точно. Прочети защо.', 'bad');
        shell.score(`Ситуация ${idx + 1} от ${order.length} · грешки: ${mistakes}`);
        const h = g.userData.home;
        phase(0.4, (k) => { g.position.x = h.x + Math.sin(k * Math.PI * 6) * 0.04 * (1 - k); });
        return;
      }
      busy = true;
      say(g, `✔ ${CURE[pid].note}`, 'good wide', 0.75);
      shell.msg('Вярно!', 'good');
      const h = g.userData.home;
      await phase(0.6, (k) => { g.position.y = h.y + Math.sin(k * Math.PI) * 0.2; g.rotation.y = ease(k) * Math.PI * 2; });
      g.rotation.y = 0;
      idx++;
      if (idx < order.length) {
        const c = shell.setControls('<button class="btn primary">Следваща ситуация →</button>');
        c.querySelector('button').addEventListener('click', () => { clearTip(); shell.setControls(''); shell.msg(''); busy = false; draw(); });
        return;
      }
      busy = false;
      clickHandler = null;
      nextBtn('Напред →', () => predict(mistakes));
    };
  }

  function predict(mistakes0) {
    let mistakes = mistakes0;
    clearTip();
    say(cure.medicine, '⚠ Важно! <b>Антибиотиците</b> са лекарства срещу <b>бактерии</b>. Срещу <b>вируси</b> — например грип и настинка — те не действат.', 'wide', 0.75);
    const OPTS = shuffle([
      { t: 'Ще оздравее веднага, защото антибиотикът убива всички микроби.', ok: false, why: 'Не. Антибиотиците действат само на бактериите, а настинката е от вирус.' },
      { t: 'Няма да му помогне — антибиотикът не действа на вирусите. А и лекарства се пият само ако лекар ги е предписал.', ok: true },
      { t: 'Ще се предпази завинаги от настинка, както с ваксина.', ok: false, why: 'Не. Лекарството не е ваксина — то не „учи“ тялото да познава микроба.' },
    ]);
    shell.task(`<p><b>Предскажи!</b></p>
      <div class="foodhealth-case">Петьо е настинал. Настинката се причинява от <b>вирус</b>. В шкафа има антибиотик, останал от болестта на сестра му. Какво ще стане, ако Петьо го изпие сам?</div>
      <div class="choices">${OPTS.map((o, i) => `<button class="choice" data-i="${i}"><span class="mark">○</span><span>${esc(o.t)}</span></button>`).join('')}</div>`);
    shell.score('');
    shell.setControls('');
    const box = container.querySelector('.xp-task .choices');
    box.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
      const o = OPTS[+b.dataset.i];
      if (!o.ok) {
        mistakes++;
        b.classList.add('wrong'); b.disabled = true;
        shell.msg(o.why, 'bad');
        return;
      }
      b.classList.add('right');
      box.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
      shell.msg('Вярно!', 'good');
      say(cure.medicine, '✔ Антибиотикът няма да помогне при вирус. Петьо трябва да почива, да пие вода и чай и да каже на възрастен. Ако му стане по-зле, лекарят ще реши дали е нужно лекарство.', 'good wide', 0.75);
      scores.push(stepScore(mistakes, 3));
      const c = shell.setControls('<button class="btn primary">Виж резултата</button>');
      c.querySelector('button').addEventListener('click', () => {
        clearTip();
        const ratio = scores.reduce((a, s) => a + s, 0) / scores.length;
        shell.score('');
        shell.finish(ratio, onComplete, restart);
      });
    }));
  }

  // ---------- отначало ----------
  function resetWorld() {
    gen++;
    if (stopDrag) { stopDrag(); stopDrag = null; }
    clearTip(); clearTag();
    clearCards();
    foodsHome();
    for (const n of NUT_IDS) { zones[n].visible = true; highlightZone(null); }
    jug.visible = true;
    for (const id of PLATE_IDS) {
      const g = pfood[id];
      if (g.parent !== scene) scene.add(g);
      g.visible = false; g.rotation.set(0, 0, 0); g.userData.locked = false;
    }
    plate.visible = false; plate.rotation.y = 0; coaster.visible = false;
    hz.yes.visible = false; hz.no.visible = false;
    makeMicrobes();
    wash.water = false; wash.scrub = false; wash.secs = 0; wash.soaped = false;
    soap.position.copy(soap.userData.home);
    drops.count = 0;
    kid.userData.busy = false; headG.rotation.set(0, 0, 0); poseArm(0);
    for (const id of CURE_IDS) { cure[id].position.copy(cure[id].userData.home); cure[id].rotation.set(0, 0, 0); }
  }
  function restart() {
    resetWorld();
    scores.length = 0;
    menu.setItems(MENU);
    step1();
  }

  resetWorld();
  step1();
  return {
    dispose() {
      gen++;
      if (stopDrag) stopDrag();
      stage.dispose();
    },
  };
}
