# SpecMint API Server

Serverless API на Vercel для улучшения дизайн-спецификаций через AI (Claude/GPT-4 Vision).

## Архитектура

```
Figma Plugin (client)
    ↓
    POST /api/enhance
    {
      specMd: "...",
      specJson: "...",
      screenshot: "base64..."
    }
    ↓
Vercel Serverless Function
    ↓
AI Provider (Claude 3.5 Sonnet / GPT-4 Vision)
    ↓
Enhanced Specification
    ↓
Return to Plugin
```

## API Endpoints

### `POST /api/enhance`

Улучшает дизайн-спецификацию через AI.

**Request:**
```json
{
  "specMd": "# Spec\n...",
  "specJson": "{...}",
  "screenshot": "base64-png-data",
  "provider": "claude" // or "openai"
}
```

**Response:**
```json
{
  "success": true,
  "enhanced": "# Enhanced Design Specification\n...",
  "model": "claude-3.5-sonnet",
  "tokensUsed": 1234
}
```

**Errors:**
- `400` - Missing required fields
- `500` - AI provider error
- `503` - No AI provider configured

### `GET /api/health`

Проверка состояния сервера.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-30T12:00:00.000Z",
  "providers": {
    "claude": "configured",
    "openai": "not configured"
  },
  "version": "1.0.0"
}
```

## Установка и запуск

### 1. Установить зависимости

```bash
cd specmint-api
npm install
```

### 2. Создать `.env.local` файл

```bash
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

**Примечание:** Достаточно одного ключа (Claude ИЛИ OpenAI).

### 3. Локальный запуск

```bash
npm run dev
```

Сервер запустится на `http://localhost:3000`

Тест:
```bash
curl http://localhost:3000/api/health
```

### 4. Деплой на Vercel

```bash
# Установить Vercel CLI (если ещё не установлен)
npm i -g vercel

# Логин
vercel login

# Первый деплой
vercel

# Production деплой
npm run deploy
```

### 5. Настройка environment variables в Vercel

После деплоя:

1. Откройте [vercel.com](https://vercel.com) → ваш проект
2. Settings → Environment Variables
3. Добавьте:
   - `ANTHROPIC_API_KEY` = `sk-ant-...`
   - `OPENAI_API_KEY` = `sk-...` (опционально)
4. Выберите Environment: Production, Preview, Development
5. Сохраните и redeploy

## Получение API ключей

### Claude (Anthropic)

1. Зарегистрируйтесь на [console.anthropic.com](https://console.anthropic.com)
2. Создайте API key в разделе "API Keys"
3. Скопируйте ключ (начинается с `sk-ant-`)
4. **Стоимость:** ~$3 per 1M input tokens, ~$15 per 1M output tokens
5. **Бесплатный лимит:** $5 credits при регистрации

**Рекомендуется:** Claude 3.5 Sonnet — лучшая модель для анализа дизайна

### OpenAI (GPT-4 Vision)

1. Зарегистрируйтесь на [platform.openai.com](https://platform.openai.com)
2. Создайте API key в разделе "API keys"
3. Скопируйте ключ (начинается с `sk-`)
4. **Стоимость:** ~$10 per 1M input tokens, ~$30 per 1M output tokens
5. **Бесплатный лимит:** нет (нужно добавить платёжный метод)

## Тестирование

### Тест с curl

```bash
curl -X POST http://localhost:3000/api/enhance \
  -H "Content-Type: application/json" \
  -d '{
    "specMd": "# Spec\n\n## Frame\n- name: Button\n- size: 200x50px",
    "screenshot": "iVBORw0KGgoAAAANSUhEUgA...",
    "provider": "claude"
  }'
```

### Тест с Node.js

```javascript
const fetch = require('node-fetch');

async function testEnhance() {
  const response = await fetch('http://localhost:3000/api/enhance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      specMd: '# Spec\n\n## Frame\n- name: Button',
      screenshot: 'base64data...',
      provider: 'claude'
    })
  });

  const result = await response.json();
  console.log(result.enhanced);
}

testEnhance();
```

## Интеграция с Figma плагином

См. документацию в `/plugin/INTEGRATION.md`

Основной flow:
1. Пользователь нажимает "Enhance with AI" в плагине
2. Плагин отправляет POST запрос на `https://your-app.vercel.app/api/enhance`
3. Сервер обрабатывает через AI
4. Результат возвращается в плагин
5. Пользователь копирует улучшенную спецификацию

## Лимиты и оптимизация

### Размер запроса
- Max POST body: **4.5MB** (Vercel limit)
- Max screenshot size: **20MB base64** (~15MB PNG)

Если скриншот слишком большой:
- Уменьшите разрешение в Figma export
- Используйте JPEG вместо PNG
- Или разделите на несколько запросов

### Timeout
- Vercel serverless functions: **10 секунд** (Hobby plan)
- Vercel Pro: **60 секунд**

Типичное время обработки:
- Claude: 3-8 секунд
- GPT-4 Vision: 5-12 секунд

### Rate limiting

Рекомендуется добавить rate limiting:
```bash
npm install @upstash/ratelimit @upstash/redis
```

См. пример в `/examples/rate-limit.js`

## Безопасность

### API ключи
- ✅ Храните в environment variables (не в коде!)
- ✅ Используйте Vercel secrets: `vercel env add ANTHROPIC_API_KEY`
- ❌ Никогда не коммитьте `.env` файлы

### CORS
- Текущая конфигурация: `Access-Control-Allow-Origin: *`
- Для production: ограничьте до `https://figma.com`

```javascript
res.setHeader('Access-Control-Allow-Origin', 'https://figma.com');
```

### Authentication
Для публичного API рекомендуется добавить:
- API keys для плагина
- Rate limiting по IP
- Request validation

## Мониторинг

### Vercel Dashboard
- [vercel.com/dashboard](https://vercel.com/dashboard) → ваш проект → Analytics
- Смотрите: Requests, Errors, Duration, Bandwidth

### Логи
```bash
vercel logs [deployment-url]
```

### Alerts
Настройте уведомления в Vercel:
- Settings → Notifications → Error alerts

## Troubleshooting

### Ошибка: "No AI provider configured"
- Проверьте что `ANTHROPIC_API_KEY` или `OPENAI_API_KEY` установлены
- В Vercel: Settings → Environment Variables
- Проверьте environment (Production/Preview/Development)

### Ошибка: "Screenshot too large"
- Уменьшите разрешение экспорта в Figma
- Используйте сжатие изображений
- Проверьте что base64 < 20MB

### Timeout errors
- Claude/OpenAI API могут быть медленными
- Увеличьте Vercel timeout (Pro plan)
- Или оптимизируйте промпт (меньше токенов)

### CORS errors
- Проверьте что сервер возвращает правильные CORS headers
- В production используйте правильный origin

## Roadmap

- [ ] Добавить кэширование (Redis/Upstash)
- [ ] Batch processing для нескольких фреймов
- [ ] Webhook для async processing
- [ ] Streaming responses (SSE)
- [ ] Fine-tuned промпты для разных типов UI
- [ ] A/B testing промптов

## License

MIT License

---

**SpecMint API** — Design to Code AI
