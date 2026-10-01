import { Engine } from './engine.js';
import { createEncoder, encoderSupported } from './encoder.js';
import { Rife } from './rife.js';

const $ = id => document.getElementById(id);
const MAX_SIDE = 4096; // ограничение на H.264 и на повечето видеокарти

const photos = [];  // { file, name, w, h, mean: [r,g,b], lum, thumb }
const timing = {};  // измерени времена по ключ „алгоритъм@ширинаxвисочина“
const rife = new Rife();
let engine = null;
let busy = false;     // създава се видео
let cancelled = false;
let previewJob = 0;
let playing = false;

try {
  engine = new Engine($('view'));
  if (!engine.flowOk) {
    document.querySelector('input[value=flow]').disabled = true;
    document.querySelector('input[value=crossfade]').checked = true;
  }
} catch (e) {
  $('summary').textContent = 'Браузърът не поддържа WebGL2 и приложението не може да работи: ' + e.message;
}

// ---------- Помощни ----------

const nf = (v, d = 0) => v.toLocaleString('bg-BG', { minimumFractionDigits: d, maximumFractionDigits: d });
const even = v => Math.max(2, Math.round(v / 2) * 2);
const sleep = ms => new Promise(r => setTimeout(r, ms));

function fmtTime(ms) {
  const s = Math.max(1, Math.round(ms / 1000));
  if (s < 60) return `${s} сек`;
  const m = Math.floor(s / 60), r = s % 60;
  if (m < 60) return r ? `${m} мин ${r} сек` : `${m} мин`;
  return `${Math.floor(m / 60)} ч ${m % 60} мин`;
}

const algo = () => document.querySelector('input[name=algo]:checked').value;
const settings = () => ({
  algo: algo(),
  inter: Math.max(1, Math.min(120, parseInt($('inter').value, 10) || 1)),
  fps: parseInt($('fps').value, 10),
  hold: Math.max(0, Math.min(300, parseInt($('hold').value, 10) || 0)),
  format: $('format').value,
  quality: $('quality').value,
  equalize: $('equalize').checked,
  ...dims(),
});

// ---------- Снимки ----------

async function analyse(file) {
  const bmp = await createImageBitmap(file);
  const w = bmp.width, h = bmp.height;
  const thumb = document.createElement('canvas');
  const k = Math.min(1, 240 / Math.max(w, h));
  thumb.width = Math.max(1, Math.round(w * k));
  thumb.height = Math.max(1, Math.round(h * k));
  const tc = thumb.getContext('2d');
  tc.imageSmoothingQuality = 'high';
  tc.drawImage(bmp, 0, 0, thumb.width, thumb.height);
  bmp.close();
  // Средният цвят — за изравняване на яркостта.
  const small = document.createElement('canvas');
  small.width = 48; small.height = 36;
  const sc = small.getContext('2d', { willReadFrequently: true });
  sc.drawImage(thumb, 0, 0, 48, 36);
  const d = sc.getImageData(0, 0, 48, 36).data;
  const mean = [0, 0, 0];
  for (let i = 0; i < d.length; i += 4) { mean[0] += d[i]; mean[1] += d[i + 1]; mean[2] += d[i + 2]; }
  const n = d.length / 4;
  for (let c = 0; c < 3; c++) mean[c] = Math.max(1, mean[c] / n) / 255;
  const lum = 0.299 * mean[0] + 0.587 * mean[1] + 0.114 * mean[2];
  return { file, name: file.name, w, h, mean, lum, thumb };
}

async function addFiles(list) {
  const files = [...list].filter(f => f.type.startsWith('image/') || /\.(jpe?g|png|webp|avif|bmp|gif)$/i.test(f.name));
  files.sort((a, b) => a.name.localeCompare(b.name, 'bg', { numeric: true }));
  const failed = [];
  $('photo-count').textContent = `Чета ${files.length} снимки…`;
  $('photo-tools').hidden = false;
  for (const f of files) {
    try { photos.push(await analyse(f)); } catch { failed.push(f.name); }
  }
  photosChanged();
  if (failed.length) alert('Тези файлове не могат да се отворят в браузъра (например HEIC): ' + failed.join(', '));
}

