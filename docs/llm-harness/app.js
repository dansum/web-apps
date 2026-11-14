import { PROVIDERS, PRESETS, DEFAULTS, decide, listModels, parseOptions } from './harness.js';

/* ---------- Текстове ---------- */
var T = {
  bg: {
    title: 'Решаващ модел',
    lead: 'Даваш задача и списък с отговори. Отворен езиков модел избира един от тях. Решението може да отиде към количка, към друга програма или да остане тук.',
    hModel: 'Модел', provider: 'Доставчик', baseUrl: 'Адрес (до /v1)', apiKey: 'Ключ (API key)',
    show: 'Покажи', hide: 'Скрий', remember: 'Запомни ключа на това устройство',
    keyHint: 'Ключът остава в този браузър и отива само до доставчика.', getKey: 'Вземи ключ',
    localHint: 'Моделът работи на твоя компютър. Пусни Ollama с OLLAMA_ORIGINS=* , за да приема заявки от браузъра.',
    models: 'Модели', modelPh: 'напр. openai/gpt-oss-20b', add: 'Добави',
    modelsHint: 'С един модел решава той. С няколко модела те гласуват и печели мнозинството.',
    loadModels: 'Зареди всички модели на доставчика', loading: 'Зареждам…',
    loaded: function (n, v) { return 'Заредени: ' + n + (v ? ', от тях виждат картинки: ' + v : '') + '.'; },
    removeModel: 'Махни',
    advanced: 'Още настройки', temperature: 'Температура', maxTokens: 'Най-много токени',
    retries: 'Нови опити при лош отговор', timeout: 'Чакай най-много (сек.)',
    jsonMode: 'Изискай JSON (response_format). Не всички модели го поддържат.',
    hTask: 'Задача', preset: 'Готова задача', custom: 'Своя задача',
    task: 'Какво да реши моделът', options: 'Възможни отговори (по един на ред: отговор — обяснение)',
    fallback: 'Ако моделът не даде ясен отговор, избери', noFallback: '— нищо (покажи грешка) —',
    hInput: 'Вход', input: 'Какво вижда или знае моделът сега', image: 'Картинка',
    imgNone: 'Без', imgCamera: 'Камера', imgFile: 'Файл',
    imgHint: 'Картинката работи само с модели, които виждат (vision), напр. Qwen2.5-VL или Gemma 3.',
    run: 'Реши', running: 'Мисли…', loop: 'Повтаряй на всеки', sec: 'сек.', stop: 'Спри',
    hResult: 'Решение', colModel: 'Модел', colChoice: 'Избор', colTime: 'Време', colNote: 'Бележка',
    raw: 'Суров отговор', fallbackUsed: 'Резервен избор: моделите не дадоха ясен отговор.',
    noChoice: 'Няма решение', agree: function (a, b) { return a + ' от ' + b + ' модела са съгласни'; },
    tries: function (n) { return n === 1 ? '1 опит' : n + ' опита'; },
    how: { json: '', text: 'отговор без JSON', mention: 'намерен в текста' },
    hAction: 'Изпрати решението', actNone: 'Никъде', actHttp: 'Уеб адрес', actSerial: 'USB кабел',
    actUrl: 'Адрес. {choice} се заменя с решението.', actMethod: 'Метод',
    actHttpHint: 'Тази страница е на https. Браузърът не пуска заявки към http адреси в домашната мрежа (напр. ESP32). Тогава отвори страницата от свой компютър (python3 -m http.server) или ползвай USB кабел.',
    serialConnect: 'Свържи устройство', serialConnected: 'Свързано.', serialNo: 'Този браузър не поддържа USB връзка. Ползвай Chrome или Edge на компютър.',
    baud: 'Скорост',
    serialHint: 'Работи в Chrome и Edge на компютър. Към устройството отива решението и нов ред, напр. „left\\n“. Подходящо за Arduino, ESP32 и micro:bit.',
    sent: function (c, w) { return 'Изпратено „' + c + '“ ' + w + '.'; }, sentErr: 'Не се изпрати: ',
    serialFirst: 'Първо свържи устройство.',
    hEval: 'Провери моделите с примери',
    evalHint: 'По един пример на ред: вход => верен отговор. Всички модели от стъпка 1 решават всеки пример. Така виждаш кой модел се справя най-добре.',
    evalRun: 'Провери', colRight: 'Верни', colAcc: 'Точност', colAvg: 'Средно време',
    evalNoCases: 'Няма примери. Пиши ги така: вход => отговор', evalProgress: function (a, b) { return 'Пример ' + a + ' от ' + b + '…'; },
    evalDone: 'Готово.', evalBadAnswer: function (a) { return 'Отговорът „' + a + '“ го няма в списъка с възможни отговори.'; },
    evalMiss: function (m, i, e, g) { return m + ': „' + i + '“ – очаквах ' + e + ', получих ' + (g || 'нищо'); },
    hLog: 'Дневник', colWhen: 'Час', colAgree: 'Съгласие', colInput: 'Вход', logEmpty: 'Още няма решения.',
    copyJson: 'Копирай като JSON', clear: 'Изчисти', copied: 'Копирано.',
    hCode: 'В твоята програма',
    codeHint: 'Същото решение от JavaScript (браузър или Node 18+, напр. на Raspberry Pi). Свали harness.js и сложи до своя файл. Ключът не е в кода: подай го от променлива.',
    copy: 'Копирай', download: 'Свали harness.js',
    donate: 'Стани дарител', donateUrl: 'https://obr.education/stani-daritel/', home: 'Всички приложения', cookies: 'Бисквитки',
    errNoModel: 'Добави поне един модел в стъпка 1.', errNoKey: 'Въведи ключ в стъпка 1.',
    errNoOptions: 'Напиши поне два възможни отговора.', errNoBase: 'Въведи адрес на доставчика.',
    errCamera: 'Камерата не се отвори: ', errImage: 'Избери картинка.'
  },
  en: {
    title: 'Decision Model',
    lead: 'You give a task and a list of answers. An open language model picks one of them. The decision can go to a cart, to another program, or stay here.',
    hModel: 'Model', provider: 'Provider', baseUrl: 'Address (up to /v1)', apiKey: 'API key',
    show: 'Show', hide: 'Hide', remember: 'Remember the key on this device',
    keyHint: 'The key stays in this browser and goes only to the provider.', getKey: 'Get a key',
    localHint: 'The model runs on your computer. Start Ollama with OLLAMA_ORIGINS=* so it accepts requests from the browser.',
    models: 'Models', modelPh: 'e.g. openai/gpt-oss-20b', add: 'Add',
    modelsHint: 'With one model, it decides. With several, they vote and the majority wins.',
    loadModels: 'Load all models from the provider', loading: 'Loading…',
    loaded: function (n, v) { return 'Loaded: ' + n + (v ? ', of which can see images: ' + v : '') + '.'; },
    removeModel: 'Remove',
    advanced: 'More settings', temperature: 'Temperature', maxTokens: 'Max tokens',
    retries: 'Retries on a bad answer', timeout: 'Wait at most (sec.)',
    jsonMode: 'Ask for JSON (response_format). Not all models support it.',
    hTask: 'Task', preset: 'Ready task', custom: 'My own task',
    task: 'What should the model decide', options: 'Possible answers (one per line: answer — explanation)',
    fallback: 'If the model gives no clear answer, choose', noFallback: '— nothing (show an error) —',
    hInput: 'Input', input: 'What the model sees or knows right now', image: 'Image',
    imgNone: 'None', imgCamera: 'Camera', imgFile: 'File',
    imgHint: 'Images only work with models that can see (vision), e.g. Qwen2.5-VL or Gemma 3.',
    run: 'Decide', running: 'Thinking…', loop: 'Repeat every', sec: 'sec.', stop: 'Stop',
    hResult: 'Decision', colModel: 'Model', colChoice: 'Choice', colTime: 'Time', colNote: 'Note',
    raw: 'Raw answer', fallbackUsed: 'Fallback choice: the models gave no clear answer.',
    noChoice: 'No decision', agree: function (a, b) { return a + ' of ' + b + ' models agree'; },
    tries: function (n) { return n === 1 ? '1 try' : n + ' tries'; },
    how: { json: '', text: 'answer without JSON', mention: 'found in the text' },
    hAction: 'Send the decision', actNone: 'Nowhere', actHttp: 'Web address', actSerial: 'USB cable',
    actUrl: 'Address. {choice} is replaced with the decision.', actMethod: 'Method',
    actHttpHint: 'This page is on https. The browser blocks requests to http addresses on your home network (e.g. ESP32). In that case open the page from your own computer (python3 -m http.server) or use a USB cable.',
    serialConnect: 'Connect a device', serialConnected: 'Connected.', serialNo: 'This browser does not support USB connections. Use Chrome or Edge on a computer.',
    baud: 'Speed',
    serialHint: 'Works in Chrome and Edge on a computer. The device gets the decision and a new line, e.g. "left\\n". Good for Arduino, ESP32 and micro:bit.',
    sent: function (c, w) { return 'Sent "' + c + '" ' + w + '.'; }, sentErr: 'Not sent: ',
    serialFirst: 'Connect a device first.',
    hEval: 'Test the models with examples',
    evalHint: 'One example per line: input => right answer. Every model from step 1 solves every example. This shows which model does best.',
    evalRun: 'Test', colRight: 'Right', colAcc: 'Accuracy', colAvg: 'Avg. time',
    evalNoCases: 'No examples. Write them like this: input => answer', evalProgress: function (a, b) { return 'Example ' + a + ' of ' + b + '…'; },
    evalDone: 'Done.', evalBadAnswer: function (a) { return 'The answer "' + a + '" is not in the list of possible answers.'; },
    evalMiss: function (m, i, e, g) { return m + ': "' + i + '" – expected ' + e + ', got ' + (g || 'nothing'); },
    hLog: 'Log', colWhen: 'Time', colAgree: 'Agreement', colInput: 'Input', logEmpty: 'No decisions yet.',
    copyJson: 'Copy as JSON', clear: 'Clear', copied: 'Copied.',
    hCode: 'In your program',
    codeHint: 'The same decision from JavaScript (browser or Node 18+, e.g. on a Raspberry Pi). Download harness.js and put it next to your file. The key is not in the code: pass it from a variable.',
    copy: 'Copy', download: 'Download harness.js',
    donate: 'Donate', donateUrl: 'https://obr.education/en/donate/', home: 'All apps', cookies: 'Cookies',
    errNoModel: 'Add at least one model in step 1.', errNoKey: 'Enter a key in step 1.',
    errNoOptions: 'Write at least two possible answers.', errNoBase: 'Enter the provider address.',
    errCamera: 'Could not open the camera: ', errImage: 'Choose an image.'
  }
};

