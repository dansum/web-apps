# Решаващ модел (llm-harness)

Отворена страница: <https://dansum.github.io/web-apps/llm-harness/>

## Ядрото `harness.js`

Няма зависимости. Работи в браузъра и в Node 18+.

```js
import { decide } from './harness.js';

const r = await decide({
  provider: 'openrouter',            // openrouter | huggingface | groq | together | ollama | lmstudio | custom
  apiKey: process.env.OPENROUTER_API_KEY,
  models: ['openai/gpt-oss-20b', 'meta-llama/llama-3.3-70b-instruct'],  // няколко = гласуване
  task: 'Ти управляваш количка. Реши какво да направи сега.',
  options: ['forward', 'left', 'right', 'stop'],   // или 'forward — напред\nleft — наляво'
  input: 'Отпред: 18 см. Отляво: 90 см. Отдясно: 25 см.',
  image: null,                       // data:image/jpeg;base64,… за модели, които виждат
  fallback: 'stop'                   // ако никой модел не даде ясен отговор
});

r.choice     // 'left'
r.reason     // 'Отляво има най-много място.'
r.votes      // решението на всеки модел
r.agreement  // 0..1 – колко от моделите са съгласни
r.fallback   // true, ако е ползван резервният отговор
```

Други настройки: `baseUrl`, `temperature` (0), `maxTokens` (512), `retries` (2),
`timeoutMs` (60000), `jsonMode` (false).

## Как разбира отговора

1. Маха `<think>…</think>` и ```` ``` ````.
2. Търси JSON с поле `choice` (или `decision`, `answer`, `action`, `model`).
3. Ако няма JSON – целият отговор или точно една разрешена дума в текста.
4. Ако пак няма ясен отговор – пита модела отново с обяснение какво се иска.

## Доставчици и CORS

OpenRouter, Hugging Face (`router.huggingface.co`), Groq и Together приемат заявки
направо от браузъра. Ollama иска `OLLAMA_ORIGINS=*`. В LM Studio включи CORS.
