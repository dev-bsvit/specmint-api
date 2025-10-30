# SpecMint API - Quick Start Guide

Быстрый старт для деплоя AI сервера за 10 минут.

## Prerequisites

- Node.js 18+ установлен
- Vercel аккаунт (бесплатный)
- Claude API key ИЛИ OpenAI API key

## Шаг 1: Получить API ключ (5 мин)

### Вариант A: Claude (рекомендуется)

1. Зарегистрируйтесь на [console.anthropic.com](https://console.anthropic.com)
2. Перейдите в "API Keys"
3. Нажмите "Create Key"
4. Скопируйте ключ (начинается с `sk-ant-`)
5. **Бесплатно:** $5 credits при регистрации

### Вариант B: OpenAI

1. Зарегистрируйтесь на [platform.openai.com](https://platform.openai.com)
2. Перейдите в "API keys"
3. Нажмите "Create new secret key"
4. Скопируйте ключ (начинается с `sk-`)
5. **Платно:** Нужна кредитная карта

## Шаг 2: Установить Vercel CLI (2 мин)

```bash
npm install -g vercel
```

## Шаг 3: Деплой (3 мин)

```bash
cd specmint-api

# Логин в Vercel
vercel login

# Первый деплой
vercel

# Следуйте инструкциям:
# ? Set up and deploy "~/specmint-api"? [Y/n] Y
# ? Which scope? [Your Name]
# ? Link to existing project? [y/N] N
# ? What's your project's name? specmint-api
# ? In which directory is your code located? ./

# Деплой на production
vercel --prod
```

**Результат:** Вы получите URL типа `https://specmint-api-xxx.vercel.app`

## Шаг 4: Настроить API ключ (2 мин)

### Через Web UI (проще)

1. Откройте [vercel.com/dashboard](https://vercel.com/dashboard)
2. Выберите проект `specmint-api`
3. Settings → Environment Variables
4. Add New:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-...` (ваш ключ)
   - **Environment:** Production
5. Save
6. Redeploy: Deployments → Latest → Redeploy

### Через CLI (быстрее)

```bash
vercel env add ANTHROPIC_API_KEY
# Вставьте ключ: sk-ant-...
# Select environment: Production

vercel --prod
```

## Шаг 5: Проверить работу (1 мин)

```bash
curl https://your-app.vercel.app/api/health
```

Ожидаемый результат:
```json
{
  "status": "ok",
  "providers": {
    "claude": "configured"
  }
}
```

✅ Если видите `"claude": "configured"` — всё работает!

## Шаг 6: Подключить к плагину (1 мин)

1. Откройте `plugin/ui.html`
2. Найдите строку 92:
   ```javascript
   const API_ENDPOINT = 'https://your-app.vercel.app/api/enhance';
   ```
3. Замените на ваш URL:
   ```javascript
   const API_ENDPOINT = 'https://specmint-api-xxx.vercel.app/api/enhance';
   ```
4. Сохраните
5. В Figma: Plugins → Development → Reload plugin

## Готово! 🎉

Теперь можно использовать:

1. Выберите Frame в Figma
2. Откройте плагин SpecMint
3. **Включите "Include screenshot"** ✅
4. Нажмите "Analyze"
5. Нажмите "✨ Enhance with AI"
6. Подождите 5-10 секунд
7. Получите улучшенную спецификацию!

## Troubleshooting

### "No AI provider configured"

Ключ не установлен или неправильный environment.

**Решение:**
```bash
# Проверить
vercel env ls

# Должен быть ANTHROPIC_API_KEY в Production

# Если нет - добавить
vercel env add ANTHROPIC_API_KEY
vercel --prod
```

### "CORS error"

API не возвращает CORS headers.

**Решение:**
Проверьте `api/enhance.js` строка 159:
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
```

### "Enhancement failed"

Неправильный API endpoint URL.

**Решение:**
Проверьте `plugin/ui.html` строка 92 — должен быть ваш Vercel URL.

## Команды

```bash
# Локальный запуск
npm run dev

# Production деплой
npm run deploy

# Посмотреть логи
vercel logs [deployment-url]

# Список environment variables
vercel env ls

# Удалить environment variable
vercel env rm ANTHROPIC_API_KEY
```

## Стоимость

### Vercel
- **Hobby plan:** Бесплатно
  - 100GB bandwidth
  - Serverless functions: 100 часов/месяц
  - **Достаточно для тестирования**

- **Pro plan:** $20/месяц
  - Unlimited bandwidth
  - More serverless hours

### Claude API
- **$5 бесплатных кредитов** при регистрации
- ~$0.10 per enhancement request
- **50 запросов бесплатно**, затем платно

### Итого для тестирования
- **$0** — Vercel Hobby + Claude бесплатные кредиты
- Достаточно для 50 тестовых enhancement запросов

## Next Steps

- Прочитайте полную документацию: [`README.md`](README.md)
- Интеграция с плагином: [`../plugin/INTEGRATION.md`](../plugin/INTEGRATION.md)
- Примеры использования: [`EXAMPLES.md`](EXAMPLES.md) (coming soon)

---

Готово за 10 минут! Наслаждайтесь AI-powered дизайн-спецификациями! 🚀