var EVAL_CASES = {
  cart: 'Отпред: 15 см. Отляво: 100 см. Отдясно: 20 см. => left\n' +
    'Отпред: 200 см. Отляво: 30 см. Отдясно: 30 см. => forward\n' +
    'Отпред: 10 см. Отляво: 12 см. Отдясно: 120 см. => right\n' +
    'Отпред: 5 см. Отляво: 5 см. Отдясно: 5 см. => stop',
  router: 'Кажи ми колко е 2 + 2. => meta-llama/llama-3.1-8b-instruct\n' +
    'Намери грешката в този код на Python от 400 реда. => qwen/qwen3-32b\n' +
    'Какво има на тази снимка от екскурзията? => qwen/qwen2.5-vl-72b-instruct\n' +
    'Преведи на немски книга от 80 страници. => meta-llama/llama-3.3-70b-instruct',
  yesno: 'Земята е плоска. => no\nСлънцето е звезда. => yes\nУтре ще вали в София. => unsure'
};

/* ---------- Помощни ---------- */
var $ = function (id) { return document.getElementById(id); };
var KEY_STORE = 'llmh-key-';
var SETTINGS = 'llmh-settings';
var LOG_STORE = 'llmh-log';
var lang = 'bg';
var state = { models: [], log: [], image: null, serialPort: null, loop: false, busy: false, preset: 'cart' };

