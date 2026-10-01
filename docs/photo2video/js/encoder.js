// Кодиране на видео с WebCodecs (хардуерно, когато е възможно) и запис в MP4 или WebM.
// Библиотеките за контейнера се зареждат само при първото създаване на видео.

const AVC = ['avc1.640034', 'avc1.640033', 'avc1.4d0034', 'avc1.42e034', 'avc1.640028', 'avc1.42001f'];
const VP9 = ['vp09.00.51.08', 'vp09.00.41.08', 'vp09.00.10.08'];
const VP8 = ['vp8'];

export function encoderSupported() {
  return typeof window.VideoEncoder === 'function' && typeof window.VideoFrame === 'function';
}

async function pick(list, base) {
  for (const codec of list) {
    for (const hw of ['prefer-hardware', 'no-preference']) {
      const cfg = { ...base, codec, hardwareAcceleration: hw };
      try {
        const r = await VideoEncoder.isConfigSupported(cfg);
        if (r.supported) return r.config;
      } catch { /* опитваме следващия */ }
    }
  }
  return null;
}

// Намира кодек за дадения размер. format: 'mp4' или 'webm'.
export async function chooseCodec(format, w, h, fps, bitrate) {
  const base = { width: w, height: h, framerate: fps, bitrate, latencyMode: 'quality' };
  const tries = format === 'webm'
    ? [['webm', VP9, 'V_VP9'], ['webm', VP8, 'V_VP8'], ['mp4', AVC, 'avc']]
    : [['mp4', AVC, 'avc'], ['webm', VP9, 'V_VP9'], ['webm', VP8, 'V_VP8']];
  for (const [container, list, muxCodec] of tries) {
    const extra = container === 'mp4' ? { avc: { format: 'avc' } } : {};
    const config = await pick(list, { ...base, ...extra });
    if (config) return { container, muxCodec, config };
  }
  return null;
}

export async function createEncoder({ width, height, fps, format, quality }) {
  if (!encoderSupported()) throw new Error('Браузърът не поддържа WebCodecs. Опитайте с нов Chrome, Edge или Firefox.');
  const bpp = quality === 'high' ? 0.22 : quality === 'low' ? 0.06 : 0.12;
  const bitrate = Math.round(Math.min(80e6, Math.max(1e6, width * height * fps * bpp)));
  const choice = await chooseCodec(format, width, height, fps, bitrate);
  if (!choice) throw new Error(`Видеокартата и браузърът не могат да кодират видео с размер ${width}×${height}. Изберете по-ниска резолюция.`);

  const lib = choice.container === 'mp4'
    ? await import('../vendor/mp4-muxer.mjs')
    : await import('../vendor/webm-muxer.mjs');
  const target = new lib.ArrayBufferTarget();
  const muxer = choice.container === 'mp4'
    ? new lib.Muxer({ target, video: { codec: 'avc', width, height, frameRate: fps }, fastStart: 'in-memory', firstTimestampBehavior: 'offset' })
    : new lib.Muxer({ target, video: { codec: choice.muxCodec, width, height, frameRate: fps }, firstTimestampBehavior: 'offset' });

  let error = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: e => { error = e; },
  });
  encoder.configure(choice.config);

  const frameUs = 1e6 / fps;
  const gop = Math.max(1, Math.round(fps * 2));
  let n = 0;

  return {
    codec: choice.config.codec,
    container: choice.container,
    async addFrame(canvas) {
      if (error) throw error;
      while (encoder.encodeQueueSize > 3) await new Promise(r => setTimeout(r, 2));
      const frame = new VideoFrame(canvas, { timestamp: Math.round(n * frameUs), duration: Math.round(frameUs) });
      encoder.encode(frame, { keyFrame: n % gop === 0 });
      frame.close();
      n++;
    },
    async finish() {
      await encoder.flush();
      if (error) throw error;
      encoder.close();
      muxer.finalize();
      const mime = choice.container === 'mp4' ? 'video/mp4' : 'video/webm';
      return { blob: new Blob([target.buffer], { type: mime }), ext: choice.container, frames: n };
    },
    cancel() {
      try { encoder.close(); } catch { /* вече е затворен */ }
    },
  };
}
