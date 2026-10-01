// Невронна интерполация с RIFE чрез ONNX Runtime Web (WebGPU, иначе процесора).
//
// TODO: моделът да се зарежда автоматично от постоянен адрес, без потребителят
// да избира файл или да въвежда адрес. Докато това не е готово, приложението
// показва напомняне в панела на RIFE.
//
// Различните преобразувания на RIFE в ONNX имат различни входове. Поддържаме:
//   а) три входа: img0 [1,3,H,W], img1 [1,3,H,W], timestep [1,1,H,W] или [1];
//   б) два входа: img0+img1 слепени [1,6,H,W] и timestep;
//   в) един вход [1,7,H,W] — двете снимки и равнина с t;
//   г) един вход [1,6,H,W] — модел само за средата (t = 0,5); тогава
//      междинните кадри се получават с последователно разполовяване.
// Изходът е първият изход на модела: [1,3,H,W], стойности 0..1.
// H и W се допълват до кратно на 32 с повторение на крайните пиксели.

const ORT_VERSION = '1.30.0';
const ORT_BASE = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;

let ortPromise = null;
function loadOrt() {
  if (!ortPromise) {
    ortPromise = import(ORT_BASE + 'ort.webgpu.min.mjs').then(ort => {
      ort.env.wasm.wasmPaths = ORT_BASE;
      return ort;
    }).catch(e => {
      ortPromise = null;
      throw new Error('Не успях да изтегля ONNX Runtime от интернет: ' + e.message);
    });
  }
  return ortPromise;
}

// float32 ⇄ float16 (за модели, записани с половинна точност).
const f32 = new Float32Array(1), u32 = new Uint32Array(f32.buffer);
function toHalf(v) {
  f32[0] = v;
  const x = u32[0], s = (x >>> 16) & 0x8000;
  let e = ((x >>> 23) & 0xff) - 112, m = x & 0x7fffff;
  if (e <= 0) return s;
  if (e >= 31) return s | 0x7c00;
  return s | (e << 10) | ((m + 0x1000) >>> 13);
}
function fromHalf(h) {
  const s = h & 0x8000 ? -1 : 1, e = (h >>> 10) & 0x1f, m = h & 0x3ff;
  if (e === 0) return s * m * 5.960464477539063e-8;
  if (e === 31) return m ? NaN : s * Infinity;
  return s * (1 + m / 1024) * Math.pow(2, e - 15);
}

export class Rife {
  constructor() {
    this.session = null;
    this.ort = null;
  }

  get ready() { return !!this.session; }

  // source: File (локален .onnx) или адрес в интернет.
  async load(source, onStatus = () => {}) {
    onStatus('Изтеглям ONNX Runtime…');
    const ort = this.ort = await loadOrt();
    let bytes;
    if (typeof source === 'string') {
      onStatus('Изтеглям модела…');
      const res = await fetch(source);
      if (!res.ok) throw new Error(`Адресът върна грешка ${res.status}.`);
      bytes = new Uint8Array(await res.arrayBuffer());
    } else {
      onStatus('Чета файла…');
      bytes = new Uint8Array(await source.arrayBuffer());
    }
    const providers = [];
    if (navigator.gpu) {
      try { if (await navigator.gpu.requestAdapter()) providers.push('webgpu'); } catch { /* няма WebGPU */ }
    }
    providers.push('wasm');
    onStatus('Подготвям модела…');
    let session = null, lastErr = null;
    for (const ep of providers) {
      try {
        session = await ort.InferenceSession.create(bytes, { executionProviders: [ep], graphOptimizationLevel: 'all' });
        this.provider = ep;
        break;
      } catch (e) { lastErr = e; }
    }
    if (!session) throw new Error('Моделът не се зарежда: ' + (lastErr && lastErr.message));
    this.session = session;
    this._describe();
    return this.describe();
  }

  _describe() {
    const s = this.session;
    const meta = s.inputMetadata && s.inputMetadata.length ? s.inputMetadata : null;
    const m = name => meta ? meta.find(x => x.name === name) : null;
    const shapeOf = name => { const x = m(name); return x && x.shape ? x.shape : null; };
    const typeOf = name => { const x = m(name); return x && x.type ? x.type : 'float32'; };
    const ins = s.inputNames;
    this.inputs = ins;
    this.half = typeOf(ins[0]) === 'float16';
    const ch = shp => (shp && typeof shp[1] === 'number' ? shp[1] : null);
    const rank = name => { const shp = shapeOf(name); return shp ? shp.length : null; };
    if (ins.length >= 3) {
      this.layout = 'three';
      this.tRank = rank(ins[2]);
    } else if (ins.length === 2) {
      this.layout = 'two';
      this.tRank = rank(ins[1]);
    } else {
      const c = ch(shapeOf(ins[0]));
      this.layout = c === 6 ? 'half' : 'seven';
    }
  }

  describe() {
    const names = { three: 'три входа (img0, img1, t)', two: 'два входа (снимки, t)', seven: 'един вход със 7 канала', half: 'един вход, само среден кадър' };
    return `${names[this.layout]}, ${this.provider === 'webgpu' ? 'видеокарта (WebGPU)' : 'процесор (WASM)'}${this.half ? ', float16' : ''}`;
  }

