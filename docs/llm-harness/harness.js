/*
 * Решаващ модел — ядро (без DOM). Работи в браузъра и в Node 18+.
 *
 *   import { decide } from './harness.js';
 *   const r = await decide({
 *     provider: 'openrouter', apiKey: '...', models: ['openai/gpt-oss-20b'],
 *     task: 'Кажи на количката накъде да тръгне.',
 *     options: [{ id: 'forward' }, { id: 'left' }, { id: 'right' }, { id: 'stop' }],
 *     input: 'Пред теб на 20 см има стена.',
 *     fallback: 'stop'
 *   });
 *   r.choice  // 'stop'
 *
 * Всички доставчици говорят един и същ език: OpenAI-съвместимото
 * POST {base}/chat/completions. Затова всеки нов доставчик е само нов адрес.
 */

export const PROVIDERS = {
  openrouter: {
    name: 'OpenRouter',
    base: 'https://openrouter.ai/api/v1',
    keyUrl: 'https://openrouter.ai/settings/keys',
    needsKey: true,
    models: [
      'openai/gpt-oss-20b', 'openai/gpt-oss-120b',
      'meta-llama/llama-3.3-70b-instruct', 'meta-llama/llama-3.1-8b-instruct',
      'qwen/qwen3-32b', 'qwen/qwen-2.5-72b-instruct', 'qwen/qwen2.5-vl-72b-instruct',
      'deepseek/deepseek-chat', 'mistralai/mistral-small-3.2-24b-instruct',
      'google/gemma-3-27b-it'
    ]
  },
  huggingface: {
    name: 'Hugging Face',
    base: 'https://router.huggingface.co/v1',
    keyUrl: 'https://huggingface.co/settings/tokens',
    needsKey: true,
    models: [
      'openai/gpt-oss-20b', 'openai/gpt-oss-120b',
      'meta-llama/Llama-3.3-70B-Instruct', 'meta-llama/Llama-3.1-8B-Instruct',
      'Qwen/Qwen3-32B', 'Qwen/Qwen2.5-72B-Instruct', 'Qwen/Qwen2.5-VL-7B-Instruct',
      'deepseek-ai/DeepSeek-V3-0324', 'google/gemma-3-27b-it'
    ]
  },
  groq: {
    name: 'Groq',
    base: 'https://api.groq.com/openai/v1',
    keyUrl: 'https://console.groq.com/keys',
    needsKey: true,
    models: ['openai/gpt-oss-20b', 'openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
  },
  together: {
    name: 'Together AI',
    base: 'https://api.together.xyz/v1',
    keyUrl: 'https://api.together.ai/settings/api-keys',
    needsKey: true,
    models: ['openai/gpt-oss-20b', 'meta-llama/Llama-3.3-70B-Instruct-Turbo', 'Qwen/Qwen2.5-72B-Instruct-Turbo']
  },
  ollama: {
    name: 'Ollama (на моя компютър)',
    base: 'http://localhost:11434/v1',
    keyUrl: 'https://ollama.com/download',
    needsKey: false,
    models: ['llama3.2', 'qwen2.5:7b', 'gemma3', 'gpt-oss:20b', 'llava']
  },
  lmstudio: {
    name: 'LM Studio (на моя компютър)',
    base: 'http://localhost:1234/v1',
    keyUrl: 'https://lmstudio.ai/',
    needsKey: false,
    models: []
  },
  custom: {
    name: 'Друг (OpenAI-съвместим адрес)',
    base: '',
    keyUrl: '',
    needsKey: false,
    models: []
  }
};

export const DEFAULTS = {
  temperature: 0,
  maxTokens: 512,
  retries: 2,
  timeoutMs: 60000,
  jsonMode: false
};

/* ---------- Текст ---------- */

// Премахва ударения и излишни знаци, за да сравняваме отговори спокойно.
export function norm(s) {
  return String(s == null ? '' : s)
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[„“”"'`«»*_]/g, '')
    .replace(/[.,;:!?]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Приема и „forward — Продължи напред“, и просто „forward“.
export function parseOptions(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map(function (line) { return line.trim(); })
    .filter(Boolean)
    .map(function (line) {
      var m = line.match(/^(.+?)(?:\s+(?:—|–|-)|\s*:)\s+(.+)$/);
      return m ? { id: m[1].trim(), label: m[2].trim() } : { id: line, label: '' };
    });
}

function toOptions(options) {
  if (typeof options === 'string') return parseOptions(options);
  return (options || []).map(function (o) {
    return typeof o === 'string' ? { id: o, label: '' } : { id: String(o.id), label: o.label || '' };
  });
}

/* ---------- Подкана ---------- */

export function buildMessages(cfg) {
  var options = toOptions(cfg.options);
  var ids = options.map(function (o) { return o.id; });
  var system =
    'You are a decision module inside a program. Read the task and the input, then choose exactly ONE option.\n' +
    'Reply with JSON only, no other text, in this form:\n' +
    '{"choice": "<one option id, copied exactly>", "reason": "<one short sentence>"}\n' +
    'Allowed option ids: ' + ids.map(function (i) { return JSON.stringify(i); }).join(', ') + '.\n' +
    'Write the reason in the same language as the task.';
  var lines = ['TASK:', String(cfg.task || '').trim(), '', 'OPTIONS:'];
  options.forEach(function (o) { lines.push('- ' + o.id + (o.label ? ': ' + o.label : '')); });
  if (cfg.input && String(cfg.input).trim()) lines.push('', 'INPUT:', String(cfg.input).trim());
  lines.push('', 'Answer with JSON only.');
  var text = lines.join('\n');

  var user = text;
  var images = [].concat(cfg.image || [], cfg.images || []).filter(Boolean);
  if (images.length) {
    user = [{ type: 'text', text: text }].concat(images.map(function (url) {
      return { type: 'image_url', image_url: { url: url } };
    }));
  }
  return [{ role: 'system', content: system }, { role: 'user', content: user }];
}

/* ---------- Разчитане на отговора ---------- */

function stripThinking(text) {
  return String(text || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*$/i, '')       // недовършено мислене
    .replace(/```(?:json)?/gi, '')
    .trim();
}

function findJson(text) {
  // Търси обекти {...} отзад напред: последният обикновено е отговорът.
  var found = [];
  var depth = 0, start = -1, inStr = false, esc = false;
  for (var i = 0; i < text.length; i++) {
    var c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{') { if (depth === 0) start = i; depth++; }
    else if (c === '}' && depth > 0) { depth--; if (depth === 0) found.push(text.slice(start, i + 1)); }
  }
  for (var k = found.length - 1; k >= 0; k--) {
    try { var o = JSON.parse(found[k]); if (o && typeof o === 'object') return o; } catch (e) {}
  }
  return null;
}

function matchOption(value, options) {
  var v = norm(value);
  if (!v) return null;
  for (var i = 0; i < options.length; i++) if (norm(options[i].id) === v) return options[i].id;
  for (var j = 0; j < options.length; j++) if (options[j].label && norm(options[j].label) === v) return options[j].id;
  return null;
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Връща { choice, reason, how } или { choice: null, problem }.
export function parseDecision(raw, optionsIn) {
  var options = toOptions(optionsIn);
  var text = stripThinking(raw);
  if (!text) return { choice: null, problem: 'empty' };

  var obj = findJson(text);
  if (obj) {
    var key = ['choice', 'decision', 'answer', 'option', 'action', 'model']
      .find(function (k) { return obj[k] != null; });
    var c = key ? matchOption(obj[key], options) : null;
    var reason = obj.reason || obj.reasoning || obj.why || obj.explanation || '';
    if (c) return { choice: c, reason: String(reason), how: 'json' };
    if (key) return { choice: null, problem: 'not-allowed', got: String(obj[key]) };
  }

  var whole = matchOption(text, options);
  if (whole) return { choice: whole, reason: '', how: 'text' };

  // Точно една разрешена дума в текста.
  var hits = options.filter(function (o) {
    var re = new RegExp('(^|[^\\p{L}\\p{N}_/.-])' + escapeRe(norm(o.id)) + '($|[^\\p{L}\\p{N}_/-])', 'u');
    return re.test(norm(text));
  });
  if (hits.length === 1) return { choice: hits[0].id, reason: '', how: 'mention' };
  return { choice: null, problem: hits.length ? 'ambiguous' : 'no-option', got: text.slice(0, 200) };
}

/* ---------- Заявка към модела ---------- */

export function resolveBase(cfg) {
  var p = PROVIDERS[cfg.provider] || PROVIDERS.custom;
  return String(cfg.baseUrl || p.base || '').replace(/\/+$/, '');
}

export async function chat(cfg, messages) {
  var base = resolveBase(cfg);
  if (!base) throw new HarnessError('no-base', 'Няма адрес на доставчика.');
  var headers = { 'Content-Type': 'application/json' };
  if (cfg.apiKey) headers.Authorization = 'Bearer ' + cfg.apiKey;
  var body = {
    model: cfg.model,
    messages: messages,
    temperature: cfg.temperature != null ? cfg.temperature : DEFAULTS.temperature,
    max_tokens: cfg.maxTokens || DEFAULTS.maxTokens,
    stream: false
  };
  if (cfg.jsonMode) body.response_format = { type: 'json_object' };

  var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, cfg.timeoutMs || DEFAULTS.timeoutMs) : null;
  if (cfg.signal && ctrl) cfg.signal.addEventListener('abort', function () { ctrl.abort(); });
  var res;
  try {
    res = await fetch(base + '/chat/completions', {
      method: 'POST', headers: headers, body: JSON.stringify(body), signal: ctrl ? ctrl.signal : undefined
    });
  } catch (e) {
    if (e && e.name === 'AbortError') throw new HarnessError('timeout', 'Моделът не отговори навреме.');
    throw new HarnessError('network', 'Няма връзка с ' + base + '. Провери адреса, интернета или CORS.');
  } finally {
    if (timer) clearTimeout(timer);
  }
  var data = null;
  var txt = await res.text();
  try { data = JSON.parse(txt); } catch (e) {}
  if (!res.ok) {
    var msg = (data && (data.error && (data.error.message || data.error) || data.message)) || txt.slice(0, 300);
    throw new HarnessError('http-' + res.status, 'HTTP ' + res.status + ': ' + (typeof msg === 'string' ? msg : JSON.stringify(msg)));
  }
  var choice = data && data.choices && data.choices[0];
  var m = choice && choice.message || {};
  var content = m.content;
  if (Array.isArray(content)) content = content.map(function (p) { return p.text || ''; }).join('');
  return { content: content || '', reasoning: m.reasoning || m.reasoning_content || '', usage: data && data.usage || null };
}

export class HarnessError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

/* ---------- Решение от един модел ---------- */

export async function decideOne(cfg) {
  var options = toOptions(cfg.options);
  if (!options.length) throw new HarnessError('no-options', 'Няма възможни отговори.');
  var messages = buildMessages(Object.assign({}, cfg, { options: options }));
  var retries = cfg.retries != null ? cfg.retries : DEFAULTS.retries;
  var t0 = Date.now();
  var attempts = [];
  for (var a = 0; a <= retries; a++) {
    var r;
    try {
      r = await chat(cfg, messages);
    } catch (e) {
      attempts.push({ error: e.message, code: e.code });
      // Грешка в заявката не се поправя с повторение, освен при претоварване.
      if (!/^(http-429|http-5\d\d|timeout)$/.test(e.code || '')) break;
      continue;
    }
    var p = parseDecision(r.content, options);
    // Някои модели оставят отговора в полето за мислене.
    if (!p.choice && !r.content && r.reasoning) p = parseDecision(r.reasoning, options);
    attempts.push({ raw: r.content, reasoning: r.reasoning, parsed: p, usage: r.usage });
    if (p.choice) {
      return { model: cfg.model, choice: p.choice, reason: p.reason, how: p.how, ok: true,
        ms: Date.now() - t0, attempts: attempts };
    }
    messages = messages.concat(
      { role: 'assistant', content: r.content || '' },
      { role: 'user', content: 'That is not valid. Reply with JSON only: {"choice": one of ' +
        options.map(function (o) { return JSON.stringify(o.id); }).join(', ') + ', "reason": "..."}' }
    );
  }
  var last = attempts[attempts.length - 1] || {};
  return { model: cfg.model, choice: null, reason: '', ok: false, ms: Date.now() - t0,
    error: last.error || 'Моделът не избра разрешен отговор.', attempts: attempts };
}

/* ---------- Решение от един или няколко модела (гласуване) ---------- */

export async function decide(cfg) {
  var models = [].concat(cfg.models || cfg.model || []).filter(Boolean);
  if (!models.length) throw new HarnessError('no-model', 'Няма избран модел.');
  var options = toOptions(cfg.options);
  var t0 = Date.now();
  var votes = await Promise.all(models.map(function (model) {
    return decideOne(Object.assign({}, cfg, { model: model, options: options }))
      .catch(function (e) { return { model: model, choice: null, ok: false, error: e.message, attempts: [] }; });
  }));

  var tally = {};
  votes.forEach(function (v) { if (v.choice) tally[v.choice] = (tally[v.choice] || 0) + 1; });
  var best = null;
  // При равенство печели изборът на по-ранния модел в списъка.
  votes.forEach(function (v) {
    if (v.choice && (best === null || tally[v.choice] > tally[best])) best = v.choice;
  });

  var fallback = cfg.fallback ? matchOption(cfg.fallback, options) : null;
  var used = !best && !!fallback;
  var winner = votes.find(function (v) { return v.choice === best; });
  return {
    choice: best || fallback || null,
    reason: winner ? winner.reason : '',
    fallback: used,
    ok: !!best,
    votes: votes,
    tally: tally,
    agreement: best ? tally[best] / models.length : 0,
    ms: Date.now() - t0
  };
}

/* ---------- Списък с модели от доставчика ---------- */

export async function listModels(cfg) {
  var base = resolveBase(cfg);
  var headers = {};
  if (cfg.apiKey) headers.Authorization = 'Bearer ' + cfg.apiKey;
  var res = await fetch(base + '/models', { headers: headers });
  if (!res.ok) throw new HarnessError('http-' + res.status, 'HTTP ' + res.status);
  var data = await res.json();
  var arr = Array.isArray(data) ? data : (data.data || data.models || []);
  return arr.map(function (m) {
    var mods = m.architecture && m.architecture.input_modalities || [];
    return {
      id: m.id || m.name,
      vision: mods.indexOf('image') >= 0,
      free: /:free$/.test(m.id || '') || (m.pricing && Number(m.pricing.prompt) === 0 && Number(m.pricing.completion) === 0)
    };
  }).filter(function (m) { return m.id; }).sort(function (a, b) { return a.id.localeCompare(b.id); });
}

/* ---------- Готови задачи ---------- */

export const PRESETS = {
  cart: {
    bg: {
      name: 'Количка',
      task: 'Ти управляваш малка количка с колела. Реши какво да направи сега, за да се движи безопасно и да не се удари.',
      options: 'forward — продължи напред\nleft — завий наляво\nright — завий надясно\nstop — спри',
      input: 'Сензор отпред: 18 см. Сензор отляво: 90 см. Сензор отдясно: 25 см.',
      fallback: 'stop'
    },
    en: {
      name: 'Cart',
      task: 'You drive a small wheeled cart. Decide what it should do now to move safely and not hit anything.',
      options: 'forward — keep going forward\nleft — turn left\nright — turn right\nstop — stop',
      input: 'Front sensor: 18 cm. Left sensor: 90 cm. Right sensor: 25 cm.',
      fallback: 'stop'
    }
  },
  router: {
    bg: {
      name: 'Избор на модел',
      task: 'Избери кой езиков модел от списъка е най-подходящ за задачата във входа. Търси добро качество на ниска цена: не избирай голям модел за лесна задача.',
      options: 'meta-llama/llama-3.1-8b-instruct — малък и бърз, за прости кратки задачи\n' +
        'qwen/qwen3-32b — среден, добър за код и математика\n' +
        'meta-llama/llama-3.3-70b-instruct — голям, за дълги текстове и превод\n' +
        'qwen/qwen2.5-vl-72b-instruct — вижда картинки',
      input: 'Преведи на английски това писмо до родителите от 3 страници.',
      fallback: ''
    },
    en: {
      name: 'Pick a model',
      task: 'Choose which language model from the list fits the task in the input best. Aim for good quality at low cost: do not pick a big model for an easy task.',
      options: 'meta-llama/llama-3.1-8b-instruct — small and fast, for simple short tasks\n' +
        'qwen/qwen3-32b — medium, good at code and math\n' +
        'meta-llama/llama-3.3-70b-instruct — large, for long texts and translation\n' +
        'qwen/qwen2.5-vl-72b-instruct — can see images',
      input: 'Translate this 3-page letter to parents into Bulgarian.',
      fallback: ''
    }
  },
  yesno: {
    bg: {
      name: 'Да или не',
      task: 'Отговори дали твърдението във входа е вярно.',
      options: 'yes — да, вярно е\nno — не, не е вярно\nunsure — не мога да кажа',
      input: 'Водата кипи при 100 °C на морското равнище.',
      fallback: 'unsure'
    },
    en: {
      name: 'Yes or no',
      task: 'Say whether the statement in the input is true.',
      options: 'yes — yes, it is true\nno — no, it is false\nunsure — I cannot tell',
      input: 'Water boils at 100 °C at sea level.',
      fallback: 'unsure'
    }
  }
};
