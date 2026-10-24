// Малки SVG графики без библиотеки: линии и хоризонтални стълбове,
// с подсказка при посочване. Ползват ги „Дневник на града“ и страницата за учителя.

export const COLORS = {
  s1: '#2a78d6', s2: '#eb6834', // проверени за цветна слепота (validate_palette.js)
  faint: '#c3ccd4', grid: '#e8ecef', axis: '#c9d0d6',
  text: '#1d2b36', muted: '#5d6f7c', surface: '#fcfcfb',
};

const NS = 'http://www.w3.org/2000/svg';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const fmt = v => (v === null || v === undefined || Number.isNaN(v) ? '—' : Math.round(v).toLocaleString('bg-BG'));

function niceTicks(min, max, n = 4) {
  if (min === max) { max = min + 1; }
  const raw = (max - min) / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw);
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 1000) / 1000);
  return ticks;
}

function tooltip(host) {
  const tip = document.createElement('div');
  tip.className = 'viz-tip';
  tip.hidden = true;
  host.appendChild(tip);
  return {
    show(html, x, y) {
      tip.innerHTML = html;
      tip.hidden = false;
      const w = host.clientWidth, tw = tip.offsetWidth;
      tip.style.left = Math.max(0, Math.min(w - tw, x + 12)) + 'px';
      tip.style.top = Math.max(0, y - 10) + 'px';
    },
    hide() { tip.hidden = true; },
  };
}