  get onlyHalf() { return this.layout === 'half'; }

  _tensor(data, dims) {
    if (!this.half) return new this.ort.Tensor('float32', data, dims);
    const h = new Uint16Array(data.length);
    for (let i = 0; i < data.length; i++) h[i] = toHalf(data[i]);
    return new this.ort.Tensor('float16', h, dims);
  }

  // Двойка снимки като RGBA байтове с размер w×h (вече с изравнена яркост).
  prepare(a, b, w, h) {
    const pw = Math.ceil(w / 32) * 32, ph = Math.ceil(h / 32) * 32;
    this.size = { w, h, pw, ph };
    const plane = pw * ph;
    const chw = (src, dst, off) => {
      for (let y = 0; y < ph; y++) {
        const sy = Math.min(y, h - 1);
        for (let x = 0; x < pw; x++) {
          const si = (sy * w + Math.min(x, w - 1)) * 4, di = y * pw + x;
          dst[off + di] = src[si] / 255;
          dst[off + plane + di] = src[si + 1] / 255;
          dst[off + 2 * plane + di] = src[si + 2] / 255;
        }
      }
    };
    this.cat = new Float32Array(plane * 7);
    chw(a, this.cat, 0);
    chw(b, this.cat, plane * 3);
    this.a = this.cat.subarray(0, plane * 3);
    this.b = this.cat.subarray(plane * 3, plane * 6);
  }

  _timestep(t, rankHint) {
    const { pw, ph } = this.size;
    if (rankHint === 1) return this._tensor(new Float32Array([t]), [1]);
    if (rankHint === 0) return this._tensor(new Float32Array([t]), []);
    return this._tensor(new Float32Array(pw * ph).fill(t), [1, 1, ph, pw]);
  }

  async _run(t, img0, img1) {
    const { pw, ph } = this.size, ins = this.inputs;
    const feeds = {};
    const plane = pw * ph;
    if (this.layout === 'three') {
      feeds[ins[0]] = this._tensor(img0, [1, 3, ph, pw]);
      feeds[ins[1]] = this._tensor(img1, [1, 3, ph, pw]);
      feeds[ins[2]] = this._timestep(t, this.tRank);
    } else {
      const cat = new Float32Array(plane * (this.layout === 'seven' ? 7 : 6));
      cat.set(img0, 0);
      cat.set(img1, plane * 3);
      if (this.layout === 'seven') cat.fill(t, plane * 6);
      feeds[ins[0]] = this._tensor(cat, [1, cat.length / plane, ph, pw]);
      if (this.layout === 'two') feeds[ins[1]] = this._timestep(t, this.tRank);
    }
    let out;
    try {
      out = await this.session.run(feeds);
    } catch (e) {
      // Ако не знаем формата на t, опитваме и другия вариант.
      if ((this.layout === 'three' || this.layout === 'two') && this.tRank == null) {
        this.tRank = 1;
        return this._run(t, img0, img1);
      }
      throw e;
    }
    const tensor = out[this.session.outputNames[0]];
    let data = tensor.data;
    if (tensor.type === 'float16' && !(data instanceof Float32Array)) {
      const f = new Float32Array(data.length);
      for (let i = 0; i < data.length; i++) f[i] = fromHalf(data[i]);
      data = f;
    }
    if (tensor.dispose) tensor.dispose();
    return data; // [3, ph, pw]
  }

  _toRgba(chw) {
    const { w, h, pw, ph } = this.size, plane = pw * ph;
    const out = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const si = y * pw + x, di = (y * w + x) * 4;
        out[di] = chw[si] * 255;
        out[di + 1] = chw[plane + si] * 255;
        out[di + 2] = chw[2 * plane + si] * 255;
        out[di + 3] = 255;
      }
    }
    return out;
  }

  // За всеки момент t от масива ts извиква onFrame(rgba, i) с готовия кадър.
  async frames(ts, onFrame) {
    if (!this.onlyHalf) {
      for (let i = 0; i < ts.length; i++) await onFrame(this._toRgba(await this._run(ts[i], this.a, this.b)), i);
      return;
    }
    // Само среден кадър: строим кадри при t = k/2^d и взимаме най-близкия.
    // Дълбочината е ограничена, защото всички кадри стоят в паметта.
    const need = ts.length + 1;
    let depth = 1;
    while ((1 << depth) < need && depth < 4) depth++;
    const n = 1 << depth;
    const grid = new Array(n + 1);
    grid[0] = this.a; grid[n] = this.b;
    const fill = async (lo, hi) => {
      if (hi - lo < 2) return;
      const mid = (lo + hi) >> 1;
      grid[mid] = await this._run(0.5, grid[lo], grid[hi]);
      await fill(lo, mid);
      await fill(mid, hi);
    };
    await fill(0, n);
    for (let i = 0; i < ts.length; i++) {
      const k = Math.min(n - 1, Math.max(1, Math.round(ts[i] * n)));
      await onFrame(this._toRgba(grid[k]), i);
    }
  }
}
