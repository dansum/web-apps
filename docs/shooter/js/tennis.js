// ТЕНИС — втората мини игра. Ти си отдолу, наблизо; противникът е горе, далече.
// Играчът тича сам (като в Wii тениса) — ти само замахваш с ръка.
// Топката отдясно → замах отдясно наляво (←). Топката отляво → отляво надясно (→).
import { sfx } from './audio.js';

export const LEVELS = {
  easy: {
    name: 'ЛЕСНО', window: 0.4, speed: 0.8, angle: 65, retry: true, spread: 1.8, outRisk: false, faults: false, run: 12,
    ai: { err: 0.26, speed: 3.2, T: [1.55, 1.85], aim: 0.45 },
  },
  medium: {
    name: 'СРЕДНО', window: 0.24, speed: 1.2, angle: 45, retry: true, spread: 3.1, outRisk: false, faults: true, run: 10,
    ai: { err: 0.15, speed: 4.2, T: [1.25, 1.55], aim: 0.75 },
  },
  hard: {
    name: 'ТРУДНО', window: 0.13, speed: 1.7, angle: 28, retry: false, spread: 3.7, outRisk: true, faults: true, run: 9,
    ai: { err: 0.08, speed: 5.4, T: [1.0, 1.3], aim: 1 },
  },
};

const HW = 4.115;       // половин ширина на корта за сингъл
const DHW = 5.485;      // за двойки — само за рисуване
const LEN = 23.77;
const NET = LEN / 2;
const SVC = 6.4;
const NET_H = 0.914;
const G = 9.8;
const ME_Z = -0.4;
const AI_Z = LEN + 0.4;
const REACH = 0.75;
const GAMES_TO_WIN = 3;
const BALL_R = 0.11;    // по-голяма от истинската, за да се вижда

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Засича бърз замах от поредица позиции (0..1 от кадъра).
class Swing {
  constructor() { this.h = []; this.active = null; this.cool = 0; }
  reset() { this.h = []; this.active = null; }
  push(t, x, y) {
    const last = this.h[this.h.length - 1];
    if (last && t - last.t > 0.15) this.reset();
    if (last && t <= last.t) return;
    this.h.push({ t, x, y });
    while (this.h.length && t - this.h[0].t > 0.6) this.h.shift();
  }
  update(now) {
    const h = this.h;
    if (h.length < 3) return null;
    const a = h[h.length - 1];
    let b = h[0];
    for (let i = h.length - 2; i >= 0; i--) { if (a.t - h[i].t >= 0.08) { b = h[i]; break; } }
    const dt = a.t - b.t;
    if (dt < 0.03) return null;
    const vx = (a.x - b.x) / dt, vy = (a.y - b.y) / dt;
    const sp = now - a.t > 0.12 ? 0 : Math.hypot(vx, vy);
    this.speedNow = sp;
    if (now < this.cool) return null;
    if (!this.active) {
      if (sp > 0.55) this.active = { speed: sp, vx, vy, t: a.t, start: a.t };
      return null;
    }
    // смяна на посоката (замах назад → удар) приключва замаха веднага
    const reversed = vx * this.active.vx + vy * this.active.vy < 0;
    if (!reversed && sp > this.active.speed) Object.assign(this.active, { speed: sp, vx, vy, t: a.t });
    if (reversed || sp < this.active.speed * 0.65 || a.t - this.active.start > 0.35) {
      const ev = this.active;
      this.active = null;
      this.cool = now + 0.06;
      return ev;
    }
    return null;
  }
}

