// WebGL2 двигател: оптичен поток (пирамидален Lucas–Kanade) и междинни кадри.
//
// Всичко е в „пространството на текстурата“: ред 0 е горният ред на снимката.
// Потокът се пази в пиксели на съответното ниво на пирамидата (RG), а в B е
// увереността (0..1) — колко текстура има около пиксела.

const FLOW_MAX = 1024;   // по-дългата страна на потока — пести видеокартата
const MIN_LEVEL = 24;    // най-малкото ниво на пирамидата
const ITERS = 4;         // итерации на Lucas–Kanade на всяко ниво

const VS = `#version 300 es
in vec2 a;
uniform float flip;
out vec2 uv;
void main() {
  uv = a * 0.5 + 0.5;
  if (flip > 0.5) uv.y = 1.0 - uv.y;
  gl_Position = vec4(a, 0.0, 1.0);
}`;

const HEAD = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 uv;
out vec4 o;
`;

// Яркост, нормирана към средната яркост на снимката (устойчиво на премигване).
const FS_GRAY = HEAD + `
uniform sampler2D img;
uniform float gain;
void main() {
  vec3 c = texture(img, uv).rgb;
  o = vec4(dot(c, vec3(0.299, 0.587, 0.114)) * gain, 0.0, 0.0, 1.0);
}`;

// Намаляване 2 пъти с лек филтър (4 билинейни проби = 4x4 палатка).
const FS_DOWN = HEAD + `
uniform sampler2D src;
uniform vec2 srcSize;
void main() {
  vec2 d = 1.0 / srcSize;
  float s = texture(src, uv + vec2(-d.x, -d.y)).r + texture(src, uv + vec2(d.x, -d.y)).r
          + texture(src, uv + vec2(-d.x,  d.y)).r + texture(src, uv + vec2(d.x,  d.y)).r;
  o = vec4(s * 0.25, 0.0, 0.0, 1.0);
}`;

// Ниво на пирамидата: (яркост, dI/dx, dI/dy) със Собел.
const FS_GRAD = HEAD + `
uniform sampler2D src;
float I(ivec2 p, ivec2 m) { return texelFetch(src, clamp(p, ivec2(0), m), 0).r; }
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  ivec2 m = textureSize(src, 0) - 1;
  float tl = I(p + ivec2(-1, -1), m), t = I(p + ivec2(0, -1), m), tr = I(p + ivec2(1, -1), m);
  float l  = I(p + ivec2(-1,  0), m), c = I(p, m),                r  = I(p + ivec2(1,  0), m);
  float bl = I(p + ivec2(-1,  1), m), b = I(p + ivec2(0,  1), m), br = I(p + ivec2(1,  1), m);
  float gx = ((tr + 2.0 * r + br) - (tl + 2.0 * l + bl)) / 8.0;
  float gy = ((bl + 2.0 * b + br) - (tl + 2.0 * t + tr)) / 8.0;
  o = vec4(c, gx, gy, 1.0);
}`;

// Една итерация на Lucas–Kanade с прозорец 7x7. Градиентите са средни от двете
// снимки (симетрично — по-бърза сходимост), а теглата в прозореца отчитат
// разликата в яркостта спрямо центъра, за да не се размазва потокът по ръбовете.
const FS_LK = HEAD + `
uniform sampler2D p0, p1, flow;
uniform vec2 size;
const int R = 3;
void main() {
  vec2 px = gl_FragCoord.xy;
  vec2 u = texture(flow, px / size).xy;
  float c0 = texture(p0, px / size).x;
  float a11 = 0.0, a12 = 0.0, a22 = 0.0, b1 = 0.0, b2 = 0.0, W = 0.0;
  for (int j = -R; j <= R; j++) {
    for (int i = -R; i <= R; i++) {
      vec2 q = px + vec2(float(i), float(j));
      vec4 A = texture(p0, q / size);
      vec4 B = texture(p1, (q + u) / size);
      float dc = A.x - c0;
      float w = exp(-float(i * i + j * j) / 8.0 - dc * dc / 0.08);
      float gx = 0.5 * (A.y + B.y), gy = 0.5 * (A.z + B.z), it = B.x - A.x;
      a11 += w * gx * gx; a12 += w * gx * gy; a22 += w * gy * gy;
      b1 += w * gx * it;  b2 += w * gy * it;  W += w;
    }
  }
  a11 /= W; a12 /= W; a22 /= W; b1 /= W; b2 /= W;
  float tr = a11 + a22;
  float det0 = a11 * a22 - a12 * a12;
  float mn = 0.5 * (tr - sqrt(max(tr * tr - 4.0 * det0, 0.0)));
  float lam = 3e-4;
  a11 += lam; a22 += lam;
  float det = a11 * a22 - a12 * a12;
  vec2 du = -vec2(a22 * b1 - a12 * b2, a11 * b2 - a12 * b1) / det;
  float m = length(du);
  if (m > 1.5) du *= 1.5 / m;
  o = vec4(u + du, mn / (mn + 2e-4), 1.0);
}`;

// Изглаждане 5x5: тежест по увереност и по сходство на яркостта (запазва ръбовете).
// Така гладките участъци без текстура взимат движението от съседите си.
const FS_SMOOTH = HEAD + `
uniform sampler2D flow, pyr;
uniform vec2 size;
void main() {
  vec2 px = gl_FragCoord.xy;
  float c = texture(pyr, px / size).x;
  vec3 s = vec3(0.0); float W = 0.0;
  for (int j = -2; j <= 2; j++) {
    for (int i = -2; i <= 2; i++) {
      vec2 q = (px + vec2(float(i), float(j))) / size;
      vec3 f = texture(flow, q).xyz;
      float d = texture(pyr, q).x - c;
      float w = exp(-float(i * i + j * j) / 4.5 - d * d / 0.02) * (f.z + 0.02);
      s += w * f; W += w;
    }
  }
  o = vec4(s / W, 1.0);
}`;

// Пренасяне на потока от по-грубо към по-фино ниво.
const FS_UP = HEAD + `
uniform sampler2D flow;
uniform vec2 scale;
void main() {
  vec3 f = texture(flow, uv).xyz;
  o = vec4(f.xy * scale, f.z, 1.0);
}`;

// Изходен кадър. mode: 0 — оптичен поток, 1 — плавно смесване,
// 2 — показва потока в цвят, 3 — показва готова текстура (img0) без промени.
const FS_OUT = HEAD + `
uniform sampler2D i0, i1, f01, f10;
uniform vec2 fs;
uniform float t;
uniform vec3 g0, g1;
uniform int mode;
vec2 F(sampler2D s, vec2 p) { return texture(s, p).xy / fs; }
vec3 hsv(float h, float s, float v) {
  vec3 k = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return v * mix(vec3(1.0), k, s);
}
float inside(vec2 p) { return all(greaterThanEqual(p, vec2(0.0))) && all(lessThanEqual(p, vec2(1.0))) ? 1.0 : 0.02; }
void main() {
  vec2 x = uv;
  if (mode == 3) { o = vec4(texture(i0, x).rgb, 1.0); return; }
  if (mode == 2) {
    vec2 f = texture(f01, x).xy;
    float mag = length(f);
    vec3 c = hsv(atan(f.y, f.x) / 6.2831853 + 0.5, clamp(mag / 8.0, 0.0, 1.0), 1.0);
    o = vec4(mix(c, texture(i0, x).rgb * 0.5, 0.25), 1.0);
    return;
  }
  if (mode == 1 || t <= 0.0 || t >= 1.0) {
    o = vec4(mix(texture(i0, x).rgb * g0, texture(i1, x).rgb * g1, clamp(t, 0.0, 1.0)), 1.0);
    return;
  }
  // Откъде в снимка 0 и снимка 1 идва пикселът x в момента t (неподвижна точка).
  vec2 p = x - t * F(f01, x);
  vec2 q = x - (1.0 - t) * F(f10, x);
  for (int k = 0; k < 5; k++) {
    p = x - t * F(f01, p);
    q = x - (1.0 - t) * F(f10, q);
  }
  // Проверка напред–назад: ако двата потока не си съвпадат, пикселът е закрит.
  vec2 a = F(f01, p), b = F(f10, q);
  float e0 = length((a + F(f10, p + a)) * fs);
  float e1 = length((b + F(f01, q + b)) * fs);
  float s0 = 0.75 + 0.1 * length(a * fs), s1 = 0.75 + 0.1 * length(b * fs);
  float v0 = exp(-(e0 * e0) / (s0 * s0)) * inside(p);
  float v1 = exp(-(e1 * e1) / (s1 * s1)) * inside(q);
  float w0 = (1.0 - t) * (v0 + 0.01), w1 = t * (v1 + 0.01);
  vec3 c0 = texture(i0, p).rgb * g0, c1 = texture(i1, q).rgb * g1;
  o = vec4((w0 * c0 + w1 * c1) / (w0 + w1), 1.0);
}`;

export class Engine {
  constructor(canvas) {
    const gl = canvas.getContext('webgl2', {
      alpha: false, antialias: false, depth: false, stencil: false,
      premultipliedAlpha: false, preserveDrawingBuffer: true,
    });
    if (!gl) throw new Error('Браузърът не поддържа WebGL2.');
    this.canvas = canvas;
    this.gl = gl;
    this.flowOk = !!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));
    gl.getExtension('OES_texture_float_linear');

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.fbo = gl.createFramebuffer();
    this.p = {
      gray: this._program(FS_GRAY), down: this._program(FS_DOWN), grad: this._program(FS_GRAD),
      lk: this._program(FS_LK), smooth: this._program(FS_SMOOTH), up: this._program(FS_UP),
      out: this._program(FS_OUT),
    };
    this.w = 0; this.h = 0;
    this.textures = [];
  }

  _program(fs) {
    const gl = this.gl;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(prog, 0, 'a');
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    const loc = {};
    const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const name = gl.getActiveUniform(prog, i).name;
      loc[name] = gl.getUniformLocation(prog, name);
    }
    return { prog, loc };
  }

  _tex(w, h, float) {
    const gl = this.gl;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    if (float) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.textures.push(t);
    return { t, w, h };
  }

  // Размер на изходното видео. Заделя всички текстури наново.
  setSize(w, h) {
    if (w === this.w && h === this.h) return;
    const gl = this.gl;
    for (const t of this.textures) gl.deleteTexture(t);
    this.textures = [];
    this.w = w; this.h = h;
    this.canvas.width = w; this.canvas.height = h;

    const k = Math.min(1, FLOW_MAX / Math.max(w, h));
    this.levels = [];
    let lw = Math.max(8, Math.round(w * k)), lh = Math.max(8, Math.round(h * k));
    while (this.levels.length < 8) {
      this.levels.push({ w: lw, h: lh });
      if (Math.min(lw, lh) / 2 < MIN_LEVEL) break;
      lw = Math.ceil(lw / 2); lh = Math.ceil(lh / 2);
    }
    this.fs = this.levels[0];

    // Снимките (с mipmap — за чисто намаляване към размера на потока).
    this.img = [0, 1].map(() => {
      const t = this._tex(w, h, false);
      gl.bindTexture(gl.TEXTURE_2D, t.t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      return t;
    });
    this.raw = this._tex(w, h, false);
    if (!this.flowOk) return;
    this.gray = this.levels.map(l => this._tex(l.w, l.h, true));
    this.pyr = [0, 1].map(() => this.levels.map(l => this._tex(l.w, l.h, true)));
    this.tmp = this.levels.map(l => [this._tex(l.w, l.h, true), this._tex(l.w, l.h, true)]);
    this.flow = [0, 1].map(() => this._tex(this.fs.w, this.fs.h, true));
    this.hasFlow = false;
  }

  // Качва снимка (canvas/ImageBitmap с размер w×h) в слот 0 или 1.
  upload(slot, source) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.img[slot].t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.generateMipmap(gl.TEXTURE_2D);
  }

  // Качва готов кадър (RGBA байтове w×h) за показване в режим 3.
  uploadRaw(data) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.raw.t);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.w, this.h, gl.RGBA, gl.UNSIGNED_BYTE, data);
  }

  // Слот 1 става слот 0 — следващата двойка ползва вече изчисленото.
  swap() {
    this.img.reverse();
    if (this.pyr) this.pyr.reverse();
    this.hasFlow = false;
  }

  _draw(prog, target, uniforms, textures, flip = 0) {
    const gl = this.gl;
    gl.useProgram(prog.prog);
    if (target) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.t, 0);
      gl.viewport(0, 0, target.w, target.h);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.w, this.h);
    }
    gl.uniform1f(prog.loc.flip, flip);
    let unit = 0;
    for (const [name, tex] of Object.entries(textures)) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex.t);
      gl.uniform1i(prog.loc[name], unit++);
    }
    for (const [name, v] of Object.entries(uniforms)) {
      const l = prog.loc[name];
      if (l == null) continue;
      if (typeof v === 'number') {
        if (name === 'mode') gl.uniform1i(l, v); else gl.uniform1f(l, v);
      } else if (v.length === 2) gl.uniform2fv(l, v);
      else gl.uniform3fv(l, v);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // Пирамида за снимката в слота. lumGain нормира средната яркост към ~1.
  pyramid(slot, lumGain) {
    if (!this.flowOk) return;
    const P = this.p, L = this.levels;
    this._draw(P.gray, this.gray[0], { gain: lumGain }, { img: this.img[slot] });
    for (let k = 1; k < L.length; k++) {
      this._draw(P.down, this.gray[k], { srcSize: [L[k - 1].w, L[k - 1].h] }, { src: this.gray[k - 1] });
    }
    for (let k = 0; k < L.length; k++) this._draw(P.grad, this.pyr[slot][k], {}, { src: this.gray[k] });
  }

  _flowDir(a, b, out) {
    const gl = this.gl, P = this.p, L = this.levels;
    const top = L.length - 1;
    let cur = this.tmp[top][0];
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, cur.t, 0);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    for (let k = top; k >= 0; k--) {
      const [t0, t1] = this.tmp[k];
      const size = [L[k].w, L[k].h];
      if (k !== top) {
        this._draw(P.up, t0, { scale: [L[k].w / L[k + 1].w, L[k].h / L[k + 1].h] }, { flow: cur });
        cur = t0;
      }
      for (let i = 0; i < ITERS; i++) {
        const nxt = cur === t0 ? t1 : t0;
        this._draw(P.lk, nxt, { size }, { p0: this.pyr[a][k], p1: this.pyr[b][k], flow: cur });
        cur = nxt;
      }
      const dst = k === 0 ? out : (cur === t0 ? t1 : t0);
      this._draw(P.smooth, dst, { size }, { flow: cur, pyr: this.pyr[a][k] });
      cur = dst;
    }
  }

  // Поток в двете посоки между слот 0 и слот 1.
  computeFlow() {
    if (!this.flowOk) return;
    this._flowDir(0, 1, this.flow[0]);
    this._flowDir(1, 0, this.flow[1]);
    this.hasFlow = true;
  }

  // Рисува кадър в момента t (0..1) върху платното.
  render(t, mode, g0 = [1, 1, 1], g1 = [1, 1, 1]) {
    if ((mode === 0 || mode === 2) && !this.hasFlow) mode = 1;
    const tex = mode === 3
      ? { i0: this.raw, i1: this.raw, f01: this.raw, f10: this.raw }
      : { i0: this.img[0], i1: this.img[1], f01: this.flow ? this.flow[0] : this.raw, f10: this.flow ? this.flow[1] : this.raw };
    this._draw(this.p.out, null, { t, mode, g0, g1, fs: [this.fs.w, this.fs.h] }, tex, 1);
  }

  // Изчаква видеокартата да довърши (за измерване на времето).
  finish() {
    const gl = this.gl, px = new Uint8Array(4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  }
}