function t(k) { return T[lang][k]; }
function store(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function secs(ms) { return (ms / 1000).toFixed(1).replace('.', lang === 'bg' ? ',' : '.') + ' s'; }
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

/* ---------- Език ---------- */
function setLang(l) {
  lang = T[l] ? l : 'bg';
  document.documentElement.lang = lang;
  document.title = t('title');
  document.querySelectorAll('[data-t]').forEach(function (n) {
    var v = t(n.getAttribute('data-t'));
    if (typeof v === 'string') n.textContent = v;
  });
  document.querySelectorAll('[data-tp]').forEach(function (n) { n.placeholder = t(n.getAttribute('data-tp')); });
  document.querySelectorAll('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === lang)); });
  $('donate').href = t('donateUrl');
  $('key-show').textContent = $('api-key').type === 'password' ? t('show') : t('hide');
  $('loop-sec').setAttribute('aria-label', t('sec'));
  fillProviders();
  fillPresets();
  renderModels();
  fillFallback();
  renderLog();
  updateRunButton();
  store('llmh-lang', lang);
}

/* ---------- Доставчик и ключ ---------- */
var PROVIDER_EN = { ollama: 'Ollama (on my computer)', lmstudio: 'LM Studio (on my computer)', custom: 'Other (OpenAI-compatible address)' };
function fillProviders() {
  var sel = $('provider');
  if (!sel.options.length) {
    Object.keys(PROVIDERS).forEach(function (id) { var o = el('option'); o.value = id; sel.appendChild(o); });
  }
  Array.from(sel.options).forEach(function (o) {
    o.textContent = (lang === 'en' && PROVIDER_EN[o.value]) || PROVIDERS[o.value].name;
  });
}

function provider() { return PROVIDERS[$('provider').value] || PROVIDERS.custom; }

function onProvider(first) {
  var id = $('provider').value;
  var p = provider();
  $('base-wrap').hidden = id !== 'custom' && id !== 'lmstudio' && id !== 'ollama';
  if (!first || !$('base-url').value) $('base-url').value = p.base;
  $('key-wrap').hidden = !p.needsKey && id !== 'custom';
  $('local-hint').hidden = id !== 'ollama' && id !== 'lmstudio';
  $('key-link').href = p.keyUrl || '#';
  $('key-link').hidden = !p.keyUrl || !p.needsKey;
  var saved = load(KEY_STORE + id);
  $('api-key').value = saved || sessionKeys[id] || '';
  $('key-remember').checked = !!saved;
  var dl = $('model-list'); dl.textContent = '';
  p.models.forEach(function (m) { var o = el('option'); o.value = m; dl.appendChild(o); });
  $('model-load-status').textContent = '';
  if (!first) { state.models = p.models.slice(0, 1); renderModels(); }
  renderCode(); save();
}

var sessionKeys = {};
function onKey() {
  var id = $('provider').value, v = $('api-key').value.trim();
  sessionKeys[id] = v;
  store(KEY_STORE + id, $('key-remember').checked && v ? v : null);
}

/* ---------- Модели ---------- */
function renderModels() {
  var ul = $('models'); ul.textContent = '';
  state.models.forEach(function (m, i) {
    var li = el('li'); li.appendChild(el('span', null, m));
    var b = el('button', null, '×'); b.type = 'button';
    b.setAttribute('aria-label', t('removeModel') + ' ' + m);
    b.onclick = function () { state.models.splice(i, 1); renderModels(); renderCode(); save(); };
    li.appendChild(b); ul.appendChild(li);
  });
}

function addModel() {
  var v = $('model-input').value.trim();
  if (v && state.models.indexOf(v) < 0) state.models.push(v);
  $('model-input').value = '';
  renderModels(); renderCode(); save();
}

async function loadAllModels() {
  var s = $('model-load-status');
  s.className = ''; s.textContent = t('loading');
  try {
    var list = await listModels({ provider: $('provider').value, baseUrl: $('base-url').value, apiKey: $('api-key').value.trim() });
    var dl = $('model-list'); dl.textContent = '';
    list.forEach(function (m) {
      var o = el('option'); o.value = m.id;
      var tags = []; if (m.vision) tags.push('👁'); if (m.free) tags.push('free');
      if (tags.length) o.label = m.id + ' · ' + tags.join(' ');
      dl.appendChild(o);
    });
    s.textContent = t('loaded')(list.length, list.filter(function (m) { return m.vision; }).length);
  } catch (e) {
    s.className = 'err'; s.textContent = e.message;
  }
}

/* ---------- Задача ---------- */
function fillPresets() {
  var sel = $('preset'), cur = state.preset;
  sel.textContent = '';
  Object.keys(PRESETS).forEach(function (id) {
    var o = el('option', null, PRESETS[id][lang].name); o.value = id; sel.appendChild(o);
  });
  var c = el('option', null, t('custom')); c.value = 'custom'; sel.appendChild(c);
  sel.value = cur;
}

function applyPreset(id) {
  state.preset = id;
  var p = PRESETS[id] && PRESETS[id][lang];
  if (p) {
    $('task').value = p.task; $('options').value = p.options; $('input').value = p.input;
    fillFallback(p.fallback);
    $('eval-cases').value = EVAL_CASES[id] || '';
  }
  renderCode(); save();
}

function options() { return parseOptions($('options').value); }

function fillFallback(value) {
  var sel = $('fallback');
  var cur = value != null ? value : sel.value;
  sel.textContent = '';
  var n = el('option', null, t('noFallback')); n.value = ''; sel.appendChild(n);
  options().forEach(function (o) { var x = el('option', null, o.id); x.value = o.id; sel.appendChild(x); });
  sel.value = options().some(function (o) { return o.id === cur; }) ? cur : '';
}

/* ---------- Картинка ---------- */
var stream = null;
async function onImageMode() {
  var mode = document.querySelector('input[name=img]:checked').value;
  $('img-box').hidden = mode === 'none';
  $('cam').hidden = mode !== 'camera';
  $('img-file').hidden = mode !== 'file';
  $('img-preview').hidden = mode !== 'file' || !state.image;
  if (mode !== 'camera' && stream) { stream.getTracks().forEach(function (tr) { tr.stop(); }); stream = null; }
  if (mode !== 'file') state.image = null;
  if (mode === 'camera' && !stream) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      $('cam').srcObject = stream; await $('cam').play();
    } catch (e) {
      showError(t('errCamera') + e.message);
    }
  }
}