function photosChanged() {
  renderThumbs();
  fillResolutions();
  fillPairs();
  updateSummary();
  schedulePreview();
}

function renderThumbs() {
  const ol = $('thumbs');
  ol.textContent = '';
  photos.forEach((p, i) => {
    const li = document.createElement('li');
    li.className = 'thumb';
    li.draggable = true;
    li.dataset.i = i;
    const c = document.createElement('canvas');
    c.width = p.thumb.width; c.height = p.thumb.height;
    c.getContext('2d').drawImage(p.thumb, 0, 0);
    const idx = document.createElement('span');
    idx.className = 'idx'; idx.textContent = i + 1;
    const name = document.createElement('div');
    name.className = 'name'; name.textContent = p.name; name.title = `${p.name} — ${p.w}×${p.h}`;
    const acts = document.createElement('div');
    acts.className = 'acts';
    const btn = (txt, title, fn) => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = txt; b.title = title; b.setAttribute('aria-label', title);
      b.addEventListener('click', fn);
      return b;
    };
    acts.append(
      btn('◀', 'По-напред', () => move(i, i - 1)),
      btn('✕', 'Махни снимката', () => { photos.splice(i, 1); photosChanged(); }),
      btn('▶', 'По-назад', () => move(i, i + 1)),
    );
    li.append(c, idx, name, acts);
    li.addEventListener('dragstart', e => { li.classList.add('dragging'); e.dataTransfer.setData('text/x-photo', String(i)); e.dataTransfer.effectAllowed = 'move'; });
    li.addEventListener('dragend', () => li.classList.remove('dragging'));
    li.addEventListener('dragover', e => { if (e.dataTransfer.types.includes('text/x-photo')) { e.preventDefault(); li.classList.add('target'); } });
    li.addEventListener('dragleave', () => li.classList.remove('target'));
    li.addEventListener('drop', e => {
      const from = e.dataTransfer.getData('text/x-photo');
      li.classList.remove('target');
      if (from === '') return;
      e.preventDefault(); e.stopPropagation();
      move(parseInt(from, 10), i);
    });
    ol.append(li);
  });
  $('photo-count').textContent = photos.length ? `${photos.length} снимки` : '';
  $('photo-tools').hidden = !photos.length;
}

function move(from, to) {
  if (to < 0 || to >= photos.length || from === to) return;
  const [p] = photos.splice(from, 1);
  photos.splice(to, 0, p);
  photosChanged();
}

// Коефициенти за цвета на всяка снимка. При изравняване всяка снимка се
// доближава до средното на съседите си — бавните промени остават, премигването изчезва.
function gains(equalize) {
  if (!equalize) return photos.map(() => [1, 1, 1]);
  const R = 3;
  return photos.map((p, i) => {
    const avg = [0, 0, 0];
    let n = 0;
    for (let j = Math.max(0, i - R); j <= Math.min(photos.length - 1, i + R); j++) {
      for (let c = 0; c < 3; c++) avg[c] += photos[j].mean[c];
      n++;
    }
    return avg.map((a, c) => Math.min(1.6, Math.max(0.6, a / n / p.mean[c])));
  });
}

// ---------- Резолюция ----------

function dims() {
  const v = $('res').value;
  if (!v) return { w: 0, h: 0 };
  const [w, h] = v.split('x').map(Number);
  return { w, h };
}

function fillResolutions() {
  const sel = $('res');
  const prev = sel.value ? sel.value.split('x').map(Number) : null;
  const prevShort = prev ? Math.min(...prev) : 1080;
  sel.textContent = '';
  if (!photos.length) return;
  const { w: W, h: H } = photos[0];
  const short = Math.min(W, H);
  const make = p => {
    let k = p / short;
    k = Math.min(k, MAX_SIDE / Math.max(W, H));
    return { w: even(W * k), h: even(H * k) };
  };
  const opts = [];
  const orig = make(short);
  opts.push({ ...orig, label: `Оригинална — ${orig.w}×${orig.h}` + (orig.w !== W || orig.h !== H ? ' (ограничена до 4K)' : '') });
  for (const p of [2160, 1440, 1080, 720, 480]) {
    if (p >= Math.min(orig.w, orig.h)) continue;
    const d = make(p);
    opts.push({ ...d, label: `${p}p — ${d.w}×${d.h}` });
  }
  let best = null;
  for (const o of opts) {
    const opt = document.createElement('option');
    opt.value = `${o.w}x${o.h}`;
    opt.textContent = o.label;
    sel.append(opt);
    const d = Math.abs(Math.min(o.w, o.h) - prevShort);
    if (!best || d < best.d) best = { d, v: opt.value };
  }
  sel.value = best.v;
  const mixed = photos.some(p => Math.abs(p.w / p.h - W / H) > 0.01);
  sel.title = mixed ? 'Снимките са с различни пропорции — ще бъдат вписани в кадъра на първата.' : '';
}

