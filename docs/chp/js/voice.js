// Четене на текста на глас (Web Speech API). Включва се от бутона „Глас“ в горната лента.
// Когато е включено, новият текст в сцените, задачите и въпросите се чете сам;
// щракване върху балонче или задача го прочита отново.

const KEY = 'chp-voice';
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let on = false;
try { on = localStorage.getItem(KEY) === '1'; } catch (e) { /* няма значение */ }
let lastAt = 0;
let lastText = '';
const listeners = new Set();

export const supported = () => !!synth && typeof SpeechSynthesisUtterance !== 'undefined';
export const isOn = () => on && supported();
export function onToggle(fn) { listeners.add(fn); }

export function setOn(v) {
  on = !!v;
  try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { /* няма значение */ }
  if (!on && synth) synth.cancel();
  for (const fn of listeners) fn(on);
}

// Най-добрият наличен български глас (естествените гласове звучат по-добре).
export function bgVoice() {
  if (!supported()) return null;
  const all = synth.getVoices().filter((v) => /^bg/i.test(v.lang));
  return all.find((v) => /natural|online|google/i.test(v.name)) || all[0] || null;
}

// Емоджита и стрелки не се четат; остава само текстът.
function clean(text) {
  return String(text || '')
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '')
    .replace(/[→←↑↓⬆⬇✔✘✓✗•·|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Текст, който се появява заедно (задача + балонче), се чете поред;
// нов текст след действие на детето прекъсва стария.
export function speak(text, { force = false } = {}) {
  if (!(force ? supported() : isOn())) return;
  const t = clean(text);
  if (!t) return;
  const now = Date.now();
  if (now - lastAt > 400) { synth.cancel(); lastText = ''; }
  // Едно и също изречение в съобщението и в балончето се чете веднъж.
  else if (lastText.includes(t)) return;
  lastAt = now;
  lastText += ' ' + t;
  const u = new SpeechSynthesisUtterance(t);
  u.lang = 'bg-BG';
  const v = bgVoice();
  if (v) u.voice = v;
  u.rate = 0.95;
  synth.speak(u);
}

export function speakEl(el) {
  if (el) speak(el.innerText || el.textContent);
}

export function stop() { if (synth) synth.cancel(); }

// Щракване върху балонче, задача или въпрос го прочита отново (без бутоните в тях).
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    if (!isOn()) return;
    if (e.target.closest('button, a, input, label, select, .choices, .order')) return;
    const el = e.target.closest('.bubble, .xp-task, .xp-msg, .q-text, .q-feedback, .article-step');
    if (el) { lastAt = 0; speakEl(el); }
  });
  if (synth) window.addEventListener('pagehide', () => synth.cancel());
}