function shrink(source, w, h) {
  var max = 768, k = Math.min(1, max / Math.max(w, h));
  var c = document.createElement('canvas');
  c.width = Math.round(w * k); c.height = Math.round(h * k);
  c.getContext('2d').drawImage(source, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.8);
}

function onImageFile() {
  var f = $('img-file').files[0];
  if (!f) return;
  var img = new Image();
  img.onload = function () {
    state.image = shrink(img, img.naturalWidth, img.naturalHeight);
    $('img-preview').src = state.image; $('img-preview').hidden = false;
    URL.revokeObjectURL(img.src);
  };
  img.src = URL.createObjectURL(f);
}

function currentImage() {
  var mode = document.querySelector('input[name=img]:checked').value;
  if (mode === 'camera') {
    var v = $('cam');
    if (!v.videoWidth) throw new Error(t('errCamera'));
    return shrink(v, v.videoWidth, v.videoHeight);
  }
  if (mode === 'file') { if (!state.image) throw new Error(t('errImage')); return state.image; }
  return null;
}

/* ---------- Решение ---------- */
function config() {
  var p = provider();
  return {
    provider: $('provider').value,
    baseUrl: $('base-url').value.trim() || p.base,
    apiKey: $('api-key').value.trim(),
    models: state.models.slice(),
    task: $('task').value,
    input: $('input').value,
    options: options(),
    fallback: $('fallback').value,
    temperature: Number($('temperature').value) || 0,
    maxTokens: Number($('max-tokens').value) || DEFAULTS.maxTokens,
    retries: Math.max(0, Math.min(5, Number($('retries').value) || 0)),
    timeoutMs: (Number($('timeout').value) || 60) * 1000,
    jsonMode: $('json-mode').checked
  };
}