function fillPairs() {
  const sel = $('pair');
  const prev = sel.selectedIndex;
  sel.textContent = '';
  for (let i = 0; i + 1 < photos.length; i++) {
    const o = document.createElement('option');
    o.value = i;
    o.textContent = `${i + 1} → ${i + 2}`;
    sel.append(o);
  }
  if (sel.options.length) sel.selectedIndex = Math.max(0, Math.min(prev, sel.options.length - 1));
}

// ---------- Обобщение и оценка на времето ----------

function totals(s) {
  const n = photos.length;
  return { pairs: Math.max(0, n - 1), frames: n ? n * (1 + s.hold) + (n - 1) * s.inter : 0 };
}

function estimate(s) {
  const t = timing[`${s.algo}@${s.w}x${s.h}`];
  if (!t) return null;
  const { pairs, frames } = totals(s);
  const enc = t.encode != null ? t.encode : s.w * s.h / 1e6 * 6;
  let ms = photos.length * t.decode + frames * (t.frame + enc);
  if (s.algo === 'flow') ms += pairs * t.flow;
  if (s.algo === 'rife') ms += pairs * s.inter * (t.rife || 0);
  return ms;
}

function updateSummary() {
  const box = $('summary');
  if (!engine) return;
  const s = settings();
  $('rife-panel').hidden = s.algo !== 'rife';
  if (photos.length < 2) {
    box.textContent = 'Добавете поне две снимки.';
    $('render').disabled = true;
    return;
  }
  const { frames } = totals(s);
  const sec = frames / s.fps;
  const est = estimate(s);
  let text = `Видео ${s.w}×${s.h}: ${nf(frames)} кадъра, ${nf(sec, 1)} сек при ${s.fps} кадъра/сек. `;
  if (s.algo === 'rife' && !rife.ready) text += 'Заредете модела RIFE, за да продължите.';
  else if (est == null) text += 'Времето за обработка ще се измери при прегледа.';
  else text += `Обработката ще отнеме приблизително ${fmtTime(est)}.`;
  box.textContent = text;
  $('render').disabled = busy || (s.algo === 'rife' && !rife.ready) || !encoderSupported();
  if (!encoderSupported()) box.textContent += ' Браузърът не поддържа WebCodecs и не може да създаде видео — опитайте с нов Chrome или Edge.';
}

// ---------- Зареждане на снимка в нужния размер ----------

const work = document.createElement('canvas');
const workCtx = work.getContext('2d', { willReadFrequently: false });

async function decode(photo, w, h) {
  const bmp = await createImageBitmap(photo.file);
  if (work.width !== w || work.height !== h) { work.width = w; work.height = h; }
  workCtx.fillStyle = '#000';
  workCtx.fillRect(0, 0, w, h);
  const k = Math.min(w / bmp.width, h / bmp.height);
  const dw = bmp.width * k, dh = bmp.height * k;
  workCtx.imageSmoothingEnabled = true;
  workCtx.imageSmoothingQuality = 'high';
  workCtx.drawImage(bmp, (w - dw) / 2, (h - dh) / 2, dw, dh);
  bmp.close();
  return work;
}

// RGBA байтове с приложен цветови коефициент (за RIFE).
function pixels(canvas, g) {
  const d = workCtx.getImageData(0, 0, canvas.width, canvas.height).data;
  if (g[0] !== 1 || g[1] !== 1 || g[2] !== 1) {
    for (let i = 0; i < d.length; i += 4) {
      d[i] = d[i] * g[0]; d[i + 1] = d[i + 1] * g[1]; d[i + 2] = d[i + 2] * g[2];
    }
  }
  return d;
}