export function createTennis({ ctx, view, hand, onEnd }) {
  const T = {
    level: LEVELS.easy, levelKey: 'easy', input: 'mouse', t: 0, state: 'idle',
    me: null, ai: null, ball: null, score: null, server: 'me', faults: 0,
    msgs: [], trail: [], swing: new Swing(), lastFed: 0, stateT: 0, cheer: 0, pointMsg: null,
    toss: null, feedback: null, timers: [],
  };
  const cam = { z: -10, h: 5.2, f: 800, hy: 150 };

  function layout() {
    const { W, H } = view;
    const portrait = H > W;
    cam.h = portrait ? 9 : 5.2;
    cam.f = Math.min(H * 1.6, W * 0.87);
    cam.hy = H * (portrait ? 0.72 : 0.8) - cam.h * cam.f / (0 - cam.z);
  }
  function proj(x, y, z) {
    const d = Math.max(0.5, z - cam.z);
    const s = cam.f / d;
    return { sx: view.W / 2 + x * s, sy: cam.hy + (cam.h - y) * s, s };
  }

  // ---------- мач ----------
  function start(levelKey, input) {
    T.levelKey = levelKey;
    T.level = LEVELS[levelKey];
    T.input = input;
    T.t = 0;
    T.me = { x: 0, z: ME_Z, run: 0, swingT: 1, swingDir: -1, prep: 0, tx: 0, name: 'ТИ', shirt: '#e53935' };
    T.ai = { x: 0, z: AI_Z, run: 0, swingT: 1, swingDir: 1, prep: 0, tx: 0, name: 'ДИНО', shirt: '#1e88e5' };
    T.score = { me: 0, ai: 0, gMe: 0, gAi: 0 };
    T.server = 'me';
    T.faults = 0;
    T.timers = [];
    T.msgs = [];
    T.stats = { hits: 0, swings: 0, winners: 0 };
    T.swing.reset();
    layout();
    newPoint();
  }

  function newPoint() {
    T.ball = null;
    T.faults = T.faults || 0;
    const pts = T.score.me + T.score.ai;
    const deuce = pts % 2 === 0;
    T.me.x = T.server === 'me' ? (deuce ? 1.3 : -1.3) : (deuce ? 2.2 : -2.2);
    T.ai.x = T.server === 'ai' ? (deuce ? -1.3 : 1.3) : (deuce ? -2.2 : 2.2);
    T.me.tx = T.me.x; T.ai.tx = T.ai.x;
    T.me.z = T.me.tz = ME_Z; T.ai.z = T.ai.tz = AI_Z;
    T.state = 'serve';
    T.toss = { t: -0.6, who: T.server };
    T.feedback = null;
  }

  // Изстрелва топката така, че да падне в (tx, tz) след време dur.
  function launch(from, tx, tz, dur, hitter, opts = {}) {
    let d = dur;
    const mk = () => ({
      x: from.x, y: from.y, z: from.z,
      vx: (tx - from.x) / d, vz: (tz - from.z) / d, vy: (0 - from.y + 0.5 * G * d * d) / d,
    });
    let b = mk();
    if (!opts.netErr) {
      // вдигни дъгата, докато топката мине над мрежата
      for (let i = 0; i < 30; i++) {
        const tn = (NET - b.z) / b.vz;
        if (tn <= 0 || tn >= d) break;
        const yn = b.y + b.vy * tn - 0.5 * G * tn * tn;
        if (yn > NET_H + 0.3) break;
        d += 0.05; b = mk();
      }
    }
    T.ball = Object.assign(b, {
      hitter, bounces: 0, serve: !!opts.serve, netErr: !!opts.netErr, dead: false, side: 0, contact: null,
      trail: [], landX: tx, landZ: tz, hitT: T.t,
    });
    const recv = hitter === 'me' ? 'ai' : 'me';
    T.ball.contact = predictContact(T.ball, recv);
    T[hitter].tz = hitter === 'me' ? ME_Z : AI_Z;
    if (T.ball.contact) T[recv].tz = T.ball.contact.z;
    if (recv === 'me' && T.ball.contact) {
      T.ball.side = T.ball.contact.x >= T.me.x ? 1 : -1;
      if (Math.abs(T.ball.contact.x - T.me.x) < 0.3) T.ball.side = Math.random() < 0.5 ? 1 : -1;
      T.me.locked = false;
      T.me.tries = 0;
      T.pendingWrong = null;
    }
    if (recv === 'ai' && T.ball.contact) T.ball.side = T.ball.contact.x >= T.ai.x ? 1 : -1;
  }

  // Симулира топката напред: къде и кога ще стигне линията за удар на получателя.
  function predictContact(b0, recv) {
    const b = { x: b0.x, y: b0.y, z: b0.z, vx: b0.vx, vy: b0.vy, vz: b0.vz, bounces: b0.bounces };
    const pz = recv === 'me' ? ME_Z : AI_Z;
    const dt = 1 / 240;
    let peak = null;
    for (let t = 0; t < 5; t += dt) {
      const pzPrev = b.z;
      b.vy -= G * dt;
      b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
      if (b.y <= 0 && b.vy < 0) {
        if (b.bounces === 0) {
          const inside = landedIn(b.x, b.z, b0.hitter, b0.serve);
          if (!inside || b0.netErr) return null;
        } else {
          // къса топка — отскача втори път преди линията: играчът тича напред
          return peak ? { t: T.t + peak.t, x: peak.x, y: Math.max(0.3, peak.y), z: peak.z } : null;
        }
        b.y = 0; b.vy = -b.vy * 0.68; b.vx *= 0.85; b.vz *= 0.85; b.bounces++;
      }
      if (b.bounces >= 1 && (!peak || b.y > peak.y)) peak = { t, x: b.x, y: b.y, z: b.z };
      if (b.bounces >= 1 && (pzPrev - pz) * (b.z - pz) <= 0) {
        return { t: T.t + t, x: b.x, y: Math.max(0.2, b.y), z: pz };
      }
    }
    return null;
  }

  function landedIn(x, z, hitter, serve) {
    if (Math.abs(x) > HW) return false;
    if (hitter === 'me') return serve ? (z >= NET && z <= NET + SVC) : (z >= NET && z <= LEN);
    return serve ? (z <= NET && z >= NET - SVC) : (z <= NET && z >= 0);
  }

  // ---------- замах ----------
  function onSwing(ev, source) {
    if (T.state !== 'serve' && T.state !== 'rally') return;
    const now = performance.now() / 1000;
    const gameT = T.t - (now - ev.t) - (source === 'hand' ? 0.05 : 0);
    T.me.swingT = 0;
    T.me.swingDir = ev.vx < 0 ? -1 : 1;
    T.stats.swings++;
    sfx.whoosh();
    const L = T.level;

    if (T.state === 'serve' && T.server === 'me' && T.toss && T.toss.t > 0) {
      const off = gameT - T.toss.startT - TOSS_APEX;
      const win = L.window * 1.3;
      if (Math.abs(off) > win * 2.5 && T.toss.t < TOSS_APEX - win) return;  // замах много преди подхвърлянето — пропусни
      if (ev.speed < L.speed * 0.8 && T.levelKey !== 'easy') { say('ПО-СИЛНО!', '#ffcf33'); return; }
      const good = Math.abs(off) <= win || !L.faults;
      serveMe(ev, good, off);
      return;
    }
    const b = T.ball;
    if (T.state !== 'rally' || !b || b.hitter !== 'ai' || b.dead) return;
    if (!b.contact) return;
    if (T.me.locked) return;
    const off = gameT - b.contact.t;
    if (off < -0.8) return; // топката още е далече — това не е удар
    const fail = msg => {
      say(msg, '#ffcf33');
      T.me.tries++;
      if (!L.retry) T.me.locked = true;
    };
    if (Math.abs(off) > L.window) { fail(off < 0 ? 'ТВЪРДЕ РАНО' : 'ТВЪРДЕ КЪСНО'); return; }
    if (ev.speed < L.speed) { fail('ПО-БЪРЗО!'); return; }
    const need = b.side > 0 ? -1 : 1;
    if (Math.sign(ev.vx) !== need) {
      // може да е замах назад преди удара — наказваме само ако не последва удар в правилната посока
      if (!T.pendingWrong) T.pendingWrong = { at: T.t, msg: need < 0 ? 'ГРЕШНА ПОСОКА — МАХНИ ←' : 'ГРЕШНА ПОСОКА — МАХНИ →', fail };
      return;
    }
    T.pendingWrong = null;
    const ang = Math.atan2(Math.abs(ev.vy), Math.abs(ev.vx)) * 180 / Math.PI;
    if (ang > L.angle) { fail('ПО-ХОРИЗОНТАЛНО'); return; }
    hitMe(ev, off / L.window, need);
  }

  function hitMe(ev, off, dir) {
    const L = T.level;
    const b = T.ball;
    const c = b.contact;
    const power = clamp((ev.speed / L.speed - 1) / 1.5, 0, 1);
    let tx = -dir * off * L.spread + rnd(-0.4, 0.4);
    // перфектният удар отива към празната страна на корта
    if (Math.abs(off) < 0.25) tx += -Math.sign(T.ai.x || 1) * L.spread * 0.6;
    if (!L.outRisk) tx = clamp(tx, -HW + 0.4, HW - 0.4);
    else if (Math.abs(off) > 0.85) tx *= 1.35;
    const lob = ev.vy < -0.7 * Math.abs(ev.vx);
    let tz = clamp(rnd(17.5, 21.5) + power * 1.5, NET + 2, LEN - 0.3);
    if (L.outRisk && power > 0.9 && Math.random() < 0.3) tz = LEN + 0.8;
    const dur = (lob ? 0.5 : 0) + 1.5 - power * (T.levelKey === 'hard' ? 0.6 : 0.45);
    launch({ x: c.x, y: c.y, z: c.z + 0.2 }, tx, tz, dur, 'me');
    T.stats.hits++;
    sfx.pok(power);
    const q = Math.abs(off);
    say(q < 0.25 ? 'ПЕРФЕКТНО!' : q < 0.6 ? 'ДОБРЕ!' : off < 0 ? 'РАНИЧКО' : 'КЪСНИЧКО', q < 0.25 ? '#7ddc3a' : '#ffffff');
  }

  const TOSS_APEX = 0.65;
  function serveMe(ev, good, off) {
    const b = { x: T.me.x + 0.25, y: tossY(T.toss.t), z: ME_Z + 0.2 };
    const side = T.me.x > 0 ? -1 : 1;
    const power = clamp((ev.speed / T.level.speed - 1) / 1.5, 0, 1);
    T.state = 'rally';
    T.toss = null;
    if (good) {
      launch(b, side * rnd(0.6, HW - 0.5), rnd(NET + 3, NET + SVC - 0.4), 1.1 - power * 0.3, 'me', { serve: true });
      sfx.pok(power);
    } else {
      launch(b, side * rnd(0.5, 3), NET + 0.5, 0.7, 'me', { serve: true, netErr: true });
      sfx.pok(0.2);
      say(off < 0 ? 'ТВЪРДЕ РАНО' : 'ТВЪРДЕ КЪСНО', '#ffcf33');
    }
  }

  function serveAi() {
    const side = T.ai.x < 0 ? 1 : -1;
    const fault = Math.random() < (T.faults ? 0.03 : 0.1);
    const b = { x: T.ai.x - 0.25, y: 2.6, z: AI_Z - 0.2 };
    T.state = 'rally';
    T.toss = null;
    T.ai.swingT = 0; T.ai.swingDir = side;
    if (fault) launch(b, side * rnd(0.5, 3), NET - 0.4, 0.8, 'ai', { serve: true, netErr: true });
    else launch(b, side * rnd(0.7, HW - 0.6), rnd(NET - SVC + 0.4, NET - 2.5), rnd(1.05, 1.3) * (T.levelKey === 'easy' ? 1.25 : 1), 'ai', { serve: true });
    sfx.pok(0.6);
  }

  function hitAi() {
    const L = T.level.ai;
    const b = T.ball;
    const c = b.contact;
    T.ai.swingT = 0;
    T.ai.swingDir = b.side > 0 ? -1 : 1;
    const from = { x: c.x, y: c.y, z: c.z - 0.2 };
    const dur = rnd(L.T[0], L.T[1]);
    sfx.pok(0.5);
    if (Math.random() < L.err) {
      const kind = Math.random();
      if (kind < 0.4) launch(from, rnd(-3, 3), NET - 0.5, dur * 0.6, 'ai', { netErr: true });
      else if (kind < 0.7) launch(from, rnd(-3, 3), -1.5, dur, 'ai');
      else launch(from, (Math.random() < 0.5 ? -1 : 1) * rnd(4.6, 5.5), rnd(3, 8), dur, 'ai');
      return;
    }
    let tx = rnd(-HW + 0.5, HW - 0.5) * L.aim;
    if (Math.random() < L.aim * 0.5) tx = -Math.sign(T.me.x || 1) * rnd(2, HW - 0.4);
    const tz = rnd(1.2, 7);
    launch(from, tx, tz, dur, 'ai');
  }

  // ---------- точки ----------
  function pointTo(who, why) {
    if (T.state === 'point') return;
    T.state = 'point';
    T.stateT = 0;
    T.faults = 0;
    const s = T.score;
    s[who]++;
    const other = who === 'me' ? 'ai' : 'me';
    let game = false;
    if (s[who] >= 4 && s[who] - s[other] >= 2) {
      game = true;
      if (who === 'me') s.gMe++; else s.gAi++;
      s.me = 0; s.ai = 0;
      T.server = T.server === 'me' ? 'ai' : 'me';
    }
    const matchOver = s.gMe >= GAMES_TO_WIN || s.gAi >= GAMES_TO_WIN;
    T.pointMsg = {
      title: why,
      sub: matchOver ? (s.gMe > s.gAi ? 'ПЕЧЕЛИШ МАЧА!' : 'ДИНО ПЕЧЕЛИ МАЧА') : game ? (who === 'me' ? 'ГЕЙМ ЗА ТЕБ!' : 'ГЕЙМ ЗА ДИНО') : (who === 'me' ? 'ТОЧКА ЗА ТЕБ' : 'ТОЧКА ЗА ДИНО'),
      good: who === 'me', match: matchOver,
    };
    if (who === 'me') { sfx.cheer(); T.cheer = 1.5; } else sfx.aww();
  }

  function fault(who) {
    if (!T.level.faults && who === 'me') {
      say('ОПИТАЙ ПАК', '#ffcf33');
      T.stateT = 0;
      later(0.9, () => { if (T.state === 'rally' && T.ball && T.ball.serve) newPoint(); });
      T.ball.dead = true;
      return;
    }
    T.faults++;
    if (T.faults >= 2) { pointTo(who === 'me' ? 'ai' : 'me', 'ДВОЙНА ГРЕШКА'); return; }
    say('ГРЕШКА — ВТОРИ СЕРВИС', '#ffcf33');
    T.ball.dead = true;
    later(1.0, () => {
      if (T.state !== 'rally') return;
      T.state = 'serve';
      T.ball = null;
      T.toss = { t: -0.6, who: T.server };
    });
  }

  // таймери в игрово време — спират при пауза
  function later(sec, fn) { T.timers.push({ at: T.t + sec, fn }); }

  function say(text, col) {
    T.feedback = { text, col, t: 0 };
  }

  function scoreText() {
    const s = T.score;
    const N = ['0', '15', '30', '40'];
    if (s.me >= 3 && s.ai >= 3) {
      if (s.me === s.ai) return ['РАВЕНСТВО', ''];
      return s.me > s.ai ? ['ПРЕДИМСТВО', ''] : ['', 'ПРЕДИМСТВО'];
    }
    return [N[Math.min(3, s.me)], N[Math.min(3, s.ai)]];
  }

  // ---------- вход ----------
  function feedPointer(nx, ny) {
    if (T.input === 'hand') return;
    T.swing.push(performance.now() / 1000, nx, ny);
    T.trail.push({ t: performance.now() / 1000, x: nx, y: ny });
  }
  function key(e) {
    if (T.state !== 'serve' && T.state !== 'rally') return false;
    const now = performance.now() / 1000;
    const k = e.key;
    let vx = 0;
    if (k === 'ArrowLeft') vx = -1;
    else if (k === 'ArrowRight') vx = 1;
    else if (k === ' ' || k === 'ArrowUp') vx = T.ball && T.ball.side > 0 ? -1 : 1;
    else return false;
    onSwing({ t: now, vx: vx * T.level.speed * 1.8, vy: k === 'ArrowUp' ? -T.level.speed * 2 : 0, speed: T.level.speed * 1.8 }, 'key');
    return true;
  }

  function readHand() {
    const tr = hand.tracks.find(t => t.slot === 0);
    if (!tr) return;
    for (const p of tr.palm) {
      if (p.t <= T.lastFed) continue;
      T.lastFed = p.t;
      T.swing.push(p.t, p.x, p.y);
      T.trail.push({ t: p.t, x: p.x, y: p.y });
    }
  }

  // ---------- обновяване ----------
  function tossY(t) {
    const k = (t - TOSS_APEX) / TOSS_APEX;
    return 1.1 + 1.9 * (1 - k * k);
  }

  function update(dt) {
    layout();
    T.t += dt;
    const due = T.timers.filter(x => T.t >= x.at);
    if (due.length) { T.timers = T.timers.filter(x => T.t < x.at); due.forEach(x => x.fn()); }
    const now = performance.now() / 1000;
    if (T.input === 'hand') readHand();
    const ev = T.swing.update(now);
    if (ev) onSwing(ev, T.input);
    T.trail = T.trail.filter(p => now - p.t < 0.35);
    if (T.feedback) { T.feedback.t += dt; if (T.feedback.t > 1.3) T.feedback = null; }
    if (T.pendingWrong && T.t - T.pendingWrong.at > 0.4) {
      const pw = T.pendingWrong;
      T.pendingWrong = null;
      if (T.state === 'rally' && T.ball && T.ball.hitter === 'ai' && !T.ball.dead) pw.fail(pw.msg);
    }
    T.cheer = Math.max(0, T.cheer - dt);
    for (const P of [T.me, T.ai]) {
      P.swingT = Math.min(1, P.swingT + dt / 0.3);
      const dx = P.tx - P.x;
      const sp = (P === T.me ? T.level.run : T.level.ai.speed) * dt;
      const step = clamp(dx, -sp, sp);
      P.x += step;
      const dz = clamp(P.tz - P.z, -sp, sp);
      P.z += dz;
      P.run += (Math.abs(step) + Math.abs(dz)) * 6;
    }

    if (T.state === 'serve') {
      const tz = T.toss;
      tz.t += dt;
      if (tz.startT === undefined || tz.t < 0) tz.startT = T.t - tz.t;
      if (tz.who === 'ai' && tz.t > TOSS_APEX + 0.05) serveAi();
      else if (tz.who === 'me' && tz.t > TOSS_APEX * 2) {
        // топката падна обратно — подхвърли пак
        tz.t = -0.4;
        tz.startT = undefined;
      }
    }

    if (T.state === 'rally' && T.ball && !T.ball.dead) stepBall(dt);
    else if (T.ball && T.ball.dead) stepLoose(dt);

    // автоматично тичане към топката
    const b = T.ball;
    if (T.state === 'rally' && b && !b.dead && b.contact) {
      if (b.hitter === 'ai') {
        T.me.tx = clamp(b.contact.x - b.side * REACH, -DHW - 1, DHW + 1);
        T.me.prep = b.side;
      } else if (T.t - b.hitT > 0.25) {
        // Дино реагира с малко закъснение
        T.ai.tx = clamp(b.contact.x - b.side * REACH, -DHW - 1, DHW + 1);
        T.me.tx = T.me.x * 0.97;
      }
    }
    if (T.state === 'rally' && b && b.hitter === 'me' && !b.contact && b.bounces === 0) T.ai.tx = clamp(b.landX, -DHW, DHW);

    if (T.state === 'point') {
      T.stateT += dt;
      if (T.stateT > 2.2) {
        if (T.pointMsg.match) { T.state = 'over'; onEnd(T.score, T.stats); }
        else newPoint();
      }
    }
  }

  function stepLoose(dt) {
    const b = T.ball;
    const n = 4;
    for (let i = 0; i < n; i++) {
      const h = dt / n;
      b.vy -= G * h;
      b.x += b.vx * h; b.y += b.vy * h; b.z += b.vz * h;
      if (b.y < 0) { b.y = 0; b.vy = Math.abs(b.vy) * 0.5; b.vx *= 0.7; b.vz *= 0.7; }
    }
  }

  function stepBall(dt) {
    const b = T.ball;
    const n = 6;
    for (let i = 0; i < n && !b.dead; i++) {
      const h = dt / n;
      const zPrev = b.z;
      b.vy -= G * h;
      b.x += b.vx * h; b.y += b.vy * h; b.z += b.vz * h;
      // мрежата
      if ((zPrev - NET) * (b.z - NET) <= 0 && zPrev !== NET && (b.y < NET_H || b.netErr)) {
        b.z = NET + (zPrev < NET ? -0.1 : 0.1);
        b.vz = -b.vz * 0.1; b.vx *= 0.3; b.y = Math.min(b.y, NET_H - 0.1);
        b.dead = true;
        sfx.net();
        if (b.serve) { say('МРЕЖА!', '#ffcf33'); fault(b.hitter); }
        else pointTo(b.hitter === 'me' ? 'ai' : 'me', 'В МРЕЖАТА');
        return;
      }
      // отскок
      if (b.y <= 0 && b.vy < 0) {
        b.y = 0;
        sfx.bounce();
        T.bounceFx = { x: b.x, z: b.z, t: 0 };
        if (b.bounces === 0) {
          if (!landedIn(b.x, b.z, b.hitter, b.serve)) {
            b.dead = true;
            b.vy = -b.vy * 0.6;
            if (b.serve) { say('АУТ!', '#ff6b6b'); fault(b.hitter); }
            else pointTo(b.hitter === 'me' ? 'ai' : 'me', 'АУТ!');
            return;
          }
          b.vy = -b.vy * 0.68; b.vx *= 0.85; b.vz *= 0.85; b.bounces = 1;
          b.contact = predictContact(b, b.hitter === 'me' ? 'ai' : 'me') || b.contact;
        } else {
          b.dead = true;
          const recv = b.hitter === 'me' ? 'ai' : 'me';
          pointTo(b.hitter, b.serve && b.hitter === 'me' ? 'ЕЙС!' : recv === 'me' ? 'ПРОПУСНА ТОПКАТА' : 'ПЕЧЕЛИВШ УДАР!');
          if (b.hitter === 'me') T.stats.winners++;
          return;
        }
      }
    }
    // противникът удря, когато топката стигне до него
    if (b.hitter === 'me' && b.contact && T.t >= b.contact.t) {
      if (Math.abs(T.ai.x + b.side * REACH - b.contact.x) < 1.3) { hitAi(); }
      else { b.contact = null; }
    }
    // пропуснат удар от играча
    if (b.hitter === 'ai' && b.contact && T.t > b.contact.t + T.level.window + 0.25 && !b.missed) {
      b.missed = true;
      T.me.locked = true;
      if (!T.me.tries) say('ЗАМАХНИ!', '#ffcf33');
    }
    if (b.z < -6 || b.z > LEN + 6 || Math.abs(b.x) > 12) {
      b.dead = true;
      if (b.hitter === 'me') T.stats.winners++;
      pointTo(b.hitter, b.hitter === 'me' ? 'ПЕЧЕЛИВШ УДАР!' : 'ПРОПУСНА ТОПКАТА');
    }
  }

  // ---------- рисуване ----------
  function render() {
    const { W, H } = view;
    layout();
    // небе
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#6ec3f4'); g.addColorStop(0.5, '#bfe6fb'); g.addColorStop(1, '#bfe6fb');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    drawStands();
    // земя около корта
    const far = proj(0, 0, LEN + 8), near = proj(0, 0, -7);
    ctx.fillStyle = '#3f8f3a';
    ctx.fillRect(0, far.sy, W, H - far.sy);
    quad(-14, -7, 14, LEN + 8, '#4c9a3f');
    // ивици на тревата
    for (let i = 0; i < 12; i++) {
      const z0 = -4 + i * 2.6;
      if (i % 2) quad(-DHW - 1.5, z0, DHW + 1.5, z0 + 2.6, 'rgba(255,255,255,0.05)');
    }
    quad(-DHW - 1.5, -3, DHW + 1.5, LEN + 3, 'rgba(90,170,80,0.5)');
    drawLines();
    void near;

    // сенки и отскок
    const b = T.ball;
    if (T.bounceFx) {
      T.bounceFx.t += 1 / 60;
      const q = proj(T.bounceFx.x, 0, T.bounceFx.z);
      const a = 1 - T.bounceFx.t / 0.5;
      if (a > 0) {
        ctx.strokeStyle = `rgba(255,255,255,${a})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(q.sx, q.sy, q.s * (0.2 + T.bounceFx.t), q.s * (0.06 + T.bounceFx.t * 0.3), 0, 0, Math.PI * 2); ctx.stroke();
      }
    }
    const ballPos = currentBall();
    if (ballPos) {
      const q = proj(ballPos.x, 0, ballPos.z);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(q.sx, q.sy, Math.max(2, q.s * BALL_R * 1.2), Math.max(1, q.s * BALL_R * 0.45), 0, 0, Math.PI * 2); ctx.fill();
    }
    // обекти отзад напред
    const items = [
      { z: T.ai.z, d: () => drawPerson(T.ai, 'front') },
      { z: NET, d: drawNet },
      { z: T.me.z - 0.01, d: () => drawPerson(T.me, 'back') },
    ];
    if (ballPos) items.push({ z: ballPos.z, d: () => drawBall(ballPos) });
    items.sort((a, c) => c.z - a.z);
    for (const it of items) it.d();

    drawCue();
    drawTrail();
    drawHud();
    if (b) void b;
  }

  function currentBall() {
    if (T.ball) return T.ball;
    if (T.state === 'serve' && T.toss && T.toss.t > 0) {
      const P = T.toss.who === 'me' ? T.me : T.ai;
      return { x: P.x + (T.toss.who === 'me' ? 0.25 : -0.25), y: tossY(T.toss.t), z: P.z + (T.toss.who === 'me' ? 0.2 : -0.2) };
    }
    return null;
  }

  function quad(x0, z0, x1, z1, col) {
    const a = proj(x0, 0, z0), b = proj(x1, 0, z0), c = proj(x1, 0, z1), d = proj(x0, 0, z1);
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.lineTo(c.sx, c.sy); ctx.lineTo(d.sx, d.sy); ctx.closePath(); ctx.fill();
  }
  function line(x0, z0, x1, z1) {
    const a = proj(x0, 0, z0), b = proj(x1, 0, z1);
    ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
  }
  function drawLines() {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.5, cam.f / 400);
    ctx.lineCap = 'round';
    line(-DHW, 0, DHW, 0); line(-DHW, LEN, DHW, LEN);
    line(-DHW, 0, -DHW, LEN); line(DHW, 0, DHW, LEN);
    line(-HW, 0, -HW, LEN); line(HW, 0, HW, LEN);
    line(-HW, NET - SVC, HW, NET - SVC); line(-HW, NET + SVC, HW, NET + SVC);
    line(0, NET - SVC, 0, NET + SVC);
    line(0, 0, 0, 0.3); line(0, LEN, 0, LEN - 0.3);
  }
  function drawNet() {
    const l0 = proj(-DHW - 0.4, 0, NET), r0 = proj(DHW + 0.4, 0, NET);
    const l1 = proj(-DHW - 0.4, 1.07, NET), r1 = proj(DHW + 0.4, 1.07, NET);
    const c1 = proj(0, NET_H, NET);
    ctx.fillStyle = 'rgba(20,20,20,0.45)';
    ctx.beginPath(); ctx.moveTo(l0.sx, l0.sy); ctx.lineTo(r0.sx, r0.sy); ctx.lineTo(r1.sx, r1.sy); ctx.lineTo(c1.sx, c1.sy); ctx.lineTo(l1.sx, l1.sy); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    for (let x = -DHW; x <= DHW; x += 0.5) {
      const a = proj(x, 0, NET), b2 = proj(x, 1, NET);
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b2.sx, b2.sy); ctx.stroke();
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(2, cam.f / 300);
    ctx.beginPath(); ctx.moveTo(l1.sx, l1.sy); ctx.lineTo(c1.sx, c1.sy); ctx.lineTo(r1.sx, r1.sy); ctx.stroke();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = Math.max(3, cam.f / 200);
    ctx.beginPath(); ctx.moveTo(l0.sx, l0.sy); ctx.lineTo(l1.sx, l1.sy); ctx.moveTo(r0.sx, r0.sy); ctx.lineTo(r1.sx, r1.sy); ctx.stroke();
  }

  function drawStands() {
    const { W } = view;
    const top = proj(0, 6, LEN + 8).sy;
    const bottom = proj(0, 0, LEN + 8).sy;
    ctx.fillStyle = '#5a6b86';
    ctx.fillRect(0, top, W, bottom - top);
    ctx.fillStyle = '#2f4a7a';
    ctx.fillRect(0, bottom - (bottom - top) * 0.18, W, (bottom - top) * 0.18);
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.max(9, (bottom - top) * 0.1)}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('ДИНО ОПЪН', W / 2, bottom - (bottom - top) * 0.09);
    const rows = 5;
    const rh = (bottom - top) * 0.8 / rows;
    const cols = ['#ffcf33', '#ff6b6b', '#7ddc3a', '#ffffff', '#39b6ff', '#ff9f1a', '#c38bff'];
    for (let r = 0; r < rows; r++) {
      const y = top + rh * (r + 0.6);
      const sz = rh * 0.32;
      for (let x = (r % 2) * sz * 1.4; x < W; x += sz * 2.8) {
        const k = Math.floor(x * 7 + r * 13) % cols.length;
        const jump = T.cheer > 0 ? Math.abs(Math.sin(T.t * 14 + x)) * rh * 0.3 * Math.min(1, T.cheer) : 0;
        ctx.fillStyle = cols[k];
        ctx.fillRect(x - sz * 0.7, y - jump, sz * 1.4, rh * 0.5);
        ctx.fillStyle = '#f2c9a0';
        ctx.beginPath(); ctx.arc(x, y - sz * 0.6 - jump, sz * 0.55, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function drawBall(p) {
    const q = proj(p.x, p.y, p.z);
    const r = Math.max(4, q.s * BALL_R);
    ctx.fillStyle = '#e6ff3a';
    ctx.beginPath(); ctx.arc(q.sx, q.sy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.arc(q.sx - r * 0.5, q.sy, r * 0.7, -0.9, 0.9); ctx.stroke();
  }

  function drawPerson(P, facing) {
    const k = facing === 'front' ? 1.45 : 1;
    const q = proj(P.x, 0, P.z);
    const s = q.s * k;
    ctx.save();
    ctx.translate(q.sx, q.sy);
    ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(0, 0, 0.45, 0.1, 0, 0, Math.PI * 2); ctx.fill();
    const run = Math.sin(P.run);
    // крака
    ctx.fillStyle = '#f2c9a0';
    ctx.fillRect(-0.18, -0.85, 0.12, 0.8 + run * 0.05);
    ctx.fillRect(0.06, -0.85, 0.12, 0.8 - run * 0.05);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-0.22, -0.08 + run * 0.05, 0.18, 0.08);
    ctx.fillRect(0.04, -0.08 - run * 0.05, 0.18, 0.08);
    // шорти и фланелка
    ctx.fillStyle = '#f4f4f4';
    roundRect(-0.22, -1.0, 0.44, 0.26, 0.05); ctx.fill();
    ctx.fillStyle = P.shirt;
    roundRect(-0.25, -1.48, 0.5, 0.56, 0.12); ctx.fill();
    // ракета и ръка
    const holdSide = facing === 'back' ? 1 : -1;
    const sw = P.swingT;
    let hx, hy, ang;
    if (sw < 1) {
      // замах: ръката минава от едната страна към другата
      const from = -P.swingDir, e = sw * sw * (3 - 2 * sw);
      hx = (from + (P.swingDir - from) * e) * 0.6;
      hy = -1.05 - Math.sin(e * Math.PI) * 0.2;
      ang = Math.atan2(hy + 1.25, hx) + (facing === 'back' ? 0 : Math.PI) * 0;
    } else {
      const side = P.prep || holdSide;
      hx = side * 0.45; hy = -1.05; ang = side > 0 ? -0.9 : -2.2;
    }
    if (sw < 1) ang = Math.atan2(-0.6, hx * 1.2);
    ctx.strokeStyle = '#f2c9a0';
    ctx.lineWidth = 0.1; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(holdSide * 0.2, -1.35); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-holdSide * 0.2, -1.35); ctx.lineTo(-holdSide * 0.32, -1.0); ctx.stroke();
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(ang);
    ctx.strokeStyle = '#333'; ctx.lineWidth = 0.05;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0.25, 0); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.strokeStyle = facing === 'back' ? '#d32f2f' : '#1565c0';
    ctx.lineWidth = 0.045;
    ctx.beginPath(); ctx.ellipse(0.42, 0, 0.18, 0.13, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
    // глава
    ctx.fillStyle = '#f2c9a0';
    ctx.beginPath(); ctx.arc(0, -1.66, 0.17, 0, Math.PI * 2); ctx.fill();
    if (facing === 'front') {
      // шапка-динозавър
      ctx.fillStyle = '#5cc21f';
      ctx.beginPath(); ctx.arc(0, -1.7, 0.18, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#2d7a0f';
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.moveTo(i * 0.06 - 0.03, -1.85 + Math.abs(i) * 0.03); ctx.lineTo(i * 0.06, -1.95 + Math.abs(i) * 0.03); ctx.lineTo(i * 0.06 + 0.03, -1.85 + Math.abs(i) * 0.03); ctx.fill();
      }
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(-0.06, -1.65, 0.022, 0, Math.PI * 2); ctx.arc(0.06, -1.65, 0.022, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#222'; ctx.lineWidth = 0.02;
      ctx.beginPath(); ctx.arc(0, -1.6, 0.06, 0.2, Math.PI - 0.2); ctx.stroke();
    } else {
      ctx.fillStyle = '#5a3a22';
      ctx.beginPath(); ctx.arc(0, -1.69, 0.175, Math.PI * 0.85, Math.PI * 2.15); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-0.17, -1.76, 0.34, 0.05);
    }
    ctx.restore();
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // Подсказка: от коя страна е топката, накъде да махнеш и лента за момента на удара.
  function drawCue() {
    const { W, H } = view;
    const b = T.ball;
    const small = W < 600;
    if (T.state === 'serve' && T.server === 'me') {
      text('ЗАМАХНИ, КОГАТО ТОПКАТА Е НАЙ-ГОРЕ', W / 2, H * 0.97 - 10, small ? 8 : 12, '#ffffff', 'center');
      if (T.toss && T.toss.t > 0) timingBar(T.toss.t - TOSS_APEX, T.level.window * 1.3);
      return;
    }
    if (T.state !== 'rally' || !b || b.dead || b.hitter !== 'ai' || !b.contact || T.me.locked) return;
    const need = b.side > 0 ? '←' : '→';
    const mq = proj(T.me.x + b.side * REACH, 1.1, T.me.z);
    const pulse = 0.6 + 0.4 * Math.sin(T.t * 10);
    ctx.globalAlpha = pulse;
    arrow(mq.sx + b.side * mq.s * 0.9, mq.sy - mq.s * 0.4, -b.side, Math.max(40, mq.s * 0.9));
    ctx.globalAlpha = 1;
    text(b.side > 0 ? 'ТОПКАТА Е ОТДЯСНО — МАХНИ ←' : 'ТОПКАТА Е ОТЛЯВО — МАХНИ →', W / 2, H * 0.97 - 10, small ? 8 : 12, '#ffffff', 'center');
    timingBar(T.t - b.contact.t, T.level.window);
  }

  function arrow(x, y, dir, len) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    ctx.beginPath();
    ctx.moveTo(-len / 2, -len * 0.12); ctx.lineTo(len * 0.1, -len * 0.12); ctx.lineTo(len * 0.1, -len * 0.3);
    ctx.lineTo(len / 2, 0);
    ctx.lineTo(len * 0.1, len * 0.3); ctx.lineTo(len * 0.1, len * 0.12); ctx.lineTo(-len / 2, len * 0.12);
    ctx.closePath();
    ctx.fillStyle = '#ffe14d';
    ctx.strokeStyle = '#3a2a00';
    ctx.lineWidth = 3;
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function timingBar(off, win) {
    const { W, H } = view;
    const bw = Math.min(W * 0.5, 360), bx = W / 2 - bw / 2, by = H * 0.97 - 40, range = 0.8;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(bx, by, bw, 12);
    const wx = bw * (win / range) / 2;
    ctx.fillStyle = 'rgba(125,220,58,0.85)';
    ctx.fillRect(W / 2 - wx, by, wx * 2, 12);
    const mx = W / 2 + clamp(off / range, -1, 1) * bw / 2;
    ctx.fillStyle = '#fff';
    ctx.fillRect(mx - 3, by - 5, 6, 22);
  }

  function drawTrail() {
    const { W, H } = view;
    const tr = T.trail;
    if (tr.length < 2) return;
    const now = performance.now() / 1000;
    ctx.lineCap = 'round';
    for (let i = 1; i < tr.length; i++) {
      const a = 1 - (now - tr[i].t) / 0.35;
      ctx.strokeStyle = `rgba(255,255,255,${a * 0.8})`;
      ctx.lineWidth = 3 + a * 8;
      ctx.beginPath();
      ctx.moveTo(tr[i - 1].x * W, tr[i - 1].y * H);
      ctx.lineTo(tr[i].x * W, tr[i].y * H);
      ctx.stroke();
    }
  }

  function drawHud() {
    const { W, H } = view;
    const small = W < 600;
    const fs = small ? 9 : 12;
    const [pm, pa] = scoreText();
    const bx = 14, by = 14, bw = small ? 190 : 270, rh = fs + 16;
    ctx.fillStyle = 'rgba(10,20,50,0.8)';
    ctx.fillRect(bx, by, bw, rh * 2 + 8);
    const row = (i, name, g, p, col, serving) => {
      const y = by + 4 + rh * i + rh / 2;
      text(name, bx + 10, y, fs, col, 'left');
      if (serving) { ctx.fillStyle = '#e6ff3a'; ctx.beginPath(); ctx.arc(bx + bw * 0.42, y, fs * 0.35, 0, Math.PI * 2); ctx.fill(); }
      text(String(g), bx + bw * 0.55, y, fs, '#ffe14d', 'center');
      text(p, bx + bw - 10, y, fs, '#ffffff', 'right');
    };
    row(0, 'ТИ', T.score.gMe, pm, '#ff8a80', T.server === 'me');
    row(1, 'ДИНО', T.score.gAi, pa, '#82b1ff', T.server === 'ai');
    text(`${T.level.name} · ДО ${GAMES_TO_WIN} ГЕЙМА`, W - 16, 28, small ? 8 : 10, '#ffffff', 'right');
    if (T.feedback) {
      const a = Math.min(1, (1.3 - T.feedback.t) * 3);
      ctx.globalAlpha = Math.max(0, a);
      text(T.feedback.text, W / 2, H * 0.42 - T.feedback.t * 20, small ? 12 : 20, T.feedback.col, 'center');
      ctx.globalAlpha = 1;
    }
    if (T.state === 'point' && T.pointMsg) {
      const m = T.pointMsg;
      ctx.fillStyle = m.good ? 'rgba(20,90,20,0.6)' : 'rgba(90,20,20,0.6)';
      ctx.fillRect(0, H * 0.24, W, H * 0.16);
      text(m.title, W / 2, H * 0.29, small ? 16 : 30, '#ffe14d', 'center');
      text(m.sub, W / 2, H * 0.36, small ? 10 : 16, '#ffffff', 'center');
    }
    if (T.input === 'hand') {
      const tr = hand.tracks.find(t => t.slot === 0 && t.visible);
      if (!tr) text('НЕ ВИЖДАМ РЪКАТА', W / 2, H * 0.5, small ? 10 : 14, '#ffcf33', 'center');
    }
  }

  function text(s, x, y, size, col, align = 'left') {
    ctx.font = `${size}px "Press Start 2P", monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.fillText(s, x + Math.max(2, size / 8), y + Math.max(2, size / 8));
    ctx.fillStyle = col;
    ctx.fillText(s, x, y);
  }

  return { start, update, render, feedPointer, key, state: T, proj };
}