function check(cfg) {
  if (!cfg.models.length) return t('errNoModel');
  if (!cfg.baseUrl) return t('errNoBase');
  if (provider().needsKey && !cfg.apiKey) return t('errNoKey');
  if (cfg.options.length < 2) return t('errNoOptions');
  return null;
}

function showError(msg) {
  $('result').hidden = false;
  var c = $('choice'); c.className = 'choice none'; c.textContent = msg;
  $('reason').textContent = ''; $('meta').textContent = ''; $('votes').textContent = '';
  $('votes-wrap').hidden = true; $('raw').textContent = '';
}

function updateRunButton() {
  var b = $('run');
  b.textContent = state.loop ? t('stop') : (state.busy ? t('running') : t('run'));
  b.disabled = state.busy && !state.loop;
}

async function runOnce() {
  var cfg = config();
  var err = check(cfg);
  if (err) { showError(err); return null; }
  try { cfg.image = currentImage(); } catch (e) { showError(e.message); return null; }
  state.busy = true; updateRunButton();
  var r;
  try { r = await decide(cfg); }
  catch (e) { showError(e.message); return null; }
  finally { state.busy = false; updateRunButton(); }
  showResult(r, cfg);
  addLog(r, cfg);
  if (r.choice) await act(r.choice);
  return r;
}