// ---------- Преглед ----------

let previewTimer = 0;
let preview = null; // { key, pair, a, b } — какво е заредено в двигателя
function schedulePreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(runPreview, 150);
}

async function runPreview() {
  if (!engine || busy) return;
  stopPlay();
  const s = settings();
  $('stage-empty').hidden = photos.length >= 2;
  if (photos.length < 2) { preview = null; $('preview-status').textContent = ''; return; }
  const job = ++previewJob;
  const k = Math.min(parseInt($('pair').value || '0', 10), photos.length - 2);
  const pa = photos[k], pb = photos[k + 1];
  const key = `${s.algo === 'flow' ? 'flow' : 'img'}@${s.w}x${s.h}`;
  const t = timing[`${s.algo}@${s.w}x${s.h}`] || (timing[`${s.algo}@${s.w}x${s.h}`] = {});
  const st = $('preview-status');
  try {
    if (!preview || preview.key !== key || preview.a !== pa || preview.b !== pb) {
      st.textContent = 'Подготвям снимките…';
      engine.setSize(s.w, s.h);
      let t0 = performance.now();
      engine.upload(0, await decode(pa, s.w, s.h));
      if (job !== previewJob) return;
      engine.pyramid(0, 1 / pa.lum);
      engine.finish();
      t.decode = performance.now() - t0;
      engine.upload(1, await decode(pb, s.w, s.h));
      if (job !== previewJob) return;
      engine.pyramid(1, 1 / pb.lum);
      if (s.algo === 'flow') {
        st.textContent = 'Изчислявам движението…';
        await sleep(0);
        engine.finish();
        t0 = performance.now();
        engine.computeFlow();
        engine.finish();
        t.flow = performance.now() - t0;
      }
      preview = { key, a: pa, b: pb, rifeKey: null };
      // Средно време за един кадър.
      const g = gains(s.equalize);
      t0 = performance.now();
      for (let i = 1; i <= 4; i++) engine.render(i / 5, s.algo === 'flow' ? 0 : 1, g[k], g[k + 1]);
      engine.finish();
      t.frame = (performance.now() - t0) / 4;
    }
    st.textContent = '';
    await drawPreview();
  } catch (e) {
    console.error(e);
    st.textContent = 'Грешка: ' + e.message;
  }
  updateSummary();
}

async function drawPreview() {
  if (!preview || busy) return;
  const s = settings();
  const k = photos.indexOf(preview.a);
  if (k < 0) return;
  const g = gains(s.equalize);
  const t = parseFloat($('t').value);
  $('t-label').textContent = nf(t, 2);
  if (s.algo === 'rife' && t > 0 && t < 1) {
    if (!rife.ready) { engine.render(t, 1, g[k], g[k + 1]); $('preview-status').textContent = 'Показвам плавно смесване, докато моделът RIFE не е зареден.'; return; }
    await rifePreview(s, k, g, t);
    return;
  }
  const mode = $('show-flow').checked && s.algo === 'flow' ? 2 : s.algo === 'flow' ? 0 : 1;
  engine.render(t, mode, g[k], g[k + 1]);
}

let rifeBusy = false, rifeWanted = null;
async function rifePreview(s, k, g, t) {
  rifeWanted = t;
  if (rifeBusy) return;
  rifeBusy = true;
  const st = $('preview-status');
  try {
    while (rifeWanted != null) {
      const want = rifeWanted;
      rifeWanted = null;
      const pk = `${k}@${s.w}x${s.h}@${s.equalize}`;
      if (preview.rifeKey !== pk) {
        st.textContent = 'Подготвям снимките за RIFE…';
        const a = pixels(await decode(photos[k], s.w, s.h), g[k]);
        const b = pixels(await decode(photos[k + 1], s.w, s.h), g[k + 1]);
        rife.prepare(a, b, s.w, s.h);
        preview.rifeKey = pk;
      }
      st.textContent = 'RIFE изчислява кадъра…';
      const t0 = performance.now();
      await rife.frames([want], rgba => { engine.uploadRaw(rgba); engine.render(0, 3); });
      const tm = timing[`rife@${s.w}x${s.h}`] || (timing[`rife@${s.w}x${s.h}`] = {});
      tm.rife = performance.now() - t0;
      st.textContent = `Кадърът е изчислен за ${fmtTime(tm.rife)}.`;
    }
  } catch (e) {
    console.error(e);
    st.textContent = 'Грешка в RIFE: ' + e.message;
  }
  rifeBusy = false;
  updateSummary();
}

