// Малки общи части за преживяванията по биология от 6. клас (6.3.x):
// надпис „Не е в мащаб“, точка за клик, етикет над обект, прозрачна схема на бозайник.
import { labelSprite, THREE } from '../kit.js';
import { quadruped } from './nature3.js';

// Жълт надпис в долния ляв ъгъл на сцената. Връща елемента (за dispose).
export function badge(shell, text = '⚠ Не е в мащаб') {
  const el = document.createElement('div');
  el.textContent = text;
  el.style.cssText = 'position:absolute;left:8px;bottom:8px;z-index:4;pointer-events:none;background:rgba(255,255,255,.9);color:#8a6d00;font-size:.78rem;border-radius:8px;padding:3px 8px;max-width:70%';
  shell.stageEl.appendChild(el);
  return el;
}

// Точка (котва) за балонче и клик: невидима сфера с pickId.
export function spot(parent, id, pos, r = 0.25) {
  const a = new THREE.Object3D();
  a.position.set(...pos);
  if (id) {
    a.userData.pickId = id;
    const h = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
    h.userData.isHitBox = true;
    a.add(h);
  }
  parent.add(a);
  return a;
}

// Етикет над обект, който пази размера си на екрана.
export function tagOn(stage, parent, text, pos, size = 0.2, ref = 8) {
  const l = labelSprite(text, { size });
  l.position.set(...pos);
  parent.add(l);
  stage.steadyLabel(l, ref);
  return l;
}

// Прозрачен бозайник (схема): тялото е полупрозрачно, за да се виждат органите вътре.
// Тялото е по оста x (главата е към +x), центърът на тялото е на височина g.userData.cy.
export function glassMammal({ color = 0xd7ccc8, r = 0.45, len = 1.3, legLen = 0.7, headR = 0.34 } = {}) {
  const g = quadruped({ color, r, len, legLen, headR, ears: 'short' });
  const mats = new Set();
  g.traverse((o) => { if (o.isMesh && o.material) mats.add(o.material); });
  mats.forEach((m) => { m.transparent = true; m.opacity = 0.32; m.depthWrite = false; });
  g.userData.cy = legLen + r * 0.9;
  g.userData.mats = [...mats];
  return g;
}