function showResult(r, cfg) {
  $('result').hidden = false;
  var c = $('choice');
  c.className = 'choice' + (r.choice ? (r.fallback ? ' fallback' : '') : ' none');
  c.textContent = r.choice || t('noChoice');
  var opt = cfg.options.find(function (o) { return o.id === r.choice; });
  if (opt && opt.label) c.appendChild(el('small', null, opt.label));
  var firstErr = r.votes.find(function (v) { return v.error; });
  $('reason').textContent = r.fallback ? t('fallbackUsed') : (r.reason || (!r.choice && firstErr ? firstErr.error : ''));
  var n = cfg.models.length;
  $('meta').textContent = (n > 1 && r.ok ? t('agree')(r.tally[r.choice], n) + ' · ' : '') + secs(r.ms);

  var tb = $('votes'); tb.textContent = '';
  r.votes.forEach(function (v) {
    var tr = el('tr', v.choice ? '' : 'bad');
    tr.appendChild(el('td', null, v.model));
    tr.appendChild(el('td', 'c', v.choice || '—'));
    tr.appendChild(el('td', null, v.ms != null ? secs(v.ms) : '—'));
    var note = v.error || v.reason || '';
    var extra = [];
    if (v.attempts && v.attempts.length > 1) extra.push(t('tries')(v.attempts.length));
    if (v.how && t('how')[v.how]) extra.push(t('how')[v.how]);
    tr.appendChild(el('td', null, note + (extra.length ? ' (' + extra.join(', ') + ')' : '')));
    tb.appendChild(tr);
  });
  $('votes-wrap').hidden = false;
  $('raw').textContent = r.votes.map(function (v) {
    return '### ' + v.model + '\n' + (v.attempts || []).map(function (a, i) {
      return '[' + (i + 1) + '] ' + (a.error ? 'ERROR: ' + a.error : (a.raw || '(празно)') + (a.reasoning ? '\n(reasoning) ' + String(a.reasoning).slice(0, 600) : ''));
    }).join('\n');
  }).join('\n\n');
}

async function toggleRun() {
  if (state.loop) { state.loop = false; updateRunButton(); return; }
  if (!$('loop').checked) { await runOnce(); return; }
  state.loop = true; updateRunButton();
  while (state.loop) {
    var t0 = Date.now();
    var r = await runOnce();
    if (!r) break;
    var wait = Math.max(0, (Number($('loop-sec').value) || 3) * 1000 - (Date.now() - t0));
    var end = Date.now() + wait;
    while (state.loop && Date.now() < end) await sleep(100);
  }
  state.loop = false; updateRunButton();
}

/* ---------- Действие ---------- */
function actMode() { return document.querySelector('input[name=act]:checked').value; }
function onActMode() {
  $('act-http').hidden = actMode() !== 'http';
  $('act-serial').hidden = actMode() !== 'serial';
  $('act-status').textContent = '';
  save();
}

async function act(choice) {
  var s = $('act-status'); s.className = 'status';
  var mode = actMode();
  if (mode === 'none') { s.textContent = ''; return; }
  try {
    if (mode === 'http') {
      var tpl = $('act-url').value.trim();
      if (!tpl) return;
      var method = $('act-method').value;
      var url = tpl.split('{choice}').join(encodeURIComponent(choice));
      var opts = { method: method, mode: 'no-cors' };
      if (method === 'POST') { opts.headers = { 'Content-Type': 'text/plain' }; opts.body = choice; }
      await fetch(url, opts);
      s.className = 'status ok'; s.textContent = t('sent')(choice, '→ ' + url);
    } else if (mode === 'serial') {
      if (!state.serialPort) throw new Error(t('serialFirst'));
      var w = state.serialPort.writable.getWriter();
      try { await w.write(new TextEncoder().encode(choice + '\n')); } finally { w.releaseLock(); }
      s.className = 'status ok'; s.textContent = t('sent')(choice, '→ USB');
    }
  } catch (e) {
    s.className = 'status err'; s.textContent = t('sentErr') + e.message;
  }
}

async function connectSerial() {
  var s = $('serial-status');
  if (!('serial' in navigator)) { s.className = 'status err'; s.textContent = t('serialNo'); return; }
  try {
    if (state.serialPort) { try { await state.serialPort.close(); } catch (e) {} }
    var port = await navigator.serial.requestPort();
    await port.open({ baudRate: Number($('baud').value) });
    state.serialPort = port;
    s.className = 'status ok'; s.textContent = t('serialConnected');
  } catch (e) {
    s.className = 'status err'; s.textContent = e.message;
  }
}

/* ---------- Дневник ---------- */
function addLog(r, cfg) {
  state.log.unshift({
    time: new Date().toISOString(), choice: r.choice, fallback: r.fallback,
    agreement: r.agreement, ms: r.ms, input: cfg.input || $('input').value,
    votes: r.votes.map(function (v) { return { model: v.model, choice: v.choice, reason: v.reason, error: v.error, ms: v.ms }; })
  });
  state.log = state.log.slice(0, 50);
  store(LOG_STORE, JSON.stringify(state.log));
  renderLog();
}

function renderLog() {
  var tb = $('log'); tb.textContent = '';
  state.log.forEach(function (e) {
    var tr = el('tr', e.choice ? '' : 'bad');
    tr.appendChild(el('td', null, new Date(e.time).toLocaleTimeString(lang === 'bg' ? 'bg-BG' : 'en-GB')));
    tr.appendChild(el('td', 'c', (e.choice || '—') + (e.fallback ? ' *' : '')));
    tr.appendChild(el('td', null, Math.round((e.agreement || 0) * 100) + '%'));
    tr.appendChild(el('td', null, secs(e.ms)));
    tr.appendChild(el('td', null, String(e.input || '').slice(0, 60)));
    tb.appendChild(tr);
  });
  $('log-empty').hidden = state.log.length > 0;
}