function stopPlay() {
  playing = false;
  $('play').textContent = '▶ Пусни';
}

function togglePlay() {
  if (playing) { stopPlay(); return; }
  if (!preview) return;
  const s = settings();
  if (s.algo === 'rife') { $('preview-status').textContent = 'С RIFE прегледът е кадър по кадър — местете плъзгача.'; return; }
  playing = true;
  $('play').textContent = '■ Спри';
  const steps = s.inter + 1;
  let i = 0, last = 0;
  const tick = now => {
    if (!playing) return;
    if (now - last >= 1000 / s.fps) {
      last = now;
      $('t').value = (i % (steps + 1)) / steps;
      i++;
      drawPreview();
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ---------- RIFE ----------

async function loadRife(source) {
  const st = $('rife-status');
  try {
    const info = await rife.load(source, msg => { st.textContent = msg; });
    st.textContent = 'Моделът е зареден: ' + info + '.';
    if (preview) preview.rifeKey = null;
    schedulePreview();
  } catch (e) {
    console.error(e);
    st.textContent = 'Грешка: ' + e.message;
  }
  updateSummary();
}

// ---------- Създаване на видео ----------

async function renderVideo() {
  const s = settings();
  if (photos.length < 2 || busy) return;
  busy = true;
  cancelled = false;
  stopPlay();
  $('render').disabled = true;
  $('cancel').hidden = false;
  $('progress').hidden = false;
  $('result').hidden = true;
  const st = $('render-status');
  const bar = $('bar');
  const { frames: total } = totals(s);
  const g = gains(s.equalize);
  const ts = Array.from({ length: s.inter }, (_, i) => (i + 1) / (s.inter + 1));
  const mode = s.algo === 'flow' ? 0 : 1;
  let done = 0, encMs = 0;
  const started = performance.now();
  let lastUi = 0;

  const emit = async (copies = 1) => {
    for (let c = 0; c < copies; c++) {
      const t0 = performance.now();
      await enc.addFrame(engine.canvas);
      encMs += performance.now() - t0;
      done++;
    }
    const now = performance.now();
    if (now - lastUi > 150) {
      lastUi = now;
      const el = now - started;
      const left = done ? el / done * (total - done) : 0;
      bar.style.width = `${(done / total * 100).toFixed(1)}%`;
      st.textContent = `Кадър ${nf(done)} от ${nf(total)} · изминали ${fmtTime(el)} · остават около ${fmtTime(left)}`;
      await sleep(0);
    }
    if (cancelled) throw new Error('cancelled');
  };

  let enc = null;
  try {
    engine.setSize(s.w, s.h);
    preview = null;
    enc = await createEncoder({ width: s.w, height: s.h, fps: s.fps, format: s.format, quality: s.quality });
    st.textContent = 'Започвам…';
    const t0 = performance.now();
    engine.upload(0, await decode(photos[0], s.w, s.h));
    engine.pyramid(0, 1 / photos[0].lum);
    let prevPixels = s.algo === 'rife' ? pixels(work, g[0]) : null;
    const decodeMs = performance.now() - t0;
    for (let i = 0; i + 1 < photos.length; i++) {
      engine.upload(1, await decode(photos[i + 1], s.w, s.h));
      engine.pyramid(1, 1 / photos[i + 1].lum);
      const nextPixels = s.algo === 'rife' ? pixels(work, g[i + 1]) : null;
      if (s.algo === 'flow') engine.computeFlow();
      engine.render(0, 1, g[i], g[i + 1]);
      await emit(1 + s.hold);
      if (s.algo === 'rife') {
        rife.prepare(prevPixels, nextPixels, s.w, s.h);
        await rife.frames(ts, async rgba => { engine.uploadRaw(rgba); engine.render(0, 3); await emit(); });
        prevPixels = nextPixels;
      } else {
        for (const t of ts) { engine.render(t, mode, g[i], g[i + 1]); await emit(); }
      }
      engine.swap();
    }
    const n = photos.length - 1;
    engine.render(0, 1, g[n], g[n]);
    await emit(1 + s.hold);
    st.textContent = 'Записвам файла…';
    const { blob, ext } = await enc.finish();
    enc = null;
    const el = performance.now() - started;
    const tm = timing[`${s.algo}@${s.w}x${s.h}`] || (timing[`${s.algo}@${s.w}x${s.h}`] = {});
    tm.encode = encMs / total;
    if (tm.decode == null) tm.decode = decodeMs;
    showResult(blob, ext, s, el);
    if (ext !== s.format) $('result-info').textContent += ` · ${s.format.toUpperCase()} не се поддържа от този браузър, затова видеото е ${ext.toUpperCase()}.`;
    st.textContent = `Готово за ${fmtTime(el)}.`;
    bar.style.width = '100%';
  } catch (e) {
    if (enc) enc.cancel();
    if (e.message === 'cancelled') st.textContent = 'Спряно.';
    else { console.error(e); st.textContent = 'Грешка: ' + e.message; }
  }
  busy = false;
  $('cancel').hidden = true;
  updateSummary();
  schedulePreview();
}

let resultUrl = null;
function showResult(blob, ext, s, ms) {
  if (resultUrl) URL.revokeObjectURL(resultUrl);
  resultUrl = URL.createObjectURL(blob);
  $('video').src = resultUrl;
  const a = $('download');
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  a.href = resultUrl;
  a.download = `video-${stamp}.${ext}`;
  $('result-info').textContent = `${ext.toUpperCase()}, ${s.w}×${s.h}, ${nf(blob.size / 1048576, 1)} MB`;
  $('result').hidden = false;
}

// ---------- Събития ----------

const drop = $('drop');
$('file-input').addEventListener('change', e => { addFiles(e.target.files); e.target.value = ''; });
['dragenter', 'dragover'].forEach(ev => document.addEventListener(ev, e => {
  if (e.dataTransfer && e.dataTransfer.types.includes('Files')) { e.preventDefault(); drop.classList.add('over'); }
}));
['dragleave', 'drop'].forEach(ev => document.addEventListener(ev, e => {
  if (ev === 'dragleave' && e.relatedTarget) return;
  drop.classList.remove('over');
}));
document.addEventListener('drop', e => {
  if (e.dataTransfer && e.dataTransfer.files.length) { e.preventDefault(); addFiles(e.dataTransfer.files); }
});

$('sort-name').addEventListener('click', () => {
  photos.sort((a, b) => a.name.localeCompare(b.name, 'bg', { numeric: true }));
  photosChanged();
});
$('reverse').addEventListener('click', () => { photos.reverse(); photosChanged(); });
$('clear').addEventListener('click', () => { photos.length = 0; preview = null; photosChanged(); });

document.querySelectorAll('input[name=algo]').forEach(r => r.addEventListener('change', () => { updateSummary(); schedulePreview(); }));
['res', 'pair', 'equalize'].forEach(id => $(id).addEventListener('change', () => { updateSummary(); schedulePreview(); }));
['inter', 'fps', 'hold', 'format', 'quality'].forEach(id => $(id).addEventListener('input', updateSummary));
$('t').addEventListener('input', () => { stopPlay(); drawPreview(); });
$('show-flow').addEventListener('change', drawPreview);
$('play').addEventListener('click', togglePlay);

$('rife-file').addEventListener('change', e => { if (e.target.files[0]) loadRife(e.target.files[0]); });
$('rife-load-url').addEventListener('click', () => {
  const url = $('rife-url').value.trim();
  if (!url) return;
  try { localStorage.setItem('photo2video.rifeUrl', url); } catch { /* без запомняне */ }
  loadRife(url);
});
try { $('rife-url').value = localStorage.getItem('photo2video.rifeUrl') || ''; } catch { /* без запомняне */ }

$('render').addEventListener('click', renderVideo);
$('cancel').addEventListener('click', () => { cancelled = true; });

updateSummary();