// series: [{ name, values: [число|null], color?, faint? }] — стойностите са подредени по xLabels.
// Бледите (faint) серии са фон — например всеки ученик, а средното за класа е ярко.
export function lineChart({ title, series, xLabels, unit = '', yMin = null, yMax = null, height = 190 }) {
  const W = 440, H = height, L = 40, R = 84, T = 10, B = 24;
  const strong = series.filter(s => !s.faint), faint = series.filter(s => s.faint);
  const all = series.flatMap(s => s.values).filter(v => v !== null && v !== undefined);
  const lo = yMin ?? Math.min(0, ...all), hi = yMax ?? Math.max(1, ...all);
  const ticks = niceTicks(lo, hi);
  const y0 = ticks[0], y1 = ticks[ticks.length - 1];
  const n = Math.max(1, xLabels.length - 1);
  const X = i => L + (W - L - R) * (xLabels.length === 1 ? 0.5 : i / n);
  const Y = v => T + (H - T - B) * (1 - (v - y0) / (y1 - y0 || 1));

  const path = vals => {
    let d = '', pen = false;
    vals.forEach((v, i) => {
      if (v === null || v === undefined) { pen = false; return; }
      d += `${pen ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`;
      pen = true;
    });
    return d;
  };

  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">`;
  for (const t of ticks) {
    svg += `<line x1="${L}" x2="${W - R}" y1="${Y(t)}" y2="${Y(t)}" stroke="${t === 0 ? COLORS.axis : COLORS.grid}" stroke-width="1"/>`;
    svg += `<text x="${L - 6}" y="${Y(t) + 4}" text-anchor="end" class="viz-axis">${fmt(t)}</text>`;
  }
  const every = Math.max(1, Math.ceil(xLabels.length / 6));
  const lastX = xLabels.length - 1;
  xLabels.forEach((lab, i) => {
    // Последният месец винаги има надпис; съседният пропускаме, за да не се застъпват.
    if ((i % every === 0 && lastX - i >= every * 0.7) || i === lastX) {
      svg += `<text x="${X(i)}" y="${H - 8}" text-anchor="middle" class="viz-axis">${esc(lab)}</text>`;
    }
  });
  faint.forEach((s, k) => {
    svg += `<path data-faint="${k}" d="${path(s.values)}" fill="none" stroke="${COLORS.faint}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>`;
  });
  strong.forEach(s => {
    svg += `<path d="${path(s.values)}" fill="none" stroke="${s.color || COLORS.s1}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
  });
  // Надписи в края на ярките линии, за да не се разчита само на цвета.
  if (strong.length <= 4) {
    const placed = [];
    strong.forEach(s => {
      const last = s.values.map((v, i) => [v, i]).filter(([v]) => v !== null && v !== undefined).pop();
      if (!last) return;
      let y = Y(last[0]) + 4;
      while (placed.some(p => Math.abs(p - y) < 13)) y += 13;
      placed.push(y);
      svg += `<circle cx="${X(last[1])}" cy="${Y(last[0])}" r="4" fill="${s.color || COLORS.s1}" stroke="${COLORS.surface}" stroke-width="2"/>`;
      svg += `<text x="${X(last[1]) + 8}" y="${y}" class="viz-label">${esc(s.name)} ${fmt(last[0])}${unit}</text>`;
    });
  }
  svg += `<g class="viz-hover" visibility="hidden"><line y1="${T}" y2="${H - B}" stroke="${COLORS.muted}" stroke-width="1"/></g>`;
  svg += `<rect x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}" fill="transparent" class="viz-hit"/></svg>`;

  const legend = strong.length >= 2
    ? `<div class="viz-legend">${strong.map(s => `<span><i style="background:${s.color || COLORS.s1}"></i>${esc(s.name)}</span>`).join('')}${faint.length ? `<span><i style="background:${COLORS.faint}"></i>всеки ученик</span>` : ''}</div>`
    : faint.length ? `<div class="viz-legend"><span><i style="background:${strong[0]?.color || COLORS.s1}"></i>${esc(strong[0]?.name || '')}</span><span><i style="background:${COLORS.faint}"></i>всеки ученик</span></div>` : '';

  const el = document.createElement('figure');
  el.className = 'viz';
  el.innerHTML = `<figcaption>${esc(title)}</figcaption>${legend}<div class="viz-plot">${svg}</div>`;
  const plot = el.querySelector('.viz-plot'), svgEl = plot.querySelector('svg');
  const tip = tooltip(plot), hover = svgEl.querySelector('.viz-hover'), cross = hover.querySelector('line');
  let lit = null;

  const move = e => {
    const r = svgEl.getBoundingClientRect(), sx = (e.clientX - r.left) * W / r.width, sy = (e.clientY - r.top) * H / r.height;
    const i = Math.max(0, Math.min(xLabels.length - 1, Math.round((sx - L) / ((W - L - R) / n))));
    cross.setAttribute('x1', X(i)); cross.setAttribute('x2', X(i));
    hover.querySelectorAll('circle').forEach(c => c.remove());
    let html = `<b>${esc(xLabels[i])}</b>`;
    for (const s of strong) {
      const v = s.values[i];
      if (v === null || v === undefined) continue;
      const c = document.createElementNS(NS, 'circle');
      Object.entries({ cx: X(i), cy: Y(v), r: 5, fill: s.color || COLORS.s1, stroke: COLORS.surface, 'stroke-width': 2 }).forEach(([a, b]) => c.setAttribute(a, b));
      hover.appendChild(c);
      html += `<div><i style="background:${s.color || COLORS.s1}"></i>${esc(s.name)}: <b>${fmt(v)}${unit}</b></div>`;
    }
    // Най-близката бледа линия се подчертава и името ѝ се показва.
    if (lit) { lit.setAttribute('stroke', COLORS.faint); lit.setAttribute('stroke-width', '1.5'); lit = null; }
    let best = null;
    faint.forEach((s, k) => {
      const v = s.values[i];
      if (v === null || v === undefined) return;
      const d = Math.abs(Y(v) - sy);
      if (!best || d < best.d) best = { d, k, v, s };
    });
    if (best && best.d < 30) {
      lit = svgEl.querySelector(`[data-faint="${best.k}"]`);
      lit.setAttribute('stroke', COLORS.muted); lit.setAttribute('stroke-width', '2.5');
      svgEl.insertBefore(lit, hover);
      html += `<div><i style="background:${COLORS.muted}"></i>${esc(best.s.name)}: <b>${fmt(best.v)}${unit}</b></div>`;
    }
    hover.setAttribute('visibility', 'visible');
    tip.show(html, (X(i) / W) * r.width, (sy / H) * r.height);
  };
  const leave = () => {
    hover.setAttribute('visibility', 'hidden');
    tip.hide();
    if (lit) { lit.setAttribute('stroke', COLORS.faint); lit.setAttribute('stroke-width', '1.5'); lit = null; }
  };
  const hit = svgEl.querySelector('.viz-hit');
  hit.addEventListener('pointermove', move);
  hit.addEventListener('pointerdown', move);
  hit.addEventListener('pointerleave', leave);
  return el;
}

// bars: [{ label, value, note? }] — хоризонтални стълбове с един цвят.
export function barChart({ title, bars, max = null, unit = '', color = COLORS.s1 }) {
  const top = max ?? Math.max(1, ...bars.map(b => b.value));
  const el = document.createElement('figure');
  el.className = 'viz';
  el.innerHTML = `<figcaption>${esc(title)}</figcaption><div class="viz-bars">${bars.map((b, k) => `
    <div class="viz-row" data-k="${k}">
      <span class="viz-blabel">${esc(b.label)}</span>
      <span class="viz-track"><i style="width:${Math.max(0, Math.min(100, b.value / top * 100))}%;background:${color}"></i></span>
      <span class="viz-bval">${fmt(b.value)}${unit}</span>
    </div>`).join('')}</div>`;
  const wrap = el.querySelector('.viz-bars'), tip = tooltip(wrap);
  el.querySelectorAll('.viz-row').forEach(row => {
    const b = bars[+row.dataset.k];
    if (!b.note) return;
    const show = e => {
      const r = wrap.getBoundingClientRect();
      tip.show(`<b>${esc(b.label)}</b><div>${esc(b.note)}</div>`, e.clientX - r.left, e.clientY - r.top);
    };
    row.addEventListener('pointermove', show);
    row.addEventListener('pointerdown', show);
    row.addEventListener('pointerleave', () => tip.hide());
  });
  return el;
}