async function copyText(text, statusEl) {
  try { await navigator.clipboard.writeText(text); if (statusEl) statusEl.textContent = t('copied'); }
  catch (e) { if (statusEl) statusEl.textContent = e.message; }
}

/* ---------- Проверка с примери ---------- */
async function runEval() {
  var s = $('eval-status'); s.className = 'status';
  var cfg = config();
  var err = check(cfg);
  if (err) { s.className = 'status err'; s.textContent = err; return; }
  var cases = $('eval-cases').value.split(/\r?\n/).map(function (l) {
    var i = l.lastIndexOf('=>'); if (i < 0) return null;
    return { input: l.slice(0, i).trim(), expected: l.slice(i + 2).trim() };
  }).filter(function (c) { return c && c.input && c.expected; });
  if (!cases.length) { s.className = 'status err'; s.textContent = t('evalNoCases'); return; }
  var ids = cfg.options.map(function (o) { return o.id; });
  var bad = cases.find(function (c) { return ids.indexOf(c.expected) < 0; });
  if (bad) { s.className = 'status err'; s.textContent = t('evalBadAnswer')(bad.expected); return; }

  $('eval-run').disabled = true;
  var stats = {}; cfg.models.forEach(function (m) { stats[m] = { right: 0, ms: 0, n: 0 }; });
  var misses = [];
  for (var i = 0; i < cases.length; i++) {
    s.textContent = t('evalProgress')(i + 1, cases.length);
    var r;
    try { r = await decide(Object.assign({}, cfg, { input: cases[i].input, fallback: '' })); }
    catch (e) { s.className = 'status err'; s.textContent = e.message; break; }
    r.votes.forEach(function (v) {
      var st = stats[v.model]; st.n++; st.ms += v.ms || 0;
      if (v.choice === cases[i].expected) st.right++;
      else misses.push(t('evalMiss')(v.model, cases[i].input, cases[i].expected, v.choice || v.error));
    });
    renderEval(stats, cases.length, misses);
  }
  if (!s.classList.contains('err')) s.textContent = t('evalDone');
  $('eval-run').disabled = false;
}

function renderEval(stats, total, misses) {
  $('eval-wrap').hidden = false;
  var tb = $('eval-body'); tb.textContent = '';
  Object.keys(stats).sort(function (a, b) { return stats[b].right - stats[a].right || stats[a].ms - stats[b].ms; })
    .forEach(function (m) {
      var st = stats[m], tr = el('tr');
      tr.appendChild(el('td', null, m));
      tr.appendChild(el('td', 'c', st.right + ' / ' + st.n));
      tr.appendChild(el('td', null, st.n ? Math.round(st.right / st.n * 100) + '%' : '—'));
      tr.appendChild(el('td', null, st.n ? secs(st.ms / st.n) : '—'));
      tb.appendChild(tr);
    });
  var ul = $('eval-misses'); ul.textContent = '';
  misses.forEach(function (m) { ul.appendChild(el('li', null, m)); });
}

/* ---------- Код ---------- */
function renderCode() {
  var cfg = config();
  var envName = { openrouter: 'OPENROUTER_API_KEY', huggingface: 'HF_TOKEN', groq: 'GROQ_API_KEY', together: 'TOGETHER_API_KEY' }[cfg.provider] || 'API_KEY';
  var needsKey = provider().needsKey || cfg.provider === 'custom';
  var lines = [
    "import { decide } from './harness.js';",
    '',
    'const r = await decide({',
    '  provider: ' + JSON.stringify(cfg.provider) + ','
  ];
  if (cfg.baseUrl !== provider().base) lines.push('  baseUrl: ' + JSON.stringify(cfg.baseUrl) + ',');
  if (needsKey) lines.push('  apiKey: process.env.' + envName + ',   // в браузъра: от поле или настройка');
  lines.push(
    '  models: ' + JSON.stringify(cfg.models) + ',',
    '  task: ' + JSON.stringify(cfg.task) + ',',
    '  options: ' + JSON.stringify(cfg.options.map(function (o) { return o.id; })) + ',',
    '  input: sensorText,   // какво вижда моделът сега'
  );
  if (cfg.fallback) lines.push('  fallback: ' + JSON.stringify(cfg.fallback) + ',');
  lines.push('});', '', 'console.log(r.choice, r.reason);   // напр. "left" и защо');
  $('code').textContent = lines.join('\n');
}

/* ---------- Запазване ---------- */
var FIELDS = ['provider', 'base-url', 'task', 'options', 'input', 'fallback', 'temperature', 'max-tokens', 'retries', 'timeout', 'act-url', 'act-method', 'baud', 'loop-sec', 'eval-cases'];
function save() {
  var s = { models: state.models, preset: state.preset, json: $('json-mode').checked, act: actMode() };
  FIELDS.forEach(function (id) { s[id] = $(id).value; });
  store(SETTINGS, JSON.stringify(s));
}
function restore() {
  var s = null;
  try { s = JSON.parse(load(SETTINGS) || 'null'); } catch (e) {}
  return s;
}

/* ---------- Начало ---------- */
function init() {
  fillProviders();
  var s = restore();
  var l = load('llmh-lang');
  lang = T[l] ? l : 'bg';
  try { state.log = JSON.parse(load(LOG_STORE) || '[]'); } catch (e) { state.log = []; }

  if (s) {
    state.preset = s.preset || 'custom';
    $('provider').value = PROVIDERS[s.provider] ? s.provider : 'openrouter';
    onProvider(true);
    FIELDS.forEach(function (id) { if (s[id] != null && id !== 'provider' && id !== 'fallback') $(id).value = s[id]; });
    state.models = Array.isArray(s.models) ? s.models : [];
    $('json-mode').checked = !!s.json;
    var a = document.querySelector('input[name=act][value="' + (s.act || 'none') + '"]'); if (a) a.checked = true;
    setLang(lang);
    fillFallback(s.fallback || '');
  } else {
    $('provider').value = 'openrouter';
    onProvider(true);
    state.models = PROVIDERS.openrouter.models.slice(0, 1);
    setLang(lang);
    applyPreset('cart');
  }
  onActMode();
  renderCode();

  /* Събития */
  document.querySelectorAll('.lang button').forEach(function (b) {
    b.onclick = function () {
      var keep = state.preset !== 'custom' && PRESETS[state.preset] &&
        $('task').value === PRESETS[state.preset][lang].task;
      setLang(b.dataset.lang);
      if (keep) applyPreset(state.preset);
    };
  });
  $('provider').onchange = function () { onProvider(false); };
  $('api-key').oninput = onKey;
  $('key-remember').onchange = onKey;
  $('key-show').onclick = function () {
    var k = $('api-key'); k.type = k.type === 'password' ? 'text' : 'password';
    $('key-show').textContent = k.type === 'password' ? t('show') : t('hide');
  };
  $('model-add').onclick = addModel;
  $('model-input').onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); addModel(); } };
  $('model-input').onchange = function () {
    // Избор от падащия списък добавя модела веднага.
    var v = $('model-input').value.trim();
    if (v && Array.from($('model-list').options).some(function (o) { return o.value === v; })) addModel();
  };
  $('model-load').onclick = loadAllModels;
  $('preset').onchange = function () { if ($('preset').value === 'custom') { state.preset = 'custom'; save(); } else applyPreset($('preset').value); };
  $('options').oninput = function () { fillFallback(); renderCode(); markCustom(); save(); };
  $('task').oninput = function () { renderCode(); markCustom(); save(); };
  ['input', 'fallback', 'temperature', 'max-tokens', 'retries', 'timeout', 'json-mode', 'act-url', 'act-method', 'baud', 'loop-sec', 'eval-cases', 'base-url']
    .forEach(function (id) { $(id).addEventListener('change', function () { renderCode(); save(); }); });
  document.querySelectorAll('input[name=img]').forEach(function (r) { r.onchange = onImageMode; });
  $('img-file').onchange = onImageFile;
  document.querySelectorAll('input[name=act]').forEach(function (r) { r.onchange = onActMode; });
  $('serial-connect').onclick = connectSerial;
  $('run').onclick = toggleRun;
  $('loop').onchange = function () { if (!$('loop').checked) state.loop = false; updateRunButton(); };
  $('eval-run').onclick = runEval;
  $('log-copy').onclick = function () { copyText(JSON.stringify(state.log, null, 2), $('log-status')); };
  $('log-clear').onclick = function () { state.log = []; store(LOG_STORE, null); renderLog(); };
  $('code-copy').onclick = function () { copyText($('code').textContent); };
}

function markCustom() {
  if (state.preset !== 'custom') { state.preset = 'custom'; $('preset').value = 'custom'; }
}

init();
